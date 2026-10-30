from django.test import TestCase

from core.models import Fact, Rule
from core.engine import deterministic_inspect
from core.evaluation import EVALUATION_DATASET, calculate_metrics


class EvaluationDatasetTests(TestCase):
    """
    Runs the labelled evaluation examples against the real
    deterministic inspection engine using isolated test records.
    """

    def setUp(self):
        # Approved fact used by the fact-checking examples.
        Fact.objects.create(
            brand=None,
            key="savings rate",
            value="6.5%",
            source="Evaluation test facts",
            status="approved",
            effective_date=None,
        )

        # Prohibited phrase used by the wording example.
        Rule.objects.create(
            brand=None,
            code="EVAL-001",
            phrase="returns are guaranteed",
            replacement="returns are not guaranteed",
            explanation="Do not promise guaranteed returns.",
            source="Evaluation test rules",
        )

    def test_evaluation_dataset_against_deterministic_engine(self):
        results = []

        for example in EVALUATION_DATASET:
            findings = deterministic_inspect(example["draft"])

            actual_issue_kinds = [
                finding.get("kind")
                for finding in findings
            ]

            results.append({
                "id": example["id"],
                "expected_issue_kinds": example["expected_issue_kinds"],
                "actual_issue_kinds": actual_issue_kinds,
            })

        # Check the exact issue types for every example.
        # This catches wrong issue types as well as missing or extra findings.
        for result in results:
            with self.subTest(example_id=result["id"]):
                self.assertCountEqual(
                    result["expected_issue_kinds"],
                    result["actual_issue_kinds"],
                    msg=(
                        f"Incorrect issue types for {result['id']}. "
                        f"Expected: {result['expected_issue_kinds']}; "
                        f"detected: {result['actual_issue_kinds']}"
                    ),
                )

        metrics = calculate_metrics(results)

        print("\nBRANDLEGDER DETERMINISTIC EVALUATION")
        print("-----------------------------------")

        for result in results:
            print(f"\nExample: {result['id']}")
            print(f"Expected: {result['expected_issue_kinds']}")
            print(f"Detected: {result['actual_issue_kinds']}")

        print("\nMETRICS")
        for metric, value in metrics.items():
            print(f"{metric}: {value}")

        # Verify the expected example-level evaluation metrics.
        self.assertEqual(
            metrics,
            {
                "total_examples": 6,
                "true_positives": 3,
                "false_positives": 0,
                "false_negatives": 0,
                "true_negatives": 3,
                "precision": 1.0,
                "recall": 1.0,
                "accuracy": 1.0,
            },
        )

    def test_metrics_detect_false_positives_and_missed_issues(self):
        metrics = calculate_metrics([
            {
                "expected_issue_kinds": ["fact_mismatch"],
                "actual_issue_kinds": ["fact_mismatch"],
            },
            {
                "expected_issue_kinds": [],
                "actual_issue_kinds": ["prohibited_term"],
            },
            {
                "expected_issue_kinds": ["fact_mismatch"],
                "actual_issue_kinds": [],
            },
            {
                "expected_issue_kinds": [],
                "actual_issue_kinds": [],
            },
        ])

        self.assertEqual(metrics["true_positives"], 1)
        self.assertEqual(metrics["false_positives"], 1)
        self.assertEqual(metrics["false_negatives"], 1)
        self.assertEqual(metrics["true_negatives"], 1)