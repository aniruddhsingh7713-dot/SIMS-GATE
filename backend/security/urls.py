from django.urls import path
from .views import (
    RegisterDeviceAPIView,
    MyDevicesAPIView,
    RequestDeviceReplacementAPIView,
    RemoveDeviceAPIView,
    SecurityStatusAPIView
)

urlpatterns = [
    path('register-device/', RegisterDeviceAPIView.as_view(), name='security-register-device'),
    path('my-devices/', MyDevicesAPIView.as_view(), name='security-my-devices'),
    path('remove-device/', RemoveDeviceAPIView.as_view(), name='security-remove-device'),
    path('request-device-replacement/', RequestDeviceReplacementAPIView.as_view(), name='security-request-replacement'),
    path('status/', SecurityStatusAPIView.as_view(), name='security-status'),
]
