import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from courses.models import Course, CourseModule, CourseLecture

COURSES_DATA = [
    {
        "title": "GATE Chemistry (CY) Comprehensive Master Course",
        "slug": "gate-chemistry-cy-master-course",
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
                    {"title": "Schrödinger Wave Equation & Postulates of Quantum Mechanics", "duration": "55m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Particle in a 1D & 3D Box: Boundary Conditions & Degeneracy", "duration": "48m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Harmonic Oscillator & Rigid Rotor Approximations", "duration": "52m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Inorganic Chemistry & Coordination Compounds",
                "lectures": [
                    {"title": "Crystal Field Theory (CFT) and Ligand Field Splitting", "duration": "60m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Jahn-Teller Distortion & Electronic Spectra of Complexes", "duration": "50m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 3: Organic Chemistry & Reaction Mechanisms",
                "lectures": [
                    {"title": "Pericyclic Reactions: Woodward-Hoffmann Rules & FMO Method", "duration": "65m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Asymmetric Synthesis & Stereoselective Transformations", "duration": "58m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "GATE Computer Science & IT (CSE) Comprehensive Program",
        "slug": "gate-cse-comprehensive-program-2026",
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
                    {"title": "Asymptotic Analysis, Master Theorem & Recurrence Relations", "duration": "52m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Divide & Conquer: Strassen's Matrix & Median Finding", "duration": "50m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Dynamic Programming: Matrix Chain Multiplication & 0/1 Knapsack", "duration": "64m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Theory of Computation & Discrete Mathematics",
                "lectures": [
                    {"title": "DFA Minimization & Myhill-Nerode Theorem", "duration": "58m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Context-Free Grammars, Ambiguity & Pushdown Automata", "duration": "55m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Turing Machines & Decidability vs Undecidability", "duration": "60m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 3: Operating Systems & Computer Architecture",
                "lectures": [
                    {"title": "CPU Scheduling, Semaphores & Concurrency Control", "duration": "56m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Virtual Memory, Paging & Translation Lookaside Buffers (TLB)", "duration": "54m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "GATE Chemical Engineering (CH) Complete Cohort",
        "slug": "gate-chemical-engineering-ch-cohort",
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
                    {"title": "Kinetics of Homogeneous Reactions & Rate Laws", "duration": "50m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Design of Batch, CSTR and PFR Reactors", "duration": "58m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Mass Transfer Operations",
                "lectures": [
                    {"title": "Fick's Laws of Diffusion & Steady-State Mass Transfer", "duration": "52m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Distillation: McCabe-Thiele & Ponchon-Savarit Methods", "duration": "62m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "Foundation Science & Mathematics (Class 8th, 9th & 10th)",
        "slug": "foundation-courses-class-8-9-10",
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
                    {"title": "Kinematics: Displacement, Velocity & Acceleration Graphs", "duration": "42m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Newton's Three Laws of Motion & Momentum Conservation", "duration": "45m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Chemistry Basics: Atoms & Molecules",
                "lectures": [
                    {"title": "Atomic Structure, Valency & Chemical Bonding", "duration": "40m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Acids, Bases, Salts and Neutralization Reactions", "duration": "44m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "School Science & Competitive Edge (Class 11th & 12th)",
        "slug": "school-science-class-11-12",
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
                    {"title": "Rotational Dynamics & Moment of Inertia Calculations", "duration": "55m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "First & Second Law of Thermodynamics with Carnot Engine", "duration": "50m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Class 12 Electromagnetism & Optics",
                "lectures": [
                    {"title": "Electrostatics: Gauss's Law & Electric Potential", "duration": "60m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Wave Optics: Young's Double Slit Experiment & Diffraction", "duration": "52m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "Higher Education: B.Sc & M.Sc Chemistry (IIT JAM & CSIR NET)",
        "slug": "higher-education-bsc-msc-chemistry",
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
                    {"title": "1H & 13C NMR Spectroscopy: Chemical Shifts & Coupling Constants", "duration": "58m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Mass Spectrometry Fragmentation Pathways & McLafferty Rearrangement", "duration": "52m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "Pharmacy Professional: B.Pharm, M.Pharm & GPAT Master Course",
        "slug": "pharmacy-bpharm-mpharm-gpat",
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
                    {"title": "Pharmacokinetics: Absorption, Distribution, Metabolism & Excretion", "duration": "54m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Autonomic Nervous System: Cholinergic & Adrenergic Receptors", "duration": "56m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "Engineering & Technology: B.Tech / M.Tech University Masterclass",
        "slug": "engineering-technology-btech-mtech",
        "branch": "GEN",
        "category": "ENGINEERING",
        "exam_name": "University Engineering / Core Technicals",
        "price": 11999.00,
        "duration": "6 Months",
        "total_lectures": 95,
        "rating": 4.7,
        "students_enrolled": 1150,
        "description": "Semester curriculum assistance and core engineering concepts for CSVTU, NIT, and state university engineering undergraduates.",
        "features": "Semester Exam Solved Model Papers, Core Lab Practical Tutorials, Derivation Checklists, Mini Project Guidance",
        "modules": [
            {
                "title": "Module 1: Engineering Mathematics & Numerical Methods",
                "lectures": [
                    {"title": "Linear Systems, Gaussian Elimination & LU Decomposition", "duration": "48m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Runge-Kutta & Euler Methods for Differential Equations", "duration": "46m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "Ph.D Entrance & Specialized Research Methodology Program",
        "slug": "phd-entrance-research-methodology",
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
                    {"title": "Formulating Research Hypotheses & Experimental Design", "duration": "50m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Literature Review Techniques & Citation Indexing", "duration": "45m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    },
    {
        "title": "GATE Data Science & Artificial Intelligence (DA) Master Course",
        "slug": "gate-data-science-ai-da-master-course",
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
                "title": "Module 1: Probability & Mathematical Foundations",
                "lectures": [
                    {"title": "Random Variables, Probability Distributions & Bayes Theorem", "duration": "55m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Expectation, Variance & Central Limit Theorem", "duration": "50m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            },
            {
                "title": "Module 2: Machine Learning Algorithms",
                "lectures": [
                    {"title": "Linear & Logistic Regression with Gradient Descent", "duration": "60m", "is_preview_free": True, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                    {"title": "Decision Trees, Random Forests & Ensemble Learning", "duration": "58m", "is_preview_free": False, "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"},
                ]
            }
        ]
    }
]

def seed_courses():
    print("Seeding courses catalog across all categories...")
    for item in COURSES_DATA:
        modules_data = item.pop("modules", [])
        course, created = Course.objects.update_or_create(
            slug=item["slug"],
            defaults=item
        )
        action = "Created" if created else "Updated"
        print(f"[{action}] Course: {course.title} (Rs. {course.price})")

        # Create modules & lectures
        for m_idx, m_item in enumerate(modules_data, start=1):
            lectures_data = m_item.pop("lectures", [])
            module, _ = CourseModule.objects.update_or_create(
                course=course,
                title=m_item["title"],
                defaults={"order": m_idx}
            )

            for l_idx, l_item in enumerate(lectures_data, start=1):
                CourseLecture.objects.update_or_create(
                    module=module,
                    course=course,
                    title=l_item["title"],
                    defaults={
                        "duration": l_item["duration"],
                        "video_url": l_item.get("video_url", "https://www.youtube.com/embed/dQw4w9WgXcQ"),
                        "is_preview_free": l_item.get("is_preview_free", False),
                        "order": l_idx,
                        "is_active": True
                    }
                )
    print("Catalog seeding complete! Total courses in DB:", Course.objects.count())

if __name__ == "__main__":
    seed_courses()
