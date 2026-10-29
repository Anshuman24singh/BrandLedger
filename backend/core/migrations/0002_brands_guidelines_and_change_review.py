from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('core', '0001_initial'), ('auth', '0012_alter_user_first_name_max_length')]
    operations = [
        migrations.CreateModel(name='Brand', fields=[('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('name', models.CharField(max_length=120)), ('created_at', models.DateTimeField(auto_now_add=True)), ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='brands', to='auth.user')), ('members', models.ManyToManyField(blank=True, related_name='brand_memberships', to='auth.user'))], options={'ordering':['name'], 'unique_together':{('name','created_by')}}),
        migrations.AlterField(model_name='fact', name='key', field=models.CharField(max_length=80)),
        migrations.AlterField(model_name='rule', name='code', field=models.CharField(max_length=40)),
        migrations.AddField(model_name='fact', name='brand', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='facts', to='core.brand')),
        migrations.AddField(model_name='rule', name='brand', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='rules', to='core.brand')),
        migrations.AddField(model_name='draft', name='brand', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='drafts', to='core.brand')),
    ]
