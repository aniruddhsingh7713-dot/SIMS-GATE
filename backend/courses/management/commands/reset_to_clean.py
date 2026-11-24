import sys
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth.models import User
from courses.models import (
    Exam, SiteSettings, Course, CourseModule, CourseLecture,
    Batch, TimetableSlot, LiveLecture, TestSeries, TestSeriesItem,
    TestSeriesPortalTest, CourseDashboardTest, TestQuestion,
    StudentTestAttempt, QuestionPaperImportJob, StudyMaterial,
    DoubtQuery, Faculty, FacultyAvailability, DailyChallengeQuestion,
    StudentEnrollment, Order, Payment
)
from accounts.models import UserProfile


class Command(BaseCommand):
    help = "Resets the database to a clean baseline state. Only allowed when DEBUG=True."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt for confirmation before resetting.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Refusing to reset database: reset_to_clean only runs when DEBUG=True.")

        no_input = options.get("no_input", False)
        if not no_input:
            self.stdout.write(self.style.WARNING(
                "WARNING: This will delete ALL courses, tests, questions, attempts, batches, "
                "enrollments, payments, and non-superuser users.\n"
                "Only baseline Exams (GATE, NET/SET), SiteSettings, and superuser(s) will be kept."
            ))
            confirm = input("Type 'yes' to proceed: ")
            if confirm.strip().lower() != "yes":
                self.stdout.write(self.style.NOTICE("Database reset cancelled."))
                return

        self.stdout.write("Wiping test and demo data...")

        # Delete student test attempts & import jobs
        StudentTestAttempt.objects.all().delete()
        QuestionPaperImportJob.objects.all().delete()

        # Delete questions and test items
        TestQuestion.objects.all().delete()
        TestSeriesItem.objects.all().delete()

        # Delete timetable, live lectures, batches
        TimetableSlot.objects.all().delete()
        LiveLecture.objects.all().delete()
        Batch.objects.all().delete()

        # Delete doubts, study material, faculty
        DoubtQuery.objects.all().delete()
        FacultyAvailability.objects.all().delete()
        Faculty.objects.all().delete()
        StudyMaterial.objects.all().delete()
        DailyChallengeQuestion.objects.all().delete()

        # Delete transactions & enrollments
        Payment.objects.all().delete()
        Order.objects.all().delete()
        StudentEnrollment.objects.all().delete()

        # Delete curriculum modules & lectures
        CourseLecture.objects.all().delete()
        CourseModule.objects.all().delete()
        Course.objects.all().delete()

        # Delete non-superuser accounts
        UserProfile.objects.filter(user__is_superuser=False).delete()
        User.objects.filter(is_superuser=False).delete()

        # Ensure baseline Exams exist
        gate_exam, _ = Exam.objects.get_or_create(
            code="GATE",
            defaults={
                "name": "Graduate Aptitude Test in Engineering (GATE)",
                "description": "National level examination for engineering graduates across India.",
                "is_active": True,
            }
        )
        net_exam, _ = Exam.objects.get_or_create(
            code="NET_SET",
            defaults={
                "name": "CSIR UGC NET / SET",
                "description": "National and State Eligibility Tests for Assistant Professorship and JRF.",
                "is_active": True,
            }
        )

        # Ensure SiteSettings exist with real contact details
        settings_obj, _ = SiteSettings.objects.get_or_create(
            id=1,
            defaults={
                "institute_name": "SIMS GATE Raipur",
                "contact_phone": "+91 89597 74702",
                "contact_email": "contact@simsgate.com",
                "address": "3rd Floor, SBI Building, Choubey Colony, Raipur, Chhattisgarh 492001",
                "support_timing": "Mon - Sat: 9:00 AM - 7:30 PM",
            }
        )

        self.stdout.write(self.style.SUCCESS(
            "Database reset successfully to clean state!\n"
            f"- Kept superusers: {list(User.objects.filter(is_superuser=True).values_list('username', flat=True))}\n"
            f"- Kept Exams: {list(Exam.objects.values_list('name', flat=True))}\n"
            f"- Kept SiteSettings: {settings_obj.institute_name}\n"
            "- All other model counts are now 0."
        ))
