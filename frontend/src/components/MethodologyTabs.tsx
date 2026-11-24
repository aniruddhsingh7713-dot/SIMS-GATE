"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdvisor } from "@/context/AdvisorContext";
import {
  GraduationCap,
  BookOpen,
  Monitor,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
} from "lucide-react";

interface RoadmapStage {
  id: string;
  stageNumber: string;
  phaseName: string;
  timeline: string;
  headline: string;
  tagline: string;
  description: string;
  milestones: string[];
  keyDeliverable: string;
  icon: typeof GraduationCap;
}

const roadmapStages: RoadmapStage[] = [
  {
    id: "stage-1",
    stageNumber: "01",
    phaseName: "Foundation & Theory Phase",
    timeline: "Months 1 – 5",
    headline: "Derivations from Scratch. Zero Formula Memorization.",
    tagline: "Classroom Blackboard Concept Building",
    description:
      "GATE is an analytical exam that tests mathematical intuition, not memory. During the foundational phase at our Raipur center, our Ex-IITian faculty derives every core theorem, algorithm, and formula on the whiteboard from foundational principles. Even if your college basics are weak, you understand why each formula works before touching complex questions.",
    milestones: [
      "Zero prerequisite fear: comprehensive review of engineering mathematics & core basics",
      "Step-by-step whiteboard derivations for every single formula and theorem",
      "Daily classroom practice sheets solved under immediate teacher supervision",
      "Full 1080p studio recorded video backups provided for 24/7 unlimited revision",
    ],
    keyDeliverable: "100% Core Syllabus Covered with Hand-Written Lecture Notes",
    icon: GraduationCap,
  },
  {
    id: "stage-2",
    stageNumber: "02",
    phaseName: "Problem-Solving & PYQ Phase",
    timeline: "Months 6 – 8",
    headline: "15+ Years Chapter-wise GATE PYQ Drills.",
    tagline: "Over 1,500+ Official GATE Problems Solved",
    description:
      "Theory translates into marks only when you can dissect real GATE questions under timed conditions. In this phase, we solve 15+ years of official GATE question papers chapter-by-chapter in class. Students learn to spot examiner traps, master Multiple Select Questions (MSQs), and build calculation accuracy for Numerical Answer Types (NATs).",
    milestones: [
      "Physical printed chapter-wise PYQ workbooks provided to every classroom student",
      "Specialized MSQ elimination drills with zero-tolerance for trap options",
      "NAT numerical accuracy drills to eliminate rounding and precision errors",
      "Topic-wise historical weightage mapping so you focus on highest-yield subjects",
    ],
    keyDeliverable: "1,500+ Solved Official Questions Mastered Independently",
    icon: BookOpen,
  },
  {
    id: "stage-3",
    stageNumber: "03",
    phaseName: "Examination Simulation Phase",
    timeline: "Months 9 – 11",
    headline: "Exact TCS iON Exam Replica & Virtual Calculator Drills.",
    tagline: "Master Exam Temperament Before Exam Day",
    description:
      "Operating the virtual calculator under intense exam pressure is a crucial competitive edge. Our computer-based test series replicates the exact official GATE layout, color-coded question palette, section navigation, and keyboard constraints. Students build muscle memory so exam day feels like just another classroom mock test.",
    milestones: [
      "Exact replica of official GATE CBT layout, palette colors & question status",
      "Built-in official virtual calculator to build speed and keyboard shortcuts",
      "Real-time All-India percentile calculations and rank benchmark comparisons",
      "Detailed post-test diagnostic matrix identifying speed bottlenecks & silly mistakes",
    ],
    keyDeliverable: "15 Full-Length Mocks + 30 Subject-Level Diagnostic Tests",
    icon: Monitor,
  },
  {
    id: "stage-4",
    stageNumber: "04",
    phaseName: "Rank Maximization & Post-GATE",
    timeline: "Month 12 & Post-Exam",
    headline: "Daily 1-on-1 Faculty Cabin Hours & PSU/IIT Counseling.",
    tagline: "Direct Mentorship in Raipur Through Admission Day",
    description:
      "In the crucial final sprint, no doubt should linger. Our faculty members are available in their dedicated cabins at Choubey Colony every evening (3:30 PM – 7:30 PM) for 1-on-1 doubt clearing and personalized test copy audits. After results, we guide students through COAP, CCMT, IIT interview preparation, and PSU selection counseling.",
    milestones: [
      "Daily personal cabin doubt hours (Mon – Sat, 3:30 PM to 7:30 PM) in Raipur",
      "1-on-1 test copy audit to eliminate individual calculation and psychological errors",
      "Direct faculty WhatsApp access for immediate formula clarification during revision",
      "Complete post-GATE guidance for IIT M.Tech specializations, COAP, and PSU interviews",
    ],
    keyDeliverable: "Personalized Rank Roadmap + Complete IIT / PSU Admission Support",
    icon: Users,
  },
];

export default function MethodologyTabs() {
  const { openAdvisor } = useAdvisor();
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const currentStage = roadmapStages[activeStageIndex];
  const CurrentIcon = currentStage.icon;

  return (
    <section className="methodology-roadmap-section" id="approach" aria-label="Our 4-Stage Preparation Blueprint">
      <div className="section-container">
        
        {/* Editorial Section Masthead */}
        <div className="roadmap-masthead">
          <div className="roadmap-masthead-left">
            <div className="roadmap-kicker">
              <span className="kicker-tag">PREPARATION METHODOLOGY</span>
              <span className="kicker-sep">/</span>
              <span className="kicker-sub">4-STAGE SUCCESS BLUEPRINT</span>
              <span className="kicker-sep">/</span>
              <span className="kicker-campus">CHOUBEY COLONY CAMPUS</span>
            </div>

            <h2 className="roadmap-main-title">
              From Day 1 to Top 100 AIR.<br />
              <span className="roadmap-title-accent">A Proven 4-Stage Classroom Journey.</span>
            </h2>

            <p className="roadmap-main-desc">
              GATE preparation cannot be random. Our Ex-IITian faculty follows a structured, milestone-driven roadmap designed to take engineering students from foundational derivations to All-India top ranks in Raipur.
            </p>
          </div>

          <div className="roadmap-masthead-right">
            <Link href="#batches" className="roadmap-explore-link">
              <span>View Classroom Batches</span>
              <ChevronRight className="size-4 text-[#8C6D23]" />
            </Link>
          </div>
        </div>

        {/* 4-Stage Interactive Selector Track */}
        <div className="roadmap-stage-selector" role="tablist" aria-label="Roadmap Stages">
          {roadmapStages.map((stage, idx) => {
            const isActive = idx === activeStageIndex;
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveStageIndex(idx)}
                className={`roadmap-step-tab ${isActive ? "step-tab-active" : ""}`}
              >
                <div className="step-tab-header">
                  <span className="step-tab-number">STAGE {stage.stageNumber}</span>
                  <span className="step-tab-timeline">{stage.timeline}</span>
                </div>
                <div className="step-tab-content">
                  <div className="step-tab-icon-box">
                    <Icon className="size-4" />
                  </div>
                  <strong className="step-tab-name">{stage.phaseName}</strong>
                </div>
                {isActive && <div className="step-active-indicator" />}
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Spotlight Card */}
        <div className="roadmap-spotlight-card">
          <div className="spotlight-top-banner">
            <div className="spotlight-badge-group">
              <span className="spotlight-stage-badge">STAGE {currentStage.stageNumber}</span>
              <span className="spotlight-timeline-badge">
                <Clock className="size-3.5" />
                <span>{currentStage.timeline}</span>
              </span>
              <span className="spotlight-tagline-badge">{currentStage.tagline}</span>
            </div>

            <div className="spotlight-icon-box" aria-hidden="true">
              <CurrentIcon className="size-6 text-[#8C6D23]" />
            </div>
          </div>

          <div className="spotlight-body-grid">
            {/* Left: Narrative & Description */}
            <div className="spotlight-narrative-col">
              <h3 className="spotlight-headline">{currentStage.headline}</h3>
              <p className="spotlight-desc">{currentStage.description}</p>

              {/* Key Deliverable Box */}
              <div className="spotlight-deliverable-box">
                <Sparkles className="size-4 text-[#8C6D23] shrink-0 mt-0.5" />
                <div>
                  <span className="deliverable-label">Stage Milestone Deliverable:</span>
                  <strong className="deliverable-text">{currentStage.keyDeliverable}</strong>
                </div>
              </div>
            </div>

            {/* Right: Concrete Milestones Checklist */}
            <div className="spotlight-milestones-col">
              <h4 className="milestones-heading">What Students Master in This Stage:</h4>
              <ul className="milestones-list">
                {currentStage.milestones.map((m, mIdx) => (
                  <li key={mIdx} className="milestone-item">
                    <CheckCircle2 className="size-4 text-[#15803D] shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>

              <div className="spotlight-action-row">
                <button
                  type="button"
                  onClick={() =>
                    openAdvisor(
                      `Inquiry about ${currentStage.phaseName} (${currentStage.timeline})`,
                      `Roadmap Stage ${currentStage.stageNumber}`
                    )
                  }
                  className="spotlight-advisor-btn"
                >
                  <span>Talk to Faculty Advisor</span>
                  <ArrowRight className="size-4" />
                </button>
                <a
                  href="https://wa.me/918959774702?text=Hello%20SIMS%20GATE%2C%20I%20want%20to%20know%20more%20about%20the%204-Stage%20GATE%20Classroom%20Roadmap."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotlight-whatsapp-btn"
                >
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Raipur Offline Campus Bottom Note */}
        <div className="roadmap-campus-strip">
          <div className="campus-strip-icon">
            <Building2 className="size-5 text-[#8C6D23]" />
          </div>
          <div className="campus-strip-info">
            <strong className="campus-strip-title">Physical Classroom Batches at Choubey Colony, Raipur</strong>
            <p className="campus-strip-desc">
              All 4 stages are delivered live in our Raipur classrooms with Ex-IITian faculty. Every batch has a strict seat limit of 40 students to ensure daily eye contact and personal mentorship.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
