"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RazorpayCheckoutModal from "@/components/RazorpayCheckoutModal";
import CbtProctoredExamModal from "@/components/CbtProctoredExamModal";
import type { Course } from "@/components/CourseCard";
import {
  Award,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  TrendingUp,
  Target,
  ShieldCheck,
  Lock,
  BookOpen,
  Sparkles,
  Check,
  BarChart3,
  ArrowRight,
  Plus,
  Compass,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Search,
  RotateCcw,
  Eye,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeviceHeaders } from "@/lib/deviceFingerprint";

// -----------------------------------------------------------------------------
// TYPES & DATA CONTRACTS (100% Dynamic from Django Backend)
// -----------------------------------------------------------------------------
interface DashboardSummary {
  total_available: number;
  completed_tests: number;
  pending_tests: number;
  upcoming_tests: number;
  total_active_series: number;
}

interface ActiveSeriesItem {
  id: number;
  title: string;
  slug: string;
  branch: string;
  validity: string;
  total_tests: number;
  completed_tests: number;
  remaining_tests: number;
  progress_percent: number;
  price: string;
}

interface DashboardTestItem {
  id: number;
  title: string;
  order?: number;
  test_type: string;
  subject: string;
  topic: string;
  branch: string;
  language?: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: string;
  negative_marks_val?: number;
  series_id?: number;
  series_title?: string;
  start_date?: string | null;
  end_date?: string | null;
  scheduled_date?: string;
  start_time?: string;
  due_date?: string;
  is_new?: boolean;
  is_attempted?: boolean;
  attempt_status?: string;
  score?: number | null;
  accuracy_percent?: number | null;
  rank_achieved?: string | null;
  attempt_id?: number | null;
  submitted_at?: string | null;
}

interface OtherSeriesItem {
  id: number;
  title: string;
  slug: string;
  branch: string;
  price: string;
  original_price: string;
  duration: string;
  total_tests: number;
  description: string;
  is_enrolled_branch?: boolean;
}

interface DashboardApiResponse {
  summary: DashboardSummary;
  active_series: ActiveSeriesItem[];
  available_tests: DashboardTestItem[];
  upcoming_tests: DashboardTestItem[];
  completed_tests: DashboardTestItem[];
  other_series: OtherSeriesItem[];
  student_branches: string[];
}

interface QuestionReviewItem {
  id: number;
  question_number: number;
  section: string;
  question_type: string;
  question_text: string;
  marks: string;
  negative_marks: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  diagram_url?: string;
  correct_answer: string;
  explanation: string;
  student_answer: string;
  status: "CORRECT" | "INCORRECT" | "UNATTEMPTED";
  marks_awarded: number;
}

interface TestResultResponse {
  success: boolean;
  test_id: number;
  title: string;
  branch: string;
  score: number;
  total_marks: number;
  accuracy_percent: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_taken_seconds: number;
  submitted_at: string;
  questions: QuestionReviewItem[];
}

interface TestSeriesPortalClientProps {
  initialCatalogCourses?: Course[];
}

export default function TestSeriesPortalClient({ initialCatalogCourses = [] }: TestSeriesPortalClientProps) {
  const { user, isAuthenticated, openAuthModal, triggerDeviceLimitExceeded } = useAuth();
  const searchParams = useSearchParams();

  // Primary dynamic state from backend API
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSeriesFilter, setActiveSeriesFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [activeCbtTest, setActiveCbtTest] = useState<any | null>(null);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [viewingResultTestId, setViewingResultTestId] = useState<number | null>(null);
  const [resultData, setResultData] = useState<TestResultResponse | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [showPurchaseToast, setShowPurchaseToast] = useState(false);

  // Check enrollment/payment query flags
  useEffect(() => {
    if (searchParams.get("purchased") === "1" || searchParams.get("enrolled") === "success") {
      setShowPurchaseToast(true);
    }
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // FETCH DYNAMIC DASHBOARD DATA FROM DJANGO
  // ---------------------------------------------------------------------------
  const fetchDashboardData = async () => {
    const activeUserId = user?.id || 36;
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/test-series/?user_id=${activeUserId}&view=dashboard`);
      if (res.ok) {
        const data: DashboardApiResponse = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Failed to load student test dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const testIdParam = searchParams.get("test_id");
    if (testIdParam && dashboardData?.available_tests && !activeCbtTest) {
      const targetTest = dashboardData.available_tests.find((t) => t.id === Number(testIdParam));
      if (targetTest) {
        handleStartTest(targetTest);
      }
    }
    const seriesIdParam = searchParams.get("series_id") || searchParams.get("course_id");
    if (seriesIdParam) {
      setActiveSeriesFilter(Number(seriesIdParam));
    }
  }, [searchParams, dashboardData]);

  // ---------------------------------------------------------------------------
  // START TEST HANDLER
  // ---------------------------------------------------------------------------
  const handleStartTest = async (testItem: DashboardTestItem) => {
    const activeUserId = user?.id || 36;
    try {
      // Fetch full test details with sanitized questions from backend & device verification headers
      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/test-series/${testItem.id}/?user_id=${activeUserId}`, {
        headers: getDeviceHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const fullTest = await res.json();
        setActiveCbtTest(fullTest);
      } else {
        const errData = await res.json();
        if (errData.details?.device_blocked && triggerDeviceLimitExceeded) {
          triggerDeviceLimitExceeded({
            message: errData.error,
          });
        } else {
          alert(errData.error || "Unable to start examination. Please verify your enrollment.");
        }
      }
    } catch (err) {
      console.error("Error starting CBT test:", err);
      alert("Failed to connect to CBT Exam Server.");
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW RESULT & SOLUTION MODAL
  // ---------------------------------------------------------------------------
  const handleViewResult = async (testId: number) => {
    if (!user?.id) return;
    try {
      setViewingResultTestId(testId);
      setLoadingResult(true);
      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/test-series/${testId}/result/?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setResultData(data);
      } else {
        alert("Performance result is not available for this examination.");
        setViewingResultTestId(null);
      }
    } catch (err) {
      console.error("Failed to fetch test results:", err);
      setViewingResultTestId(null);
    } finally {
      setLoadingResult(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ENROLL MORE SERIES (CHECKOUT)
  // ---------------------------------------------------------------------------
  const handleEnrollSeries = (other: OtherSeriesItem) => {
    if (!isAuthenticated || !user) {
      openAuthModal("login", "test-series");
      return;
    }
    const courseObj: Course = {
      id: other.id,
      title: other.title,
      slug: other.slug,
      price: other.price,
      duration: other.duration,
      branch: other.branch,
      category: "TEST_SERIES",
      is_active: true,
      description: other.description,
      exam_name: "GATE 2026/2027",
      total_lectures: other.total_tests,
    };
    setSelectedCourseForCheckout(courseObj);
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setCheckoutModalOpen(false);
    setSelectedCourseForCheckout(null);
    fetchDashboardData();
  };

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredAvailableTests = useMemo(() => {
    if (!dashboardData) return [];
    let list = dashboardData.available_tests || [];
    if (activeSeriesFilter) {
      list = list.filter((t) => t.series_id === activeSeriesFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.topic.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dashboardData, activeSeriesFilter, searchQuery]);

  const summary = dashboardData?.summary || {
    total_available: 0,
    completed_tests: 0,
    pending_tests: 0,
    upcoming_tests: 0,
    total_active_series: 0,
  };

  const activeSeries = dashboardData?.active_series || [];
  const upcomingTests = dashboardData?.upcoming_tests || [];
  const completedTests = dashboardData?.completed_tests || [];
  const otherSeries = dashboardData?.other_series || [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans selection:bg-[#0F4336] selection:text-white">
      {/* Institutional Top Navbar */}
      <Navbar />

      {/* Success Notification Pill if just purchased */}
      {showPurchaseToast && (
        <div className="bg-[#0F4336] text-white px-4 py-3 text-center text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="size-4 text-[#C5A059]" />
          <span>Payment successful! Your new CBT Test Series has been unlocked automatically.</span>
          <button
            onClick={() => setShowPurchaseToast(false)}
            className="ml-4 text-slate-300 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* =========================================================================
            HEADER & STUDENT CONTEXT BAR
            ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#0F4336]/10 text-[#0F4336] border border-[#0F4336]/20">
                CBT Examination Portal
              </span>
              {dashboardData?.student_branches?.length ? (
                <span className="text-xs font-semibold text-slate-500">
                  Enrolled Stream: <strong>{dashboardData.student_branches.join(", ")}</strong>
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Student Test Series Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Live proctored CBT mocks, sectional assessments, and performance diagnostics matching GATE standards.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                <div className="size-8 rounded-full bg-[#0F4336] text-[#C5A059] flex items-center justify-center font-bold text-xs uppercase">
                  {user?.username ? user.username.charAt(0) : "S"}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-bold text-slate-900">{user?.username}</div>
                  <div className="text-[10px] text-slate-400">Authenticated Candidate</div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login", "test-series")}
                className="px-5 py-2.5 rounded-xl bg-[#0F4336] text-white text-xs font-bold hover:bg-[#152E4D] transition-colors shadow-xs"
              >
                Sign In to View Your Tests
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION A: DASHBOARD OVERVIEW (4 KEY METRICS)
            All numbers are dynamic from Django API responses.
            ========================================================================= */}
        <section aria-label="Dashboard Overview Statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* 1. Total Available Tests */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Available Tests
                </span>
                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {loading ? "..." : summary.total_available}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Ready to Attempt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Unlocked &amp; published papers</p>
            </div>

            {/* 2. Completed Tests */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Completed Tests
                </span>
                <div className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {loading ? "..." : summary.completed_tests}
                </span>
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  Evaluated
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Submitted with performance scores</p>
            </div>

            {/* 3. Pending Tests */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Tests
                </span>
                <div className="size-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {loading ? "..." : summary.pending_tests}
                </span>
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  To Complete
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Unattempted published exams</p>
            </div>

            {/* 4. Upcoming Tests */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Upcoming Tests
                </span>
                <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Calendar className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {loading ? "..." : summary.upcoming_tests}
                </span>
                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Scheduled
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Unlocks on target date &amp; time</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION B: MY ACTIVE TEST SERIES
            Compact cards for student's purchased series with real progress.
            ========================================================================= */}
        <section aria-label="My Active Test Series" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-[#0F4336]" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                My Active Test Series ({activeSeries.length})
              </h2>
            </div>
            {activeSeriesFilter !== null && (
              <button
                type="button"
                onClick={() => setActiveSeriesFilter(null)}
                className="text-xs text-[#0F4336] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Show All Series Tests</span>
                <X className="size-3" />
              </button>
            )}
          </div>

          {activeSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSeries.map((series) => {
                const isSelected = activeSeriesFilter === series.id;
                return (
                  <div
                    key={series.id}
                    className={cn(
                      "bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between",
                      isSelected
                        ? "border-[#0F4336] ring-2 ring-[#0F4336]/15 bg-[#FAF9F5]"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {series.branch}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {series.validity}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {series.title}
                      </h3>

                      {/* Mini Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 rounded-lg p-1.5">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                          <span className="text-sm font-bold text-slate-900">{series.total_tests}</span>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-1.5">
                          <span className="text-[10px] text-emerald-600 block uppercase font-bold">Done</span>
                          <span className="text-sm font-bold text-emerald-700">{series.completed_tests}</span>
                        </div>
                        <div className="bg-amber-50/50 rounded-lg p-1.5">
                          <span className="text-[10px] text-amber-600 block uppercase font-bold">Pending</span>
                          <span className="text-sm font-bold text-amber-700">{series.remaining_tests}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Test Series Progress</span>
                          <span className="text-[#0F4336] font-bold">{series.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0F4336] h-full rounded-full transition-all duration-500"
                            style={{ width: `${series.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveSeriesFilter(isSelected ? null : series.id)}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-[#0F4336] text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        )}
                      >
                        <span>{isSelected ? "Filtering Tests Below ✓" : "View Tests in this Series"}</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading && (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center max-w-xl mx-auto">
              <Compass className="size-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-serif text-base font-bold text-slate-900">No Active Test Series Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You are not currently enrolled in any test series package. Explore our discipline packages below.
              </p>
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION C: AVAILABLE TESTS (MOST IMPORTANT SECTION)
            Published by admin and automatically visible to eligible students.
            ========================================================================= */}
        <section aria-label="Available Tests" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Play className="size-4 text-emerald-700 fill-emerald-700" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                Available Tests ({filteredAvailableTests.length})
              </h2>
              {activeSeriesFilter && (
                <span className="text-xs font-semibold text-[#0F4336] bg-[#0F4336]/10 px-2 py-0.5 rounded-full">
                  Filtered by Series
                </span>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tests by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4336] transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 h-56 animate-pulse" />
              ))}
            </div>
          ) : filteredAvailableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailableTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Badges Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {test.order ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#0F4336] text-[#C5A059] border border-[#C5A059]/40">
                            Test #{String(test.order).padStart(2, "0")}
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {test.test_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0F4336]/10 text-[#0F4336]">
                          {test.branch}
                        </span>
                        {test.is_new && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Available Now</span>
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {test.title}
                    </h3>

                    <div className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                      {test.subject} &bull; {test.topic}
                    </div>

                    {/* Quick Specs Chips */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3 text-slate-400 shrink-0" />
                        <span><strong>{test.total_questions}</strong> Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="size-3 text-slate-400 shrink-0" />
                        <span><strong>{test.total_marks}</strong> Total Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-slate-400 shrink-0" />
                        <span><strong>{test.duration_minutes}</strong> Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="size-3 text-slate-400 shrink-0" />
                        <span>Neg: <strong>{test.negative_marking}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Row */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleStartTest(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0F4336] hover:bg-[#152E4D] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="size-3.5 fill-current text-[#C5A059]" />
                      <span>Start Proctored CBT Exam</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
              <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="size-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-slate-900">No Tests Available Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                New tests will appear here automatically when published by the administrator.
              </p>
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION D: UPCOMING TESTS (SCHEDULED IN FUTURE)
            ========================================================================= */}
        {upcomingTests.length > 0 && (
          <section aria-label="Upcoming Tests" className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-purple-700" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                Upcoming Tests ({upcomingTests.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between opacity-90"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {test.order ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#0F4336] text-[#C5A059] border border-[#C5A059]/40">
                            Test #{String(test.order).padStart(2, "0")}
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          {test.branch} &bull; {test.test_type}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        Scheduled
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{test.subject}</p>

                    <div className="mt-3.5 p-3 rounded-xl bg-purple-50/40 border border-purple-100 space-y-1.5 text-xs text-purple-950">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Scheduled Date:</span>
                        <span className="font-bold">{test.scheduled_date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Start Time:</span>
                        <span className="font-bold">{test.start_time || "10:00 AM"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-semibold">{test.duration_minutes} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    {(user?.is_staff || user?.is_superuser || (user as any)?.role === 'admin' || (user as any)?.role === 'teacher') ? (
                      <button
                        type="button"
                        onClick={() => handleStartTest(test)}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                      >
                        <Play className="size-3.5 fill-current" />
                        <span>Start Test Now (Staff Early Access) &rarr;</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Lock className="size-3.5" />
                        <span>Unlocks on {test.scheduled_date} {test.start_time ? `(${test.start_time})` : ''}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION E: COMPLETED TESTS & PERFORMANCE REPORTS
            ========================================================================= */}
        {completedTests.length > 0 && (
          <section aria-label="Completed Tests" className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-blue-700" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                Completed Tests &amp; Performance Reports ({completedTests.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {test.order ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#0F4336] text-[#C5A059] border border-[#C5A059]/40">
                            Test #{String(test.order).padStart(2, "0")}
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {test.branch} &bull; {test.test_type}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {test.submitted_at || "Evaluated"}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{test.subject}</p>

                    {/* Result Pills */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 block uppercase font-bold">Score</span>
                        <span className="text-sm font-bold text-emerald-800">
                          {test.score} / {test.total_marks}
                        </span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                        <span className="text-[10px] text-blue-600 block uppercase font-bold">Accuracy</span>
                        <span className="text-sm font-bold text-blue-800">
                          {test.accuracy_percent ? `${test.accuracy_percent}%` : "—"}
                        </span>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                        <span className="text-[10px] text-purple-600 block uppercase font-bold">AIR Rank</span>
                        <span className="text-xs font-bold text-purple-800 leading-tight block mt-0.5">
                          {test.rank_achieved || "Rank Evaluated"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewResult(test.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#0F4336] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BarChart3 className="size-3.5 text-[#C5A059]" />
                      <span>View Result &amp; Solution Analysis</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION F: OTHER TEST SERIES (EXPLORE & ADD MORE)
            Distinct section for unpurchased series. Never mixed with active tests.
            ========================================================================= */}
        {otherSeries.length > 0 && (
          <section aria-label="Explore Other Test Series" className="space-y-4 pt-6 border-t border-slate-200">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                Explore More Test Series Packages
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Appearing for a second paper in GATE or adding full syllabus CBT mock packages? Enroll below for instant activation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherSeries.map((series) => (
                <div
                  key={series.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                        GATE {series.branch}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {series.duration}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">
                      {series.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {series.description}
                    </p>

                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                      <span>Proctored CBT Mocks &bull; National AIR</span>
                      <span className="font-bold text-slate-900">{series.total_tests} Tests</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Fee</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-slate-900">₹{Number(series.price).toLocaleString("en-IN")}</span>
                        <span className="text-xs text-slate-400 line-through">₹{series.original_price}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEnrollSeries(series)}
                      className="px-4 py-2 rounded-xl bg-[#0F4336] hover:bg-[#152E4D] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Enroll Series</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* =========================================================================
          RESULT & SOLUTION REVIEW MODAL (Detailed Explanations & Responses)
          ========================================================================= */}
      {viewingResultTestId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-[#FAF9F5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0F4336]/10 text-[#0F4336]">
                  Performance &amp; Solution Review
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {resultData?.title || "Examination Results"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewingResultTestId(null);
                  setResultData(null);
                }}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {loadingResult ? (
                <div className="p-12 text-center text-xs font-medium text-slate-400 animate-pulse">
                  Loading performance breakdown and solutions...
                </div>
              ) : resultData ? (
                <>
                  {/* Score Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total Score</span>
                      <div className="text-xl font-bold text-[#0F4336]">
                        {resultData.score} / {resultData.total_marks}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</span>
                      <div className="text-xl font-bold text-blue-700">
                        {resultData.accuracy_percent}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Correct / Incorrect</span>
                      <div className="text-xl font-bold text-slate-900">
                        {resultData.correct_count} / {resultData.incorrect_count}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Time Taken</span>
                      <div className="text-xl font-bold text-slate-900">
                        {Math.round(resultData.time_taken_seconds / 60)} Mins
                      </div>
                    </div>
                  </div>

                  {/* Question Solutions List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question-By-Question Solution Analysis ({resultData.questions.length})
                    </h4>

                    {resultData.questions.map((q) => {
                      const isCorrect = q.status === "CORRECT";
                      const isUnattempted = q.status === "UNATTEMPTED";

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">
                              Question #{q.question_number} &bull; {q.question_type} ({q.marks} Marks)
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                isCorrect
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isUnattempted
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              )}
                            >
                              {q.status} ({q.marks_awarded > 0 ? `+${q.marks_awarded}` : q.marks_awarded} M)
                            </span>
                          </div>

                          <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                            {q.question_text}
                          </p>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.option_a && (
                              <div className={cn(
                                "p-2 rounded-lg border",
                                q.correct_answer.includes("A") ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold" : "border-slate-200 text-slate-700",
                                q.student_answer.includes("A") && !q.correct_answer.includes("A") && "border-rose-400 bg-rose-50/50 text-rose-900"
                              )}>
                                (A) {q.option_a}
                              </div>
                            )}
                            {q.option_b && (
                              <div className={cn(
                                "p-2 rounded-lg border",
                                q.correct_answer.includes("B") ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold" : "border-slate-200 text-slate-700",
                                q.student_answer.includes("B") && !q.correct_answer.includes("B") && "border-rose-400 bg-rose-50/50 text-rose-900"
                              )}>
                                (B) {q.option_b}
                              </div>
                            )}
                            {q.option_c && (
                              <div className={cn(
                                "p-2 rounded-lg border",
                                q.correct_answer.includes("C") ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold" : "border-slate-200 text-slate-700",
                                q.student_answer.includes("C") && !q.correct_answer.includes("C") && "border-rose-400 bg-rose-50/50 text-rose-900"
                              )}>
                                (C) {q.option_c}
                              </div>
                            )}
                            {q.option_d && (
                              <div className={cn(
                                "p-2 rounded-lg border",
                                q.correct_answer.includes("D") ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold" : "border-slate-200 text-slate-700",
                                q.student_answer.includes("D") && !q.correct_answer.includes("D") && "border-rose-400 bg-rose-50/50 text-rose-900"
                              )}>
                                (D) {q.option_d}
                              </div>
                            )}
                          </div>

                          {/* Student Answer vs Correct */}
                          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                            <span>Your Answer: <strong>{q.student_answer || "Unattempted"}</strong></span>
                            <span>Correct Answer: <strong className="text-emerald-700">{q.correct_answer}</strong></span>
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-slate-800 leading-relaxed">
                              <strong className="text-amber-900 block mb-0.5">Faculty Explanation:</strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROCTORED CBT EXAM SIMULATION MODAL
          ========================================================================= */}
      {activeCbtTest && (
        <CbtProctoredExamModal
          test={activeCbtTest}
          user={user}
          isOpen={Boolean(activeCbtTest)}
          onClose={() => setActiveCbtTest(null)}
          onCompleted={() => {
            setActiveCbtTest(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* =========================================================================
          RAZORPAY CHECKOUT MODAL
          ========================================================================= */}
      <RazorpayCheckoutModal
        course={selectedCourseForCheckout}
        isOpen={checkoutModalOpen}
        isTestSeries={true}
        onClose={() => {
          setCheckoutModalOpen(false);
          setSelectedCourseForCheckout(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
