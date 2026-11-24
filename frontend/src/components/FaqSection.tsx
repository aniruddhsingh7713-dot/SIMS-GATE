"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "What is the mode of learning for SIMS GATE courses?",
    answer:
      "SIMS GATE offers both classroom coaching at our Raipur center and live online coaching for students nationwide. Online learners receive live interactive sessions, recorded backups for revision, and digital lecture notes.",
  },
  {
    question: "Are Previous Years' Questions (PYQs) solved in class?",
    answer:
      "Yes. Comprehensive PYQ solving is central to our teaching. We solve 15+ years of GATE question papers topic-by-topic, covering Multiple Choice Questions (MCQs), Multiple Select Questions (MSQs), and Numerical Answer Types (NATs).",
  },
  {
    question: "How does 1-on-1 faculty doubt clearing work?",
    answer:
      "Unlike massive platforms where doubts are handled by chatbots, SIMS GATE gives students direct access to subject teachers. You can ask doubts during live sessions, in dedicated doubt clinics in Raipur, or directly via our academic WhatsApp desk.",
  },
  {
    question: "Can 3rd and 4th-year college students balance this course?",
    answer:
      "Yes. Our curriculum pacing is planned to accommodate college exams and academic semesters. Classes are scheduled in high-yield modules so you can build GATE proficiency alongside your university coursework.",
  },
  {
    question: "How do I enroll or speak to an advisor before joining?",
    answer:
      "You can click 'Talk to an Advisor' or message our Raipur center directly on WhatsApp at +91 89597 74702. We will discuss your branch, academic year, and recommend the best starting point for your preparation.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="faq-section" id="faq" aria-label="Frequently Asked Questions">
      <div className="section-container">
        <div className="section-header-centered">
          <span className="section-kicker">STUDENT QUERIES</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about preparing for GATE with SIMS Raipur.
          </p>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-icon-wrap" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`faq-chevron ${isOpen ? "faq-chevron-rotated" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="faq-answer-panel">
                      <p className="faq-answer-text">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Contact Box beneath FAQ */}
        <div className="faq-footer-callout">
          <div className="faq-callout-text">
            <h4>Have a specific question about your branch or eligibility?</h4>
            <p>Our academic counselors in Raipur are available to assist you 7 days a week.</p>
          </div>
          <a
            href="https://wa.me/918959774702?text=Hi%20SIMS%20GATE%2C%20I%20have%20a%20question%20regarding%20GATE%20preparation."
            target="_blank"
            rel="noreferrer"
            className="faq-whatsapp-btn"
          >
            <span>Ask on WhatsApp: +91 89597 74702 ↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
