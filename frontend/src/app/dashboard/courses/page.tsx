"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  BookOpen,
  ArrowRight,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
  Play
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";

interface EnrollmentItem {
  id: number;
  course?: number;
  course_title: string;
  course_slug?: string;
  course_category?: string;
  batch_name: string;
  branch: string;
  progress_percent: number;
  completed_lectures: number;
  total_lectures: number;
  attendance_percent: number;
  validity: string;
  is_active: boolean;
  created_at: string;
}

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

function MyCoursesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const purchasedSlug = searchParams?.get("purchased");

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "courses" | "test-series">("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null);
  const [courseMockTests, setCourseMockTests] = useState<any[]>([]);
  const [loadingMocks, setLoadingMocks] = useState(false);

  useEffect(() => {
    async function loadCourseMocks() {
      if (!selectedEnrollment?.course || !user?.id) {
        setCourseMockTests([]);
        return;
      }
      try {
        setLoadingMocks(true);
        const res = await fetch(`http://127.0.0.1:8000/api/dashboard/test-series/?course_id=${selectedEnrollment.course}&user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCourseMockTests(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load course mock tests:", err);
      } finally {
        setLoadingMocks(false);
      }
    }
    loadCourseMocks();
  }, [selectedEnrollment, user]);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [enrRes, coursesRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}&type=COURSE`),
          fetch("http://127.0.0.1:8000/api/courses/?category=ALL"),
        ]);

        if (enrRes.ok) {
          const data = await enrRes.json();
          const list: EnrollmentItem[] = data.enrollments || [];
          setEnrollments(list);
          if (list.length > 0) {
            if (purchasedSlug) {
              const matched = list.find((e) => e.course_slug === purchasedSlug);
              setSelectedEnrollment(matched || list[0]);
            } else {
              setSelectedEnrollment(list[0]);
            }
          }
        }

        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          const cList: AvailableCourse[] = Array.isArray(cData) ? cData : cData.results || [];
          setAvailableCourses(cList.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load courses data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, purchasedSlug]);

  const isTestSeriesItem = (e: EnrollmentItem) =>
    e.course_category === "TEST_SERIES" ||
    e.course_title.toLowerCase().includes("test series");

  const testSeriesCount = enrollments.filter(isTestSeriesItem).length;
  const coursesCount = enrollments.filter((e) => !isTestSeriesItem(e)).length;

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.branch.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "courses") return !isTestSeriesItem(e);
    if (activeTab === "test-series") return isTestSeriesItem(e);
    return true;
  });

  return (
    <div className="space-y-7">
      {/* 1. Header with Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Academic Ledger
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            My Enrolled Courses
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time syllabus completion, lecture sessions, and academic progression.
          </p>
        </div>

        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15271E] hover:bg-[#1E3A2F] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Sparkles className="size-4 text-[#C5A059]" />
          <span>Explore All Programs</span>
        </Link>
      </div>

      {/* Success Notification if just purchased */}
      {purchasedSlug && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-sm text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Admission Confirmed!</strong> Your course has been activated in PostgreSQL and is ready for study.
            </span>
          </div>
          <Link
            href="/dashboard/courses"
            className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 shrink-0"
          >
            Dismiss
          </Link>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-12 w-full bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-48 w-full bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      ) : enrollments.length === 0 ? (
        <AcademicLockedOverlay
          title="You haven't purchased any course yet"
          description="You haven't purchased any course yet. Dashboard classroom batches and lecture courses are for enrolled course scholars. If you purchased a Test Series, please visit the Test Portal."
        />
      ) : (
        /* 3. ENROLLED STUDENT VIEW WITH REAL COURSES */
        <div className="space-y-6">
          {/* Controls Bar: Category Filter Tabs + Search Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Enrollments ({enrollments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "courses"
                    ? "bg-[#15271E] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎓 Classroom Batches ({coursesCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("test-series")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "test-series"
                    ? "bg-[#C5A059] text-[#0B192C] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏆 CBT Test Series ({testSeriesCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative max-w-xs w-full">
              <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search enrollments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          {/* Enrolled Courses Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {filteredEnrollments.map((enr) => {
              const isSelected = selectedEnrollment?.id === enr.id;
              const isTestSeries = isTestSeriesItem(enr);

              if (isTestSeries) {
                return (
                  <div
                    key={enr.id}
                    onClick={() => setSelectedEnrollment(enr)}
                    className={`rounded-3xl p-6 sm:p-7 bg-linear-to-b from-white to-[#FAF8F5] border transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? "border-2 border-[#C5A059] ring-4 ring-amber-50"
                        : "border-amber-200/70 hover:border-amber-300"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Badge & Validity */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                          <span>🏆</span>
                          <span>CBT Test Series Portal</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {enr.validity}
                        </span>
                      </div>

                      {/* Course Title & Batch */}
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900 leading-snug">
                          {enr.course_title}
                        </h3>
                        <p className="text-xs text-amber-900/80 mt-1 font-medium">
                          All-India GATE Computer-Based Testing Interface &amp; Derivations
                        </p>
                      </div>

                      {/* CBT Specific Highlights */}
                      <div className="space-y-2 pt-2 bg-amber-50/50 rounded-2xl p-3 border border-amber-100">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          <span><strong>150+ CBT Mock Tests</strong> (Subject-wise, Multi-subject &amp; Full Mock)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          <span><strong>National Percentile &amp; AIR</strong> with Step-by-Step Solutions</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-6 mt-4 border-t border-amber-100 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Test Series</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href="/test-series"
                          className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B192C] text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Launch Test Portal</span>
                          <ArrowRight className="size-3.5 text-[#0B192C]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={enr.id}
                  onClick={() => setSelectedEnrollment(enr)}
                  className={`rounded-3xl p-6 sm:p-7 bg-white border transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isSelected
                      ? "border-2 border-[#15271E] ring-4 ring-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Badge & Validity */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                        {enr.branch || "GATE Core"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {enr.validity}
                      </span>
                    </div>

                    {/* Course Title & Batch */}
                    <div>
                      <h3 className="font-serif text-xl font-bold text-slate-900 leading-snug">
                        {enr.course_title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Batch: <strong>{enr.batch_name}</strong>
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Syllabus Coverage</span>
                        <span className="text-emerald-800">{enr.progress_percent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(enr.progress_percent, 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-emerald-700 shrink-0" />
                        <span><strong>{enr.completed_lectures} / {enr.total_lectures}</strong> Lectures</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-amber-700 shrink-0" />
                        <span><strong>{enr.attendance_percent}%</strong> Attendance</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active Admission</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {enr.course_slug && (
                        <Link
                          href={`/courses/${enr.course_slug}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Curriculum
                        </Link>
                      )}
                      <Link
                        href="/dashboard/live-classes"
                        className="px-4 py-2 rounded-xl bg-[#15271E] hover:bg-[#1E3A2F] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Play className="size-3 fill-current text-[#C5A059]" />
                        <span>Open Classes</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Course Quick Hub Links */}
          {selectedEnrollment && (
            <div className="rounded-3xl bg-[#FAF8F5] border border-amber-200/50 p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/40">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                    Active Program Workspace
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    {selectedEnrollment.course_title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/timetable"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Calendar className="size-3.5 text-amber-700" />
                    <span>View Timetable</span>
                  </Link>
                  <Link
                    href="/dashboard/study-material"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="size-3.5 text-emerald-700" />
                    <span>Study Notes</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Batch Timings</span>
                  <strong className="text-slate-800 block text-sm">Mon – Sat · 07:30 AM – 10:30 AM</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Campus Center</span>
                  <strong className="text-slate-800 block text-sm">SBI Building, Choubey Colony, Raipur</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Faculty In-Charge</span>
                  <strong className="text-slate-800 block text-sm">Prof. Aniruddh Singh (Ex-IITian)</strong>
                </div>
              </div>

              {/* Dedicated Course CBT Mock Tests List */}
              <div className="pt-3 border-t border-amber-200/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      CBT Mock Tests ({courseMockTests.length})
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Cohort Papers
                    </span>
                  </div>
                  <Link
                    href={`/test-series?course_id=${selectedEnrollment.course}`}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>Open in Test Portal</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                {loadingMocks ? (
                  <div className="text-xs text-slate-500 py-3">Loading mock tests...</div>
                ) : courseMockTests.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200 p-4 text-xs text-slate-500 text-center">
                    No mock tests scheduled yet for this course. Tests will appear here as faculty publishes them.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {courseMockTests.map((t: any, idx: number) => (
                      <div
                        key={t.id}
                        className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="size-8 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            #{t.order || (idx + 1)}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-slate-900 truncate">
                              {t.title}
                            </h5>
                            <span className="text-xs text-slate-500">
                              {t.duration_minutes || 180} mins · {t.total_marks || 100} Marks · {t.questions_count || 10} Questions
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/test-series?test_id=${t.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0F4336] hover:bg-[#1E3A2F] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                        >
                          <Play className="size-3 fill-current text-[#C5A059]" />
                          <span>Start CBT Exam</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse p-6">
          <div className="h-24 bg-slate-100 rounded-3xl" />
          <div className="h-64 bg-slate-100 rounded-3xl" />
        </div>
      }
    >
      <MyCoursesContent />
    </Suspense>
  );
}
