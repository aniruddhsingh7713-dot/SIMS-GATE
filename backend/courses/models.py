import uuid
from django.db import models
from django.contrib.auth.models import User


class Exam(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Exam"
        verbose_name_plural = "Exams"

    def __str__(self):
        return f"{self.name} ({self.code})"


class SiteSettings(models.Model):
    institute_name = models.CharField(max_length=200, default="SIMS GATE Raipur")
    contact_phone = models.CharField(max_length=50, default="+91 89597 74702")
    contact_email = models.EmailField(default="contact@simsgate.com")
    address = models.TextField(default="3rd Floor, SBI Building, Choubey Colony, Raipur, Chhattisgarh 492001")
    support_timing = models.CharField(max_length=150, default="Mon - Sat: 9:00 AM - 7:30 PM")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return self.institute_name


class Course(models.Model):
    BRANCH_CHOICES = [
        ("CSE", "Computer Science"),
        ("DA", "Data Science & AI"),
        ("CE", "Civil Engineering"),
        ("ME", "Mechanical Engineering"),
        ("ECE", "Electronics"),
        ("EE", "Electrical Engineering"),
        ("IN", "Instrumentation"),
        ("CY", "Chemistry"),
        ("CH", "Chemical Engineering"),
        ("GEN", "General / Interdisciplinary"),
    ]

    CATEGORY_CHOICES = [
        ("GATE_CHEMISTRY", "GATE Chemistry (CY)"),
        ("GATE_CSE", "GATE Computer Science & IT (CSE)"),
        ("GATE_CH", "GATE Chemical Engineering (CH)"),
        ("FOUNDATION_8_10", "Foundation Courses (Class 8th, 9th, 10th)"),
        ("SCHOOL_11_12", "School Science (Class 11th & 12th)"),
        ("HIGHER_ED", "Higher Education (B.Sc, M.Sc, IIT JAM, CSIR NET)"),
        ("PHARMACY", "Pharmacy (B.Pharm, M.Pharm, GPAT)"),
        ("ENGINEERING", "Engineering & Technology (B.Tech / M.Tech)"),
        ("RESEARCH", "Ph.D Entrance & Specialized Research"),
    ]

    exam = models.ForeignKey(
        Exam,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="GATE_CSE",
        db_index=True,
    )
    branch = models.CharField(
        max_length=5,
        choices=BRANCH_CHOICES,
        default="CSE",
        db_index=True,
    )
    exam_name = models.CharField(max_length=100, default="GATE CSE")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration = models.CharField(max_length=100, default="12 Months", blank=True)
    total_lectures = models.PositiveIntegerField(default=120)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.9)
    students_enrolled = models.PositiveIntegerField(default=1250)
    thumbnail_url = models.CharField(max_length=500, blank=True, default="")
    features = models.TextField(blank=True, default="Comprehensive Live + Recorded Lectures, Complete Solved Question Bank, 1-on-1 Faculty Doubt Resolution, Test Series with All-India Ranking")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} (₹{self.price})"


class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Course Module"
        verbose_name_plural = "Course Modules"

    def __str__(self):
        return f"{self.course.title} - M{self.order}: {self.title}"


class CourseLecture(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name="lectures")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lectures")
    title = models.CharField(max_length=250)
    duration = models.CharField(max_length=50, default="45m")
    video_url = models.CharField(max_length=500, blank=True, default="https://www.youtube.com/embed/dQw4w9WgXcQ")
    notes_pdf_url = models.CharField(max_length=500, blank=True, default="#")
    is_preview_free = models.BooleanField(default=False, help_text="If checked, unenrolled students can watch free preview")
    order = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Course Lecture"
        verbose_name_plural = "Course Lectures"

    def __str__(self):
        free_badge = " [FREE PREVIEW]" if self.is_preview_free else ""
        return f"{self.title} ({self.duration}){free_badge}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending Payment"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="orders")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING", db_index=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.course.title} [₹{self.amount} - {self.status}]"


class Payment(models.Model):
    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    razorpay_order_id = models.CharField(max_length=100, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, unique=True, db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, default="")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="SUCCESS")
    payment_method = models.CharField(max_length=50, blank=True, default="Razorpay (UPI / Card / NetBanking)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment {self.razorpay_payment_id} [₹{self.amount} - {self.status}]"


class TestSeries(Course):
    class Meta:
        proxy = True
        verbose_name = "Test Series"
        verbose_name_plural = "Test Series"


class Faculty(models.Model):
    name = models.CharField(max_length=150)
    designation = models.CharField(max_length=150, default="Senior Faculty & Subject Lead")
    qualification = models.CharField(max_length=200, help_text="e.g. M.Tech (CS) IIT Bombay · GATE AIR 14")
    experience_years = models.PositiveIntegerField(default=10, help_text="Years of teaching experience")
    specialization = models.CharField(max_length=250, help_text="e.g. Algorithms, Data Structures, TOC")
    bio = models.TextField(help_text="Detailed academic profile and teaching philosophy")
    achievements = models.TextField(blank=True, help_text="Notable student results, AIRs produced, or research work")
    image_url = models.CharField(max_length=500, blank=True, default="", help_text="Photo URL or local path")
    badge = models.CharField(max_length=100, blank=True, default="EX-IITIAN · AIR HOLDER")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lowest first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Faculty Member"
        verbose_name_plural = "Faculty Members"

    def __str__(self):
        return f"{self.name} ({self.qualification})"


class Batch(models.Model):
    BATCH_TYPE_CHOICES = [
        ("Classroom", "Raipur Classroom (Offline)"),
        ("Live Online", "Live Interactive Online"),
        ("Weekend", "Weekend Executive (Classroom + Online)"),
        ("Foundation", "2-Year Foundation (Early Birds)"),
    ]

    SEAT_STATUS_CHOICES = [
        ("Filling Fast", "Filling Fast (Limited Seats)"),
        ("Few Seats Left", "Few Seats Left (< 10)"),
        ("Admissions Open", "Admissions Open"),
        ("Waitlist Only", "Waitlist Only"),
    ]

    name = models.CharField(max_length=200, help_text="e.g. Super-30 Intensive Classroom Cohort")
    code = models.CharField(max_length=50, blank=True, help_text="e.g. SIMS-2026-CS-ALPHA")
    branch = models.CharField(
        max_length=3,
        choices=Course.BRANCH_CHOICES,
        default="CSE",
        db_index=True,
    )
    target_exam = models.CharField(max_length=100, default="GATE 2026")
    batch_type = models.CharField(max_length=50, choices=BATCH_TYPE_CHOICES, default="Classroom")
    start_date = models.CharField(max_length=100, default="15th July 2026")
    timings = models.CharField(max_length=150, default="Morning: 07:30 AM – 10:30 AM")
    days = models.CharField(max_length=100, default="Monday to Friday")
    venue = models.CharField(max_length=250, default="3rd Floor, SBI Bldg, Choubey Colony, Raipur")
    total_hours = models.CharField(max_length=100, default="650+ Classroom Hours")
    syllabus_completion = models.CharField(max_length=100, default="30th November 2026")
    seats_status = models.CharField(max_length=50, choices=SEAT_STATUS_CHOICES, default="Filling Fast")
    seats_remaining = models.PositiveIntegerField(default=12, help_text="Number of seats remaining")
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total course fee")
    installment_info = models.CharField(max_length=150, blank=True, default="Easy 2-part installment available")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lowest first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "Batch"
        verbose_name_plural = "Batches"

    def __str__(self):
        return f"{self.name} [{self.target_exam} - {self.branch}]"


class StudentEnrollment(models.Model):
    ENROLLMENT_TYPES = [
        ("COURSE", "Full Classroom / Online Course Cohort"),
        ("TEST_SERIES", "CBT Test Series Portal Only"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', null=True, blank=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, related_name='enrollments', null=True, blank=True)
    enrollment_type = models.CharField(max_length=20, choices=ENROLLMENT_TYPES, default="COURSE", db_index=True)
    course_title = models.CharField(max_length=200, blank=True, default="GATE 2026 Comprehensive Master Cohort (CSE)")
    batch_name = models.CharField(max_length=150, default="Super-30 Intensive Classroom Cohort")
    branch = models.CharField(max_length=50, default="Computer Science & IT (CSE)")
    progress_percent = models.PositiveIntegerField(default=0, help_text="Syllabus coverage percent")
    completed_lectures = models.PositiveIntegerField(default=0)
    total_lectures = models.PositiveIntegerField(default=140)
    attendance_percent = models.PositiveIntegerField(default=100)
    validity = models.CharField(max_length=100, default="Valid till GATE 2026 / 1 Year")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Student Enrollment"
        verbose_name_plural = "Student Enrollments"

    def save(self, *args, **kwargs):
        if self.course:
            if not self.course_title:
                self.course_title = self.course.title
            if not self.branch:
                self.branch = self.course.get_branch_display() if hasattr(self.course, 'get_branch_display') else self.course.branch
            if not self.total_lectures and self.course.total_lectures:
                self.total_lectures = self.course.total_lectures
            # Auto-detect enrollment_type if default
            t = (self.course.title or "").lower()
            s = (self.course.slug or "").lower()
            cat = (self.course.category or "").lower()
            if "test series" in t or "test-series" in s or "cbt" in t or "test_series" in cat:
                self.enrollment_type = "TEST_SERIES"
        super().save(*args, **kwargs)

    def __str__(self):
        username = self.user.username if self.user else "Student"
        return f"{username} - {self.course_title}"


class TimetableSlot(models.Model):
    DAY_CHOICES = [
        ("MON", "Monday"),
        ("TUE", "Tuesday"),
        ("WED", "Wednesday"),
        ("THU", "Thursday"),
        ("FRI", "Friday"),
        ("SAT", "Saturday"),
    ]
    SLOT_TYPE_CHOICES = [
        ("CLASS", "Lecture Class"),
        ("SELF_STUDY", "Self-Study & Revision"),
        ("CBT_TEST", "Weekly CBT Proctored Test"),
    ]
    CATEGORY_CHOICES = [
        ("ALGO_DSA", "Algorithms & DSA"),
        ("TOC_DISCRETE", "TOC & Discrete"),
        ("SYSTEMS_NETWORKS", "Systems & Networks"),
        ("MATHS", "Mathematics"),
        ("APTITUDE", "Aptitude"),
        ("SELF_STUDY", "Self-Study & Revision"),
        ("TEST", "Weekly CBT Proctored Test"),
    ]

    week_number = models.PositiveIntegerField(default=1, db_index=True, help_text="Academic week (1 for This Week, 2 for Next Week, etc.)")
    week_range_label = models.CharField(max_length=100, default="Oct 20 – Oct 25, 2026", help_text="e.g. Oct 20 – Oct 25, 2026")
    slot_date = models.CharField(max_length=50, default="Oct 20", help_text="Date for this slot, e.g. Oct 20")
    day = models.CharField(max_length=3, choices=DAY_CHOICES, default="MON", db_index=True)
    order = models.PositiveIntegerField(default=1, help_text="Slot order within the day (1: Morning Core, 2: Core Track, 3: Special/Test)")
    time_slot_label = models.CharField(max_length=50, default="MORNING CORE", help_text="e.g. MORNING CORE, CORE TRACK, SPECIAL / TEST")
    start_time = models.CharField(max_length=30, default="07:30 AM")
    end_time = models.CharField(max_length=30, default="10:30 AM")
    slot_type = models.CharField(max_length=20, choices=SLOT_TYPE_CHOICES, default="CLASS")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="TOC_DISCRETE")
    subject = models.CharField(max_length=150, default="Theory of Computation & Automata")
    subtitle = models.CharField(max_length=150, blank=True, default="", help_text="e.g. Real GATE Interface Exam")
    faculty_name = models.CharField(max_length=150, default="Prof. Aniruddh Singh")
    room_or_mode = models.CharField(max_length=150, blank=True, default="")
    branch = models.CharField(max_length=50, default="CSE")
    batch_code = models.CharField(max_length=100, default="STH6-2026-CSE-A1(B)")
    topic_description = models.CharField(max_length=250, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["week_number", "day", "order"]
        verbose_name = "Timetable Slot"
        verbose_name_plural = "Timetable Slots (Mon–Sat)"

    def __str__(self):
        return f"W{self.week_number} {self.day} [{self.start_time}-{self.end_time}]: {self.subject} ({self.faculty_name})"


class LiveLecture(models.Model):
    STATUS_CHOICES = [
        ("LIVE", "🔴 Live Stream Now"),
        ("UPCOMING", "📅 Scheduled Upcoming"),
        ("RECORDED", "📹 Recorded Archive"),
    ]
    BRANCH_CHOICES = [
        ("CSE", "Computer Science & IT (CSE)"),
        ("CE", "Civil Engineering (CE)"),
        ("ME", "Mechanical Engineering (ME)"),
        ("EE", "Electrical Engineering (EE)"),
        ("ECE", "Electronics & Communication (ECE)"),
        ("DA", "Data Science & AI (DA)"),
        ("GEN", "Engineering / General Academic"),
        ("ALL", "All Disciplines (Common Aptitude / Maths)"),
    ]

    course = models.ForeignKey(
        'Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="live_lectures",
        help_text="Direct linked Course. Only students enrolled in this course can access this live lecture."
    )
    title = models.CharField(max_length=250, default="Algorithms: Dynamic Programming & Greedy Strategies")
    description = models.TextField(
        blank=True,
        default="Comprehensive live discussion on core principles, gate exam shortcuts, and practice problems.",
        help_text="Detailed lecture overview, syllabus coverage and key topics discussed."
    )
    subject = models.CharField(max_length=150, default="Algorithms & Data Structures")
    faculty_name = models.CharField(max_length=150, default="Prof. Aniruddh Singh (Ex-IITian)")
    branch = models.CharField(
        max_length=50,
        choices=BRANCH_CHOICES,
        default="CSE",
        db_index=True,
        help_text="Select branch (e.g. CSE or Civil) to deliver to students enrolled in this discipline"
    )
    target_exam = models.CharField(max_length=100, default="GATE 2026", help_text="e.g. GATE 2026, GATE 2027")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="UPCOMING")
    scheduled_time = models.CharField(max_length=100, default="Today · 06:00 PM – 07:30 PM")
    duration = models.CharField(max_length=50, default="1h 30m")
    room_or_mode = models.CharField(
        max_length=150,
        blank=True,
        default="Raipur Studio 1 · Live Interactive",
        help_text="Studio location or delivery mode"
    )
    video_url = models.CharField(
        max_length=500,
        default="https://www.youtube.com/embed/dQw4w9WgXcQ",
        help_text="YouTube live link, unlisted stream, HLS URL, or embed link"
    )
    thumbnail_url = models.CharField(max_length=500, blank=True, default="")
    notes_url = models.CharField(max_length=500, blank=True, default="#", help_text="Link to downloadable PDF lecture notes")
    order = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]
        verbose_name = "Live / Recorded Lecture"
        verbose_name_plural = "Live / Recorded Lectures"

    def __str__(self):
        return f"[{self.branch}] [{self.status}] {self.title} - {self.faculty_name}"

    @property
    def embed_video_url(self):
        """Converts standard watch URLs (youtube.com/watch?v=XYZ or youtu.be/XYZ) into embed URLs."""
        url = (self.video_url or "").strip()
        if not url:
            return ""
        if "youtube.com/embed/" in url:
            return url
        if "watch?v=" in url:
            video_id = url.split("watch?v=")[-1].split("&")[0]
            return f"https://www.youtube.com/embed/{video_id}?autoplay=1"
        if "youtu.be/" in url:
            video_id = url.split("youtu.be/")[-1].split("?")[0]
            return f"https://www.youtube.com/embed/{video_id}?autoplay=1"
        return url


class TestSeriesItem(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available Now"),
        ("ATTEMPTED", "Attempted & Evaluated"),
        ("UPCOMING", "Unlocks Soon"),
    ]
    LANGUAGE_CHOICES = [
        ("English", "English"),
        ("Hindi", "Hindi"),
        ("Gujarati", "Gujarati"),
        ("Bilingual", "Bilingual / Mixed"),
    ]
    course = models.ForeignKey('Course', on_delete=models.SET_NULL, null=True, blank=True, related_name="test_items")
    title = models.CharField(max_length=250, default="All India Open Mock Test #03 (GATE Full Syllabus)")
    test_type = models.CharField(max_length=100, default="Full Length Mock")
    branch = models.CharField(max_length=50, default="CSE")
    subject = models.CharField(max_length=150, blank=True, default="General Discipline")
    topic = models.CharField(max_length=150, blank=True, default="Comprehensive Syllabus")
    language = models.CharField(max_length=50, default="English", choices=LANGUAGE_CHOICES)
    total_questions = models.PositiveIntegerField(default=65)
    total_marks = models.PositiveIntegerField(default=100)
    duration_minutes = models.PositiveIntegerField(default=180)
    negative_marking = models.DecimalField(max_digits=4, decimal_places=2, default=0.33, help_text="Default negative mark factor per 1 mark")
    instructions = models.TextField(
        blank=True,
        default="1. Total exam duration is strictly timed by the server.\n"
                "2. Section A contains 1-mark questions with 0.33 negative marking for MCQs.\n"
                "3. Section B contains 2-mark questions with 0.66 negative marking for MCQs.\n"
                "4. MSQ and NAT questions have zero negative marking.\n"
                "5. Virtual scientific calculator is provided on the exam portal."
    )
    due_date = models.CharField(max_length=100, default="Active till Sunday 11:59 PM")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")
    score_obtained = models.CharField(max_length=50, blank=True, default="")
    rank_achieved = models.CharField(max_length=50, blank=True, default="")
    test_link = models.CharField(max_length=500, blank=True, default="#", help_text="Online Test Portal Link")
    paper_pdf_url = models.CharField(max_length=500, blank=True, default="#", help_text="Downloadable question paper PDF")
    solution_pdf_url = models.CharField(max_length=500, blank=True, default="#", help_text="Detailed step-by-step solution PDF")
    start_date = models.DateTimeField(null=True, blank=True, help_text="Test opening timestamp (Unlocks test)")
    end_date = models.DateTimeField(null=True, blank=True, help_text="Test closing timestamp (Closes test submissions)")
    test_status = models.CharField(
        max_length=20,
        choices=[("DRAFT", "Draft"), ("PUBLISHED", "Published")],
        default="PUBLISHED",
        db_index=True,
        help_text="Draft tests are invisible to students"
    )
    visibility_status = models.CharField(
        max_length=20,
        choices=[("PUBLIC", "Public"), ("RESTRICTED", "Branch & Purchase Restricted"), ("PRIVATE", "Private / Unlisted")],
        default="RESTRICTED",
        db_index=True,
        help_text="RESTRICTED requires matching branch and active test series purchase"
    )
    order = models.PositiveIntegerField(default=1)
    TEST_DESTINATION_CHOICES = [
        ("TEST_SERIES_PORTAL", "Test Series Portal (/test-series)"),
        ("COURSE_DASHBOARD", "Course Dashboard (/dashboard)"),
    ]
    test_destination = models.CharField(
        max_length=30,
        choices=TEST_DESTINATION_CHOICES,
        default="TEST_SERIES_PORTAL",
        db_index=True,
        help_text="Specifies whether this test appears in Test Series Portal (/test-series) or Course Dashboard (/dashboard)"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Test Series Item"
        verbose_name_plural = "Test Series Items"

    def save(self, *args, **kwargs):
        if self.course and not self.pk:
            is_ts = (
                "TEST_SERIES" in str(getattr(self.course, 'category', '')).upper() or
                "TEST SERIES" in str(getattr(self.course, 'title', '')).upper() or
                "CBT" in str(getattr(self.course, 'title', '')).upper()
            )
            if is_ts:
                self.test_destination = "TEST_SERIES_PORTAL"
            else:
                self.test_destination = "COURSE_DASHBOARD"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def missing_answers_count(self):
        return self.questions.filter(models.Q(correct_answer="") | models.Q(correct_answer__isnull=True)).count()

    @property
    def missing_explanations_count(self):
        return self.questions.filter(models.Q(explanation="") | models.Q(explanation__isnull=True)).count()

    @property
    def diagrams_count(self):
        return self.questions.exclude(models.Q(diagram_url="") & (models.Q(diagram_image="") | models.Q(diagram_image__isnull=True))).count()



class TestSeriesPortalTest(TestSeriesItem):
    class Meta:
        proxy = True
        verbose_name = "Test Series Portal Test"
        verbose_name_plural = "Test Series Portal Tests"


class CourseDashboardTest(TestSeriesItem):
    class Meta:
        proxy = True
        verbose_name = "Dashboard Course Mock Test"
        verbose_name_plural = "Dashboard Course Mock Tests"


class TestQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ("MCQ", "Multiple Choice Question (Single Correct)"),
        ("MSQ", "Multiple Select Question (One or More Correct)"),
        ("NAT", "Numerical Answer Type"),
        ("TF", "True / False"),
        ("DESCRIPTIVE", "Descriptive Question"),
    ]
    SECTION_CHOICES = [
        ("CORE", "Core Technical Discipline"),
        ("GA", "General Aptitude"),
        ("MATH", "Engineering Mathematics"),
        ("SEC_A", "Section A — 1 Mark Questions"),
        ("SEC_B", "Section B — 2 Mark Questions"),
        ("SEC_C", "Section C — Advanced Questions"),
    ]
    test = models.ForeignKey(TestSeriesItem, on_delete=models.CASCADE, related_name="questions")
    question_number = models.PositiveIntegerField(default=1)
    section = models.CharField(max_length=20, choices=SECTION_CHOICES, default="CORE")
    question_type = models.CharField(max_length=15, choices=QUESTION_TYPE_CHOICES, default="MCQ")
    language = models.CharField(max_length=50, default="English", blank=True)
    question_text = models.TextField(help_text="Question text or markdown/KaTeX formulation")
    marks = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    negative_marks = models.DecimalField(max_digits=4, decimal_places=2, default=0.33)
    option_a = models.TextField(blank=True, default="")
    option_b = models.TextField(blank=True, default="")
    option_c = models.TextField(blank=True, default="")
    option_d = models.TextField(blank=True, default="")
    correct_answer = models.CharField(max_length=255, help_text="e.g. 'A', 'A,C' for MSQ, or '42.5' or range '40.0-45.0' for NAT")
    explanation = models.TextField(blank=True, default="", help_text="Step-by-step verified derivation / explanation")
    diagram_image = models.ImageField(upload_to="questions/diagrams/", blank=True, null=True, help_text="Question diagram / circuit / figure")
    diagram_url = models.CharField(max_length=500, blank=True, default="", help_text="External URL or direct path to question diagram")
    complexity_score = models.FloatField(default=1.0)
    is_flagged_for_review = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["test", "question_number", "order", "id"]
        verbose_name = "Test Question"
        verbose_name_plural = "Test Questions"

    def __str__(self):
        return f"Q{self.question_number} ({self.question_type}) - {self.test.title}"

    @property
    def display_diagram(self):
        if self.diagram_image:
            try:
                return self.diagram_image.url
            except Exception:
                pass
        return self.diagram_url or ""


class StudentTestAttempt(models.Model):
    STATUS_CHOICES = [
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("EXPIRED", "Time Expired"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="test_attempts")
    test = models.ForeignKey(TestSeriesItem, on_delete=models.CASCADE, related_name="student_attempts")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="IN_PROGRESS", db_index=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    accuracy_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    unattempted_count = models.PositiveIntegerField(default=0)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    responses = models.JSONField(default=dict, blank=True, help_text="Mapping of question_id to selected answer(s)")
    evaluation_summary = models.JSONField(default=dict, blank=True, help_text="Per question evaluation status and marks")
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Student Test Attempt"
        verbose_name_plural = "Student Test Attempts"
        unique_together = [("user", "test")]

    def __str__(self):
        return f"{self.user.username} - {self.test.title} [{self.status} - {self.score}/{self.total_marks}]"


class QuestionPaperImportJob(models.Model):
    STATUS_CHOICES = [
        ("UPLOADED", "Uploaded"),
        ("PROCESSING", "Processing"),
        ("REVIEW_READY", "Review Ready"),
        ("PUBLISHED", "Published"),
        ("FAILED", "Failed"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, blank=True, default="")
    uploaded_file = models.FileField(upload_to="imports/pdf_papers/", blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, default="")
    file_size_bytes = models.PositiveBigIntegerField(default=0)
    status = models.CharField(max_length=30, default="UPLOADED", choices=STATUS_CHOICES)
    progress_percent = models.PositiveIntegerField(default=0)
    progress_stage = models.CharField(max_length=150, default="Initialized")
    detected_language = models.CharField(max_length=50, default="English")
    target_test = models.ForeignKey(TestSeriesItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="import_jobs")
    target_branch = models.CharField(max_length=50, default="CSE")
    target_test_type = models.CharField(max_length=100, default="Full Length Mock")
    target_subject = models.CharField(max_length=150, blank=True, default="")
    target_topic = models.CharField(max_length=150, blank=True, default="")
    total_questions_detected = models.PositiveIntegerField(default=0)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    duration_minutes = models.PositiveIntegerField(default=180)
    one_mark_count = models.PositiveIntegerField(default=0)
    two_mark_count = models.PositiveIntegerField(default=0)
    mcq_count = models.PositiveIntegerField(default=0)
    msq_count = models.PositiveIntegerField(default=0)
    nat_count = models.PositiveIntegerField(default=0)
    extracted_questions = models.JSONField(default=list, blank=True)
    validation_report = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Question Paper Import Job"
        verbose_name_plural = "Question Paper Import Jobs"

    def __str__(self):
        return f"Import Job: {self.file_name or self.title or str(self.id)[:8]} ({self.status})"


class StudyMaterial(models.Model):
    CATEGORY_CHOICES = [
        ("NOTES", "Handwritten Lecture Notes"),
        ("FORMULA", "Formula & Revision Sheet"),
        ("PYQ", "15+ Years Solved PYQ Bank"),
        ("PRACTICE", "Classroom DPPs & Workbooks"),
    ]
    title = models.CharField(max_length=250)
    subject = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="NOTES")
    branch = models.CharField(max_length=50, default="CSE")
    file_size = models.CharField(max_length=50, default="4.2 MB")
    file_type = models.CharField(max_length=20, default="PDF")
    download_url = models.CharField(max_length=500, default="#")
    uploaded_date = models.CharField(max_length=50, default="10 Oct 2025")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order", "subject", "title"]
        verbose_name = "Study Material"
        verbose_name_plural = "Study Materials"

    def __str__(self):
        return f"[{self.category}] {self.subject} - {self.title}"


class DoubtQuery(models.Model):
    SUPPORT_TYPE_CHOICES = [
        ("REGULAR", "Regular Doubt Query"),
        ("PERSONAL_FACULTY", "1-on-1 Personal Faculty Support"),
        ("WHATSAPP_GROUP", "Prepared for WhatsApp Doubt Group"),
    ]
    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("IN_REVIEW", "Under Faculty Review"),
        ("ANSWERED", "Resolved by Faculty"),
        ("SCHEDULED", "Cabin Pass Scheduled"),
    ]
    SESSION_STATUS_CHOICES = [
        ("NOT_REQUESTED", "Not Requested"),
        ("PENDING_APPROVAL", "Pending Faculty Approval"),
        ("ACCEPTED", "Session Confirmed & Scheduled"),
        ("REJECTED", "Reschedule Suggested"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doubts', null=True, blank=True)
    student_name = models.CharField(max_length=150, default="Student")
    subject = models.CharField(max_length=150, default="Algorithms")
    topic = models.CharField(max_length=200, default="General Topic")
    query_text = models.TextField()
    faculty_assigned = models.CharField(max_length=150, default="Prof. Aniruddh Singh (Ex-IITian)")
    support_type = models.CharField(max_length=50, default="REGULAR", choices=SUPPORT_TYPE_CHOICES)
    status = models.CharField(max_length=30, default="PENDING", choices=STATUS_CHOICES)
    session_status = models.CharField(max_length=30, default="NOT_REQUESTED", choices=SESSION_STATUS_CHOICES)
    preferred_date = models.CharField(max_length=100, blank=True, default="")
    preferred_time = models.CharField(max_length=100, blank=True, default="")
    cabin_pass = models.CharField(max_length=100, blank=True, default="")
    reply_text = models.TextField(blank=True, default="")
    whatsapp_shared_intent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Doubt Query"
        verbose_name_plural = "Doubt Queries"

    def __str__(self):
        return f"{self.subject} ({self.topic}): {self.student_name} [{self.status}]"


class FacultyAvailability(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='availability_slots')
    day_name = models.CharField(max_length=30, default="Today")
    date_str = models.CharField(max_length=50, default="18 Oct 2026")
    time_slot = models.CharField(max_length=50, default="04:30 PM – 05:30 PM")
    venue = models.CharField(max_length=100, default="Faculty Cabin 3B · Choubey Colony")
    is_available = models.BooleanField(default=True)
    notes = models.CharField(max_length=200, blank=True, default="Max 1 student per private slot")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date_str", "time_slot"]
        verbose_name = "Faculty Availability Slot"
        verbose_name_plural = "Faculty Availability Slots"

    def __str__(self):
        return f"{self.faculty.name} | {self.day_name} ({self.time_slot})"


class DailyChallengeQuestion(models.Model):
    BRANCH_CHOICES = [
        ("CSE", "Computer Science & IT (CSE)"),
        ("DA", "Data Science & AI (DA)"),
        ("CE", "Civil Engineering (CE)"),
        ("ME", "Mechanical Engineering (ME)"),
        ("EE", "Electrical Engineering (EE)"),
        ("ECE", "Electronics & Communication (ECE)"),
        ("CH", "Chemical Engineering (CH)"),
        ("MATHS", "Engineering Mathematics"),
    ]
    branch = models.CharField(max_length=20, choices=BRANCH_CHOICES, default="CSE", db_index=True)
    year = models.CharField(max_length=50, default="GATE 2024", help_text="e.g. GATE 2024 (Set-1), GATE 2023")
    exam_source = models.CharField(max_length=150, default="ExamSide GATE Archive", help_text="e.g. ExamSide PYQ Archive / Official IIT Organising Committee")
    topic = models.CharField(max_length=150, default="Core Engineering", help_text="e.g. Linear Algebra, Algorithms, Soil Mechanics")
    question_text = models.TextField(help_text="Question statement with KaTeX / mathematical notation")
    option_a = models.TextField(default="")
    option_b = models.TextField(default="")
    option_c = models.TextField(default="")
    option_d = models.TextField(default="")
    correct_answer = models.CharField(max_length=10, default="A", help_text="A, B, C, or D")
    explanation = models.TextField(blank=True, default="", help_text="Verified step-by-step derivation")
    shortcut_tip = models.TextField(blank=True, default="", help_text="Ex-IITian conceptual shortcut speed tip")
    marks = models.PositiveIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["branch", "-year", "id"]
        verbose_name = "Daily Challenge Question"
        verbose_name_plural = "Daily Challenge Questions"

    def __str__(self):
        return f"[{self.branch} - {self.year}] {self.topic}: {self.question_text[:50]}..."



