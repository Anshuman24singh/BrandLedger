from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction, models
from django.db.models import Q
from django.shortcuts import get_object_or_404
import difflib

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Brand, Fact, Rule, Draft, Version, Finding, Decision
from .serializers import BrandSerializer, FactSerializer, RuleSerializer, DraftSerializer
from .engine import AIReviewError, deterministic_inspect, inspect


def accessible_drafts(user):
    """Client Reviewers see all drafts; Creators see their own and client-submitted drafts."""
    queryset = Draft.objects.all()
    if user.is_staff:
        return queryset
    # Creators need access to drafts submitted by client Reviewer accounts, but not other creators' private drafts.
    return queryset.filter(Q(author=user) | Q(author__is_staff=True)).distinct()


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(
        username=request.data.get("username"),
        password=request.data.get("password"),
    )
    if not user:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username, "is_staff": user.is_staff})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    request.auth.delete()
    return Response({"message": "Logged out successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def knowledge(request):
    # Only return the selected brand's knowledge. Legacy unassigned records are
    # returned when no brand is selected to preserve compatibility during setup.
    brand_id = request.query_params.get("brand_id")
    if brand_id:
        brand = get_object_or_404(Brand, pk=brand_id)
        if not request.user.is_staff and not (brand.created_by.is_staff or brand.members.filter(pk=request.user.pk).exists()):
            return Response({"error": "You do not have access to this brand."}, status=status.HTTP_403_FORBIDDEN)
    facts = Fact.objects.filter(brand_id=brand_id) if brand_id else Fact.objects.filter(brand__isnull=True)
    rules = Rule.objects.filter(brand_id=brand_id) if brand_id else Rule.objects.filter(brand__isnull=True)
    facts = facts.order_by("key")
    rules = rules.order_by("code")
    return Response({
        "facts": FactSerializer(facts, many=True).data,
        "rules": RuleSerializer(rules, many=True).data,
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def drafts(request):
    if request.method == "GET":
        queryset = accessible_drafts(request.user).order_by("-created_at")
        return Response(DraftSerializer(queryset, many=True).data)

    title = str(request.data.get("title", "")).strip()[:200]
    content = str(request.data.get("content", "")).strip()
    brand_id = request.data.get("brand")
    brand = get_object_or_404(Brand, pk=brand_id) if brand_id else None
    if brand and not request.user.is_staff and not (brand.created_by.is_staff or brand.created_by_id == request.user.id or brand.members.filter(pk=request.user.pk).exists()):
        return Response({"error": "You do not have access to this brand."}, status=status.HTTP_403_FORBIDDEN)
    if not title or not content or len(content) > 20000:
        return Response({"error": "Title and content (max 20,000 characters) required"}, status=status.HTTP_400_BAD_REQUEST)

    ai_review_complete = True
    try:
        findings = inspect(content, brand.id if brand else None)
    except AIReviewError:
        # Preserve deterministic rule/fact checks and save the creator's work.
        # Approval remains blocked until a successful AI-reviewed revision.
        findings = deterministic_inspect(content)
        ai_review_complete = False

    with transaction.atomic():
        draft = Draft.objects.create(
            title=title,
            content=content,
            author=request.user,
            brand=brand,
            ai_review_complete=ai_review_complete,
        )
        version = Version.objects.create(draft=draft, content=content, version=1, editor=request.user)
        for finding in findings:
            Finding.objects.create(draft=draft, version=version, **finding)

    return Response(DraftSerializer(draft).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def draft_detail(request, pk):
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    if request.method == "GET":
        return Response(DraftSerializer(draft).data)

    # Staff may review every draft, but editing/deleting is an author action.
    # Enforce this here rather than relying on the frontend's read-only UI.
    if draft.author_id != request.user.id:
        return Response({"error": "Only the draft author can delete this draft."}, status=status.HTTP_403_FORBIDDEN)
    if draft.status == "approved":
        return Response({"error": "Approved drafts are protected to preserve compliance history. Archive support can be added separately."}, status=status.HTTP_400_BAD_REQUEST)

    title = draft.title
    with transaction.atomic():
        draft.delete()
    return Response({"message": f'Draft "{title}" and its associated versions, findings, and decisions were deleted.'}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revise(request, pk):
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    # Reviewers can make review decisions, but cannot edit another user's draft.
    if draft.author_id != request.user.id:
        return Response({"error": "Only the draft author can revise this draft."}, status=status.HTTP_403_FORBIDDEN)
    if draft.status == "approved":
        return Response(
            {"error": "Approved drafts are immutable. Create a new draft to make further changes."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    content = str(request.data.get("content", "")).strip()
    if not content or len(content) > 20000:
        return Response({"error": "Content required (max 20,000 characters)"}, status=status.HTTP_400_BAD_REQUEST)

    ai_review_complete = True
    try:
        findings = inspect(content, draft.brand_id)
    except AIReviewError:
        # Save the requested revision, but mark the review as incomplete.
        findings = deterministic_inspect(content)
        ai_review_complete = False

    with transaction.atomic():
        version_number = draft.versions.count() + 1
        version = Version.objects.create(draft=draft, content=content, version=version_number, editor=request.user)
        draft.content = content
        draft.status = "in_review"
        draft.ai_review_complete = ai_review_complete
        draft.save(update_fields=["content", "status", "ai_review_complete", "updated_at"])
        # Every finding from the previous version is historical now. Keep the
        # reviewer decision in Decision, and do not show old findings as current.
        draft.findings.exclude(state="obsolete").update(state="obsolete")
        for finding in findings:
            Finding.objects.create(draft=draft, version=version, **finding)
        Decision.objects.create(draft=draft, actor=request.user, action="revised", comment=f"Created version {version_number}")
    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_completed_review(request, pk):
    """Creator marks corrected content as ready for the client Reviewer to inspect."""
    if request.user.is_staff:
        return Response({"error": "Only Creator accounts can submit completed work to the client."}, status=status.HTTP_403_FORBIDDEN)

    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    if draft.status == "approved":
        return Response({"error": "This draft is already approved."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        draft.status = "ready_for_client_review"
        draft.save(update_fields=["status", "updated_at"])
        Decision.objects.create(
            draft=draft,
            actor=request.user,
            action="sent_to_client",
            comment=str(request.data.get("comment", "Completed corrections submitted for client review."))[:1000],
        )
    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def retry_ai_review(request, pk):
    """Retry AI review without changing the draft content."""
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)

    if draft.author_id != request.user.id and not request.user.is_staff:
        return Response(
            {"error": "Only the draft author or a reviewer can retry its AI review."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if draft.status == "approved":
        return Response(
            {"error": "Approved drafts are immutable."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    current_version = draft.versions.order_by("-version").first()
    if current_version is None:
        return Response(
            {"error": "This draft has no version to review."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Leave the existing draft untouched if AI review fails.
    try:
        findings = inspect(draft.content, draft.brand_id)
    except AIReviewError:
        return Response(
            {"error": "AI review is still unavailable. No draft data was changed."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    with transaction.atomic():
        # Preserve old findings and decisions as audit history.
        draft.findings.exclude(state="obsolete").update(state="obsolete")

        for finding in findings:
            Finding.objects.create(
                draft=draft,
                version=current_version,
                **finding,
            )

        draft.ai_review_complete = True
        draft.save(update_fields=["ai_review_complete", "updated_at"])

        Decision.objects.create(
            draft=draft,
            actor=request.user,
            action="ai_review_retried",
            comment=f"AI review completed for version {current_version.version}.",
        )

    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decide(request, pk, finding_id):
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required"}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    finding = get_object_or_404(Finding, pk=finding_id, draft=draft)
    if finding.state != "open":
        return Response({"error": "Finding is no longer open"}, status=status.HTTP_400_BAD_REQUEST)
    action = request.data.get("action")
    if action not in ["acknowledged", "dismissed"]:
        return Response({"error": "Choose acknowledged or dismissed"}, status=status.HTTP_400_BAD_REQUEST)
    comment = str(request.data.get("comment", "")).strip()[:1000]
    if action == "dismissed" and not comment:
        return Response(
            {"error": "Add a short reviewer reason before dismissing a finding."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    with transaction.atomic():
        finding.state = action
        finding.save(update_fields=["state"])
        Decision.objects.create(draft=draft, finding=finding, actor=request.user, action=action, comment=comment)
    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def draft_decide(request, pk):
    """Persist a reviewer-level request-changes or rejection decision."""
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required"}, status=status.HTTP_403_FORBIDDEN)

    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    if draft.status == "approved":
        return Response(
            {"error": "Approved drafts are immutable. Create a new draft for further review."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    action = request.data.get("action")
    if action not in ["rejected", "changes_requested"]:
        return Response(
            {"error": "Choose rejected or changes_requested"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    comment = str(request.data.get("comment", "")).strip()[:1000]
    if not comment:
        return Response(
            {"error": "A reviewer comment is required for this decision."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        draft.status = action
        draft.save(update_fields=["status", "updated_at"])
        Decision.objects.create(
            draft=draft,
            actor=request.user,
            action=action,
            comment=comment,
        )

    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required"}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    if draft.status == "approved":
        return Response({"error": "This draft has already been approved and is immutable."}, status=status.HTTP_400_BAD_REQUEST)
    if not draft.ai_review_complete:
        return Response(
            {"error": "AI review is incomplete because the AI service was unavailable. Revise the draft after service recovery before approval."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    unresolved_states = ["open", "acknowledged"]
    if draft.findings.filter(state__in=unresolved_states).exists():
        return Response({"error": "Resolve all open or acknowledged findings before approval. Revise the draft or dismiss the finding with a documented reason."}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        draft.status = "approved"
        draft.save(update_fields=["status", "updated_at"])
        Decision.objects.create(draft=draft, actor=request.user, action="approved", comment=str(request.data.get("comment", ""))[:1000])
    return Response(DraftSerializer(draft).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def brands(request):
    if request.method == "GET":
        queryset = Brand.objects.all() if request.user.is_staff else Brand.objects.filter(models.Q(created_by__is_staff=True) | models.Q(created_by=request.user) | models.Q(members=request.user)).distinct()
        return Response(BrandSerializer(queryset, many=True).data)
    if not request.user.is_staff:
        return Response({"error": "Only reviewer/brand-owner accounts can add brands."}, status=status.HTTP_403_FORBIDDEN)
    name = str(request.data.get("name", "")).strip()[:120]
    if not name:
        return Response({"error": "Brand name is required."}, status=status.HTTP_400_BAD_REQUEST)
    if Brand.objects.filter(name__iexact=name, created_by=request.user).exists():
        return Response({"error": "You already own a brand with this name."}, status=status.HTTP_400_BAD_REQUEST)
    brand = Brand.objects.create(name=name, created_by=request.user)
    # The reviewer owns the brand; creator accounts are workers allowed to
    # prepare drafts for reviewer-owned brands. Reviewers retain ownership.
    brand.members.add(request.user)
    brand.members.add(*list(User.objects.filter(is_staff=False)))
    return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def brand_detail(request, pk):
    brand = get_object_or_404(Brand, pk=pk)
    if not request.user.is_staff or brand.created_by_id != request.user.id:
        return Response({"error": "Only the reviewer who owns this brand can modify or delete it."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "DELETE":
        brand.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    name = str(request.data.get("name", "")).strip()[:120]
    if not name:
        return Response({"error": "Brand name is required."}, status=status.HTTP_400_BAD_REQUEST)
    brand.name = name
    brand.save(update_fields=["name"])
    return Response(BrandSerializer(brand).data)

@api_view(["POST", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def guideline_collection(request, pk=None):
    if request.method == "POST":
        brand_id = request.data.get("brand")
        brand = get_object_or_404(Brand, pk=brand_id) if brand_id else None
        if not brand:
            return Response({"error": "Select a brand first."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.is_staff or brand.created_by_id != request.user.id:
            return Response({"error": "Only the owning reviewer can add guidelines to this brand."}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        code = str(data.get("code", "")).strip()[:40]
        phrase = str(data.get("phrase", "")).strip()[:200]
        explanation = str(data.get("explanation", "")).strip()
        if not code or not phrase or not explanation:
            return Response({"error": "Code, prohibited phrase, and explanation are required."}, status=status.HTTP_400_BAD_REQUEST)
        if Rule.objects.filter(brand=brand, code=code).exists():
            return Response({"error": "A guideline with this code already exists for this brand."}, status=status.HTTP_400_BAD_REQUEST)
        rule = Rule.objects.create(brand=brand, code=code, phrase=phrase, replacement=str(data.get("replacement", ""))[:200], explanation=explanation, source=str(data.get("source", "Brand style guide"))[:250])
        return Response(RuleSerializer(rule).data, status=status.HTTP_201_CREATED)
    rule = get_object_or_404(Rule.objects.select_related("brand"), pk=pk)
    if not request.user.is_staff or not rule.brand or rule.brand.created_by_id != request.user.id:
        return Response({"error": "Only the owning reviewer can modify or delete guidelines."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "DELETE":
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    for field, max_len in (("code",40),("phrase",200),("replacement",200),("source",250)):
        if field in request.data: setattr(rule, field, str(request.data[field]).strip()[:max_len])
    if "explanation" in request.data: rule.explanation = str(request.data["explanation"]).strip()
    rule.save()
    return Response(RuleSerializer(rule).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_reviewer_review(request, pk):
    """Run a read-only brand review for the reviewer without editing the draft."""
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required."}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    try:
        findings = inspect(draft.content, draft.brand_id)
    except AIReviewError:
        return Response({"error": "AI review is unavailable. The draft was not changed."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"draft_id": draft.id, "findings": findings, "content": draft.content, "read_only": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def draft_changes(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required."}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    # Compare creator-authored versions only; reviewer-applied versions must not
    # be mistaken for new creator changes on the next audit visit.
    versions = list(draft.versions.filter(editor_id=draft.author_id).order_by("version"))
    if len(versions) < 2:
        return Response({"draft_id": draft.id, "changes": [], "message": "A previous creator submission is not available yet."})
    old_lines = versions[-2].content.splitlines(keepends=True)
    new_lines = versions[-1].content.splitlines(keepends=True)
    changes = []
    latest_version = versions[-1]
    related_findings = list(draft.findings.filter(version=latest_version).exclude(state="obsolete"))
    for i, (tag, i1, i2, j1, j2) in enumerate(difflib.SequenceMatcher(a=old_lines, b=new_lines).get_opcodes()):
        if tag != "equal":
            before = "".join(old_lines[i1:i2])
            after = "".join(new_lines[j1:j2])
            related = []
            for finding in related_findings:
                excerpt = (finding.excerpt or "").strip()
                if excerpt and (excerpt in before or excerpt in after or before.strip() in excerpt or after.strip() in excerpt):
                    related.append({"id": finding.id, "kind": finding.kind, "excerpt": finding.excerpt, "reason": finding.reason, "suggestion": finding.suggestion, "source": finding.source, "state": finding.state})
            changes.append({"index": len(changes), "kind": tag, "before": before, "after": after, "from_line": i1 + 1, "to_line": j1 + 1, "related_findings": related})
    return Response({"draft_id": draft.id, "from_version": versions[-2].version, "to_version": versions[-1].version, "previous_content": versions[-2].content, "current_content": versions[-1].content, "changes": changes})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_draft_changes(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required."}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    versions = list(draft.versions.filter(editor_id=draft.author_id).order_by("version"))
    if len(versions) < 2:
        return Response({"error": "There is no previous creator submission to compare."}, status=status.HTTP_400_BAD_REQUEST)
    old_lines = versions[-2].content.splitlines(keepends=True)
    new_lines = versions[-1].content.splitlines(keepends=True)
    opcodes = list(difflib.SequenceMatcher(a=old_lines, b=new_lines).get_opcodes())
    changed = [op for op in opcodes if op[0] != "equal"]
    included = request.data.get("include", list(range(len(changed))))
    if not isinstance(included, list) or any(not isinstance(i, int) for i in included):
        return Response({"error": "include must be a list of change indexes."}, status=status.HTTP_400_BAD_REQUEST)
    if any(i < 0 or i >= len(changed) for i in included):
        return Response({"error": "One or more selected change indexes are invalid."}, status=status.HTTP_400_BAD_REQUEST)
    selected = set(included)
    result = []
    change_index = 0
    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal": result.extend(old_lines[i1:i2])
        else:
            if change_index in selected: result.extend(new_lines[j1:j2])
            else: result.extend(old_lines[i1:i2])
            change_index += 1
    content = "".join(result).strip()
    if not content:
        return Response({"error": "Selected changes would produce an empty draft."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        findings = inspect(content, draft.brand_id)
    except AIReviewError:
        return Response({"error": "AI review is unavailable; no changes were applied."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    with transaction.atomic():
        version = Version.objects.create(draft=draft, content=content, version=draft.versions.count()+1, editor=request.user)
        draft.content = content
        draft.status = "in_review"
        draft.save(update_fields=["content", "status", "updated_at"])
        draft.findings.exclude(state="obsolete").update(state="obsolete")
        for finding in findings: Finding.objects.create(draft=draft, version=version, **finding)
        Decision.objects.create(draft=draft, actor=request.user, action="changes_applied", comment=f"Reviewer applied {len(selected)} selected creator change(s) from version {versions[-1].version}.")
    return Response(DraftSerializer(draft).data)
