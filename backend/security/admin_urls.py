from django.urls import path
from .admin_views import (
    AdminDeviceListAPIView,
    AdminSecurityAlertsAPIView,
    AdminLoginHistoryAPIView,
    AdminRevokeDeviceAPIView,
    AdminResetDevicesAPIView,
    AdminSuspendAccountAPIView,
    AdminReactivateAccountAPIView,
    AdminAuditLogsAPIView,
    AdminReplacementRequestsAPIView
)

urlpatterns = [
    path('devices/', AdminDeviceListAPIView.as_view(), name='admin-security-devices'),
    path('alerts/', AdminSecurityAlertsAPIView.as_view(), name='admin-security-alerts'),
    path('login-history/', AdminLoginHistoryAPIView.as_view(), name='admin-security-login-history'),
    path('revoke-device/', AdminRevokeDeviceAPIView.as_view(), name='admin-security-revoke-device'),
    path('reset-devices/', AdminResetDevicesAPIView.as_view(), name='admin-security-reset-devices'),
    path('suspend-account/', AdminSuspendAccountAPIView.as_view(), name='admin-security-suspend-account'),
    path('reactivate-account/', AdminReactivateAccountAPIView.as_view(), name='admin-security-reactivate-account'),
    path('audit-logs/', AdminAuditLogsAPIView.as_view(), name='admin-security-audit-logs'),
    path('replacement-requests/', AdminReplacementRequestsAPIView.as_view(), name='admin-security-replacement-requests'),
]
