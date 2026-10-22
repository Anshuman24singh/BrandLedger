from django.db import models
from django.contrib.auth.models import User
class Fact(models.Model):
 key=models.CharField(max_length=80,unique=True)
 value=models.CharField(max_length=250)
 source=models.CharField(max_length=300)
 status=models.CharField(max_length=20,choices=[('approved','Approved'),('superseded','Superseded')],default='approved')
 effective_date=models.DateField(null=True,blank=True)
 def __str__(self):return self.key+' = '+self.value
class Rule(models.Model):
 code=models.CharField(max_length=40,unique=True)
 phrase=models.CharField(max_length=200)
 replacement=models.CharField(max_length=200,blank=True)
 explanation=models.TextField()
 source=models.CharField(max_length=250,default='Brand style guide')
 def __str__(self):return self.code
class Draft(models.Model):
 title=models.CharField(max_length=200)
 content=models.TextField()
 author=models.ForeignKey(User,on_delete=models.PROTECT,related_name='drafts')
 status=models.CharField(max_length=30,default='in_review')
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
 draft=models.ForeignKey(Draft,on_delete=models.CASCADE,related_name='findings')
 version=models.ForeignKey(Version,on_delete=models.CASCADE)
 kind=models.CharField(max_length=50)
 excerpt=models.CharField(max_length=300)
 reason=models.TextField()
 suggestion=models.TextField(blank=True)
 source=models.CharField(max_length=300)
 state=models.CharField(max_length=20,default='open')
class Decision(models.Model):
 draft=models.ForeignKey(Draft,on_delete=models.CASCADE,related_name='decisions')
 finding=models.ForeignKey(Finding,on_delete=models.CASCADE,null=True,blank=True)
 actor=models.ForeignKey(User,on_delete=models.PROTECT)
 action=models.CharField(max_length=30)
 comment=models.TextField(blank=True)
 created_at=models.DateTimeField(auto_now_add=True)
