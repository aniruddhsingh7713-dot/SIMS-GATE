import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from courses.models import StudentEnrollment, TimetableSlot, LiveLecture, TestSeriesItem

def seed():
    print("Seeding Dashboard Demo Data...")

    # Clear existing demo entries if needed
    TimetableSlot.objects.all().delete()
    LiveLecture.objects.all().delete()
    TestSeriesItem.objects.all().delete()
    StudentEnrollment.objects.all().delete()

    # 1. Seeding Timetable (Mon-Sat)
    timetable_data = [
        # Monday
        {
            "day": "MON", "order": 1, "start_time": "07:30 AM", "end_time": "10:30 AM",
            "subject": "Theory of Computation & Automata",
            "faculty_name": "Prof. Aniruddh Singh (AIR 14, Ex-IITian)",
            "room_or_mode": "Hall 3A (Offline) + Live Studio",
            "branch": "CSE", "topic_description": "Regular Expressions, DFA Minimization & Myhill-Nerode Theorem"
        },
        {
            "day": "MON", "order": 2, "start_time": "11:00 AM", "end_time": "01:30 PM",
            "subject": "Discrete Mathematics & Graph Theory",
            "faculty_name": "Dr. H. S. Sharma (Senior Lead)",
            "room_or_mode": "Hall 3A (Offline)",
            "branch": "CSE", "topic_description": "Planar Graphs, Euler Paths & Vertex Coloring"
        },

        # Tuesday
        {
            "day": "TUE", "order": 1, "start_time": "07:30 AM", "end_time": "10:30 AM",
            "subject": "Design & Analysis of Algorithms",
            "faculty_name": "Prof. Aniruddh Singh (Ex-IITian)",
            "room_or_mode": "Hall 3A + Live Studio",
            "branch": "CSE", "topic_description": "Divide and Conquer, Master Theorem & Recurrence Relations"
        },
        {
            "day": "TUE", "order": 2, "start_time": "11:00 AM", "end_time": "01:30 PM",
            "subject": "Engineering Mathematics (Linear Algebra)",
            "faculty_name": "Prof. R. K. Verma",
            "room_or_mode": "Hall 2B (Offline)",
            "branch": "CSE", "topic_description": "Eigenvalues, Eigenvectors, Cayley-Hamilton Theorem"
        },

        # Wednesday
        {
            "day": "WED", "order": 1, "start_time": "07:30 AM", "end_time": "10:30 AM",
            "subject": "Database Management Systems",
            "faculty_name": "Er. Priyanshu Gupta",
            "room_or_mode": "Hall 3A + Live Studio",
            "branch": "CSE", "topic_description": "Relational Algebra, Complex SQL Queries & Functional Dependencies"
        },
        {
            "day": "WED", "order": 2, "start_time": "11:00 AM", "end_time": "01:30 PM",
            "subject": "Theory of Computation (TOC Clinic)",
            "faculty_name": "Prof. Aniruddh Singh",
            "room_or_mode": "Hall 3A",
            "branch": "CSE", "topic_description": "Context Free Grammars & Pushdown Automata Problem Solving"
        },

        # Thursday
        {
            "day": "THU", "order": 1, "start_time": "07:30 AM", "end_time": "10:30 AM",
            "subject": "Computer Networks",
            "faculty_name": "Dr. H. S. Sharma",
            "room_or_mode": "Hall 3A + Live Studio",
            "branch": "CSE", "topic_description": "TCP Flow Control, Congestion Control & Subnet Masking"
        },
        {
            "day": "THU", "order": 2, "start_time": "11:00 AM", "end_time": "01:30 PM",
            "subject": "Algorithms (Dynamic Programming)",
            "faculty_name": "Prof. Aniruddh Singh",
            "room_or_mode": "Hall 3A",
            "branch": "CSE", "topic_description": "Matrix Chain Multiplication, Longest Common Subsequence"
        },

        # Friday
        {
            "day": "FRI", "order": 1, "start_time": "07:30 AM", "end_time": "10:30 AM",
            "subject": "Operating Systems & Concurrency",
            "faculty_name": "Er. Priyanshu Gupta",
            "room_or_mode": "Hall 3A + Live Studio",
            "branch": "CSE", "topic_description": "Semaphores, Mutex Locks & Banker's Algorithm"
        },
        {
            "day": "FRI", "order": 2, "start_time": "11:00 AM", "end_time": "01:30 PM",
            "subject": "General Aptitude & Reasoning",
            "faculty_name": "Er. Amit Deshmukh",
            "room_or_mode": "Hall 2B",
            "branch": "CSE", "topic_description": "Spatial Reasoning, Probability & Data Interpretation"
        },

        # Saturday
        {
            "day": "SAT", "order": 1, "start_time": "08:00 AM", "end_time": "11:30 AM",
            "subject": "Direct Faculty Doubt Cabin & PYQ Solving",
            "faculty_name": "Senior Academic Board",
            "room_or_mode": "Faculty Cabin & Discussion Lounge",
            "branch": "CSE", "topic_description": "1-on-1 Doubt Clarification and Past 15-Year GATE Question Dissection"
        },
        {
            "day": "SAT", "order": 2, "start_time": "02:00 PM", "end_time": "05:00 PM",
            "subject": "Weekly CBT Proctored Test",
            "faculty_name": "Test Administration Wing",
            "room_or_mode": "Simulation Lab (Computer Lab A)",
            "branch": "CSE", "topic_description": "Real GATE Interface CBT Exam Simulation with Instant AIR Rankings"
        },
    ]

    for item in timetable_data:
        TimetableSlot.objects.create(**item)
    print(f"Created {len(timetable_data)} timetable slots (Monday to Saturday).")

    # 2. Seeding Live Video Lectures & Recordings
    lectures_data = [
        {
            "title": "Algorithms: Dynamic Programming on Trees & Advanced Graph Traversal",
            "subject": "Algorithms & Complexity",
            "faculty_name": "Prof. Aniruddh Singh (Ex-IITian)",
            "status": "LIVE",
            "scheduled_time": "🔴 STREAMING LIVE · 05:00 PM – 07:30 PM",
            "duration": "2h 30m",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "branch": "CSE",
            "notes_url": "#",
            "order": 1
        },
        {
            "title": "Database Management: B+ Tree Indexing & Transaction Concurrency Protocols",
            "subject": "Database Management Systems",
            "faculty_name": "Er. Priyanshu Gupta",
            "status": "UPCOMING",
            "scheduled_time": "📅 Tomorrow · 07:30 AM – 10:30 AM",
            "duration": "3h 00m",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "branch": "CSE",
            "notes_url": "#",
            "order": 2
        },
        {
            "title": "Theory of Computation: Decidability, Halting Problem & Turing Machine Reductions",
            "subject": "Theory of Computation",
            "faculty_name": "Prof. Aniruddh Singh",
            "status": "RECORDED",
            "scheduled_time": "Recorded Archive · Session #18",
            "duration": "2h 15m",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "branch": "CSE",
            "notes_url": "#",
            "order": 3
        },
        {
            "title": "Operating Systems: Virtual Memory, Inverted Paging & Effective Memory Access Time",
            "subject": "Operating Systems",
            "faculty_name": "Dr. H. S. Sharma",
            "status": "RECORDED",
            "scheduled_time": "Recorded Archive · Session #14",
            "duration": "1h 55m",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "branch": "CSE",
            "notes_url": "#",
            "order": 4
        },
    ]

    for item in lectures_data:
        LiveLecture.objects.create(**item)
    print(f"Created {len(lectures_data)} live/recorded video lectures.")

    # 3. Seeding Test Series
    test_data = [
        {
            "title": "SIMS All India Open Mock Test #03 (Complete GATE CS Syllabus)",
            "test_type": "Full Length Mock (CBT)",
            "branch": "CSE",
            "total_questions": 65,
            "total_marks": 100,
            "duration_minutes": 180,
            "due_date": "Live Now · Closes Sunday 11:59 PM",
            "status": "AVAILABLE",
            "score_obtained": "",
            "rank_achieved": "",
            "test_link": "#take-test",
            "paper_pdf_url": "#download-pdf",
            "solution_pdf_url": "#solution",
            "order": 1
        },
        {
            "title": "Algorithms & Data Structures Proctored Assessment",
            "test_type": "Subject Level CBT",
            "branch": "CSE",
            "total_questions": 30,
            "total_marks": 50,
            "duration_minutes": 90,
            "due_date": "Completed on 12th Oct 2026",
            "status": "ATTEMPTED",
            "score_obtained": "44.5 / 50",
            "rank_achieved": "AIR 14 / 920",
            "test_link": "#review-test",
            "paper_pdf_url": "#download-pdf",
            "solution_pdf_url": "#solution",
            "order": 2
        },
        {
            "title": "Theory of Computation & Discrete Mathematics Combined Exam",
            "test_type": "Sectional Assessment",
            "branch": "CSE",
            "total_questions": 35,
            "total_marks": 50,
            "duration_minutes": 90,
            "due_date": "Unlocks Saturday 24th Oct · 10:00 AM",
            "status": "UPCOMING",
            "score_obtained": "",
            "rank_achieved": "",
            "test_link": "#upcoming",
            "paper_pdf_url": "#",
            "solution_pdf_url": "#",
            "order": 3
        },
    ]

    for item in test_data:
        TestSeriesItem.objects.create(**item)
    print(f"Created {len(test_data)} test series entries.")

    # 4. Seeding Default Student Enrollment
    users = User.objects.all()
    target_user = users.first() if users.exists() else None

    enrollment = StudentEnrollment.objects.create(
        user=target_user,
        course_title="GATE 2026 Comprehensive Classroom Cohort (CSE)",
        batch_name="Super-30 Intensive Classroom Cohort (Alpha)",
        branch="Computer Science & Information Technology",
        progress_percent=46,
        completed_lectures=64,
        total_lectures=140,
        attendance_percent=96,
        validity="Valid till February 2026 Examination",
        is_active=True
    )
    print(f"Created Student Enrollment: {enrollment}")

if __name__ == '__main__':
    seed()
