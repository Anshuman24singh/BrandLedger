from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Fact,Rule,Draft,Version,Finding,Decision
from .serializers import FactSerializer,RuleSerializer,DraftSerializer
from .engine import inspect
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
 user=authenticate(username=request.data.get('username'),password=request.data.get('password'))
 if not user:return Response({'error':'Invalid credentials'},status=400)
 token,_=Token.objects.get_or_create(user=user)
 return Response({'token':token.key,'username':user.username,'is_staff':user.is_staff})
@api_view(['GET'])
def knowledge(request):
 return Response({'facts':FactSerializer(Fact.objects.all(),many=True).data,'rules':RuleSerializer(Rule.objects.all(),many=True).data})
@api_view(['GET','POST'])
def drafts(request):
 if request.method=='GET':return Response(DraftSerializer(Draft.objects.order_by('-created_at'),many=True).data)
 title=str(request.data.get('title','')).strip()[:200];content=str(request.data.get('content','')).strip()
 if not title or not content or len(content)>20000:return Response({'error':'Title and content (max 20,000 characters) required'},status=400)
 with transaction.atomic():
  d=Draft.objects.create(title=title,content=content,author=request.user)
  v=Version.objects.create(draft=d,content=content,version=1,editor=request.user)
  for finding in inspect(content):Finding.objects.create(draft=d,version=v,**finding)
 return Response(DraftSerializer(d).data,status=201)
@api_view(['GET'])
def draft_detail(request,pk):
 return Response(DraftSerializer(get_object_or_404(Draft,pk=pk)).data)
@api_view(['POST'])
def revise(request,pk):
 d=get_object_or_404(Draft,pk=pk)
 if d.author_id!=request.user.id and not request.user.is_staff:return Response({'error':'Only author or staff can revise'},status=403)
 content=str(request.data.get('content','')).strip()
 if not content or len(content)>20000:return Response({'error':'Content required (max 20,000 characters)'},status=400)
 with transaction.atomic():
  version=d.versions.count()+1
  v=Version.objects.create(draft=d,content=content,version=version,editor=request.user)
  d.content=content;d.status='in_review';d.save()
  d.findings.filter(state='open').update(state='obsolete')
  for finding in inspect(content):Finding.objects.create(draft=d,version=v,**finding)
  Decision.objects.create(draft=d,actor=request.user,action='revised',comment=f'Created version {version}')
 return Response(DraftSerializer(d).data)
@api_view(['POST'])
def decide(request,pk,finding_id):
 d=get_object_or_404(Draft,pk=pk)
 f=get_object_or_404(Finding,pk=finding_id,draft=d)
 if f.state!='open':return Response({'error':'Finding is no longer open'},status=400)
 action=request.data.get('action')
 if action not in ['acknowledged','dismissed']:return Response({'error':'Choose acknowledged or dismissed'},status=400)
 f.state=action;f.save(update_fields=['state'])
 Decision.objects.create(draft=d,finding=f,actor=request.user,action=action,comment=str(request.data.get('comment',''))[:1000])
 return Response(DraftSerializer(d).data)
@api_view(['POST'])
def approve(request,pk):
 d=get_object_or_404(Draft,pk=pk)
 if not request.user.is_staff:return Response({'error':'Reviewer permission required'},status=403)
 if d.findings.filter(state='open').exists():return Response({'error':'Resolve all open findings before approval'},status=400)
 d.status='approved';d.save()
 Decision.objects.create(draft=d,actor=request.user,action='approved',comment=str(request.data.get('comment',''))[:1000])
 return Response(DraftSerializer(d).data)
@api_view(['GET'])
def health(request):return Response({'status':'ok'})
