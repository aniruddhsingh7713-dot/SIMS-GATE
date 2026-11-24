"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  User,
  MapPin,
  ArrowRight,
  FileText,
  Play,
  Calendar,
  Printer,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Sparkles,
  GraduationCap,
  Phone,
  HelpCircle,
  Award,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";

interface AvailableCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  category_display: string;
  branch: string;
  branch_display: string;
  price: string;
  duration: string;
  total_lectures: number;
}

interface TimetableSlot {
  id: number;
  day: string;
  day_display: string;
  order: number;
  start_time: string;
  end_time: string;
  time_slot_label?: string;
  slot_type?: string;
  category?: string;
  subject: string;
  faculty_name: string;
  room_or_mode?: string;
  branch: string;
  topic_description?: string;
  is_active: boolean;
}

interface LiveLecture {
  id: number;
  title: string;
  description: string;
  subject: string;
  faculty_name: string;
  branch: string;
  branch_display?: string;
  target_exam?: string;
  status: "LIVE" | "UPCOMING" | "RECORDED";
  status_display?: string;
  is_live?: boolean;
  scheduled_time: string;
  duration: string;
  room_or_mode?: string;
  video_url: string;
  embed_video_url?: string;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentDateStr, setCurrentDateStr] = useState("Friday, 17 October 2025");
  const [greeting, setGreeting] = useState("Good evening,");
  const [activeVideoModal, setActiveVideoModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [activeModalTitle, setActiveModalTitle] = useState("Live Classroom Stream");

  // Dynamic Live Class State
  const [activeLiveClass, setActiveLiveClass] = useState<LiveLecture | null>(null);
  const [featuredClass, setFeaturedClass] = useState<LiveLecture | null>(null);
  const [isLiveNow, setIsLiveNow] = useState(false);

  // Timetable State
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("ALL");

  // Recommended Courses State for New / Unenrolled Students
  const [recommendedCourses, setRecommendedCourses] = useState<AvailableCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    setCurrentDateStr(d.toLocaleDateString("en-US", options));

    const hr = d.getHours();
    if (hr < 12) setGreeting("Good morning,");
    else if (hr < 17) setGreeting("Good afternoon,");
    else setGreeting("Good evening,");
  }, []);

  // Fetch recommended programs from backend
  useEffect(() => {
    async function loadRecommended() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/courses/?category=ALL");
        if (res.ok) {
          const data = await res.json();
          const list: AvailableCourse[] = Array.isArray(data) ? data : data.results || [];
          setRecommendedCourses(list);
        }
      } catch (err) {
        console.error("Failed to load recommended courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadRecommended();
  }, []);

  // Fetch actual student enrollments and dashboard overview from PostgreSQL
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courseMockTests, setCourseMockTests] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [isBackendTestSeriesOnly, setIsBackendTestSeriesOnly] = useState<boolean | null>(null);

  // Fetch live lecture & timetable dynamically for student's enrolled discipline
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userParam = user?.id ? `?user_id=${user.id}` : "";
        const res = await fetch(`http://127.0.0.1:8000/api/dashboard/overview/${userParam}`);
        if (res.ok) {
          const data = await res.json();
          const active = data.active_live_class || null;
          const chosen = data.featured_class || active;

          setActiveLiveClass(active);
          setIsLiveNow(Boolean(active));
          setFeaturedClass(chosen);
          if (chosen) {
            setSelectedVideoUrl(chosen.embed_video_url || chosen.video_url);
            setActiveModalTitle(`${chosen.subject}: ${chosen.title}`);
          }
          if (data.timetable) {
            setTimetableSlots(data.timetable);
          }
          if (data.enrollments) {
            setEnrollments(data.enrollments);
          }
          if (data.course_mock_tests) {
            setCourseMockTests(data.course_mock_tests);
          }
          if (typeof data.is_test_series_only === "boolean") {
            setIsBackendTestSeriesOnly(data.is_test_series_only);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard overview data:", err);
      } finally {
        setLoadingTimetable(false);
        setLoadingEnrollments(false);
      }
    }
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    async function loadEnrollments() {
      if (!user?.id) {
        setLoadingEnrollments(false);
        return;
      }
      try {
        setLoadingEnrollments(true);
        const res = await fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}&type=COURSE`);
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data.enrollments || []);
          if (typeof data.is_test_series_only === "boolean") {
            setIsBackendTestSeriesOnly(data.is_test_series_only);
          }
        }
      } catch (err) {
        console.error("Failed to load student enrollments:", err);
      } finally {
        setLoadingEnrollments(false);
      }
    }
    loadEnrollments();
  }, [user]);

  const isStaffOrAdmin = Boolean(
    user?.is_staff ||
    user?.is_superuser ||
    user?.role === "admin" ||
    user?.role === "teacher"
  );

  const isTestSeriesOnly = useMemo(() => {
    if (isBackendTestSeriesOnly !== null) {
      return isBackendTestSeriesOnly;
    }
    if (enrollments.length === 0) return false;
    return enrollments.every(
      (e: any) =>
        e.enrollment_type === "TEST_SERIES" ||
        (e.course_title && e.course_title.toLowerCase().includes("test series"))
    );
  }, [isBackendTestSeriesOnly, enrollments]);

  const isUnenrolledStudent = (!loadingEnrollments && enrollments.length === 0 && !isStaffOrAdmin) || Boolean(isBackendTestSeriesOnly);

  const studentName = mounted
    ? (user?.full_name ||
       `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
       user?.username ||
       "Student")
    : "Student";

  const dayOrder: Record<string, number> = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };

  const dayTabs = [
    { key: "ALL", label: "All Days (Mon–Sat)" },
    { key: "MON", label: "Mon" },
    { key: "TUE", label: "Tue" },
    { key: "WED", label: "Wed" },
    { key: "THU", label: "Thu" },
    { key: "FRI", label: "Fri" },
    { key: "SAT", label: "Sat" },
  ];

  const filteredSlots = timetableSlots
    .filter((slot) => {
      if (selectedDayFilter === "ALL") return true;
      return slot.day.toUpperCase() === selectedDayFilter;
    })
    .sort((a, b) => {
      const dayA = dayOrder[a.day.toUpperCase()] || 99;
      const dayB = dayOrder[b.day.toUpperCase()] || 99;
      if (dayA !== dayB) return dayA - dayB;
      return a.order - b.order;
    });

  const handlePrintTimetable = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------------
         SCREEN-ONLY DASHBOARD SECTIONS (Hidden completely during printing)
         -------------------------------------------------------------------------- */}
      <div className="dashboard-overview-content space-y-6 print:hidden">
        {/* 1. GREETING HEADER ROW (Clean, High-Contrast, Professional) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span
              className="text-sm font-semibold text-slate-500 uppercase tracking-wider block"
              suppressHydrationWarning
            >
              {greeting}
            </span>
            <h1
              className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1"
              suppressHydrationWarning
            >
              {mounted ? studentName : "Student"}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Keep learning. Consistency today, top ranks tomorrow.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span
              className="text-sm sm:text-base font-bold text-slate-800 block"
              suppressHydrationWarning
            >
              {currentDateStr}
            </span>
            <span className="text-xs sm:text-sm text-amber-800 font-medium italic mt-1 block">
              &ldquo;Discipline today, top ranks tomorrow.&rdquo;
            </span>
          </div>
        </div>

        {/* 2. MAIN DASHBOARD CONTENT (Protected by AcademicLockedOverlay with Dynamic Sad Smiley + Blur) */}
        <AcademicLockedOverlay
          isLocked={isUnenrolledStudent}
          title={isBackendTestSeriesOnly ? "You haven't purchased any course yet" : "No Active Course Enrollment"}
          description={
            isBackendTestSeriesOnly
              ? "You haven't purchased any course yet. Dashboard classroom lectures, batches, and timetables are for enrolled course scholars. Your CBT Test Series is active in the Test Portal."
              : "You haven't purchased any course yet. Please purchase or enroll in an approved course to unlock your classroom timetable, live interactive lectures, study notes, and classroom cohorts."
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Next Class / Live Stream Highlight Card OR Test Series Candidate Card */}
              {isTestSeriesOnly ? (
                <div className="rounded-2xl bg-linear-to-br from-amber-50/60 via-white to-amber-50/20 p-6 sm:p-7 relative overflow-hidden transition-all shadow-sm border border-amber-200">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 tracking-wide shadow-2xs">
                        <Award className="size-3.5 text-amber-700" />
                        ACTIVE CBT TEST SERIES CANDIDATE
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {enrollments.length > 0 ? (enrollments[0].branch || "CHEMICAL (CH)") : "GATE TEST SERIES"}
                      </span>
                    </div>

                    <Link
                      href="/test-series"
                      className="text-xs sm:text-sm font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 transition-colors"
                    >
                      <span>CBT Portal</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-4">
                    <div className="space-y-2.5">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {enrollments.length > 0 ? enrollments[0].course_title : "GATE Chemical Engineering (CH) CBT Test Series"}
                      </h3>

                      <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                        Your CBT Mock Test Series is active. Attempt full-length national mock tests, subject-wise tests, and practice papers with the official GATE interface, virtual calculator, AI proctoring deterrence, and instant AIR rank analysis.
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm pt-1">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-900 bg-white border border-amber-200 px-3 py-1.5 rounded-lg shadow-2xs">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <span>Full-Length Mocks &amp; Subject Tests</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700 bg-white border border-amber-200 px-3 py-1.5 rounded-lg font-medium shadow-2xs">
                          <ShieldCheck className="size-4 text-amber-600" />
                          <span>AI Proctored Simulation</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700 bg-white border border-amber-200 px-3 py-1.5 rounded-lg font-medium shadow-2xs">
                          <TrendingUp className="size-4 text-emerald-600" />
                          <span>Instant Scorecard &amp; Solutions</span>
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/test-series"
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-[#15271E] hover:bg-[#1E3A2F] text-white text-sm font-bold transition-all cursor-pointer shrink-0 shadow-sm hover:shadow"
                    >
                      <Award className="size-4 text-[#D4AF37]" />
                      <span>Launch Test Portal</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl bg-white p-6 sm:p-7 relative overflow-hidden transition-all shadow-sm ${
                  isLiveNow && activeLiveClass 
                    ? "border-2 border-red-500 bg-red-50/10" 
                    : "border border-slate-200"
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {isLiveNow && activeLiveClass ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white tracking-wide shadow-xs animate-pulse">
                          <span className="size-2 rounded-full bg-white" />
                          🔴 LIVE CLASS IN PROGRESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                          NEXT UPCOMING CLASS
                        </span>
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {featuredClass?.branch_display || featuredClass?.branch || (enrollments.length > 0 ? (enrollments[0].branch || enrollments[0].course_title) : "Academic Core")}
                      </span>
                    </div>

                    <Link
                      href="/dashboard/live-classes"
                      className="text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Live Classes Hub</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-4">
                    <div className="space-y-2.5">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {featuredClass?.title || (enrollments.length > 0 ? `${enrollments[0].course_title}: Live Lecture` : "Foundation Mathematics & Problem Solving")}
                      </h3>

                      {featuredClass?.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                          {featuredClass.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 text-sm pt-1">
                        <span className="flex items-center gap-2 font-semibold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                          <Clock className="size-4 text-amber-600" />
                          {featuredClass?.scheduled_time || "Today · 06:00 PM – 07:30 PM"}
                        </span>
                        <span className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
                          <User className="size-4 text-slate-500" />
                          {featuredClass?.faculty_name || "Prof. Aniruddh Singh (Ex-IITian)"}
                        </span>
                        <span className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
                          <MapPin className="size-4 text-slate-500" />
                          {featuredClass?.room_or_mode || "Raipur Studio 1 · Live Interactive"}
                        </span>
                      </div>
                    </div>

                    {isLiveNow && activeLiveClass ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideoUrl(activeLiveClass.embed_video_url || activeLiveClass.video_url);
                          setActiveModalTitle(`${activeLiveClass.subject}: ${activeLiveClass.title}`);
                          setActiveVideoModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all cursor-pointer shrink-0 shadow-sm hover:shadow"
                      >
                        <Play className="size-4 fill-current text-white" />
                        <span>Watch Live</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (featuredClass) {
                            setSelectedVideoUrl(featuredClass.embed_video_url || featuredClass.video_url);
                            setActiveModalTitle(`${featuredClass.subject}: ${featuredClass.title}`);
                          }
                          setActiveVideoModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-[#15271E] text-white text-sm font-bold hover:bg-[#1E3A2F] transition-all cursor-pointer shrink-0 shadow-sm hover:shadow"
                      >
                        <Play className="size-4 fill-current text-[#D4AF37]" />
                        <span>Join Class</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Enrolled Courses Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {isTestSeriesOnly ? "My Enrolled Test Series" : "Continue Learning"}
                  </h4>
                  <Link
                    href={isTestSeriesOnly ? "/test-series" : "/dashboard/courses"}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>{isTestSeriesOnly ? "Open CBT Portal" : `View All (${enrollments.length})`}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {enrollments.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center text-xs text-slate-500">
                      No enrolled courses active yet.
                    </div>
                  ) : (
                    enrollments.map((enr: any) => {
                      const isTest = enr.enrollment_type === "TEST_SERIES" || (enr.course_title && enr.course_title.toLowerCase().includes("test series"));
                      return (
                        <div
                          key={enr.id}
                          className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="size-12 rounded-xl bg-amber-50 text-amber-900 font-bold text-sm flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                              {(enr.branch || "CH").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="text-base font-bold text-slate-900 leading-snug truncate">
                                  {enr.course_title}
                                </h5>
                                {isTest && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    CBT Test Series
                                  </span>
                                )}
                              </div>
                              {isTest ? (
                                <p className="text-xs text-slate-500 mt-1">
                                  All-India Computer-Based Mock Tests &amp; Instant AIR Analysis
                                </p>
                              ) : (
                                <div className="flex items-center gap-3.5 mt-2 max-w-md">
                                  <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                    <div
                                      className="h-full bg-emerald-700 rounded-full"
                                      style={{ width: `${Math.max(enr.progress_percent || 0, 5)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">
                                    {enr.progress_percent || 0}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Link
                            href={isTest ? "/test-series" : "/dashboard/courses"}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-[#15271E] transition-colors cursor-pointer shrink-0 shadow-2xs"
                          >
                            <span>{isTest ? "Take CBT Test" : "Continue"}</span>
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. Enrolled Course Mock Tests (CBT Assessments for Enrolled Course) */}
              {courseMockTests.length > 0 && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-emerald-800" />
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        Course Mock Tests ({courseMockTests.length})
                      </h4>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                        Official CBT Tests
                      </span>
                    </div>
                    <Link
                      href="/test-series"
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <span>View All in Test Portal</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {courseMockTests.map((t: any, idx: number) => (
                      <div
                        key={t.id}
                        className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              Mock Test #{t.order || (idx + 1)}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {t.duration_minutes || 180} mins · {t.total_marks || 100} Marks
                            </span>
                          </div>

                          <h5 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                            {t.title}
                          </h5>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {t.subject || "Course Syllabus"} · {t.questions_count || 10} Questions
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Available Now</span>
                          </span>

                          <Link
                            href={`/test-series?test_id=${t.id}`}
                            className="px-4 py-2 rounded-xl bg-[#0F4336] hover:bg-[#1E3A2F] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Play className="size-3 fill-current text-[#C5A059]" />
                            <span>Start CBT Exam</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Faculty Cabin Doubts & Clinics */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-base font-bold text-slate-900">
                    Faculty Cabin Hours
                  </h4>
                  <Link
                    href="/dashboard/doubt-support"
                    className="text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                  >
                    <span>Helpdesk</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <HelpCircle className="size-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 leading-snug">
                        Daily 1-on-1 Cabin Discussions
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        04:30 PM – 07:30 PM · Cabins 3A & 3B
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 leading-snug">
                        Online Doubt Resolution
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Average faculty reply within 3 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcements Card */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Announcements
                </h4>

                <div className="space-y-3.5 text-sm">
                  <div className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="size-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900 leading-snug">
                          Batch schedule for Feb 2027
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Classroom seats intake details published
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 shrink-0">
                      22 Oct
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="size-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900 leading-snug">
                          Sunday Doubt Resolution Clinic
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Raipur studio special session 10:00 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 shrink-0">
                      19 Oct
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SIMS ACADEMIC TIMETABLE SECTION (Screen View + Print-Ready) */}
          {isTestSeriesOnly ? (
            <section className="bg-linear-to-r from-amber-50/40 via-white to-amber-50/20 border border-amber-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                    <Award className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                        CBT Test Series Portal Notice
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                        CBT Scholar
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      You are enrolled in the <strong>{enrollments[0]?.course_title || "GATE CBT Test Series"}</strong>. Daily classroom lecture batches and studio broadcast timetables are for Full-Year Classroom &amp; Online Cohorts. Your full-length mocks, subject-wise tests, and virtual calculator simulator are ready on the Test Portal.
                    </p>
                  </div>
                </div>

                <Link
                  href="/test-series"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15271E] text-white text-xs sm:text-sm font-bold hover:bg-[#1E3A2F] border border-[#C5A059]/40 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Award className="size-4 text-[#D4AF37]" />
                  <span>Launch CBT Test Series Portal</span>
                </Link>
              </div>
            </section>
          ) : (
          <section className="timetable-section bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 print:p-0 print:border-none print:shadow-none print:rounded-none">
        {/* PRINT-ONLY OFFICIAL HEADER (Only appears in browser print output) */}
        <div className="print-official-header hidden print:flex items-center justify-between pb-3 mb-4 border-b-2 border-[#15271E]">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-slate-50 border border-[#C5A059]/40 p-1 flex items-center justify-center">
              <Image
                src="/sims-logo.png"
                alt="SIMS Raipur Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#15271E] tracking-tight leading-none">
                SIMS GATE
              </h1>
              <p className="text-[10pt] text-slate-600 mt-1 font-semibold">
                Official Academic Timetable · Approved Batch Schedule 2025–26
              </p>
            </div>
          </div>

          <div className="text-right text-[9pt] text-slate-700 leading-snug border-l border-slate-300 pl-3.5">
            <div suppressHydrationWarning><strong className="text-[#15271E]">Scholar:</strong> {mounted ? studentName : "Student"}</div>
            <div suppressHydrationWarning><strong className="text-[#15271E]">Target:</strong> {mounted && user?.target_branch ? user.target_branch : "Computer Science"} · {mounted && user?.target_exam ? user.target_exam : "GATE 2026"}</div>
            <div><strong className="text-[#15271E]">Cohort:</strong> Super-30 Intensive Classroom Cohort</div>
            <div suppressHydrationWarning><strong className="text-[#15271E]">Generated:</strong> {currentDateStr}</div>
          </div>
        </div>

        {/* SCREEN-ONLY SECTION HEADER & CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
              <Calendar className="size-5 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Class Timetable
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Approved Schedule
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Mon–Sat regular classroom lectures, doubt resolution clinics & CBT test series
              </p>
            </div>
          </div>

          {/* Action: Day Selector Pills + Prominent Print Timetable Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Day Filter Pills */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm">
              {dayTabs.map((tab) => {
                const isActive = selectedDayFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedDayFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#15271E] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Clearly Visible Print Timetable Button */}
            <button
              type="button"
              onClick={handlePrintTimetable}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#15271E] text-white text-sm font-bold hover:bg-[#1E3A2F] border border-[#C5A059]/40 transition-all shadow-xs cursor-pointer shrink-0"
              title="Print official academic timetable"
            >
              <Printer className="size-4 text-[#D4AF37]" />
              <span>Print Timetable</span>
            </button>
          </div>
        </div>

        {/* TIMETABLE CONTENT TABLE (Screen Mode & Print Mode) */}
        {loadingTimetable && filteredSlots.length === 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 print:border print:border-[#94A3B8] print:rounded-none">
            <table className="w-full text-left border-collapse text-sm print:text-[9.5pt]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider print:bg-[#F1F5F9] print:border-b-2 print:border-[#15271E]">
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-32 print:w-28 border-r border-slate-200 print:border-[#94A3B8]">
                    Day
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-48 print:w-44 border-r border-slate-200 print:border-[#94A3B8]">
                    Time
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200 print:border-[#94A3B8]">
                    Subject / Class
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-56 print:w-48 border-r border-slate-200 print:border-[#94A3B8]">
                    Teacher
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-48 print:w-44">
                    Session Track
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-4 px-4 border-r border-slate-200"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 border-r border-slate-200"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 border-r border-slate-200"><div className="h-4 w-44 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 border-r border-slate-200"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="font-semibold text-slate-900">No timetable slots scheduled for this selection.</p>
            <p className="text-xs text-slate-500 mt-1">Please select another day filter or check back after batch updates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 print:border print:border-[#94A3B8] print:rounded-none">
            <table className="w-full text-left border-collapse text-sm print:text-[9.5pt]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider print:bg-[#F1F5F9] print:border-b-2 print:border-[#15271E]">
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-32 print:w-28 border-r border-slate-200 print:border-[#94A3B8]">
                    Day
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-48 print:w-44 border-r border-slate-200 print:border-[#94A3B8]">
                    Time
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200 print:border-[#94A3B8]">
                    Subject / Class
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-56 print:w-48 border-r border-slate-200 print:border-[#94A3B8]">
                    Teacher
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 w-48 print:w-44">
                    Session Track
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-y print:divide-slate-300">
                {filteredSlots.map((slot, idx) => (
                  <tr
                    key={slot.id}
                    className={`transition-colors hover:bg-slate-50/80 print:hover:bg-transparent ${
                      idx % 2 === 1 ? "bg-slate-50/40 print:bg-[#F8FAFC]" : "bg-white"
                    }`}
                  >
                    {/* 1. Day Column */}
                    <td className="py-4 px-4 font-bold text-slate-900 align-top border-r border-slate-200 print:border-[#CBD5E1]">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 print:border-none print:p-0 print:bg-transparent print:text-slate-900">
                        {slot.day_display || slot.day}
                      </span>
                    </td>

                    {/* 2. Time Column */}
                    <td className="py-4 px-4 text-slate-700 font-medium align-top border-r border-slate-200 print:border-[#CBD5E1]">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-600 shrink-0 print:hidden" />
                        <span className="font-semibold text-slate-900 text-sm">
                          {slot.start_time} – {slot.end_time}
                        </span>
                      </div>
                    </td>

                    {/* 3. Subject / Class Column */}
                    <td className="py-4 px-4 align-top border-r border-slate-200 print:border-[#CBD5E1]">
                      <span className="font-bold text-slate-900 block text-base leading-snug print:text-[10pt]">
                        {slot.subject}
                      </span>
                      {slot.topic_description && (
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed print:text-slate-700">
                          {slot.topic_description}
                        </p>
                      )}
                    </td>

                    {/* 4. Teacher Column */}
                    <td className="py-4 px-4 text-slate-700 font-medium align-top border-r border-slate-200 print:border-[#CBD5E1]">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-slate-400 shrink-0 print:hidden" />
                        <span className="text-sm font-medium text-slate-800">{slot.faculty_name}</span>
                      </div>
                    </td>

                    {/* 5. Session Track Column */}
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 print:border-none print:p-0 print:bg-transparent print:text-slate-900">
                        <span>{slot.time_slot_label || (slot.slot_type === "CBT_TEST" ? "SPECIAL / TEST" : "CORE TRACK")}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PRINT-ONLY OFFICIAL FOOTER */}
        <div className="print-official-footer hidden print:flex items-end justify-between mt-6 pt-3 border-t border-dashed border-[#94A3B8] text-[8.5pt] text-[#64748B]">
          <div>
            <p className="font-semibold text-[#0B192C]">Approved by Directorate of Academic Pedagogy · SIMS Raipur</p>
            <p className="text-[8pt] text-[#64748B] mt-0.5">3rd Floor, SBI Bldg, Choubey Colony, Raipur (C.G.) · Contact: +91 98261 00000</p>
          </div>
          <div className="text-right">
            <div className="w-44 border-b border-[#0B192C] mb-1" />
            <span className="font-medium text-[#0B192C]">Dean of Academic Affairs</span>
          </div>
        </div>
      </section>
      )}
    </div>
  </AcademicLockedOverlay>
</div>

      {/* Video Modal for Joining / Watching Live Class */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs print:hidden animate-in fade-in duration-150"
          onClick={() => setActiveVideoModal(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#15271E] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#1E3A2F]">
              <div className="flex items-center gap-3">
                {isLiveNow && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                    <span className="size-2 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                )}
                <h4 className="font-bold text-sm sm:text-base text-white truncate max-w-lg sm:max-w-xl">
                  {activeModalTitle}
                </h4>
              </div>
              <button
                onClick={() => setActiveVideoModal(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                aria-label="Close live stream player"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={selectedVideoUrl}
                title="Live Classroom Stream"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
