from django.urls import path, re_path
from .views import RosterListView, SpriteFileView

urlpatterns = [
    path('roster/', RosterListView.as_view(), name='roster-list'),
]

