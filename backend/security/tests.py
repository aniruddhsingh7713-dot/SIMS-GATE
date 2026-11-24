import threading
from django.test import TestCase, TransactionTestCase, Client
from django.contrib.auth.models import User
from django.db import connection
from .models import (
    StudentDevice,
    DeviceLoginHistory,
    SecurityAlert,
    AccountSecurityStatus,
    DeviceReplacementRequest,
    AdminSecurityAuditLog
)
from .services import (
    register_or_verify_device,
    check_device_authorization_for_content,
    revoke_student_device,
    reset_all_student_devices,
    suspend_student_account,
    reactivate_student_account,
    process_device_replacement_request
)
from courses.models import Course, TestSeriesItem


class DeviceLimitSecurityTestCase(TestCase):
    def setUp(self):
        # Create test student
        self.student = User.objects.create_user(
            username='student_test_device',
            email='student_device@simsgate.com',
            password='TestPassword123!',
            first_name='Aniruddh',
            last_name='Singh'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin_security_test',
            email='admin@simsgate.com',
            password='AdminPassword123!'
        )
        # Create test course and test item
        self.course = Course.objects.create(
            title="GATE Chemistry Test Series 2026",
            slug="gate-chemistry-test-series-2026",
            branch="CSE",
            price=1999.00,
            is_active=True
        )
        self.test_item = TestSeriesItem.objects.create(
            course=self.course,
            title="Physical Chemistry Grand Mock 01",
            subject="Physical Chemistry",
            topic="Thermodynamics & Kinetics",
            branch="CSE",
            test_status="PUBLISHED",
            visibility_status="PUBLIC",
            is_active=True,
            total_marks=100.0,
            duration_minutes=180
        )

    def test_01_first_device_registration(self):
        """TEST 1: Student logs in from Laptop 1. Expected: Device registered in Slot 1."""
        res = register_or_verify_device(
            student=self.student,
            device_id='device-laptop-001',
            client_metadata={'device_name': 'HP Omen Windows 11', 'device_type': 'desktop'},
            ip_address='103.21.244.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0'
        )
        self.assertTrue(res['success'])
        self.assertEqual(res['status'], 'REGISTERED')
        self.assertEqual(res['active_devices_count'], 1)
        self.assertTrue(StudentDevice.objects.filter(student=self.student, device_id='device-laptop-001', is_active=True).exists())

    def test_02_second_device_registration(self):
        """TEST 2: Student logs in from Mobile 2. Expected: Device registered in Slot 2."""
        # Register Laptop 1
        register_or_verify_device(
            student=self.student,
            device_id='device-laptop-001',
            client_metadata={'device_name': 'Windows Laptop'},
            ip_address='103.21.244.1'
        )
        # Register Mobile 2
        res2 = register_or_verify_device(
            student=self.student,
            device_id='device-mobile-002',
            client_metadata={'device_name': 'OnePlus 12 Android', 'device_type': 'mobile'},
            ip_address='157.34.120.45',
            user_agent='Mozilla/5.0 (Linux; Android 14; CPH2581) Mobile Safari/537.36'
        )
        self.assertTrue(res2['success'])
        self.assertEqual(res2['status'], 'REGISTERED')
        self.assertEqual(res2['active_devices_count'], 2)
        self.assertEqual(StudentDevice.objects.filter(student=self.student, is_active=True).count(), 2)

    def test_03_third_device_blocked(self):
        """TEST 3: Student logs in from Laptop 3. Expected: Access blocked (Limit Exceeded) and security alert generated."""
        register_or_verify_device(student=self.student, device_id='device-laptop-001', client_metadata={'device_name': 'Laptop 1'})
        register_or_verify_device(student=self.student, device_id='device-mobile-002', client_metadata={'device_name': 'Mobile 2'})

        # Attempt registration from 3rd device
        res3 = register_or_verify_device(
            student=self.student,
            device_id='device-tablet-003',
            client_metadata={'device_name': 'iPad Pro Tablet', 'device_type': 'tablet'},
            ip_address='182.74.88.2',
            user_agent='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X)'
        )
        self.assertFalse(res3['success'])
        self.assertEqual(res3['status'], 'LIMIT_EXCEEDED')
        self.assertEqual(res3['active_devices_count'], 2)
        self.assertEqual(len(res3['registered_devices']), 2)

        # Confirm SecurityAlert was created
        alert = SecurityAlert.objects.filter(student=self.student, alert_type='THIRD_DEVICE_ATTEMPT').first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.risk_level, 'HIGH')

        # Confirm LoginHistory recorded blocked attempt
        hist = DeviceLoginHistory.objects.filter(student=self.student, status='BLOCKED_LIMIT').first()
        self.assertIsNotNone(hist)
        self.assertEqual(hist.device_id_attempted, 'device-tablet-003')

    def test_04_existing_device_login_allowed(self):
        """TEST 4: Existing registered laptop logs in again. Expected: Access allowed."""
        r1 = register_or_verify_device(student=self.student, device_id='device-laptop-001', client_metadata={'device_name': 'Laptop 1'})
        token = r1['token']

        # Existing device verifies
        verify_res = register_or_verify_device(
            student=self.student,
            device_id='device-laptop-001',
            raw_token=token,
            ip_address='103.21.244.5'
        )
        self.assertTrue(verify_res['success'])
        self.assertEqual(verify_res['status'], 'VERIFIED')

    def test_05_student_replacement_request_workflow(self):
        """TEST 5: Student requests device replacement. Expected: Admin approval workflow."""
        register_or_verify_device(student=self.student, device_id='device-laptop-001', client_metadata={'device_name': 'Laptop 1'})
        register_or_verify_device(student=self.student, device_id='device-mobile-002', client_metadata={'device_name': 'Mobile 2'})

        old_phone = StudentDevice.objects.get(student=self.student, device_id='device-mobile-002')

        # Student submits replacement request
        req = DeviceReplacementRequest.objects.create(
            student=self.student,
            device_to_remove=old_phone,
            new_device_name='New Samsung Phone',
            reason='Old phone screen broken, purchased replacement phone'
        )
        self.assertEqual(req.status, 'PENDING')

        # Admin approves replacement
        approved = process_device_replacement_request(
            admin_user=self.admin_user,
            request_id=req.id,
            approve=True,
            notes='Verified with candidate via phone'
        )
        self.assertTrue(approved)
        req.refresh_from_db()
        self.assertEqual(req.status, 'APPROVED')

        # Old device should now be revoked
        old_phone.refresh_from_db()
        self.assertFalse(old_phone.is_active)

        # Student now has 1 active device and can register new device!
        self.assertEqual(StudentDevice.objects.filter(student=self.student, is_active=True).count(), 1)
        res_new = register_or_verify_device(
            student=self.student,
            device_id='device-new-samsung-004',
            client_metadata={'device_name': 'New Samsung Phone'}
        )
        self.assertTrue(res_new['success'])
        self.assertEqual(res_new['status'], 'REGISTERED')

    def test_06_admin_revokes_device(self):
        """TEST 6: Admin revokes Device 1. Expected: Revoked device token no longer works."""
        register_or_verify_device(student=self.student, device_id='device-laptop-001', client_metadata={'device_name': 'Laptop 1'})
        
        # Admin revokes
        revoked = revoke_student_device(
            admin_user=self.admin_user,
            student=self.student,
            device_id='device-laptop-001',
            reason='Suspicious sharing activity reported'
        )
        self.assertTrue(revoked)

        # Device attempt fails
        check_res = check_device_authorization_for_content(
            user=self.student,
            device_id='device-laptop-001'
        )
        self.assertFalse(check_res['authorized'])

    def test_07_and_08_account_suspension_and_reactivation(self):
        """TEST 7 & 8: Admin suspends account (access denied) then reactivates account (access restored)."""
        r1 = register_or_verify_device(student=self.student, device_id='device-laptop-001', client_metadata={'device_name': 'Laptop 1'})
        token = r1['token']

        # TEST 7: Suspend
        suspend_student_account(
            admin_user=self.admin_user,
            student=self.student,
            reason='Suspected account resale'
        )
        check_suspended = check_device_authorization_for_content(
            user=self.student,
            device_id='device-laptop-001',
            raw_token=token
        )
        self.assertFalse(check_suspended['authorized'])
        self.assertEqual(check_suspended['code'], 'ACCOUNT_SUSPENDED')

        # TEST 8: Reactivate
        reactivate_student_account(
            admin_user=self.admin_user,
            student=self.student,
            reason='Identity verified with Aadhaar and student ID card'
        )
        check_active = check_device_authorization_for_content(
            user=self.student,
            device_id='device-laptop-001',
            raw_token=token
        )
        self.assertTrue(check_active['authorized'])


class DeviceConcurrencyTransactionTestCase(TransactionTestCase):
    """TEST 9: Two simultaneous new-device registration requests enforced without race conditions."""
    def setUp(self):
        self.student = User.objects.create_user(
            username='concurrency_student',
            email='concurrency@simsgate.com',
            password='Password123!'
        )
        # Pre-register 1 device
        register_or_verify_device(
            student=self.student,
            device_id='dev-pre-001',
            client_metadata={'device_name': 'Device 1 Pre-Registered'}
        )

    def test_09_concurrent_registrations_prevent_third_device(self):
        results = []
        errors = []

        def register_worker(dev_id):
            try:
                # Close thread's connection to allow clean thread-specific DB connection
                connection.close()
                res = register_or_verify_device(
                    student=self.student,
                    device_id=dev_id,
                    client_metadata={'device_name': f'Concurrent {dev_id}'}
                )
                results.append(res)
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=register_worker, args=('dev-concurrent-A',))
        t2 = threading.Thread(target=register_worker, args=('dev-concurrent-B',))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(errors), 0, f"Errors occurred during concurrent registration: {errors}")
        self.assertEqual(len(results), 2)

        statuses = [r.get('status') for r in results]
        # Exactly one must be REGISTERED (taking the 2nd slot), and exactly one must be LIMIT_EXCEEDED!
        self.assertIn('REGISTERED', statuses)
        self.assertIn('LIMIT_EXCEEDED', statuses)

        # Database must have exactly 2 active devices, never 3!
        active_count = StudentDevice.objects.filter(student=self.student, is_active=True).count()
        self.assertEqual(active_count, 2)
