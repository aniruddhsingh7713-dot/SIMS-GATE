# SIMS GATE – Chemistry Education & Test Series Platform

SIMS GATE is a full-stack educational technology platform engineered for GATE Chemistry preparation, featuring real-time CBT (Computer-Based Test) proctored exam simulations, daily PYQ challenges, batch/faculty management, Razorpay payment gateway integration, and an enterprise-grade **2-Device Limit & Anti-Account Sharing Security System**.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Lucide Icons, Framer Motion
- **Backend**: Django 6.1, Django REST Framework, PostgreSQL
- **Security & Integrity**: 2-Device Account Binding, Browser Fingerprinting, Signed Device Tokens, Concurrency Row-Locking (`select_for_update`), Admin Audit Logs
- **Payments**: Razorpay Order Creation & Webhook Verification
- **Testing & Documents**: PyMuPDF, ReportLab, PyPDF for test paper ingestion & PDF generation

---

## 🔒 2-Device Limit & Anti-Account Sharing Architecture

SIMS GATE enforces a strict account-level device restriction policy:
1. **Device 1 (e.g. Laptop)**: Automatically bound upon authentication.
2. **Device 2 (e.g. Smartphone)**: Automatically bound upon authentication.
3. **Device 3**: Access to protected test series and mock exams is strictly blocked with a security modal. A backend security alert is recorded (`DEVICE_LIMIT_EXCEEDED`).
4. **Race-Condition Protection**: Database transactions utilize PostgreSQL row locking (`select_for_update`) to prevent concurrent registration bypasses.
5. **Student Device Interface**: Students can view active devices and submit replacement requests directly from `/dashboard/devices`.
6. **Admin Security Dashboard**: Administrators can monitor student devices, investigate suspicious activity, revoke devices, approve replacements, or temporarily suspend compromised accounts.

---

## 🛠️ Project Structure

```
SIMS GATE/
├── backend/                  # Django REST Framework Backend
│   ├── accounts/             # Authentication & User Management
│   ├── assessments/          # Assessments & Scoring Engine
│   ├── analytics/            # Performance Analytics
│   ├── core/                 # Shared Utilities & Middleware
│   ├── courses/              # Test Series, Batches, PYQs, Access Control
│   ├── security/             # Device Limit & Anti-Account Sharing System
│   ├── config/               # Project Settings & URLs
│   ├── media/                # Question Diagrams & Sample Papers
│   ├── requirements.txt      # Python Dependencies
│   └── manage.py
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/              # App Router Pages (Courses, Dashboard, Devices)
│   │   ├── components/       # UI Components & CBT Proctored Modal
│   │   ├── context/          # State Management
│   │   └── lib/              # Device Fingerprinting & API Clients
│   ├── public/               # Logos, Icons & Static Assets
│   └── package.json
├── start-all.bat             # One-click launcher for all local services
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+
- **PostgreSQL**: 15+

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials & Razorpay keys

# Apply migrations
python manage.py migrate

# (Optional) Seed demo data
python seed_complete_demo_data.py

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```

### 4. One-Click Launch (Windows)
Double-click `start-all.bat` in the project root to start both backend and frontend services simultaneously.

---

## 🧪 Security & API Tests

Run the security test suite to verify device limit enforcement and edge cases:
```bash
cd backend
.venv\Scripts\python.exe test_security_scenarios.py
.venv\Scripts\python.exe test_security_api_endpoints.py
```

---

## 📄 License
Proprietary — SIMS Chemistry Education. All rights reserved.
