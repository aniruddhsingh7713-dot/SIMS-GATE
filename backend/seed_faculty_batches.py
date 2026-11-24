import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from courses.models import Faculty, Batch

def seed():
    print("Clearing existing Faculty and Batch records...")
    Faculty.objects.all().delete()
    Batch.objects.all().delete()

    faculty_data = [
        {
            "name": "Dr. Arvind Rathore",
            "designation": "Head of Academic Pedagogy & Lead Faculty (Computer Science)",
            "qualification": "PhD (Theoretical Computer Science), IIT Bombay · M.Tech CSE · GATE AIR 14",
            "experience_years": 14,
            "specialization": "Design & Analysis of Algorithms, Theory of Computation (TOC), Discrete Mathematics",
            "bio": "Over 14 years shaping India's top 100 GATE ranks. Renowned for formal proofs, asymptotic notation rigour, and teaching Turing reductions from first principles. Mentor to 140+ IIT M.Tech admits.",
            "achievements": "AIR 3, 11, 28 in GATE CS · Author of 'Mastering Asymptotic Analysis' · Ex-IIT Bombay Research Fellow",
            "badge": "IIT BOMBAY · GATE AIR 14",
            "order": 1,
            "is_active": True,
        },
        {
            "name": "Prof. Sanjeev Nair",
            "designation": "Senior Faculty, Systems Architecture & Core Computing",
            "qualification": "M.Tech (Computer Systems), IISc Bangalore · Ex-Senior Engineer C-DAC",
            "experience_years": 12,
            "specialization": "Operating Systems, Computer Organization & Architecture (COA), Compiler Design",
            "bio": "Specialist in hardware-software interfaces, CPU pipelining hazard resolution, and virtual memory page translation derivations. 12+ years of teaching engineering students to score 100% in system questions.",
            "achievements": "Mentored AIR 7 & AIR 19 in GATE CS · 350+ Students placed in Premier PSUs (ONGC, IOCL, BARC)",
            "badge": "IISC BANGALORE · 12+ YRS PEDAGOGY",
            "order": 2,
            "is_active": True,
        },
        {
            "name": "Dr. Priyanka Sen",
            "designation": "Subject Lead, Data Engineering & Artificial Intelligence",
            "qualification": "PhD (Machine Learning), IIT Kharagpur · GATE CS AIR 52",
            "experience_years": 9,
            "specialization": "Database Management Systems (DBMS), Machine Learning & Probability, Data Science (DA)",
            "bio": "Pioneered SIMS GATE's specialized Data Science & AI curriculum. Expert in SQL normalization proofs, serializability conflict graphs, and multivariate Gaussian calculus for GATE DA.",
            "achievements": "Guided 45+ candidates into IIT Madras & IIT Delhi M.Tech AI/Data programs · Published in IEEE Big Data",
            "badge": "IIT KHARAGPUR · GATE DA SPECIALIST",
            "order": 3,
            "is_active": True,
        },
        {
            "name": "Er. Vikramaditya Verma",
            "designation": "Subject Lead, Computer Networks & Engineering Mathematics",
            "qualification": "M.Tech, IIT Roorkee · GATE AIR 86 · Ex-Scientist (ISRO)",
            "experience_years": 11,
            "specialization": "Computer Networks, Linear Algebra, Calculus, Numerical Methods",
            "bio": "Former ISRO satellite telemetry engineer with unmatched clarity on TCP congestion control, sliding window protocols, and eigenvalue decompositions for GATE mathematics.",
            "achievements": "Consistent 98%+ student satisfaction index · Produced 28 top-50 AIRs in last 6 seasons",
            "badge": "EX-ISRO SCIENTIST · IIT ROORKEE",
            "order": 4,
            "is_active": True,
        },
        {
            "name": "Er. Rajeshwar Sinha",
            "designation": "Senior Mentor, Core Engineering & Interdisciplinary Sciences",
            "qualification": "M.Tech (Structural Engineering), IIT Delhi · ESE Qualified",
            "experience_years": 13,
            "specialization": "Engineering Mechanics, Strength of Materials, Structural Analysis",
            "bio": "Renowned across Central India for graphical Mohr's circle derivations and matrix deflection formulations. Leads SIMS inter-disciplinary foundation cohorts.",
            "achievements": "Mentored Chhattisgarh State Topper in GATE CE (AIR 16) · Guided 180+ PSU selections",
            "badge": "IIT DELHI · ESE QUALIFIED",
            "order": 5,
            "is_active": True,
        },
    ]

    for item in faculty_data:
        f = Faculty.objects.create(**item)
        print(f"Created Faculty: {f.name} ({f.badge})")

    batch_data = [
        {
            "name": "Super-30 Intensive Classroom Cohort (Raipur Center)",
            "code": "SIMS-2026-CS-ALPHA",
            "branch": "CSE",
            "target_exam": "GATE 2026 & PSU",
            "batch_type": "Classroom",
            "start_date": "Starts 15th July 2026",
            "timings": "Morning: 07:30 AM – 10:30 AM",
            "days": "Monday to Friday (Daily 3 Hrs)",
            "venue": "3rd Floor, SBI Bldg, Choubey Colony, Raipur Center",
            "total_hours": "650+ In-Person Classroom Hours",
            "syllabus_completion": "30th November 2026 (Before All-India Test Series)",
            "seats_status": "Few Seats Left",
            "seats_remaining": 8,
            "fee": 48000.00,
            "installment_info": "₹24,000 at admission + ₹24,000 after 45 days",
            "order": 1,
            "is_active": True,
        },
        {
            "name": "Evening Professional & College-Goers Batch",
            "code": "SIMS-2026-CS-EVENING",
            "branch": "CSE",
            "target_exam": "GATE 2026",
            "batch_type": "Classroom",
            "start_date": "Starts 22nd July 2026",
            "timings": "Evening: 05:30 PM – 08:30 PM",
            "days": "Monday to Friday (Post-College Hours)",
            "venue": "3rd Floor, SBI Bldg, Choubey Colony, Raipur Center",
            "total_hours": "620+ Classroom Hours",
            "syllabus_completion": "15th December 2026",
            "seats_status": "Filling Fast",
            "seats_remaining": 14,
            "fee": 48000.00,
            "installment_info": "Flexible monthly installment option available",
            "order": 2,
            "is_active": True,
        },
        {
            "name": "Data Science & AI (GATE DA) Specialist Hybrid Batch",
            "code": "SIMS-2026-DA-HYBRID",
            "branch": "DA",
            "target_exam": "GATE 2026 (DA)",
            "batch_type": "Live Online",
            "start_date": "Starts 1st August 2026",
            "timings": "Evening: 07:00 PM – 09:30 PM",
            "days": "Tuesday, Thursday, Saturday & Sunday",
            "venue": "Live Interactive Virtual Classroom + Raipur Doubt Access",
            "total_hours": "500+ Live Interactive Hours",
            "syllabus_completion": "10th December 2026",
            "seats_status": "Admissions Open",
            "seats_remaining": 22,
            "fee": 36000.00,
            "installment_info": "No-cost EMI available on all major bank cards",
            "order": 3,
            "is_active": True,
        },
        {
            "name": "Weekend Executive & Working Aspirants Batch",
            "code": "SIMS-2026-CS-WKND",
            "branch": "CSE",
            "target_exam": "GATE 2026 / 2027",
            "batch_type": "Weekend",
            "start_date": "Starts 26th July 2026",
            "timings": "Sat: 03:00 PM – 08:00 PM | Sun: 09:00 AM – 04:00 PM",
            "days": "Saturdays & Sundays (Intensive Schedule)",
            "venue": "Raipur Center Offline + HD Class Recordings",
            "total_hours": "580+ Guided Hours",
            "syllabus_completion": "20th December 2026",
            "seats_status": "Few Seats Left",
            "seats_remaining": 6,
            "fee": 42000.00,
            "installment_info": "Corporate & working professional installment",
            "order": 4,
            "is_active": True,
        },
        {
            "name": "2-Year Early-Bird Foundation Cohort (2nd & 3rd Year)",
            "code": "SIMS-2027-CS-FND",
            "branch": "CSE",
            "target_exam": "GATE 2027",
            "batch_type": "Foundation",
            "start_date": "Starts 10th August 2026",
            "timings": "Alternate Days: 05:00 PM – 07:30 PM",
            "days": "Mon, Wed, Fri + Sunday Doubt Clinics",
            "venue": "3rd Floor, SBI Bldg, Choubey Colony, Raipur Center",
            "total_hours": "900+ Comprehensive Hours across 2 Academic Years",
            "syllabus_completion": "Complete Coverage with 2 Full Revisions",
            "seats_status": "Admissions Open",
            "seats_remaining": 18,
            "fee": 68000.00,
            "installment_info": "Quarterly 4-part installment plan",
            "order": 5,
            "is_active": True,
        },
        {
            "name": "Core Engineering (Civil & Mechanical) GATE + PSU Weekend",
            "code": "SIMS-2026-CORE-WKND",
            "branch": "CE",
            "target_exam": "GATE 2026 (CE & ME)",
            "batch_type": "Weekend",
            "start_date": "Starts 2nd August 2026",
            "timings": "Sat & Sun: 09:30 AM – 03:30 PM",
            "days": "Weekends Only (Saturday & Sunday)",
            "venue": "3rd Floor, SBI Bldg, Choubey Colony, Raipur Center",
            "total_hours": "540+ Hours with PSU Mock Interviews Included",
            "syllabus_completion": "15th December 2026",
            "seats_status": "Filling Fast",
            "seats_remaining": 10,
            "fee": 44000.00,
            "installment_info": "2-part fee payment with zero processing fee",
            "order": 6,
            "is_active": True,
        },
    ]

    for item in batch_data:
        b = Batch.objects.create(**item)
        print(f"Created Batch: {b.name} [{b.target_exam}]")

    print(f"\nSuccessfully seeded {Faculty.objects.count()} faculty members and {Batch.objects.count()} batches!")

if __name__ == "__main__":
    seed()
