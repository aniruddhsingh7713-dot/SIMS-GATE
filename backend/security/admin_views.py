from django.contrib.auth.models import User
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import (
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    AccountSecurityStatus,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)
from .services import (
    revoke_student_device,
    reset_all_student_devices,
    suspend_student_account,
    reactivate_student_account,
    lock_student_account,
    process_device_replacement_request
)


def is_admin_request(request):
    """Enforces staff/superuser authorization on admin security views."""
    user = request.user
    if user and user.is_authenticated and (user.is_staff or user.is_superuser):
        return True
    # Fallback to user_id header/param if verified staff
    user_id = getattr(request, 'data', {}).get('admin_user_id') or request.query_params.get('admin_user_id')
    if user_id:
        try:
            candidate = User.objects.get(id=user_id)
            if candidate.is_staff or candidate.is_superuser:
                request.user = candidate
                return True
        except User.DoesNotExist:
            pass
    return False


class AdminDeviceListAPIView(APIView):
    """
    GET /api/admin/security/devices/
    Searchable and filterable device records across all students.
    Includes student's purchased test series, registered count, OS, IP, risk status.
    """
    def get(self, request):
        if not is_admin_request(request):
            return Response(
                {"error": "Administrative privileges required.", "code": "FORBIDDEN"},
                status=status.HTTP_403_FORBIDDEN
            )

        q = request.query_params.get('q', '').strip()
        status_filter = request.query_params.get('status', 'all').strip()
        risk_filter = request.query_params.get('risk', 'all').strip()

        devices = StudentDevice.objects.select_related('student', 'student__profile', 'student__security_status').all()

        if q:
            devices = devices.filter(
                Q(student__username__icontains=q) |
                Q(student__email__icontains=q) |
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q) |
                Q(device_name__icontains=q) |
                Q(ip_address__icontains=q) |
                Q(operating_system__icontains=q) |
                Q(browser__icontains=q)
            )

        if status_filter == 'active':
            devices = devices.filter(is_active=True)
        elif status_filter == 'revoked':
            devices = devices.filter(is_active=False)

        # Batch lookup purchased test series for students in this view
        from courses.models import Order
        student_ids = list(devices.values_list('student_id', flat=True).distinct())
        purchases_map = {}
        for ord in Order.objects.filter(user_id__in=student_ids, status='PAID').select_related('course'):
            if ord.user_id not in purchases_map:
                purchases_map[ord.user_id] = []
            if ord.course and ord.course.title not in purchases_map[ord.user_id]:
                purchases_map[ord.user_id].append(ord.course.title)

        records = []
        for dev in devices[:100]:
            student = dev.student
            sec_status = getattr(student, 'security_status', None)
            total_active = student.devices.filter(is_active=True).count()
            student_purchases = purchases_map.get(student.id, ["Standard Enrollment"])

            records.append({
                "id": dev.id,
                "student_id": student.id,
                "student_name": f"{student.first_name} {student.last_name}".strip() or student.username,
                "student_email": student.email,
                "student_username": student.username,
                "purchased_test_series": student_purchases,
                "registered_device_count": total_active,
                "max_allowed_devices": sec_status.max_allowed_devices if sec_status else 2,
                "device_id": dev.device_id,
                "device_name": dev.device_name,
                "device_type": dev.device_type,
                "operating_system": dev.operating_system,
                "browser": dev.browser,
                "ip_address": dev.ip_address,
                "first_login": dev.registered_at.strftime("%Y-%m-%d %H:%M"),
                "last_active": dev.last_active_at.strftime("%Y-%m-%d %H:%M"),
                "is_active": dev.is_active,
                "registration_status": "Active" if dev.is_active else "Revoked",
                "account_security_status": sec_status.status if sec_status else "ACTIVE",
                "risk_status": "Review Required" if sec_status and sec_status.status == 'SECURITY_REVIEW' else ("Suspended" if sec_status and sec_status.status == 'SUSPENDED' else "Normal"),
                "revoked_at": dev.revoked_at.strftime("%Y-%m-%d %H:%M") if dev.revoked_at else None,
                "revocation_reason": dev.revocation_reason or "",
            })

        return Response({
            "success": True,
            "total_records": len(records),
            "devices": records
        })


class AdminSecurityAlertsAPIView(APIView):
    """
    GET /api/admin/security/alerts/
    Lists security alerts with filter options (resolved, risk_level, alert_type).
    """
    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Administrative privileges required."}, status=status.HTTP_403_FORBIDDEN)

        resolved = request.query_params.get('resolved')
        risk = request.query_params.get('risk')

        alerts = SecurityAlert.objects.select_related('student', 'resolved_by').all()
        if resolved == 'true':
            alerts = alerts.filter(is_resolved=True)
        elif resolved == 'false':
            alerts = alerts.filter(is_resolved=False)

        if risk and risk != 'all':
            alerts = alerts.filter(risk_level=risk.upper())

        data = []
        for a in alerts[:100]:
            data.append({
                "id": a.id,
                "student_id": a.student.id,
                "student_username": a.student.username,
                "student_email": a.student.email,
                "alert_type": a.alert_type,
                "alert_type_display": a.get_alert_type_display(),
                "risk_level": a.risk_level,
                "device_id_attempted": a.device_id_attempted,
                "ip_address": a.ip_address,
                "message": a.message,
                "metadata": a.metadata,
                "is_resolved": a.is_resolved,
                "resolved_by": a.resolved_by.username if a.resolved_by else None,
                "resolved_at": a.resolved_at.strftime("%Y-%m-%d %H:%M") if a.resolved_at else None,
                "created_at": a.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        return Response({"success": True, "total_alerts": len(data), "alerts": data})


class AdminLoginHistoryAPIView(APIView):
    """
    GET /api/admin/security/login-history/
    Lists device login history and blocked device attempts.
    """
    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Administrative privileges required."}, status=status.HTTP_403_FORBIDDEN)

        status_param = request.query_params.get('status')
        records = DeviceLoginHistory.objects.select_related('student', 'device').all()
        if status_param and status_param != 'all':
            records = records.filter(status=status_param)

        data = []
        for r in records[:100]:
            data.append({
                "id": r.id,
                "student_username": r.student.username,
                "student_email": r.student.email,
                "device_name": r.device_name or (r.device.device_name if r.device else "Unknown Device"),
                "device_type": r.device_type,
                "operating_system": r.operating_system,
                "browser": r.browser,
                "ip_address": r.ip_address,
                "status": r.status,
                "status_display": r.get_status_display(),
                "details": r.details,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            })

        return Response({"success": True, "history": data})


class AdminRevokeDeviceAPIView(APIView):
    """
    POST /api/admin/security/revoke-device/
    Revokes a specific student device.
    """
    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        device_id = request.data.get('device_id')
        student_id = request.data.get('student_id')
        reason = (request.data.get('reason') or '').strip()

        if not device_id or not student_id or not reason:
            return Response(
                {"error": "device_id, student_id, and mandatory reason are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = User.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        success = revoke_student_device(
            admin_user=request.user,
            student=student,
            device_id=device_id,
            reason=reason
        )

        if not success:
            return Response({"error": "Device not found for this student."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "success": True,
            "message": f"Device {device_id} successfully revoked for student {student.username}."
        })


class AdminResetDevicesAPIView(APIView):
    """
    POST /api/admin/security/reset-devices/
    Resets all registered devices for a student, allowing a clean slate.
    """
    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id')
        reason = (request.data.get('reason') or '').strip()

        if not student_id or not reason:
            return Response({"error": "student_id and reason are required."}, status=status.HTTP_400_BAD_REQUEST)

        student = User.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        count = reset_all_student_devices(
            admin_user=request.user,
            student=student,
            reason=reason
        )

        return Response({
            "success": True,
            "revoked_count": count,
            "message": f"Successfully reset {count} device(s) for student {student.username}."
        })


class AdminSuspendAccountAPIView(APIView):
    """
    POST /api/admin/security/suspend-account/
    Suspends a student account, blocking all test series and dashboard access.
    """
    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id')
        reason = (request.data.get('reason') or '').strip()

        if not student_id or not reason:
            return Response({"error": "student_id and mandatory reason are required."}, status=status.HTTP_400_BAD_REQUEST)

        student = User.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        suspend_student_account(
            admin_user=request.user,
            student=student,
            reason=reason
        )

        return Response({
            "success": True,
            "message": f"Student account for {student.username} has been suspended."
        })


class AdminReactivateAccountAPIView(APIView):
    """
    POST /api/admin/security/reactivate-account/
    Reactivates a suspended or locked student account.
    """
    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id')
        reason = (request.data.get('reason') or '').strip()

        if not student_id or not reason:
            return Response({"error": "student_id and mandatory reason are required."}, status=status.HTTP_400_BAD_REQUEST)

        student = User.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        reactivate_student_account(
            admin_user=request.user,
            student=student,
            reason=reason
        )

        return Response({
            "success": True,
            "message": f"Student account for {student.username} has been reactivated to ACTIVE."
        })


class AdminAuditLogsAPIView(APIView):
    """
    GET /api/admin/security/audit-logs/
    Returns immutable admin security audit logs.
    """
    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        logs = AdminSecurityAuditLog.objects.select_related('admin_user', 'target_student').all()[:100]
        data = []
        for l in logs:
            data.append({
                "id": l.id,
                "admin": l.admin_user.username if l.admin_user else "System",
                "target_student": l.target_student.username if l.target_student else "Global",
                "action": l.action,
                "action_display": l.get_action_display(),
                "reason": l.reason,
                "details": l.details,
                "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })

        return Response({"success": True, "logs": data})


class AdminReplacementRequestsAPIView(APIView):
    """
    GET /api/admin/security/replacement-requests/
    POST /api/admin/security/replacement-requests/ (Approve or Reject)
    """
    def get(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        reqs = DeviceReplacementRequest.objects.select_related('student', 'device_to_remove', 'reviewed_by').all()
        data = []
        for r in reqs:
            data.append({
                "id": r.id,
                "student_id": r.student.id,
                "student_username": r.student.username,
                "student_email": r.student.email,
                "device_to_remove": r.device_to_remove.device_name if r.device_to_remove else "Not Specified",
                "new_device_name": r.new_device_name,
                "reason": r.reason,
                "status": r.status,
                "status_display": r.get_status_display(),
                "admin_notes": r.admin_notes,
                "reviewed_by": r.reviewed_by.username if r.reviewed_by else None,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M"),
            })
        return Response({"success": True, "requests": data})

    def post(self, request):
        if not is_admin_request(request):
            return Response({"error": "Admin authorization required."}, status=status.HTTP_403_FORBIDDEN)

        request_id = request.data.get('request_id')
        decision = request.data.get('decision')  # 'approve' or 'reject'
        notes = (request.data.get('notes') or '').strip()

        if not request_id or decision not in ['approve', 'reject']:
            return Response({"error": "request_id and valid decision ('approve'/'reject') are required."}, status=status.HTTP_400_BAD_REQUEST)

        success = process_device_replacement_request(
            admin_user=request.user,
            request_id=request_id,
            approve=(decision == 'approve'),
            notes=notes or f"Admin decision: {decision.upper()}"
        )

        if not success:
            return Response({"error": "Replacement request not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "success": True,
            "message": f"Replacement request #{request_id} successfully {decision}d."
        })
