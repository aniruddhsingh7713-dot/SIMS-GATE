from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import (
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    AccountSecurityStatus,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)
from .services import (
    register_or_verify_device,
    detect_device_metadata,
    revoke_student_device,
    reset_all_student_devices,
    suspend_student_account,
    reactivate_student_account,
    lock_student_account,
    process_device_replacement_request
)


def get_client_ip(request):
    """Accurately extracts client IP address, handling proxy headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_request_user(request):
    """Helper to resolve authenticated user from DRF request or user_id param."""
    if request.user and request.user.is_authenticated:
        return request.user
    user_id = getattr(request, 'data', {}).get("user_id") if hasattr(request, 'data') else None
    if not user_id and hasattr(request, 'query_params'):
        user_id = request.query_params.get("user_id")
    if user_id:
        try:
            return User.objects.get(id=user_id)
        except (User.DoesNotExist, ValueError):
            pass
    return None


class RegisterDeviceAPIView(APIView):
    """
    POST /api/security/register-device/
    Registers a new device or verifies an existing device for the student.
    Strictly enforces maximum TWO registered devices per account.
    """
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response(
                {"success": False, "error": "Authentication required to register device.", "code": "UNAUTHENTICATED"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data
        device_id = data.get('device_id') or request.headers.get('X-Device-Id')
        device_token = data.get('device_token') or request.headers.get('X-Device-Token')
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not device_id:
            return Response(
                {"success": False, "error": "device_id is required.", "code": "MISSING_DEVICE_ID"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = register_or_verify_device(
            student=user,
            device_id=device_id,
            raw_token=device_token,
            client_metadata=data,
            ip_address=ip_address,
            user_agent=user_agent
        )

        if not result.get('success'):
            if result.get('status') == 'LIMIT_EXCEEDED':
                return Response(result, status=status.HTTP_403_FORBIDDEN)
            if result.get('status') == 'ACCOUNT_SUSPENDED':
                return Response(result, status=status.HTTP_403_FORBIDDEN)
            if result.get('status') == 'DEVICE_REVOKED':
                return Response(result, status=status.HTTP_403_FORBIDDEN)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)


class MyDevicesAPIView(APIView):
    """
    GET /api/security/my-devices/
    Lists all registered devices for the authenticated student.
    Formats 2 slots (Active Device 1, Active Device 2, or Available Slot).
    """
    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response(
                {"success": False, "error": "Authentication required.", "code": "UNAUTHENTICATED"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        current_device_id = request.headers.get('X-Device-Id') or request.query_params.get('current_device_id')
        sec_status, _ = AccountSecurityStatus.objects.get_or_create(student=user)

        active_devices = StudentDevice.objects.filter(
            student=user,
            is_active=True
        ).order_by('-last_active_at')

        devices_list = []
        for idx, dev in enumerate(active_devices):
            devices_list.append({
                "id": dev.id,
                "slot_number": idx + 1,
                "device_id": dev.device_id,
                "device_name": dev.device_name,
                "device_type": dev.device_type,
                "operating_system": dev.operating_system,
                "browser": dev.browser,
                "ip_address": dev.ip_address,
                "is_active": dev.is_active,
                "is_current_device": bool(current_device_id and dev.device_id == current_device_id),
                "registered_at": dev.registered_at.strftime("%d %b %Y, %I:%M %p"),
                "last_active_at": dev.last_active_at.strftime("%d %b %Y, %I:%M %p"),
            })

        # Pending replacement requests
        pending_requests = DeviceReplacementRequest.objects.filter(
            student=user,
            status='PENDING'
        ).values('id', 'new_device_name', 'reason', 'status', 'created_at')

        return Response({
            "success": True,
            "max_allowed_devices": sec_status.max_allowed_devices,
            "registered_count": active_devices.count(),
            "available_slots": max(0, sec_status.max_allowed_devices - active_devices.count()),
            "security_status": sec_status.status,
            "devices": devices_list,
            "pending_replacement_requests": list(pending_requests)
        })


class RequestDeviceReplacementAPIView(APIView):
    """
    POST /api/security/request-device-replacement/
    Allows a student to request removal of an old device to free up a slot.
    Admin approval workflow.
    """
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response(
                {"success": False, "error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data
        device_id_to_remove = data.get('device_id')
        reason = (data.get('reason') or '').strip()
        new_device_name = (data.get('new_device_name') or '').strip()

        if not reason:
            return Response(
                {"success": False, "error": "Please provide a reason for requesting device replacement (e.g., lost phone, new laptop)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        target_device = None
        if device_id_to_remove:
            target_device = StudentDevice.objects.filter(student=user, device_id=device_id_to_remove).first()

        req = DeviceReplacementRequest.objects.create(
            student=user,
            device_to_remove=target_device,
            new_device_name=new_device_name or 'New Device',
            reason=reason,
            status='PENDING'
        )

        SecurityAlert.objects.create(
            student=user,
            alert_type='UNUSUAL_ACTIVITY',
            risk_level='LOW',
            ip_address=get_client_ip(request),
            message=f"Student {user.username} submitted device replacement request #{req.id}: {reason}"
        )

        return Response({
            "success": True,
            "message": "Device replacement request submitted successfully. An administrator will review your request.",
            "request_id": req.id,
            "status": req.status
        }, status=status.HTTP_201_CREATED)


class RemoveDeviceAPIView(APIView):
    """
    POST /api/security/remove-device/
    Allows student to voluntary revoke one of their own registered devices.
    """
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"success": False, "error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        device_id = request.data.get('device_id')
        if not device_id:
            return Response({"success": False, "error": "device_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        device = StudentDevice.objects.filter(student=user, device_id=device_id, is_active=True).first()
        if not device:
            return Response({"success": False, "error": "Device not found or already inactive."}, status=status.HTTP_404_NOT_FOUND)

        device.is_active = False
        device.revoked_at = timezone.now()
        device.revocation_reason = "Voluntary removal by student."
        device.save()

        DeviceLoginHistory.objects.create(
            student=user,
            device=device,
            device_id_attempted=device_id,
            status='REVOKED_ACCESS',
            ip_address=get_client_ip(request),
            details={'action': 'Self-revoked by student'}
        )

        return Response({
            "success": True,
            "message": f"Device '{device.device_name}' removed successfully. Slot is now available."
        })


class SecurityStatusAPIView(APIView):
    """
    GET /api/security/status/
    Returns current account security status and active device count.
    """
    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"authenticated": False, "status": "UNKNOWN"})

        sec_status, _ = AccountSecurityStatus.objects.get_or_create(student=user)
        active_count = StudentDevice.objects.filter(student=user, is_active=True).count()

        return Response({
            "authenticated": True,
            "student_id": user.id,
            "username": user.username,
            "status": sec_status.status,
            "is_access_allowed": sec_status.is_access_allowed,
            "registered_devices": active_count,
            "max_allowed_devices": sec_status.max_allowed_devices,
            "review_reason": sec_status.review_reason
        })
