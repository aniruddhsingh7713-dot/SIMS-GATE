"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdvisor } from "@/context/AdvisorContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { openAdvisor } = useAdvisor();
  const { user, isAuthenticated, isLoading, openAuthModal, logoutUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [signInDropdownOpen, setSignInDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const coursesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signInTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCoursesMouseEnter = () => {
    if (coursesTimerRef.current) {
      clearTimeout(coursesTimerRef.current);
      coursesTimerRef.current = null;
    }
    setCoursesDropdownOpen(true);
  };

  const handleCoursesMouseLeave = () => {
    coursesTimerRef.current = setTimeout(() => {
      setCoursesDropdownOpen(false);
    }, 200);
  };

  const handleSignInMouseEnter = () => {
    if (signInTimerRef.current) {
      clearTimeout(signInTimerRef.current);
      signInTimerRef.current = null;
    }
    setSignInDropdownOpen(true);
  };

  const handleSignInMouseLeave = () => {
    signInTimerRef.current = setTimeout(() => {
      setSignInDropdownOpen(false);
    }, 200);
  };

  const handleUserMouseEnter = () => {
    if (userTimerRef.current) {
      clearTimeout(userTimerRef.current);
      userTimerRef.current = null;
    }
    setUserDropdownOpen(true);
  };

  const handleUserMouseLeave = () => {
    userTimerRef.current = setTimeout(() => {
      setUserDropdownOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const authQueryProcessedRef = useRef(false);

  // Auto-open auth modal once if redirected with ?auth=login or ?auth=signup, then clean URL
  useEffect(() => {
    if (typeof window !== "undefined" && !authQueryProcessedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const authQuery = params.get("auth");
      if (authQuery === "login" || authQuery === "signup") {
        authQueryProcessedRef.current = true;
        openAuthModal(authQuery);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("auth");
          const cleanUrl = url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
          window.history.replaceState({}, "", cleanUrl);
        } catch (e) {
          console.warn("Failed to clean auth param:", e);
        }
      }
    }
  }, [openAuthModal]);

  // Close menus on Escape key & Click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCoursesDropdownOpen(false);
        setUserDropdownOpen(false);
        setSignInDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-dropdown-wrapper")) {
        setCoursesDropdownOpen(false);
      }
      if (!target.closest(".nav-user-menu-wrap")) {
        setUserDropdownOpen(false);
      }
      if (!target.closest(".nav-signin-menu-wrap")) {
        setSignInDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
      if (coursesTimerRef.current) clearTimeout(coursesTimerRef.current);
      if (userTimerRef.current) clearTimeout(userTimerRef.current);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setCoursesDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  const userInitial = (
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    "S"
  ).toUpperCase();

  const userRoleDisplay = user?.is_superuser
    ? "Admin"
    : user?.role === "teacher"
    ? "Faculty"
    : "Student";

  return (
    <>
      <header className={`site-header ${isScrolled ? "site-header-elevated" : ""}`}>
        <div className="header-container">
        {/* Brand / Logo (Left) */}
        <Link href="/" className="brand-link group focus-visible:outline-hidden" onClick={closeMobileMenu}>
          <div className="brand-logo-wrap">
            <Image
              src="/sims-logo.png"
              alt="SIMS Raipur Official Logo"
              width={52}
              height={52}
              priority
              className="brand-logo-img transition-transform group-hover:scale-105"
            />
          </div>
          <div className="brand-masthead">
            <div className="brand-v-divider" />
            <div className="brand-stacked-text">
              <span className="brand-gate-title">GATE</span>
              <span className="brand-sub-tag">Raipur Campus · Premier Institute</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links (Center) */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {/* Courses Dropdown */}
          <div
            className="nav-dropdown-wrapper"
            onMouseEnter={handleCoursesMouseEnter}
            onMouseLeave={handleCoursesMouseLeave}
          >
            <button
              type="button"
              className="nav-item nav-dropdown-btn"
              onClick={() => {
                if (coursesTimerRef.current) clearTimeout(coursesTimerRef.current);
                setCoursesDropdownOpen((prev) => !prev);
              }}
              aria-expanded={coursesDropdownOpen}
              aria-haspopup="true"
            >
              <span>Courses</span>
              <svg
                className={`dropdown-chevron ${coursesDropdownOpen ? "chevron-open" : ""}`}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {coursesDropdownOpen && (
              <div className="nav-dropdown-menu" role="menu">
                <Link href="/courses" className="dropdown-link" onClick={closeMobileMenu} role="menuitem">
                  <strong>Full Course Catalog</strong>
                  <span>All 10 Academic Streams & Disciplines</span>
                </Link>
                <div className="dropdown-divider" />
                <Link href="/courses?category=GATE_CHEMISTRY" className="dropdown-link" onClick={closeMobileMenu} role="menuitem">
                  <strong>GATE Chemistry (CY)</strong>
                  <span>Physical, Inorganic & Organic Master Course</span>
                </Link>
                <Link href="/courses?category=GATE_CSE" className="dropdown-link" onClick={closeMobileMenu} role="menuitem">
                  <strong>Computer Science & IT (CSE)</strong>
                  <span>Algorithms, OS, DBMS, Networks & Theory</span>
                </Link>
                <Link href="/courses?category=GATE_CHEMICAL" className="dropdown-link" onClick={closeMobileMenu} role="menuitem">
                  <strong>GATE Chemical (CH)</strong>
                  <span>Thermodynamics, Mass Transfer & Reaction Engg</span>
                </Link>
                <Link href="/courses?category=GATE_DA" className="dropdown-link" onClick={closeMobileMenu} role="menuitem">
                  <strong>Data Science & AI (DA)</strong>
                  <span>Machine Learning, Probability & Linear Algebra</span>
                </Link>
                <div className="dropdown-divider" />
                <Link href="/courses" className="dropdown-link-all" onClick={closeMobileMenu} role="menuitem">
                  Explore All 14 Published Programs &rarr;
                </Link>
              </div>
            )}
          </div>

          <Link href="/#batches" className="nav-item">
            Batches
          </Link>
          <Link href="/#faculty" className="nav-item">
            Faculty
          </Link>
          <Link href="/test-series" className="nav-item">
            Test Series
          </Link>
          <Link href="/#approach" className="nav-item">
            Our Approach
          </Link>
          <Link href="/#contact" className="nav-item">
            Contact
          </Link>
        </nav>

        {/* Desktop Contextual Actions (Right) */}
        <div className="header-actions" suppressHydrationWarning>
          {!mounted || !isAuthenticated || !user ? (
            /* Logged Out / Visitor State: Sign In (with Dashboard or Test Portal choices) + WhatsApp Advisor */
            <>
              {/* Dual Options Sign In Button */}
              <div
                className="relative inline-flex items-center nav-signin-menu-wrap"
                onMouseEnter={handleSignInMouseEnter}
                onMouseLeave={handleSignInMouseLeave}
              >
                <div className="inline-flex items-stretch rounded-lg border border-[#0F4336] bg-transparent overflow-hidden shadow-sm shrink-0">
                  <button
                    type="button"
                    className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-[13px] font-semibold text-[#0F4336] hover:bg-[#0F4336] hover:text-white transition-colors cursor-pointer"
                    onClick={() => openAuthModal("login", "dashboard")}
                    title="Sign In to Student Dashboard"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignInDropdownOpen((prev) => !prev)}
                    className="px-1 sm:px-1.5 text-[#0F4336] hover:bg-[#0F4336] hover:text-white transition-colors border-l border-[#0F4336]/30 cursor-pointer flex items-center justify-center"
                    aria-label="Choose Sign In Destination Portal"
                    title="Choose Sign In Destination"
                  >
                    <svg className="size-3 sm:size-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {signInDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setSignInDropdownOpen(false);
                        openAuthModal("login", "dashboard");
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-lg">🎓</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0B192C]">Student Dashboard</span>
                        <span className="text-[10px] text-slate-500 font-normal">Classroom, LMS & Batches</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignInDropdownOpen(false);
                        openAuthModal("login", "test-series");
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left rounded-lg text-xs font-semibold text-slate-800 hover:bg-amber-50/50 transition-colors cursor-pointer"
                    >
                      <span className="text-lg">🏆</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#8C6D23]">Test Portal</span>
                        <span className="text-[10px] text-slate-500 font-normal">CBT Mock Tests & Percentile</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => openAdvisor("Classroom Batch Admissions 2027–2028")}
                className="!hidden md:!inline-flex nav-btn-advisor"
                title="Chat with SIMS Admissions Advisor on WhatsApp"
              >
                <svg
                  className="whatsapp-icon-svg"
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.02.79.81-2.94-.19-.3a8.21 8.21 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28" />
                </svg>
                <span>Advisor</span>
              </button>
            </>
          ) : (
            /* Authenticated State: Role-Specific Action Buttons + Profile Avatar */
            <>
              {/* Administrator Role */}
              {(user.is_superuser || user.role === "admin" || (user.is_staff && user.role !== "teacher")) && (
                <a
                  href="http://127.0.0.1:8000/admin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-btn-admin-portal"
                  title="Open Django Admin Management Portal"
                >
                  <span>Admin Portal</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              {/* Teacher Role */}
              {user.role === "teacher" && (
                <Link
                  href="/dashboard?role=teacher"
                  className="nav-btn-dashboard"
                  title="Faculty Portal & Teaching Dashboard"
                >
                  <span>Faculty Portal</span>
                </Link>
              )}

              {/* Student Role (default) - Dual Dashboard and Test Portal */}
              {user.role !== "teacher" && !user.is_superuser && (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Link
                    href="/dashboard"
                    className="nav-btn-dashboard !h-[32px] sm:!h-[38px] !px-2.5 sm:!px-4 !text-xs sm:!text-[13.5px]"
                    title="Open Student Academic Dashboard"
                  >
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/test-series"
                    className="inline-flex items-center justify-center h-[32px] sm:h-[38px] px-2 sm:px-3.5 text-xs sm:text-[13.5px] font-semibold text-[#8C6D23] bg-[#C5A059]/15 border border-[#C5A059]/60 rounded-lg hover:bg-[#C5A059] hover:text-[#0B192C] transition-all whitespace-nowrap shadow-sm"
                    title="Open CBT Test Series Portal"
                  >
                    <span>Test Portal</span>
                  </Link>
                </div>
              )}

              {/* User Account / Profile Menu */}
              <div
                className="nav-user-menu-wrap"
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <button
                  type="button"
                  className="nav-user-badge-btn"
                  onClick={() => {
                    if (userTimerRef.current) clearTimeout(userTimerRef.current);
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  aria-expanded={userDropdownOpen}
                  aria-label="Account menu"
                >
                  <div className="nav-user-avatar-initials">
                    <span>{userInitial}</span>
                    <span className="user-online-dot" />
                  </div>
                  <div className="nav-user-label-col hidden lg:flex">
                    <span className="nav-user-name">{user.first_name || user.username}</span>
                    <span className="nav-user-role">{userRoleDisplay}</span>
                  </div>
                  <svg
                    className={`user-chevron ${userDropdownOpen ? "chevron-open" : ""}`}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="nav-user-dropdown-menu" role="menu">
                    <div className="nav-user-dropdown-header">
                      <strong className="user-dropdown-fullname">{user.full_name || user.username}</strong>
                      <span className="user-dropdown-email">{user.email}</span>
                      <span className="user-dropdown-badge">
                        {user.is_superuser
                          ? "Administrator"
                          : user.role === "teacher"
                          ? "Faculty Member"
                          : `${user.target_branch || "GATE"} · ${user.target_exam || "2027"}`}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                      <span>Dashboard Overview</span>
                    </Link>

                    <Link
                      href="/dashboard/courses"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10" />
                        <path d="M6 10h10" />
                      </svg>
                      <span>My Enrolled Courses</span>
                    </Link>

                    <Link
                      href="/dashboard/live-classes"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
                      </svg>
                      <span>Live Classes & Lectures</span>
                    </Link>

                    <Link
                      href="/test-series"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                      <span>Test Series Portal</span>
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Profile & Settings</span>
                    </Link>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="user-dropdown-logout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutUser();
                      }}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* WhatsApp Advisor (Secondary & Compact) */}
              <button
                type="button"
                onClick={() => openAdvisor("Classroom Batch Admissions 2027–2028")}
                className="!hidden md:!inline-flex nav-btn-advisor"
                title="Chat with SIMS Admissions Advisor on WhatsApp"
              >
                <svg
                  className="whatsapp-icon-svg"
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.02.79.81-2.94-.19-.3a8.21 8.21 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28" />
                </svg>
                <span className="hidden sm:inline">Advisor</span>
              </button>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn shrink-0"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="pointer-events-none"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Quick-Nav Scroll Strip (Always visible on mobile so navbar links are never missing) */}
      <div className="mobile-nav-scroll-strip" aria-label="Mobile Quick Navigation">
        <Link href="/courses" className="mob-nav-pill" onClick={closeMobileMenu}>
          Programs
        </Link>
        <Link href="/#batches" className="mob-nav-pill" onClick={closeMobileMenu}>
          Batches
        </Link>
        <Link href="/#faculty" className="mob-nav-pill" onClick={closeMobileMenu}>
          Faculty
        </Link>
        <Link href="/test-series" className="mob-nav-pill" onClick={closeMobileMenu}>
          Test Series
        </Link>
        <Link href="/#approach" className="mob-nav-pill" onClick={closeMobileMenu}>
          Approach
        </Link>
        <Link href="/#contact" className="mob-nav-pill" onClick={closeMobileMenu}>
          Raipur Center
        </Link>
      </div>
    </header>

    {/* Fullscreen Mobile Navigation Drawer (Covers 100% of Screen — Never Leaves Dashboard Visible Behind) */}
    {mobileMenuOpen && (
      <div
        className="fixed inset-0 z-[999999] bg-white flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
      >
        {/* Top Header Bar inside Fullscreen Drawer */}
        <div className="flex items-center justify-between px-4 h-[60px] border-b border-slate-200 shrink-0 bg-white sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-2.5" onClick={closeMobileMenu}>
            <Image
              src="/sims-logo.png"
              alt="SIMS Raipur Logo"
              width={42}
              height={42}
              className="object-contain"
            />
            <div className="flex items-center gap-2">
              <div className="w-[1.5px] h-6 bg-[#C5A059]" />
              <span className="font-extrabold text-[#0B192C] text-base tracking-wider uppercase">GATE</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Quick Topic Pills Row */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-none shrink-0">
          <Link href="/courses" className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap" onClick={closeMobileMenu}>
            Programs
          </Link>
          <Link href="/#batches" className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap" onClick={closeMobileMenu}>
            Batches
          </Link>
          <Link href="/#faculty" className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap" onClick={closeMobileMenu}>
            Faculty
          </Link>
          <Link href="/test-series" className="px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-xs font-bold text-[#8C6D23] whitespace-nowrap" onClick={closeMobileMenu}>
            Test Series
          </Link>
        </div>

        {/* Navigation Links Body */}
        <div className="flex-1 px-5 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/courses"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📚</span>
              <span>All Courses Catalog</span>
            </div>
            <span className="text-slate-400 text-sm">&rarr;</span>
          </Link>

          <Link
            href="/#batches"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏛️</span>
              <span>Classroom Batches</span>
            </div>
            <span className="text-slate-400 text-sm">&rarr;</span>
          </Link>

          <Link
            href="/#faculty"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👨‍🏫</span>
              <span>Faculty Profiles</span>
            </div>
            <span className="text-slate-400 text-sm">&rarr;</span>
          </Link>

          <Link
            href="/test-series"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-amber-50/60 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <span className="text-[#8C6D23]">Test Series &amp; CBT Portal</span>
            </div>
            <span className="text-[#8C6D23] text-sm">&rarr;</span>
          </Link>

          <Link
            href="/#approach"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <span>Our Approach</span>
            </div>
            <span className="text-slate-400 text-sm">&rarr;</span>
          </Link>

          <Link
            href="/#contact"
            className="flex items-center justify-between p-3.5 rounded-xl text-base font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <span>Contact &amp; Raipur Center</span>
            </div>
            <span className="text-slate-400 text-sm">&rarr;</span>
          </Link>
        </div>

        {/* Bottom Actions Area */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3" suppressHydrationWarning>
          {!mounted || !isAuthenticated || !user ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal("login", "dashboard");
                  }}
                  className="py-3 px-4 rounded-xl bg-[#0F4336] text-white font-bold text-sm text-center hover:bg-[#0B3026] transition-colors cursor-pointer shadow-sm"
                >
                  Sign In
                </button>
                <Link
                  href="/test-series"
                  onClick={closeMobileMenu}
                  className="py-3 px-4 rounded-xl bg-[#C5A059] text-[#0B192C] font-bold text-sm text-center hover:bg-[#D4AF37] transition-colors inline-flex items-center justify-center cursor-pointer shadow-sm"
                >
                  🏆 Test Series
                </Link>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  openAdvisor("Classroom Batch Admissions 2027–2028");
                }}
                className="w-full py-3 px-4 rounded-xl border border-[#CBD5E1] bg-white text-slate-800 font-semibold text-sm text-center flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <svg className="text-[#25D366]" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.02.79.81-2.94-.19-.3a8.21 8.21 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28" />
                </svg>
                <span>Chat with Admissions Advisor</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{user.full_name || user.username}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-[#0F4336] bg-[#0F4336]/10 px-2 py-0.5 rounded-full">
                  {userRoleDisplay}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/dashboard"
                  className="py-3 px-4 rounded-xl bg-[#0F4336] text-white font-bold text-sm text-center hover:bg-[#0B3026] transition-colors cursor-pointer"
                  onClick={closeMobileMenu}
                >
                  🎓 Student Dashboard
                </Link>
                <Link
                  href="/test-series"
                  className="py-3 px-4 rounded-xl bg-[#C5A059] text-[#0B192C] font-bold text-sm text-center hover:bg-[#D4AF37] transition-colors cursor-pointer"
                  onClick={closeMobileMenu}
                >
                  🏆 Test Series Portal
                </Link>
              </div>
              <Link
                href="/dashboard/courses"
                className="block w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-center hover:bg-slate-50"
                onClick={closeMobileMenu}
              >
                My Enrolled Courses
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  logoutUser();
                }}
                className="w-full py-2 px-4 rounded-xl text-rose-600 font-semibold text-sm text-center hover:bg-rose-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
