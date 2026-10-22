from rest_framework import serializers
from .models import Fact,Rule,Draft,Version,Finding,Decision
class FactSerializer(serializers.ModelSerializer):
 class Meta:model=Fact;fields='__all__'
class RuleSerializer(serializers.ModelSerializer):
 class Meta:model=Rule;fields='__all__'
class FindingSerializer(serializers.ModelSerializer):
 class Meta:model=Finding;fields='__all__'
class VersionSerializer(serializers.ModelSerializer):
 editor_name=serializers.CharField(source='editor.username',read_only=True)
 class Meta:model=Version;fields=['id','version','content','editor_name','created_at']
class DecisionSerializer(serializers.ModelSerializer):
 actor_name=serializers.CharField(source='actor.username',read_only=True)
 class Meta:model=Decision;fields=['id','finding','actor_name','action','comment','created_at']
class DraftSerializer(serializers.ModelSerializer):
 author_name=serializers.CharField(source='author.username',read_only=True)
 findings=FindingSerializer(many=True,read_only=True)
 versions=VersionSerializer(many=True,read_only=True)
 decisions=DecisionSerializer(many=True,read_only=True)
 class Meta:model=Draft;fields=['id','title','content','status','author_name','created_at','updated_at','findings','versions','decisions']
