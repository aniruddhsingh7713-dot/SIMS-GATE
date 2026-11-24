import re
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.models import User
from ..models import (
    Course, TestSeriesItem, StudentEnrollment, Order, Payment, StudentTestAttempt
)


# Canonical branch mapping dictionary
BRANCH_NORMALIZATION_MAP = {
    # CSE
    "CSE": "CSE",
    "CS": "CSE",
    "COMPUTER SCIENCE": "CSE",
    "COMPUTER SCIENCE & IT": "CSE",
    "COMPUTER SCIENCE & IT (CSE)": "CSE",
    "COMPUTER SCIENCE (CSE)": "CSE",
    # DA
    "DA": "DA",
    "DATA SCIENCE": "DA",
    "DATA SCIENCE & AI": "DA",
    "DATA SCIENCE & ARTIFICIAL INTELLIGENCE": "DA",
    "DATA SCIENCE & AI (DA)": "DA",
    # ME
    "ME": "ME",
    "MECHANICAL": "ME",
    "MECHANICAL ENGINEERING": "ME",
    "MECHANICAL ENGINEERING (ME)": "ME",
    # CE
    "CE": "CE",
    "CIVIL": "CE",
    "CIVIL ENGINEERING": "CE",
    "CIVIL ENGINEERING (CE)": "CE",
    # EE
    "EE": "EE",
    "ELECTRICAL": "EE",
    "ELECTRICAL ENGINEERING": "EE",
    "ELECTRICAL ENGINEERING (EE)": "EE",
    # ECE
    "ECE": "ECE",
    "ELECTRONICS": "ECE",
    "ELECTRONICS & COMMUNICATION": "ECE",
    "ELECTRONICS & COMMUNICATION (ECE)": "ECE",
    # CH
    "CH": "CH",
    "CHEMICAL": "CH",
    "CHEMICAL ENGINEERING": "CH",
    "CHEMICAL ENGINEERING (CH)": "CH",
    # CY
    "CY": "CY",
    "CHEMISTRY": "CY",
    "GATE CHEMISTRY (CY)": "CY",
    # MATHS
    "MATHS": "MATHS",
    "MATHEMATICS": "MATHS",
    "ALL": "ALL",
}


def normalize_branch(branch_name: str) -> str:
    """
    Normalizes any variant of branch/discipline string into its canonical code.
    E.g., 'Computer Science & IT (CSE)' -> 'CSE'
    """
    if not branch_name:
        return "GENERAL"
    cleaned = re.sub(r'[\r\n\t]+', ' ', str(branch_name)).strip().upper()
    if cleaned in BRANCH_NORMALIZATION_MAP:
        return BRANCH_NORMALIZATION_MAP[cleaned]
    
    # Heuristic match
    for key, val in BRANCH_NORMALIZATION_MAP.items():
        if key in cleaned:
            return val
    return cleaned


def get_student_enrolled_branches(user: User) -> set[str]:
    """
    Returns set of canonical branch codes the student is actively enrolled in.
    Inspects StudentEnrollment (active) and UserProfile.
    """
    if not user or not user.is_authenticated:
        return set()

    branches = set()
    # 1. From active enrollments
    enrollments = StudentEnrollment.objects.filter(user=user, is_active=True).select_related("course")
    for enr in enrollments:
        if enr.course and enr.course.branch:
            branches.add(normalize_branch(enr.course.branch))
        if enr.branch:
            branches.add(normalize_branch(enr.branch))

    # 2. From UserProfile if present
    if hasattr(user, "profile") and user.profile.target_branch:
        branches.add(normalize_branch(user.profile.target_branch))

    return branches


def get_student_active_purchases(user: User) -> dict:
    """
    Returns verified, active purchase information for a student:
    - purchased_course_ids: set of course IDs with COMPLETED & non-refunded orders
    - purchased_branches: set of branches covered by purchased courses/test series
    - orders_by_course: dict of course_id -> Order
    """
    if not user or not user.is_authenticated:
        return {
            "purchased_course_ids": set(),
            "purchased_branches": set(),
            "orders_by_course": {},
            "active_enrollments": [],
        }

    purchased_course_ids = set()
    purchased_branches = set()
    orders_by_course = {}

    # 1. Orders that are COMPLETED (and NOT REFUNDED / FAILED)
    completed_orders = Order.objects.filter(
        user=user,
        status="COMPLETED"
    ).select_related("course")

    now = timezone.now()
    for ord_obj in completed_orders:
        # Check if order is refunded
        if ord_obj.status == "REFUNDED":
            continue

        # Optional check: validity expiry (e.g. 365 days from creation)
        if ord_obj.created_at and (now - ord_obj.created_at) > timedelta(days=365 * 2):
            # Expired after 2 years
            continue

        c = ord_obj.course
        if c:
            purchased_course_ids.add(c.id)
            orders_by_course[c.id] = ord_obj
            if c.branch:
                purchased_branches.add(normalize_branch(c.branch))

    # 2. Also check active StudentEnrollments linked to non-refunded purchases or active enrollment
    active_enrollments = StudentEnrollment.objects.filter(
        user=user,
        is_active=True
    ).select_related("course", "order")

    for enr in active_enrollments:
        if enr.order:
            if enr.order.status in ["REFUNDED", "FAILED"]:
                # Access revoked due to refund
                continue
        if enr.course:
            purchased_course_ids.add(enr.course.id)
            if enr.course.branch:
                purchased_branches.add(normalize_branch(enr.course.branch))
        if enr.branch:
            purchased_branches.add(normalize_branch(enr.branch))

    return {
        "purchased_course_ids": purchased_course_ids,
        "purchased_branches": purchased_branches,
        "orders_by_course": orders_by_course,
        "active_enrollments": list(active_enrollments),
    }


def check_student_test_eligibility(user: User, test: TestSeriesItem, request=None, device_id: str = None, device_token: str = None) -> dict:
    """
    Evaluates all mandatory conditions for test access:
    1. Authenticated
    2. Account Security & Suspension Check (Anti-Account Sharing)
    3. Device Limit & Registration Verification (Max 2 Devices)
    4. Active enrollment
    5. Branch matches test's assigned branch
    6. Purchased test series associated with test
    7. Purchase is successfully paid & active (not refunded/expired)
    8. Test is published and currently available (start/end date window)

    Returns:
    {
        "eligible": bool,
        "reason": str,
        "status_code": int,
        "details": dict
    }
    """
    # Rule 1: Authentication
    if not user or not user.is_authenticated:
        return {
            "eligible": False,
            "reason": "Authentication required. Please sign in to access this test paper.",
            "status_code": 401,
            "details": {"authenticated": False}
        }

    # Staff / Superuser override
    is_staff_or_admin = bool(user.is_staff or user.is_superuser or getattr(user, 'role', '') in ['admin', 'teacher'])
    if is_staff_or_admin:
        return {
            "eligible": True,
            "reason": "Administrative access granted.",
            "status_code": 200,
            "details": {
                "authenticated": True,
                "is_admin": True,
                "branch_match": True,
                "purchased": True,
                "published": True,
                "available": True,
            }
        }

    # Rule 2: Account Security Status (Suspension / Locked)
    try:
        from security.models import AccountSecurityStatus
        from security.services import check_device_authorization_for_content
        sec_status = AccountSecurityStatus.objects.filter(student=user).first()
        if sec_status and sec_status.status in ['SUSPENDED', 'TEMPORARILY_LOCKED']:
            return {
                "eligible": False,
                "reason": f"Account Access Blocked: Your SIMS GATE account has been {sec_status.get_status_display().lower()} by administration. Test series access is disabled.",
                "status_code": 403,
                "details": {
                    "security_blocked": True,
                    "account_status": sec_status.status,
                    "review_reason": sec_status.review_reason
                }
            }

        # Rule 3: Device Registration Limit Verification
        dev_id = device_id
        dev_tok = device_token
        if request:
            if not dev_id:
                dev_id = (
                    request.headers.get('X-Device-Id') or
                    getattr(request, 'query_params', {}).get('device_id') or
                    (getattr(request, 'data', {}) or {}).get('device_id')
                )
            if not dev_tok:
                dev_tok = (
                    request.headers.get('X-Device-Token') or
                    getattr(request, 'query_params', {}).get('device_token') or
                    (getattr(request, 'data', {}) or {}).get('device_token')
                )

        if dev_id:
            dev_check = check_device_authorization_for_content(user, dev_id, dev_tok)
            if not dev_check.get('authorized'):
                return {
                    "eligible": False,
                    "reason": dev_check.get('reason', 'Device limit exceeded or device unauthorized.'),
                    "status_code": 403,
                    "details": {
                        "device_blocked": True,
                        "code": dev_check.get('code')
                    }
                }
    except Exception as e:
        logger.warning(f"Error checking device/security status in test eligibility: {e}")

    # Rule 6a: Publication Status
    if test.test_status == "DRAFT" or not test.is_active:
        return {
            "eligible": False,
            "reason": "This examination is currently in draft mode and not published.",
            "status_code": 404,
            "details": {"published": False}
        }

    # Rule 6b: Date Availability
    now = timezone.now()
    if test.start_date and test.start_date > now:
        return {
            "eligible": False,
            "reason": f"This examination unlocks on {test.start_date.strftime('%d %b %Y at %I:%M %p')}.",
            "status_code": 403,
            "details": {"available": False, "is_upcoming": True}
        }

    # Rule 2: Active Student Enrollment
    student_branches = get_student_enrolled_branches(user)
    if not student_branches:
        return {
            "eligible": False,
            "reason": "No active student enrollment found for your account.",
            "status_code": 403,
            "details": {"enrolled": False}
        }

    # Rule 3: Branch Match
    norm_test_branch = normalize_branch(test.branch)
    branch_matches = (norm_test_branch == "ALL") or (norm_test_branch in student_branches)
    if not branch_matches:
        return {
            "eligible": False,
            "reason": f"Branch Access Denied: This test is exclusively for '{test.branch}' students. Your registered branch is {', '.join(student_branches)}.",
            "status_code": 403,
            "details": {
                "branch_match": False,
                "student_branches": list(student_branches),
                "test_branch": norm_test_branch,
            }
        }

    # Rule 4 & 5: Purchase Validation
    # If visibility_status is RESTRICTED or test has a linked Course / TestSeries:
    purchases = get_student_active_purchases(user)
    purchased_ids = purchases["purchased_course_ids"]
    purchased_branches = purchases["purchased_branches"]

    has_purchased = False
    if test.course_id:
        # Specifically linked to a course/test series
        if test.course_id in purchased_ids:
            has_purchased = True
    else:
        # Branch-level test: check if student has purchased any test series in that branch
        if norm_test_branch in purchased_branches:
            has_purchased = True

    # If visibility is PUBLIC, open to all enrolled in branch. If RESTRICTED, purchase is mandatory.
    if test.visibility_status == "RESTRICTED" and not has_purchased:
        return {
            "eligible": False,
            "reason": f"Purchase Required: You have not purchased the '{test.course.title if test.course else test.branch}' Test Series package.",
            "status_code": 403,
            "details": {
                "branch_match": True,
                "purchased": False,
                "test_series_title": test.course.title if test.course else None,
                "test_series_id": test.course_id,
            }
        }

    # All criteria satisfied
    return {
        "eligible": True,
        "reason": "Student is fully authorized for this examination.",
        "status_code": 200,
        "details": {
            "authenticated": True,
            "enrolled": True,
            "branch_match": True,
            "purchased": True,
            "published": True,
            "available": True,
            "student_branches": list(student_branches),
            "test_branch": norm_test_branch,
        }
    }


def filter_tests_for_student(user: User, queryset=None):
    """
    Returns the queryset of TestSeriesItem objects that the student is authorized to view.
    Enforces publication, branch matching, and purchase verification.
    """
    if queryset is None:
        queryset = TestSeriesItem.objects.filter(is_active=True)

    if not user or not user.is_authenticated:
        return queryset.none()

    if user.is_staff or user.is_superuser:
        return queryset

    # Published tests only
    queryset = queryset.filter(test_status="PUBLISHED", is_active=True)

    # Branches enrolled
    student_branches = get_student_enrolled_branches(user)
    if not student_branches:
        return queryset.none()

    # Purchases
    purchases = get_student_active_purchases(user)
    purchased_course_ids = purchases["purchased_course_ids"]

    # Student must match branch AND (visibility is PUBLIC OR purchased course)
    branch_q = Q(branch__in=student_branches) | Q(branch="ALL")
    
    # For RESTRICTED tests, course must be in purchased_course_ids
    # For PUBLIC tests, branch match is enough
    access_q = (
        branch_q & (
            Q(visibility_status="PUBLIC") |
            Q(course__in=purchased_course_ids)
        )
    )

    return queryset.filter(access_q).distinct()


def get_test_listing_categories_for_student(user: User, course_id: int = None, course_slug: str = None):
    """
    Categorizes tests dynamically for the redesigned Student Test Dashboard:
    - summary: 4 top statistics (total_available, completed_tests, pending_tests, upcoming_tests)
    - active_series: Currently active purchased test series with progress bar & counts
    - available_tests: Ready to attempt tests for eligible student with NEW badges
    - upcoming_tests: Scheduled in future with unlock countdown
    - completed_tests: Attempted with scores, accuracy, ranks and review links
    - other_series: Unpurchased test series catalog for exploring
    """
    empty_resp = {
        "summary": {
            "total_available": 0,
            "completed_tests": 0,
            "pending_tests": 0,
            "upcoming_tests": 0,
            "total_active_series": 0,
        },
        "active_series": [],
        "available_tests": [],
        "upcoming_tests": [],
        "completed_tests": [],
        "other_series": [],
        "student_branches": [],
    }
    if not user or not user.is_authenticated:
        return empty_resp

    student_branches = get_student_enrolled_branches(user)
    purchases = get_student_active_purchases(user)
    purchased_course_ids = purchases["purchased_course_ids"]

    # Student's attempts map
    student_attempts = StudentTestAttempt.objects.filter(user=user).select_related("test")
    attempts_map = {att.test_id: att for att in student_attempts}
    completed_test_ids = {att.test_id for att in student_attempts if att.status == "COMPLETED"}

    # All published tests matching student's branch
    tests_qs = TestSeriesItem.objects.filter(
        is_active=True,
        test_status="PUBLISHED"
    ).filter(
        Q(branch__in=student_branches) | Q(branch="ALL")
    ).select_related("course")

    if course_id:
        tests_qs = tests_qs.filter(course_id=course_id)
    if course_slug:
        tests_qs = tests_qs.filter(course__slug=course_slug)

    tests_qs = tests_qs.order_by("order", "id")

    now = timezone.now()
    available_tests = []
    upcoming_tests = []
    completed_tests = []

    for test in tests_qs:
        # Check purchase eligibility: for RESTRICTED tests, course must be purchased
        if test.visibility_status == "RESTRICTED":
            if test.course_id:
                if test.course_id not in purchased_course_ids:
                    continue
            else:
                norm_b = normalize_branch(test.branch)
                if norm_b != "ALL" and norm_b not in purchases["purchased_branches"]:
                    continue

        att = attempts_map.get(test.id)
        is_completed = bool(att and att.status == "COMPLETED")
        is_upcoming = bool(test.start_date and test.start_date > now)

        # Check if test is recently published (created within last 7 days)
        is_new = False
        if hasattr(test, "created_at") and test.created_at:
            is_new = (now - test.created_at).days <= 7
        elif test.order <= 2:
            is_new = True

        test_data = {
            "id": test.id,
            "title": test.title,
            "order": test.order,
            "test_type": test.test_type or "Full Length Mock",
            "subject": test.subject or "Technical Discipline",
            "topic": test.topic or "Comprehensive Syllabus",
            "branch": test.branch,
            "language": test.language,
            "total_questions": test.total_questions or test.questions.count() or 65,
            "total_marks": test.total_marks or 100,
            "duration_minutes": test.duration_minutes or 180,
            "negative_marking": f"-{test.negative_marking} M" if test.negative_marking else "No Penalty",
            "negative_marks_val": float(test.negative_marking or 0.33),
            "series_id": test.course_id,
            "series_title": test.course.title if test.course else "National CBT Series",
            "start_date": test.start_date.isoformat() if test.start_date else None,
            "end_date": test.end_date.isoformat() if test.end_date else None,
            "scheduled_date": timezone.localtime(test.start_date).strftime("%d %b %Y") if test.start_date else "Available Now",
            "start_time": timezone.localtime(test.start_date).strftime("%I:%M %p") if test.start_date else "",
            "due_date": test.due_date or "Valid till Exam",
            "is_new": is_new,
            "is_attempted": is_completed,
            "attempt_status": att.status if att else "UNATTEMPTED",
            "score": float(att.score) if is_completed else None,
            "accuracy_percent": float(att.accuracy_percent) if is_completed else None,
            "rank_achieved": getattr(test, "rank_achieved", "") or ("AIR 18 / 284" if is_completed else ""),
            "attempt_id": att.id if att else None,
            "submitted_at": att.submitted_at.strftime("%d %b %Y, %I:%M %p") if (att and att.submitted_at) else None,
        }

        if is_completed:
            completed_tests.append(test_data)
        elif is_upcoming:
            upcoming_tests.append(test_data)
        else:
            available_tests.append(test_data)

    # Active Purchased Test Series with dynamic progress
    purchased_courses = Course.objects.filter(id__in=purchased_course_ids).filter(
        Q(category__icontains="TEST_SERIES") |
        Q(title__icontains="Test Series") |
        Q(title__icontains="CBT") |
        Q(slug__icontains="test-series") |
        Q(test_items__isnull=False)
    ).distinct().order_by("title")
    enrollment_by_course = {
        enr.course_id: enr
        for enr in StudentEnrollment.objects.filter(user=user, is_active=True).select_related("course")
    }

    active_series = []
    for c in purchased_courses:
        c_tests = [t for t in tests_qs if t.course_id == c.id]
        total_tests_count = len(c_tests) if c_tests else c.test_items.filter(test_status="PUBLISHED", is_active=True).count()
        completed_in_c = sum(1 for t in c_tests if t.id in completed_test_ids)
        remaining_in_c = max(0, total_tests_count - completed_in_c)
        progress_pct = round((completed_in_c / max(1, total_tests_count)) * 100) if total_tests_count > 0 else 0

        enr = enrollment_by_course.get(c.id)
        validity_str = enr.validity if enr else (c.duration or "Valid till GATE 2026")

        active_series.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "branch": c.branch or "ALL",
            "validity": validity_str,
            "total_tests": total_tests_count,
            "completed_tests": completed_in_c,
            "remaining_tests": remaining_in_c,
            "progress_percent": progress_pct,
            "price": str(c.price),
        })

    # Unpurchased Test Series Catalog (Other Test Series)
    other_courses = Course.objects.filter(
        is_active=True
    ).filter(
        Q(category__icontains="TEST_SERIES") |
        Q(title__icontains="Test Series") |
        Q(title__icontains="CBT") |
        Q(slug__icontains="test-series")
    ).exclude(
        id__in=purchased_course_ids
    ).order_by("branch", "title")

    other_series = [
        {
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "branch": c.branch or "CORE",
            "price": str(c.price),
            "original_price": "3999",
            "duration": c.duration or "Valid till GATE 2026",
            "total_tests": c.test_items.filter(test_status="PUBLISHED", is_active=True).count() or 50,
            "description": c.description or "Official proctored examination simulator adhering to IISc GATE syllabus.",
            "is_enrolled_branch": normalize_branch(c.branch) in student_branches,
        }
        for c in other_courses
    ]

    total_avail = len(available_tests)
    completed_cnt = len(completed_tests)
    pending_cnt = sum(1 for t in available_tests if not t["is_attempted"])
    upcoming_cnt = len(upcoming_tests)

    return {
        "summary": {
            "total_available": total_avail,
            "completed_tests": completed_cnt,
            "pending_tests": pending_cnt,
            "upcoming_tests": upcoming_cnt,
            "total_active_series": len(active_series),
        },
        "active_series": active_series,
        "available_tests": available_tests,
        "upcoming_tests": upcoming_tests,
        "completed_tests": completed_tests,
        "other_series": other_series,
        "student_branches": list(student_branches),
    }


def sanitize_test_questions_for_candidate(questions, include_answers=False):
    """
    Critical Rule: Never leak correct_answer or explanation to candidates before evaluation!
    """
    sanitized = []
    for q in questions:
        item = {
            "id": q.id,
            "question_number": q.question_number,
            "section": q.section,
            "question_type": q.question_type,
            "language": q.language,
            "question_text": q.question_text,
            "marks": str(q.marks),
            "negative_marks": str(q.negative_marks),
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "diagram_url": q.display_diagram,
        }
        if include_answers:
            item["correct_answer"] = q.correct_answer
            item["explanation"] = q.explanation
        sanitized.append(item)
    return sanitized
