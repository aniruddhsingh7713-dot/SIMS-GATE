"""
Test Paper Generation & Publishing Service.
Creates structured examination papers with formal section layouts (Section A - 1M, Section B - 2M),
manages atomic database commits, and coordinates with QuestionPaperImportJob.
"""
from typing import Dict, Any, List, Optional
from django.db import transaction, models
from django.conf import settings
from courses.models import TestSeriesItem, TestQuestion, QuestionPaperImportJob
from .validation_service import validate_test_paper_distribution


def generate_structured_paper_view(
    title: str,
    subject: str,
    topic: str,
    language: str,
    duration_minutes: int,
    questions: List[Dict[str, Any]],
    instructions: Optional[str] = None
) -> Dict[str, Any]:
    """
    Builds a professional examination test paper structure with Section A and Section B.
    """
    sec_a_questions = [q for q in questions if float(q.get("marks", 1.0)) == 1.0]
    sec_b_questions = [q for q in questions if float(q.get("marks", 1.0)) == 2.0]
    other_questions = [q for q in questions if float(q.get("marks", 1.0)) not in [1.0, 2.0]]

    total_marks = sum(float(q.get("marks", 0.0)) for q in questions)

    if not instructions:
        if language == "Hindi":
            instructions = (
                "1. यह परीक्षा पूर्णतः समयबद्ध है। सर्वर घड़ी के अनुसार समय समाप्त होने पर परीक्षा स्वतः जमा हो जाएगी।\n"
                "2. खण्ड 'अ' में 1 अंक के प्रश्न हैं। गलत उत्तर के लिए 0.33 अंक काटे जाएंगे (केवल MCQ)।\n"
                "3. खण्ड 'ब' में 2 अंक के प्रश्न हैं। गलत उत्तर के लिए 0.66 अंक काटे जाएंगे (केवल MCQ)।\n"
                "4. बहु-चयन प्रश्न (MSQ) तथा संख्यात्मक प्रश्नों (NAT) में कोई ऋणात्मक अंकन (Negative Marking) नहीं है।\n"
                "5. स्क्रीन पर उपलब्ध वर्चुअल साइंटिफिक कैलकुलेटर का उपयोग किया जा सकता है।"
            )
        else:
            instructions = (
                "1. Total duration of this examination is strictly monitored by the server timer.\n"
                "2. Section A contains 1-mark questions with 0.33 negative marking for MCQs.\n"
                "3. Section B contains 2-mark questions with 0.66 negative marking for MCQs.\n"
                "4. Multiple Select Questions (MSQ) and Numerical Answer Type (NAT) carry NO negative marking.\n"
                "5. An on-screen virtual scientific calculator is permitted for quantitative evaluation."
            )

    return {
        "header": {
            "title": title,
            "subject": subject or "General Technical Discipline",
            "topic": topic or "Comprehensive Syllabus",
            "language": language,
            "total_questions": len(questions),
            "total_marks": round(total_marks, 2),
            "duration_minutes": duration_minutes,
            "instructions": instructions,
        },
        "sections": [
            {
                "section_id": "SEC_A",
                "title": "Section A — 1 Mark Questions" if language != "Hindi" else "खण्ड 'अ' — 1 अंक के प्रश्न",
                "marks_per_question": 1.0,
                "negative_marks": 0.33,
                "question_count": len(sec_a_questions),
                "total_marks": len(sec_a_questions) * 1.0,
                "questions": sec_a_questions,
            },
            {
                "section_id": "SEC_B",
                "title": "Section B — 2 Mark Questions" if language != "Hindi" else "खण्ड 'ब' — 2 अंक के प्रश्न",
                "marks_per_question": 2.0,
                "negative_marks": 0.66,
                "question_count": len(sec_b_questions),
                "total_marks": len(sec_b_questions) * 2.0,
                "questions": sec_b_questions,
            },
            {
                "section_id": "SEC_OTHER",
                "title": "Section C — Advanced / Special Questions" if language != "Hindi" else "खण्ड 'स' — विशेष प्रश्न",
                "marks_per_question": "Variable",
                "negative_marks": 0.0,
                "question_count": len(other_questions),
                "total_marks": sum(float(q.get("marks", 0.0)) for q in other_questions),
                "questions": other_questions,
            }
        ] if other_questions else [
            {
                "section_id": "SEC_A",
                "title": "Section A — 1 Mark Questions" if language != "Hindi" else "खण्ड 'अ' — 1 अंक के प्रश्न",
                "marks_per_question": 1.0,
                "negative_marks": 0.33,
                "question_count": len(sec_a_questions),
                "total_marks": len(sec_a_questions) * 1.0,
                "questions": sec_a_questions,
            },
            {
                "section_id": "SEC_B",
                "title": "Section B — 2 Mark Questions" if language != "Hindi" else "खण्ड 'ब' — 2 अंक के प्रश्न",
                "marks_per_question": 2.0,
                "negative_marks": 0.66,
                "question_count": len(sec_b_questions),
                "total_marks": len(sec_b_questions) * 2.0,
                "questions": sec_b_questions,
            }
        ]
    }


def publish_test_paper(
    test_id: Optional[int],
    title: str,
    branch: str,
    test_type: str,
    subject: str,
    topic: str,
    language: str,
    duration_minutes: int,
    questions: List[Dict[str, Any]],
    instructions: Optional[str] = None,
    job_id: Optional[str] = None,
    enforce_validation: bool = True,
    course_id: Optional[int] = None,
    start_date: Optional[Any] = None,
    end_date: Optional[Any] = None,
    test_status: str = "PUBLISHED",
    visibility_status: str = "RESTRICTED"
) -> Dict[str, Any]:
    """
    Validates and publishes the generated test paper to the database atomically.
    Never saves partially processed or invalid questions as published questions.
    """
    # 1. Enforce Backend Validation and Auto-Sanitization
    for q in questions:
        validate_single_question(q)

    if enforce_validation:
        val_res = validate_test_paper_distribution(questions)
        if not val_res["can_publish"]:
            return {
                "success": False,
                "errors": val_res["errors"],
                "warnings": val_res["warnings"],
                "summary": val_res["summary"]
            }

    total_marks = sum(float(q.get("marks", 0.0)) for q in questions)

    from django.utils.dateparse import parse_datetime
    from django.utils import timezone
    if start_date and isinstance(start_date, str):
        dt = parse_datetime(start_date)
        if dt:
            start_date = timezone.make_aware(dt, timezone.get_current_timezone()) if timezone.is_naive(dt) else dt
    if end_date and isinstance(end_date, str):
        dt = parse_datetime(end_date)
        if dt:
            end_date = timezone.make_aware(dt, timezone.get_current_timezone()) if timezone.is_naive(dt) else dt

    with transaction.atomic():
        # 2. Get or Create TestSeriesItem
        target_test = None
        if test_id:
            try:
                target_test = TestSeriesItem.objects.select_for_update().get(id=test_id)
            except TestSeriesItem.DoesNotExist:
                return {"success": False, "errors": [f"Test Series Item with id {test_id} not found."]}

        if not target_test:
            calc_order = 1
            if course_id:
                existing_items = TestSeriesItem.objects.filter(course_id=course_id, is_active=True)
                max_ord = existing_items.aggregate(models.Max("order"))["order__max"] or 0
                calc_order = max(max_ord, existing_items.count()) + 1

            target_test = TestSeriesItem(
                title=title or "Intelligent Generated CBT Test Paper",
                branch=branch or "CSE",
                test_type=test_type or "Full Length Mock",
                subject=subject or "General Technical Discipline",
                topic=topic or "Comprehensive Syllabus",
                language=language or "English",
                total_questions=len(questions),
                total_marks=int(round(total_marks)),
                duration_minutes=duration_minutes or 180,
                status="AVAILABLE",
                instructions=instructions or "",
                course_id=course_id,
                order=calc_order,
                test_destination="TEST_SERIES_PORTAL",
                start_date=start_date,
                end_date=end_date,
                test_status=test_status or "PUBLISHED",
                visibility_status=visibility_status or "RESTRICTED",
                is_active=True
            )
            target_test.save()
        else:
            # Update existing
            if title: target_test.title = title
            if branch: target_test.branch = branch
            if test_type: target_test.test_type = test_type
            if subject: target_test.subject = subject
            if topic: target_test.topic = topic
            if language: target_test.language = language
            if course_id:
                target_test.course_id = course_id
                target_test.test_destination = "TEST_SERIES_PORTAL"
            if start_date is not None: target_test.start_date = start_date
            if end_date is not None: target_test.end_date = end_date
            if test_status: target_test.test_status = test_status
            if visibility_status: target_test.visibility_status = visibility_status
            target_test.total_questions = len(questions)
            target_test.total_marks = int(round(total_marks))
            if duration_minutes: target_test.duration_minutes = duration_minutes
            if instructions: target_test.instructions = instructions
            target_test.status = "AVAILABLE"
            target_test.is_active = True
            target_test.save()

        # 3. Create TestQuestions safely
        created_questions = []
        for idx, q in enumerate(questions, start=1):
            q_num = q.get("question_number") or idx
            q_type = q.get("question_type", "MCQ")
            sec = q.get("section", "CORE")
            marks = float(q.get("marks", 1.0))
            neg = float(q.get("negative_marks", 0.33 if (q_type == "MCQ" and marks == 1.0) else (0.66 if (q_type == "MCQ" and marks == 2.0) else 0.0)))
            q_text = q.get("question_text", "").strip()

            diagram_url = q.get("diagram_url", "")
            diagram_img = q.get("diagram_image", None)

            # Ensure diagram image or markdown link is properly retained
            if diagram_url and diagram_url not in q_text:
                q_text = f"{q_text}\n\n![Figure / Schematic]({diagram_url})"

            obj = TestQuestion(
                test=target_test,
                question_number=q_num,
                section=sec,
                question_type=q_type,
                language=q.get("language") or language,
                question_text=q_text,
                marks=marks,
                negative_marks=neg,
                option_a=q.get("option_a", ""),
                option_b=q.get("option_b", ""),
                option_c=q.get("option_c", ""),
                option_d=q.get("option_d", ""),
                correct_answer=q.get("correct_answer", ""),
                explanation=q.get("explanation", ""),
                diagram_image=diagram_img,
                diagram_url=diagram_url,
                complexity_score=q.get("complexity_score", 1.0),
                is_flagged_for_review=q.get("is_flagged_for_review", False),
                validation_notes=q.get("validation_notes", ""),
                order=idx,
            )
            created_questions.append(obj)

        if created_questions:
            TestQuestion.objects.bulk_create(created_questions)
            target_test.total_questions = target_test.questions.count()
            target_test.save(update_fields=["total_questions"])

        # 4. Update Import Job if linked
        if job_id:
            try:
                job = QuestionPaperImportJob.objects.get(id=job_id)
                job.status = "PUBLISHED"
                job.progress_percent = 100
                job.progress_stage = "Published to CBT Catalog"
                job.target_test = target_test
                job.save()
            except Exception:
                pass

    return {
        "success": True,
        "test_id": target_test.id,
        "title": target_test.title,
        "order": target_test.order,
        "course_id": target_test.course_id,
        "course_title": target_test.course.title if target_test.course else None,
        "branch": target_test.branch,
        "language": target_test.language,
        "total_questions": target_test.total_questions,
        "total_marks": target_test.total_marks,
        "created_questions_count": len(created_questions),
        "admin_url": f"/admin/courses/testseriesitem/{target_test.id}/change/",
        "questions_url": f"/admin/courses/testquestion/?test__id__exact={target_test.id}",
    }
