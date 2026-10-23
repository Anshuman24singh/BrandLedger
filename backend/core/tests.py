
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Fact, Rule


class WorkflowTests(TestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            "creator", password="test123"
        )
        self.reviewer = User.objects.create_user(
            "reviewer", password="test123", is_staff=True
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

    def decide_finding(self, draft_id, finding_id, action):
        self.client.force_authenticate(user=self.reviewer)
        return self.client.post(
            f"/api/drafts/{draft_id}/findings/{finding_id}/decide/",
            {
                "action": action,
                "comment": f"Regression test: {action}",
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
        draft = self.create_draft(
            "Our product may help users."
        )
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

        # Acknowledging findings must not permit approval.
        for finding in draft["findings"]:
            response = self.client.post(
                f"/api/drafts/{draft['id']}/findings/"
                f"{finding['id']}/decide/",
                {"action": "acknowledged"},
                format="json",
            )
            self.assertEqual(response.status_code, 200)

        response = self.client.post(
            f"/api/drafts/{draft['id']}/approve/"
        )
        self.assertEqual(response.status_code, 400)

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
