
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Fact, Rule, Draft, Version, Finding, Decision


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

        self.assertEqual(response.status_code, 400)
        self.assertTrue(
            Draft.objects.filter(pk=draft["id"]).exists()
        )

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
