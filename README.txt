BrandLedger Reviewer Claims Ledger All-Brands Permission Fix

Any authenticated Reviewer (Django is_staff=True) can add/edit/withdraw claims for any existing brand. The same brand-owner restriction is removed from Reviewer audit-history access. Creators remain unable to write facts. No database migration is needed.

Apply:
1. Back up backend/core/views.py and backend/core/tests.py.
2. Extract this ZIP into the BrandLedger project root.
3. From the project root run: python apply_reviewer_all_brands_fix.py
4. Run from backend: python manage.py test core
5. Review git diff before committing.

The script checks all expected code patterns before writing, and exits without modifying files if the current code differs.
