import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
from datetime import timedelta
from django.utils import timezone

# Configure Django settings
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from courses.models import (
    Course, TestSeriesItem, TestQuestion, StudentEnrollment, Order, Payment, StudentTestAttempt
)
from courses.services.test_access_control import (
    check_student_test_eligibility, filter_tests_for_student, normalize_branch
)


def run_comprehensive_security_test_suite():
    print("=" * 80)
    print("SIMS GATE — BRANCH & PURCHASE ACCESS CONTROL SECURITY AUDIT")
    print("=" * 80)

    client = Client()
    now = timezone.now()

    # -------------------------------------------------------------------------
    # SETUP TEST FIXTURES
    # -------------------------------------------------------------------------
    print("\n[+] Setting up test courses, test papers & student accounts...")

    # 1. Test Series Courses
    cse_course, _ = Course.objects.get_or_create(
        slug="gate-cse-test-series-2027-test",
        defaults={
            "title": "GATE CSE 2027 Test Series Package",
            "branch": "CSE",
            "category": "GATE_CSE",
            "price": 1999.00,
            "is_active": True,
        }
    )

    ece_course, _ = Course.objects.get_or_create(
        slug="gate-ece-test-series-2027-test",
        defaults={
            "title": "GATE ECE 2027 Test Series Package",
            "branch": "ECE",
            "category": "GATE_CSE",
            "price": 1999.00,
            "is_active": True,
        }
    )

    # 2. Test Items
    cse_test, _ = TestSeriesItem.objects.get_or_create(
        title="GATE CSE 2027 Full Mock #01 (Audit)",
        defaults={
            "course": cse_course,
            "branch": "CSE",
            "test_type": "Full Length Mock",
            "subject": "Computer Science",
            "topic": "Algorithms & Operating Systems",
            "total_questions": 10,
            "total_marks": 15,
            "duration_minutes": 180,
            "test_status": "PUBLISHED",
            "visibility_status": "RESTRICTED",
            "is_active": True,
        }
    )

    ece_test, _ = TestSeriesItem.objects.get_or_create(
        title="GATE ECE 2027 Full Mock #01 (Audit)",
        defaults={
            "course": ece_course,
            "branch": "ECE",
            "test_type": "Full Length Mock",
            "subject": "Electronics",
            "topic": "Signals & Systems",
            "total_questions": 10,
            "total_marks": 15,
            "duration_minutes": 180,
            "test_status": "PUBLISHED",
            "visibility_status": "RESTRICTED",
            "is_active": True,
        }
    )

    draft_test, _ = TestSeriesItem.objects.get_or_create(
        title="GATE CSE 2027 Draft Unreleased Mock (Audit)",
        defaults={
            "course": cse_course,
            "branch": "CSE",
            "test_type": "Full Length Mock",
            "subject": "Computer Science",
            "total_questions": 10,
            "total_marks": 15,
            "test_status": "DRAFT",
            "visibility_status": "RESTRICTED",
            "is_active": True,
        }
    )

    # Ensure questions exist for cse_test
    if not cse_test.questions.exists():
        TestQuestion.objects.create(
            test=cse_test,
            question_number=1,
            section="CORE",
            question_type="MCQ",
            question_text="What is Dijkstra algorithm asymptotic time complexity?",
            option_a="O(V^2)", option_b="O((V+E)logV)", option_c="O(E log V)", option_d="O(V log E)",
            correct_answer="B",
            explanation="Using binary heap it is O((V+E)logV).",
            marks=2.0,
            negative_marks=0.66
        )

    # Ensure questions exist for ece_test
    if not ece_test.questions.exists():
        TestQuestion.objects.create(
            test=ece_test,
            question_number=1,
            section="CORE",
            question_type="MCQ",
            question_text="What is the Nyquist sampling rate for a 4kHz band-limited signal?",
            option_a="4 kHz", option_b="8 kHz", option_c="16 kHz", option_d="2 kHz",
            correct_answer="B",
            explanation="Nyquist rate = 2 * B = 8 kHz.",
            marks=2.0,
            negative_marks=0.66
        )

    # 3. Student Accounts
    # Student A: CSE Branch + CSE Purchase
    user_a, _ = User.objects.get_or_create(username="student_a_cse", defaults={"email": "student_a@sims.test"})
    user_a.set_password("AuditPass123!")
    user_a.save()
    StudentEnrollment.objects.update_or_create(
        user=user_a, course=cse_course,
        defaults={"branch": "CSE", "enrollment_type": "TEST_SERIES", "is_active": True}
    )
    ord_a, _ = Order.objects.update_or_create(
        user=user_a, course=cse_course,
        defaults={"amount": 1999.00, "status": "COMPLETED", "razorpay_order_id": "ord_audit_a"}
    )
    Payment.objects.update_or_create(
        order=ord_a,
        defaults={"user": user_a, "amount": 1999.00, "status": "SUCCESS", "razorpay_payment_id": "pay_audit_a", "razorpay_order_id": "ord_audit_a"}
    )

    # Student B: ECE Branch + ECE Purchase
    user_b, _ = User.objects.get_or_create(username="student_b_ece", defaults={"email": "student_b@sims.test"})
    user_b.set_password("AuditPass123!")
    user_b.save()
    StudentEnrollment.objects.update_or_create(
        user=user_b, course=ece_course,
        defaults={"branch": "ECE", "enrollment_type": "TEST_SERIES", "is_active": True}
    )
    ord_b, _ = Order.objects.update_or_create(
        user=user_b, course=ece_course,
        defaults={"amount": 1999.00, "status": "COMPLETED", "razorpay_order_id": "ord_audit_b"}
    )
    Payment.objects.update_or_create(
        order=ord_b,
        defaults={"user": user_b, "amount": 1999.00, "status": "SUCCESS", "razorpay_payment_id": "pay_audit_b", "razorpay_order_id": "ord_audit_b"}
    )

    # Student C: CSE Branch + NO Purchase
    user_c, _ = User.objects.get_or_create(username="student_c_unpurchased", defaults={"email": "student_c@sims.test"})
    user_c.set_password("AuditPass123!")
    user_c.save()
    # Enrolled in general course only, NO test series purchase
    StudentEnrollment.objects.update_or_create(
        user=user_c, course=None,
        defaults={"branch": "CSE", "enrollment_type": "COURSE", "course_title": "Classroom Intro", "is_active": True}
    )
    Order.objects.filter(user=user_c, course=cse_course).delete()

    # Student D: CSE Branch + Expired Purchase
    user_d, _ = User.objects.get_or_create(username="student_d_expired", defaults={"email": "student_d@sims.test"})
    user_d.set_password("AuditPass123!")
    user_d.save()
    StudentEnrollment.objects.filter(user=user_d).delete()
    ord_d, _ = Order.objects.update_or_create(
        user=user_d, course=cse_course,
        defaults={"amount": 1999.00, "status": "COMPLETED", "razorpay_order_id": "ord_audit_d"}
    )
    # Manually backdate created_at to 3 years ago
    Order.objects.filter(id=ord_d.id).update(created_at=now - timedelta(days=365 * 3))

    # Student E: CSE Branch + Refunded Purchase
    user_e, _ = User.objects.get_or_create(username="student_e_refunded", defaults={"email": "student_e@sims.test"})
    user_e.set_password("AuditPass123!")
    user_e.save()
    ord_e, _ = Order.objects.update_or_create(
        user=user_e, course=cse_course,
        defaults={"amount": 1999.00, "status": "REFUNDED", "razorpay_order_id": "ord_audit_e"}
    )
    StudentEnrollment.objects.update_or_create(
        user=user_e, course=cse_course, order=ord_e,
        defaults={"branch": "CSE", "enrollment_type": "TEST_SERIES", "is_active": False}
    )

    # Clean previous audit test attempts
    StudentTestAttempt.objects.filter(user__in=[user_a, user_b, user_c, user_d, user_e]).delete()

    print("[+] Test database fixtures initialized successfully.")

    passed_count = 0
    total_tests = 10

    # -------------------------------------------------------------------------
    # TEST 1: CSE Student with CSE Purchase
    # -------------------------------------------------------------------------
    print("\n--- TEST 1: CSE student with CSE purchase ---")
    el_1 = check_student_test_eligibility(user_a, cse_test)
    assert el_1["eligible"] == True, f"Failed: {el_1}"
    res_1 = client.get(f"/api/dashboard/test-series/{cse_test.id}/?user_id={user_a.id}")
    assert res_1.status_code == 200, f"Expected 200, got {res_1.status_code}"
    # Verify answers are NOT leaked to candidate
    data_1 = res_1.json()
    if data_1.get("questions"):
        for q in data_1["questions"]:
            assert "correct_answer" not in q or q.get("correct_answer") is None, "Security Leak: correct_answer exposed!"
    print("✓ PASSED: CSE Student successfully granted access to CSE Test without leaking solutions.")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 2: ECE Student with ECE Purchase
    # -------------------------------------------------------------------------
    print("\n--- TEST 2: ECE student with ECE purchase ---")
    el_2 = check_student_test_eligibility(user_b, ece_test)
    assert el_2["eligible"] == True, f"Failed: {el_2}"
    res_2 = client.get(f"/api/dashboard/test-series/{ece_test.id}/?user_id={user_b.id}")
    assert res_2.status_code == 200, f"Expected 200, got {res_2.status_code}"
    print("✓ PASSED: ECE Student successfully granted access to ECE Test.")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 3: CSE Student attempting to access ECE Test
    # -------------------------------------------------------------------------
    print("\n--- TEST 3: CSE student attempting to access ECE Test (Branch Mismatch) ---")
    el_3 = check_student_test_eligibility(user_a, ece_test)
    assert el_3["eligible"] == False, "Security Failure: CSE student allowed into ECE test!"
    assert el_3["status_code"] == 403, f"Expected 403, got {el_3['status_code']}"
    res_3 = client.get(f"/api/dashboard/test-series/{ece_test.id}/?user_id={user_a.id}")
    assert res_3.status_code == 403, f"Expected 403 HTTP, got {res_3.status_code}"
    print(f"✓ PASSED: Backend correctly rejected with 403 Forbidden: {res_3.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 4: CSE Student without purchase attempting to access CSE Test
    # -------------------------------------------------------------------------
    print("\n--- TEST 4: CSE student without purchase attempting paid CSE Test ---")
    el_4 = check_student_test_eligibility(user_c, cse_test)
    assert el_4["eligible"] == False, "Security Failure: Unpurchased student allowed access!"
    assert el_4["status_code"] == 403, f"Expected 403, got {el_4['status_code']}"
    res_4 = client.get(f"/api/dashboard/test-series/{cse_test.id}/?user_id={user_c.id}")
    assert res_4.status_code == 403, f"Expected 403 HTTP, got {res_4.status_code}"
    print(f"✓ PASSED: Backend correctly rejected with 403 Forbidden: {res_4.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 5: Expired purchase validation
    # -------------------------------------------------------------------------
    print("\n--- TEST 5: Expired purchase validation ---")
    el_5 = check_student_test_eligibility(user_d, cse_test)
    assert el_5["eligible"] == False, "Security Failure: Expired purchase granted access!"
    assert el_5["status_code"] == 403, f"Expected 403, got {el_5['status_code']}"
    res_5 = client.get(f"/api/dashboard/test-series/{cse_test.id}/?user_id={user_d.id}")
    assert res_5.status_code == 403, f"Expected 403 HTTP, got {res_5.status_code}"
    print(f"✓ PASSED: Expired purchase rejected with 403: {res_5.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 6: Refunded purchase validation
    # -------------------------------------------------------------------------
    print("\n--- TEST 6: Refunded purchase validation ---")
    el_6 = check_student_test_eligibility(user_e, cse_test)
    assert el_6["eligible"] == False, "Security Failure: Refunded purchase granted access!"
    assert el_6["status_code"] == 403, f"Expected 403, got {el_6['status_code']}"
    res_6 = client.get(f"/api/dashboard/test-series/{cse_test.id}/?user_id={user_e.id}")
    assert res_6.status_code == 403, f"Expected 403 HTTP, got {res_6.status_code}"
    print(f"✓ PASSED: Refunded purchase rejected with 403: {res_6.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 7: Unpublished (Draft) test validation
    # -------------------------------------------------------------------------
    print("\n--- TEST 7: Unpublished (Draft) test validation ---")
    el_7 = check_student_test_eligibility(user_a, draft_test)
    assert el_7["eligible"] == False, "Security Failure: Student accessed draft test!"
    assert el_7["status_code"] == 404, f"Expected 404 for draft test, got {el_7['status_code']}"
    res_7 = client.get(f"/api/dashboard/test-series/{draft_test.id}/?user_id={user_a.id}")
    assert res_7.status_code in [403, 404], f"Expected 404/403, got {res_7.status_code}"
    print(f"✓ PASSED: Draft test paper hidden from student with {res_7.status_code}.")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 8: Student changing URL / PK to another branch's test
    # -------------------------------------------------------------------------
    print("\n--- TEST 8: Student changing URL parameter to another branch's test ---")
    # Student B (ECE) tries to tamper URL to view CSE test ID
    res_8 = client.get(f"/api/dashboard/test-series/{cse_test.id}/?user_id={user_b.id}")
    assert res_8.status_code == 403, f"Expected 403 URL tamper rejection, got {res_8.status_code}"
    print(f"✓ PASSED: URL tampering blocked with 403: {res_8.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 9: Direct API access to questions before test start
    # -------------------------------------------------------------------------
    print("\n--- TEST 9: Direct question fetching API access before starting test ---")
    # Delete any ongoing attempt first
    StudentTestAttempt.objects.filter(user=user_a, test=cse_test).delete()
    res_9 = client.get(f"/api/dashboard/test-series/{cse_test.id}/questions/?user_id={user_a.id}")
    assert res_9.status_code == 403, f"Expected 403 for unstarted test question access, got {res_9.status_code}"
    print(f"✓ PASSED: Direct question leak blocked with 403: {res_9.json().get('error')}")

    # Now start test properly
    res_9_start = client.post(f"/api/dashboard/test-series/{cse_test.id}/start/", data=json.dumps({"user_id": user_a.id}), content_type="application/json")
    assert res_9_start.status_code == 200, f"Expected 200, got {res_9_start.status_code}"
    start_data = res_9_start.json()
    assert start_data.get("success") == True
    # Confirm questions in start response DO NOT leak correct answers
    for q in start_data["questions"]:
        assert "correct_answer" not in q, "Security Leak: correct_answer exposed during test start!"
    print("✓ PASSED: Test properly started; questions sanitized without answer leakage.")
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 10: Student attempting to access another student's test results
    # -------------------------------------------------------------------------
    print("\n--- TEST 10: Student attempting to access another student's results ---")
    # First submit Student A's test
    submit_payload = {
        "user_id": user_a.id,
        "time_taken_seconds": 950,
        "responses": {
            str(cse_test.questions.first().id): "B"
        }
    }
    res_submit = client.post(f"/api/dashboard/test-series/{cse_test.id}/submit-attempt/", data=json.dumps(submit_payload), content_type="application/json")
    assert res_submit.status_code == 200, f"Expected 200 submit, got {res_submit.status_code}"

    # Student A can view their own results
    res_own_result = client.get(f"/api/dashboard/test-series/{cse_test.id}/result/?user_id={user_a.id}")
    assert res_own_result.status_code == 200, f"Expected 200 for own result, got {res_own_result.status_code}"
    own_data = res_own_result.json()
    assert own_data["score"] == 2.0, f"Expected score 2.0, got {own_data['score']}"
    print(f"✓ Student A evaluated score: {own_data['score']}/{own_data['total_marks']}")

    # Now Student B attempts to fetch Student A's result by specifying ?student_id=<user_a.id>
    res_10 = client.get(f"/api/dashboard/test-series/{cse_test.id}/result/?user_id={user_b.id}&student_id={user_a.id}")
    assert res_10.status_code == 403, f"Expected 403 Forbidden for cross-student result snooping, got {res_10.status_code}"
    print(f"✓ PASSED: Cross-student result snooping rejected with 403: {res_10.json().get('error')}")
    passed_count += 1

    # -------------------------------------------------------------------------
    # FINAL SUMMARY
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(f"🎉 AUDIT COMPLETE: {passed_count}/{total_tests} SECURITY TEST SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 80)


if __name__ == "__main__":
    run_comprehensive_security_test_suite()
