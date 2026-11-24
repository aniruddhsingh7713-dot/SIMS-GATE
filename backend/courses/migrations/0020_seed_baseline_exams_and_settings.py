from django.db import migrations


def seed_baseline(apps, schema_editor):
    Exam = apps.get_model('courses', 'Exam')
    SiteSettings = apps.get_model('courses', 'SiteSettings')

    Exam.objects.get_or_create(
        code="GATE",
        defaults={
            "name": "Graduate Aptitude Test in Engineering (GATE)",
            "description": "National level examination for engineering graduates across India.",
            "is_active": True,
        }
    )
    Exam.objects.get_or_create(
        code="NET_SET",
        defaults={
            "name": "CSIR UGC NET / SET",
            "description": "National and State Eligibility Tests for Assistant Professorship and JRF.",
            "is_active": True,
        }
    )

    SiteSettings.objects.get_or_create(
        id=1,
        defaults={
            "institute_name": "SIMS GATE Raipur",
            "contact_phone": "+91 89597 74702",
            "contact_email": "contact@simsgate.com",
            "address": "3rd Floor, SBI Building, Choubey Colony, Raipur, Chhattisgarh 492001",
            "support_timing": "Mon - Sat: 9:00 AM - 7:30 PM",
        }
    )


def unseed_baseline(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0019_exam_sitesettings_course_exam'),
    ]

    operations = [
        migrations.RunPython(seed_baseline, unseed_baseline),
    ]
