from django.db import models
from django.contrib.auth.models import User

class Brand(models.Model):
    name = models.CharField(max_length=120)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="brands")
    members = models.ManyToManyField(User, blank=True, related_name="brand_memberships")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = [("name", "created_by")]
        ordering = ["name"]
    def __str__(self): return self.name

class Fact(models.Model):
 brand=models.ForeignKey(Brand,on_delete=models.CASCADE,null=True,blank=True,related_name="facts")
 key=models.CharField(max_length=80)
 value=models.CharField(max_length=250)
 source=models.CharField(max_length=300)
 status=models.CharField(max_length=20,choices=[('approved','Approved'),('superseded','Superseded'),('withdrawn','Withdrawn')],default='approved')
 effective_date=models.DateField(null=True,blank=True)
 def __str__(self):return self.key+' = '+self.value

class Rule(models.Model):
 brand=models.ForeignKey(Brand,on_delete=models.CASCADE,null=True,blank=True,related_name="rules")
 code=models.CharField(max_length=40)
 phrase=models.CharField(max_length=200)
 replacement=models.CharField(max_length=200,blank=True)
 explanation=models.TextField()
 source=models.CharField(max_length=250,default='Brand style guide')
 def __str__(self):return self.code

class Draft(models.Model):
 brand=models.ForeignKey(Brand,on_delete=models.SET_NULL,null=True,blank=True,related_name="drafts")
 title=models.CharField(max_length=200)
 content=models.TextField()
 author=models.ForeignKey(User,on_delete=models.PROTECT,related_name='drafts')
 status=models.CharField(max_length=30,default='in_review')
 ai_review_complete=models.BooleanField(default=True)
 created_at=models.DateTimeField(auto_now_add=True)
 updated_at=models.DateTimeField(auto_now=True)
class Version(models.Model):
 draft=models.ForeignKey(Draft,on_delete=models.CASCADE,related_name='versions')
 content=models.TextField()
 version=models.PositiveIntegerField()
 editor=models.ForeignKey(User,on_delete=models.PROTECT)
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta:unique_together=[('draft','version')]

class Finding(models.Model):
    EVIDENCE_STATUS_CHOICES = [
        ("supported", "Supported"),
        ("uncertain", "Uncertain"),
    ]

    draft = models.ForeignKey(
        Draft,
        on_delete=models.CASCADE,
        related_name="findings",
    )
    version = models.ForeignKey(Version, on_delete=models.CASCADE)

    fact = models.ForeignKey(
        Fact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="findings",
    )
    rule = models.ForeignKey(
        Rule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="findings",
    )

    evidence_status = models.CharField(
        max_length=20,
        choices=EVIDENCE_STATUS_CHOICES,
        default="uncertain",
    )
    evidence_snapshot = models.JSONField(default=dict, blank=True)

    kind = models.CharField(max_length=50)
    excerpt = models.CharField(max_length=300)
    reason = models.TextField()
    suggestion = models.TextField(blank=True)
    source = models.CharField(max_length=300)
    state = models.CharField(max_length=20, default="open")

class Decision(models.Model):
 draft=models.ForeignKey(Draft,on_delete=models.CASCADE,related_name='decisions')
 finding=models.ForeignKey(Finding,on_delete=models.CASCADE,null=True,blank=True)
 actor=models.ForeignKey(User,on_delete=models.PROTECT)
 action=models.CharField(max_length=30)
 comment=models.TextField(blank=True)
 created_at=models.DateTimeField(auto_now_add=True)

class FactAudit(models.Model):
    ACTION_CHOICES = [
        ("created", "Created"),
        ("replaced", "Replaced"),
        ("updated", "Updated"),
        ("withdrawn", "Withdrawn"),
    ]

    fact = models.ForeignKey(Fact, on_delete=models.PROTECT, related_name="audit_events")
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="fact_audit_events")
    actor = models.ForeignKey(User, on_delete=models.PROTECT, related_name="fact_audit_events")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.action}: {self.fact.key} ({self.created_at:%Y-%m-%d %H:%M})"
