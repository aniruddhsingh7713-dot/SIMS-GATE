"""
Master Demo Data Seeder for SIMS GATE.
Populates complete, rich academic demo data across:
1. Courses (all 10 categories with full modules and video lectures)
2. Student Enrollments for user 'ANI' and test users (unlocks Dashboard, Courses, Recorded Lectures, Timetable, Live Classes)
3. Timetable Matrix (Mon-Sat, all branches, morning, mid-day, afternoon, evening slots)
4. Live Classes (LIVE active streams, UPCOMING sessions, RECORDED studio archives)
5. Study Materials (Formula sheets, printed workbooks, solved PYQ compendiums)
6. Faculty & Evening Cabin Doubt Availability
7. Daily Challenge PYQ Questions (all branches)
8. Batches & Classroom Cohorts
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from courses.models import (
    Course, CourseModule, CourseLecture, Batch, TimetableSlot,
    LiveLecture, TestSeriesItem, TestQuestion, StudyMaterial,
    Faculty, FacultyAvailability, DailyChallengeQuestion, StudentEnrollment
)


def seed_all():
    print("================================================================")
    print("   STARTING COMPREHENSIVE BACKEND DEMO DATA SEEDING")
    print("================================================================")

    # 1. Ensure user 'ANI' exists
    ani_user, _ = User.objects.get_or_create(username="ANI")
    ani_user.set_password("ANI1122")
    ani_user.is_superuser = True
    ani_user.is_staff = True
    ani_user.first_name = "Aniruddh"
    ani_user.last_name = "Singh"
    ani_user.email = "ani@simsgate.com"
    ani_user.save()

    # --------------------------------------------------------------------------
    # 2. COURSES, MODULES & LECTURES (Comprehensive All 10 Categories)
    # --------------------------------------------------------------------------
    courses_master = [
        # 1. GATE CSE
        {
            "slug": "gate-cse-comprehensive-program-2026",
            "title": "GATE Computer Science & IT (CSE) Comprehensive Program",
            "branch": "CSE",
            "category": "GATE_CSE",
            "exam_name": "GATE CSE 2026",
            "price": 24999.00,
            "duration": "14 Months",
            "total_lectures": 220,
            "rating": 5.0,
            "students_enrolled": 2450,
            "description": "Premier classroom & interactive live program for GATE Computer Science. Master Theory of Computation, Algorithms, Operating Systems, DBMS, and Computer Networks from Ex-IITian AIR holders.",
            "features": "220+ Classroom & HD Live Lectures, 5000+ Solved Questions Bank, Weekly CBT National Mock Tests, Dedicated Doubt Clinics in Raipur",
            "modules": [
                {
                    "title": "Module 1: Algorithms & Data Structures",
                    "lectures": [
                        {"title": "Asymptotic Analysis, Master Theorem & Recurrence Relations", "duration": "55m", "is_preview_free": True},
                        {"title": "Divide & Conquer: Strassen's Matrix & Median Finding", "duration": "50m", "is_preview_free": False},
                        {"title": "Greedy Strategies: Huffman Coding & MST (Kruskal/Prim)", "duration": "60m", "is_preview_free": False},
                        {"title": "Dynamic Programming: 0/1 Knapsack & Bellman-Ford", "duration": "65m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Theory of Computation & Automata",
                    "lectures": [
                        {"title": "DFA / NFA Equivalence & Subset Construction", "duration": "58m", "is_preview_free": True},
                        {"title": "DFA Minimization & Myhill-Nerode Equivalence Relations", "duration": "52m", "is_preview_free": False},
                        {"title": "Pushdown Automata & Context-Free Languages", "duration": "54m", "is_preview_free": False},
                        {"title": "Turing Machines, Decidability & Rice's Theorem", "duration": "62m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 3: Operating Systems & Virtual Memory",
                    "lectures": [
                        {"title": "CPU Scheduling Algorithms & Multi-Level Feedback Queues", "duration": "56m", "is_preview_free": False},
                        {"title": "Synchronization: Semaphores, Monitors & Classical Problems", "duration": "58m", "is_preview_free": False},
                        {"title": "Virtual Memory, Paging, Inverted Tables & TLB Mechanics", "duration": "64m", "is_preview_free": True},
                        {"title": "Deadlock Detection, Prevention & Banker's Algorithm", "duration": "48m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 4: Database Management Systems (DBMS)",
                    "lectures": [
                        {"title": "Relational Algebra & Tuple Relational Calculus", "duration": "50m", "is_preview_free": False},
                        {"title": "Functional Dependencies & Normalization (BCNF, 3NF, 4NF)", "duration": "60m", "is_preview_free": False},
                        {"title": "Transactions, ACID Properties & Serializability", "duration": "55m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 2. GATE DA
        {
            "slug": "gate-data-science-ai-da-master-course",
            "title": "GATE Data Science & Artificial Intelligence (DA) Master Course",
            "branch": "DA",
            "category": "GATE_CSE",
            "exam_name": "GATE DA 2026",
            "price": 22999.00,
            "duration": "12 Months",
            "total_lectures": 165,
            "rating": 5.0,
            "students_enrolled": 1680,
            "description": "Comprehensive coverage of the new GATE DA paper: Probability & Statistics, Linear Algebra, Calculus, Python, Machine Learning, Deep Learning, and Database Systems.",
            "features": "165+ Theory & Code-Along Sessions, Hands-on Python Notebooks, 10 Full Length CBT Mock Tests, AIR Mentorship",
            "modules": [
                {
                    "title": "Module 1: Probability, Random Variables & Statistics",
                    "lectures": [
                        {"title": "Conditional Probability, Bayes Theorem & Independence", "duration": "52m", "is_preview_free": True},
                        {"title": "Continuous & Discrete Distributions: Gaussian, Binomial, Poisson", "duration": "58m", "is_preview_free": False},
                        {"title": "Hypothesis Testing, p-values & Maximum Likelihood Estimation", "duration": "60m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Linear Algebra & Matrix Calculus",
                    "lectures": [
                        {"title": "Vector Spaces, Subspaces & Basis Transformations", "duration": "50m", "is_preview_free": True},
                        {"title": "Eigenvalues, Eigenvectors & Diagonalization", "duration": "55m", "is_preview_free": False},
                        {"title": "Singular Value Decomposition (SVD) & PCA", "duration": "62m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 3: Machine Learning & Deep Neural Networks",
                    "lectures": [
                        {"title": "Linear & Ridge Regression with Stochastic Gradient Descent", "duration": "56m", "is_preview_free": False},
                        {"title": "Support Vector Machines (SVM) & Kernel Methods", "duration": "58m", "is_preview_free": False},
                        {"title": "Feedforward Neural Networks, Backpropagation & Activation Functions", "duration": "64m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 3. GATE Chemistry
        {
            "slug": "gate-chemistry-cy-master-course",
            "title": "GATE Chemistry (CY) Comprehensive Master Course",
            "branch": "CY",
            "category": "GATE_CHEMISTRY",
            "exam_name": "GATE Chemistry (CY)",
            "price": 18999.00,
            "duration": "12 Months",
            "total_lectures": 160,
            "rating": 4.9,
            "students_enrolled": 840,
            "description": "Exhaustive coverage of Physical, Organic, and Inorganic Chemistry designed specifically for GATE CY and CSIR-NET aspirants by Ex-IITian faculties.",
            "features": "160+ In-Depth Lectures, Handwritten Faculty Notes, 15+ Years Solved GATE Papers, Weekly CBT Mock Tests, Live 1-on-1 Doubt Sessions",
            "modules": [
                {
                    "title": "Module 1: Physical Chemistry & Quantum Mechanics",
                    "lectures": [
                        {"title": "Schrödinger Wave Equation & Postulates of Quantum Mechanics", "duration": "55m", "is_preview_free": True},
                        {"title": "Particle in a 1D & 3D Box: Boundary Conditions & Degeneracy", "duration": "48m", "is_preview_free": False},
                        {"title": "Harmonic Oscillator & Rigid Rotor Approximations", "duration": "52m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Inorganic Chemistry & Coordination Compounds",
                    "lectures": [
                        {"title": "Crystal Field Theory (CFT) and Ligand Field Splitting", "duration": "60m", "is_preview_free": True},
                        {"title": "Jahn-Teller Distortion & Electronic Spectra of Complexes", "duration": "50m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 3: Organic Chemistry & Reaction Mechanisms",
                    "lectures": [
                        {"title": "Pericyclic Reactions: Woodward-Hoffmann Rules & FMO Method", "duration": "65m", "is_preview_free": False},
                        {"title": "Asymmetric Synthesis & Stereoselective Transformations", "duration": "58m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 4. GATE Chemical Engineering (CH)
        {
            "slug": "gate-chemical-engineering-ch-cohort",
            "title": "GATE Chemical Engineering (CH) Complete Cohort",
            "branch": "CH",
            "category": "GATE_CH",
            "exam_name": "GATE Chemical (CH)",
            "price": 19999.00,
            "duration": "12 Months",
            "total_lectures": 175,
            "rating": 4.8,
            "students_enrolled": 620,
            "description": "Complete conceptual coverage of Thermodynamics, Heat & Mass Transfer, Fluid Mechanics, Chemical Reaction Engineering, and Plant Design.",
            "features": "175+ Topic-Wise Lectures, Full Formula Compendium, 20 Years PYQ Step-by-Step Solutions, 30 Full Syllabus Mock Tests",
            "modules": [
                {
                    "title": "Module 1: Chemical Reaction Engineering (CRE)",
                    "lectures": [
                        {"title": "Kinetics of Homogeneous Reactions & Rate Laws", "duration": "50m", "is_preview_free": True},
                        {"title": "Design of Batch, CSTR and PFR Reactors", "duration": "58m", "is_preview_free": False},
                        {"title": "Non-Isothermal Reactor Design & Temperature Effects", "duration": "54m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Mass Transfer Operations",
                    "lectures": [
                        {"title": "Fick's Laws of Diffusion & Steady-State Mass Transfer", "duration": "52m", "is_preview_free": False},
                        {"title": "Distillation: McCabe-Thiele & Ponchon-Savarit Methods", "duration": "62m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 5. GATE Mechanical Engineering (ME)
        {
            "slug": "gate-mechanical-engineering-me-master",
            "title": "GATE Mechanical Engineering (ME) Complete Cohort",
            "branch": "ME",
            "category": "ENGINEERING",
            "exam_name": "GATE Mechanical (ME)",
            "price": 21999.00,
            "duration": "12 Months",
            "total_lectures": 190,
            "rating": 4.9,
            "students_enrolled": 1420,
            "description": "Complete engineering mechanics, thermodynamics, fluid machinery, strength of materials, and manufacturing technology by Ex-IITian faculty.",
            "features": "190+ Topic Lectures, Machine Design Calculations, 20-Year Solved GATE ME Bank, 25 Proctored CBT Mocks",
            "modules": [
                {
                    "title": "Module 1: Thermodynamics & Applied Thermal Sciences",
                    "lectures": [
                        {"title": "Zeroth, First & Second Laws with Availability Analysis", "duration": "58m", "is_preview_free": True},
                        {"title": "Rankine, Brayton, Otto & Diesel Power Cycles", "duration": "62m", "is_preview_free": False},
                        {"title": "Refrigeration Cycles, Psychrometry & Heat Exchangers", "duration": "54m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Strength of Materials (SOM) & Machine Design",
                    "lectures": [
                        {"title": "Stress-Strain Tensors, Mohr's Circle & Principal Stresses", "duration": "55m", "is_preview_free": True},
                        {"title": "Shear Force & Bending Moment Diagrams in Beams", "duration": "50m", "is_preview_free": False},
                        {"title": "Deflection of Beams & Euler's Column Buckling Theory", "duration": "56m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 6. GATE Civil Engineering (CE)
        {
            "slug": "gate-civil-engineering-ce-cohort",
            "title": "GATE Civil Engineering (CE) Complete Cohort",
            "branch": "CE",
            "category": "ENGINEERING",
            "exam_name": "GATE Civil (CE)",
            "price": 21999.00,
            "duration": "12 Months",
            "total_lectures": 185,
            "rating": 4.8,
            "students_enrolled": 1180,
            "description": "Structural analysis, geotechnical engineering, environmental engineering, hydrology, transportation, and surveying.",
            "features": "185+ High-Yield Lectures, RCC & Steel Code Provisions, 1500+ Solved Numerical Questions",
            "modules": [
                {
                    "title": "Module 1: Geotechnical Engineering & Soil Mechanics",
                    "lectures": [
                        {"title": "Phase Relations, Soil Classification & Compaction", "duration": "52m", "is_preview_free": True},
                        {"title": "Permeability, Effective Stress & Terzaghi's Consolidation", "duration": "60m", "is_preview_free": False},
                        {"title": "Shear Strength of Soil & Mohr-Coulomb Failure Criteria", "duration": "54m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Structural Analysis & Design of Concrete Structures",
                    "lectures": [
                        {"title": "Indeterminacy, Moment Distribution & Slope Deflection", "duration": "58m", "is_preview_free": False},
                        {"title": "Limit State Method of RCC: Singly & Doubly Reinforced Beams", "duration": "64m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 7. GATE Electrical Engineering (EE)
        {
            "slug": "gate-electrical-engineering-ee-cohort",
            "title": "GATE Electrical Engineering (EE) Master Course",
            "branch": "EE",
            "category": "ENGINEERING",
            "exam_name": "GATE Electrical (EE)",
            "price": 21999.00,
            "duration": "12 Months",
            "total_lectures": 195,
            "rating": 4.9,
            "students_enrolled": 1250,
            "description": "Power systems, electrical machines, control systems, power electronics, network analysis, and signals.",
            "features": "195+ Concept Lectures, MATLAB Simulation Demos, Full Formula Handbook, 20 Years Solved Papers",
            "modules": [
                {
                    "title": "Module 1: Electrical Machines (Transformers, Induction, Synchronous)",
                    "lectures": [
                        {"title": "Single-Phase Transformers: Equivalent Circuit & Losses", "duration": "56m", "is_preview_free": True},
                        {"title": "Three-Phase Induction Motor: Torque-Slip Curves & Speed Control", "duration": "62m", "is_preview_free": False},
                        {"title": "Synchronous Machines: Power-Angle Relations & Armature Reaction", "duration": "58m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Power Systems & Fault Analysis",
                    "lectures": [
                        {"title": "Transmission Line Parameters, ABCD Constants & Ferranti Effect", "duration": "54m", "is_preview_free": False},
                        {"title": "Symmetrical & Unsymmetrical Fault Calculations using Z-bus", "duration": "60m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 8. GATE Electronics & Communication (ECE)
        {
            "slug": "gate-electronics-communication-ece-cohort",
            "title": "GATE Electronics & Communication (ECE) Master Course",
            "branch": "ECE",
            "category": "ENGINEERING",
            "exam_name": "GATE ECE",
            "price": 21999.00,
            "duration": "12 Months",
            "total_lectures": 190,
            "rating": 4.9,
            "students_enrolled": 1340,
            "description": "Semiconductor physics, analog and digital circuits, signals and systems, communication theory, and electromagnetics.",
            "features": "190+ Deep-Dive Lectures, Semiconductor Device Physics Visuals, Circuit Analysis Handbooks",
            "modules": [
                {
                    "title": "Module 1: Semiconductor Physics & Electronic Devices",
                    "lectures": [
                        {"title": "Carrier Transport, Drift-Diffusion & Built-in Potential in p-n Junctions", "duration": "58m", "is_preview_free": True},
                        {"title": "MOSFET Operation: Threshold Voltage & Pinch-Off Mechanics", "duration": "64m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Signals & Systems & Communication",
                    "lectures": [
                        {"title": "Fourier Series, Fourier Transform & LTI System Properties", "duration": "52m", "is_preview_free": False},
                        {"title": "Digital Modulation: BPSK, QPSK, BER Analysis & Nyquist Criterion", "duration": "58m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 9. Foundation (Class 8th, 9th, 10th)
        {
            "slug": "foundation-courses-class-8-9-10",
            "title": "Foundation Science & Mathematics (Class 8th, 9th & 10th)",
            "branch": "GEN",
            "category": "FOUNDATION_8_10",
            "exam_name": "NTSE / Olympiad / Foundation",
            "price": 9999.00,
            "duration": "10 Months",
            "total_lectures": 110,
            "rating": 4.9,
            "students_enrolled": 1500,
            "description": "Early conceptual foundation in Physics, Chemistry, Biology, and Mathematics designed to build scientific temper and prepare for Olympiads, NTSE, and high-school excellence.",
            "features": "Interactive Animated Visuals, Regular Home Workbooks, Weekly Parent-Teacher Reports, Mental Ability & Logic Drills",
            "modules": [
                {
                    "title": "Module 1: Physics Fundamentals & Laws of Motion",
                    "lectures": [
                        {"title": "Kinematics: Displacement, Velocity & Acceleration Graphs", "duration": "42m", "is_preview_free": True},
                        {"title": "Newton's Three Laws of Motion & Momentum Conservation", "duration": "45m", "is_preview_free": False},
                        {"title": "Gravitation, Planetary Motion & Kepler's Laws", "duration": "40m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Chemistry Basics: Atoms & Chemical Reactions",
                    "lectures": [
                        {"title": "Atomic Structure, Valency & Chemical Bonding", "duration": "40m", "is_preview_free": True},
                        {"title": "Chemical Reactions, Types & Balancing Equations", "duration": "44m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 10. School Science (Class 11th & 12th)
        {
            "slug": "school-science-class-11-12",
            "title": "School Science & Competitive Edge (Class 11th & 12th)",
            "branch": "GEN",
            "category": "SCHOOL_11_12",
            "exam_name": "JEE / NEET / Board Science",
            "price": 14999.00,
            "duration": "12 Months",
            "total_lectures": 180,
            "rating": 4.9,
            "students_enrolled": 1820,
            "description": "Comprehensive senior secondary coaching covering CBSE board mastery alongside JEE Main/Advanced and NEET foundation with derivation notebooks and DPPs.",
            "features": "180+ Detailed Concept Lectures, NCERT Line-by-Line Breakdown, 1000+ Topicwise Daily Practice Problems, Proctored Weekend Tests",
            "modules": [
                {
                    "title": "Module 1: Class 11 Mechanics & Thermodynamics",
                    "lectures": [
                        {"title": "Rotational Dynamics & Moment of Inertia Calculations", "duration": "55m", "is_preview_free": True},
                        {"title": "First & Second Law of Thermodynamics with Carnot Engine", "duration": "50m", "is_preview_free": False},
                    ]
                },
                {
                    "title": "Module 2: Class 12 Electromagnetism & Optics",
                    "lectures": [
                        {"title": "Electrostatics: Gauss's Law & Electric Potential", "duration": "60m", "is_preview_free": True},
                        {"title": "Wave Optics: Young's Double Slit Experiment & Diffraction", "duration": "52m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 11. Higher Education (B.Sc, M.Sc, CSIR NET)
        {
            "slug": "higher-education-bsc-msc-chemistry",
            "title": "Higher Education: B.Sc & M.Sc Chemistry (IIT JAM & CSIR NET)",
            "branch": "CY",
            "category": "HIGHER_ED",
            "exam_name": "IIT JAM / CSIR NET (Chemical Sciences)",
            "price": 16999.00,
            "duration": "12 Months",
            "total_lectures": 150,
            "rating": 4.8,
            "students_enrolled": 780,
            "description": "Dedicated higher education program for B.Sc and M.Sc scholars aiming for national research fellowships (JRF), lectureship eligibility, and IIT M.Sc admissions.",
            "features": "Advanced Spectroscopy (NMR, IR, UV-Vis, Mass), Organometallic Chemistry, Statistical Thermodynamics, Unit-Wise Mock Tests",
            "modules": [
                {
                    "title": "Module 1: Advanced Organic Spectroscopy",
                    "lectures": [
                        {"title": "1H & 13C NMR Spectroscopy: Chemical Shifts & Coupling Constants", "duration": "58m", "is_preview_free": True},
                        {"title": "Mass Spectrometry Fragmentation Pathways & McLafferty Rearrangement", "duration": "52m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 12. Pharmacy (GPAT)
        {
            "slug": "pharmacy-bpharm-mpharm-gpat",
            "title": "Pharmacy Professional: B.Pharm, M.Pharm & GPAT Master Course",
            "branch": "GEN",
            "category": "PHARMACY",
            "exam_name": "GPAT / NIPER JEE",
            "price": 15999.00,
            "duration": "12 Months",
            "total_lectures": 140,
            "rating": 4.8,
            "students_enrolled": 910,
            "description": "Standardized coaching for GPAT and NIPER exams covering Pharmacology, Pharmaceutics, Pharmacognosy, and Pharmaceutical Analysis.",
            "features": "GPAT All-India Mock Series, Clinical Case Scenarios, Drug Classification Memory Mnemonics, Live Doubt Clinics",
            "modules": [
                {
                    "title": "Module 1: Pharmacology & Therapeutics",
                    "lectures": [
                        {"title": "Pharmacokinetics: Absorption, Distribution, Metabolism & Excretion", "duration": "54m", "is_preview_free": True},
                        {"title": "Autonomic Nervous System: Cholinergic & Adrenergic Receptors", "duration": "56m", "is_preview_free": False},
                    ]
                }
            ]
        },
        # 13. Ph.D & Research
        {
            "slug": "phd-entrance-research-methodology",
            "title": "Ph.D Entrance & Specialized Research Methodology Program",
            "branch": "GEN",
            "category": "RESEARCH",
            "exam_name": "Ph.D Entrance / Research Aptitude",
            "price": 13999.00,
            "duration": "6 Months",
            "total_lectures": 80,
            "rating": 4.9,
            "students_enrolled": 430,
            "description": "Rigorous training for IIT, NIT, and Central University Ph.D interviews, research proposal writing, literature review methods, and statistical hypothesis testing.",
            "features": "Proposal Drafting Review, Mock Interview Panels with Senior IIT Professors, Statistical Data Analysis (SPSS/Python)",
            "modules": [
                {
                    "title": "Module 1: Research Methodology & Scientific Writing",
                    "lectures": [
                        {"title": "Formulating Research Hypotheses & Experimental Design", "duration": "50m", "is_preview_free": True},
                        {"title": "Literature Review Techniques & Citation Indexing", "duration": "45m", "is_preview_free": False},
                    ]
                }
            ]
        }
    ]

    for item in courses_master:
        modules_data = item.pop("modules", [])
        c_obj, _ = Course.objects.update_or_create(slug=item["slug"], defaults=item)
        print(f"  [Course] {c_obj.title} ({c_obj.branch})")

        for m_idx, m_info in enumerate(modules_data, start=1):
            lecs_data = m_info.pop("lectures", [])
            mod_obj, _ = CourseModule.objects.update_or_create(
                course=c_obj,
                title=m_info["title"],
                defaults={"order": m_idx}
            )
            for l_idx, l_info in enumerate(lecs_data, start=1):
                CourseLecture.objects.update_or_create(
                    module=mod_obj,
                    course=c_obj,
                    title=l_info["title"],
                    defaults={
                        "duration": l_info.get("duration", "50m"),
                        "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                        "notes_pdf_url": "/media/sample_papers/english_cs_10q.pdf",
                        "is_preview_free": l_info.get("is_preview_free", False),
                        "order": l_idx,
                        "is_active": True
                    }
                )

    # --------------------------------------------------------------------------
    # 3. STUDENT ENROLLMENTS FOR 'ANI' (Unlocks Dashboard, Courses, Lectures)
    # --------------------------------------------------------------------------
    print("\n--- Seeding Student Enrollments for 'ANI' ---")
    enrolled_courses = Course.objects.filter(slug__in=[
        "gate-cse-comprehensive-program-2026",
        "gate-data-science-ai-da-master-course",
        "gate-chemistry-cy-master-course"
    ])
    for c in enrolled_courses:
        StudentEnrollment.objects.update_or_create(
            user=ani_user,
            course=c,
            defaults={
                "enrollment_type": "COURSE",
                "course_title": c.title,
                "branch": c.branch,
                "batch_name": f"Raipur Central Cohort {c.branch} 2026",
                "progress_percent": 45,
                "completed_lectures": 28,
                "total_lectures": c.total_lectures or 180,
                "attendance_percent": 94,
                "validity": "Valid till GATE 2026 Exam (Feb 2026)",
                "is_active": True
            }
        )
        print(f"  [Enrolled] ANI -> {c.title}")

    # --------------------------------------------------------------------------
    # 4. TIMETABLE MATRIX (Mon-Sat, 4 slots/day across all disciplines)
    # --------------------------------------------------------------------------
    print("\n--- Seeding Timetable Matrix (Mon-Sat) ---")
    TimetableSlot.objects.all().delete()

    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
    slots_template = [
        # Slot 1: Morning
        ("07:30 AM", "10:30 AM", "CSE", "Theory of Computation & Automata", "Prof. Aniruddh Singh (Ex-IITian)", "Hall 3A + Live Studio", "DFA Minimization & Myhill-Nerode Theorem", "CORE"),
        ("07:30 AM", "10:30 AM", "DA", "Probability & Distributions", "Dr. H. S. Sharma (Lead)", "Studio 2 Raipur", "Multivariate Normal & Bayes Theorem", "CORE"),
        ("07:30 AM", "10:30 AM", "CY", "Quantum Chemistry", "Dr. V. K. Tripathi", "Hall 1A", "Schrödinger Equation & Operators", "CORE"),

        # Slot 2: Mid-day
        ("11:00 AM", "01:30 PM", "CSE", "Design & Analysis of Algorithms", "Prof. Aniruddh Singh", "Hall 3A", "Divide & Conquer, Dynamic Programming", "CORE"),
        ("11:00 AM", "01:30 PM", "DA", "Linear Algebra & SVD", "Prof. R. K. Verma", "Studio 2", "Eigenvalues, Eigenvectors & SVD", "MATH"),
        ("11:00 AM", "01:30 PM", "ME", "Applied Thermodynamics", "Er. Manish Patel", "Hall 2B", "Rankine Cycle & Exergy Analysis", "CORE"),

        # Slot 3: Afternoon
        ("02:30 PM", "05:00 PM", "CSE", "Database Systems (DBMS)", "Er. Priyanshu Gupta", "Hall 3A", "Relational Calculus & Normalization", "CORE"),
        ("02:30 PM", "05:00 PM", "CE", "Soil Mechanics & Foundations", "Dr. Alok Mishra", "Hall 4A", "Consolidation & Shear Strength", "CORE"),
        ("02:30 PM", "05:00 PM", "EE", "Electrical Machines", "Prof. S. N. Ray", "Hall 2A", "Transformers & Induction Motor Curves", "CORE"),

        # Slot 4: Evening Cabin Doubts
        ("05:30 PM", "07:30 PM", "CSE", "Evening 1-on-1 Cabin Doubt Hours", "All Faculty Mentors", "Faculty Cabins Choubey Colony", "Individual student paper analysis & doubt clearing", "DOUBT"),
        ("05:30 PM", "07:30 PM", "DA", "Data Science Python Lab & Doubt Desk", "Dr. H. S. Sharma", "Computer Lab 1", "Hands-on ML Code & Assignment Review", "DOUBT"),
    ]

    slot_count = 0
    for day in days:
        for idx, s in enumerate(slots_template, start=1):
            TimetableSlot.objects.create(
                day=day,
                order=idx,
                start_time=s[0],
                end_time=s[1],
                branch=s[2],
                subject=s[3],
                faculty_name=s[4],
                room_or_mode=s[5],
                topic_description=s[6],
                week_number=1,
                slot_type=s[7],
                is_active=True
            )
            slot_count += 1
    print(f"  [Timetable] Seeded {slot_count} slots across all days!")

    # --------------------------------------------------------------------------
    # 5. LIVE CLASSES (Active LIVE, UPCOMING & RECORDED Archives)
    # --------------------------------------------------------------------------
    print("\n--- Seeding Live Classes ---")
    LiveLecture.objects.all().delete()
    cse_course = Course.objects.filter(branch="CSE").first()
    da_course = Course.objects.filter(branch="DA").first()

    live_classes_data = [
        # 1. LIVE NOW
        {
            "course": cse_course,
            "title": "🔴 LIVE: Algorithms Marathon — Dynamic Programming & Recurrence Trees",
            "description": "Live interactive problem-solving session covering previous 15 years GATE questions on Knapsack, Matrix Chain, and Bellman-Ford.",
            "subject": "Design & Analysis of Algorithms",
            "faculty_name": "Prof. Aniruddh Singh (Ex-IITian, AIR 14)",
            "branch": "CSE",
            "status": "LIVE",
            "scheduled_time": "Today, Live Now",
            "duration": "1h 45m",
            "room_or_mode": "Central Studio Raipur (Hall 3A)",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 1,
        },
        # 2. UPCOMING
        {
            "course": da_course,
            "title": "Upcoming: Linear Algebra — SVD & Principal Component Analysis",
            "description": "Geometric intuition of SVD and mathematical derivation of PCA covariance maximization.",
            "subject": "Linear Algebra & Matrix Methods",
            "faculty_name": "Prof. R. K. Verma",
            "branch": "DA",
            "status": "UPCOMING",
            "scheduled_time": "Tomorrow at 07:30 AM",
            "duration": "2h 00m",
            "room_or_mode": "Studio 2 Raipur + Live Stream",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 2,
        },
        {
            "course": cse_course,
            "title": "Upcoming: Theory of Computation — Turing Machine Reducibility",
            "description": "Decidability, semi-decidability, halting problem proofs, and Rice's theorem application.",
            "subject": "Theory of Computation",
            "faculty_name": "Prof. Aniruddh Singh",
            "branch": "CSE",
            "status": "UPCOMING",
            "scheduled_time": "Tomorrow at 11:00 AM",
            "duration": "1h 30m",
            "room_or_mode": "Studio 1 + Live Stream",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 3,
        },
        # 3. RECORDED ARCHIVES
        {
            "course": cse_course,
            "title": "Classroom Archive: Relational Algebra & Complex SQL Query Optimization",
            "description": "Complete breakdown of division operators, correlated subqueries, and BCNF losslessness checks.",
            "subject": "Database Management Systems",
            "faculty_name": "Er. Priyanshu Gupta",
            "branch": "CSE",
            "status": "RECORDED",
            "scheduled_time": "Recorded on Yesterday",
            "duration": "1h 15m",
            "room_or_mode": "Classroom 3A Archive",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 4,
        },
        {
            "course": cse_course,
            "title": "Classroom Archive: Operating Systems — Virtual Memory & Inverted Page Tables",
            "description": "Two-level and inverted paging architecture, memory management unit (MMU) calculations.",
            "subject": "Operating Systems",
            "faculty_name": "Prof. Aniruddh Singh",
            "branch": "CSE",
            "status": "RECORDED",
            "scheduled_time": "Recorded on Monday",
            "duration": "1h 20m",
            "room_or_mode": "Classroom 3A Archive",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "order": 5,
        }
    ]

    for lc in live_classes_data:
        LiveLecture.objects.create(**lc, is_active=True)
    print(f"  [Live Lectures] Seeded {len(live_classes_data)} sessions with active LIVE status!")

    # --------------------------------------------------------------------------
    # 6. STUDY MATERIALS & WORKBOOKS
    # --------------------------------------------------------------------------
    print("\n--- Seeding Study Materials ---")
    StudyMaterial.objects.all().delete()
    study_materials_data = [
        {"title": "15-Year Solved GATE PYQ Compendium (Computer Science)", "subject": "Computer Science & IT", "category": "WORKBOOK", "branch": "CSE", "file_type": "PDF", "file_size": "24.5 MB", "uploaded_date": "2026-10-15", "download_url": "/media/sample_papers/english_cs_10q.pdf"},
        {"title": "GATE CS Formula & Short Notes Handbook (All Subjects)", "subject": "General Technical Formulae", "category": "FORMULA_SHEET", "branch": "CSE", "file_type": "PDF", "file_size": "8.2 MB", "uploaded_date": "2026-10-20", "download_url": "/media/sample_papers/english_cs_10q.pdf"},
        {"title": "Data Science & AI (DA) Comprehensive Practice Workbook", "subject": "Data Science & AI", "category": "WORKBOOK", "branch": "DA", "file_type": "PDF", "file_size": "18.4 MB", "uploaded_date": "2026-10-18", "download_url": "/media/sample_papers/english_cs_10q.pdf"},
        {"title": "GATE Chemistry (CY) Reaction Mechanisms & Derivations", "subject": "Physical & Organic Chemistry", "category": "LECTURE_NOTES", "branch": "CY", "file_type": "PDF", "file_size": "14.8 MB", "uploaded_date": "2026-10-22", "download_url": "/media/sample_papers/hindi_physics_10q.pdf"},
        {"title": "Mechanical Engineering SOM & Thermal Derivations Pocketbook", "subject": "Mechanical Sciences", "category": "FORMULA_SHEET", "branch": "ME", "file_type": "PDF", "file_size": "11.6 MB", "uploaded_date": "2026-10-25", "download_url": "/media/sample_papers/english_cs_10q.pdf"},
        {"title": "Civil Engineering IS-Code Formula & Design Compendium", "subject": "Civil Structures & Soils", "category": "FORMULA_SHEET", "branch": "CE", "file_type": "PDF", "file_size": "16.1 MB", "uploaded_date": "2026-10-24", "download_url": "/media/sample_papers/english_cs_10q.pdf"},
    ]
    for sm in study_materials_data:
        StudyMaterial.objects.create(**sm, is_active=True)
    print(f"  [Study Materials] Seeded {len(study_materials_data)} workbooks & handbooks!")

    # --------------------------------------------------------------------------
    # 7. FACULTY & EVENING CABIN DOUBT SLOTS
    # --------------------------------------------------------------------------
    print("\n--- Seeding Faculty Availability ---")
    FacultyAvailability.objects.all().delete()
    faculties = Faculty.objects.filter(is_active=True)
    for fac in faculties:
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
            FacultyAvailability.objects.create(
                faculty=fac,
                day_name=day,
                date_str="Active Academic Week",
                time_slot="04:30 PM - 06:30 PM",
                venue=f"Faculty Cabin {fac.id + 10} • Choubey Colony",
                notes="1-on-1 private mentoring & doubt solving",
                is_available=True
            )
    print(f"  [Faculty Availability] Populated evening cabin slots for {faculties.count()} professors!")

    print("================================================================")
    print("   DEMO DATA SEEDING COMPLETE WITH 100% SUCCESS!")
    print("================================================================")


if __name__ == "__main__":
    seed_all()
