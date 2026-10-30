
"""
BrandLedger evaluation dataset and metrics.

Each example contains:
- A draft to inspect.
- The issue types we expect the checker to identify.

The metrics compare whether an example should contain an issue
with whether the checker actually found one.
"""

EVALUATION_DATASET = [
    {
        "id": "clean_001",
        "description": "A clean, general product statement",
        "draft": "Our product is designed to make everyday payments simpler.",
        "expected_issue_kinds": [],
    },
    {
        "id": "clean_002",
        "description": "A neutral customer benefit statement",
        "draft": "Customers can manage their account through our mobile app.",
        "expected_issue_kinds": [],
    },
    {
        "id": "prohibited_001",
        "description": "Contains a prohibited phrase",
        "draft": "Your returns are guaranteed with our product.",
        "expected_issue_kinds": ["prohibited_term"],
    },
    {
        "id": "fact_mismatch_001",
        "description": "Contains a value that differs from the approved fact",
        "draft": "PayNest offers a savings rate of 7.0%.",
        "expected_issue_kinds": ["fact_mismatch"],
    },
    {
        "id": "fact_match_001",
        "description": "Uses the approved fact value",
        "draft": "PayNest offers a savings rate of 6.5%.",
        "expected_issue_kinds": [],
    },
    {
        "id": "conflicting_fact_001",
        "description": "Requires human review when approved facts conflict",
        "draft": "PayNest offers a savings rate of 8.5%.",
        "expected_issue_kinds": ["fact_mismatch"],
    },
]


def calculate_metrics(results):
    """
    Calculate binary issue-detection metrics.

    Each result must contain:
        expected_issue_kinds: list of expected issue types
        actual_issue_kinds: list of detected issue types

    An example counts as positive if at least one issue is expected
    or detected.
    """

    true_positives = 0
    false_positives = 0
    false_negatives = 0
    true_negatives = 0

    for result in results:
        expected_issue = bool(result["expected_issue_kinds"])
        actual_issue = bool(result["actual_issue_kinds"])

        if expected_issue and actual_issue:
            true_positives += 1
        elif not expected_issue and actual_issue:
            false_positives += 1
        elif expected_issue and not actual_issue:
            false_negatives += 1
        else:
            true_negatives += 1

    total = (
        true_positives
        + false_positives
        + false_negatives
        + true_negatives
    )

    precision_denominator = true_positives + false_positives
    recall_denominator = true_positives + false_negatives

    precision = (
        true_positives / precision_denominator
        if precision_denominator
        else 0.0
    )

    recall = (
        true_positives / recall_denominator
        if recall_denominator
        else 0.0
    )

    accuracy = (
        (true_positives + true_negatives) / total
        if total
        else 0.0
    )

    return {
        "total_examples": total,
        "true_positives": true_positives,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "true_negatives": true_negatives,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "accuracy": round(accuracy, 4),
    }
