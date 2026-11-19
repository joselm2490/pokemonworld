from django.urls import path
from .views import LoginView, RegisterView, TrainerTeamsView

urlpatterns = [
    path('login/', LoginView.as_view(), name='account-login'),
    path('register/', RegisterView.as_view(), name='account-register'),
    path('teams/', TrainerTeamsView.as_view(), name='account-teams'),
]
