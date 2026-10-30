from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_finding_evidence_snapshot_finding_evidence_status_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="FactAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[("created", "Created"), ("replaced", "Replaced")], max_length=20)),
                ("before", models.JSONField(blank=True, default=dict)),
                ("after", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="fact_audit_events", to=settings.AUTH_USER_MODEL)),
                ("brand", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="fact_audit_events", to="core.brand")),
                ("fact", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="audit_events", to="core.fact")),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
    ]
