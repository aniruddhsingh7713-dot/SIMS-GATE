"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldAlert, PhoneCall } from "lucide-react";

/* --------------------------------------------------------------------------
   Dynamic Sad Smiley Face (Blinking Eyes + Downturned Mouth)
   Rendered in SIMS Royal Gold (#C5A059) and Navy (#0B192C)
   -------------------------------------------------------------------------- */
function DynamicSadSmiley() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 220);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto size-20 sm:size-22 rounded-3xl bg-[#0B192C] border-2 border-[#C5A059]/40 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
      <svg
        className="size-11 sm:size-12 text-[#C5A059] transition-all duration-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />

        {/* Dynamic Blinking Eyes */}
        {isBlinking ? (
          <>
            <line x1="8" y1="9.5" x2="10.5" y2="9.5" strokeWidth="2.2" />
            <line x1="13.5" y1="9.5" x2="16" y2="9.5" strokeWidth="2.2" />
          </>
        ) : (
          <>
            <circle cx="9.25" cy="9.25" r="1.3" fill="currentColor" />
            <circle cx="14.75" cy="9.25" r="1.3" fill="currentColor" />
          </>
        )}

        {/* Dynamic Downturned Sad Mouth Curve */}
        <path d="M16 16.2c-1.1-1.8-2.6-2.5-4-2.5s-2.9 0.7-4 2.5" />
      </svg>

      {/* Solid Gold Lock Emblem */}
      <span className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-[#15271E] border-2 border-[#C5A059] text-[#C5A059] shadow-md flex items-center justify-center">
        <Lock className="size-4 stroke-[2.5]" />
      </span>
    </div>
  );
}

export interface AcademicLockedOverlayProps {
  isLocked?: boolean;
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AcademicLockedOverlay({
  isLocked = true,
  children,
  title = "No Active Course Enrollment",
  description = "You do not have any enrolled courses in your account. Please purchase or enroll in an approved course to unlock your classroom timetable, live interactive lectures, faculty doubt cabins, and study notes.",
}: AcademicLockedOverlayProps) {
  const [showFormalModal, setShowFormalModal] = useState(false);

  // If not locked, render clean children without any blur
  if (!isLocked && children) {
    return <>{children}</>;
  }

  // Core Lock Card
  const LockCard = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setShowFormalModal(true);
      }}
      className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 p-7 sm:p-9 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Dynamic Sad Smiley Face */}
      <DynamicSadSmiley />

      {/* Institutional Dignified Message */}
      <div className="space-y-2">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {/* Action: Formal Link to Courses & Dedicated Test Series Portal */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/courses"
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#152E4D] !text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
          style={{ color: "#FFFFFF", backgroundColor: "#0B192C" }}
        >
          <span className="!text-white font-bold" style={{ color: "#FFFFFF" }}>Browse Courses</span>
          <ArrowRight className="size-4 text-[#C5A059]" style={{ color: "#C5A059" }} />
        </Link>

        <Link
          href="/test-series"
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-sm font-bold shadow-2xs transition-all cursor-pointer"
        >
          <span>Test Series Portal</span>
          <ArrowRight className="size-3.5 text-amber-700" />
        </Link>
      </div>
    </div>
  );

  // If wrapping children, apply background blur
  if (children) {
    return (
      <div className="relative min-h-[520px] w-full overflow-hidden rounded-2xl">
        {/* 1. Blurred Background Content */}
        <div
          className="filter blur-[9px] opacity-45 pointer-events-none select-none transition-all duration-300"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* 2. Interactive Lock Overlay */}
        <div
          onClick={() => setShowFormalModal(true)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-[2px] cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Locked academic content. Click to view enrollment requirements."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShowFormalModal(true);
          }}
        >
          {LockCard}
        </div>

        {/* 3. Formal Explanatory Modal */}
        {showFormalModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowFormalModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="size-4" />
                  </span>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Enrollment Required
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormalModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer leading-none"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This classroom section is strictly restricted to enrolled SIMS scholars. Upon purchasing or enrolling in an approved GATE batch, your official batch code, daily schedule, interactive studio stream, and full study library will be unlocked automatically.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <PhoneCall className="size-3.5 text-[#C5A059]" />
                  <span>Admissions &amp; Academic Help Desk</span>
                </div>
                <p className="text-slate-500">
                  Choubey Colony Center, Raipur · Helpline: +91 98261 00000
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold !text-white bg-[#0B192C] hover:bg-[#152E4D] rounded-xl shadow-xs transition cursor-pointer"
                  style={{ color: "#FFFFFF", backgroundColor: "#0B192C" }}
                >
                  <span className="!text-white font-bold" style={{ color: "#FFFFFF" }}>View Courses</span>
                  <ArrowRight className="size-3.5 text-[#C5A059]" style={{ color: "#C5A059" }} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standalone Lock Card without children wrapper
  return (
    <div className="py-8 flex items-center justify-center">
      {LockCard}

      {showFormalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowFormalModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="size-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Enrollment Required
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This classroom section is strictly restricted to enrolled SIMS scholars. Upon purchasing or enrolling in an approved GATE batch, your official batch code, daily schedule, interactive studio stream, and full study library will be unlocked automatically.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <PhoneCall className="size-3.5 text-[#C5A059]" />
                <span>Admissions &amp; Academic Help Desk</span>
              </div>
              <p className="text-slate-500">
                Choubey Colony Center, Raipur · Helpline: +91 98261 00000
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowFormalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold !text-white bg-[#0B192C] hover:bg-[#152E4D] rounded-xl shadow-xs transition cursor-pointer"
                style={{ color: "#FFFFFF", backgroundColor: "#0B192C" }}
              >
                <span className="!text-white font-bold" style={{ color: "#FFFFFF" }}>View Courses</span>
                <ArrowRight className="size-3.5 text-[#C5A059]" style={{ color: "#C5A059" }} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AcademicLockedOverlay as CourseAccessLock };


