from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, help_text="Mobile or WhatsApp number")
    target_branch = models.CharField(
        max_length=50,
        blank=True,
        default="Computer Science (CSE)",
        help_text="Target GATE Discipline (e.g. CSE, DA, ME, CE)"
    )
    target_exam = models.CharField(
        max_length=50,
        blank=True,
        default="GATE 2026",
        help_text="Target GATE Season"
    )
    college = models.CharField(max_length=150, blank=True, help_text="Current Engineering College / University")
    dob = models.CharField(max_length=30, blank=True, help_text="Date of birth or age")
    gender = models.CharField(max_length=30, blank=True, default="prefer_not_to_say", help_text="Gender")
    qualification = models.CharField(max_length=120, blank=True, help_text="Academic qualification / current education")
    preparation_level = models.CharField(max_length=80, blank=True, default="Concept Building & PYQs", help_text="Preparation stage / learning goal")
    is_onboarded = models.BooleanField(default=False, help_text="True if student has completed initial onboarding")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.target_branch} - {self.target_exam} - Onboarded: {self.is_onboarded})"
