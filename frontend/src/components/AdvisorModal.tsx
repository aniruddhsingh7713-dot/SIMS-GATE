"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useAdvisor } from "@/context/AdvisorContext";

const TOPICS = [
  "Classroom Batch 2027–2028 Admissions",
  "Fee Structure & Installment Plans",
  "Schedule Offline Center Visit (Choubey Colony)",
  "Syllabus & Physical Study Material Kit",
  "1-on-1 Faculty Strategy Consultation",
  "Online / Hybrid Live Batch Inquiries",
];

const BRANCHES = [
  "Computer Science (CSE)",
  "Data Science & AI (DA)",
  "Civil Engineering (CE)",
  "Mechanical Engg. (ME)",
  "Electrical Engg. (EE)",
  "Electronics (ECE)",
  "Other Engineering Branch",
];

const TARGET_YEARS = [
  "GATE 2027 Aspirant",
  "GATE 2028 Aspirant",
  "College 2nd / 3rd Year",
  "Final Year Student",
  "Full-Time Dropper / PSU",
];

export default function AdvisorModal() {
  const { isOpen, topic: initialTopic, courseTitle, coursePrice, closeAdvisor } = useAdvisor();
  const [userSelectedTopic, setUserSelectedTopic] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("Computer Science (CSE)");
  const [selectedYear, setSelectedYear] = useState("GATE 2027 Aspirant");
  const [studentName, setStudentName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);

  // Derive topic cleanly without cascading effect setState
  const selectedTopic = userSelectedTopic ?? (courseTitle ? `Enrollment Inquiry: ${courseTitle}` : initialTopic);

  const handleClose = () => {
    setUserSelectedTopic(null);
    closeAdvisor();
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeAdvisor();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAdvisor]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Construct structured WhatsApp message
  const generatedMessage = useMemo(() => {
    const greeting = studentName.trim()
      ? `Hello SIMS GATE Raipur, my name is ${studentName.trim()}.`
      : "Hello SIMS GATE Raipur,";

    const subjectLine = courseTitle
      ? `I would like to inquire about the course "${courseTitle}"${coursePrice ? ` (Fee: ₹${coursePrice})` : ""}.`
      : `I would like to inquire regarding: ${selectedTopic}.`;

    const branchInfo = `• Discipline: ${selectedBranch}\n• Target: ${selectedYear}`;
    const noteInfo = customNote.trim() ? `\n• Specific Query: "${customNote.trim()}"` : "";

    return `${greeting}\n\n${subjectLine}\n\n${branchInfo}${noteInfo}\n\nPlease share admission details, batch timings, and offline counseling slots at the Choubey Colony center. Thank you!`;
  }, [studentName, courseTitle, coursePrice, selectedTopic, selectedBranch, selectedYear, customNote]);

  const whatsappUrl = useMemo(() => {
    return `https://wa.me/918959774702?text=${encodeURIComponent(generatedMessage)}`;
  }, [generatedMessage]);

  if (!isOpen) return null;

  return (
    <div
      className="advisor-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-desk-title"
    >
      <div
        className="advisor-drawer"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Line */}
        <div className="advisor-accent-bar" />

        {/* Drawer Header */}
        <div className="advisor-header">
          <div className="advisor-brand-lockup">
            <div className="advisor-logo-wrap">
              <Image
                src="/sims-logo.png"
                alt="SIMS Raipur Official Logo"
                width={50}
                height={50}
                className="advisor-logo-img object-contain"
              />
            </div>
            <div className="advisor-header-titles">
              <span className="advisor-kicker">OFFICIAL ACADEMIC COUNSELING · RAIPUR</span>
              <h3 id="advisor-desk-title" className="advisor-title">GATE Admissions Desk</h3>
              <div className="advisor-duty-indicator">
                <span className="advisor-green-pulse" />
                <span className="advisor-duty-text">Counseling Active · Mon–Sat (9:30 AM – 7:30 PM IST)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="advisor-close-btn"
            onClick={handleClose}
            aria-label="Close Advisor Desk"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="advisor-body">
          {/* Official Center Verification Card */}
          <div className="advisor-verified-card">
            <div className="avc-badge-row">
              <span className="avc-badge">ACCREDITED RAIPUR CENTER</span>
              <span className="avc-credo">“Your Journey. Our Guidance.”</span>
            </div>
            <div className="avc-address-row">
              <svg className="avc-pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div>
                <strong>3rd Floor, SBI Building, Main Road Choubey Colony</strong>
                <p>Samta, Raipur, Chhattisgarh – 492001</p>
              </div>
            </div>
            <div className="avc-helpline-row">
              <span>Direct Admissions Helpline:</span>
              <a href="tel:+918959774702" className="avc-phone-link">+91 89597 74702</a>
            </div>
          </div>

          {/* Active Course Banner if Opened from a Course Card */}
          {courseTitle && (
            <div className="advisor-course-context">
              <div className="acc-tag">SELECTED PROGRAM</div>
              <div className="acc-title">{courseTitle}</div>
              {coursePrice && <div className="acc-fee">Official Course Fee: ₹{coursePrice} (All-Inclusive)</div>}
            </div>
          )}

          {/* Interactive Consultation Topic */}
          <div className="advisor-field-group">
            <label className="advisor-label">
              <span>1. Consultation Subject</span>
              <span className="advisor-label-hint">Select your primary reason for reaching out</span>
            </label>
            <div className="advisor-topic-chips" role="radiogroup" aria-label="Consultation Topic">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={selectedTopic === t}
                  className={`topic-chip ${selectedTopic === t ? "topic-chip-active" : ""}`}
                  onClick={() => setUserSelectedTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Student Academic Profile */}
          <div className="advisor-field-group">
            <label className="advisor-label">
              <span>2. Engineering Stream &amp; Target</span>
              <span className="advisor-label-hint">Helps faculty provide precise syllabus advice</span>
            </label>
            <div className="advisor-grid-inputs">
              <div className="advisor-select-wrap">
                <label className="advisor-sublabel">Your Engineering Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="advisor-select"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="advisor-select-wrap">
                <label className="advisor-sublabel">Preparation Target:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="advisor-select"
                >
                  {TARGET_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Name & Specific Question */}
          <div className="advisor-field-group">
            <label className="advisor-label">
              <span>3. Student Name &amp; Note (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Your full name (e.g. Ankit Verma)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="advisor-input"
            />
            <textarea
              placeholder="Ask a specific question about batch timings, fees, demo classes, or hostel assistance..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={2}
              className="advisor-textarea"
            />
          </div>

          {/* Message Preview Transparency Card */}
          <div className="advisor-preview-card">
            <div className="apc-header">
              <span className="apc-dot" />
              <span className="apc-title">PREVIEW OF YOUR OFFICIAL WHATSAPP QUERY</span>
            </div>
            <pre className="apc-content">{generatedMessage}</pre>
          </div>

          {/* Center Guarantees */}
          <div className="advisor-trust-points">
            <div className="atp-item">
              <span className="atp-icon">✓</span>
              <span>Direct faculty &amp; counselor response within 15–30 mins</span>
            </div>
            <div className="atp-item">
              <span className="atp-icon">✓</span>
              <span>No spam or automated marketing — strictly academic guidance</span>
            </div>
            <div className="atp-item">
              <span className="atp-icon">✓</span>
              <span>Offline classroom counseling &amp; material inspection in Choubey Colony</span>
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="advisor-footer">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="advisor-btn-whatsapp"
            onClick={closeAdvisor}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.02.79.81-2.94-.19-.3a8.21 8.21 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28" />
            </svg>
            <span>Start Consultation on WhatsApp</span>
            <span className="advisor-btn-arrow">→</span>
          </a>

          <div className="advisor-secondary-actions">
            <a href="tel:+918959774702" className="advisor-btn-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Call Helpline: +91 89597 74702</span>
            </a>

            <a
              href="https://www.google.com/maps/search/SBI+Building+Main+Road+Choubey+Colony+Raipur"
              target="_blank"
              rel="noreferrer"
              className="advisor-btn-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 8 8 12 12 16 12 8"></polygon>
              </svg>
              <span>Google Maps Directions ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
