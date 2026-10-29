from django.contrib import admin
from .models import Brand, Fact, Rule, Draft, Version, Finding, Decision
for model in [Brand, Fact, Rule, Draft, Version, Finding, Decision]:
    admin.site.register(model)
