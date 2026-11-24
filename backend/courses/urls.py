from django.urls import path
from .views import (
    CourseListAPIView, CourseDetailAPIView, FacultyListAPIView, BatchListAPIView,
    StudentEnrollmentListAPIView, CreateRazorpayOrderAPIView,
    VerifyRazorpayPaymentAPIView, RazorpayWebhookAPIView,
    DailyChallengeQuestionListAPIView, DailyChallengeQuestionBulkImportAPIView,
    IntelligentPDFUploadAPIView, IntelligentRecalculateMarksAPIView,
    IntelligentPublishPaperAPIView, IntelligentJobStatusAPIView,
    AdminInlineUpdateAPIView, AdminQuestionDetailAPIView
)

urlpatterns = [
    path("", CourseListAPIView.as_view(), name="course-list"),
    path("admin-inline-update/", AdminInlineUpdateAPIView.as_view(), name="admin-inline-update"),
    path("admin-question-detail/<int:pk>/", AdminQuestionDetailAPIView.as_view(), name="admin-question-detail"),
    path("test-series/intelligent-generator/upload-pdf/", IntelligentPDFUploadAPIView.as_view(), name="intelligent-pdf-upload"),
    path("test-series/intelligent-generator/recalculate-marks/", IntelligentRecalculateMarksAPIView.as_view(), name="intelligent-recalculate-marks"),
    path("test-series/intelligent-generator/publish/", IntelligentPublishPaperAPIView.as_view(), name="intelligent-publish-paper"),
    path("test-series/intelligent-generator/job-status/<uuid:job_id>/", IntelligentJobStatusAPIView.as_view(), name="intelligent-job-status"),
    path("daily-challenge/", DailyChallengeQuestionListAPIView.as_view(), name="daily-challenge-list"),
    path("daily-challenge/bulk-import/", DailyChallengeQuestionBulkImportAPIView.as_view(), name="daily-challenge-bulk-import"),
    path("my-enrollments/", StudentEnrollmentListAPIView.as_view(), name="my-enrollments"),
    path("checkout/create-order/", CreateRazorpayOrderAPIView.as_view(), name="checkout-create-order"),
    path("checkout/verify-payment/", VerifyRazorpayPaymentAPIView.as_view(), name="checkout-verify-payment"),
    path("checkout/webhook/", RazorpayWebhookAPIView.as_view(), name="checkout-webhook"),
    path("faculty/", FacultyListAPIView.as_view(), name="course-faculty-list"),
    path("batches/", BatchListAPIView.as_view(), name="course-batch-list"),
    path("<slug:slug>/", CourseDetailAPIView.as_view(), name="course-detail"),
]

