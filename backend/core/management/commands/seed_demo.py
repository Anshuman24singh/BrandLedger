
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from core.models import Fact, Rule


class Command(BaseCommand):
    help = "Seed fictional PayNest knowledge and demo accounts."

    def handle(self, *args, **kwargs):
        for username, staff in [("creator", False), ("reviewer", True)]:
            password = os.environ.get(
                f"DEMO_{username.upper()}_PASSWORD", ""
            )

            if not password or len(password) < 12:
                raise CommandError(
                    f"Set DEMO_{username.upper()}_PASSWORD to a password "
                    "of at least 12 characters."
                )

            user, created = User.objects.get_or_create(username=username)
            user.is_staff = staff
            user.is_superuser = False
            user.set_password(password)
            user.save()

            self.stdout.write(
                f'{"Created" if created else "Updated"} demo account: {username}'
            )

        Fact.objects.update_or_create(
            key="savings rate",
            defaults={
                "value": "6.5%",
                "source": "PayNest Approved Facts v2, F-014",
                "status": "approved",
            },
        )
        Fact.objects.update_or_create(
            key="old savings rate",
            defaults={
                "value": "6.0%",
                "source": "PayNest Approved Facts v1, F-009",
                "status": "superseded",
            },
        )
        Rule.objects.update_or_create(
            code="R-12",
            defaults={
                "phrase": "guaranteed",
                # No phrase-only replacement is safe in every sentence.
                # Blank intentionally forces human review instead of a bad rewrite.
                "replacement": "",
                "explanation": (
                    "Absolute guarantees are prohibited in this fictional brand guide."
                ),
                "source": "PayNest Brand Guide, section 4",
            },
        )
        Rule.objects.update_or_create(
            code="R-13",
            defaults={
                "phrase": "risk-free",
                "replacement": "",
                "explanation": "Risk-free wording is not permitted.",
                "source": "PayNest Brand Guide, section 4",
            },
        )

        self.stdout.write(
            self.style.SUCCESS("Demo accounts and PayNest knowledge are ready.")
        )
