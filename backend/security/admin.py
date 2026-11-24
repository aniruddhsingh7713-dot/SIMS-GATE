from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    AccountSecurityStatus,
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)
from .services import (
    revoke_student_device,
    reset_all_student_devices,
    suspend_student_account,
    reactivate_student_account,
    lock_student_account
)


@admin.register(AccountSecurityStatus)
class AccountSecurityStatusAdmin(admin.ModelAdmin):
    list_display = (
        'student_id_display',
        'student_name',
        'student_email',
        'status_badge',
        'active_devices_display',
        'max_allowed_devices',
        'failed_device_attempts',
        'updated_at'
    )
    list_filter = ('status', 'max_allowed_devices')
    search_fields = ('student__username', 'student__email', 'student__first_name', 'student__last_name')
    readonly_fields = ('created_at', 'updated_at', 'locked_at', 'suspended_at', 'reactivated_at')
    actions = ['suspend_accounts', 'reactivate_accounts', 'lock_accounts', 'reset_devices']

    def student_id_display(self, obj):
        return obj.student.id
    student_id_display.short_description = "Student ID"
    student_id_display.admin_order_field = "student__id"

    def student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username
    student_name.short_description = "Student Name"

    def student_email(self, obj):
        return obj.student.email
    student_email.short_description = "Email"

    def status_badge(self, obj):
        colors = {
            'ACTIVE': '#10B981',             # Emerald Green
            'SECURITY_REVIEW': '#F59E0B',     # Amber
            'TEMPORARILY_LOCKED': '#EF4444',  # Red
            'SUSPENDED': '#7F1D1D',           # Dark Crimson
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Security Status"

    def active_devices_display(self, obj):
        cnt = obj.active_device_count
        color = "#10B981" if cnt <= obj.max_allowed_devices else "#EF4444"
        return format_html(
            '<strong style="color: {}; font-size: 14px;">{}/{}</strong>',
            color, cnt, obj.max_allowed_devices
        )
    active_devices_display.short_description = "Active Devices"

    @admin.action(description="🚨 Suspend selected accounts (Block all tests & courses)")
    def suspend_accounts(self, request, queryset):
        for sec in queryset:
            suspend_student_account(
                admin_user=request.user,
                student=sec.student,
                reason="Admin batch suspension action"
            )
        self.message_user(request, f"Successfully suspended {queryset.count()} student account(s).")

    @admin.action(description="✅ Reactivate selected accounts back to ACTIVE")
    def reactivate_accounts(self, request, queryset):
        for sec in queryset:
            reactivate_student_account(
                admin_user=request.user,
                student=sec.student,
                reason="Admin batch reactivation action"
            )
        self.message_user(request, f"Successfully reactivated {queryset.count()} student account(s).")

    @admin.action(description="🔒 Temporarily lock selected accounts")
    def lock_accounts(self, request, queryset):
        for sec in queryset:
            lock_student_account(
                admin_user=request.user,
                student=sec.student,
                reason="Admin batch temporary lock action"
            )
        self.message_user(request, f"Successfully locked {queryset.count()} student account(s).")

    @admin.action(description="🔄 Reset all registered devices for selected students")
    def reset_devices(self, request, queryset):
        total_revoked = 0
        for sec in queryset:
            total_revoked += reset_all_student_devices(
                admin_user=request.user,
                student=sec.student,
                reason="Admin bulk device reset action"
            )
        self.message_user(request, f"Successfully reset {total_revoked} registered devices across {queryset.count()} student(s).")


@admin.register(StudentDevice)
class StudentDeviceAdmin(admin.ModelAdmin):
    list_display = (
        'student_info',
        'purchased_series_display',
        'device_name',
        'device_type_badge',
        'operating_system',
        'browser',
        'ip_address',
        'status_badge',
        'registered_at',
        'last_active_at'
    )
    list_filter = ('is_active', 'device_type', 'operating_system', 'is_blocked')
    search_fields = (
        'student__username', 'student__email', 'student__first_name',
        'student__last_name', 'device_name', 'ip_address', 'device_id'
    )
    readonly_fields = (
        'device_id', 'device_fingerprint_hash', 'device_token_hash',
        'registered_at', 'last_active_at', 'revoked_at'
    )
    actions = ['revoke_selected_devices']

    def student_info(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username
        return format_html(
            '<div><strong>{}</strong><br><small style="color: #6B7280;">{} (ID: {})</small></div>',
            name, obj.student.email, obj.student.id
        )
    student_info.short_description = "Student Details"

    def purchased_series_display(self, obj):
        from courses.models import Order
        purchases = Order.objects.filter(user=obj.student, status='PAID').select_related('course')
        titles = [p.course.title for p in purchases if p.course][:2]
        if not titles:
            return format_html('<span style="color: #9CA3AF;">None / Free</span>')
        return format_html('<small style="color: #047857; font-weight: 600;">{}</small>', ", ".join(titles))
    purchased_series_display.short_description = "Purchased Test Series"

    def device_type_badge(self, obj):
        icons = {
            'desktop': '💻 Laptop/Desktop',
            'mobile': '📱 Smartphone',
            'tablet': '📟 Tablet',
            'other': '🖥️ Other'
        }
        return icons.get(obj.device_type, obj.device_type)
    device_type_badge.short_description = "Device Type"

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="background-color: #10B981; color: white; padding: 3px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">Active</span>')
        return format_html('<span style="background-color: #EF4444; color: white; padding: 3px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">Revoked</span>')
    status_badge.short_description = "Registration Status"

    @admin.action(description="🚫 Revoke selected devices (Terminates access immediately)")
    def revoke_selected_devices(self, request, queryset):
        for dev in queryset:
            revoke_student_device(
                admin_user=request.user,
                student=dev.student,
                device_id=dev.device_id,
                reason="Admin mass revocation action"
            )
        self.message_user(request, f"Successfully revoked {queryset.count()} device(s).")


@admin.register(DeviceLoginHistory)
class DeviceLoginHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'device_name_display',
        'status_badge',
        'ip_address',
        'operating_system',
        'browser',
        'created_at'
    )
    list_filter = ('status', 'operating_system', 'browser')
    search_fields = ('student__username', 'student__email', 'device_name', 'ip_address')
    readonly_fields = [f.name for f in DeviceLoginHistory._meta.fields]

    def device_name_display(self, obj):
        return obj.device_name or (obj.device.device_name if obj.device else "Unknown Attempt")
    device_name_display.short_description = "Attempted Device"

    def status_badge(self, obj):
        colors = {
            'SUCCESS': '#10B981',
            'REGISTERED': '#3B82F6',
            'BLOCKED_LIMIT': '#EF4444',
            'BLOCKED_SUSPENDED': '#7F1D1D',
            'TOKEN_MISMATCH': '#F59E0B',
            'REVOKED_ACCESS': '#9CA3AF',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Attempt Result"


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'risk_badge',
        'alert_type_display',
        'student',
        'ip_address',
        'resolution_status'
    )
    list_filter = ('is_resolved', 'risk_level', 'alert_type')
    search_fields = ('student__username', 'student__email', 'message', 'ip_address')
    readonly_fields = ('created_at',)
    actions = ['mark_as_resolved']

    def alert_type_display(self, obj):
        return obj.get_alert_type_display()
    alert_type_display.short_description = "Security Alert Type"

    def risk_badge(self, obj):
        colors = {
            'LOW': '#10B981',
            'MEDIUM': '#F59E0B',
            'HIGH': '#EF4444',
            'CRITICAL': '#7F1D1D',
        }
        color = colors.get(obj.risk_level, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">{}</span>',
            color, obj.risk_level
        )
    risk_badge.short_description = "Risk Level"

    def resolution_status(self, obj):
        if obj.is_resolved:
            return format_html('<span style="color: #10B981; font-weight: bold;">✓ Resolved</span>')
        return format_html('<span style="color: #EF4444; font-weight: bold;">⚠ Unresolved</span>')
    resolution_status.short_description = "Status"

    @admin.action(description="✓ Mark selected alerts as resolved")
    def mark_as_resolved(self, request, queryset):
        queryset.update(
            is_resolved=True,
            resolved_by=request.user,
            resolved_at=timezone.now(),
            resolution_notes=f"Resolved via Django Admin by {request.user.username}"
        )
        self.message_user(request, f"Marked {queryset.count()} alert(s) as resolved.")


@admin.register(DeviceReplacementRequest)
class DeviceReplacementRequestAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'device_to_remove',
        'new_device_name',
        'reason_excerpt',
        'status_badge',
        'created_at'
    )
    list_filter = ('status',)
    search_fields = ('student__username', 'student__email', 'reason', 'new_device_name')
    actions = ['approve_requests', 'reject_requests']

    def reason_excerpt(self, obj):
        return (obj.reason[:60] + '...') if len(obj.reason) > 60 else obj.reason
    reason_excerpt.short_description = "Reason"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#F59E0B',
            'APPROVED': '#10B981',
            'REJECTED': '#EF4444',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"

    @admin.action(description="✅ Approve selected device replacement requests")
    def approve_requests(self, request, queryset):
        from .services import process_device_replacement_request
        for req in queryset.filter(status='PENDING'):
            process_device_replacement_request(
                admin_user=request.user,
                request_id=req.id,
                approve=True,
                notes=f"Approved by {request.user.username}"
            )
        self.message_user(request, "Approved selected replacement requests.")

    @admin.action(description="❌ Reject selected device replacement requests")
    def reject_requests(self, request, queryset):
        from .services import process_device_replacement_request
        for req in queryset.filter(status='PENDING'):
            process_device_replacement_request(
                admin_user=request.user,
                request_id=req.id,
                approve=False,
                notes=f"Rejected by {request.user.username}"
            )
        self.message_user(request, "Rejected selected replacement requests.")


@admin.register(AdminSecurityAuditLog)
class AdminSecurityAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'timestamp',
        'admin_user',
        'action_badge',
        'target_student',
        'reason'
    )
    list_filter = ('action',)
    search_fields = ('admin_user__username', 'target_student__username', 'reason')
    readonly_fields = [f.name for f in AdminSecurityAuditLog._meta.fields]

    def action_badge(self, obj):
        return format_html(
            '<span style="background-color: #374151; color: #F3F4F6; padding: 3px 8px; border-radius: 8px; font-weight: bold; font-size: 11px;">{}</span>',
            obj.get_action_display()
        )
    action_badge.short_description = "Action"
