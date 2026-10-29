import json
import os
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Fact, Rule, Draft, Version, Finding, Decision
from .engine import deterministic_inspect


class WorkflowTests(TestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            "creator",
            password="test123",
        )
        self.reviewer = User.objects.create_user(
            "reviewer",
            password="test123",
            is_staff=True,
        )
        self.other_creator = User.objects.create_user(
            "other_creator",
            password="test123",
        )

        Fact.objects.create(
            key="savings rate",
            value="6.5%",
            source="F-014",
        )
        Rule.objects.create(
            code="R-12",
            phrase="guaranteed",
            explanation="Not permitted",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.creator)

        # Workflow tests should not depend on a live Groq API key or network.
        # Keep deterministic rule/fact checks active while isolating AI behavior.
        self.ai_inspect_patcher = patch(
            "core.views.inspect",
            side_effect=lambda content, brand_id=None: deterministic_inspect(content),
        )
        self.ai_inspect_patcher.start()
        self.addCleanup(self.ai_inspect_patcher.stop)

    def create_draft(self, content):
        response = self.client.post(
            "/api/drafts/",
            {"title": "Test Ad", "content": content},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return response.json()

    def decide_finding(self, draft_id, finding_id, action, comment=None):
        self.client.force_authenticate(user=self.reviewer)
        return self.client.post(
            f"/api/drafts/{draft_id}/findings/{finding_id}/decide/",
            {
                "action": action,
                "comment": comment or f"Regression test: {action}",
            },
            format="json",
        )

    def approve_draft(self, draft_id):
        self.client.force_authenticate(user=self.reviewer)
        return self.client.post(
            f"/api/drafts/{draft_id}/approve/",
            {"comment": "Regression test approval"},
            format="json",
        )

    # Approval workflow tests

    def test_open_findings_block_approval(self):
        draft = self.create_draft("Returns guaranteed.")
        self.assertEqual(len(draft["findings"]), 1)

        response = self.approve_draft(draft["id"])
        self.assertEqual(response.status_code, 400)

    def test_acknowledged_findings_block_approval(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]

        decision = self.decide_finding(
            draft["id"], finding["id"], "acknowledged"
        )
        self.assertEqual(decision.status_code, 200)

        response = self.approve_draft(draft["id"])
        self.assertEqual(response.status_code, 400)

    def test_dismissed_findings_allow_approval(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]

        decision = self.decide_finding(
            draft["id"], finding["id"], "dismissed"
        )
        self.assertEqual(decision.status_code, 200)

        response = self.approve_draft(draft["id"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "approved")

    def test_no_findings_allow_approval(self):
        draft = self.create_draft("Our product may help users.")
        self.assertEqual(len(draft["findings"]), 0)

        response = self.approve_draft(draft["id"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "approved")

    def test_incomplete_ai_review_blocks_approval(self):
        draft_data = self.create_draft("A simple product announcement.")
        draft = Draft.objects.get(pk=draft_data["id"])
        draft.ai_review_complete = False
        draft.save(update_fields=["ai_review_complete"])

        response = self.approve_draft(draft.id)

        self.assertEqual(response.status_code, 400)
        self.assertIn("AI review is incomplete", response.json()["error"])

    def test_review_and_approval(self):
        draft = self.create_draft(
            "Our savings rate is 7%. Returns guaranteed."
        )
        self.assertEqual(len(draft["findings"]), 2)

        self.client.force_authenticate(user=self.reviewer)

        for finding in draft["findings"]:
            response = self.client.post(
                f"/api/drafts/{draft['id']}/findings/"
                f"{finding['id']}/decide/",
                {"action": "acknowledged"},
                format="json",
            )
            self.assertEqual(response.status_code, 200)

        response = self.client.post(
            f"/api/drafts/{draft['id']}/approve/",
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    # Revision history tests

    def test_revise_creates_new_version(self):
        draft = self.create_draft("savings rate is 7%")

        response = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "savings rate is 6.5%"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["versions"]), 2)
        self.assertFalse(
            any(
                finding["state"] == "open"
                for finding in response.json()["findings"]
            )
        )

    # Permission and deletion tests

    def test_non_staff_cannot_approve(self):
        draft = self.create_draft("A simple product announcement.")

        response = self.client.post(
            f"/api/drafts/{draft['id']}/approve/",
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_non_staff_cannot_review_findings(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]

        response = self.client.post(
            f"/api/drafts/{draft['id']}/findings/"
            f"{finding['id']}/decide/",
            {"action": "dismissed"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_creator_can_delete_own_unapproved_draft(self):
        draft = self.create_draft("A simple product announcement.")

        response = self.client.delete(
            f"/api/drafts/{draft['id']}/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Draft.objects.filter(pk=draft["id"]).exists()
        )

    def test_approved_draft_cannot_be_deleted(self):
        draft = self.create_draft("A simple product announcement.")
        approval = self.approve_draft(draft["id"])
        self.assertEqual(approval.status_code, 200)

        response = self.client.delete(
            f"/api/drafts/{draft['id']}/"
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            Draft.objects.filter(pk=draft["id"]).exists()
        )

    def test_creator_can_access_client_submitted_draft_and_send_it_back(self):
        self.client.force_authenticate(user=self.reviewer)
        client_draft_response = self.client.post(
            "/api/drafts/",
            {"title": "Client campaign", "content": "A carefully prepared product announcement."},
            format="json",
        )
        self.assertEqual(client_draft_response.status_code, 201)
        draft_id = client_draft_response.json()["id"]

        self.client.force_authenticate(user=self.creator)
        detail_response = self.client.get(f"/api/drafts/{draft_id}/")
        self.assertEqual(detail_response.status_code, 200)

        submit_response = self.client.post(
            f"/api/drafts/{draft_id}/submit-completed-review/",
            {"comment": "Corrections are complete; ready for client review."},
            format="json",
        )
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.json()["status"], "ready_for_client_review")
        self.assertTrue(Decision.objects.filter(draft_id=draft_id, action="sent_to_client", actor=self.creator).exists())

        self.client.force_authenticate(user=self.reviewer)
        reviewer_response = self.client.get(f"/api/drafts/{draft_id}/")
        self.assertEqual(reviewer_response.status_code, 200)
        self.assertEqual(reviewer_response.json()["status"], "ready_for_client_review")

    def test_reviewer_cannot_use_creator_submit_completed_review_endpoint(self):
        draft = self.create_draft("A campaign draft.")
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(f"/api/drafts/{draft['id']}/submit-completed-review/", {}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_creator_cannot_access_another_users_draft(self):
        self.client.force_authenticate(user=self.other_creator)
        draft = self.create_draft("Another user's announcement.")

        self.client.force_authenticate(user=self.creator)

        detail_response = self.client.get(
            f"/api/drafts/{draft['id']}/"
        )
        delete_response = self.client.delete(
            f"/api/drafts/{draft['id']}/"
        )

        self.assertEqual(detail_response.status_code, 404)
        self.assertEqual(delete_response.status_code, 404)
        self.assertTrue(
            Draft.objects.filter(pk=draft["id"]).exists()
        )

    # Audit-trail tests

    def test_revision_records_editor_and_version_history(self):
        draft = self.create_draft("Initial announcement.")

        response = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "Updated announcement."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["versions"]), 2)
        self.assertEqual(data["versions"][0]["version"], 1)
        self.assertEqual(data["versions"][1]["version"], 2)
        self.assertEqual(
            data["versions"][1]["editor_name"],
            "creator",
        )

        revision_decisions = [
            decision
            for decision in data["decisions"]
            if decision["action"] == "revised"
        ]
        self.assertTrue(revision_decisions)
        self.assertEqual(
            revision_decisions[-1]["actor_name"],
            "creator",
        )

    def test_approval_is_recorded_in_decision_history(self):
        draft = self.create_draft("A simple product announcement.")

        response = self.approve_draft(draft["id"])
        self.assertEqual(response.status_code, 200)

        approval_decisions = [
            decision
            for decision in response.json()["decisions"]
            if decision["action"] == "approved"
        ]

        self.assertTrue(approval_decisions)
        self.assertEqual(
            approval_decisions[-1]["actor_name"],
            "reviewer",
        )
        self.assertEqual(
            approval_decisions[-1]["comment"],
            "Regression test approval",
        )

    def test_finding_decision_records_reviewer_and_comment(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]
        comment = "Reviewed against the brand guideline."

        response = self.decide_finding(
            draft["id"],
            finding["id"],
            "dismissed",
            comment,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        matching_decisions = [
            decision
            for decision in data["decisions"]
            if decision["finding"] == finding["id"]
            and decision["action"] == "dismissed"
        ]

        self.assertTrue(matching_decisions)
        self.assertEqual(
            matching_decisions[-1]["actor_name"],
            "reviewer",
        )
        self.assertEqual(
            matching_decisions[-1]["comment"],
            comment,
        )

    def test_draft_detail_returns_versions_and_decisions(self):
        draft = self.create_draft("Initial announcement.")

        revision = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "Revised announcement."},
            format="json",
        )
        self.assertEqual(revision.status_code, 200)

        detail = self.client.get(
            f"/api/drafts/{draft['id']}/"
        )

        self.assertEqual(detail.status_code, 200)
        data = detail.json()

        self.assertGreaterEqual(len(data["versions"]), 2)
        self.assertTrue(
            any(
                decision["action"] == "revised"
                for decision in data["decisions"]
            )
        )
    def test_revision_obsoletes_acknowledged_findings_from_previous_version(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]
        acknowledged = self.decide_finding(
            draft["id"], finding["id"], "acknowledged", "Reviewed old version"
        )
        self.assertEqual(acknowledged.status_code, 200)

        self.client.force_authenticate(user=self.creator)
        revised = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "A clear product announcement."},
            format="json",
        )
        self.assertEqual(revised.status_code, 200)
        self.assertTrue(revised.json()["findings"])
        self.assertEqual(revised.json()["findings"][0]["state"], "obsolete")

        approved = self.approve_draft(draft["id"])
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.json()["status"], "approved")

    def test_revision_obsoletes_previously_dismissed_findings(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]
        self.decide_finding(draft["id"], finding["id"], "dismissed", "Reviewed and accepted for this version")
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "A simple product announcement."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Finding.objects.get(pk=finding["id"]).state, "obsolete")
        self.assertTrue(
            Decision.objects.filter(
                draft_id=draft["id"], finding_id=finding["id"], action="dismissed"
            ).exists()
        )

    def test_dismissal_requires_a_documented_reason(self):
        draft = self.create_draft("Returns guaranteed.")
        finding = draft["findings"][0]
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(
            f"/api/drafts/{draft['id']}/findings/{finding['id']}/decide/",
            {"action": "dismissed", "comment": "   "},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Finding.objects.get(pk=finding["id"]).state, "open")

    def test_draft_request_changes_is_persisted(self):
        draft = self.create_draft("A simple product announcement.")
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(
            f"/api/drafts/{draft['id']}/decide/",
            {"action": "changes_requested", "comment": "Please clarify the claim."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "changes_requested")
        self.assertTrue(
            Decision.objects.filter(
                draft_id=draft["id"], action="changes_requested",
                comment="Please clarify the claim.", actor=self.reviewer,
            ).exists()
        )

    def test_non_staff_cannot_record_draft_level_decision(self):
        draft = self.create_draft("A simple product announcement.")
        response = self.client.post(
            f"/api/drafts/{draft['id']}/decide/",
            {"action": "rejected", "comment": "Not suitable."},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_approved_draft_cannot_be_revised(self):
        draft = self.create_draft("A simple product announcement.")
        self.assertEqual(self.approve_draft(draft["id"]).status_code, 200)
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(
            f"/api/drafts/{draft['id']}/revise/",
            {"content": "Changed after approval."},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_knowledge_endpoint_includes_historical_facts_and_rules(self):
        Fact.objects.create(
            key="old savings rate", value="6.0%", source="F-009", status="superseded"
        )
        self.client.force_authenticate(user=self.creator)
        response = self.client.get("/api/knowledge/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual({fact["status"] for fact in response.json()["facts"]}, {"approved", "superseded"})
        self.assertTrue(response.json()["rules"])


class AIResponseValidationTests(TestCase):
    def setUp(self):
        self.fact = Fact.objects.create(
            key="savings rate",
            value="5%",
            source="Approved product fact sheet",
            status="approved",
        )

    @patch.dict(os.environ, {"GROQ_API_KEY": "test-key"})
    @patch("core.engine.Groq")
    def test_valid_empty_findings_list_is_accepted(
        self, mock_groq
    ):
        from .engine import groq_inspect

        mock_response = mock_groq.return_value.chat.completions.create
        mock_response.return_value.choices = [
            type(
                "Choice",
                (),
                {
                    "message": type(
                        "Message",
                        (),
                        {"content": '{"findings": []}'},
                    )(),
                },
            )(),
        ]

        result = groq_inspect("Our product may help customers.")

        self.assertEqual(result, [])

    @patch.dict(os.environ, {"GROQ_API_KEY": "test-key"})
    @patch("core.engine.Groq")
    def test_missing_findings_field_fails_safely(
        self, mock_groq
    ):
        from .engine import AIReviewError, groq_inspect

        mock_response = mock_groq.return_value.chat.completions.create
        mock_response.return_value.choices = [
            type(
                "Choice",
                (),
                {
                    "message": type(
                        "Message",
                        (),
                        {"content": '{"message": "No findings field"}'},
                    )(),
                },
            )(),
        ]

        with self.assertRaises(AIReviewError):
            groq_inspect("Our product may help customers.")

    @patch.dict(os.environ, {"GROQ_API_KEY": "test-key"})
    @patch("core.engine.Groq")
    def test_excerpt_not_in_draft_fails_safely(
        self, mock_groq
    ):
        from .engine import AIReviewError, groq_inspect

        response_data = {
            "findings": [
                {
                    "kind": "unsupported_claim",
                    "excerpt": "This text is not in the draft.",
                    "reason": "The claim lacks evidence.",
                    "suggestion": "Request approved evidence.",
                    "source": "Human review required",
                }
            ]
        }

        mock_response = mock_groq.return_value.chat.completions.create
        mock_response.return_value.choices = [
            type(
                "Choice",
                (),
                {
                    "message": type(
                        "Message",
                        (),
                        {"content": json.dumps(response_data)},
                    )(),
                },
            )(),
        ]

        with self.assertRaises(AIReviewError):
            groq_inspect("Our product may help customers.")

class DuplicateSuppressionTests(TestCase):
    def setUp(self):
        from unittest.mock import patch

        self.ai_patch = patch(
            "core.engine.groq_inspect",
            return_value=[],
        )
        self.ai_patch.start()
        self.addCleanup(self.ai_patch.stop)

    def test_overlapping_brand_tone_finding_is_suppressed(self):
        from unittest.mock import patch
        from core.engine import inspect

        deterministic_finding = {
            "kind": "prohibited_term",
            "excerpt": "guaranteed",
            "reason": "Prohibited term",
            "suggestion": "Use approved wording",
            "source": "R-12: Brand style guide",
        }

        ai_finding = {
            "kind": "brand_tone",
            "excerpt": "Returns are guaranteed.",
            "reason": "Tone issue",
            "suggestion": "Revise the wording",
            "source": "Human review required",
        }

        with (
            patch(
                "core.engine.deterministic_inspect",
                return_value=[deterministic_finding],
            ),
            patch(
                "core.engine.groq_inspect",
                return_value=[ai_finding],
            ),
        ):
            findings = inspect("Returns are guaranteed.")

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["kind"], "prohibited_term")

    def test_overlapping_unsupported_claim_is_suppressed(self):
        from unittest.mock import patch
        from core.engine import inspect

        deterministic_finding = {
            "kind": "fact_mismatch",
            "excerpt": "savings rate is 7%",
            "reason": "Approved rate is 6.5%",
            "suggestion": "Use the approved rate",
            "source": "savings rate: F-014",
        }

        ai_finding = {
            "kind": "unsupported_claim",
            "excerpt": "Savings rate is 7%.",
            "reason": "Claim conflicts with approved facts",
            "suggestion": "Verify the rate",
            "source": "Human review required",
        }

        with (
            patch(
                "core.engine.deterministic_inspect",
                return_value=[deterministic_finding],
            ),
            patch(
                "core.engine.groq_inspect",
                return_value=[ai_finding],
            ),
        ):
            findings = inspect("Our savings rate is 7%.")

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["kind"], "fact_mismatch")

    def test_non_duplicate_ai_finding_is_retained(self):
        from unittest.mock import patch
        from core.engine import inspect

        ai_finding = {
            "kind": "brand_tone",
            "excerpt": "We are the best in the country.",
            "reason": "Comparative messaging needs review",
            "suggestion": "Use substantiated wording",
            "source": "Human review required",
        }

        with (
            patch(
                "core.engine.deterministic_inspect",
                return_value=[],
            ),
            patch(
                "core.engine.groq_inspect",
                return_value=[ai_finding],
            ),
        ):
            findings = inspect("We are the best in the country.")

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["kind"], "brand_tone")



class ReviewerBrandOwnershipTests(TestCase):
    def setUp(self):
        self.reviewer = User.objects.create_user("brand_owner", password="test123", is_staff=True)
        self.creator = User.objects.create_user("brand_worker", password="test123")
        self.client = APIClient()

    def test_reviewer_can_create_brand_and_creator_can_read_guidelines(self):
        self.client.force_authenticate(user=self.reviewer)
        created = self.client.post("/api/brands/", {"name": "Owner Brand"}, format="json")
        self.assertEqual(created.status_code, 201)
        brand_id = created.json()["id"]
        self.client.post("/api/guidelines/", {
            "brand": brand_id, "code": "T-1", "phrase": "guaranteed",
            "replacement": "may vary", "explanation": "Do not guarantee outcomes.",
            "source": "Owner rules",
        }, format="json")
        self.client.force_authenticate(user=self.creator)
        visible = self.client.get(f"/api/knowledge/?brand_id={brand_id}")
        self.assertEqual(visible.status_code, 200)
        self.assertEqual(len(visible.json()["rules"]), 1)
        forbidden = self.client.post("/api/guidelines/", {
            "brand": brand_id, "code": "T-2", "phrase": "bad", "explanation": "No"
        }, format="json")
        self.assertEqual(forbidden.status_code, 403)

    def test_creator_cannot_create_brand(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.post("/api/brands/", {"name": "Unauthorized"}, format="json")
        self.assertEqual(response.status_code, 403)

    @patch("core.views.inspect", return_value=[{
        "kind": "unsupported_claim", "excerpt": "guaranteed",
        "reason": "Unsupported promise", "suggestion": "may vary", "source": "T-1: Owner rules"
    }])
    def test_reviewer_can_run_read_only_review(self, inspect_mock):
        from .models import Brand
        brand = Brand.objects.create(name="Review Brand", created_by=self.reviewer)
        draft = Draft.objects.create(title="Review", content="guaranteed", author=self.creator, brand=brand)
        Version.objects.create(draft=draft, content=draft.content, version=1, editor=self.creator)
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(f"/api/drafts/{draft.id}/review/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["read_only"])
        draft.refresh_from_db()
        self.assertEqual(draft.content, "guaranteed")
        self.assertEqual(draft.versions.count(), 1)
