from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0005_factaudit"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fact",
            name="status",
            field=models.CharField(
                choices=[
                    ("approved", "Approved"),
                    ("superseded", "Superseded"),
                    ("withdrawn", "Withdrawn"),
                ],
                default="approved",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="factaudit",
            name="action",
            field=models.CharField(
                choices=[
                    ("created", "Created"),
                    ("replaced", "Replaced"),
                    ("updated", "Updated"),
                    ("withdrawn", "Withdrawn"),
                ],
                max_length=20,
            ),
        ),
    ]
