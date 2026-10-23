from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Fact, Rule, Draft, Version, Finding, Decision
from .serializers import FactSerializer, RuleSerializer, DraftSerializer
from .engine import inspect


def accessible_drafts(user):
    """Staff can review all drafts; other users see only their own."""
    queryset = Draft.objects.all()
    if user.is_staff:
        return queryset
    return queryset.filter(author=user)


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
    facts = Fact.objects.filter(status="approved")
    rules = Rule.objects.all()
    return Response({"facts": FactSerializer(facts, many=True).data, "rules": RuleSerializer(rules, many=True).data})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def drafts(request):
    if request.method == "GET":
        queryset = accessible_drafts(request.user).order_by("-created_at")
        return Response(DraftSerializer(queryset, many=True).data)

    title = str(request.data.get("title", "")).strip()[:200]
    content = str(request.data.get("content", "")).strip()
    if not title or not content or len(content) > 20000:
        return Response({"error": "Title and content (max 20,000 characters) required"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        draft = Draft.objects.create(title=title, content=content, author=request.user)
        version = Version.objects.create(draft=draft, content=content, version=1, editor=request.user)
        for finding in inspect(content):
            Finding.objects.create(draft=draft, version=version, **finding)

    return Response(DraftSerializer(draft).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def draft_detail(request, pk):
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
    if request.method == "GET":
        return Response(DraftSerializer(draft).data)

    if draft.author_id != request.user.id and not request.user.is_staff:
        return Response({"error": "Only the author or staff can delete this draft."}, status=status.HTTP_403_FORBIDDEN)
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
    if draft.author_id != request.user.id and not request.user.is_staff:
        return Response({"error": "Only author or staff can revise"}, status=status.HTTP_403_FORBIDDEN)
    content = str(request.data.get("content", "")).strip()
    if not content or len(content) > 20000:
        return Response({"error": "Content required (max 20,000 characters)"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        version_number = draft.versions.count() + 1
        version = Version.objects.create(draft=draft, content=content, version=version_number, editor=request.user)
        draft.content = content
        draft.status = "in_review"
        draft.save(update_fields=["content", "status", "updated_at"])
        draft.findings.filter(state="open").update(state="obsolete")
        for finding in inspect(content):
            Finding.objects.create(draft=draft, version=version, **finding)
        Decision.objects.create(draft=draft, actor=request.user, action="revised", comment=f"Created version {version_number}")
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
    comment = str(request.data.get("comment", ""))[:1000]
    with transaction.atomic():
        finding.state = action
        finding.save(update_fields=["state"])
        Decision.objects.create(draft=draft, finding=finding, actor=request.user, action=action, comment=comment)
    return Response(DraftSerializer(draft).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve(request, pk):
    if not request.user.is_staff:
        return Response({"error": "Reviewer permission required"}, status=status.HTTP_403_FORBIDDEN)
    draft = get_object_or_404(accessible_drafts(request.user), pk=pk)
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
