"use client";

import { useState } from "react";
import Image from "next/image";
import { useAdvisor } from "@/context/AdvisorContext";
import {
  Share2,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Building2,
  Wrench,
  Zap,
  FlaskConical,
  GraduationCap,
  Sparkles,
  MapPin,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";

export type Course = {
  id: number;
  title: string;
  slug: string;
  description: string;
  branch?: string;
  branch_display?: string;
  exam_name: string;
  price: string;
  is_active: boolean;
  category?: string;
  category_display?: string;
  duration?: string;
  total_lectures?: number;
};

interface CourseCardProps {
  course: Course;
}

// Branch-specific Apple gradient themes & icons
function getBranchTheme(branch?: string, title?: string) {
  const b = (branch || "").toUpperCase();
  const t = (title || "").toUpperCase();

  if (b.includes("CSE") || t.includes("COMPUTER")) {
    return {
      gradient: "from-slate-900 via-slate-800 to-indigo-950",
      accent: "#38BDF8",
      label: "Computer Science & IT",
      code: "CSE",
      icon: Code2,
      dots: ["#38BDF8", "#818CF8", "#F59E0B", "#10B981"],
    };
  }
  if (b.includes("DA") || t.includes("DATA SCIENCE") || t.includes("ARTIFICIAL")) {
    return {
      gradient: "from-violet-950 via-slate-900 to-purple-900",
      accent: "#A78BFA",
      label: "Data Science & AI",
      code: "DA",
      icon: Cpu,
      dots: ["#A78BFA", "#C084FC", "#38BDF8", "#10B981"],
    };
  }
  if (b.includes("CE") || t.includes("CIVIL")) {
    return {
      gradient: "from-stone-900 via-amber-950/80 to-slate-900",
      accent: "#F59E0B",
      label: "Civil Engineering",
      code: "CE",
      icon: Building2,
      dots: ["#F59E0B", "#D97706", "#38BDF8", "#10B981"],
    };
  }
  if (b.includes("ME") || t.includes("MECHANICAL")) {
    return {
      gradient: "from-zinc-900 via-slate-800 to-zinc-900",
      accent: "#94A3B8",
      label: "Mechanical Engineering",
      code: "ME",
      icon: Wrench,
      dots: ["#94A3B8", "#CBD5E1", "#F59E0B", "#10B981"],
    };
  }
  if (b.includes("EE") || b.includes("EC") || t.includes("ELECTRICAL") || t.includes("ELECTRONIC")) {
    return {
      gradient: "from-slate-950 via-blue-950 to-slate-900",
      accent: "#60A5FA",
      label: "Electrical & Electronics",
      code: "EE/EC",
      icon: Zap,
      dots: ["#60A5FA", "#38BDF8", "#F59E0B", "#10B981"],
    };
  }
  if (b.includes("CY") || b.includes("CH") || t.includes("CHEM")) {
    return {
      gradient: "from-slate-950 via-emerald-950 to-slate-900",
      accent: "#34D399",
      label: "Chemistry & Chemical",
      code: "CY/CH",
      icon: FlaskConical,
      dots: ["#34D399", "#10B981", "#F59E0B", "#38BDF8"],
    };
  }
  return {
    gradient: "from-slate-900 via-[#1E293B] to-slate-900",
    accent: "#C5A059",
    label: "Comprehensive GATE",
    code: b || "GATE",
    icon: GraduationCap,
    dots: ["#C5A059", "#38BDF8", "#10B981", "#F59E0B"],
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const { openAdvisor } = useAdvisor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const priceNum = Number(course.price) || 0;
  const formattedPrice = priceNum.toLocaleString("en-IN");
  const emiPerMonth = Math.round(priceNum / 3).toLocaleString("en-IN");
  const theme = getBranchTheme(course.branch, course.title);
  const Icon = theme.icon;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `Check out ${course.title} at SIMS GATE Raipur: https://wa.me/918959774702`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnquire = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    openAdvisor(`Admissions: ${course.title}`, course.title, formattedPrice);
  };

  return (
    <>
      <article className="apple-product-card group">
        {/* ============================================================
            1. TOP ROUNDED PRODUCT SHOWCASE BANNER (APPLE STYLE)
            ============================================================ */}
        <div className={`apple-card-banner bg-gradient-to-br ${theme.gradient}`}>
          {/* Subtle Ambient Radial Highlight */}
          <div className="apple-banner-radial" />

          {/* Top Row: Stream Badge + Share Button */}
          <div className="apple-banner-top-row">
            <span className="apple-banner-stream-pill">
              <span className="apple-pill-dot" style={{ backgroundColor: theme.accent }} />
              <span>{theme.code} · BATCH 2027–28</span>
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="apple-banner-share-btn"
              title="Share program details"
              aria-label="Share program details"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Share2 className="size-3.5 text-white/80 hover:text-white" />
              )}
            </button>
          </div>

          {/* Center Product Illustration / Insignia */}
          <div className="apple-banner-center-art">
            <div className="apple-art-icon-frame">
              <Icon className="size-10 text-white/90 drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="apple-art-text-wrap">
              <span className="apple-art-institution">SIMS GATE RAIPUR</span>
              <span className="apple-art-accreditation">Classroom &amp; Live HD</span>
            </div>
          </div>

          {/* Bottom Campus Bar */}
          <div className="apple-banner-bottom-bar">
            <div className="apple-campus-pin">
              <MapPin className="size-3 text-[#C5A059]" />
              <span>Choubey Colony Center</span>
            </div>
            <div className="apple-intake-badge">
              <span className="apple-pulse-green" />
              <span>Admissions Open</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            2. COLOR / FEATURE DOTS (APPLE SPECIFICATION)
            ============================================================ */}
        <div className="apple-card-dots-row" title="Classroom · Live HD · PYQs · 1-on-1 Cabin">
          {theme.dots.map((dotColor, idx) => (
            <span
              key={idx}
              className="apple-feature-dot"
              style={{ backgroundColor: dotColor }}
            />
          ))}
          <span className="apple-dots-caption">Classroom · Live HD · 15+ Yrs PYQs · Mentorship</span>
        </div>

        {/* ============================================================
            3. PRODUCT IDENTITY & CRISP TYPOGRAPHY
            ============================================================ */}
        <div className="apple-card-content">
          {/* Eyebrow (Apple Orange Accent) */}
          <div className="apple-card-eyebrow-row">
            <span className="apple-orange-eyebrow">NEW COHORT</span>
            <span className="apple-eyebrow-divider">•</span>
            <span className="apple-syllabus-eyebrow">100% GATE SYLLABUS</span>
          </div>

          {/* Course Title */}
          <h3 className="apple-course-title" title={course.title}>
            {course.title}
          </h3>

          {/* 2-Line Crisp Punchline Description */}
          <p className="apple-course-punchline">
            {course.description ||
              "Fundamental concept derivations, 15+ years solved PYQ vault, and direct in-person faculty cabin mentorship."}
          </p>

          {/* Apple-Style Pricing Line */}
          <div className="apple-pricing-block">
            <div className="apple-price-main">
              <span className="apple-price-from">From </span>
              <strong className="apple-price-val">₹{formattedPrice}</strong>
              {priceNum > 0 && (
                <span className="apple-price-emi">
                  {" "}or <strong>₹{emiPerMonth}/mo.</strong> for 3 mo.*
                </span>
              )}
            </div>
            <span className="apple-price-sub">All-inclusive registration · Zero hidden fees</span>
          </div>

          {/* ============================================================
              4. APPLE-STYLE ACTION BUTTONS (CLEAN PILL + TEXT LINK)
              ============================================================ */}
          <div className="apple-actions-group">
            <button
              type="button"
              onClick={handleEnquire}
              className="apple-primary-pill-btn"
            >
              <span>Enquire on WhatsApp</span>
              <span className="apple-btn-arrow">↗</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="apple-secondary-link-btn"
            >
              <span>View Syllabus &amp; Modules</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </article>

      {/* ============================================================
          5. INTERACTIVE CURRICULUM DETAILS MODAL (APPLE CLEAN AESTHETIC)
          ============================================================ */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="apple-syllabus-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-course-title"
          >
            <div className="apple-smodal-header">
              <div className="apple-smodal-badge">
                <span>SIMS GATE RAIPUR · ACCREDITED SYLLABUS</span>
              </div>
              <button
                type="button"
                className="apple-smodal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="apple-smodal-body">
              <h3 id="modal-course-title" className="apple-smodal-title">
                {course.title}
              </h3>
              <p className="apple-smodal-desc">
                {course.description ||
                  "Complete syllabus derivations, past 15-year question vault, daily in-person doubt clinics, and All-India mock test series."}
              </p>

              <div className="apple-smodal-features-grid">
                <div className="apple-sfeat-box">
                  <span className="apple-sfeat-lbl">LECTURE DELIVERY</span>
                  <strong className="apple-sfeat-val">Choubey Colony Classroom + Live HD</strong>
                </div>
                <div className="apple-sfeat-box">
                  <span className="apple-sfeat-lbl">BATCH TIMINGS</span>
                  <strong className="apple-sfeat-val">Flexible Morning &amp; Evening Batches</strong>
                </div>
                <div className="apple-sfeat-box">
                  <span className="apple-sfeat-lbl">DOUBT CLEARING</span>
                  <strong className="apple-sfeat-val">Daily 1-on-1 Faculty Cabin Hours</strong>
                </div>
                <div className="apple-sfeat-box">
                  <span className="apple-sfeat-lbl">TEST SERIES</span>
                  <strong className="apple-sfeat-val">Exact TCS iON CBT Interface</strong>
                </div>
              </div>

              <div className="apple-smodal-modules-section">
                <h4 className="apple-smodules-heading">Included Academic Curriculum:</h4>
                <div className="apple-smodules-list">
                  <div className="apple-smodule-item">
                    <CheckCircle2 className="size-4 text-[#C5A059] shrink-0" />
                    <span>Complete Core Technical Modules derived from first principles</span>
                  </div>
                  <div className="apple-smodule-item">
                    <CheckCircle2 className="size-4 text-[#C5A059] shrink-0" />
                    <span>Engineering Mathematics &amp; General Aptitude coverage</span>
                  </div>
                  <div className="apple-smodule-item">
                    <CheckCircle2 className="size-4 text-[#C5A059] shrink-0" />
                    <span>15+ Years GATE Solved Question Compendium (NATs &amp; MSQs)</span>
                  </div>
                  <div className="apple-smodule-item">
                    <CheckCircle2 className="size-4 text-[#C5A059] shrink-0" />
                    <span>Formula Handbooks, Short Notes &amp; Derivation Roadmaps</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="apple-smodal-footer">
              <div className="apple-smodal-fee-col">
                <span className="apple-smodal-fee-lbl">TOTAL TUITION FEE</span>
                <span className="apple-smodal-fee-num">₹{formattedPrice}</span>
              </div>
              <button
                type="button"
                className="apple-smodal-enquire-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  handleEnquire();
                }}
              >
                <span>Enroll / Enquire on WhatsApp ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
