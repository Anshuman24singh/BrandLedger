from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login),
    path("logout/", views.logout),
    path("health/", views.health),
    path("knowledge/", views.knowledge),
    path("brands/", views.brands),
    path("brands/<int:pk>/", views.brand_detail),
    path("guidelines/", views.guideline_collection),
    path("guidelines/<int:pk>/", views.guideline_collection),
    path("drafts/<int:pk>/review/", views.run_reviewer_review),
    path("drafts/<int:pk>/changes/", views.draft_changes),
    path("drafts/<int:pk>/apply-changes/", views.apply_draft_changes),
    path("drafts/", views.drafts),
    path("drafts/<int:pk>/", views.draft_detail),  # GET detail, DELETE draft
    path("drafts/<int:pk>/revise/", views.revise),
    path("drafts/<int:pk>/submit-completed-review/", views.submit_completed_review),
    path("drafts/<int:pk>/findings/<int:finding_id>/decide/", views.decide),
    path("drafts/<int:pk>/decide/", views.draft_decide),
    path("drafts/<int:pk>/approve/", views.approve),
]
