"use client";

import React from "react";
import { useAdvisor } from "@/context/AdvisorContext";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Monitor,
  Building2,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";

interface HumanPillar {
  tag: string;
  badge: string;
  title: string;
  subtitle: string;
  desc: string;
  highlights: string[];
  icon: typeof GraduationCap;
}

const humanPillars: HumanPillar[] = [
  {
    tag: "Teaching Methodology",
    badge: "Classroom Blackboard Teaching",
    title: "Concept-First Classroom Teaching",
    subtitle: "No formula cramming · Complete derivations from scratch",
    desc: "GATE cannot be cracked by memorizing formula sheets. In our Raipur classroom batches, faculty derives every single theorem, formula, and algorithm on the board with full mathematical intuition. Even if your college foundation is weak, you will understand exactly why each formula works before solving exam problems.",
    highlights: [
      "Zero prerequisite fear: foundational basics refreshed before advanced syllabus",
      "Step-by-step whiteboard derivations so you see the underlying logic unfold",
      "Daily classroom practice questions solved under direct teacher guidance",
    ],
    icon: GraduationCap,
  },
  {
    tag: "Question Bank & Practice",
    badge: "15+ Yrs Printed Workbooks",
    title: "15+ Years Chapter-wise GATE PYQ Practice",
    subtitle: "Over 1,500+ official GATE questions solved in class",
    desc: "Theory is only complete when you can solve real GATE problems independently. We solve 15+ years of official GATE question papers topic-by-topic in class. You will learn to recognize trap options, master Multiple Select Questions (MSQs), and build calculation accuracy for Numerical Answer Types (NATs).",
    highlights: [
      "Printed chapter-wise PYQ workbooks provided to every classroom student",
      "Special MSQ & NAT accuracy drills to eliminate calculation and rounding errors",
      "Early identification of recurring examiner traps and negative marking pitfalls",
    ],
    icon: BookOpen,
  },
  {
    tag: "Personal Doubts & Mentorship",
    badge: "Choubey Colony Campus",
    title: "Daily 1-on-1 Faculty Cabin Sessions",
    subtitle: "Sit directly with your teachers every evening in Raipur",
    desc: "Unlike mass online platforms where doubts are handled by chatbots or teaching assistants, SIMS gives you direct personal access to your teachers. Our Ex-IITian faculty members are available in their dedicated cabins at Choubey Colony every evening. Any student can walk in and sit 1-on-1 to clear their doubts.",
    highlights: [
      "Daily Cabin Hours: Monday to Saturday • 3:30 PM to 7:30 PM in Choubey Colony",
      "Personal test copy checking and customized mistake-analysis roadmap",
      "Direct faculty WhatsApp access for immediate guidance during self-study",
    ],
    icon: Users,
  },
  {
    tag: "Examination Simulation",
    badge: "Official TCS iON Replica",
    title: "Real GATE-Pattern CBT Test Series",
    subtitle: "Mirrors the exact official exam screen & virtual calculator",
    desc: "Operating the virtual calculator under timed exam pressure is a crucial skill. Our computer-based test series replicates the exact official GATE layout, color-coded question palette, and keyboard constraints, helping you eliminate exam fear and master time management well before the actual test day.",
    highlights: [
      "Exact replica of official GATE CBT interface and section navigation",
      "Built-in official virtual calculator to build muscle memory before exam day",
      "All-India rank benchmarking, topic-level weak area analysis & detailed solutions",
    ],
    icon: Monitor,
  },
];

export default function AboutSection() {
  const { openAdvisor } = useAdvisor();

  return (
    <section className="about-natural-section" id="about" aria-label="About SIMS GATE">
      <div className="section-container">
        
        {/* 1. Natural Editorial Header */}
        <div className="about-natural-masthead">
          <div className="about-natural-left">
            <div className="about-natural-kicker">
              <span className="kicker-tag">SIMS GATE RAIPUR</span>
              <span className="kicker-sep">/</span>
              <span className="kicker-sub">HOW WE TEACH</span>
              <span className="kicker-sep">/</span>
              <span className="kicker-campus">CHOUBEY COLONY CAMPUS</span>
            </div>

            <h2 className="about-natural-title">
              Built on Concept Clarity.<br />
              <span className="about-natural-title-accent">Not Rote Formula Memorization.</span>
            </h2>

            <p className="about-natural-desc">
              Formula ratne se GATE crack nahi hota. Founded by Ex-IITians at Choubey Colony, Raipur, our classroom teaching focuses on whiteboard derivations, 15+ years of chapter-wise solved PYQs, and direct daily 1-on-1 doubt clearing in faculty cabins.
            </p>
          </div>

          {/* Right Column: Grounded Human Metrics Matrix */}
          <div className="about-natural-metrics">
            <div className="natural-metric-card">
              <strong className="natural-metric-number">15+ Years</strong>
              <span className="natural-metric-title">Solved GATE PYQs</span>
              <p className="natural-metric-desc">Printed chapter-wise workbooks with full solutions given to all students.</p>
            </div>

            <div className="natural-metric-card">
              <strong className="natural-metric-number">1-on-1</strong>
              <span className="natural-metric-title">Daily Cabin Doubts</span>
              <p className="natural-metric-desc">Mon – Sat, 3:30 PM to 7:30 PM in faculty cabins at Choubey Colony.</p>
            </div>

            <div className="natural-metric-card">
              <strong className="natural-metric-number">Max 40</strong>
              <span className="natural-metric-title">Students Per Batch</span>
              <p className="natural-metric-desc">Small batch sizes so every student gets personal teacher attention.</p>
            </div>

            <div className="natural-metric-card">
              <strong className="natural-metric-number">Ex-IITians</strong>
              <span className="natural-metric-title">Faculty Council</span>
              <p className="natural-metric-desc">Taught by educators who have cracked GATE and mentored top-100 rankers.</p>
            </div>
          </div>
        </div>

        {/* 2. 4 Clean, Natural Human Cards (2x2 Grid) */}
        <div className="about-natural-cards-grid">
          {humanPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <article key={idx} className="natural-pillar-card">
                {/* Card Top: Tag + Badge */}
                <div className="pillar-card-top">
                  <div className="pillar-tag-group">
                    <div className="pillar-icon-box">
                      <Icon className="size-5 text-[#8C6D23]" />
                    </div>
                    <div>
                      <span className="pillar-tag-text">{p.tag}</span>
                    </div>
                  </div>
                  <span className="pillar-badge-pill">{p.badge}</span>
                </div>

                {/* Title & Subtitle */}
                <div className="pillar-title-block">
                  <h3 className="pillar-card-title">{p.title}</h3>
                  <p className="pillar-card-subtitle">{p.subtitle}</p>
                </div>

                {/* Practical Description */}
                <p className="pillar-card-desc">{p.desc}</p>

                {/* Human Highlights Checklist */}
                <div className="pillar-checklist-box">
                  <span className="pillar-checklist-label">Key Student Benefits:</span>
                  <ul className="pillar-checklist-list">
                    {p.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="pillar-checklist-item">
                        <CheckCircle2 className="size-4 text-[#0F4336] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        {/* 3. Authentic Raipur Campus Footer Strip */}
        <div className="about-natural-footer-strip">
          <div className="strip-left">
            <div className="strip-pin-box">
              <Building2 className="size-5 text-[#8C6D23]" />
            </div>
            <div>
              <strong className="strip-campus-name">SIMS GATE Raipur Offline Campus</strong>
              <p className="strip-campus-address">
                3rd Floor, SBI Building, Main Road Choubey Colony, Samta, Raipur, C.G. – 492001
              </p>
            </div>
          </div>

          <div className="strip-actions">
            <button
              type="button"
              onClick={() => openAdvisor("Inquiry about Classroom Batches & Methodology")}
              className="strip-btn-primary"
            >
              <span>Talk to Faculty Advisor</span>
              <ArrowUpRight className="size-4" />
            </button>
            <a
              href="https://wa.me/918959774702?text=Hello%20SIMS%20GATE%20Raipur%2C%20I%20want%20to%20know%20more%20about%20classroom%20batches."
              target="_blank"
              rel="noopener noreferrer"
              className="strip-btn-whatsapp"
            >
              <span>Chat on WhatsApp: +91 89597 74702</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
