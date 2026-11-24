import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from courses.models import Course, CourseModule, CourseLecture, Order, Payment, StudentEnrollment

def run_tests():
    print("==================================================")
    print("  SIMS GATE Backend & Student Journey Tests")
    print("==================================================")
    client = APIClient()

    # 1. Setup a test student
    test_user, _ = User.objects.get_or_create(
        username="journey_student_test",
        defaults={
            "email": "journey_student@test.com",
            "first_name": "Aman",
            "last_name": "Patel"
        }
    )
    # Ensure no previous test enrollments for clean start
    StudentEnrollment.objects.filter(user=test_user).delete()
    Order.objects.filter(user=test_user).delete()
    Payment.objects.filter(user=test_user).delete()

    print("[1] Testing New Student Empty State...")
    client.force_authenticate(user=test_user)
    res = client.get("/api/courses/my-enrollments/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.data["has_enrollments"] is False, "Expected has_enrollments to be False"
    assert res.data["count"] == 0, f"Expected count 0, got {res.data['count']}"
    assert len(res.data["enrollments"]) == 0, "Expected empty enrollments array"
    print("    PASSED: New student has 0 active courses and empty state flag is verified.")

    # Overview endpoint
    overview_res = client.get(f"/api/dashboard/overview/?user_id={test_user.id}")
    assert overview_res.status_code == 200
    assert overview_res.data["has_active_courses"] is False
    assert len(overview_res.data["enrollments"]) == 0
    print("    PASSED: Dashboard overview reflects empty state with zero fake courses.")

    # 2. Test Catalog & Category Filters
    print("[2] Testing Course Catalog & Category Filter...")
    cat_res = client.get("/api/courses/?category=GATE_CHEMISTRY")
    assert cat_res.status_code == 200
    cat_results = cat_res.data if isinstance(cat_res.data, list) else cat_res.data.get("results", [])
    assert len(cat_results) > 0, "Expected at least 1 GATE Chemistry course"
    cy_course = Course.objects.filter(category="GATE_CHEMISTRY").first()
    print(f"    PASSED: Found category course: {cy_course.title} (Price: Rs. {cy_course.price})")

    # 3. Test Content Protection Unenrolled
    print("[3] Testing Course Content Protection for Unenrolled Student...")
    detail_res = client.get(f"/api/courses/{cy_course.slug}/?user_id={test_user.id}")
    assert detail_res.status_code == 200
    modules = detail_res.data.get("modules", [])
    assert len(modules) > 0, "Expected course to have modules"
    lectures = modules[0].get("lectures", [])
    preview_lectures = [l for l in lectures if l.get("is_preview_free")]
    paid_lectures = [l for l in lectures if not l.get("is_preview_free")]

    if preview_lectures:
        assert preview_lectures[0]["is_locked"] is False
        assert bool(preview_lectures[0]["video_url"]) is True
        print("    PASSED: Free preview lecture URL is accessible.")
    if paid_lectures:
        assert paid_lectures[0]["is_locked"] is True
        assert paid_lectures[0]["video_url"] == ""
        print("    PASSED: Paid lecture streaming URL is strictly locked/masked for unenrolled student.")

    # 4. Test Razorpay Checkout Order Creation
    print("[4] Testing Razorpay Checkout Order Creation...")
    create_res = client.post("/api/courses/checkout/create-order/", {
        "course_id": cy_course.id,
        "user_id": test_user.id
    })
    assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.data}"
    order_data = create_res.data
    assert order_data["success"] is True
    assert order_data["amount"] == float(cy_course.price), f"Price mismatch: {order_data['amount']} vs {cy_course.price}"
    order_id = order_data["order_id"]
    razorpay_order_id = order_data["razorpay_order_id"]
    print(f"    PASSED: Razorpay order created (Order #{order_id}, RZP ID: {razorpay_order_id}, Amount: Rs. {order_data['amount']})")

    # 5. Test Payment Verification & Instant Atomic Unlocking
    print("[5] Testing Razorpay Signature Verification & Course Unlocking...")
    verify_res = client.post("/api/courses/checkout/verify-payment/", {
        "order_id": order_id,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": f"pay_sims_{order_id}_success",
        "razorpay_signature": "sims_test_signature",
        "user_id": test_user.id,
        "payment_method": "UPI (Google Pay)"
    })
    assert verify_res.status_code == 200, f"Expected 200, got {verify_res.status_code}: {verify_res.data}"
    assert verify_res.data["success"] is True
    print("    PASSED: Payment verified and Order marked COMPLETED.")

    # Verify Enrollment exists in DB
    enrollment = StudentEnrollment.objects.filter(user=test_user, course=cy_course, is_active=True).first()
    assert enrollment is not None, "Enrollment record should exist in DB"
    assert enrollment.progress_percent == 0
    print(f"    PASSED: Active StudentEnrollment created in PostgreSQL for '{enrollment.course_title}'.")

    # 6. Verify Dashboard now reflects unlocked course
    print("[6] Testing Post-Purchase Dashboard & Content Access...")
    my_courses_res = client.get(f"/api/courses/my-enrollments/?user_id={test_user.id}")
    assert my_courses_res.data["has_enrollments"] is True
    assert my_courses_res.data["count"] == 1
    print("    PASSED: Student dashboard immediately returns 1 active course without refresh.")

    # Verify previously locked lecture is now unlocked
    detail_after_res = client.get(f"/api/courses/{cy_course.slug}/?user_id={test_user.id}")
    paid_after = next(l for l in detail_after_res.data["modules"][0]["lectures"] if not l.get("is_preview_free"))
    assert paid_after["is_locked"] is False
    assert bool(paid_after["video_url"]) is True
    print("    PASSED: Paid lecture is now completely unlocked and viewable by the student.")

    # 7. Test Duplicate Checkout Prevention
    print("[7] Testing Duplicate Checkout Prevention...")
    dup_res = client.post("/api/courses/checkout/create-order/", {
        "course_id": cy_course.id,
        "user_id": test_user.id
    })
    assert dup_res.status_code == 400
    assert dup_res.data["already_enrolled"] is True
    print("    PASSED: Duplicate checkout attempt blocked with friendly error.")

    # Cleanup test student
    StudentEnrollment.objects.filter(user=test_user).delete()
    Order.objects.filter(user=test_user).delete()
    Payment.objects.filter(user=test_user).delete()
    test_user.delete()

    print("==================================================")
    print("  ALL 7 STUDENT JOURNEY & RAZORPAY TESTS PASSED!  ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
