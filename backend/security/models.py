import hashlib
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class AccountSecurityStatus(models.Model):
    """
    Tracks overall security state and device allowances for a student account.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SECURITY_REVIEW', 'Security Review Required'),
        ('TEMPORARILY_LOCKED', 'Temporarily Locked'),
        ('SUSPENDED', 'Account Suspended'),
    ]

    student = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='security_status',
        help_text="Student associated with this security profile."
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        db_index=True,
        help_text="Current account security access state."
    )
    max_allowed_devices = models.PositiveIntegerField(
        default=2,
        help_text="Maximum concurrent registered devices allowed (Default: 2)."
    )
    failed_device_attempts = models.PositiveIntegerField(
        default=0,
        help_text="Cumulative failed or blocked 3rd-device attempts."
    )
    suspicious_flags_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of security anomalies recorded."
    )
    review_reason = models.TextField(
        blank=True,
        help_text="Reason why account was marked for security review or locked."
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    suspended_at = models.DateTimeField(null=True, blank=True)
    reactivated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Account Security Status"
        verbose_name_plural = "Account Security Statuses"

    def __str__(self):
        return f"{self.student.username} - {self.get_status_display()} (Max: {self.max_allowed_devices})"

    @property
    def is_access_allowed(self):
        return self.status in ['ACTIVE', 'SECURITY_REVIEW']

    @property
    def active_device_count(self):
        return self.student.devices.filter(is_active=True).count()


class StudentDevice(models.Model):
    """
    Represents an authorized registered client device for a student.
    Strictly capped at max 2 active devices per student.
    """
    DEVICE_TYPE_CHOICES = [
        ('desktop', 'Desktop / Laptop'),
        ('mobile', 'Smartphone'),
        ('tablet', 'Tablet'),
        ('other', 'Other Device'),
    ]

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='devices',
        db_index=True
    )
    device_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Stable client-generated UUID / browser installation identifier."
    )
    device_name = models.CharField(
        max_length=150,
        help_text="Human-readable device label (e.g., 'Windows 11 Laptop - Chrome')."
    )
    device_type = models.CharField(
        max_length=30,
        choices=DEVICE_TYPE_CHOICES,
        default='desktop'
    )
    operating_system = models.CharField(
        max_length=80,
        blank=True,
        help_text="Detected Operating System (e.g. Windows 11, macOS, Android 14, iOS 17)."
    )
    browser = models.CharField(
        max_length=80,
        blank=True,
        help_text="Detected Web Browser (e.g. Chrome 126, Edge 124, Safari 17)."
    )
    device_fingerprint_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="SHA-256 hash of browser characteristics & risk metrics."
    )
    device_token_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="SHA-256 hash of cryptographically secure server-issued device token."
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP Address observed during most recent device activity."
    )
    user_agent = models.TextField(
        blank=True,
        help_text="Raw browser User-Agent header string."
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="True if this device is authorized and active within the 2-device quota."
    )
    is_blocked = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if device was specifically blocked due to suspicious activity."
    )
    registered_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when device was first registered."
    )
    last_active_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of most recent authorized interaction."
    )
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when device authorization was terminated."
    )
    revocation_reason = models.CharField(
        max_length=255,
        blank=True,
        help_text="Reason for revocation (e.g. Student replacement, Admin audit)."
    )

    class Meta:
        verbose_name = "Student Registered Device"
        verbose_name_plural = "Student Registered Devices"
        ordering = ['-last_active_at']
        indexes = [
            models.Index(fields=['student', 'is_active']),
            models.Index(fields=['student', 'device_id']),
            models.Index(fields=['device_token_hash']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'device_id'],
                name='unique_student_device_id'
            )
        ]

    def __str__(self):
        status_str = "Active" if self.is_active else "Revoked"
        return f"{self.student.username} | {self.device_name} ({self.operating_system}) [{status_str}]"

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Computes SHA-256 hex digest of the raw device token."""
        return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()

    def verify_token(self, raw_token: str) -> bool:
        """Verifies if the supplied raw token matches the stored SHA-256 hash."""
        if not raw_token:
            return False
        return self.device_token_hash == self.hash_token(raw_token)


class DeviceLoginHistory(models.Model):
    """
    Immutable historical audit log of every device access or registration attempt.
    """
    STATUS_CHOICES = [
        ('SUCCESS', 'Successful Login / Verified'),
        ('REGISTERED', 'New Device Registered (Under Limit)'),
        ('BLOCKED_LIMIT', 'Blocked: 2-Device Limit Exceeded'),
        ('BLOCKED_SUSPENDED', 'Blocked: Account Suspended/Locked'),
        ('TOKEN_MISMATCH', 'Blocked: Device Token Verification Failed'),
        ('REVOKED_ACCESS', 'Blocked: Attempt From Revoked Device'),
    ]

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='device_login_history',
        db_index=True
    )
    device = models.ForeignKey(
        StudentDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_records'
    )
    device_id_attempted = models.CharField(max_length=64, blank=True)
    device_name = models.CharField(max_length=150, blank=True)
    device_type = models.CharField(max_length=30, blank=True)
    operating_system = models.CharField(max_length=80, blank=True)
    browser = models.CharField(max_length=80, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, db_index=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Device Login History Record"
        verbose_name_plural = "Device Login History Records"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} - {self.get_status_display()} on {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class SecurityAlert(models.Model):
    """
    System-generated alerts for suspicious login patterns, third device attempts,
    and anti-account sharing anomalies.
    """
    ALERT_TYPES = [
        ('THIRD_DEVICE_ATTEMPT', 'Third Device Login Attempt (Quota Exceeded)'),
        ('FAILED_REGISTRATION_SPIKE', 'Multiple Rapid Failed Device Registrations'),
        ('SUSPICIOUS_IP_CHANGE', 'Suspicious Geographic / IP Shift'),
        ('CONCURRENT_REGISTRATION_RACE', 'Simultaneous Device Registration Detected'),
        ('TOKEN_MISMATCH', 'Device Token Integrity Verification Failed'),
        ('UNUSUAL_ACTIVITY', 'Unusual Account Activity Pattern'),
        ('ACCOUNT_LOCKED', 'Account Temporarily Locked by Security Engine'),
    ]

    RISK_LEVELS = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    ]

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='security_alerts',
        db_index=True
    )
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES, db_index=True)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS, default='MEDIUM', db_index=True)
    device_id_attempted = models.CharField(max_length=64, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    message = models.TextField(help_text="Detailed description of the security event.")
    metadata = models.JSONField(default=dict, blank=True)
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Security Alert"
        verbose_name_plural = "Security Alerts"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.risk_level}] {self.get_alert_type_display()} - {self.student.username}"


class DeviceReplacementRequest(models.Model):
    """
    Formal request submitted by a student to replace an existing registered device
    (e.g., lost phone, upgraded laptop) with admin approval workflow.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Admin Review'),
        ('APPROVED', 'Approved by Admin'),
        ('REJECTED', 'Rejected by Admin'),
    ]

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='device_replacement_requests',
        db_index=True
    )
    device_to_remove = models.ForeignKey(
        StudentDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replacement_targets',
        help_text="Existing device the student wants to unregister/replace."
    )
    new_device_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Name of the new device the student intends to use."
    )
    reason = models.TextField(
        help_text="Explanation provided by the student (e.g., bought a new laptop, old phone broken)."
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Notes recorded by administrator upon review."
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_replacements'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Device Replacement Request"
        verbose_name_plural = "Device Replacement Requests"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} - Replace {self.device_to_remove} [{self.get_status_display()}]"


class AdminSecurityAuditLog(models.Model):
    """
    Immutable audit trail logging every administrative security action.
    """
    ACTION_CHOICES = [
        ('REVOKE_DEVICE', 'Revoked Student Device'),
        ('RESET_ALL_DEVICES', 'Reset All Registered Devices for Student'),
        ('AUTHORIZE_REPLACEMENT', 'Approved Device Replacement Request'),
        ('REJECT_REPLACEMENT', 'Rejected Device Replacement Request'),
        ('LOCK_ACCOUNT', 'Temporarily Locked Student Account'),
        ('SUSPEND_ACCOUNT', 'Suspended Student Account'),
        ('REACTIVATE_ACCOUNT', 'Reactivated Student Account'),
        ('RESOLVE_ALERT', 'Resolved Security Alert'),
        ('UPDATE_SETTINGS', 'Updated Security Quota or Settings'),
    ]

    id = models.BigAutoField(primary_key=True)
    admin_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_security_actions'
    )
    target_student = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_audit_logs'
    )
    action = models.CharField(max_length=60, choices=ACTION_CHOICES, db_index=True)
    reason = models.TextField(help_text="Mandatory explanation for this administrative intervention.")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Admin Security Audit Log"
        verbose_name_plural = "Admin Security Audit Logs"
        ordering = ['-timestamp']

    def __str__(self):
        admin_name = self.admin_user.username if self.admin_user else "System"
        target_name = self.target_student.username if self.target_student else "Global"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {admin_name} -> {self.get_action_display()} on {target_name}"
