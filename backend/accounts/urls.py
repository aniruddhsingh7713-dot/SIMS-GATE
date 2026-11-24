from django.urls import path
from .views import RegisterAPIView, LoginAPIView, CurrentUserAPIView, OnboardingAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='auth-register'),
    path('login/', LoginAPIView.as_view(), name='auth-login'),
    path('me/', CurrentUserAPIView.as_view(), name='auth-me'),
    path('onboarding/', OnboardingAPIView.as_view(), name='auth-onboarding'),
]
