"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdvisor } from "@/context/AdvisorContext";
import type { Course } from "@/components/CourseCard";
import TypewriterHeader from "@/components/TypewriterHeader";
import RazorpayCheckoutModal from "@/components/RazorpayCheckoutModal";

interface TestSeriesSectionProps {
  courses: Course[];
}

export default function TestSeriesSection({ courses }: TestSeriesSectionProps) {
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { openAdvisor } = useAdvisor();

  const [activeModalCourse, setActiveModalCourse] = useState<Course | null>(null);
  const [checkoutModalCourse, setCheckoutModalCourse] = useState<Course | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  // Derive active courses that actually exist in the database
  const activeCourses = courses.filter((c) => c.is_active);

  const handleExplore = (course: Course) => {
    setActiveModalCourse(course);
  };

  const handleBuyTestSeries = (course: Course) => {
    if (!isAuthenticated || !user) {
      setLoginNotice("Please login or create an account first to purchase this Test Series.");
      openAuthModal("login");
      return;
    }
    setLoginNotice(null);
    setActiveModalCourse(null);
    setCheckoutModalCourse(course);
    setCheckoutModalOpen(true);
  };

  const typewriterWords =
    activeCourses.length > 0
      ? activeCourses.map((c) => c.exam_name || c.title.replace(/ Complete Course/i, ""))
      : [
          "Computer Science (CSE)",
          "Data Science & AI (DA)",
          "Civil Engineering (CE)",
          "Mechanical (ME)",
          "Electronics (ECE)",
          "Electrical (EE)",
        ];

  return (
    <section className="test-series-section" id="test-series" aria-label="GATE Test Series Catalog">
      <div className="section-container">
        {/* Section Header */}
        <div className="test-series-masthead">
          <div className="ts-kicker-row">
            <span className="ts-kicker-badge">EXAMINATION RIGOUR &amp; BENCHMARKS</span>
            <span className="ts-kicker-line" aria-hidden="true" />
          </div>
          <div className="ts-header-flex">
            <div className="ts-header-text">
              <h2 className="ts-section-title">
                All-India GATE Test Series{" "}
                <span className="ts-typewriter-slot">
                  <span className="ts-typewriter-sep">·</span>{" "}
                  <TypewriterHeader
                    words={typewriterWords}
                    className="ts-header-typewriter"
                  />
                </span>
              </h2>
              <p className="ts-section-subtitle">
                Accredited evaluation modules mirroring the official GATE computer-based test interface, virtual scientific calculator mechanics, and negative-marking constraints.
              </p>
            </div>
            <div className="ts-header-meta">
              <span className="ts-meta-pill">
                <span className="ts-live-dot" />
                Session 2027–2028
              </span>
            </div>
          </div>
        </div>

        {/* Optional Login Notice Banner */}
        {loginNotice && (
          <div className="ts-login-notice-banner">
            <div className="ts-login-notice-text">
              <span className="ts-notice-icon">🔒</span>
              <strong>Authentication Required:</strong>
              <span>{loginNotice}</span>
            </div>
            <button
              type="button"
              className="ts-notice-btn"
              onClick={() => openAuthModal("login")}
            >
              Sign In to Continue &rarr;
            </button>
          </div>
        )}

        {/* Test Series Cards Grid */}
        <div className="test-series-grid">
          {activeCourses.length > 0 ? (
            activeCourses.map((course) => {
              const examName =
                course.exam_name || (course.branch ? `GATE ${course.branch}` : "GATE Engineering");
              const testSeriesTitle = `${course.title.replace(/ Complete Course/i, "")} Test Series`;
              const formattedPrice = Number(course.price).toLocaleString("en-IN");

              return (
                <article key={course.id} className="test-series-card group hover:border-[#C5A059] transition-all">
                  {/* Card Top: Discipline Tag + Live Status Indicator */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#15271E] text-white tracking-wide">
                      {examName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>CBT Active</span>
                    </span>
                  </div>

                  {/* Card Header */}
                  <div className="pt-2">
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug group-hover:text-[#0B192C]">
                      {testSeriesTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Official SIMS GATE Assessment Division · Choubey Colony Raipur
                    </p>
                  </div>

                  {/* Program Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-3">
                    Curriculum-aligned mock series covering topic benchmarks, multi-subject sectional papers, and full-length proctored simulations with real GATE scientific calculator.
                  </p>

                  {/* Academic Assessment Specifications */}
                  <div className="my-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">FORMAT</span>
                      <strong className="text-xs font-bold text-slate-800">CBT Proctored</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">TEST TIERS</span>
                      <strong className="text-xs font-bold text-slate-800">Topic + Mocks</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">SOLUTIONS</span>
                      <strong className="text-xs font-bold text-slate-800">Faculty Verified</strong>
                    </div>
                  </div>

                  {/* Card Footer: Clear Action */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">ENROLLMENT FEE</span>
                      <span className="text-xl font-bold text-slate-900">₹{formattedPrice}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B192C] font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        onClick={() => handleBuyTestSeries(course)}
                        title={`Enroll in ${testSeriesTitle} with Razorpay`}
                      >
                        <span>Buy Now</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                        onClick={() => handleExplore(course)}
                        title="View Full Test Syllabus & Assessment Schedule"
                      >
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="ts-empty-state">
              <p>No active test series records currently registered in the curriculum system.</p>
            </div>
          )}
        </div>

        {/* Institutional Test Standards Bar */}
        <div className="ts-standards-bar">
          <div className="ts-standard-col">
            <span className="ts-standard-num">01</span>
            <div className="ts-standard-content">
              <strong>Official CBT Simulation</strong>
              <p>Exact replica of the GATE interface, screen timer, and response palette.</p>
            </div>
          </div>
          <div className="ts-standard-divider" aria-hidden="true" />
          <div className="ts-standard-col">
            <span className="ts-standard-num">02</span>
            <div className="ts-standard-content">
              <strong>MSQ &amp; NAT Precision</strong>
              <p>Comprehensive error tracking on Multiple Select Questions and numerical ranges.</p>
            </div>
          </div>
          <div className="ts-standard-divider" aria-hidden="true" />
          <div className="ts-standard-col">
            <span className="ts-standard-num">03</span>
            <div className="ts-standard-content">
              <strong>Raipur Doubt Support</strong>
              <p>Post-test personal analysis sessions with subject faculty at Choubey Colony.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Test Series Details Modal */}
      {activeModalCourse && (
        <div className="modal-backdrop" onClick={() => setActiveModalCourse(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-ts-title"
          >
            <div className="modal-header">
              <div className="modal-header-badge">
                <span>SIMS GATE RAIPUR · TEST SERIES DIRECTORY</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModalCourse(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-course-summary">
                <h3 id="modal-ts-title" className="modal-title">
                  {activeModalCourse.title} — Test Series
                </h3>
                <span className="modal-exam-tag">
                  {activeModalCourse.exam_name || "GATE Examination Benchmark"}
                </span>
                <p className="modal-desc">
                  Structured assessment curriculum designed to benchmark your speed, conceptual depth, and negative-marking risk against All-India standards.
                </p>
                <div className="modal-center-verification">
                  <span>📍 Testing Venue: 3rd Floor, SBI Bldg, Choubey Colony, Raipur &amp; 24/7 Online CBT Portal</span>
                </div>
              </div>

              <div className="modal-curriculum-grid">
                <div className="curriculum-col">
                  <h4 className="curriculum-heading">Assessment Structure</h4>
                  <ul className="curriculum-list">
                    <li>• <strong>Tier I: Topic Drill Tests</strong> — High-yield concept checkpoints following each classroom chapter.</li>
                    <li>• <strong>Tier II: Subject Integration</strong> — Multi-topic combined tests evaluating cross-concept synthesis.</li>
                    <li>• <strong>Tier III: Full-Length Mocks</strong> — 65 questions, 100 marks, 180 minutes under strict GATE conditions.</li>
                    <li>• <strong>Calculators:</strong> In-portal official Virtual Scientific Calculator interface.</li>
                  </ul>
                </div>

                <div className="curriculum-col">
                  <h4 className="curriculum-heading">Post-Test Faculty Analytics</h4>
                  <ul className="curriculum-list">
                    <li>✓ Question-wise time spent vs. topper benchmark</li>
                    <li>✓ Negative marking audit (silly mistakes vs. conceptual gaps)</li>
                    <li>✓ Step-by-step verified video &amp; PDF solutions</li>
                    <li>✓ In-person faculty discussion at Raipur Center</li>
                  </ul>
                </div>
              </div>

              <div className="modal-pricing-box">
                <div className="modal-price-col">
                  <span className="modal-price-label">Test Series Enrollment</span>
                  <span className="modal-price-num">
                    ₹{Number(activeModalCourse.price).toLocaleString("en-IN")}
                  </span>
                  <span className="modal-price-sub">
                    Includes all topic tests, subject benchmarks & All-India full length mocks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyTestSeries(activeModalCourse)}
                  className="modal-buy-razorpay-btn"
                >
                  <span>Buy Now with Razorpay • ₹{Number(activeModalCourse.price).toLocaleString("en-IN")} &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal Integration */}
      <RazorpayCheckoutModal
        course={checkoutModalCourse}
        isOpen={checkoutModalOpen}
        isTestSeries={true}
        onClose={() => {
          setCheckoutModalOpen(false);
          setCheckoutModalCourse(null);
        }}
        onSuccess={() => {
          setCheckoutModalOpen(false);
          setCheckoutModalCourse(null);
          router.push("/test-series?purchased=1");
        }}
      />
    </section>
  );
}
