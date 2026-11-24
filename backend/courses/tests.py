from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from courses.models import Course, CourseModule, CourseLecture, Order, Payment, StudentEnrollment


class StudentJourneyAndRazorpayTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="teststudent1",
            email="teststudent1@example.com",
            password="Password123!",
            first_name="Rohan",
            last_name="Sharma"
        )
        self.course_cy = Course.objects.create(
            title="GATE Chemistry (CY) Comprehensive Master Course",
            slug="gate-chemistry-cy-test",
            category="GATE_CHEMISTRY",
            branch="CY",
            exam_name="GATE CY",
            price=18999.00,
            duration="12 Months",
            total_lectures=160,
            is_active=True
        )
        self.module = CourseModule.objects.create(
            course=self.course_cy,
            title="Module 1: Physical Chemistry",
            order=1
        )
        self.preview_lecture = CourseLecture.objects.create(
            module=self.module,
            course=self.course_cy,
            title="Free Preview: Quantum Mechanics Intro",
            duration="45m",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            is_preview_free=True,
            order=1
        )
        self.paid_lecture = CourseLecture.objects.create(
            module=self.module,
            course=self.course_cy,
            title="Paid Only: Particle in a 3D Box",
            duration="50m",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            is_preview_free=False,
            order=2
        )

    def test_step1_new_student_empty_enrollments(self):
        """New student with no purchases should receive an empty enrollments list (NO fake demo data)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/courses/my-enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["has_enrollments"])
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["enrollments"]), 0)

        # Overview endpoint also reflects empty enrollments
        overview_res = self.client.get("/api/dashboard/overview/")
        self.assertEqual(overview_res.status_code, 200)
        self.assertFalse(overview_res.data["has_active_courses"])
        self.assertEqual(len(overview_res.data["enrollments"]), 0)

    def test_step2_course_catalog_and_category_filter(self):
        """Course catalog correctly filters by category and returns accurate pricing from PostgreSQL."""
        response = self.client.get("/api/courses/?category=GATE_CHEMISTRY")
        self.assertEqual(response.status_code, 200)
        results = response.data.get("results") or response.data
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["slug"], "gate-chemistry-cy-test")
        self.assertEqual(float(results[0]["price"]), 18999.00)

    def test_step3_course_content_protection_unenrolled(self):
        """Unenrolled student can see free preview video URL, but paid lecture URL is locked/masked."""
        response = self.client.get(f"/api/courses/{self.course_cy.slug}/?user_id={self.user.id}")
        self.assertEqual(response.status_code, 200)
        modules = response.data["modules"]
        self.assertEqual(len(modules), 1)
        lectures = modules[0]["lectures"]
        
        # Free preview lecture
        preview = next(l for l in lectures if l["id"] == self.preview_lecture.id)
        self.assertFalse(preview["is_locked"])
        self.assertTrue(preview["is_preview_free"])
        self.assertTrue(bool(preview["video_url"]))

        # Paid lecture
        paid = next(l for l in lectures if l["id"] == self.paid_lecture.id)
        self.assertTrue(paid["is_locked"])
        self.assertFalse(paid["is_preview_free"])
        self.assertEqual(paid["video_url"], "")  # Masked

    def test_step4_razorpay_checkout_flow_and_atomic_unlock(self):
        """Student initiates checkout, verifies Razorpay payment, and course unlocks atomically."""
        self.client.force_authenticate(user=self.user)

        # 1. Create Order
        create_res = self.client.post("/api/courses/checkout/create-order/", {
            "course_id": self.course_cy.id
        })
        self.assertEqual(create_res.status_code, 201)
        self.assertTrue(create_res.data["success"])
        order_id = create_res.data["order_id"]
        razorpay_order_id = create_res.data["razorpay_order_id"]
        self.assertEqual(create_res.data["amount"], 18999.00)

        # Verify internal order in DB
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, "PENDING")
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.amount, 18999.00)

        # 2. Verify Payment
        verify_res = self.client.post("/api/courses/checkout/verify-payment/", {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": "pay_test_sims_123456",
            "razorpay_signature": "sims_signature_test",
            "payment_method": "UPI (Google Pay)"
        })
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.data["success"])

        # Verify DB state
        order.refresh_from_db()
        self.assertEqual(order.status, "COMPLETED")
        self.assertTrue(Payment.objects.filter(order=order, status="SUCCESS").exists())

        # Verify StudentEnrollment is now active in PostgreSQL
        enrollment = StudentEnrollment.objects.get(user=self.user, course=self.course_cy)
        self.assertTrue(enrollment.is_active)
        self.assertEqual(enrollment.progress_percent, 0)

        # 3. Verify Dashboard now shows active course
        enrollments_res = self.client.get("/api/courses/my-enrollments/")
        self.assertEqual(enrollments_res.status_code, 200)
        self.assertTrue(enrollments_res.data["has_enrollments"])
        self.assertEqual(enrollments_res.data["count"], 1)

        # 4. Content Protection: Paid lecture is now unlocked for this student
        detail_res = self.client.get(f"/api/courses/{self.course_cy.slug}/?user_id={self.user.id}")
        paid_unlocked = next(l for l in detail_res.data["modules"][0]["lectures"] if l["id"] == self.paid_lecture.id)
        self.assertFalse(paid_unlocked["is_locked"])
        self.assertTrue(bool(paid_unlocked["video_url"]))

    def test_step5_duplicate_checkout_prevented(self):
        """Student cannot purchase a course they are already actively enrolled in."""
        # Create existing active enrollment
        StudentEnrollment.objects.create(
            user=self.user,
            course=self.course_cy,
            course_title=self.course_cy.title,
            is_active=True
        )

        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/courses/checkout/create-order/", {
            "course_id": self.course_cy.id
        })
        self.assertEqual(res.status_code, 400)
        self.assertTrue(res.data["already_enrolled"])
