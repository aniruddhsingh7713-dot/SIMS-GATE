"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdvisor } from "@/context/AdvisorContext";

export interface Batch {
  id: number;
  name: string;
  code: string;
  branch: string;
  branch_display?: string;
  target_exam: string;
  batch_type: string;
  batch_type_display?: string;
  start_date: string;
  timings: string;
  days: string;
  venue: string;
  total_hours: string;
  syllabus_completion: string;
  seats_status: string;
  seats_remaining: number;
  fee: string | number;
  installment_info: string;
  order: number;
  is_active: boolean;
  created_at?: string;
}

interface BatchesSectionProps {
  batches: Batch[];
}

export default function BatchesSection({ batches }: BatchesSectionProps) {
  const { openAdvisor } = useAdvisor();
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [batchesVisible, setBatchesVisible] = useState(false);
  const batchesGridRef = useRef<HTMLDivElement>(null);

  const activeBatches = batches.filter((b) => b.is_active);

  // Scroll Triggered Intersection Observer for cinematic side entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBatchesVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const currentRef = batchesGridRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // Filter batches by selected branch or mode
  const filteredBatches = activeBatches.filter((b) => {
    if (selectedBranch === "ALL") return true;
    if (selectedBranch === "WKND") {
      return b.batch_type === "Weekend" || b.name.toLowerCase().includes("weekend");
    }
    return b.branch === selectedBranch;
  });

  const handleReserve = (batch: Batch) => {
    const branchName = batch.branch_display || batch.branch;
    const msg = `Hello SIMS GATE, I want to reserve a seat in the ${batch.name} (${branchName}) starting ${batch.start_date}. Please share the admission procedure and classroom schedule.`;
    const waUrl = `https://wa.me/918959774702?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleSyllabusRequest = (batch: Batch) => {
    openAdvisor(
      `Request Full Lecture Breakdown & Schedule Plan for ${batch.name} (${batch.branch})`,
      `${batch.name} — ${batch.branch}`
    );
  };

  return (
    <section className="batches-editorial-section" id="batches" aria-label="SIMS GATE Classroom Batches">
      <div className="section-container">
        {/* Section Masthead */}
        <div className="batches-masthead">
          <div className="batches-kicker-row">
            <span className="batches-kicker-badge">ACADEMIC YEAR 2027–2028 · ADMISSIONS DESK</span>
            <span className="batches-kicker-line" aria-hidden="true" />
          </div>

          <div className="batches-header-grid">
            <div className="batches-header-left">
              <h2 className="batches-title">
                Classroom <span className="batches-title-accent">Batches &amp; Cohorts</span>
              </h2>
              <p className="batches-subtitle">
                Rigorous, offline classroom programs at Choubey Colony, Raipur. Limited seats per batch with direct faculty mentorship, 15-year physical workbook library, and simulated CBT test series.
              </p>
            </div>

            <div className="batches-header-right">
              <div className="batches-intake-badge">
                <span className="intake-pulse-dot" />
                <div className="intake-text-wrap">
                  <strong className="intake-bold">Admissions Ongoing</strong>
                  <span className="intake-caption">Batch size strictly capped at 30</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Filter Tabs */}
          <div className="batches-nav-row">
            <span className="batches-nav-label">SELECT STREAM:</span>
            <div className="batches-tabs-cluster" role="tablist" aria-label="Filter Batches by Branch">
              <button
                type="button"
                role="tab"
                aria-selected={selectedBranch === "ALL"}
                onClick={() => setSelectedBranch("ALL")}
                className={`batch-tab-btn ${selectedBranch === "ALL" ? "batch-tab-active" : ""}`}
              >
                <span>All Disciplines</span>
                <span className="batch-tab-count">{activeBatches.length}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedBranch === "CS"}
                onClick={() => setSelectedBranch("CS")}
                className={`batch-tab-btn ${selectedBranch === "CS" ? "batch-tab-active" : ""}`}
              >
                <span>Computer Science &amp; IT</span>
                <span className="batch-tab-count">
                  {activeBatches.filter((b) => b.branch === "CS").length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedBranch === "DA"}
                onClick={() => setSelectedBranch("DA")}
                className={`batch-tab-btn ${selectedBranch === "DA" ? "batch-tab-active" : ""}`}
              >
                <span>Data Science &amp; AI</span>
                <span className="batch-tab-count">
                  {activeBatches.filter((b) => b.branch === "DA").length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedBranch === "WKND"}
                onClick={() => setSelectedBranch("WKND")}
                className={`batch-tab-btn ${selectedBranch === "WKND" ? "batch-tab-active" : ""}`}
              >
                <span>Weekend Executive</span>
                <span className="batch-tab-count">
                  {activeBatches.filter((b) => b.batch_type === "Weekend" || b.name.toLowerCase().includes("weekend")).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Batches Cards Grid with Scroll-Triggered Side Animation */}
        <div className="batches-cards-grid" ref={batchesGridRef}>
          {filteredBatches.length > 0 ? (
            filteredBatches.map((batch, index) => {
              const formattedFee = Number(batch.fee).toLocaleString("en-IN");
              const isFewSeats =
                batch.seats_status === "Few Seats Left" ||
                (typeof batch.seats_remaining === "number" && batch.seats_remaining <= 8);
              const isFromLeft = index % 2 === 0;

              return (
                <article
                  key={batch.id}
                  className={`batch-navy-card scroll-side-card ${
                    batchesVisible ? "is-visible" : isFromLeft ? "from-screen-left" : "from-screen-right"
                  }`}
                  style={{ transitionDelay: `${index * 140}ms` }}
                >
                  {/* Card Top: Official Emblem & Authentic Educational Status */}
                  <div className="bnc-top-bar">
                    <div className="bnc-brand-group">
                      <div className="bnc-emblem-wrap">
                        <Image
                          src="/sims-logo.png"
                          alt="SIMS Raipur Official Logo"
                          width={48}
                          height={48}
                          className="bnc-emblem-img object-contain"
                        />
                      </div>
                      <div className="bnc-cohort-meta">
                        <span className="bnc-stream-tag">{batch.branch_display || batch.branch}</span>
                        <span className="bnc-batch-type-pill">{batch.batch_type_display || batch.batch_type}</span>
                      </div>
                    </div>

                    <div className="bnc-badge-group">
                      <span className="bnc-exam-tag">{batch.target_exam || "GATE 2027/2028"}</span>
                      <div className={`bnc-seat-pill ${isFewSeats ? "seat-pill-urgent" : "seat-pill-open"}`}>
                        <span className="bnc-pulse-dot" />
                        <span>
                          {isFewSeats
                            ? `Only ${batch.seats_remaining || 8} Seats Left`
                            : batch.seats_status || "Admissions Open"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Title & Stream Pill */}
                  <div className="bnc-title-block">
                    <h3 className="bnc-title">{batch.name}</h3>
                    <div className="bnc-mode-row">
                      <span className="bnc-branch-badge">{batch.branch_display || batch.branch}</span>
                      <span className="bnc-dot-sep">·</span>
                      <span className="bnc-mode-text">
                        <svg className="bnc-mode-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {batch.venue || "Choubey Colony, Raipur"}
                      </span>
                    </div>
                  </div>

                  {/* Clean 3-Column Architectural Ledger */}
                  <div className="bnc-ledger-matrix">
                    <div className="bnc-ledger-metric">
                      <span className="bnc-ledger-sub">TIMINGS</span>
                      <strong className="bnc-ledger-main">{batch.timings}</strong>
                      <span className="bnc-ledger-dim">{batch.days}</span>
                    </div>

                    <div className="bnc-ledger-metric">
                      <span className="bnc-ledger-sub">CURRICULUM</span>
                      <strong className="bnc-ledger-main">{batch.total_hours}</strong>
                      <span className="bnc-ledger-dim">{batch.syllabus_completion}</span>
                    </div>

                    <div className="bnc-ledger-metric">
                      <span className="bnc-ledger-sub">COMMENCEMENT</span>
                      <strong className="bnc-ledger-main">{batch.start_date}</strong>
                      <span className="bnc-ledger-dim">Raipur Center</span>
                    </div>
                  </div>

                  {/* Refined Tuition & Action Bar */}
                  <div className="bnc-editorial-footer">
                    <div className="bnc-pricing-col">
                      <div className="bnc-price-line">
                        <span className="bnc-price-currency">₹</span>
                        <span className="bnc-price-amount">{formattedFee}</span>
                        <span className="bnc-price-tax">+ GST</span>
                      </div>
                      <span className="bnc-price-note">
                        {batch.installment_info || "Installment facility available"}
                      </span>
                    </div>

                    <div className="bnc-actions-cluster">
                      <button
                        type="button"
                        onClick={() => handleReserve(batch)}
                        className="bnc-btn-reserve"
                        title="Reserve Demo Seat via WhatsApp"
                      >
                        <span>Reserve Seat</span>
                        <span className="bnc-btn-arrow">→</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSyllabusRequest(batch)}
                        className="bnc-btn-syllabus-link"
                        title="Download syllabus breakdown"
                      >
                        <span>Syllabus PDF ↗</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="batches-empty-state">
              <p className="empty-text">No active batches found for this discipline filter.</p>
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className="btn-reset-filter"
              >
                View All Batches
              </button>
            </div>
          )}
        </div>

        {/* Assurance Trust Strip */}
        <div className="batches-assurance-strip">
          <div className="assurance-cell">
            <span className="assurance-icon">🏛️</span>
            <div className="assurance-text-col">
              <strong className="assurance-head">Choubey Colony Academic Center</strong>
              <span className="assurance-sub">3rd Floor, SBI Building · In-person classroom suites</span>
            </div>
          </div>

          <div className="assurance-divider" aria-hidden="true" />

          <div className="assurance-cell">
            <span className="assurance-icon">📚</span>
            <div className="assurance-text-col">
              <strong className="assurance-head">Complete Study Material Included</strong>
              <span className="assurance-sub">15-Year Solved Workbooks &amp; Classroom Lecture Notes</span>
            </div>
          </div>

          <div className="assurance-divider" aria-hidden="true" />

          <div className="assurance-cell">
            <span className="assurance-icon">🎯</span>
            <div className="assurance-text-col">
              <strong className="assurance-head">All-India CBT Test Series</strong>
              <span className="assurance-sub">Full syllabus benchmarks with rank analysis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
