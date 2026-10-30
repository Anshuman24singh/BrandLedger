from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
views_path = ROOT / "backend" / "core" / "views.py"
tests_path = ROOT / "backend" / "core" / "tests.py"

if not views_path.exists() or not tests_path.exists():
    print("ERROR: Run this script from the extracted ZIP inside your BrandLedger project root, or copy it to the project root first.")
    print(f"Expected: {views_path}")
    sys.exit(1)

views = views_path.read_text(encoding="utf-8")
tests = tests_path.read_text(encoding="utf-8")

replacements = [
    (
'''def _reviewer_owned_brand(request, brand_id):
    if not request.user.is_staff:
        return None, Response({"error": "Reviewer permission required."}, status=status.HTTP_403_FORBIDDEN)
    if not brand_id:
        return None, Response({"error": "A brand is required."}, status=status.HTTP_400_BAD_REQUEST)
    brand = get_object_or_404(Brand, pk=brand_id)
    if brand.created_by_id != request.user.id:
        return None, Response(
            {"error": "Only the Reviewer who owns this brand can change its facts."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return brand, None
''',
'''def _reviewer_owned_brand(request, brand_id):
    """Return a brand for any authenticated Reviewer; ownership is not required."""
    if not request.user.is_staff:
        return None, Response({"error": "Reviewer permission required."}, status=status.HTTP_403_FORBIDDEN)
    if not brand_id:
        return None, Response({"error": "A brand is required."}, status=status.HTTP_400_BAD_REQUEST)
    brand = get_object_or_404(Brand, pk=brand_id)
    return brand, None
''',
        "Reviewer brand ownership helper",
    ),
    (
'''    elif fact.brand and fact.brand.created_by_id != request.user.id:
        return Response({"error": "Only the owning Reviewer can inspect this fact's audit history."}, status=status.HTTP_403_FORBIDDEN)
''',
'''    # Reviewers can inspect audit history for facts belonging to any brand.
''',
        "Reviewer audit-history ownership restriction",
    ),
]

new_tests = [
    (
'''    def test_reviewer_cannot_change_brand_owned_by_another_reviewer(self):
        from .models import Brand
        other = User.objects.create_user("other_ledger_reviewer", password="test123", is_staff=True)
        other_brand = Brand.objects.create(name="Other Brand", created_by=other)
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post("/api/facts/", {
            "brand": other_brand.id, "key": "claim", "value": "value", "source": "source",
        }, format="json")
        self.assertEqual(response.status_code, 403)
''',
'''    def test_reviewer_can_create_fact_for_brand_owned_by_another_reviewer(self):
        from .models import Brand
        other = User.objects.create_user("other_ledger_reviewer", password="test123", is_staff=True)
        other_brand = Brand.objects.create(name="Other Brand", created_by=other)
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post("/api/facts/", {
            "brand": other_brand.id, "key": "claim", "value": "value", "source": "source",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["brand"], other_brand.id)
        self.assertTrue(Fact.objects.filter(brand=other_brand, key="claim", status="approved").exists())
''',
        "Reviewer cross-brand create test",
    ),
    (
'''    def test_other_reviewer_cannot_edit_fact_owned_by_another_reviewer(self):
        self.client.force_authenticate(user=self.other_reviewer)
        response = self.client.patch(f"/api/facts/{self.fact.id}/", {"value": "7%"}, format="json")
        self.assertEqual(response.status_code, 403)
        self.fact.refresh_from_db()
        self.assertEqual(self.fact.value, "6.5%")
''',
'''    def test_other_reviewer_can_edit_fact_owned_by_another_reviewer(self):
        self.client.force_authenticate(user=self.other_reviewer)
        response = self.client.patch(
            f"/api/facts/{self.fact.id}/",
            {"value": "7%", "key": "savings rate", "source": "F-015", "effective_date": None},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.fact.refresh_from_db()
        self.assertEqual(self.fact.status, "superseded")
        replacement = Fact.objects.get(pk=response.json()["id"])
        self.assertEqual(replacement.value, "7%")
        self.assertEqual(replacement.status, "approved")
        self.assertTrue(FactAudit.objects.filter(fact=replacement, actor=self.other_reviewer).exists())
''',
        "Reviewer cross-brand edit test",
    ),
]

# Preflight every expected block before changing either file.
for old, new, label in replacements:
    if old not in views:
        print(f"ERROR: Could not find expected block in backend/core/views.py: {label}. No files changed.")
        sys.exit(2)
for old, new, label in new_tests:
    if old not in tests:
        print(f"ERROR: Could not find expected block in backend/core/tests.py: {label}. No files changed.")
        sys.exit(3)

for old, new, _ in replacements:
    views = views.replace(old, new, 1)
for old, new, _ in new_tests:
    tests = tests.replace(old, new, 1)

views_path.write_text(views, encoding="utf-8", newline="\n")
tests_path.write_text(tests, encoding="utf-8", newline="\n")
print("Reviewer all-brands permission fix applied:")
print(" - Reviewers can add claims to any brand")
print(" - Reviewers can edit/withdraw claims for any brand")
print(" - Reviewers can inspect any claim's audit history")
print(" - Creator write restrictions remain in place")
print(" - Cross-brand permission tests updated")
print("No database migration is required.")
