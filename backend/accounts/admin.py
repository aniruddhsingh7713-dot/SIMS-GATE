from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'SIMS Student Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_phone', 'get_branch', 'is_staff', 'is_superuser')

    def get_phone(self, instance):
        return getattr(instance.profile, 'phone', '') if hasattr(instance, 'profile') else ''
    get_phone.short_description = 'Phone / WhatsApp'

    def get_branch(self, instance):
        return getattr(instance.profile, 'target_branch', '') if hasattr(instance, 'profile') else ''
    get_branch.short_description = 'Target Branch'

    def has_delete_permission(self, request, obj=None):
        # Prevent the active logged-in user or superuser 'admin' from being deleted
        if obj is not None:
            if obj.id == request.user.id or obj.username == "admin" or (obj.is_superuser and request.user.username != "admin"):
                return False
        return super().has_delete_permission(request, obj)

    def delete_model(self, request, obj):
        if obj.id == request.user.id or obj.username == "admin" or obj.is_superuser:
            self.message_user(
                request,
                f"🛡️ Security Protection: The account '{obj.username}' is a protected admin account and cannot be deleted.",
                level=messages.ERROR
            )
            return
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        # Identify protected users (logged-in user, username 'admin', superusers)
        protected_users = queryset.filter(id=request.user.id) | queryset.filter(username="admin") | queryset.filter(is_superuser=True)
        to_delete = queryset.exclude(id__in=protected_users.values_list("id", flat=True))

        if protected_users.exists():
            names = ", ".join(list(protected_users.values_list("username", flat=True)))
            self.message_user(
                request,
                f"🛡️ Protected account(s) [{names}] were preserved and cannot be deleted while logged in. Your admin session remains active.",
                level=messages.WARNING
            )

        if to_delete.exists():
            count = to_delete.count()
            to_delete.delete()
            self.message_user(
                request,
                f"Successfully deleted {count} selected user(s).",
                level=messages.SUCCESS
            )
        elif not protected_users.exists():
            self.message_user(request, "No records to delete.", level=messages.INFO)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'target_branch', 'target_exam', 'is_onboarded', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone', 'target_branch')
    list_filter = ('target_branch', 'target_exam', 'is_onboarded')

    def has_delete_permission(self, request, obj=None):
        if obj is not None and (obj.user.id == request.user.id or obj.user.username == "admin"):
            return False
        return super().has_delete_permission(request, obj)

    def delete_model(self, request, obj):
        if obj.user.id == request.user.id or obj.user.username == "admin":
            self.message_user(request, "🛡️ Cannot delete active admin profile.", level=messages.ERROR)
            return
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        protected = queryset.filter(user=request.user) | queryset.filter(user__username="admin")
        to_delete = queryset.exclude(id__in=protected.values_list("id", flat=True))
        if protected.exists():
            self.message_user(request, "🛡️ Admin profile is protected and was not deleted.", level=messages.WARNING)
        if to_delete.exists():
            count = to_delete.count()
            to_delete.delete()
            self.message_user(request, f"Successfully deleted {count} profile(s).", level=messages.SUCCESS)


# Re-register UserAdmin
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, UserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
