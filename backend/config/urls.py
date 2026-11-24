from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from courses.views import (
    FacultyListAPIView, BatchListAPIView,
    DashboardOverviewAPIView, TimetableListAPIView,
    LiveLectureListAPIView, TestSeriesListAPIView, TestDetailAPIView, TestQuestionBulkImportAPIView,
    TestSubmitAttemptAPIView, TestSeriesAnalyticsAPIView,
    TestInstructionsAPIView, TestStartAPIView, TestQuestionsAPIView, TestResultAPIView, TestAdminEligibilityStatsAPIView,
    StudentEnrollmentListAPIView, StudyMaterialListAPIView,
    DoubtQueryListAPIView, DoubtQuerySessionRequestAPIView,
    DoubtQueryWhatsAppIntentAPIView, FacultyAvailabilityListAPIView,
    DoubtSupportConfigAPIView,
    DailyChallengeQuestionListAPIView, DailyChallengeQuestionBulkImportAPIView,
    IntelligentPDFUploadAPIView, IntelligentRecalculateMarksAPIView,
    IntelligentPublishPaperAPIView, IntelligentJobStatusAPIView
)

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('api/courses/', include('courses.urls')),
    path('api/faculty/', FacultyListAPIView.as_view(), name='faculty-list'),
    path('api/batches/', BatchListAPIView.as_view(), name='batch-list'),
    path('api/dashboard/overview/', DashboardOverviewAPIView.as_view(), name='dashboard-overview'),
    path('api/dashboard/timetable/', TimetableListAPIView.as_view(), name='dashboard-timetable'),
    path('api/dashboard/live-lectures/', LiveLectureListAPIView.as_view(), name='dashboard-live-lectures'),
    path('api/dashboard/test-series/', TestSeriesListAPIView.as_view(), name='dashboard-test-series'),
    path('api/dashboard/test-series/<int:pk>/', TestDetailAPIView.as_view(), name='dashboard-test-detail'),
    path('api/dashboard/test-series/<int:pk>/submit-attempt/', TestSubmitAttemptAPIView.as_view(), name='dashboard-test-submit-attempt'),
    path('api/dashboard/test-series/analytics/', TestSeriesAnalyticsAPIView.as_view(), name='dashboard-test-analytics'),
    path('api/dashboard/test-series/<int:pk>/instructions/', TestInstructionsAPIView.as_view(), name='dashboard-test-instructions'),
    path('api/dashboard/test-series/<int:pk>/start/', TestStartAPIView.as_view(), name='dashboard-test-start'),
    path('api/dashboard/test-series/<int:pk>/questions/', TestQuestionsAPIView.as_view(), name='dashboard-test-questions'),
    path('api/dashboard/test-series/<int:pk>/result/', TestResultAPIView.as_view(), name='dashboard-test-result'),
    path('api/dashboard/test-series/<int:pk>/admin-stats/', TestAdminEligibilityStatsAPIView.as_view(), name='dashboard-test-admin-stats'),
    path('api/dashboard/test-series/questions/bulk-import/', TestQuestionBulkImportAPIView.as_view(), name='dashboard-test-question-bulk-import'),
    path('api/dashboard/test-series/<int:test_id>/import-questions/', TestQuestionBulkImportAPIView.as_view(), name='dashboard-test-import-questions'),
    path('api/dashboard/test-series/intelligent-generator/upload-pdf/', IntelligentPDFUploadAPIView.as_view(), name='dashboard-intelligent-pdf-upload'),
    path('api/dashboard/test-series/intelligent-generator/recalculate-marks/', IntelligentRecalculateMarksAPIView.as_view(), name='dashboard-intelligent-recalculate-marks'),
    path('api/dashboard/test-series/intelligent-generator/publish/', IntelligentPublishPaperAPIView.as_view(), name='dashboard-intelligent-publish-paper'),
    path('api/dashboard/test-series/intelligent-generator/job-status/<uuid:job_id>/', IntelligentJobStatusAPIView.as_view(), name='dashboard-intelligent-job-status'),
    path('api/dashboard/enrollments/', StudentEnrollmentListAPIView.as_view(), name='dashboard-enrollments'),
    path('api/dashboard/study-material/', StudyMaterialListAPIView.as_view(), name='dashboard-study-material'),
    path('api/dashboard/doubt-support/', DoubtQueryListAPIView.as_view(), name='dashboard-doubt-support'),
    path('api/dashboard/doubt-support/<int:pk>/request-session/', DoubtQuerySessionRequestAPIView.as_view(), name='doubt-request-session'),
    path('api/dashboard/doubt-support/<int:pk>/record-whatsapp-intent/', DoubtQueryWhatsAppIntentAPIView.as_view(), name='doubt-whatsapp-intent'),
    path('api/dashboard/doubt-support/faculty-availability/', FacultyAvailabilityListAPIView.as_view(), name='doubt-faculty-availability'),
    path('api/dashboard/doubt-support/config/', DoubtSupportConfigAPIView.as_view(), name='doubt-support-config'),
    path('api/courses/daily-challenge/', DailyChallengeQuestionListAPIView.as_view(), name='daily-challenge-list'),
    path('api/courses/daily-challenge/bulk-import/', DailyChallengeQuestionBulkImportAPIView.as_view(), name='daily-challenge-bulk-import'),
    path('api/auth/', include('accounts.urls')),
    path('api/security/', include('security.urls')),
    path('api/admin/security/', include('security.admin_urls')),
    path('admin/', admin.site.urls),
]

admin.site.site_header = "SIMS GATE Administration"
admin.site.site_title = "SIMS GATE Administration"
admin.site.index_title = "Site Administration"

_orig_each_context = admin.site.each_context

def get_sims_dashboard_sections(request):
    try:
        from courses.models import (
            Course, CourseModule, CourseLecture, Batch, TimetableSlot,
            LiveLecture, TestSeries, TestSeriesItem, TestQuestion,
            DailyChallengeQuestion, Faculty, FacultyAvailability,
            DoubtQuery, StudyMaterial, StudentEnrollment, Order, Payment,
            StudentTestAttempt, QuestionPaperImportJob,
            TestSeriesPortalTest, CourseDashboardTest, Exam, SiteSettings
        )

        models_map = {}
        for app in admin.site.get_app_list(request):
            for m in app.get('models', []):
                models_map[m.get('object_name')] = m

        counts = {
            'Exam': Exam.objects.count(),
            'SiteSettings': SiteSettings.objects.count(),
            'Course': Course.objects.count(),
            'CourseModule': CourseModule.objects.count(),
            'CourseLecture': CourseLecture.objects.count(),
            'Batch': Batch.objects.count(),
            'TimetableSlot': TimetableSlot.objects.count(),
            'LiveLecture': LiveLecture.objects.count(),
            'TestSeries': TestSeries.objects.count(),
            'TestSeriesItem': TestSeriesItem.objects.count(),
            'TestQuestion': TestQuestion.objects.count(),
            'DailyChallengeQuestion': DailyChallengeQuestion.objects.count(),
            'Faculty': Faculty.objects.count(),
            'FacultyAvailability': FacultyAvailability.objects.count(),
            'DoubtQuery': DoubtQuery.objects.count(),
            'StudyMaterial': StudyMaterial.objects.count(),
            'StudentEnrollment': StudentEnrollment.objects.count(),
            'Order': Order.objects.count(),
            'Payment': Payment.objects.count(),
        }

        counts['StudentTestAttempt'] = StudentTestAttempt.objects.count()
        counts['QuestionPaperImportJob'] = QuestionPaperImportJob.objects.count()
        counts['TestSeriesPortalTest'] = TestSeriesPortalTest.objects.filter(test_destination='TEST_SERIES_PORTAL').count()
        counts['CourseDashboardTest'] = CourseDashboardTest.objects.filter(test_destination='COURSE_DASHBOARD').count()

        def resolve_model(obj_name, custom_title=None, custom_desc=None, extra_btn=None, icon=None):
            m = models_map.get(obj_name)
            if not m:
                return None
            return {
                'name': custom_title or m['name'],
                'raw_name': m['name'],
                'object_name': obj_name,
                'admin_url': m.get('admin_url'),
                'add_url': m.get('add_url'),
                'view_only': m.get('view_only', False),
                'count': counts.get(obj_name, 0),
                'description': custom_desc or '',
                'extra_btn': extra_btn,
                'icon': icon or '📄',
            }

        sections = [
            {
                'id': 'courses',
                'title': 'Courses & Academic Programs',
                'subtitle': 'Curriculum, syllabus modules, video lectures & course cohort tests',
                'icon': '🎓',
                'badge': f"{counts['Course']} Programs",
                'models': [m for m in [
                    resolve_model('Exam', 'Exam Frameworks (GATE, NET/SET)', 'National level examination types & criteria', icon='🏛️'),
                    resolve_model('Course', 'GATE Preparation Courses', 'Comprehensive GATE syllabus streams & fee plans', icon='🎓'),
                    resolve_model('CourseModule', 'Syllabus Modules & Chapters', 'Subject modules, chapters & lecture mapping', icon='📑'),
                    resolve_model('CourseLecture', 'Classroom Video Lectures', '1080p recorded video lectures and classroom notes', icon='🎥'),
                    resolve_model('CourseDashboardTest', 'Dashboard Course Mock Tests', 'Internal cohort mock tests for enrolled courses (/dashboard)', icon='📝', extra_btn={'label': '📥 Bulk Import', 'url': '/admin/courses/testquestion/bulk-import/', 'class': 'btn-import'}),
                ] if m]
            },
            {
                'id': 'batches',
                'title': 'Classroom Batches & Schedules',
                'subtitle': 'Offline Raipur cohorts, weekly timetable matrix & live broadcasts',
                'icon': '🏛️',
                'badge': f"{counts['Batch']} Batches",
                'models': [m for m in [
                    resolve_model('Batch', 'Classroom Batches & Cohorts', 'Raipur physical batches, timings & max 40 seat limits', icon='🏛️'),
                    resolve_model('TimetableSlot', 'Weekly Timetable Slots', 'Scheduled lecture matrix by day, venue & subject',
                                  extra_btn={'label': '⚡ Matrix Builder', 'url': '/admin/courses/timetableslot/matrix-builder/', 'class': 'btn-matrix'},
                                  icon='📅'),
                    resolve_model('LiveLecture', 'Live Class Broadcasts', 'Active & upcoming live studio lecture streams', icon='🔴'),
                ] if m]
            },
            {
                'id': 'cbt',
                'title': 'CBT Tests & Question Banks',
                'subtitle': 'Official TCS iON test series, question archives & bulk import',
                'icon': '📝',
                'badge': f"{counts['TestQuestion']} Questions",
                'models': [m for m in [
                    resolve_model('TestSeries', 'Test Series Programs', 'Full-length & subject-level benchmark test programs', icon='🏆'),
                    resolve_model('TestSeriesPortalTest', 'Test Series Portal Tests', 'Official CBT papers for standalone purchased test series (/test-series)', icon='🏆', extra_btn={'label': '📥 Bulk Import', 'url': '/admin/courses/testquestion/bulk-import/', 'class': 'btn-import'}),
                    resolve_model('TestQuestion', 'CBT Questions Bank', 'Official GATE questions with MSQ, NAT & MCQs',
                                  extra_btn={'label': '📥 Bulk Import', 'url': '/admin/courses/testquestion/bulk-import/', 'class': 'btn-import'},
                                  icon='❓'),
                    resolve_model('StudentTestAttempt', 'Student Test Attempts', 'Exam submissions, live CBT scores, accuracy & evaluations', icon='📊'),
                    resolve_model('DailyChallengeQuestion', 'Daily GATE PYQ Challenge', 'ExamSide 5-question challenge with 2-minute timer',
                                  extra_btn={'label': '📥 Bulk Import PYQs', 'url': '/api/courses/daily-challenge/bulk-import/', 'class': 'btn-import'},
                                  icon='⚡'),
                    resolve_model('QuestionPaperImportJob', 'AI Paper Ingestion Jobs', 'Automated OCR test paper ingestion & question parsing queue', icon='🤖'),
                ] if m]
            },
            {
                'id': 'faculty',
                'title': 'Faculty Council & Cabin Doubts',
                'subtitle': 'Ex-IITian mentors, evening cabin doubt hours & student inquiries',
                'icon': '👨‍🏫',
                'badge': f"{counts['Faculty']} Mentors",
                'models': [m for m in [
                    resolve_model('Faculty', 'Faculty Council Directory', 'Ex-IITian mentors, credentials, AIR ranks & subjects', icon='👨‍🏫'),
                    resolve_model('FacultyAvailability', 'Cabin Availability Slots', 'Evening cabin hours (3:30–7:30 PM) in Choubey Colony', icon='🕒'),
                    resolve_model('DoubtQuery', 'Student Doubt Desk', '1-on-1 cabin requests and faculty WhatsApp intents', icon='💬'),
                ] if m]
            },
            {
                'id': 'resources',
                'title': 'Study Materials & Workbooks',
                'subtitle': '15+ Years printed workbooks and chapter-wise formula notes',
                'icon': '📚',
                'badge': f"{counts['StudyMaterial']} Materials",
                'models': [m for m in [
                    resolve_model('StudyMaterial', 'Printed & Digital Workbooks', '15-year chapter-wise solved PYQ workbooks & PDF notes', icon='📚'),
                ] if m]
            },
            {
                'id': 'admissions',
                'title': 'Admissions, Orders & Fee Ledger',
                'subtitle': 'Student enrollments, course checkout orders & payment audit',
                'icon': '💳',
                'badge': f"{counts['StudentEnrollment']} Enrolled",
                'models': [m for m in [
                    resolve_model('StudentEnrollment', 'Active Student Enrollments', 'Student course access & batch seat assignments', icon='🎒'),
                    resolve_model('Order', 'Student Course Orders', 'Checkout orders, enrollment status & invoices', icon='🛒'),
                    resolve_model('Payment', 'Payment Transactions Ledger', 'Razorpay / UPI transactions & verification records', icon='💳'),
                ] if m]
            },
            {
                'id': 'security',
                'title': 'User Accounts & Access Control',
                'subtitle': 'Student authentication profiles and administrative staff permissions',
                'icon': '🛡️',
                'badge': 'Security',
                'models': [m for m in [
                    resolve_model('UserProfile', 'Student User Profiles', 'Student phone numbers, target GATE branch & year', icon='👤'),
                    resolve_model('User', 'System Users', 'Administrative staff and student authentication accounts', icon='🔑'),
                    resolve_model('Group', 'Staff Permission Groups', 'Role-based access groups (Faculty, Counselor, Admin)', icon='👥'),
                    resolve_model('SiteSettings', 'Institution Site Settings', 'Raipur studio contact phone, email & address', icon='⚙️'),
                ] if m]
            },
        ]
        return sections
    except Exception as e:
        return []

def sims_admin_each_context(request):
    ctx = _orig_each_context(request)
    try:
        from courses.models import (
            Course, Batch, TestQuestion, LiveLecture, Faculty, TimetableSlot,
            Order, Payment, StudentEnrollment, StudentTestAttempt, DoubtQuery,
            TestSeriesItem, QuestionPaperImportJob
        )
        from django.contrib.auth.models import User
        from django.db.models import Sum, Q
        from django.utils import timezone

        today = timezone.now().date()
        revenue_sum = Payment.objects.filter(status='SUCCESS').aggregate(total=Sum('amount'))['total'] or 0

        # Today metrics
        today_payments = Payment.objects.filter(status='SUCCESS', created_at__date=today).count()
        today_students = User.objects.filter(is_staff=False, date_joined__date=today).count()
        today_attempts = StudentTestAttempt.objects.filter(created_at__date=today).count()

        # Needs Attention items
        needs_attention = []
        missing_answers = TestQuestion.objects.filter(Q(correct_answer='') | Q(correct_answer__isnull=True)).count()
        if missing_answers > 0:
            needs_attention.append({
                'title': f'{missing_answers} Questions Missing Answer',
                'description': 'Questions imported or created without a verified answer key.',
                'fix_url': '/admin/courses/testquestion/?correct_answer__exact=',
                'badge': 'Urgent',
                'badge_color': '#DC2626'
            })

        empty_tests = TestSeriesItem.objects.filter(total_questions=0).count()
        if empty_tests > 0:
            needs_attention.append({
                'title': f'{empty_tests} Tests With Zero Questions',
                'description': 'Test papers published or drafted without any questions.',
                'fix_url': '/admin/courses/testseriesitem/?total_questions__exact=0',
                'badge': 'Warning',
                'badge_color': '#D97706'
            })

        pending_doubts = DoubtQuery.objects.filter(status='PENDING').count()
        if pending_doubts > 0:
            needs_attention.append({
                'title': f'{pending_doubts} Pending Doubt Inquiries',
                'description': 'Student doubt desk queries waiting for faculty response.',
                'fix_url': '/admin/courses/doubtquery/?status__exact=PENDING',
                'badge': 'Review',
                'badge_color': '#2563EB'
            })

        ctx['sims_stats'] = {
            'active_courses': Course.objects.filter(is_active=True).count(),
            'total_batches': Batch.objects.count(),
            'total_questions': TestQuestion.objects.count(),
            'live_classes': LiveLecture.objects.filter(status='LIVE', is_active=True).count(),
            'total_lectures': LiveLecture.objects.count(),
            'faculty_count': Faculty.objects.filter(is_active=True).count(),
            'timetable_count': TimetableSlot.objects.count(),
            'total_orders': Order.objects.count(),
            'completed_orders': Order.objects.filter(status='COMPLETED').count(),
            'active_enrollments': StudentEnrollment.objects.filter(is_active=True).count(),
            'total_revenue_inr': f"INR {revenue_sum:,.2f}",
        }
        ctx['sims_today'] = {
            'payments': today_payments,
            'students': today_students,
            'attempts': today_attempts,
        }
        ctx['needs_attention'] = needs_attention
        ctx['sims_dashboard_sections'] = get_sims_dashboard_sections(request)
    except Exception:
        ctx['sims_stats'] = {}
        ctx['sims_today'] = {'payments': 0, 'students': 0, 'attempts': 0}
        ctx['needs_attention'] = []
        ctx['sims_dashboard_sections'] = []
    return ctx

admin.site.each_context = sims_admin_each_context


from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += staticfiles_urlpatterns()
