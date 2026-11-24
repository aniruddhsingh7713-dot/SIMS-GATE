import os
import sys
import threading
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection, transaction
from security.models import (
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    AccountSecurityStatus,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)
from security.services import (
    register_or_verify_device,
    check_device_authorization_for_content,
    revoke_student_device,
    reset_all_student_devices,
    suspend_student_account,
    reactivate_student_account,
    process_device_replacement_request
)
from courses.models import Course, TestSeriesItem, Order

def print_test(name, success, details=""):
    mark = "✅ PASS" if success else "❌ FAIL"
    print(f"[{mark}] {name}")
    if details:
        print(f"       -> {details}")

def cleanup(student_username='test_student_scenarios', admin_username='test_admin_scenarios'):
    student = User.objects.filter(username=student_username).first()
    if student:
        StudentDevice.objects.filter(student=student).delete()
        DeviceLoginHistory.objects.filter(student=student).delete()
        SecurityAlert.objects.filter(student=student).delete()
        AccountSecurityStatus.objects.filter(student=student).delete()
        DeviceReplacementRequest.objects.filter(student=student).delete()
        AdminSecurityAuditLog.objects.filter(target_student=student).delete()
        Order.objects.filter(user=student).delete()
        student.delete()

    admin = User.objects.filter(username=admin_username).first()
    if admin:
        AdminSecurityAuditLog.objects.filter(admin_user=admin).delete()
        admin.delete()

def run_all_tests():
    print("=" * 70)
    print("  SIMS GATE - ADVANCED DEVICE LIMIT & ANTI-ACCOUNT SHARING TEST SUITE")
    print("=" * 70)

    cleanup()

    # Create test student & admin
    student = User.objects.create_user(
        username='test_student_scenarios',
        email='student_scenario@simsgate.com',
        password='TestPassword123!',
        first_name='Rahul',
        last_name='Sharma'
    )
    admin = User.objects.create_superuser(
        username='test_admin_scenarios',
        email='admin_scenario@simsgate.com',
        password='AdminPassword123!'
    )

    course = Course.objects.filter(branch='CSE').first()
    if not course:
        course = Course.objects.create(
            title="GATE CSE Test Series 2026",
            slug="gate-cse-test-series-2026",
            branch="CSE",
            price=1499.00
        )
    test_item = TestSeriesItem.objects.filter(course=course).first()
    if not test_item:
        test_item = TestSeriesItem.objects.create(
            course=course,
            title="Full Syllabus Mock Test 01",
            branch="CSE",
            test_status="PUBLISHED",
            visibility_status="PUBLIC",
            is_active=True
        )

    # -------------------------------------------------------------------------
    # TEST 1: Student logs in from Laptop 1 -> Device registered (Slot 1)
    # -------------------------------------------------------------------------
    r1 = register_or_verify_device(
        student=student,
        device_id='laptop-win11-001',
        client_metadata={'device_name': 'HP Windows 11 Laptop', 'device_type': 'desktop', 'operating_system': 'Windows 11', 'browser': 'Chrome 126'},
        ip_address='103.25.14.8',
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0'
    )
    t1_pass = r1.get('success') and r1.get('status') == 'REGISTERED' and r1.get('active_devices_count') == 1
    print_test("TEST 1: Student logs in from Laptop 1 (Device registered in Slot 1)", t1_pass, f"Device: {r1.get('device_name')} (Count: {r1.get('active_devices_count')}/2)")

    # -------------------------------------------------------------------------
    # TEST 2: Student logs in from Mobile 2 -> Device registered (Slot 2)
    # -------------------------------------------------------------------------
    r2 = register_or_verify_device(
        student=student,
        device_id='mobile-android-002',
        client_metadata={'device_name': 'Samsung Galaxy S24 Android', 'device_type': 'mobile', 'operating_system': 'Android 14', 'browser': 'Chrome Mobile'},
        ip_address='157.34.120.45',
        user_agent='Mozilla/5.0 (Linux; Android 14; SM-S928B) Chrome/126.0 Mobile'
    )
    t2_pass = r2.get('success') and r2.get('status') == 'REGISTERED' and r2.get('active_devices_count') == 2
    print_test("TEST 2: Student logs in from Mobile 2 (Device registered in Slot 2)", t2_pass, f"Device: {r2.get('device_name')} (Count: {r2.get('active_devices_count')}/2)")

    # -------------------------------------------------------------------------
    # TEST 3: Student logs in from Laptop 3 -> Blocked & Security Alert generated
    # -------------------------------------------------------------------------
    r3 = register_or_verify_device(
        student=student,
        device_id='laptop-macbook-003',
        client_metadata={'device_name': 'MacBook Pro 16', 'device_type': 'desktop', 'operating_system': 'macOS', 'browser': 'Safari 17'},
        ip_address='182.74.88.2',
        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    )
    alert = SecurityAlert.objects.filter(student=student, alert_type='THIRD_DEVICE_ATTEMPT').first()
    login_hist = DeviceLoginHistory.objects.filter(student=student, status='BLOCKED_LIMIT').first()
    t3_pass = (
        not r3.get('success') and
        r3.get('status') == 'LIMIT_EXCEEDED' and
        r3.get('active_devices_count') == 2 and
        alert is not None and
        login_hist is not None and
        login_hist.device_id_attempted == 'laptop-macbook-003'
    )
    print_test("TEST 3: Student logs in from 3rd Device (Access blocked & Security alert logged)", t3_pass, f"Alert created: '{alert.message[:65]}...'")

    # -------------------------------------------------------------------------
    # TEST 4: Existing registered laptop logs in again -> Access allowed
    # -------------------------------------------------------------------------
    token_1 = r1.get('token')
    r4 = register_or_verify_device(
        student=student,
        device_id='laptop-win11-001',
        raw_token=token_1,
        ip_address='103.25.14.9'
    )
    t4_pass = r4.get('success') and r4.get('status') == 'VERIFIED'
    print_test("TEST 4: Existing registered laptop logs in again (Access allowed)", t4_pass, f"Verified device: {r4.get('device_name')}")

    # -------------------------------------------------------------------------
    # TEST 5: Student requests device replacement -> Admin approval workflow
    # -------------------------------------------------------------------------
    device_to_remove = StudentDevice.objects.get(student=student, device_id='mobile-android-002')
    req = DeviceReplacementRequest.objects.create(
        student=student,
        device_to_remove=device_to_remove,
        new_device_name='New Pixel 9 Pro',
        reason='Old phone lost while traveling, need to access test series on new device'
    )
    # Admin approves
    approved = process_device_replacement_request(
        admin_user=admin,
        request_id=req.id,
        approve=True,
        notes='Identity confirmed with candidate. Approved replacement.'
    )
    req.refresh_from_db()
    device_to_remove.refresh_from_db()
    # Now slot is freed: register new device
    r_new = register_or_verify_device(
        student=student,
        device_id='mobile-pixel-004',
        client_metadata={'device_name': 'Google Pixel 9 Pro', 'device_type': 'mobile'},
        ip_address='49.37.112.90'
    )
    t5_pass = approved and req.status == 'APPROVED' and not device_to_remove.is_active and r_new.get('status') == 'REGISTERED'
    print_test("TEST 5: Student requests replacement & Admin approves (Slot freed & new device registered)", t5_pass, f"Approved request #{req.id}, registered {r_new.get('device_name')}")

    # -------------------------------------------------------------------------
    # TEST 6: Admin revokes Device 1 -> Revoked device token no longer works
    # -------------------------------------------------------------------------
    revoked = revoke_student_device(
        admin_user=admin,
        student=student,
        device_id='laptop-win11-001',
        reason='Suspected account sharing detected during audit'
    )
    check_revoked = check_device_authorization_for_content(
        user=student,
        device_id='laptop-win11-001'
    )
    t6_pass = revoked and not check_revoked.get('authorized')
    print_test("TEST 6: Admin revokes Device 1 (Revoked device token no longer works)", t6_pass, f"Authorization check: authorized={check_revoked.get('authorized')} ({check_revoked.get('reason')})")

    # -------------------------------------------------------------------------
    # TEST 7: Admin suspends account -> Protected test series access denied
    # -------------------------------------------------------------------------
    # Re-register an active device
    reset_all_student_devices(admin_user=admin, student=student, reason='Reset before suspension test')
    r_active = register_or_verify_device(student=student, device_id='clean-device-001', client_metadata={'device_name': 'Clean Device'})
    token_active = r_active['token']

    suspend_student_account(
        admin_user=admin,
        student=student,
        reason='Violation of Terms of Service - Commercial Account Sharing'
    )
    check_susp = check_device_authorization_for_content(
        user=student,
        device_id='clean-device-001',
        raw_token=token_active
    )
    t7_pass = not check_susp.get('authorized') and check_susp.get('code') == 'ACCOUNT_SUSPENDED'
    print_test("TEST 7: Admin suspends account (Protected test series access denied)", t7_pass, f"Code: {check_susp.get('code')}, Reason: '{check_susp.get('reason')}'")

    # -------------------------------------------------------------------------
    # TEST 8: Admin reactivates account -> Access restored subject to device
    # -------------------------------------------------------------------------
    reactivate_student_account(
        admin_user=admin,
        student=student,
        reason='Candidate signed undertaking and verified credentials'
    )
    check_react = check_device_authorization_for_content(
        user=student,
        device_id='clean-device-001',
        raw_token=token_active
    )
    t8_pass = check_react.get('authorized') and check_react.get('code') == 'AUTHORIZED'
    print_test("TEST 8: Admin reactivates account (Access restored subject to device verification)", t8_pass, f"Code: {check_react.get('code')}, Authorized: {check_react.get('authorized')}")

    # -------------------------------------------------------------------------
    # TEST 9: Two simultaneous new-device registration requests (PostgreSQL Concurrency)
    # -------------------------------------------------------------------------
    results = []
    errors = []

    def concurrent_worker(dev_id):
        try:
            connection.close()  # Ensure separate thread connection
            res = register_or_verify_device(
                student=student,
                device_id=dev_id,
                client_metadata={'device_name': f'Concurrent {dev_id}'}
            )
            results.append(res)
        except Exception as e:
            errors.append(e)

    # Currently 1 active device exists ('clean-device-001').
    # Fire 2 concurrent registration requests simultaneously!
    th1 = threading.Thread(target=concurrent_worker, args=('concurrent-device-A',))
    th2 = threading.Thread(target=concurrent_worker, args=('concurrent-device-B',))
    th1.start()
    th2.start()
    th1.join()
    th2.join()

    statuses = [r.get('status') for r in results]
    final_active_count = StudentDevice.objects.filter(student=student, is_active=True).count()
    t9_pass = (
        len(errors) == 0 and
        'REGISTERED' in statuses and
        'LIMIT_EXCEEDED' in statuses and
        final_active_count == 2
    )
    print_test(
        "TEST 9: Two simultaneous registration requests (PostgreSQL race condition lock enforced)",
        t9_pass,
        f"Thread outcomes: {statuses}. Final active devices in DB: {final_active_count}/2"
    )

    cleanup()

    print("=" * 70)
    all_passed = all([t1_pass, t2_pass, t3_pass, t4_pass, t5_pass, t6_pass, t7_pass, t8_pass, t9_pass])
    if all_passed:
        print("  🎉 ALL 9 ADVANCED DEVICE SECURITY & CONCURRENCY TESTS PASSED!")
    else:
        print("  ❌ SOME TESTS FAILED. INSPECT ABOVE.")
    print("=" * 70)
    return all_passed

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
