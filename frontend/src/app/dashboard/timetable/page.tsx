"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText,
  Award,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";

interface AvailableWeek {
  week_number: number;
  label: string;
  short_label: string;
  date_range: string;
  is_current: boolean;
}

interface DayMeta {
  key: string;
  label: string;
  date: string;
}

interface TimeSlotMeta {
  start_time: string;
  end_time: string;
  label: string;
  order: number;
}

interface CategoryMeta {
  key: string;
  label: string;
  color: string;
}

interface TimetableSlot {
  id: number;
  week_number: number;
  day: string;
  day_display: string;
  order: number;
  start_time: string;
  end_time: string;
  time_slot_label: string;
  slot_type: "CLASS" | "SELF_STUDY" | "CBT_TEST";
  slot_type_display: string;
  category: string;
  category_display: string;
  subject: string;
  subtitle: string;
  faculty_name: string;
  room_or_mode: string;
  branch: string;
  batch_code: string;
  topic_description: string;
  slot_date: string;
  is_active: boolean;
}

interface TimetablePayload {
  current_week: number;
  date_range: string;
  batch_code: string;
  branch_badge: string;
  motto_badge: string;
  available_weeks: AvailableWeek[];
  days: DayMeta[];
  time_slots: TimeSlotMeta[];
  categories: CategoryMeta[];
  slots: TimetableSlot[];
  results?: TimetableSlot[];
  count: number;
}

const BRANCH_OPTIONS = [
  { code: "CSE", name: "CS & IT" },
  { code: "DA", name: "Data Science & AI" },
  { code: "CE", name: "Civil" },
  { code: "ME", name: "Mechanical" },
  { code: "EE", name: "Electrical" },
  { code: "ECE", name: "Electronics" },
  { code: "CH", name: "Chemical" },
  { code: "CY", name: "Chemistry" },
  { code: "ALL", name: "All Streams" },
];

export default function TimetablePage() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [selectedBranch, setSelectedBranch] = useState<string>("CSE");
  const [timetableData, setTimetableData] = useState<TimetablePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState<string>("MON");
  const [generatedDate, setGeneratedDate] = useState<string>("");

  useEffect(() => {
    setGeneratedDate(
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // Check student enrollments from backend
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [isTestSeriesOnlyBackend, setIsTestSeriesOnlyBackend] = useState<boolean>(false);

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
          if (data.is_test_series_only) {
            setIsTestSeriesOnlyBackend(true);
          }
        }
      } catch (err) {
        console.error("Failed to load student enrollments in timetable:", err);
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

  const studentEnrolledBranches = useMemo(() => {
    if (isStaffOrAdmin) return BRANCH_OPTIONS;
    const codes = new Set<string>();
    enrollments.forEach((e) => {
      const b = (e.branch || e.course_category || e.course_title || "").toUpperCase();
      for (const opt of BRANCH_OPTIONS) {
        if (opt.code === "ALL") continue;
        if (b.includes(opt.code) || b.includes(opt.name.toUpperCase())) {
          codes.add(opt.code);
        }
      }
    });
    if (user?.target_branch) {
      const tb = user.target_branch.toUpperCase();
      for (const opt of BRANCH_OPTIONS) {
        if (opt.code === "ALL") continue;
        if (tb.includes(opt.code)) {
          codes.add(opt.code);
        }
      }
    }
    const filtered = BRANCH_OPTIONS.filter((opt) => codes.has(opt.code));
    return filtered.length > 0 ? filtered : [{ code: "CH", name: "Chemical" }];
  }, [enrollments, isStaffOrAdmin, user]);

  const isTestSeriesOnly = useMemo(() => {
    if (isStaffOrAdmin || enrollments.length === 0) return false;
    return enrollments.every((e) => e.enrollment_type === "TEST_SERIES");
  }, [enrollments, isStaffOrAdmin]);

  // Synchronize selectedBranch with student's actual enrolled discipline
  useEffect(() => {
    if (!isStaffOrAdmin && studentEnrolledBranches.length > 0) {
      setSelectedBranch(studentEnrolledBranches[0].code);
    }
  }, [studentEnrolledBranches, isStaffOrAdmin]);

  const isUnenrolledStudent = (!loadingEnrollments && enrollments.length === 0 && !isStaffOrAdmin) || isTestSeriesOnly || isTestSeriesOnlyBackend;

  // Fetch timetable dynamically from backend API whenever currentWeek or selectedBranch changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchTimetable() {
      setLoading(true);
      try {
        const branchParam = selectedBranch ? `&branch=${selectedBranch}` : "";
        const res = await fetch(`http://127.0.0.1:8000/api/dashboard/timetable/?week=${currentWeek}${branchParam}`);
        if (res.ok) {
          const data: TimetablePayload = await res.json();
          if (!isCancelled) {
            setTimetableData(data);
          }
        }
      } catch (err) {
        console.error("Failed to load timetable from backend:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    fetchTimetable();
    return () => {
      isCancelled = true;
    };
  }, [currentWeek, selectedBranch]);

  const availableWeeks = timetableData?.available_weeks || [];
  const currentWeekIdx = availableWeeks.findIndex((w) => w.week_number === currentWeek);
  const isFirstWeek = currentWeekIdx <= 0;
  const isLastWeek = currentWeekIdx >= availableWeeks.length - 1;

  const handlePrevWeek = () => {
    if (!isFirstWeek && availableWeeks[currentWeekIdx - 1]) {
      setCurrentWeek(availableWeeks[currentWeekIdx - 1].week_number);
    }
  };

  const handleNextWeek = () => {
    if (!isLastWeek && availableWeeks[currentWeekIdx + 1]) {
      setCurrentWeek(availableWeeks[currentWeekIdx + 1].week_number);
    }
  };

  const days = timetableData?.days || [];
  const timeSlots = timetableData?.time_slots || [];
  const slots = timetableData?.slots || [];

  const getSlotForDayAndTime = (dayKey: string, timeSlot: TimeSlotMeta) => {
    return slots.find(
      (s) =>
        s.day === dayKey &&
        ((s.order && s.order === timeSlot.order) ||
          s.start_time.trim().toLowerCase() === timeSlot.start_time.trim().toLowerCase())
    );
  };

  // High-contrast, easy-to-read category styling
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "ALGO_DSA":
        return {
          bg: "bg-[#F3FAF5]",
          borderLeft: "border-l-4 border-l-[#15803D]",
          badgeBg: "bg-[#DCFCE7] text-[#15803D]",
          label: "ALGORITHMS & DSA",
        };
      case "TOC_DISCRETE":
        return {
          bg: "bg-[#FFFBF2]",
          borderLeft: "border-l-4 border-l-[#D97706]",
          badgeBg: "bg-[#FEF3C7] text-[#B45309]",
          label: "TOC & DISCRETE",
        };
      case "SYSTEMS_NETWORKS":
        return {
          bg: "bg-[#F2F7FF]",
          borderLeft: "border-l-4 border-l-[#2563EB]",
          badgeBg: "bg-[#DBEAFE] text-[#1D4ED8]",
          label: "SYSTEMS & NETWORKS",
        };
      case "MATHS":
        return {
          bg: "bg-[#FAF5FF]",
          borderLeft: "border-l-4 border-l-[#9333EA]",
          badgeBg: "bg-[#F3E8FF] text-[#7E22CE]",
          label: "MATHEMATICS",
        };
      case "APTITUDE":
        return {
          bg: "bg-[#FFF1F6]",
          borderLeft: "border-l-4 border-l-[#DB2777]",
          badgeBg: "bg-[#FCE7F3] text-[#BE185D]",
          label: "APTITUDE",
        };
      default:
        return {
          bg: "bg-[#FAFAF9]",
          borderLeft: "border-l-4 border-l-stone-400",
          badgeBg: "bg-stone-100 text-stone-700",
          label: "CLASS",
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const studentName = user?.first_name || user?.username || "Enrolled Scholar";

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------------------
          PRINT-ONLY OFFICIAL HEADER (Clean, no long full-form of SIMS)
          ------------------------------------------------------------- */}
      <div className="hidden print:block pb-3 border-b-2 border-[#0B192C] mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg border border-stone-300 p-1 flex items-center justify-center shrink-0">
              <Image
                src="/sims-logo.png"
                alt="SIMS Raipur Logo"
                width={38}
                height={38}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#0B192C] leading-none">
                SIMS GATE Timetable
              </h1>
              <p className="text-[9pt] text-stone-600 font-semibold mt-1">
                Weekly Class Schedule · {timetableData?.branch_badge || "CSE | BATCH - GATE 2027"}
              </p>
            </div>
          </div>
          <div className="text-right text-[8pt] text-stone-700 border-l border-stone-300 pl-4 leading-tight">
            <div suppressHydrationWarning><strong>Scholar:</strong> {studentName}</div>
            <div><strong>Batch:</strong> {timetableData?.batch_code || "STH6-2026-CSE-A1(B)"}</div>
            <div><strong>Week:</strong> {timetableData?.date_range}</div>
            <div suppressHydrationWarning><strong>Date:</strong> {generatedDate}</div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SCREEN TOP HEADER & CONTROLS (Clean, Direct, Intuitive)
          ------------------------------------------------------------- */}
      <AcademicLockedOverlay
        isLocked={isUnenrolledStudent}
        title="You haven't purchased any course yet"
        description="You haven't purchased any course yet. Active classroom course enrollment is required to view your weekly lecture timetable, room assignments, and faculty schedules. If you purchased a Test Series, please visit the Test Portal."
      >
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Left Brand + Title */}
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#0B192C] border border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <Image
                src="/sims-logo.png"
                alt="SIMS Raipur Logo"
                width={38}
                height={38}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  SIMS GATE Timetable
                </h1>
                <span className="text-slate-300">|</span>
                <span className="font-sans text-base sm:text-lg font-bold text-slate-700">
                  Weekly Schedule
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {timetableData?.branch_badge || "CSE | BATCH - GATE 2027"}
              </p>
            </div>
          </div>

          {/* Right Controls: Week Navigator + Print */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Week Selector / Prev & Next */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevWeek}
                disabled={isFirstWeek || loading}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3">
                <select
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(Number(e.target.value))}
                  disabled={loading}
                  className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer py-1"
                >
                  {availableWeeks.map((w) => (
                    <option key={w.week_number} value={w.week_number}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                disabled={isLastWeek || loading}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle for Mobile */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm">
              <button 
                onClick={() => setViewMode("week")}
                className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition cursor-pointer ${
                  viewMode === "week"
                    ? "bg-[#15271E] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode("day")}
                className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition cursor-pointer ${
                  viewMode === "day"
                    ? "bg-[#15271E] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Day
              </button>
            </div>

            {/* Print Official Timetable Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15271E] text-white text-sm font-bold hover:bg-[#1E3A2F] border border-[#C5A059]/40 transition-all shadow-xs cursor-pointer shrink-0"
              title="Print official academic timetable"
            >
              <Printer className="w-4 h-4 text-[#D4AF37]" />
              <span>Print Timetable</span>
            </button>
          </div>
        </div>

        {/* Branch Filter Row - strictly isolated to student's enrolled disciplines */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isStaffOrAdmin || studentEnrolledBranches.length > 1 ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isStaffOrAdmin ? "GATE Branch:" : "Your Enrolled Disciplines:"}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(isStaffOrAdmin ? BRANCH_OPTIONS : studentEnrolledBranches).map((b) => {
                    const isActive = selectedBranch === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBranch(b.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#15271E] text-[#D4AF37] shadow-xs border border-[#15271E]"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                        }`}
                      >
                        {b.code} <span className="opacity-70 text-[10px] font-medium hidden sm:inline">({b.name})</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                <span className="size-2 rounded-full bg-[#0F4336]" />
                <span>Enrolled Discipline: {studentEnrolledBranches[0]?.name || "Chemical Engineering"} ({studentEnrolledBranches[0]?.code || "CH"})</span>
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Active Schedule: <strong className="text-slate-800">{BRANCH_OPTIONS.find((b) => b.code === selectedBranch)?.name || selectedBranch}</strong>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs for Mobile Day View */}
      {viewMode === "day" && (
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
          {days.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg border text-center transition cursor-pointer ${
                selectedDay === d.key
                  ? "bg-[#15271E] text-white border-[#15271E] shadow-2xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <div className="text-xs font-bold">{d.label}</div>
              <div className={`text-[11px] ${selectedDay === d.key ? "text-[#D4AF37]" : "text-stone-500"}`}>
                {d.date}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Test Series Candidate Notice (if user is enrolled only in CBT Test Series) */}
      {isTestSeriesOnly ? (
        <div className="bg-white border border-[#E5E0D8] rounded-3xl p-8 text-center max-w-2xl mx-auto my-6 shadow-xs">
          <div className="size-14 rounded-2xl bg-[#0B192C] text-[#C5A059] flex items-center justify-center mx-auto mb-4">
            <Award className="size-7" />
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#C5A059]/20 text-[#8C6D23] uppercase tracking-wider">
            CBT Test Series Account · {studentEnrolledBranches[0]?.name || "Chemical Engineering"}
          </span>
          <h3 className="font-serif text-2xl font-bold text-slate-900 mt-3">
            Proctored CBT Mock Test Series
          </h3>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
            You are enrolled in the <strong>{enrollments[0]?.course_title || "GATE CBT Test Series"}</strong>. Daily classroom lecture batches and studio broadcast timetables are for Full-Year Classroom &amp; Online Cohorts. Your proctored full-length mocks, sectional tests, and virtual calculator simulator are ready on the Test Portal.
          </p>
          <div className="mt-6">
            <Link
              href="/test-series"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] hover:bg-[#0F4336] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <Play className="size-4 fill-current" />
              <span>Go to CBT Mock Test Portal &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
      /* -------------------------------------------------------------
          MAIN TIMETABLE GRID (Clean, Unambiguous, High-Legibility)
          ------------------------------------------------------------- */
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="py-12 text-center text-sm font-bold text-[#15271E]">
            <div className="inline-block w-4 h-4 border-2 border-[#15271E] border-t-transparent rounded-full animate-spin mr-2" />
            Loading Week {currentWeek} Schedule...
          </div>
        )}

        {/* Week View Table */}
        {!loading && viewMode === "week" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] print:min-w-0 print:w-full print:table-fixed">
              
              {/* Header Row */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 text-xs">
                  {/* TIME SLOT Header */}
                  <th className="py-3 px-3.5 w-36 print:w-[13%] border-r border-slate-200 align-middle">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-xs print:text-[8pt]">
                      <Clock className="w-4 h-4 text-amber-700 print:hidden" />
                      <span>TIME SLOT</span>
                    </div>
                  </th>

                  {/* Day Column Headers */}
                  {days.map((d) => (
                    <th key={d.key} className="py-3 px-3.5 border-r border-slate-200 last:border-r-0 align-middle print:w-[14.5%]">
                      <div className="font-bold text-[#15271E] text-sm print:text-[8.5pt]">{d.label}</div>
                      <div className="text-xs print:text-[7.5pt] text-slate-500 font-semibold">{d.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Rows */}
              <tbody className="divide-y divide-slate-200 text-xs">
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot.order} className="hover:bg-slate-50/50 transition">
                    
                    {/* Time Slot Label Cell */}
                    <td className="py-3.5 px-3.5 border-r border-slate-200 bg-slate-50/60 align-top">
                      <div className="font-bold text-slate-900 text-sm print:text-[8pt]">
                        {timeSlot.start_time}
                      </div>
                      <div className="text-xs print:text-[7pt] text-slate-600 font-semibold mt-0.5">
                        to {timeSlot.end_time}
                      </div>
                      <div className="mt-2 text-xs print:text-[6.5pt] uppercase font-bold tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        {timeSlot.label}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {days.map((day) => {
                      const slot = getSlotForDayAndTime(day.key, timeSlot);

                      // Case 1: Self-Study Slot (Unmistakable & Simple)
                      if (!slot || slot.slot_type === "SELF_STUDY") {
                        return (
                          <td 
                            key={day.key} 
                            className="p-2 border-r border-slate-200 last:border-r-0 align-top bg-slate-50/30 text-center"
                          >
                            <div className="h-full min-h-[90px] print:min-h-0 flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-200 text-slate-500 select-none print:border-none print:p-1">
                              <BookOpen className="w-4 h-4 text-slate-400 print:hidden mb-1" />
                              <span className="text-xs print:text-[7.5pt] font-semibold text-slate-600">
                                Self-Study & Revision
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Case 2: Saturday CBT Proctored Test (Clear & Bold)
                      if (slot.slot_type === "CBT_TEST") {
                        return (
                          <td 
                            key={day.key} 
                            className="p-2 border-r border-slate-200 last:border-r-0 align-top"
                          >
                            <div 
                              onClick={() => setSelectedSlot(slot)}
                              className="h-full min-h-[90px] print:min-h-0 flex flex-col justify-between p-3 rounded-xl border border-amber-300 border-l-4 border-l-amber-600 bg-amber-50/50 hover:bg-amber-100/50 transition cursor-pointer print:p-1 print:border-slate-300 print:bg-slate-50"
                            >
                              <div>
                                <span className="inline-block text-xs print:text-[6.5pt] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded mb-1">
                                  CBT TEST
                                </span>
                                <h4 className="font-bold text-sm print:text-[8pt] text-slate-900 leading-snug">
                                  {slot.subject}
                                </h4>
                                <p className="text-xs print:text-[7pt] text-slate-600 mt-0.5 font-medium">
                                  {slot.subtitle || slot.topic_description || "Real GATE Interface Exam"}
                                </p>
                              </div>

                              <div className="mt-2 pt-1 border-t border-amber-200 print:border-slate-300 text-xs print:text-[7pt] text-slate-600 font-semibold flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 print:hidden shrink-0" />
                                <span>{slot.faculty_name || "Test Administration Wing"}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Case 3: Standard Lecture Class (High Contrast, Readable, Zero Truncation)
                      const styles = getCategoryStyles(slot.category);

                      return (
                        <td 
                          key={day.key} 
                          className="p-2 border-r border-slate-200 last:border-r-0 align-top"
                        >
                          <div 
                            onClick={() => setSelectedSlot(slot)}
                            className={`h-full min-h-[90px] print:min-h-0 flex flex-col justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 transition cursor-pointer ${styles.bg} ${styles.borderLeft} print:p-1 print:border-slate-300 print:bg-white`}
                          >
                            <div>
                              <span className={`inline-block text-xs print:text-[6.5pt] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-1 ${styles.badgeBg}`}>
                                {styles.label}
                              </span>
                              <h4 className="font-bold text-sm print:text-[8pt] text-slate-900 leading-snug">
                                {slot.subject}
                              </h4>
                            </div>

                            <div className="mt-2 pt-1 border-t border-slate-200/80 print:border-slate-300 text-xs print:text-[7pt] text-slate-600 font-medium flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 print:hidden shrink-0" />
                              <span className="font-semibold text-slate-700">{slot.faculty_name}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Day View for Mobile screens */}
        {!loading && viewMode === "day" && (
          <div className="p-4 divide-y divide-slate-100">
            {timeSlots.map((ts) => {
              const slot = getSlotForDayAndTime(selectedDay, ts);
              if (!slot || slot.slot_type === "SELF_STUDY") {
                return (
                  <div key={ts.order} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-28 text-left">
                        <div className="font-bold text-sm text-slate-900">{ts.start_time}</div>
                        <div className="text-xs text-slate-500 font-medium">{ts.end_time}</div>
                      </div>
                      <div className="border-l border-slate-200 pl-3 flex items-center gap-2 text-slate-500 italic text-sm">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Self-Study & Revision</span>
                      </div>
                    </div>
                  </div>
                );
              }

              const styles = getCategoryStyles(slot.category);

              return (
                <div key={slot.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-28 text-left shrink-0">
                      <div className="font-bold text-sm text-slate-900">{slot.start_time}</div>
                      <div className="text-xs text-slate-500 font-medium">{slot.end_time}</div>
                      <span className={`inline-block mt-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles.badgeBg}`}>
                        {styles.label}
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <h3 className="font-bold text-base text-slate-900">{slot.subject}</h3>
                      {slot.topic_description && (
                        <p className="text-sm text-slate-600 mt-0.5">{slot.topic_description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{slot.faculty_name}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(slot)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-[#15271E] hover:text-white rounded-lg transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* -------------------------------------------------------------
            FOOTER BAR (Batch Code + Categories + LMS Note)
            ------------------------------------------------------------- */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-4 sm:px-6 text-sm text-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Batch Code */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Batch Code:</span>
            <span className="px-2.5 py-0.5 rounded-md border border-slate-300 bg-white font-mono text-xs font-bold text-slate-800">
              {timetableData?.batch_code || "STH6-2026-CSE-A1(B)"}
            </span>
          </div>

          {/* Category Dots Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            {timetableData?.categories?.map((cat) => (
              <span key={cat.key} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-semibold">{cat.label}</span>
              </span>
            ))}
          </div>

          {/* LMS Update Note */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <CalendarIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Classes may be subject to change. Check LMS for updates.</span>
          </div>
        </div>
      </div>
      )}
        </div>
      </AcademicLockedOverlay>

      {/* -------------------------------------------------------------
          DETAILED SLOT MODAL
          ------------------------------------------------------------- */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#15271E] text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#D4AF37] text-[#15271E]">
                  {selectedSlot.day_display} · {selectedSlot.start_time} - {selectedSlot.end_time}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-2">
                  {selectedSlot.subject}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSlot(null)}
                className="text-emerald-200/70 hover:text-white text-2xl leading-none font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700">
              {selectedSlot.topic_description && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    Topic & Syllabus Coverage
                  </div>
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedSlot.topic_description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                  <div className="text-xs uppercase font-bold text-slate-400">Faculty / Board</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedSlot.faculty_name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">Subject Specialist</div>
                </div>

                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                  <div className="text-xs uppercase font-bold text-slate-400">Academic Cohort</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedSlot.batch_code}</div>
                  <div className="text-slate-500 text-xs mt-0.5">Week {selectedSlot.week_number} Schedule</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
