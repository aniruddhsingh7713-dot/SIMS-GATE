import hashlib
import json
import logging
import secrets
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from .models import (
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    AccountSecurityStatus,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)

logger = logging.getLogger(__name__)


def generate_secure_device_token() -> str:
    """Generates a cryptographically random 256-bit URL-safe token."""
    return secrets.token_urlsafe(32)


def compute_fingerprint_hash(device_data: dict) -> str:
    """Computes a stable SHA-256 digest from client browser fingerprint parameters."""
    normalized = {
        'platform': str(device_data.get('platform') or '').strip().lower(),
        'screen': str(device_data.get('screen') or '').strip(),
        'timezone': str(device_data.get('timezone') or '').strip(),
        'language': str(device_data.get('language') or '').strip().lower(),
        'cores': str(device_data.get('hardware_concurrency') or ''),
        'user_agent': str(device_data.get('user_agent') or '').strip()[:100],
    }
    encoded = json.dumps(normalized, sort_keys=True).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def detect_device_metadata(user_agent: str, client_data: dict = None) -> dict:
    """Extracts device type, OS, and browser from User-Agent and client payload."""
    client_data = client_data or {}
    ua = (user_agent or '').lower()

    # Device type
    if 'ipad' in ua or 'tablet' in ua:
        device_type = 'tablet'
    elif 'mobi' in ua or 'android' in ua or 'iphone' in ua:
        device_type = 'mobile'
    else:
        device_type = 'desktop'

    # Override from client if explicitly verified
    if client_data.get('device_type') in ['desktop', 'mobile', 'tablet']:
        device_type = client_data.get('device_type')

    # Operating System
    if 'windows' in ua:
        os_name = 'Windows PC'
        if 'windows nt 10.0' in ua:
            os_name = 'Windows 10/11'
    elif 'android' in ua:
        os_name = 'Android'
    elif 'iphone' in ua:
        os_name = 'iOS (iPhone)'
    elif 'ipad' in ua:
        os_name = 'iPadOS'
    elif 'macintosh' in ua or 'mac os' in ua:
        os_name = 'macOS'
    elif 'linux' in ua:
        os_name = 'Linux'
    else:
        os_name = client_data.get('operating_system') or 'Unknown OS'

    # Browser
    if 'edg/' in ua:
        browser_name = 'Microsoft Edge'
    elif 'chrome/' in ua and 'edg' not in ua and 'opr' not in ua:
        browser_name = 'Google Chrome'
    elif 'firefox/' in ua:
        browser_name = 'Mozilla Firefox'
    elif 'safari/' in ua and 'chrome' not in ua:
        browser_name = 'Apple Safari'
    elif 'opr/' in ua or 'opera' in ua:
        browser_name = 'Opera'
    else:
        browser_name = client_data.get('browser') or 'Standard Browser'

    # Suggested Device Name
    suggested_name = client_data.get('device_name')
    if not suggested_name:
        suggested_name = f"{os_name} ({browser_name})"

    return {
        'device_type': device_type,
        'operating_system': os_name,
        'browser': browser_name,
        'device_name': suggested_name,
    }


def register_or_verify_device(
    student: User,
    device_id: str,
    raw_token: str = None,
    client_metadata: dict = None,
    ip_address: str = None,
    user_agent: str = None
) -> dict:
    """
    Main entry point for device limit enforcement and authentication.
    Uses PostgreSQL transactions and row locking (select_for_update) to prevent race conditions.
    """
    if not student or not student.is_authenticated:
        return {
            'success': False,
            'status': 'UNAUTHENTICATED',
            'message': 'Authentication required.'
        }

    # Staff / Superuser accounts are exempt from 2-device student limits
    if student.is_staff or student.is_superuser:
        return {
            'success': True,
            'status': 'ADMIN_EXEMPT',
            'device_id': device_id,
            'token': raw_token or 'admin-token',
            'message': 'Administrative account exempted from student device quota.'
        }

    device_id = (device_id or '').strip()
    if not device_id:
        return {
            'success': False,
            'status': 'INVALID_DEVICE_ID',
            'message': 'Device registration identifier is missing.'
        }

    client_metadata = client_metadata or {}
    meta = detect_device_metadata(user_agent, client_metadata)
    fingerprint_hash = compute_fingerprint_hash({
        **client_metadata,
        'user_agent': user_agent
    })

    with transaction.atomic():
        # Row lock on the student's security status
        sec_status, _ = AccountSecurityStatus.objects.select_for_update().get_or_create(
            student=student
        )

        # 1. Check account suspension / lock state
        if sec_status.status in ['SUSPENDED', 'TEMPORARILY_LOCKED']:
            DeviceLoginHistory.objects.create(
                student=student,
                device_id_attempted=device_id,
                device_name=meta['device_name'],
                device_type=meta['device_type'],
                operating_system=meta['operating_system'],
                browser=meta['browser'],
                ip_address=ip_address,
                user_agent=user_agent or '',
                status='BLOCKED_SUSPENDED',
                details={'reason': sec_status.review_reason, 'status': sec_status.status}
            )
            return {
                'success': False,
                'status': 'ACCOUNT_SUSPENDED',
                'account_status': sec_status.status,
                'review_reason': sec_status.review_reason,
                'message': f"Account is {sec_status.get_status_display().lower()}. Access to test series and dashboard is blocked. Please contact SIMS GATE Administration."
            }

        # 2. Check if this exact device is ALREADY registered for this student
        existing_device = StudentDevice.objects.select_for_update().filter(
            student=student,
            device_id=device_id
        ).first()

        if existing_device:
            # Check if device is marked blocked or inactive/revoked
            if not existing_device.is_active or existing_device.is_blocked:
                DeviceLoginHistory.objects.create(
                    student=student,
                    device=existing_device,
                    device_id_attempted=device_id,
                    device_name=existing_device.device_name,
                    device_type=existing_device.device_type,
                    operating_system=existing_device.operating_system,
                    browser=existing_device.browser,
                    ip_address=ip_address,
                    user_agent=user_agent or '',
                    status='REVOKED_ACCESS',
                    details={'revocation_reason': existing_device.revocation_reason}
                )
                return {
                    'success': False,
                    'status': 'DEVICE_REVOKED',
                    'device_name': existing_device.device_name,
                    'message': f"This device ({existing_device.device_name}) has been revoked. Contact admin or request device replacement."
                }

            # Device is active. Validate token if token supplied
            new_token = None
            if raw_token and not existing_device.verify_token(raw_token):
                # Token mismatch detected
                SecurityAlert.objects.create(
                    student=student,
                    alert_type='TOKEN_MISMATCH',
                    risk_level='HIGH',
                    device_id_attempted=device_id,
                    ip_address=ip_address,
                    user_agent=user_agent or '',
                    message=f"Device token integrity mismatch detected on '{existing_device.device_name}'. Possible session cloning attempt."
                )
                DeviceLoginHistory.objects.create(
                    student=student,
                    device=existing_device,
                    device_id_attempted=device_id,
                    status='TOKEN_MISMATCH',
                    ip_address=ip_address,
                    user_agent=user_agent or '',
                    details={'error': 'Token hash mismatch'}
                )
                # Re-issue secure token after audit
                new_token = generate_secure_device_token()
                existing_device.device_token_hash = StudentDevice.hash_token(new_token)

            # Update activity timestamp & IP
            existing_device.last_active_at = timezone.now()
            existing_device.ip_address = ip_address or existing_device.ip_address
            existing_device.device_fingerprint_hash = fingerprint_hash
            if user_agent:
                existing_device.user_agent = user_agent
            existing_device.save()

            DeviceLoginHistory.objects.create(
                student=student,
                device=existing_device,
                device_id_attempted=device_id,
                device_name=existing_device.device_name,
                device_type=existing_device.device_type,
                operating_system=existing_device.operating_system,
                browser=existing_device.browser,
                ip_address=ip_address,
                user_agent=user_agent or '',
                status='SUCCESS',
                details={'event': 'Existing device session verified'}
            )

            token_to_return = new_token if new_token else (raw_token or '')
            return {
                'success': True,
                'status': 'VERIFIED',
                'device_id': existing_device.device_id,
                'device_name': existing_device.device_name,
                'token': token_to_return,
                'active_devices_count': StudentDevice.objects.filter(student=student, is_active=True).count(),
                'max_allowed_devices': sec_status.max_allowed_devices,
                'message': f"Access authorized on '{existing_device.device_name}'."
            }

        # 3. New device registration attempt: count active devices
        active_devices = StudentDevice.objects.select_for_update().filter(
            student=student,
            is_active=True
        )
        active_count = active_devices.count()

        if active_count >= sec_status.max_allowed_devices:
            # 2-Device Limit reached! Block the 3rd device!
            sec_status.failed_device_attempts += 1
            if sec_status.failed_device_attempts >= 5 and sec_status.status == 'ACTIVE':
                sec_status.status = 'SECURITY_REVIEW'
                sec_status.review_reason = 'Multiple repeated 3rd-device login attempts exceeded security threshold.'
            sec_status.save()

            alert = SecurityAlert.objects.create(
                student=student,
                alert_type='THIRD_DEVICE_ATTEMPT',
                risk_level='HIGH',
                device_id_attempted=device_id,
                ip_address=ip_address,
                user_agent=user_agent or '',
                message=(
                    f"Third device login attempt blocked for student {student.username}. "
                    f"Attempted from {meta['device_name']} (IP: {ip_address or 'Unknown'}). "
                    f"Student already has {active_count} registered active devices."
                ),
                metadata={
                    'attempted_device_meta': meta,
                    'active_devices': [
                        {'id': d.id, 'name': d.device_name, 'os': d.operating_system, 'browser': d.browser}
                        for d in active_devices
                    ]
                }
            )

            DeviceLoginHistory.objects.create(
                student=student,
                device_id_attempted=device_id,
                device_name=meta['device_name'],
                device_type=meta['device_type'],
                operating_system=meta['operating_system'],
                browser=meta['browser'],
                ip_address=ip_address,
                user_agent=user_agent or '',
                status='BLOCKED_LIMIT',
                details={'alert_id': alert.id, 'active_count': active_count}
            )

            return {
                'success': False,
                'status': 'LIMIT_EXCEEDED',
                'active_devices_count': active_count,
                'max_allowed_devices': sec_status.max_allowed_devices,
                'attempted_device': meta,
                'registered_devices': [
                    {
                        'id': d.id,
                        'device_name': d.device_name,
                        'device_type': d.device_type,
                        'operating_system': d.operating_system,
                        'browser': d.browser,
                        'last_active_at': d.last_active_at.isoformat(),
                        'registered_at': d.registered_at.isoformat(),
                    } for d in active_devices
                ],
                'message': (
                    f"Device Limit Exceeded: Your SIMS GATE account is currently registered on the maximum allowed "
                    f"2 devices. Access from this new device ({meta['device_name']}) has been blocked to protect your account."
                )
            }

        # 4. Under Limit: Register device into Slot 1 or Slot 2
        fresh_token = generate_secure_device_token()
        token_hash = StudentDevice.hash_token(fresh_token)

        new_device, _ = StudentDevice.objects.update_or_create(
            student=student,
            device_id=device_id,
            defaults={
                'device_name': meta['device_name'],
                'device_type': meta['device_type'],
                'operating_system': meta['operating_system'],
                'browser': meta['browser'],
                'device_fingerprint_hash': fingerprint_hash,
                'device_token_hash': token_hash,
                'ip_address': ip_address,
                'user_agent': user_agent or '',
                'is_active': True,
                'is_blocked': False,
                'revoked_at': None,
                'revocation_reason': '',
            }
        )

        DeviceLoginHistory.objects.create(
            student=student,
            device=new_device,
            device_id_attempted=device_id,
            device_name=new_device.device_name,
            device_type=new_device.device_type,
            operating_system=new_device.operating_system,
            browser=new_device.browser,
            ip_address=ip_address,
            user_agent=user_agent or '',
            status='REGISTERED',
            details={'slot_number': active_count + 1}
        )

        return {
            'success': True,
            'status': 'REGISTERED',
            'device_id': new_device.device_id,
            'device_name': new_device.device_name,
            'token': fresh_token,
            'active_devices_count': active_count + 1,
            'max_allowed_devices': sec_status.max_allowed_devices,
            'message': f"Device registered successfully as Device #{active_count + 1} ({new_device.device_name})."
        }


def check_device_authorization_for_content(user: User, device_id: str, raw_token: str = None) -> dict:
    """
    Validates if a student's active request is coming from an authorized registered device.
    Used by test series exam engines and course content access controls.
    """
    if not user or not user.is_authenticated:
        return {'authorized': False, 'reason': 'Authentication required.', 'code': 'UNAUTHENTICATED'}

    if user.is_staff or user.is_superuser:
        return {'authorized': True, 'reason': 'Admin exempt.', 'code': 'ADMIN_EXEMPT'}

    # 1. Check Account Security Status
    sec_status = AccountSecurityStatus.objects.filter(student=user).first()
    if sec_status and sec_status.status in ['SUSPENDED', 'TEMPORARILY_LOCKED']:
        return {
            'authorized': False,
            'reason': f"Access Denied: Your account is {sec_status.get_status_display().lower()}.",
            'code': 'ACCOUNT_SUSPENDED'
        }

    # 2. Check Device Registration
    if not device_id:
        return {
            'authorized': False,
            'reason': 'Device authorization required. Please access from your registered device.',
            'code': 'DEVICE_HEADER_MISSING'
        }

    device = StudentDevice.objects.filter(
        student=user,
        device_id=device_id,
        is_active=True,
        is_blocked=False
    ).first()

    if not device:
        # Check active device count
        active_count = StudentDevice.objects.filter(student=user, is_active=True).count()
        if active_count >= (sec_status.max_allowed_devices if sec_status else 2):
            return {
                'authorized': False,
                'reason': 'Device Limit Exceeded: Protected test content is only accessible from your 2 registered devices.',
                'code': 'DEVICE_LIMIT_EXCEEDED'
            }
        return {
            'authorized': False,
            'reason': 'This device is not registered. Please register your device first.',
            'code': 'DEVICE_NOT_REGISTERED'
        }

    # Verify token if passed
    if raw_token and not device.verify_token(raw_token):
        return {
            'authorized': False,
            'reason': 'Device token verification failed. Please re-login on this device.',
            'code': 'TOKEN_MISMATCH'
        }

    # Update active timestamp
    device.last_active_at = timezone.now()
    device.save(update_fields=['last_active_at'])

    return {'authorized': True, 'device': device, 'code': 'AUTHORIZED'}


# =============================================================================
# Administrative Security Actions (with mandatory Audit Logging)
# =============================================================================

def revoke_student_device(admin_user: User, student: User, device_id: str, reason: str) -> bool:
    """Terminates an authorized device for a student with audit logging."""
    with transaction.atomic():
        device = StudentDevice.objects.select_for_update().filter(
            student=student,
            device_id=device_id
        ).first()

        if not device:
            return False

        device.is_active = False
        device.revoked_at = timezone.now()
        device.revocation_reason = reason
        device.save()

        AdminSecurityAuditLog.objects.create(
            admin_user=admin_user,
            target_student=student,
            action='REVOKE_DEVICE',
            reason=reason,
            details={
                'device_id': device_id,
                'device_name': device.device_name,
                'operating_system': device.operating_system,
            }
        )
        return True


def reset_all_student_devices(admin_user: User, student: User, reason: str) -> int:
    """Revokes all active devices for a student, allowing fresh 2-device registration."""
    with transaction.atomic():
        active_devices = StudentDevice.objects.select_for_update().filter(
            student=student,
            is_active=True
        )
        count = active_devices.count()
        active_devices.update(
            is_active=False,
            revoked_at=timezone.now(),
            revocation_reason=f"Admin Reset: {reason}"
        )

        sec_status, _ = AccountSecurityStatus.objects.select_for_update().get_or_create(student=student)
        sec_status.failed_device_attempts = 0
        sec_status.save()

        AdminSecurityAuditLog.objects.create(
            admin_user=admin_user,
            target_student=student,
            action='RESET_ALL_DEVICES',
            reason=reason,
            details={'revoked_count': count}
        )
        return count


def suspend_student_account(admin_user: User, student: User, reason: str) -> bool:
    """Suspends a student account, blocking all tests, courses, and portal access."""
    with transaction.atomic():
        sec_status, _ = AccountSecurityStatus.objects.select_for_update().get_or_create(student=student)
        sec_status.status = 'SUSPENDED'
        sec_status.suspended_at = timezone.now()
        sec_status.review_reason = reason
        sec_status.save()

        AdminSecurityAuditLog.objects.create(
            admin_user=admin_user,
            target_student=student,
            action='SUSPEND_ACCOUNT',
            reason=reason
        )
        return True


def reactivate_student_account(admin_user: User, student: User, reason: str) -> bool:
    """Restores an account from suspended or locked back to ACTIVE."""
    with transaction.atomic():
        sec_status, _ = AccountSecurityStatus.objects.select_for_update().get_or_create(student=student)
        sec_status.status = 'ACTIVE'
        sec_status.reactivated_at = timezone.now()
        sec_status.review_reason = ''
        sec_status.failed_device_attempts = 0
        sec_status.save()

        AdminSecurityAuditLog.objects.create(
            admin_user=admin_user,
            target_student=student,
            action='REACTIVATE_ACCOUNT',
            reason=reason
        )
        return True


def lock_student_account(admin_user: User, student: User, reason: str) -> bool:
    """Temporarily locks an account pending investigation."""
    with transaction.atomic():
        sec_status, _ = AccountSecurityStatus.objects.select_for_update().get_or_create(student=student)
        sec_status.status = 'TEMPORARILY_LOCKED'
        sec_status.locked_at = timezone.now()
        sec_status.review_reason = reason
        sec_status.save()

        AdminSecurityAuditLog.objects.create(
            admin_user=admin_user,
            target_student=student,
            action='LOCK_ACCOUNT',
            reason=reason
        )
        return True


def process_device_replacement_request(admin_user: User, request_id: int, approve: bool, notes: str) -> bool:
    """Approves or rejects a student's device replacement request."""
    with transaction.atomic():
        req = DeviceReplacementRequest.objects.select_for_update().filter(id=request_id).first()
        if not req:
            return False

        req.reviewed_by = admin_user
        req.reviewed_at = timezone.now()
        req.admin_notes = notes

        if approve:
            req.status = 'APPROVED'
            # If target device specified, revoke it to free up a slot!
            if req.device_to_remove and req.device_to_remove.is_active:
                req.device_to_remove.is_active = False
                req.device_to_remove.revoked_at = timezone.now()
                req.device_to_remove.revocation_reason = f"Approved Replacement Request #{req.id}: {notes}"
                req.device_to_remove.save()

            AdminSecurityAuditLog.objects.create(
                admin_user=admin_user,
                target_student=req.student,
                action='AUTHORIZE_REPLACEMENT',
                reason=notes,
                details={
                    'request_id': req.id,
                    'removed_device_id': req.device_to_remove.device_id if req.device_to_remove else None
                }
            )
        else:
            req.status = 'REJECTED'
            AdminSecurityAuditLog.objects.create(
                admin_user=admin_user,
                target_student=req.student,
                action='REJECT_REPLACEMENT',
                reason=notes,
                details={'request_id': req.id}
            )

        req.save()
        return True
