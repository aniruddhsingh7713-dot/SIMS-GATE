import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import CourseCatalog from "@/components/CourseCatalog";
import MethodologyTabs from "@/components/MethodologyTabs";
import FaqSection from "@/components/FaqSection";
import AboutSection from "@/components/AboutSection";
import TestSeriesSection from "@/components/TestSeriesSection";
import BatchesSection, { type Batch } from "@/components/BatchesSection";
import FacultySection, { type Faculty } from "@/components/FacultySection";
import TypewriterHeader from "@/components/TypewriterHeader";
import DynamicBackground from "@/components/DynamicBackground";
import StudentHeroBanner from "@/components/StudentHeroBanner";
import HeroFallingLeaves from "@/components/HeroFallingLeaves";
import GateCountdownPill from "@/components/GateCountdownPill";
import HeroBranchPills from "@/components/HeroBranchPills";
import DailyPyqCard from "@/components/DailyPyqCard";
import BackToTopPill from "@/components/BackToTopPill";
import HomeLoadingSkeleton from "@/components/HomeLoadingSkeleton";
import {
  HeroAdvisorButton,
  FloatingAdvisorButton,
  FooterAdvisorButton,
  AnnouncementHelplineButton,
} from "@/components/AdvisorTriggers";
import { GraduationCap, BookOpen, Users, Building2, MapPin, Phone } from "lucide-react";
import type { Course } from "@/components/CourseCard";

async function getCourses(search: string): Promise<Course[]> {
  try {
    const url = new URL("http://127.0.0.1:8000/api/courses/");
    if (search) url.searchParams.set("search", search);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) return [];

    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? data.value ?? [];
    return list.filter((course: Course) => course.is_active);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

async function getFaculty(): Promise<Faculty[]> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/faculty/", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.filter((f: Faculty) => f.is_active);
  } catch (error) {
    console.error("Failed to fetch faculty:", error);
    return [];
  }
}

async function getBatches(): Promise<Batch[]> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/batches/", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.filter((b: Batch) => b.is_active);
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return [];
  }
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  return (
    <Suspense fallback={<HomeLoadingSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = (params.search ?? "").trim();
  const [courses, faculty, batches] = await Promise.all([
    getCourses(search),
    getFaculty(),
    getBatches(),
  ]);
  const allCourses = search ? await getCourses("") : courses;

  return (
    <div className="platform-layout">

      {/* 1. Slim Dark Navy Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <div className="announcement-left justify-center sm:justify-start">
            <svg className="announcement-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>3rd Floor, SBI Bldg, Choubey Colony, Raipur</span>
          </div>

          <div className="announcement-center">
            <span>SIMS GATE Raipur • Official Classroom &amp; Online Batches for GATE 2027–2028</span>
          </div>

          <div className="hidden sm:inline-flex announcement-right">
            <svg className="announcement-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <AnnouncementHelplineButton />
          </div>
        </div>
      </div>

      {/* 2. Professional White Navbar */}
      <Navbar />

      {/* 3. Spacious Editorial Hero Section (Crisp Modern White Background) */}
      <section className="hero-editorial-section" aria-label="SIMS GATE Admissions">
        {/* ACTUAL OFFICIAL SIMS LOGO IN BACKGROUND (Smooth Breathing Fade-out to left with uneven boundary) */}
        <div className="hero-sims-bg-logo-wrap" aria-hidden="true">
          <Image
            src="/sims-logo.png"
            alt="SIMS GATE Official Logo with Tree and Raipur Emblem"
            width={540}
            height={540}
            priority
            className="hero-sims-bg-logo-img"
          />
          <HeroFallingLeaves />
        </div>

        <div className="section-container relative z-10">
          <StudentHeroBanner />

          <div className="hero-editorial-wrap">
            {/* Left Column: Headline, Description, CTAs & Micro Trust */}
            <div className="hero-copy-col">
              {/* Live Official GATE 2027 Countdown Badge (Zero-lag pure client diff) */}
              <div className="mb-3">
                <GateCountdownPill />
              </div>

              {/* NATURAL ACADEMIC KICKER (Letter-spaced institutional kicker) */}
              <div className="academic-kicker">
                <span className="kicker-tag">SIMS GATE RAIPUR</span>
                <span className="kicker-sep">/</span>
                <span className="kicker-subtitle">ACADEMIC SESSION 2027–2028</span>
                <span className="kicker-sep">/</span>
                <span className="kicker-loc">CHOUBEY COLONY CAMPUS</span>
              </div>

              <h1 className="hero-main-title">
                Comprehensive <span className="hero-gold-accent">GATE Coaching</span><br />
                for Ambitious Engineers in Raipur
              </h1>

              <p className="hero-lead-description">
                First-principles derivations, 15+ years solved PYQ archive, and direct daily faculty cabin mentorship by Ex-IITians. Built for engineering undergraduates aiming for premier IIT / IISc admissions and top PSU selections.
              </p>

              <div className="hero-cta-group">
                <a href="#courses" className="btn-hero-primary">
                  <span>Explore Classroom Batches</span>
                  <span className="cta-arrow-right">→</span>
                </a>
                <HeroAdvisorButton />
              </div>

              {/* Fast Discipline Navigation Pills */}
              <HeroBranchPills />

              {/* Micro Trust Checkmarks */}
              <div className="hero-micro-trust">
                <div className="micro-trust-item">
                  <span className="trust-check">✔</span>
                  <span>Ex-IITian Faculty Council</span>
                </div>
                <span className="trust-dot">•</span>
                <div className="micro-trust-item">
                  <span className="trust-check">✔</span>
                  <span>15+ Years Solved PYQs</span>
                </div>
                <span className="trust-dot">•</span>
                <div className="micro-trust-item">
                  <span className="trust-check">✔</span>
                  <span>Choubey Colony Offline Campus</span>
                </div>
              </div>
            </div>

            {/* 4. ACADEMIC EXCELLENCE PILLARS (Clean SVG Vector Badges) */}
            <div className="pillars-dock-wrap">
              <div className="pillars-dock">
                <div className="pillar-card">
                  <div className="pillar-icon-box" aria-hidden="true">
                    <GraduationCap className="size-5 text-[#8C6D23]" />
                  </div>
                  <div className="pillar-info">
                    <strong className="pillar-title">Ex-IITian Mentorship</strong>
                    <span className="pillar-desc">Daily 1-on-1 In-Person Cabin Sessions in Raipur</span>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box" aria-hidden="true">
                    <BookOpen className="size-5 text-[#8C6D23]" />
                  </div>
                  <div className="pillar-info">
                    <strong className="pillar-title">15+ Yrs Solved PYQs</strong>
                    <span className="pillar-desc">1,500+ Solved Questions with Complete Derivations</span>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box" aria-hidden="true">
                    <Users className="size-5 text-[#8C6D23]" />
                  </div>
                  <div className="pillar-info">
                    <strong className="pillar-title">Max 40 Per Batch</strong>
                    <span className="pillar-desc">Direct Faculty Focus, Small Classroom Cohorts</span>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box" aria-hidden="true">
                    <Building2 className="size-5 text-[#8C6D23]" />
                  </div>
                  <div className="pillar-info">
                    <strong className="pillar-title">Raipur Offline Center</strong>
                    <span className="pillar-desc">3rd Floor, SBI Bldg, Choubey Colony Campus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Course Navigation Sub-Strip */}
      <section className="course-subnav-section" aria-label="Course Streams Sub-navigation">
        <div className="section-container">
          <div className="course-subnav-bar">
            <div className="subnav-tabs-group">
              <Link href="/#courses" className="subnav-tab subnav-tab-active">
                GATE 2027 Courses
              </Link>
              <Link href="/#batches" className="subnav-tab">
                Classroom Batches
              </Link>
              <Link href="/#test-series" className="subnav-tab">
                Test Series
              </Link>
              <Link href="/#faculty" className="subnav-tab">
                Faculty Council
              </Link>
              <Link href="/#approach" className="subnav-tab">
                Our Approach
              </Link>
            </div>
            <a href="#batches" className="subnav-view-all">
              <span>View All Batches</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. Main Course Discovery Workspace */}
      <main className="course-discovery-section" id="courses">
        <div className="section-container">
          {/* Breadcrumbs */}
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-item">Home</Link>
            <span className="breadcrumb-separator">→</span>
            <span className="breadcrumb-item">GATE</span>
            <span className="breadcrumb-separator">→</span>
            <span className="breadcrumb-active">Online Coaching</span>
          </nav>

          {/* Section A: Spacious Page Heading with Aligned Navigation Tabs */}
          <div className="discovery-editorial-header">
            <div className="discovery-header-left">
              <div className="discovery-kicker-row">
                <span className="discovery-kicker-text">GATE PROGRAMS &amp; BATCHES</span>
                <span className="discovery-kicker-line" aria-hidden="true" />
              </div>
              <h2 className="discovery-serif-title">
                GATE Online Coaching{" "}
                <span className="discovery-header-typewriter-wrap">
                  <TypewriterHeader
                    prefix="· "
                    words={[
                      "Computer Science",
                      "Data Science & AI",
                      "Civil Engineering",
                      "Mechanical",
                      "Electronics",
                      "Electrical",
                    ]}
                    className="discovery-header-typewriter"
                  />
                </span>
              </h2>
              <p className="discovery-tagline">
                Structured learning. Expert guidance. Real progress.
              </p>
            </div>
          </div>

          {/* Interactive Course Catalog Component */}
          <CourseCatalog
            key={search}
            initialCourses={courses}
            initialSearch={search}
          />
        </div>
      </main>

      {/* 6. Dedicated Batches & Academic Schedule (Raipur Classroom & Live Online) */}
      <BatchesSection batches={batches} />

      {/* Daily High-Yield GATE PYQ Challenge (Zero network latency, interactive client solve) */}
      <DailyPyqCard />

      {/* 7. Dedicated Test Series & Examination Rigour Section */}
      <TestSeriesSection courses={allCourses} />

      {/* 8. Dedicated Faculty Council & Pedagogical Mastery */}
      <FacultySection faculty={faculty} />

      {/* 9. Interactive Teaching Methodology Section */}
      <MethodologyTabs />

      {/* 10. Interactive Frequently Asked Questions (FAQ) Section */}
      <FaqSection />

      {/* 11. About SIMS GATE Section */}
      <AboutSection />

      {/* 12. Structured Academic Footer */}
      <footer className="site-footer" id="contact">
        <div className="section-container">
          
          {/* Top Institutional Credo Banner */}
          <div className="footer-credo-banner">
            <div className="fcb-left">
              <span className="fcb-badge">ACADEMIC PHILOSOPHY</span>
              <span className="fcb-text">Axiomatic First-Principles Derivations • Ex-IITian Faculty Council • Choubey Colony, Raipur</span>
            </div>
            <div className="fcb-right">
              <span className="fcb-helpline-label">Admissions &amp; Cabin Support:</span>
              <a href="tel:+918959774702" className="fcb-phone">+91 89597 74702</a>
            </div>
          </div>

          {/* Main 4-Column Structured Architecture Grid */}
          <div className="footer-top-grid">
            {/* Col 1: Brand & Academic Mission (32%) */}
            <div className="footer-brand-col">
              <Link href="/" className="footer-brand-link flex items-center gap-3.5 group">
                <div className="footer-logo-wrap shrink-0">
                  <Image
                    src="/sims-logo.png"
                    alt="SIMS Raipur Official Logo"
                    width={52}
                    height={52}
                    className="footer-logo-img object-contain transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="brand-masthead">
                  <div className="brand-v-divider" />
                  <div className="brand-stacked-text">
                    <span className="brand-gate-title text-white">GATE</span>
                    <span className="brand-sub-tag text-slate-400">Raipur Campus · Premier Institute</span>
                  </div>
                </div>
              </Link>
              <p className="footer-bio">
                Premier engineering and sciences coaching institute in Raipur, founded by Ex-IITians. We deliver uncompromising academic rigor through first-principles proofs, 15+ years of solved PYQ archives, and direct daily faculty cabin mentorship.
              </p>
              <div className="footer-trust-chips">
                <span className="footer-chip">📍 Choubey Colony Offline Center</span>
                <span className="footer-chip">🎯 Max 40 Students Per Batch</span>
              </div>
            </div>

            {/* Col 2: Programs & Streams (22%) */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Programs &amp; Streams</h4>
              <ul className="footer-nav-list">
                <li><Link href="/#courses">Computer Science &amp; IT (CSE)</Link></li>
                <li><Link href="/#courses">Data Science &amp; AI (DA)</Link></li>
                <li><Link href="/#courses">Civil Engineering (CE)</Link></li>
                <li><Link href="/#courses">Chemical Engineering (CH)</Link></li>
                <li><Link href="/#courses">Mechanical Engineering (ME)</Link></li>
                <li><Link href="/#courses">Electrical &amp; Electronics (EE/ECE)</Link></li>
                <li><Link href="/#test-series">All-India CBT Test Series</Link></li>
              </ul>
            </div>

            {/* Col 3: Academic Navigation (22%) */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Institute &amp; Academics</h4>
              <ul className="footer-nav-list">
                <li><Link href="/#about">About SIMS GATE</Link></li>
                <li><Link href="/#faculty">Ex-IITian Faculty Council</Link></li>
                <li><Link href="/#batches">Classroom Batches 2027–28</Link></li>
                <li><Link href="/#approach">Pedagogy &amp; First Principles</Link></li>
                <li><Link href="/#test-series">15+ Years Solved PYQs</Link></li>
                <li><Link href="/#faq">Frequently Asked Questions</Link></li>
                <li><Link href="/dashboard">Student Learning Portal</Link></li>
              </ul>
            </div>

            {/* Col 4: Raipur Center & Admissions Desk (24%) */}
            <div className="footer-contact-col">
              <h4 className="footer-heading">Raipur Center</h4>
              <div className="footer-campus-card">
                <div className="fcc-address-row">
                  <span className="fcc-pin">📍</span>
                  <div>
                    <strong className="fcc-name">Choubey Colony Offline Campus</strong>
                    <p className="fcc-detail">
                      3rd Floor, SBI Building, Main Road Choubey Colony, Samta, Raipur, C.G. – 492001
                    </p>
                  </div>
                </div>

                <div className="fcc-info-row">
                  <span className="fcc-label">Admissions Helpline:</span>
                  <a href="tel:+918959774702" className="fcc-value">+91 89597 74702</a>
                </div>

                <div className="fcc-info-row">
                  <span className="fcc-label">Office Hours:</span>
                  <span className="fcc-value">Mon – Sat • 9:00 AM – 8:00 PM</span>
                </div>

                <div className="footer-whatsapp-action">
                  <FooterAdvisorButton />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Institutional Credo */}
          <div className="footer-bottom-bar">
            <span>© 2027 SIMS GATE Raipur. All rights reserved.</span>
            <span className="footer-credo">“YOUR JOURNEY. OUR GUIDANCE.” • EX-IITIAN FACULTY COUNCIL · PROVEN RIGOR</span>
          </div>
        </div>
      </footer>

      {/* Floating Back-to-Top Button (Instant GPU scroll, zero lag) */}
      <BackToTopPill />

      {/* Floating Interactive Advisor Action */}
      <FloatingAdvisorButton />
    </div>
  );
}
