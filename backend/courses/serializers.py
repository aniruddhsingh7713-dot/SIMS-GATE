from rest_framework import serializers
from .models import (
    Course, CourseModule, CourseLecture, Order, Payment,
    Faculty, Batch, StudentEnrollment, TimetableSlot,
    LiveLecture, TestSeriesItem, TestQuestion, StudentTestAttempt, StudyMaterial, DoubtQuery, FacultyAvailability,
    DailyChallengeQuestion
)


class CourseLectureSerializer(serializers.ModelSerializer):
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = CourseLecture
        fields = [
            "id", "module", "title", "duration",
            "video_url", "notes_pdf_url", "is_preview_free",
            "is_locked", "order"
        ]

    def get_is_locked(self, obj):
        if obj.is_preview_free:
            return False
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if not user:
            # Check for user_id in params if guest
            uid = request.query_params.get("user_id") if request else None
            if uid:
                from django.contrib.auth.models import User as AuthUser
                user = AuthUser.objects.filter(id=uid).first()
        if user:
            return not StudentEnrollment.objects.filter(user=user, course=obj.course, is_active=True).exists()
        return True

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # If content is locked, hide the actual streaming URL
        if ret.get("is_locked"):
            ret["video_url"] = ""
            ret["notes_pdf_url"] = ""
        return ret


class CourseModuleSerializer(serializers.ModelSerializer):
    lectures = CourseLectureSerializer(many=True, read_only=True)
    lecture_count = serializers.IntegerField(source="lectures.count", read_only=True)

    class Meta:
        model = CourseModule
        fields = ["id", "title", "order", "description", "lectures", "lecture_count"]


class CourseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    branch_display = serializers.CharField(source="get_branch_display", read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "slug", "description",
            "category", "category_display",
            "branch", "branch_display", "exam_name",
            "price", "duration", "total_lectures",
            "rating", "students_enrolled", "thumbnail_url",
            "features", "is_active", "is_enrolled", "created_at"
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if not user and request:
            uid = request.query_params.get("user_id")
            if uid:
                from django.contrib.auth.models import User as AuthUser
                user = AuthUser.objects.filter(id=uid).first()
        if user:
            return StudentEnrollment.objects.filter(user=user, course=obj, is_active=True).exists()
        return False


class CourseDetailSerializer(CourseSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)
    mock_tests = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["modules", "mock_tests"]

    def get_mock_tests(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        from django.db.models import Q
        tests_qs = obj.test_items.filter(is_active=True, test_status="PUBLISHED").order_by("order", "id")
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            from .services.test_access_control import get_student_enrolled_branches
            student_branches = get_student_enrolled_branches(user)
            if student_branches:
                tests_qs = tests_qs.filter(Q(branch__in=student_branches) | Q(branch="ALL"))
        # Using late import or class ref
        return TestSeriesItemSerializer(tests_qs, many=True, context=self.context).data


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = [
            "id", "name", "designation", "qualification",
            "experience_years", "specialization", "bio",
            "achievements", "image_url", "badge", "order", "is_active", "created_at"
        ]


class BatchSerializer(serializers.ModelSerializer):
    branch_display = serializers.CharField(source="get_branch_display", read_only=True)
    batch_type_display = serializers.CharField(source="get_batch_type_display", read_only=True)

    class Meta:
        model = Batch
        fields = [
            "id", "name", "code", "branch", "branch_display",
            "target_exam", "batch_type", "batch_type_display",
            "start_date", "timings", "days", "venue",
            "total_hours", "syllabus_completion",
            "seats_status", "seats_remaining",
            "fee", "installment_info", "order", "is_active", "created_at"
        ]


class OrderSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_slug = serializers.CharField(source="course.slug", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "user", "username", "course", "course_title", "course_slug",
            "amount", "currency", "status", "razorpay_order_id",
            "created_at", "updated_at"
        ]


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    course_title = serializers.CharField(source="order.course.title", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "order_id", "user", "username", "course_title",
            "razorpay_payment_id", "razorpay_order_id", "amount",
            "currency", "status", "payment_method", "created_at"
        ]


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    student_name = serializers.CharField(source="user.get_full_name", read_only=True)
    course_slug = serializers.CharField(source="course.slug", read_only=True)
    course_category = serializers.CharField(source="course.category", read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = "__all__"


class TimetableSlotSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source="get_day_display", read_only=True)
    slot_type_display = serializers.CharField(source="get_slot_type_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = TimetableSlot
        fields = "__all__"


class LiveLectureSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    branch_display = serializers.CharField(source="get_branch_display", read_only=True)
    embed_video_url = serializers.CharField(read_only=True)
    is_live = serializers.SerializerMethodField()

    class Meta:
        model = LiveLecture
        fields = "__all__"

    def get_is_live(self, obj):
        return obj.status == "LIVE"


class TestQuestionSerializer(serializers.ModelSerializer):
    question_type_display = serializers.CharField(source="get_question_type_display", read_only=True)
    section_display = serializers.CharField(source="get_section_display", read_only=True)
    display_diagram = serializers.CharField(read_only=True)

    class Meta:
        model = TestQuestion
        fields = "__all__"


TestQuestionSolutionSerializer = TestQuestionSerializer


class TestQuestionCandidateSerializer(serializers.ModelSerializer):
    question_type_display = serializers.CharField(source="get_question_type_display", read_only=True)
    section_display = serializers.CharField(source="get_section_display", read_only=True)
    display_diagram = serializers.CharField(read_only=True)

    class Meta:
        model = TestQuestion
        exclude = ["correct_answer", "explanation"]


class StudentTestAttemptSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source="test.title", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = StudentTestAttempt
        fields = "__all__"


class TestSeriesItemSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    questions = TestQuestionCandidateSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = TestSeriesItem
        fields = "__all__"

    def get_questions_count(self, obj):
        count = obj.questions.count()
        return count if count > 0 else obj.total_questions

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Check if caller explicitly requested solutions with permission
        include_solutions = self.context.get("include_solutions", False)
        if include_solutions:
            # Re-serialize questions with full solutions
            data["questions"] = TestQuestionSerializer(instance.questions.all().order_by("question_number", "id"), many=True).data
        return data


class StudyMaterialSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = StudyMaterial
        fields = "__all__"


class DoubtQuerySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    session_status_display = serializers.CharField(source="get_session_status_display", read_only=True)
    support_type_display = serializers.CharField(source="get_support_type_display", read_only=True)

    class Meta:
        model = DoubtQuery
        fields = "__all__"


class FacultyAvailabilitySerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source="faculty.name", read_only=True)
    faculty_qualification = serializers.CharField(source="faculty.qualification", read_only=True)

    class Meta:
        model = FacultyAvailability
        fields = "__all__"


class DailyChallengeQuestionSerializer(serializers.ModelSerializer):
    branch_display = serializers.CharField(source="get_branch_display", read_only=True)
    options = serializers.SerializerMethodField()

    class Meta:
        model = DailyChallengeQuestion
        fields = [
            "id", "branch", "branch_display", "year", "exam_source", "topic",
            "question_text", "option_a", "option_b", "option_c", "option_d",
            "options", "correct_answer", "explanation", "shortcut_tip", "marks",
            "is_active", "created_at"
        ]

    def get_options(self, obj):
        return [
            {"label": "A", "text": obj.option_a},
            {"label": "B", "text": obj.option_b},
            {"label": "C", "text": obj.option_c},
            {"label": "D", "text": obj.option_d},
        ]



