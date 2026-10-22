from django.urls import path
from . import views
urlpatterns=[path('login/',views.login),path('health/',views.health),path('knowledge/',views.knowledge),path('drafts/',views.drafts),path('drafts/<int:pk>/',views.draft_detail),path('drafts/<int:pk>/revise/',views.revise),path('drafts/<int:pk>/findings/<int:finding_id>/decide/',views.decide),path('drafts/<int:pk>/approve/',views.approve)]
