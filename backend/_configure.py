from pathlib import Path
import os
import re
from dotenv import load_dotenv

p = Path("config/settings.py")
s = p.read_text(encoding="utf-8")

if "load_dotenv(BASE_DIR / '.env')" not in s:
    s = s.replace(
        "BASE_DIR = Path(__file__).resolve().parent.parent",
        "BASE_DIR = Path(__file__).resolve().parent.parent\nload_dotenv(BASE_DIR / '.env')"
    )

if "import os" not in s:
    s = "import os\n" + s

apps = [
    "rest_framework", "corsheaders",
    "core", "courses", "accounts", "analytics", "assessments"
]

m = re.search(r"INSTALLED_APPS\s*=\s*\[.*?\]", s, re.S)
if not m:
    raise RuntimeError("INSTALLED_APPS not found")

block = m.group(0)
for app in apps:
    if f"'{app}'" not in block and f'"{app}"' not in block:
        block = block[:-1] + f"    '{app}',\n]"
s = s[:m.start()] + block + s[m.end():]

if "'corsheaders.middleware.CorsMiddleware'" not in s:
    s = s.replace(
        "'django.middleware.common.CommonMiddleware',",
        "'corsheaders.middleware.CorsMiddleware',\n    'django.middleware.common.CommonMiddleware',"
    )

db = '''DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}'''
s, n = re.subn(r"DATABASES\s*=\s*\{.*?\n\}", db, s, count=1, flags=re.S)
if n != 1:
    raise RuntimeError("Could not configure DATABASES")

s = re.sub(r"SECRET_KEY\s*=\s*.*", 'SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")', s, count=1)
s = re.sub(r"DEBUG\s*=\s*.*", 'DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"', s, count=1)

if "CORS_ALLOWED_ORIGINS" not in s:
    s += '\nCORS_ALLOWED_ORIGINS = [os.getenv("FRONTEND_URL", "http://localhost:3000")]\n'

p.write_text(s, encoding="utf-8")
print("Django settings configured.")
