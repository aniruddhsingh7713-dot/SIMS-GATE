import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from courses.models import StudentTestAttempt, QuestionPaperImportJob
print(f"Imported successfully! Attempts: {StudentTestAttempt.objects.count()}, Jobs: {QuestionPaperImportJob.objects.count()}")
