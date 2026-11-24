import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from security.models import StudentDevice, AccountSecurityStatus, SecurityAlert

def run_api_tests():
    print("=" * 70)
    print("  TESTING SECURITY REST API ENDPOINTS")
    print("=" * 70)

    # Clean up test accounts
    User.objects.filter(username__in=['api_student', 'api_admin']).delete()

    student = User.objects.create_user(
        username='api_student',
        email='api_student@simsgate.com',
        password='TestPassword123!',
        first_name='Karan',
        last_name='Verma'
    )
    admin = User.objects.create_superuser(
        username='api_admin',
        email='api_admin@simsgate.com',
        password='AdminPassword123!'
    )

    c = Client()

    # 1. POST /api/security/register-device/ (Device 1)
    c.force_login(student)
    r1 = c.post('/api/security/register-device/', {
        'device_id': 'api-dev-001',
        'device_name': 'MacBook Pro M3',
        'device_type': 'desktop',
        'operating_system': 'macOS 14',
        'browser': 'Safari 17'
    }, content_type='application/json')
    print("1. Register Device 1 status:", r1.status_code, r1.json().get('status'))
    assert r1.status_code == 200 and r1.json().get('status') == 'REGISTERED'

    # 2. POST /api/security/register-device/ (Device 2)
    r2 = c.post('/api/security/register-device/', {
        'device_id': 'api-dev-002',
        'device_name': 'iPhone 15 Pro',
        'device_type': 'mobile',
        'operating_system': 'iOS 17',
        'browser': 'Mobile Safari'
    }, content_type='application/json')
    print("2. Register Device 2 status:", r2.status_code, r2.json().get('status'))
    assert r2.status_code == 200 and r2.json().get('status') == 'REGISTERED'

    # 3. POST /api/security/register-device/ (Device 3 - Blocked)
    r3 = c.post('/api/security/register-device/', {
        'device_id': 'api-dev-003',
        'device_name': 'Windows Workstation',
        'device_type': 'desktop',
        'operating_system': 'Windows 11',
        'browser': 'Edge'
    }, content_type='application/json')
    print("3. Register Device 3 status:", r3.status_code, r3.json().get('status'))
    assert r3.status_code == 403 and r3.json().get('status') == 'LIMIT_EXCEEDED'

    # 4. GET /api/security/my-devices/
    r_my = c.get('/api/security/my-devices/', HTTP_X_DEVICE_ID='api-dev-001')
    print("4. My Devices status:", r_my.status_code, "Count:", r_my.json().get('registered_count'))
    assert r_my.status_code == 200 and r_my.json().get('registered_count') == 2
    devices = r_my.json().get('devices', [])
    assert len(devices) == 2
    assert any(d.get('is_current_device') for d in devices)

    # 5. POST /api/security/request-device-replacement/
    r_rep = c.post('/api/security/request-device-replacement/', {
        'device_id': 'api-dev-002',
        'reason': 'Lost my iPhone, bought an iPad',
        'new_device_name': 'iPad Air'
    }, content_type='application/json')
    print("5. Request Replacement status:", r_rep.status_code, r_rep.json().get('message'))
    assert r_rep.status_code == 201

    # 6. Admin Endpoints: GET /api/admin/security/devices/
    c_admin = Client()
    c_admin.force_login(admin)
    r_admin_dev = c_admin.get('/api/admin/security/devices/')
    print("6. Admin Device List status:", r_admin_dev.status_code, "Records:", r_admin_dev.json().get('total_records'))
    assert r_admin_dev.status_code == 200 and r_admin_dev.json().get('total_records') >= 2

    # 7. GET /api/admin/security/alerts/
    r_admin_alerts = c_admin.get('/api/admin/security/alerts/')
    print("7. Admin Alerts status:", r_admin_alerts.status_code, "Total alerts:", r_admin_alerts.json().get('total_alerts'))
    assert r_admin_alerts.status_code == 200 and r_admin_alerts.json().get('total_alerts') >= 1

    # 8. POST /api/admin/security/revoke-device/
    r_revoke = c_admin.post('/api/admin/security/revoke-device/', {
        'student_id': student.id,
        'device_id': 'api-dev-001',
        'reason': 'Security violation audit'
    }, content_type='application/json')
    print("8. Admin Revoke Device status:", r_revoke.status_code, r_revoke.json().get('message'))
    assert r_revoke.status_code == 200

    # 9. POST /api/admin/security/suspend-account/
    r_susp = c_admin.post('/api/admin/security/suspend-account/', {
        'student_id': student.id,
        'reason': 'Breach of single-user license'
    }, content_type='application/json')
    print("9. Admin Suspend Account status:", r_susp.status_code, r_susp.json().get('message'))
    assert r_susp.status_code == 200

    # 10. POST /api/admin/security/reactivate-account/
    r_react = c_admin.post('/api/admin/security/reactivate-account/', {
        'student_id': student.id,
        'reason': 'Student signed compliance affidavit'
    }, content_type='application/json')
    print("10. Admin Reactivate Account status:", r_react.status_code, r_react.json().get('message'))
    assert r_react.status_code == 200

    # Clean up
    User.objects.filter(username__in=['api_student', 'api_admin']).delete()

    print("=" * 70)
    print("  🎉 ALL 10 REST API ENDPOINTS VERIFIED AND PASSING!")
    print("=" * 70)
    return True

if __name__ == '__main__':
    run_api_tests()
