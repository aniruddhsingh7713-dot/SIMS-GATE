from django.contrib import admin, messages
from django.urls import reverse, path
from django.utils.html import format_html, mark_safe
from django.db import transaction
from django.db.models import Q
from django.shortcuts import render, redirect
from django.http import JsonResponse
from datetime import datetime, timedelta
from .models import (
    Course, CourseModule, CourseLecture, Order, Payment,
    TestSeries, Faculty, Batch, StudentEnrollment,
    TimetableSlot, LiveLecture, TestSeriesItem, TestQuestion, StudentTestAttempt, StudyMaterial,
    DoubtQuery, FacultyAvailability, DailyChallengeQuestion, QuestionPaperImportJob,
    TestSeriesPortalTest, CourseDashboardTest, Exam, SiteSettings
)


import csv
from django.http import HttpResponse

@admin.action(description="🗑️ Delete Selected Records (Bulk Delete)")
def bulk_delete_selected_action(modeladmin, request, queryset):
    count = queryset.count()
    queryset.delete()
    modeladmin.message_user(request, f"Successfully deleted {count} selected records.", messages.SUCCESS)


@admin.action(description="⚠️ Delete ALL Records in this Table (Wipe All)")
def wipe_all_table_records_action(modeladmin, request, queryset):
    total = modeladmin.model.objects.all().count()
    modeladmin.model.objects.all().delete()
    modeladmin.message_user(request, f"Successfully cleared all {total} records from this table.", messages.WARNING)


@admin.action(description="✓ Activate Selected Records")
def bulk_activate_action(modeladmin, request, queryset):
    count = 0
    if hasattr(modeladmin.model, 'is_active'):
        count = queryset.update(is_active=True)
    modeladmin.message_user(request, f"Activated {count} record(s).", messages.SUCCESS)


@admin.action(description="✕ Deactivate Selected Records")
def bulk_deactivate_action(modeladmin, request, queryset):
    count = 0
    if hasattr(modeladmin.model, 'is_active'):
        count = queryset.update(is_active=False)
    modeladmin.message_user(request, f"Deactivated {count} record(s).", messages.SUCCESS)


@admin.action(description="📋 Duplicate Selected Records")
def bulk_duplicate_action(modeladmin, request, queryset):
    import uuid as _uuid
    count = 0
    for obj in queryset:
        obj.pk = None
        if hasattr(obj, 'title'):
            obj.title = f"{obj.title} (Copy)"
        elif hasattr(obj, 'name'):
            obj.name = f"{obj.name} (Copy)"
        if hasattr(obj, 'slug'):
            obj.slug = f"{obj.slug}-copy-{_uuid.uuid4().hex[:6]}"
        obj.save()
        count += 1
    modeladmin.message_user(request, f"Successfully duplicated {count} record(s).", messages.SUCCESS)


@admin.action(description="📥 Export Selected as CSV")
def export_as_csv_action(modeladmin, request, queryset):
    meta = modeladmin.model._meta
    field_names = [field.name for field in meta.fields]
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={meta.object_name}_export.csv'
    writer = csv.writer(response)
    writer.writerow(field_names)
    for obj in queryset:
        writer.writerow([getattr(obj, field) for field in field_names])
    return response


admin.site.add_action(bulk_activate_action, 'bulk_activate')
admin.site.add_action(bulk_deactivate_action, 'bulk_deactivate')
admin.site.add_action(bulk_duplicate_action, 'bulk_duplicate')
admin.site.add_action(export_as_csv_action, 'export_as_csv')




class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1
    show_change_link = True


class CourseLectureInline(admin.TabularInline):
    model = CourseLecture
    extra = 1
    show_change_link = True


class TestSeriesItemInline(admin.TabularInline):
    model = TestSeriesItem
    extra = 1
    fields = ("order", "title", "branch", "test_type", "total_questions", "total_marks", "duration_minutes", "test_status", "visibility_status", "is_active")
    show_change_link = True


class BaseProgramAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "branch",
        "exam_name",
        "price",
        "duration",
        "total_lectures",
        "is_active",
        "row_actions",
    )
    list_display_links = ("title",)
    list_filter = ("category", "branch", "is_active", "exam_name")
    search_fields = ("title", "description", "exam_name", "slug")
    prepopulated_fields = {"slug": ("title",)}
    list_per_page = 25
    ordering = ("category", "title")
    list_editable = ("price", "is_active")
    readonly_fields = ("created_at",)
    show_full_result_count = True

    fieldsets = (
        (
            "Program Information",
            {
                "fields": (
                    ("title", "slug"),
                    ("category", "branch", "exam_name"),
                    "description",
                ),
            },
        ),
        (
            "Pricing & Delivery Ledger",
            {
                "fields": (
                    ("price", "duration", "total_lectures"),
                    ("rating", "students_enrolled"),
                    "features",
                    "thumbnail_url",
                    "is_active",
                ),
            },
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("created_at",),
            },
        ),
    )

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit this record">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete this record">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )

    def has_delete_permission(self, request, obj=None):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_add_permission(self, request):
        return True


@admin.register(Course)
class CourseAdmin(BaseProgramAdmin):
    inlines = [CourseModuleInline, TestSeriesItemInline]
    actions = ("delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "publish_courses", "unpublish_courses")

    @admin.action(description="Publish selected courses")
    def publish_courses(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"Successfully published {count} course(s).")

    @admin.action(description="Unpublish selected courses")
    def unpublish_courses(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"Successfully unpublished {count} course(s).")


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order", "lecture_count", "row_actions")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    inlines = [CourseLectureInline]
    ordering = ("course", "order")

    def lecture_count(self, obj):
        return obj.lectures.count()
    lecture_count.short_description = "Lectures"

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit module">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete module">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )


@admin.register(CourseLecture)
class CourseLectureAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "course", "duration", "is_preview_free", "order", "is_active", "row_actions")
    list_filter = ("is_preview_free", "is_active", "course")
    search_fields = ("title", "course__title", "module__title")
    list_editable = ("is_preview_free", "order", "is_active")
    ordering = ("course", "module", "order")

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit lecture">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete lecture">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )


@admin.register(TestSeries)
class TestSeriesAdmin(BaseProgramAdmin):
    list_display = (
        "title",
        "branch",
        "price",
        "tests_count_display",
        "bulk_import_btn",
        "is_active",
        "row_actions",
    )
    inlines = [TestSeriesItemInline]
    actions = ("delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "publish_tests", "unpublish_tests")

    @admin.display(description="Papers in Series")
    def tests_count_display(self, obj):
        count = obj.test_items.filter(is_active=True).count()
        return format_html(
            '<span style="font-weight:700; color:{};">{} Paper{} Active</span>',
            "#059669" if count > 0 else "#D97706",
            count,
            "s" if count != 1 else ""
        )

    @admin.display(description="Add Next Paper")
    def bulk_import_btn(self, obj):
        active_cnt = obj.test_items.filter(is_active=True).count()
        next_no = active_cnt + 1
        url = f"/admin/courses/testquestion/bulk-import/?course_id={obj.id}"
        return format_html(
            '<a href="{}" style="padding:5px 12px; background:#0F4336; color:#FFF; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:5px; box-shadow:0 1px 3px rgba(15,67,54,0.25);">'
            '<span>📥 Bulk Import (Test #{})</span>'
            '</a>',
            url,
            next_no
        )

    @admin.action(description="Publish selected test series")
    def publish_tests(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"Successfully published {count} test series.")

    @admin.action(description="Unpublish selected test series")
    def unpublish_tests(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"Successfully unpublished {count} test series.")


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "designation",
        "qualification",
        "experience_years",
        "badge",
        "order",
        "is_active",
        "row_actions",
    )
    list_display_links = ("name",)
    list_editable = ("order", "is_active")
    list_filter = ("is_active", "designation")
    search_fields = ("name", "qualification", "specialization", "bio", "achievements")
    ordering = ("order", "name")
    list_per_page = 25
    readonly_fields = ("created_at",)

    fieldsets = (
        (
            "Faculty Pedigree",
            {
                "fields": (
                    ("name", "designation"),
                    ("qualification", "experience_years"),
                    "badge",
                ),
            },
        ),
        (
            "Academic Specialization & Biography",
            {
                "fields": (
                    "specialization",
                    "bio",
                    "achievements",
                    "image_url",
                ),
            },
        ),
        (
            "Settings & Ordering",
            {
                "fields": (
                    ("order", "is_active"),
                    "created_at",
                ),
            },
        ),
    )

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit faculty member">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete faculty member">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "branch",
        "target_exam",
        "batch_type",
        "timings",
        "seats_status",
        "fee",
        "order",
        "is_active",
        "row_actions",
    )
    list_display_links = ("name",)
    list_editable = ("seats_status", "order", "is_active")
    list_filter = ("branch", "target_exam", "batch_type", "seats_status", "is_active")
    search_fields = ("name", "code", "target_exam", "venue", "timings")
    ordering = ("order", "target_exam", "name")
    list_per_page = 25
    readonly_fields = ("created_at",)

    fieldsets = (
        (
            "Batch & Cohort Identity",
            {
                "fields": (
                    ("name", "code"),
                    ("branch", "target_exam", "batch_type"),
                ),
            },
        ),
        (
            "Schedule & Venue",
            {
                "fields": (
                    ("start_date", "timings"),
                    ("days", "total_hours"),
                    ("syllabus_completion", "venue"),
                ),
            },
        ),
        (
            "Enrollment & Tuition",
            {
                "fields": (
                    ("seats_status", "seats_remaining"),
                    ("fee", "installment_info"),
                ),
            },
        ),
        (
            "Settings & Ordering",
            {
                "fields": (
                    ("order", "is_active"),
                    "created_at",
                ),
            },
        ),
    )

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit batch">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete batch">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "course_title", "branch", "progress_percent", "attendance_percent", "is_active", "created_at", "row_actions")
    list_filter = ("is_active", "branch", "course")
    search_fields = ("user__username", "user__first_name", "user__email", "course_title", "course__title")
    list_editable = ("progress_percent", "attendance_percent", "is_active")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "grant_active_access", "revoke_access"]

    @admin.action(description="Activate enrollment for selected students")
    def grant_active_access(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"Activated {count} student enrollment(s).")

    @admin.action(description="Revoke enrollment for selected students")
    def revoke_access(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"Revoked access for {count} student enrollment(s).")

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete">Revoke</a>'
            '</div>',
            change_url,
            delete_url,
        )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "amount", "currency", "status", "razorpay_order_id", "created_at", "row_actions")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("id", "user__username", "user__email", "course__title", "razorpay_order_id")
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "mark_as_completed", "mark_as_cancelled"]

    @admin.action(description="Mark selected orders as COMPLETED (and activate course enrollment)")
    def mark_as_completed(self, request, queryset):
        count = 0
        for order in queryset:
            order.status = "COMPLETED"
            order.save()
            StudentEnrollment.objects.update_or_create(
                user=order.user,
                course=order.course,
                defaults={
                    "order": order,
                    "course_title": order.course.title,
                    "is_active": True
                }
            )
            count += 1
        self.message_user(request, f"Marked {count} order(s) as COMPLETED and activated enrollment.")

    @admin.action(description="Mark selected orders as FAILED / Cancelled")
    def mark_as_cancelled(self, request, queryset):
        count = queryset.update(status="FAILED")
        self.message_user(request, f"Marked {count} order(s) as FAILED.")

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit">Details</a>'
            '</div>',
            change_url,
        )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("razorpay_payment_id", "order", "user", "amount", "status", "payment_method", "created_at", "row_actions")
    list_filter = ("status", "created_at")
    search_fields = ("razorpay_payment_id", "razorpay_order_id", "user__username", "user__email")
    readonly_fields = ("created_at",)
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit">Receipt</a>'
            '</div>',
            change_url,
        )


@admin.register(TimetableSlot)
class TimetableSlotAdmin(admin.ModelAdmin):
    change_list_template = "admin/courses/timetableslot/change_list.html"
    list_display = (
        "week_number", "branch", "day", "order", "time_slot_label",
        "slot_type", "subject", "faculty_name", "slot_date", "is_active"
    )
    list_filter = ("branch", "week_number", "day", "slot_type", "category", "is_active")
    search_fields = ("subject", "faculty_name", "branch", "topic_description", "batch_code")
    list_editable = ("time_slot_label", "slot_type", "subject", "faculty_name", "is_active")
    ordering = ("week_number", "branch", "day", "order")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}

        selected_branch = request.GET.get("branch", "CSE").strip().upper()
        if not selected_branch:
            selected_branch = "CSE"

        try:
            selected_week = int(request.GET.get("week", "1"))
        except (ValueError, TypeError):
            selected_week = 1

        days = [
            ("MON", "Monday"),
            ("TUE", "Tuesday"),
            ("WED", "Wednesday"),
            ("THU", "Thursday"),
            ("FRI", "Friday"),
            ("SAT", "Saturday"),
        ]
        slots_meta = [
            {"order": 1, "label": "MORNING CORE", "time": "07:30 AM – 10:30 AM"},
            {"order": 2, "label": "CORE TRACK", "time": "11:00 AM – 02:00 PM"},
            {"order": 3, "label": "SPECIAL / CBT TEST", "time": "03:00 PM – 06:00 PM"},
        ]

        added_slots = TimetableSlot.objects.filter(
            branch=selected_branch,
            week_number=selected_week,
            is_active=True
        )

        grid = {}
        for sm in slots_meta:
            grid[sm["order"]] = {}
            for d_code, _ in days:
                grid[sm["order"]][d_code] = None

        week_range_label = "Oct 20 – Oct 25, 2026"
        day_dates = {}
        for s in added_slots:
            if s.order in grid:
                grid[s.order][s.day] = s
            if s.week_range_label:
                week_range_label = s.week_range_label
            if s.slot_date and s.day not in day_dates:
                day_dates[s.day] = s.slot_date

        visual_matrix = []
        for sm in slots_meta:
            row_cells = []
            for d_code, d_name in days:
                slot_obj = grid[sm["order"]].get(d_code)
                row_cells.append({
                    "day_code": d_code,
                    "day_name": d_name,
                    "slot": slot_obj,
                })
            visual_matrix.append({
                "meta": sm,
                "cells": row_cells,
            })

        branches_list = [
            ("CSE", "Computer Science (CSE)"),
            ("DA", "Data Science & AI (DA)"),
            ("CE", "Civil Engineering (CE)"),
            ("ME", "Mechanical Engineering (ME)"),
            ("EE", "Electrical (EE)"),
            ("ECE", "Electronics (ECE)"),
            ("CH", "Chemical (CH)"),
            ("CY", "Chemistry (CY)"),
            ("GEN", "General / Foundation"),
        ]

        extra_context.update({
            "visual_matrix": visual_matrix,
            "matrix_days": [(d_code, d_name, day_dates.get(d_code, "")) for d_code, d_name in days],
            "slots_meta": slots_meta,
            "branches_list": branches_list,
            "selected_branch": selected_branch,
            "selected_week": selected_week,
            "week_range_label": week_range_label,
            "total_slots_found": added_slots.count(),
        })

        return super().changelist_view(request, extra_context=extra_context)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "matrix-builder/",
                self.admin_site.admin_view(self.matrix_builder_view),
                name="courses_timetableslot_matrix_builder",
            ),
            path(
                "matrix-builder/load-slots/",
                self.admin_site.admin_view(self.matrix_builder_load_slots),
                name="courses_timetableslot_matrix_load",
            ),
        ]
        return custom_urls + urls

    def matrix_builder_view(self, request):
        branches = [
            ("CSE", "Computer Science & IT (CSE)"),
            ("DA", "Data Science & AI (DA)"),
            ("CE", "Civil Engineering (CE)"),
            ("ME", "Mechanical Engineering (ME)"),
            ("EE", "Electrical Engineering (EE)"),
            ("ECE", "Electronics & Communication (ECE)"),
            ("CH", "Chemical Engineering (CH)"),
            ("CY", "Chemistry & Allied Sciences (CY)"),
            ("GEN", "General / Foundation / School Science"),
            ("ALL", "All Streams / Common"),
        ]

        faculties = list(Faculty.objects.filter(is_active=True).values("id", "name", "specialization"))
        if not faculties:
            faculties = [
                {"id": 1, "name": "Prof. Aniruddh Singh", "specialization": "Algorithms & TOC"},
                {"id": 2, "name": "Dr. S. Sharma", "specialization": "Mathematics"},
                {"id": 3, "name": "Prof. K. Verma", "specialization": "Systems & Networks"},
            ]

        days = [
            ("MON", "Monday"),
            ("TUE", "Tuesday"),
            ("WED", "Wednesday"),
            ("THU", "Thursday"),
            ("FRI", "Friday"),
            ("SAT", "Saturday"),
        ]

        slots = [
            {"order": 1, "label": "MORNING CORE", "start_time": "07:30 AM", "end_time": "10:30 AM", "default_cat": "TOC_DISCRETE"},
            {"order": 2, "label": "CORE TRACK", "start_time": "11:00 AM", "end_time": "02:00 PM", "default_cat": "ALGO_DSA"},
            {"order": 3, "label": "SPECIAL / CBT TEST", "start_time": "03:00 PM", "end_time": "06:00 PM", "default_cat": "TEST"},
        ]

        if request.method == "POST":
            branch = request.POST.get("branch", "CSE").strip().upper()
            try:
                week_number = int(request.POST.get("week_number", "1"))
            except ValueError:
                week_number = 1

            start_date_str = request.POST.get("start_date", "").strip()
            week_range_label = request.POST.get("week_range_label", "").strip()
            replace_existing = request.POST.get("replace_existing") == "1"

            start_dt = None
            if start_date_str:
                try:
                    start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
                except ValueError:
                    start_dt = None

            if not start_dt:
                start_dt = datetime.now()

            if not week_range_label:
                end_dt = start_dt + timedelta(days=5)
                week_range_label = f"{start_dt.strftime('%b %d')} – {end_dt.strftime('%b %d, %Y')}"

            day_dates = {}
            for i, (day_code, _) in enumerate(days):
                day_dt = start_dt + timedelta(days=i)
                day_dates[day_code] = day_dt.strftime("%b %d")

            new_slots = []
            for day_code, _ in days:
                for slot_meta in slots:
                    order = slot_meta["order"]
                    prefix = f"slot_{day_code}_{order}"

                    slot_type = request.POST.get(f"{prefix}_type", "CLASS").strip()
                    if slot_type == "OFF":
                        continue

                    subject = request.POST.get(f"{prefix}_subject", "").strip()
                    faculty = request.POST.get(f"{prefix}_faculty", "").strip()
                    room = request.POST.get(f"{prefix}_room", "Classroom 3B").strip()
                    time_label = request.POST.get(f"{prefix}_time_label", slot_meta["label"]).strip()
                    start_time = request.POST.get(f"{prefix}_start_time", slot_meta["start_time"]).strip()
                    end_time = request.POST.get(f"{prefix}_end_time", slot_meta["end_time"]).strip()
                    category = request.POST.get(f"{prefix}_category", slot_meta["default_cat"]).strip()

                    if not subject and slot_type != "SELF_STUDY":
                        continue

                    if not subject and slot_type == "SELF_STUDY":
                        subject = "Self-Study & Revision Session"
                        faculty = "Self-Paced / Mentor Available"

                    new_slots.append(TimetableSlot(
                        branch=branch,
                        batch_code=f"STH6-2026-{branch}-A1",
                        week_number=week_number,
                        week_range_label=week_range_label,
                        slot_date=day_dates.get(day_code, "Oct 20"),
                        day=day_code,
                        order=order,
                        time_slot_label=time_label,
                        start_time=start_time,
                        end_time=end_time,
                        slot_type=slot_type,
                        category=category,
                        subject=subject,
                        faculty_name=faculty or "Prof. Aniruddh Singh",
                        room_or_mode=room,
                        is_active=True,
                    ))

            with transaction.atomic():
                if replace_existing:
                    TimetableSlot.objects.filter(branch=branch, week_number=week_number).delete()
                if new_slots:
                    TimetableSlot.objects.bulk_create(new_slots)

            messages.success(
                request,
                f"🎉 Successfully published {len(new_slots)} timetable slots for Branch {branch} (Week {week_number}: {week_range_label})!"
            )
            return redirect(f"/admin/courses/timetableslot/?branch={branch}&week_number={week_number}")

        default_start_date = datetime.now().strftime("%Y-%m-%d")
        context = {
            **self.admin_site.each_context(request),
            "title": "Interactive Weekly Timetable Matrix Builder",
            "branches": branches,
            "faculties": faculties,
            "days": days,
            "slots": slots,
            "default_start_date": default_start_date,
            "opts": self.model._meta,
        }
        return render(request, "admin/courses/timetableslot/matrix_builder.html", context)

    def matrix_builder_load_slots(self, request):
        branch = request.GET.get("branch", "CSE").strip().upper()
        try:
            week_number = int(request.GET.get("week", "1"))
        except ValueError:
            week_number = 1

        slots = TimetableSlot.objects.filter(branch=branch, week_number=week_number, is_active=True)
        data = []
        for s in slots:
            data.append({
                "day": s.day,
                "order": s.order,
                "slot_type": s.slot_type,
                "subject": s.subject,
                "faculty_name": s.faculty_name,
                "room_or_mode": s.room_or_mode,
                "time_slot_label": s.time_slot_label,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "category": s.category,
                "slot_date": s.slot_date,
                "week_range_label": s.week_range_label,
            })
        return JsonResponse({"success": True, "slots": data, "count": len(data)})


@admin.register(LiveLecture)
class LiveLectureAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "branch",
        "target_exam",
        "subject",
        "faculty_name",
        "status",
        "scheduled_time",
        "duration",
        "order",
        "is_active",
        "row_actions",
    )
    list_display_links = ("title",)
    list_filter = ("branch", "status", "target_exam", "is_active")
    search_fields = ("title", "subject", "faculty_name", "description", "video_url")
    list_editable = ("status", "scheduled_time", "order", "is_active")
    actions = ("delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "mark_as_live", "mark_as_upcoming", "mark_as_recorded")

    fieldsets = (
        (
            "Lecture & Topic Details",
            {
                "fields": (
                    ("title", "subject"),
                    ("faculty_name", "branch", "target_exam"),
                    "description",
                ),
            },
        ),
        (
            "Live Stream & Schedule",
            {
                "fields": (
                    ("status", "scheduled_time", "duration"),
                    "video_url",
                    "room_or_mode",
                ),
                "description": "Enter YouTube Live URL, unlisted stream or embed link. Students enrolled in the selected branch will automatically receive the live stream on their dashboard.",
            },
        ),
        (
            "Materials & Resources",
            {
                "fields": (
                    ("notes_url", "thumbnail_url"),
                ),
            },
        ),
        (
            "Visibility & Ordering",
            {
                "fields": (
                    ("order", "is_active"),
                ),
            },
        ),
    )

    @admin.action(description="🔴 Start Live Stream Now (Mark selected as LIVE)")
    def mark_as_live(self, request, queryset):
        count = queryset.update(status="LIVE", is_active=True)
        self.message_user(request, f"🔴 {count} lecture(s) marked as LIVE. Enrolled students can now watch live from their dashboard.")

    @admin.action(description="📅 Schedule as Upcoming")
    def mark_as_upcoming(self, request, queryset):
        count = queryset.update(status="UPCOMING")
        self.message_user(request, f"📅 {count} lecture(s) scheduled as Upcoming.")

    @admin.action(description="📹 End Live Stream & Archive (Mark as Recorded)")
    def mark_as_recorded(self, request, queryset):
        count = queryset.update(status="RECORDED")
        self.message_user(request, f"📹 {count} lecture(s) archived as Recorded.")

    @admin.display(description="Actions")
    def row_actions(self, obj):
        opts = obj._meta
        change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
        delete_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_delete", args=[obj.pk])
        return format_html(
            '<div class="sims-row-actions">'
            '<a href="{}" class="sims-action-btn sims-btn-edit" title="Edit lecture details">Edit</a>'
            '<a href="{}" class="sims-action-btn sims-btn-delete" title="Delete lecture">Delete</a>'
            '</div>',
            change_url,
            delete_url,
        )


class TestQuestionInline(admin.TabularInline):
    model = TestQuestion
    extra = 1
    fields = ("question_number", "section", "question_type", "question_text", "marks", "negative_marks", "correct_answer", "order")


class BaseTestItemAdmin(admin.ModelAdmin):
    list_display = ("title", "branch", "course", "test_destination", "test_status", "visibility_status", "questions_count", "bulk_import_link", "duration_minutes", "order", "is_active")
    list_filter = ("test_status", "visibility_status", "branch", "course", "test_destination", "is_active", "test_type")
    search_fields = ("title", "test_type", "branch", "course__title")
    list_editable = ("test_status", "visibility_status", "order", "is_active")
    inlines = [TestQuestionInline]
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]

    def questions_count(self, obj):
        count = obj.questions.count()
        return format_html(
            '<span style="font-weight:700;color:{};">{} Qs</span>',
            "#059669" if count > 0 else "#D97706",
            count if count > 0 else f"{obj.total_questions} (Target)"
        )
    questions_count.short_description = "Questions"

    def bulk_import_link(self, obj):
        course_param = f"&course_id={obj.course_id}" if obj.course_id else ""
        url = f"/admin/courses/testquestion/bulk-import/?test_id={obj.id}{course_param}"
        return format_html(
            '<a href="{}" style="padding:4px 10px; background:#0F4336; color:#FFF; border-radius:6px; font-size:11.5px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 3px rgba(15,67,54,0.2);">'
            '<span>📥 Import Qs</span>'
            '</a>',
            url
        )
    bulk_import_link.short_description = "Quick Import"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:test_id>/preview-as-student/', self.admin_site.admin_view(self.preview_as_student_view), name=f'{self.model._meta.model_name}_preview_as_student'),
        ]
        return custom_urls + urls

    def preview_as_student_view(self, request, test_id):
        from django.shortcuts import get_object_or_404, render
        test = get_object_or_404(self.model, pk=test_id)
        questions = test.questions.order_by('order', 'id')
        context = {
            **self.admin_site.each_context(request),
            'test': test,
            'questions': questions,
            'title': f'Student Preview — {test.title}',
            'is_preview': True,
        }
        return render(request, 'admin/courses/testseriesitem/student_preview.html', context)

    fieldsets = (
        ("Basic Identification", {
            "fields": ("title", "subject", "topic", "branch", "course", "test_destination", "test_type", "language")
        }),
        ("Access Control & Publishing (Security Rules)", {
            "fields": ("test_status", "visibility_status", "start_date", "end_date", "is_active")
        }),
        ("Exam Parameters & Scoring", {
            "fields": ("duration_minutes", "total_questions", "total_marks", "negative_marking", "due_date")
        }),
        ("Instructions & Examination Assets", {
            "fields": ("instructions", "paper_pdf_url", "solution_pdf_url", "test_link")
        }),
        ("Legacy Performance Cache", {
            "fields": ("status", "score_obtained", "rank_achieved", "order")
        }),
    )


@admin.register(TestSeriesPortalTest)
class TestSeriesPortalTestAdmin(BaseTestItemAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(test_destination="TEST_SERIES_PORTAL")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "course":
            kwargs["queryset"] = Course.objects.filter(
                Q(category="TEST_SERIES") | Q(title__icontains="Test Series") | Q(title__icontains="CBT") | Q(slug__icontains="test-series")
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        obj.test_destination = "TEST_SERIES_PORTAL"
        super().save_model(request, obj, form, change)


@admin.register(CourseDashboardTest)
class CourseDashboardTestAdmin(BaseTestItemAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(test_destination="COURSE_DASHBOARD")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "course":
            kwargs["queryset"] = Course.objects.exclude(
                Q(category="TEST_SERIES") | Q(title__icontains="Test Series") | Q(slug__icontains="test-series")
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        obj.test_destination = "COURSE_DASHBOARD"
        super().save_model(request, obj, form, change)


@admin.register(TestSeriesItem)
class TestSeriesItemAdmin(BaseTestItemAdmin):
    pass


@admin.register(StudentTestAttempt)
class StudentTestAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "test", "status", "score", "total_marks", "accuracy_percent", "correct_count", "incorrect_count", "time_taken_seconds", "submitted_at")
    list_filter = ("status", "test__branch", "test__course")
    search_fields = ("user__username", "user__email", "test__title")
    readonly_fields = ("started_at", "submitted_at")


@admin.register(TestQuestion)
class TestQuestionAdmin(admin.ModelAdmin):
    change_list_template = "admin/courses/testquestion/change_list.html"
    list_display = ("id", "test", "question_number", "section", "question_type", "diagram_preview", "short_question_text", "marks", "negative_marks", "correct_answer")
    list_filter = ("test", "section", "question_type")
    search_fields = ("question_text", "correct_answer", "explanation", "test__title")
    list_editable = ("question_number", "marks", "negative_marks", "correct_answer")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]

    def short_question_text(self, obj):
        txt = obj.question_text or ""
        return (txt[:75] + "...") if len(txt) > 75 else txt
    short_question_text.short_description = "Question Preview"

    def diagram_preview(self, obj):
        url = obj.display_diagram
        if url:
            return format_html(
                '<a href="{}" target="_blank" title="View Full Diagram">'
                '<img src="{}" style="height:32px; max-width:60px; object-fit:contain; border-radius:4px; border:1px solid #CBD5E1; vertical-align:middle; background:#FFF;" />'
                '</a>',
                url, url
            )
        return mark_safe('<span style="color:#94A3B8; font-size:11px;">—</span>')
    diagram_preview.short_description = "Diagram"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("bulk-import/", self.admin_site.admin_view(self.bulk_import_view), name="courses_testquestion_bulk_import"),
        ]
        return custom_urls + urls

    def bulk_import_view(self, request):
        import csv
        import io
        import json
        import re
        import base64
        import uuid
        from pathlib import Path
        from django.conf import settings
        from django.core.files.base import ContentFile
        from django.db import transaction

        # Distinct branches & test types
        db_branches = list(TestSeriesItem.objects.values_list("branch", flat=True).distinct())
        default_branches = ["CSE", "ECE", "EE", "ME", "CE", "CH", "DA", "IN"]
        all_branches = sorted(list(set([b for b in (db_branches + default_branches) if b])))

        db_types = list(TestSeriesItem.objects.values_list("test_type", flat=True).distinct())
        default_types = [
            "All-India Open Mock", "Full Length Mock", "Subject Sectional Mock",
            "Subject Level CBT", "Sectional Assessment", "Topic Wise Drill", "Chapter Practice"
        ]
        all_test_types = sorted(list(set([t for t in (db_types + default_types) if t])))

        tests = TestSeriesItem.objects.filter(is_active=True).order_by("-id")
        
        # Build client-side JSON list for instantaneous reactive filtering
        tests_data = []
        for t in tests:
            tests_data.append({
                "id": t.id,
                "title": t.title,
                "branch": t.branch or "CSE",
                "test_type": t.test_type or "Full Length Mock",
                "questions_count": t.questions.count(),
                "total_questions": t.total_questions,
                "total_marks": t.total_marks,
                "duration_minutes": t.duration_minutes,
                "status": t.status,
            })

        from django.db.models import Max
        test_series_courses = Course.objects.filter(is_active=True).filter(
            Q(category__icontains="TEST_SERIES") |
            Q(title__icontains="Test Series") |
            Q(title__icontains="CBT") |
            Q(slug__icontains="test-series") |
            Q(test_items__isnull=False)
        ).distinct().order_by("branch", "title")

        series_list = []
        for c in test_series_courses:
            active_tests = list(c.test_items.filter(is_active=True).order_by("order", "id"))
            max_order = c.test_items.filter(is_active=True).aggregate(Max("order"))["order__max"] or 0
            next_test_no = max(max_order, len(active_tests)) + 1
            series_list.append({
                "id": c.id,
                "title": c.title,
                "branch": c.branch or "ALL",
                "price": str(c.price),
                "active_tests_count": len(active_tests),
                "next_test_number": next_test_no,
                "suggested_title": f"{c.title} — Mock Test #{next_test_no:02d}",
                "existing_tests": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "order": t.order,
                        "test_type": t.test_type,
                        "questions_count": t.questions.count(),
                        "status": t.test_status or t.status
                    }
                    for t in active_tests
                ]
            })

        preselected_series_id = request.GET.get("course_id", "") or request.GET.get("series_id", "")
        preselected_test_id = request.GET.get("test_id", "") or request.GET.get("test", "")
        if not preselected_series_id and preselected_test_id:
            try:
                t_obj = TestSeriesItem.objects.get(id=preselected_test_id)
                if t_obj.course_id:
                    preselected_series_id = str(t_obj.course_id)
            except TestSeriesItem.DoesNotExist:
                pass

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Intelligent Test Series Bulk Import & Paper Generator",
            "recent_jobs": QuestionPaperImportJob.objects.all().order_by("-created_at")[:10],
            "sample_hindi_pdf_url": "/media/sample_papers/hindi_physics_10q.pdf",
            "sample_english_pdf_url": "/media/sample_papers/english_cs_10q.pdf",
            "tests": tests,
            "test_series_courses": test_series_courses,
            "series_list": series_list,
            "series_list_json": json.dumps(series_list),
            "branches": all_branches,
            "test_types": all_test_types,
            "tests_json": json.dumps(tests_data),
            "preselected_test_id": preselected_test_id,
            "preselected_series_id": preselected_series_id,
        }

        if request.method == "POST":
            # 1. Resolve Target Test Series Item
            test_id = request.POST.get("test_id")
            create_new = request.POST.get("create_new_test") == "true" or request.POST.get("create_new_test") == "1"

            target_test = None
            if create_new:
                new_title = request.POST.get("new_test_title", "").strip()
                if not new_title:
                    messages.error(request, "Please enter a title for the new Test Series Item.")
                    return render(request, "admin/courses/testquestion/bulk_import.html", context)
                new_branch = request.POST.get("new_test_branch", "CSE").strip()
                new_type = request.POST.get("new_test_type", "Full Length Mock").strip()
                course_id = request.POST.get("course_id") or request.POST.get("target_series_id") or None
                order = 1
                if course_id:
                    existing = TestSeriesItem.objects.filter(course_id=course_id, is_active=True)
                    max_ord = existing.aggregate(Max("order"))["order__max"] or 0
                    order = max(max_ord, existing.count()) + 1
                target_test = TestSeriesItem.objects.create(
                    title=new_title,
                    branch=new_branch,
                    test_type=new_type,
                    course_id=course_id,
                    order=order,
                    test_destination="TEST_SERIES_PORTAL",
                    test_status="PUBLISHED",
                    visibility_status="RESTRICTED",
                    total_questions=65,
                    total_marks=100,
                    duration_minutes=180,
                    status="AVAILABLE"
                )
                messages.info(request, f"Created new Test Series Item: '{target_test.title}' [{target_test.branch}] (Order #{target_test.order})")
            elif test_id:
                try:
                    target_test = TestSeriesItem.objects.get(id=test_id)
                except TestSeriesItem.DoesNotExist:
                    messages.error(request, "Selected Test Series Item does not exist.")
                    return render(request, "admin/courses/testquestion/bulk_import.html", context)
            else:
                messages.error(request, "Please select or create a Target Test Series Item.")
                return render(request, "admin/courses/testquestion/bulk_import.html", context)

            # 2. Extract Parsed Rows (from JSON payload, file, JSON text, or CSV text)
            questions_json = request.POST.get("questions_json", "").strip()
            csv_text = request.POST.get("csv_text", "").strip()
            json_text = request.POST.get("json_text", "").strip()
            uploaded_file = request.FILES.get("file")

            parsed_rows = []

            # A. High-fidelity Interactive Review / OCR JSON payload
            if questions_json:
                try:
                    parsed_rows = json.loads(questions_json)
                    if isinstance(parsed_rows, dict):
                        parsed_rows = parsed_rows.get("questions", [])
                except json.JSONDecodeError as e:
                    messages.error(request, f"Invalid JSON payload: {str(e)}")
                    return render(request, "admin/courses/testquestion/bulk_import.html", context)

            # B. Uploaded file (JSON or CSV)
            elif uploaded_file:
                content = uploaded_file.read().decode("utf-8-sig", errors="replace")
                if uploaded_file.name.endswith(".json"):
                    try:
                        parsed_rows = json.loads(content)
                        if isinstance(parsed_rows, dict):
                            parsed_rows = parsed_rows.get("questions", [])
                    except json.JSONDecodeError as e:
                        messages.error(request, f"Invalid JSON file format: {str(e)}")
                        return render(request, "admin/courses/testquestion/bulk_import.html", context)
                else:
                    reader = csv.DictReader(io.StringIO(content))
                    parsed_rows = list(reader)

            # C. Pasted JSON
            elif json_text:
                try:
                    parsed_rows = json.loads(json_text)
                    if isinstance(parsed_rows, dict):
                        parsed_rows = parsed_rows.get("questions", [])
                except json.JSONDecodeError as e:
                    messages.error(request, f"Invalid JSON text format: {str(e)}")
                    return render(request, "admin/courses/testquestion/bulk_import.html", context)

            # D. Pasted CSV
            elif csv_text:
                reader = csv.DictReader(io.StringIO(csv_text))
                parsed_rows = list(reader)

            if not parsed_rows:
                messages.error(request, "No questions found to import. Please extract/review questions or upload a file.")
                return render(request, "admin/courses/testquestion/bulk_import.html", context)

            # 3. Process and Save Questions with Diagrams
            diagrams_dir = Path(settings.MEDIA_ROOT) / "questions" / "diagrams"
            diagrams_dir.mkdir(parents=True, exist_ok=True)

            created_objs = []
            errors = []
            start_num = target_test.questions.count() + 1

            with transaction.atomic():
                for idx, q in enumerate(parsed_rows, start=start_num):
                    q_text = (q.get("question_text") or q.get("question") or q.get("text") or "").strip()
                    if not q_text:
                        errors.append(f"Row {idx}: Missing question text")
                        continue

                    q_num = q.get("question_number") or idx
                    q_type = (q.get("question_type") or q.get("type") or "MCQ").strip().upper()
                    if q_type not in ["MCQ", "MSQ", "NAT"]:
                        q_type = "MCQ"

                    sec = (q.get("section") or "CORE").strip().upper()
                    if sec not in ["CORE", "GA", "MATH"]:
                        sec = "CORE"

                    try:
                        marks = float(q.get("marks") or (2.0 if q_num > 25 and q_type in ["MCQ", "MSQ", "NAT"] else 1.0))
                    except (ValueError, TypeError):
                        marks = 1.0

                    try:
                        neg = float(q.get("negative_marks") if q.get("negative_marks") is not None else (0.33 if (q_type == "MCQ" and marks == 1.0) else (0.66 if (q_type == "MCQ" and marks == 2.0) else 0.0)))
                    except (ValueError, TypeError):
                        neg = 0.33 if q_type == "MCQ" else 0.0

                    opt_a = q.get("option_a") or q.get("A") or ""
                    opt_b = q.get("option_b") or q.get("B") or ""
                    opt_c = q.get("option_c") or q.get("C") or ""
                    opt_d = q.get("option_d") or q.get("D") or ""
                    ans = str(q.get("correct_answer") or q.get("answer") or q.get("ans") or "").strip()
                    expl = q.get("explanation") or q.get("solution") or ""

                    # Process Diagrams (Base64 data URI, uploaded file, or URL)
                    diagram_image_path = None
                    diagram_url_val = q.get("diagram_url") or q.get("diagram") or ""
                    diagram_data = q.get("diagram_data") or ""

                    # Check for base64 diagram
                    if diagram_data and diagram_data.startswith("data:image"):
                        try:
                            format_part, imgstr = diagram_data.split(";base64,")
                            ext = format_part.split("/")[-1]
                            if ext not in ["png", "jpeg", "jpg", "webp", "gif"]:
                                ext = "png"
                            img_filename = f"diagram_test{target_test.id}_q{q_num}_{uuid.uuid4().hex[:6]}.{ext}"
                            file_path = diagrams_dir / img_filename
                            file_path.write_bytes(base64.b64decode(imgstr))
                            diagram_image_path = f"questions/diagrams/{img_filename}"
                            diagram_url_val = f"{settings.MEDIA_URL}questions/diagrams/{img_filename}"
                        except Exception as de:
                            errors.append(f"Q{q_num}: Error decoding diagram: {str(de)}")

                    # Check for multipart uploaded file per question
                    file_key = f"diagram_{idx}"
                    if file_key in request.FILES:
                        up_file = request.FILES[file_key]
                        ext = up_file.name.split(".")[-1]
                        img_filename = f"diagram_test{target_test.id}_q{q_num}_{uuid.uuid4().hex[:6]}.{ext}"
                        file_path = diagrams_dir / img_filename
                        with open(file_path, "wb+") as destination:
                            for chunk in up_file.chunks():
                                destination.write(chunk)
                        diagram_image_path = f"questions/diagrams/{img_filename}"
                        diagram_url_val = f"{settings.MEDIA_URL}questions/diagrams/{img_filename}"

                    # If diagram URL exists and is not yet embedded in markdown, append to question_text for universal rendering
                    if diagram_url_val and diagram_url_val not in q_text:
                        q_text = f"{q_text}\n\n![Figure/Diagram]({diagram_url_val})"

                    obj = TestQuestion(
                        test=target_test,
                        question_number=int(q_num),
                        section=sec,
                        question_type=q_type,
                        question_text=q_text,
                        marks=marks,
                        negative_marks=neg,
                        option_a=opt_a,
                        option_b=opt_b,
                        option_c=opt_c,
                        option_d=opt_d,
                        correct_answer=ans,
                        explanation=expl,
                        diagram_image=diagram_image_path,
                        diagram_url=diagram_url_val,
                        order=idx,
                    )
                    created_objs.append(obj)

                if created_objs:
                    TestQuestion.objects.bulk_create(created_objs)
                    target_test.total_questions = target_test.questions.count()
                    target_test.save(update_fields=["total_questions"])

            if created_objs:
                messages.success(
                    request,
                    f"🎉 Successfully imported {len(created_objs)} questions with diagram verification for '{target_test.title}' [{target_test.branch}]! "
                    f"Total test questions now: {target_test.total_questions}."
                )
                if errors:
                    messages.warning(request, f"Skipped/noted {len(errors)} items: " + "; ".join(errors[:5]))
                return redirect(f"/admin/courses/testquestion/?test__id__exact={target_test.id}")
            else:
                messages.error(request, "Failed to import questions. Errors: " + "; ".join(errors[:5]))

        response = render(request, "admin/courses/testquestion/bulk_import.html", context)
        response["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        return response


@admin.register(QuestionPaperImportJob)
class QuestionPaperImportJobAdmin(admin.ModelAdmin):
    list_display = (
        "file_name", "detected_language", "total_questions_detected",
        "total_marks", "one_mark_count", "two_mark_count", "status",
        "target_test", "created_at"
    )
    list_filter = ("status", "detected_language", "target_branch", "created_at")
    search_fields = ("title", "file_name", "detected_language", "target_subject")
    readonly_fields = ("id", "created_at", "updated_at")
    actions = ["delete_selected", bulk_delete_selected_action]


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "category", "branch", "file_type", "file_size", "uploaded_date", "is_active")
    list_filter = ("category", "branch", "is_active")
    search_fields = ("title", "subject")
    list_editable = ("is_active",)
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]


@admin.register(DoubtQuery)
class DoubtQueryAdmin(admin.ModelAdmin):
    list_display = (
        "subject", "topic", "student_name", "faculty_assigned",
        "support_type", "status", "session_status",
        "preferred_date", "preferred_time", "whatsapp_shared_intent", "created_at"
    )
    list_filter = ("status", "session_status", "support_type", "subject", "whatsapp_shared_intent")
    search_fields = ("subject", "topic", "student_name", "query_text", "faculty_assigned")
    list_editable = ("status", "session_status", "faculty_assigned")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action, "approve_personal_session", "reject_personal_session", "mark_resolved"]

    @admin.action(description="Approve 1-on-1 Faculty Session (Confirm Cabin Pass)")
    def approve_personal_session(self, request, queryset):
        count = queryset.update(
            session_status="ACCEPTED",
            status="SCHEDULED",
            cabin_pass="Cabin 3B (Choubey Colony) · Confirmed"
        )
        self.message_user(request, f"{count} personal faculty session(s) approved and cabin pass confirmed.")

    @admin.action(description="Suggest Reschedule (Reject Session Request)")
    def reject_personal_session(self, request, queryset):
        count = queryset.update(
            session_status="REJECTED",
            reply_text="Faculty requested a reschedule. Please check available slots or attend Saturday clinic."
        )
        self.message_user(request, f"{count} session request(s) updated to Reschedule Suggested.")

    @admin.action(description="Mark Doubt Resolved by Faculty")
    def mark_resolved(self, request, queryset):
        count = queryset.update(status="ANSWERED")
        self.message_user(request, f"{count} doubt(s) marked as resolved.")


@admin.register(FacultyAvailability)
class FacultyAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("faculty", "day_name", "date_str", "time_slot", "venue", "is_available")
    list_filter = ("faculty", "day_name", "is_available")
    list_editable = ("time_slot", "venue", "is_available")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]


@admin.register(DailyChallengeQuestion)
class DailyChallengeQuestionAdmin(admin.ModelAdmin):
    list_display = ("branch", "year", "topic", "question_preview", "correct_answer", "marks", "exam_source", "is_active", "created_at")
    list_filter = ("branch", "year", "is_active", "exam_source")
    search_fields = ("question_text", "topic", "year", "explanation", "shortcut_tip")
    list_editable = ("is_active", "correct_answer")
    actions = ["delete_selected", bulk_delete_selected_action, wipe_all_table_records_action]

    def question_preview(self, obj):
        return (obj.question_text[:75] + "...") if len(obj.question_text) > 75 else obj.question_text
    question_preview.short_description = "Question Preview"


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code", "description")
    list_editable = ("is_active",)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("institute_name", "contact_phone", "contact_email", "support_timing", "updated_at")
    fieldsets = (
        ("Institute Contact Information", {
            "fields": ("institute_name", "contact_phone", "contact_email", "address", "support_timing")
        }),
    )




