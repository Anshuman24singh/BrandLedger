from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from .models import Fact,Rule
class WorkflowTests(TestCase):
 def setUp(self):
  self.creator=User.objects.create_user('creator',password='test123')
  self.reviewer=User.objects.create_user('reviewer',password='test123',is_staff=True)
  Fact.objects.create(key='savings rate',value='6.5%',source='F-014')
  Rule.objects.create(code='R-12',phrase='guaranteed',explanation='Not permitted')
  self.client=APIClient();self.client.force_authenticate(user=self.creator)
 def test_review_and_approval(self):
  r=self.client.post('/api/drafts/',{'title':'Ad','content':'Our savings rate is 7%. Returns guaranteed.'},format='json')
  self.assertEqual(r.status_code,201)
  d=r.json();self.assertEqual(len(d['findings']),2)
  self.client.force_authenticate(user=self.reviewer)
  self.assertEqual(self.client.post(f"/api/drafts/{d['id']}/approve/").status_code,400)
  for f in d['findings']:
   self.assertEqual(self.client.post(f"/api/drafts/{d['id']}/findings/{f['id']}/decide/",{'action':'acknowledged'},format='json').status_code,200)
  self.assertEqual(self.client.post(f"/api/drafts/{d['id']}/approve/").status_code,200)
 def test_revise_creates_new_version(self):
  d=self.client.post('/api/drafts/',{'title':'Ad','content':'savings rate is 7%'},format='json').json()
  r=self.client.post(f"/api/drafts/{d['id']}/revise/",{'content':'savings rate is 6.5%'},format='json')
  self.assertEqual(len(r.json()['versions']),2)
  self.assertFalse(any(f['state']=='open' for f in r.json()['findings']))
