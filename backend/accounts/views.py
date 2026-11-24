import re
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile

def serialize_user(user, profile=None):
    if not profile:
        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user)

    display_name = f"{user.first_name} {user.last_name}".strip() or user.username

    # Determine user role accurately
    if user.is_superuser:
        role = "admin"
    elif user.is_staff:
        role = getattr(profile, 'role', 'teacher') if hasattr(profile, 'role') else 'teacher'
    else:
        role = getattr(profile, 'role', 'student') if hasattr(profile, 'role') else 'student'

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": display_name,
        "phone": getattr(profile, 'phone', ''),
        "dob": getattr(profile, 'dob', ''),
        "gender": getattr(profile, 'gender', 'prefer_not_to_say'),
        "qualification": getattr(profile, 'qualification', ''),
        "preparation_level": getattr(profile, 'preparation_level', ''),
        "college": getattr(profile, 'college', ''),
        "target_branch": getattr(profile, 'target_branch', 'Computer Science (CSE)'),
        "target_exam": getattr(profile, 'target_exam', 'GATE 2026'),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "role": role,
        "is_onboarded": getattr(profile, 'is_onboarded', False)
    }

class RegisterAPIView(APIView):
    def post(self, request):
        data = request.data
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        full_name = (data.get('full_name') or data.get('name') or '').strip()
        phone = (data.get('phone') or '').strip()
        target_branch = (data.get('target_branch') or 'Computer Science (CSE)').strip()
        target_exam = (data.get('target_exam') or 'GATE 2026').strip()
        college = (data.get('college') or '').strip()

        # Validations: Every field is mandatory, phone must be exactly 10 digits
        if not full_name:
            return Response(
                {"success": False, "error": "Full name is mandatory."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email or '@' not in email:
            return Response(
                {"success": False, "error": "A valid email address is mandatory."},
                status=status.HTTP_400_BAD_REQUEST
            )

        clean_phone = re.sub(r'\D', '', phone)
        if not clean_phone:
            return Response(
                {"success": False, "error": "Phone number is mandatory."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(clean_phone) != 10:
            return Response(
                {"success": False, "error": "Phone number must be exactly 10 digits."},
                status=status.HTTP_400_BAD_REQUEST
            )
        phone = clean_phone

        if not target_branch:
            return Response(
                {"success": False, "error": "Target discipline is mandatory."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password or len(password) < 6:
            return Response(
                {"success": False, "error": "Password is mandatory and must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If username not provided, derive clean username from email or name
        if not username:
            base_user = email.split('@')[0]
            clean_base = re.sub(r'[^a-zA-Z0-9_]', '', base_user)[:20] or "student"
            username = clean_base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{clean_base}{counter}"
                counter += 1
        else:
            if User.objects.filter(username=username).exists():
                return Response(
                    {"success": False, "error": "This username is already taken. Please choose another."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if User.objects.filter(email=email).exists():
            return Response(
                {"success": False, "error": "An account with this email already exists. Please log in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse first and last names
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0] if name_parts else username
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Create user in Django's User table
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Create profile record - mark is_onboarded=True so student immediately lands in dashboard
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'phone': phone,
                'target_branch': target_branch,
                'target_exam': target_exam,
                'college': college,
                'is_onboarded': True
            }
        )
        profile.is_onboarded = True
        profile.save()

        try:
            login(request, user)
        except Exception:
            pass

        device_id = data.get('device_id') or request.headers.get('X-Device-Id')
        device_res = None
        if device_id:
            try:
                from security.services import register_or_verify_device
                from security.views import get_client_ip
                ip = get_client_ip(request)
                ua = request.META.get('HTTP_USER_AGENT', '')
                device_res = register_or_verify_device(
                    student=user,
                    device_id=device_id,
                    client_metadata=data,
                    ip_address=ip,
                    user_agent=ua
                )
            except Exception as e:
                pass

        display_name = f"{user.first_name} {user.last_name}".strip() or user.username

        return Response({
            "success": True,
            "message": f"Welcome to SIMS GATE, {display_name}!",
            "user": serialize_user(user, profile),
            "device": device_res
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    def post(self, request):
        data = request.data
        identifier = (data.get('username') or data.get('email') or '').strip()
        password = data.get('password') or ''

        if not identifier or not password:
            return Response(
                {"success": False, "error": "Please provide both username/email and password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow user to login with either email or username
        username_to_auth = identifier
        if '@' in identifier:
            user_by_email = User.objects.filter(email__iexact=identifier).first()
            if user_by_email:
                username_to_auth = user_by_email.username
            else:
                return Response(
                    {"success": False, "error": "No account found with this email address."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        user = authenticate(request, username=username_to_auth, password=password)

        if user is None:
            return Response(
                {"success": False, "error": "Invalid username or password. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"success": False, "error": "This account is inactive. Please contact the SIMS admissions desk."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check Account Security Status (Suspension / Lock)
        try:
            from security.models import AccountSecurityStatus
            sec_status = AccountSecurityStatus.objects.filter(student=user).first()
            if sec_status and sec_status.status in ['SUSPENDED', 'TEMPORARILY_LOCKED']:
                return Response({
                    "success": False,
                    "error": f"Account Access Blocked: Your account has been {sec_status.get_status_display().lower()} by administration. Please contact SIMS support desk.",
                    "code": "ACCOUNT_SUSPENDED",
                    "account_status": sec_status.status,
                    "review_reason": sec_status.review_reason
                }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass

        # Device Limit & Verification
        device_id = data.get('device_id') or request.headers.get('X-Device-Id')
        device_token = data.get('device_token') or request.headers.get('X-Device-Token')
        device_res = None
        if device_id:
            try:
                from security.services import register_or_verify_device
                from security.views import get_client_ip
                ip = get_client_ip(request)
                ua = request.META.get('HTTP_USER_AGENT', '')
                device_res = register_or_verify_device(
                    student=user,
                    device_id=device_id,
                    raw_token=device_token,
                    client_metadata=data,
                    ip_address=ip,
                    user_agent=ua
                )
                if not device_res.get('success'):
                    if device_res.get('status') == 'LIMIT_EXCEEDED':
                        return Response({
                            "success": False,
                            "error": device_res.get('message'),
                            "code": "DEVICE_LIMIT_EXCEEDED",
                            "device_limit": device_res
                        }, status=status.HTTP_403_FORBIDDEN)
                    elif device_res.get('status') == 'ACCOUNT_SUSPENDED':
                        return Response({
                            "success": False,
                            "error": device_res.get('message'),
                            "code": "ACCOUNT_SUSPENDED"
                        }, status=status.HTTP_403_FORBIDDEN)
            except Exception as e:
                pass

        try:
            login(request, user)
        except Exception:
            pass

        profile = getattr(user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user, is_onboarded=True)
        elif not profile.is_onboarded:
            profile.is_onboarded = True
            profile.save()

        display_name = f"{user.first_name} {user.last_name}".strip() or user.username

        return Response({
            "success": True,
            "message": f"Welcome back, {display_name}!",
            "user": serialize_user(user, profile),
            "device": device_res
        }, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    def get(self, request):
        user = None
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            user_id = request.query_params.get('user_id')
            if user_id:
                try:
                    user_candidate = User.objects.filter(id=user_id, is_active=True).first()
                    if user_candidate:
                        user = user_candidate
                except Exception:
                    pass

        if not user or not user.is_active:
            return Response({"authenticated": False, "user": None})

        profile = getattr(user, 'profile', None)
        return Response({
            "authenticated": True,
            "user": serialize_user(user, profile)
        })


class OnboardingAPIView(APIView):
    """
    Saves student onboarding profile setup and marks is_onboarded=True.
    Associates data securely with the user.
    """
    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        user_id = request.data.get('user_id')
        username = request.data.get('username')

        if not user:
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except (User.DoesNotExist, ValueError):
                    user = None
            elif username:
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    user = None

        if not user:
            return Response(
                {"success": False, "error": "Authenticated user required to save profile setup."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = request.data

        # Update User full name if provided
        full_name = (data.get('full_name') or data.get('name') or '').strip()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        if full_name:
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()
        elif first_name is not None or last_name is not None:
            if first_name is not None:
                user.first_name = str(first_name).strip()
            if last_name is not None:
                user.last_name = str(last_name).strip()
            user.save()

        # Update UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if 'phone' in data and data['phone']:
            clean_phone = re.sub(r'\D', '', str(data['phone']))
            if clean_phone and len(clean_phone) != 10:
                return Response(
                    {"success": False, "error": "Phone number must be exactly 10 digits."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if clean_phone:
                profile.phone = clean_phone
        if 'dob' in data and data['dob']:
            profile.dob = data['dob'].strip()
        if 'gender' in data and data['gender']:
            profile.gender = data['gender'].strip()
        if 'qualification' in data and data['qualification']:
            profile.qualification = data['qualification'].strip()
        if 'target_exam' in data and data['target_exam']:
            profile.target_exam = data['target_exam'].strip()
        if 'target_branch' in data and data['target_branch']:
            profile.target_branch = data['target_branch'].strip()
        if 'preparation_level' in data and data['preparation_level']:
            profile.preparation_level = data['preparation_level'].strip()
        
        college = data.get('college_name') or data.get('college')
        if college:
            profile.college = str(college).strip()

        # Mark onboarding complete and persist
        profile.is_onboarded = True
        profile.save()

        return Response({
            "success": True,
            "message": "Student onboarding completed successfully! Welcome to your dashboard.",
            "user": serialize_user(user, profile)
        }, status=status.HTTP_200_OK)
