"use client";

import { useAdvisor } from "@/context/AdvisorContext";

export function HeroAdvisorButton() {
  const { openAdvisor } = useAdvisor();

  return (
    <button
      type="button"
      onClick={() => openAdvisor("Classroom Batch Admissions 2027–2028")}
      className="btn-hero-whatsapp"
      title="Open SIMS GATE Admissions Desk"
    >
      <svg className="hero-wa-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.02.79.81-2.94-.19-.3a8.21 8.21 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28" />
      </svg>
      <span>Talk to an Advisor on WhatsApp</span>
    </button>
  );
}

export function FloatingAdvisorButton() {
  const { openAdvisor } = useAdvisor();

  return (
    <button
      type="button"
      className="floating-whatsapp"
      onClick={() => openAdvisor("Quick Admissions Inquiry")}
      aria-label="Open SIMS GATE Admissions Desk"
      title="Chat with SIMS GATE Raipur Advisor"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16 3a13 13 0 0 0-11 19.9L3.2 29l6.3-1.7A13 13 0 1 0 16 3Zm0 23.4a10.4 10.4 0 0 1-5.2-1.4l-.4-.2-3.8 1 1-3.7-.3-.4a10.4 10.4 0 1 1 8.7 4.7Zm5.7-7.7c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 4.9.8.3 1.4.5 1.8.6.8.2 1.5.2 2 .1.6-.1 1.7-.7 2-1.3.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z" />
      </svg>
    </button>
  );
}

export function FooterAdvisorButton() {
  const { openAdvisor } = useAdvisor();

  return (
    <button
      type="button"
      className="footer-wa-btn"
      onClick={() => openAdvisor("Classroom Batch Admissions 2027–2028")}
      title="Open Admissions Desk"
    >
      <span>Chat with an Advisor on WhatsApp ↗</span>
    </button>
  );
}

export function AnnouncementHelplineButton() {
  const { openAdvisor } = useAdvisor();

  return (
    <button
      type="button"
      className="announcement-link-btn"
      onClick={() => openAdvisor("Helpline Consultation")}
      title="Contact Admissions Helpline"
    >
      Admissions Helpline: <strong>+91 89597 74702</strong>
    </button>
  );
}
