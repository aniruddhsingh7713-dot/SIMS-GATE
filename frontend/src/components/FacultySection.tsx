"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdvisor } from "@/context/AdvisorContext";
import DynamicBackground from "@/components/DynamicBackground";

export interface Faculty {
  id: number;
  name: string;
  designation: string;
  qualification: string;
  experience_years: number;
  specialization: string;
  bio: string;
  achievements: string;
  image_url: string;
  badge: string;
  order: number;
  is_active: boolean;
  created_at?: string;
}

interface FacultySectionProps {
  faculty: Faculty[];
}

export default function FacultySection({ faculty }: FacultySectionProps) {
  const { openAdvisor } = useAdvisor();
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [cardsVisible, setCardsVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const activeFaculty = faculty.filter((f) => f.is_active);

  // Scroll Triggered Intersection Observer for cinematic side entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const currentRef = gridRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const handleConsultFaculty = (f: Faculty) => {
    openAdvisor(
      `Faculty Academic Mentorship & Syllabus Query with ${f.name} (${f.designation})`,
      `${f.name} — ${f.designation}`
    );
  };

  // Generate dignified academic initials for monogram avatar
  const getInitials = (name: string) => {
    const clean = name.replace(/^(Dr\.|Prof\.|Er\.)\s*/i, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Safely check if image_url is a valid, renderable image URL (never required)
  const isValidImageUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (trimmed.length < 5) return false;
    if (/^(aaaa+|none|null|test|dummy|undefined)$/i.test(trimmed)) return false;
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
    try {
      const parsed = new URL(trimmed);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname.includes("example.com");
    } catch {
      return false;
    }
  };

  // Resolve image source: prioritize Django image_url, fallback to local portrait if Aniruddh, or null
  const getFacultyImageSrc = (member: Faculty): string | null => {
    if (isValidImageUrl(member.image_url)) {
      return member.image_url.trim();
    }
    if (member.name && member.name.toLowerCase().includes("aniruddh")) {
      return "/aniruddh-portrait.jpg";
    }
    return null;
  };

  return (
    <section className="faculty-editorial-section" id="faculty" aria-label="SIMS GATE Faculty Council">
      {/* Subtle Awwwards Ambient Dynamic Effect (Zero impact on visibility/readability) */}
      <DynamicBackground variant="light-blue" />

      <div className="section-container">
        {/* Section Masthead */}
        <div className="faculty-masthead">
          <div className="faculty-kicker-row">
            <span className="faculty-kicker-badge">ACADEMIC COUNCIL · PEDAGOGICAL MASTERY</span>
            <span className="faculty-kicker-line" aria-hidden="true" />
          </div>

          <div className="faculty-header-grid">
            <div className="faculty-header-left">
              <h2 className="faculty-title">
                Taught Exclusively by <span className="faculty-title-accent">IITians, IISc Scholars &amp; Ex-Scientists</span>
              </h2>
              <p className="faculty-subtitle">
                At SIMS GATE, no junior teaching assistants or rotating guest tutors take your core classes. Every subject is delivered from foundational axioms to high-rank numerical derivations by established subject directors.
              </p>
            </div>

            <div className="faculty-header-right">
              <div className="faculty-stat-dossier">
                <div className="stat-dossier-cell">
                  <span className="stat-dossier-num">12+</span>
                  <span className="stat-dossier-lbl">Avg. Teaching Yrs</span>
                </div>
                <div className="stat-dossier-divider" aria-hidden="true" />
                <div className="stat-dossier-cell">
                  <span className="stat-dossier-num">100%</span>
                  <span className="stat-dossier-lbl">IIT / IISc Pedigree</span>
                </div>
                <div className="stat-dossier-divider" aria-hidden="true" />
                <div className="stat-dossier-cell">
                  <span className="stat-dossier-num">1-on-1</span>
                  <span className="stat-dossier-lbl">Cabin Doubt Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Awwwards-Style Faculty Gallery Grid with Scroll-Triggered Side Animation */}
        <div className="faculty-awwwards-grid" ref={gridRef}>
          {activeFaculty.map((member, index) => {
            const specList = member.specialization
              ? member.specialization.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            const isFromLeft = index % 2 === 0;
            const facultyImgSrc = getFacultyImageSrc(member);

            return (
              <article
                key={member.id}
                className={`faculty-gallery-card scroll-side-card ${
                  cardsVisible ? "is-visible" : isFromLeft ? "from-screen-left" : "from-screen-right"
                }`}
                style={{ transitionDelay: `${index * 130}ms` }}
                onClick={() => setSelectedFaculty(member)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedFaculty(member);
                  }
                }}
              >
                {/* Left Side: Waist-Up Real Photo (No passport frame, bottom fadeout, seamless) OR Monogram Seal */}
                {facultyImgSrc ? (
                  <div className="fgc-photo-panel">
                    <img
                      src={facultyImgSrc}
                      alt={member.name}
                      className="fgc-hero-portrait-img"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== "/aniruddh-portrait.jpg") {
                          target.src = "/aniruddh-portrait.jpg";
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="fgc-monogram-panel" aria-hidden="true">
                    <div className="fgc-monogram-emblem">
                      <span className="fgc-monogram-initials">{getInitials(member.name)}</span>
                      <span className="fgc-monogram-tag">SIMS COUNCIL</span>
                    </div>
                  </div>
                )}

                {/* Right Side: Editorial Academic Details (Seamless white canvas, no dividing boundary) */}
                <div className="fgc-details-panel">
                  <div>
                    {/* 1. Header: Department Council & University Pedigree */}
                    <div className="fgc-header">
                      <span className="fgc-council-badge">
                        <span className="fgc-council-icon">🏛️</span>
                        SIMS ACADEMIC COUNCIL
                      </span>
                      <span className="fgc-pedigree-tag">
                        {member.badge || "IIT FACULTY"}
                      </span>
                    </div>

                    {/* 2. Visual Seal & Professor Identity */}
                    <div className="fgc-identity-block">
                      <div className="fgc-name-col">
                        <h3 className="fgc-name">{member.name}</h3>
                        <div className="fgc-role-row">
                          <span className="fgc-designation">{member.designation}</span>
                          {member.qualification && (
                            <>
                              <span className="fgc-role-bullet">•</span>
                              <span className="fgc-qualification">{member.qualification}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Natural Human Teaching Summary */}
                    <p className="fgc-human-desc">
                      {member.bio}
                    </p>

                    {/* 4. Core Modules Wrapping Tags */}
                    {specList.length > 0 && (
                      <div className="fgc-modules-block">
                        <span className="fgc-modules-label">CORE SPECIALIZATION MODULES</span>
                        <div className="fgc-modules-wrap">
                          {specList.map((tag, tIdx) => (
                            <span key={tIdx} className="fgc-module-chip">
                              <span className="fgc-chip-spark">✦</span>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Clean Experience & Interaction Action */}
                  <div className="fgc-action-bar">
                    <div className="fgc-experience-pill">
                      <span className="fgc-exp-dot" />
                      <span>{member.experience_years}+ Yrs Classroom</span>
                    </div>
                    <div className="fgc-action-cta">
                      <span className="fgc-action-text">Meet Faculty</span>
                      <span className="fgc-arrow-icon" aria-hidden="true">↗</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Academic Mentorship Banner */}
        <div className="faculty-pedagogy-promise-card">
          <div className="promise-card-left">
            <span className="promise-badge">THE SIMS PEDAGOGY COMMITMENT</span>
            <h3 className="promise-title">
              Direct In-Person Classroom Doubt Solving with Subject Leads
            </h3>
            <p className="promise-desc">
              Unlike generic corporate coaching platforms that outsource doubt queries to remote chatbots or unqualified evaluators, every student enrolled at SIMS Raipur has direct access to the faculty cabin after each classroom lecture.
            </p>
          </div>

          <div className="promise-card-right">
            <button
              type="button"
              onClick={() => openAdvisor("Meet SIMS GATE Faculty Council at Raipur Center")}
              className="btn-promise-advisor"
            >
              <span>Visit Raipur Center &amp; Meet Faculty ↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Craft Dossier Slide-Over Modal */}
      {selectedFaculty && (
        <div
          className="dossier-modal-backdrop"
          onClick={() => setSelectedFaculty(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-title"
        >
          <div
            className="dossier-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="dmp-top-bar">
              <div className="dmp-brand-seal">
                <span className="dmp-serial">ACADEMIC PROFILE</span>
                <span className="dmp-badge">{selectedFaculty.badge || "IIT FACULTY COUNCIL"}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="dmp-close-btn"
                aria-label="Close dossier modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Hero Profile */}
            <div className="dmp-hero-block">
              {getFacultyImageSrc(selectedFaculty) ? (
                <div className="dmp-photo-wrap">
                  <img
                    src={getFacultyImageSrc(selectedFaculty)!}
                    alt={selectedFaculty.name}
                    className="dmp-photo-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/aniruddh-portrait.jpg";
                    }}
                  />
                </div>
              ) : (
                <div className="dmp-seal-large">
                  <span className="dmp-initials">{getInitials(selectedFaculty.name)}</span>
                </div>
              )}
              <div className="dmp-hero-text">
                <h3 id="dossier-title" className="dmp-name">{selectedFaculty.name}</h3>
                <p className="dmp-designation">{selectedFaculty.designation}</p>
                <div className="dmp-meta-row">
                  <span className="dmp-qual-tag">{selectedFaculty.qualification}</span>
                  <span className="dmp-exp-tag">{selectedFaculty.experience_years}+ Years Pedagogy</span>
                </div>
              </div>
            </div>

            {/* Modal Content Sections */}
            <div className="dmp-scrollable-body">
              {/* Teaching Ethos & Bio */}
              <div className="dmp-section">
                <h4 className="dmp-section-title">PEDAGOGICAL OVERVIEW</h4>
                <p className="dmp-bio-text">{selectedFaculty.bio}</p>
              </div>

              {/* Specialization Domains */}
              {selectedFaculty.specialization && (
                <div className="dmp-section">
                  <h4 className="dmp-section-title">CORE CURRICULUM &amp; SPECIALIZATION MODULES</h4>
                  <div className="dmp-chips-wrap">
                    {selectedFaculty.specialization.split(",").map((spec, sIdx) => (
                      <span key={sIdx} className="dmp-spec-chip">
                        ✦ {spec.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements & Top Ranks */}
              {selectedFaculty.achievements && (
                <div className="dmp-section">
                  <h4 className="dmp-section-title">KEY MILESTONES &amp; AIR PRODUCED</h4>
                  <ul className="dmp-achievements-list">
                    {selectedFaculty.achievements.split("·").map((ach, aIdx) => (
                      <li key={aIdx} className="dmp-achievement-item">
                        <span className="dmp-bullet">✓</span>
                        <span>{ach.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* In-Person Raipur Cabin Guarantee */}
              <div className="dmp-cabin-card">
                <div className="dmp-cabin-left">
                  <span className="dmp-cabin-dot" />
                  <div>
                    <strong className="dmp-cabin-head">Raipur Center In-Person Cabin Doubt Desk</strong>
                    <p className="dmp-cabin-desc">Dedicated face-to-face problem solving after every lecture at Choubey Colony Center.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="dmp-footer">
              <button
                type="button"
                onClick={() => {
                  const f = selectedFaculty;
                  setSelectedFaculty(null);
                  handleConsultFaculty(f);
                }}
                className="dmp-btn-consult"
              >
                <span>Schedule Academic Consultation</span>
                <span className="dmp-btn-arrow">→</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="dmp-btn-back"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
