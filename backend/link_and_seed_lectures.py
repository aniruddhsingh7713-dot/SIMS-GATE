import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from courses.models import Course, LiveLecture

# Map existing lectures to their exact courses
c_cse = Course.objects.filter(id=9).first() # GATE CSE
c_ce = Course.objects.filter(id=18).first() # GATE Civil
c_found = Course.objects.filter(id=11).first() # Foundation 8-10
c_btech = Course.objects.filter(id=15).first() # Engineering & Technology: B.Tech / M.Tech
c_da = Course.objects.filter(id=17).first() # GATE DA

print("Courses found:", {
    "CSE": c_cse.title if c_cse else None,
    "CE": c_ce.title if c_ce else None,
    "Found": c_found.title if c_found else None,
    "BTech": c_btech.title if c_btech else None,
    "DA": c_da.title if c_da else None,
})

# 1. Update existing lectures
for l in LiveLecture.objects.all():
    if l.id == 10: # Foundation Mathematics
        l.course = c_found
        l.branch = "GEN"
        l.target_exam = "Class 9th-10th Board & Olympiad"
        l.save()
        print(f"Linked L{l.id} to {c_found.title}")
    elif l.id == 8: # Structural Analysis
        l.course = c_ce
        l.branch = "CE"
        l.target_exam = "GATE CE 2026"
        l.save()
        print(f"Linked L{l.id} to {c_ce.title}")
    elif l.id in [1, 2, 3, 6, 9]: # CSE lectures
        l.course = c_cse
        l.branch = "CSE"
        l.target_exam = "GATE CSE 2026"
        l.save()
        print(f"Linked L{l.id} to {c_cse.title}")

# 2. Add real B.Tech / M.Tech Live Lectures for Course 15
if c_btech:
    # Check if BTech live lectures already exist
    btech_live_1 = LiveLecture.objects.filter(course=c_btech, title__icontains="Eigenvalues").first()
    if not btech_live_1:
        LiveLecture.objects.create(
            course=c_btech,
            title="Engineering Mathematics: Eigenvalues, Cayley-Hamilton & Matrix Transformations",
            description="Rigorous university semester derivation and problem clinic covering characteristic equations, matrix diagonalizability, Cayley-Hamilton theorem applications and linear vector spaces.",
            subject="Engineering Mathematics (Sem 3/4)",
            faculty_name="Prof. Arvind Rathore (Ex-IITian)",
            branch="GEN",
            target_exam="B.Tech University Semesters & Core Foundation",
            status="UPCOMING",
            scheduled_time="Today · 06:00 PM – 07:30 PM",
            duration="1h 30m",
            room_or_mode="Raipur Studio 1 · Live Interactive",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            notes_url="https://simsgate.com/notes/engg-math-matrices.pdf",
            order=1,
            is_active=True
        )
        print("Created BTech upcoming lecture 1")

    btech_live_2 = LiveLecture.objects.filter(course=c_btech, title__icontains="Thermodynamics").first()
    if not btech_live_2:
        LiveLecture.objects.create(
            course=c_btech,
            title="Applied Thermodynamics: First & Second Law Analysis with Entropy Balance",
            description="First-principles axiomatic walkthrough of closed and control volume systems, Carnot cycle benchmarks, and irreversible entropy generation in heat engines.",
            subject="Thermodynamics & Energy Systems",
            faculty_name="Prof. Aniruddh Singh (Ex-IITian)",
            branch="GEN",
            target_exam="B.Tech University Masterclass",
            status="RECORDED",
            scheduled_time="Recorded · Archive Available",
            duration="2h 10m",
            room_or_mode="Raipur Studio 2 · High-Def Stream",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            notes_url="https://simsgate.com/notes/thermodynamics-unit1.pdf",
            order=2,
            is_active=True
        )
        print("Created BTech recorded lecture 2")

    btech_live_3 = LiveLecture.objects.filter(course=c_btech, title__icontains="Signals").first()
    if not btech_live_3:
        LiveLecture.objects.create(
            course=c_btech,
            title="Signals & Systems: Continuous-Time Fourier Transform & Frequency Response",
            description="Deep exploration of continuous and discrete spectrums, convolution in time vs multiplication in frequency, and LTI system stability criteria.",
            subject="Signals & Systems",
            faculty_name="Prof. Arvind Rathore (Ex-IITian)",
            branch="GEN",
            target_exam="B.Tech University Masterclass",
            status="RECORDED",
            scheduled_time="Recorded · Archive Available",
            duration="1h 45m",
            room_or_mode="Raipur Studio 1 · High-Def Stream",
            video_url="https://www.youtube.com/embed/dQw4w9WgXcQ",
            notes_url="https://simsgate.com/notes/signals-fourier.pdf",
            order=3,
            is_active=True
        )
        print("Created BTech recorded lecture 3")

print("\n--- ALL LECTURES WITH DIRECT COURSE LINK ---")
for l in LiveLecture.objects.all():
    print(f"L{l.id}: '{l.title}' -> Course: '{l.course.title if l.course else 'NONE'}' [Status: {l.status}]")
