from django.contrib import admin
from .models import Fact,Rule,Draft,Version,Finding,Decision
for model in [Fact,Rule,Draft,Version,Finding,Decision]:admin.site.register(model)
