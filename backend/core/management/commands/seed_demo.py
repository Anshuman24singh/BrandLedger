import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Fact,Rule
class Command(BaseCommand):
 help='Create fictional PayNest demo accounts and brand knowledge; change passwords before public deployment.'
 def handle(self,*args,**kwargs):
  for username,staff in [('creator',False),('reviewer',True)]:
   u,_=User.objects.get_or_create(username=username,defaults={'is_staff':staff})
   u.is_staff=staff;u.set_password(os.environ.get(f'DEMO_{username.upper()}_PASSWORD',f'{username}123!'));u.save()
  Fact.objects.update_or_create(key='savings rate',defaults={'value':'6.5%','source':'PayNest Approved Facts v2, F-014','status':'approved'})
  Fact.objects.update_or_create(key='old savings rate',defaults={'value':'6.0%','source':'PayNest Approved Facts v1, F-009','status':'superseded'})
  Rule.objects.update_or_create(code='R-12',defaults={'phrase':'guaranteed','replacement':'subject to applicable terms','explanation':'Absolute guarantees are prohibited in this fictional brand guide.','source':'PayNest Brand Guide, section 4'})
  Rule.objects.update_or_create(code='R-13',defaults={'phrase':'risk-free','replacement':'review product risks and terms','explanation':'Risk-free wording is not permitted.','source':'PayNest Brand Guide, section 4'})
  self.stdout.write(self.style.SUCCESS('Demo accounts and fictional PayNest knowledge ready'))
