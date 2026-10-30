
import json
import os
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase

from core.engine import AIReviewError, groq_inspect
from core.models import Fact, Rule


class AIEvaluationTests(TestCase):
    """
    Tests AI-assisted review reliability without making live Groq API calls.
    """

    def setUp(self):
        self.fact = Fact.objects.create(
            brand=None,
            key="savings rate",
            value="6.5%",
            source="Evaluation Approved Facts",
            status="approved",
            effective_date=None,
        )

        self.rule = Rule.objects.create(
            brand=None,
            code="AI-EVAL-001",
            phrase="guaranteed returns",
            replacement="potential returns",
            explanation="Do not guarantee investment returns.",
            source="Evaluation Brand Rules",
        )

        self.draft = "PayNest offers a savings rate of 7.0%."
        self.rule_draft = "PayNest offers guaranteed returns."

    def mock_groq_response(self, payload):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=json.dumps(payload)
                    )
                )
            ]
        )
        return response

    def run_with_mocked_groq(self, payload, draft=None):
        with (
            patch.dict(
                os.environ,
                {"GROQ_API_KEY": "test-api-key"},
                clear=True,
            ),
            patch("core.engine.Groq") as mocked_groq,
        ):
            mocked_groq.return_value.chat.completions.create.return_value = (
                self.mock_groq_response(payload)
            )

            findings = groq_inspect(draft or self.draft)

        return findings

    def test_ai_fact_citation_links_to_exact_fact_record(self):
        findings = self.run_with_mocked_groq({
            "findings": [
                {
                    "kind": "unsupported_claim",
                    "excerpt": "7.0%",
                    "reason": "The supplied approved fact states 6.5%.",
                    "suggestion": "6.5%",
                    "source": "savings rate: Evaluation Approved Facts",
                }
            ]
        })

        self.assertEqual(len(findings), 1)
        finding = findings[0]

        self.assertEqual(finding["fact_id"], self.fact.id)
        self.assertIsNone(finding["rule_id"])
        self.assertEqual(finding["evidence_status"], "supported")
        self.assertEqual(
            finding["evidence_snapshot"]["record_id"],
            self.fact.id,
        )

    def test_ai_rule_citation_links_to_exact_rule_record(self):
        findings = self.run_with_mocked_groq(
            {
                "findings": [
                    {
                        "kind": "brand_tone",
                        "excerpt": "guaranteed returns",
                        "reason": "This wording conflicts with the supplied rule.",
                        "suggestion": "potential returns",
                        "source": "AI-EVAL-001: Evaluation Brand Rules",
                    }
                ]
            },
            draft=self.rule_draft,
        )

        self.assertEqual(len(findings), 1)
        finding = findings[0]

        self.assertEqual(finding["rule_id"], self.rule.id)
        self.assertIsNone(finding["fact_id"])
        self.assertEqual(finding["evidence_status"], "supported")
        self.assertEqual(
            finding["evidence_snapshot"]["record_id"],
            self.rule.id,
        )

    def test_missing_ai_source_is_marked_uncertain(self):
        findings = self.run_with_mocked_groq({
            "findings": [
                {
                    "kind": "unsupported_claim",
                    "excerpt": "7.0%",
                    "reason": "The claim has no verified supporting source.",
                    "suggestion": "Use a verified value.",
                    "source": "Source That Does Not Exist",
                }
            ]
        })

        finding = findings[0]

        self.assertEqual(finding["evidence_status"], "uncertain")
        self.assertIsNone(finding["fact_id"])
        self.assertIsNone(finding["rule_id"])
        self.assertEqual(finding["source"], "Human review required")
        self.assertEqual(
            finding["suggestion"],
            "Human review required",
        )
        self.assertEqual(
            finding["evidence_snapshot"]["type"],
            "unverified_source",
        )

    def test_ambiguous_ai_source_is_marked_uncertain(self):
        Fact.objects.create(
            brand=None,
            key="savings rate",
            value="7.0%",
            source="Evaluation Approved Facts",
            status="approved",
            effective_date=None,
        )

        findings = self.run_with_mocked_groq({
            "findings": [
                {
                    "kind": "unsupported_claim",
                    "excerpt": "7.0%",
                    "reason": "The citation matches multiple records.",
                    "suggestion": "Use a verified value.",
                    "source": "savings rate: Evaluation Approved Facts",
                }
            ]
        })

        finding = findings[0]

        self.assertEqual(finding["evidence_status"], "uncertain")
        self.assertIsNone(finding["fact_id"])
        self.assertIsNone(finding["rule_id"])
        self.assertEqual(
            finding["evidence_snapshot"]["type"],
            "ambiguous_source",
        )
        self.assertEqual(
            len(finding["evidence_snapshot"]["matching_record_ids"]),
            2,
        )

    def test_missing_api_key_raises_safe_ai_review_error(self):
        with (
            patch.dict(os.environ, {}, clear=True),
            patch("core.engine.Groq") as mocked_groq,
        ):
            with self.assertRaises(AIReviewError):
                groq_inspect(self.draft)

            mocked_groq.assert_not_called()

    def test_provider_failure_raises_safe_ai_review_error(self):
        with (
            patch.dict(
                os.environ,
                {"GROQ_API_KEY": "test-api-key"},
                clear=True,
            ),
            patch("core.engine.Groq") as mocked_groq,
        ):
            mocked_groq.return_value.chat.completions.create.side_effect = (
                RuntimeError("Simulated provider outage")
            )

            with self.assertRaises(AIReviewError):
                groq_inspect(self.draft)

    def test_malformed_ai_json_raises_safe_ai_review_error(self):
        malformed_response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="This is not valid JSON"
                    )
                )
            ]
        )

        with (
            patch.dict(
                os.environ,
                {"GROQ_API_KEY": "test-api-key"},
                clear=True,
            ),
            patch("core.engine.Groq") as mocked_groq,
        ):
            mocked_groq.return_value.chat.completions.create.return_value = (
                malformed_response
            )

            with self.assertRaises(AIReviewError):
                groq_inspect(self.draft)
