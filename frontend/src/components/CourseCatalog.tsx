"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import CourseCard, { type Course } from "./CourseCard";
import { useAdvisor } from "@/context/AdvisorContext";
import { Search, X, MapPin, ArrowRight, RotateCcw } from "lucide-react";

interface DisciplineOption {
  label: string;
  code: string;
  badge?: string;
  fullTitle: string;
}

const disciplines: DisciplineOption[] = [
  { label: "All Programs", code: "", badge: "14", fullTitle: "All Academic Streams & Cohorts" },
  { label: "Computer Science & IT", code: "CSE", badge: "CSE", fullTitle: "Computer Science & Information Tech" },
  { label: "Data Science & AI", code: "DA", badge: "DA", fullTitle: "Data Science & Artificial Intelligence" },
  { label: "Civil Engineering", code: "CE", badge: "CE", fullTitle: "Civil Engineering" },
  { label: "Mechanical Engineering", code: "ME", badge: "ME", fullTitle: "Mechanical Engineering" },
  { label: "Chemistry & Chemical", code: "CY", badge: "CY/CH", fullTitle: "GATE Chemistry & Chemical Engineering" },
  { label: "Electrical & Electronics", code: "EE", badge: "EE/EC", fullTitle: "Electrical & Electronics Engineering" },
];

interface CourseCatalogProps {
  initialCourses: Course[];
  initialSearch: string;
}

export default function CourseCatalog({
  initialCourses,
  initialSearch,
}: CourseCatalogProps) {
  const { openAdvisor } = useAdvisor();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(() => {
    if (!initialSearch) return "";
    const matched = disciplines.find(
      (d) => d.code && d.code.toLowerCase() === initialSearch.toLowerCase()
    );
    return matched ? matched.code : "";
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter courses based on smart ranked real-time instant search
  const filteredCourses = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const disc = selectedDiscipline.toLowerCase().trim();

    // Generic words to ignore for 1-2 letter prefix matches so 'c' matches CSE, Civil, Chemical, etc.
    const GENERIC_FILLER_WORDS = new Set([
      "gate",
      "course",
      "cohort",
      "complete",
      "comprehensive",
      "master",
      "masterclass",
      "program",
      "batch",
      "class",
      "all",
      "the",
      "and",
      "for",
      "with",
      "university",
    ]);

    // 1. If user typed in search box: search globally across all programs with tiered ranking
    if (q) {
      const tier1: Course[] = [];
      const tier2: Course[] = [];

      for (const course of initialCourses) {
        const title = (course.title || "").toLowerCase();
        const branch = (course.branch || "").toLowerCase();
        const branchDisplay = (course.branch_display || "").toLowerCase();
        const exam = (course.exam_name || "").toLowerCase();
        const desc = (course.description || "").toLowerCase();

        // Meaningful subject/branch words (excludes filler words like 'course', 'cohort')
        const meaningfulWords = title
          .split(/[\s,()\/&-]+/)
          .filter((w) => w && !GENERIC_FILLER_WORDS.has(w));

        const exactBranch = branch === q;
        const branchMatch = branch.includes(q);
        const branchDisplayMatch = branchDisplay.includes(q);
        const wordStart = meaningfulWords.some((w) => w.startsWith(q));

        if (exactBranch || branchMatch || branchDisplayMatch || wordStart) {
          tier1.push(course);
        } else if (q.length >= 3 && (title.includes(q) || desc.includes(q) || exam.includes(q))) {
          tier2.push(course);
        }
      }

      // Merge and deduplicate
      const seen = new Set<number>();
      const results: Course[] = [];
      for (const c of [...tier1, ...tier2]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          results.push(c);
        }
      }
      return results;
    }

    // 2. If no search term, filter by selectedDiscipline
    if (disc) {
      return initialCourses.filter((course) => {
        if (disc === "cy") {
          return (
            (course.branch && (course.branch.toLowerCase().includes("cy") || course.branch.toLowerCase().includes("ch"))) ||
            (course.title && (course.title.toLowerCase().includes("chemist") || course.title.toLowerCase().includes("chemical"))) ||
            (course.exam_name && (course.exam_name.toLowerCase().includes("chemistry") || course.exam_name.toLowerCase().includes("chemical")))
          );
        } else if (disc === "ee") {
          return (
            (course.branch && (course.branch.toLowerCase().includes("ee") || course.branch.toLowerCase().includes("ece"))) ||
            (course.title && (course.title.toLowerCase().includes("electrical") || course.title.toLowerCase().includes("electronic")))
          );
        } else if (disc === "ce") {
          return (
            (course.branch && course.branch.toLowerCase() === "ce") ||
            (course.title && course.title.toLowerCase().includes("civil")) ||
            (course.exam_name && course.exam_name.toLowerCase().includes("civil"))
          );
        } else {
          const matchesBranch = course.branch && course.branch.toLowerCase().includes(disc);
          const matchesExam = course.exam_name && course.exam_name.toLowerCase().includes(disc);
          const matchesTitle = course.title.toLowerCase().includes(disc);
          return matchesBranch || matchesExam || matchesTitle;
        }
      });
    }

    // Default: return all
    return initialCourses;
  }, [initialCourses, searchTerm, selectedDiscipline]);

  const handleDisciplineClick = (code: string) => {
    setSelectedDiscipline(code);
    setSearchTerm("");
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedDiscipline("");
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut listener (/ or Ctrl+K to focus search input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeCategory = useMemo(() => {
    return disciplines.find((d) => d.code === selectedDiscipline) || disciplines[0];
  }, [selectedDiscipline]);

  return (
    <div className="academic-catalog-workspace">
      {/* ====================================================================
          1. CLEAN PRODUCTION SEARCH & STREAM DOCK (100% Real Human Web UI)
          ==================================================================== */}
      <section className="mb-7 rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
        {/* Top Row: Search Input + Dynamic Results Counter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 size-4.5 text-slate-400 pointer-events-none" />
            <input
              id="academic-search-input"
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedDiscipline) {
                  setSelectedDiscipline("");
                }
              }}
              placeholder="Search programs by branch (CSE, Civil, Mechanical...) or subject..."
              className="w-full h-11.5 pl-10.5 pr-10 text-[14.5px] font-medium text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0B192C] focus:ring-3 focus:ring-[#0B192C]/8 placeholder:text-slate-400 transition-all"
              aria-label="Search programs"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 size-5.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Right Side: Exact User Specification Counter */}
          <div className="shrink-0 h-11.5 px-4.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[13.5px] font-semibold text-slate-700 whitespace-nowrap">
            <span>
              Showing <strong className="font-extrabold text-[#0B192C]">{filteredCourses.length}</strong> out of{" "}
              <strong className="font-extrabold text-[#0B192C]">{initialCourses.length}</strong> results
            </span>
          </div>
        </div>

        {/* Bottom Row: Stream Discipline Filter Tabs */}
        <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filter Stream:
          </span>

          {disciplines.map((d) => {
            const isActive = selectedDiscipline === d.code && !searchTerm;
            return (
              <button
                key={d.label}
                type="button"
                onClick={() => handleDisciplineClick(d.code)}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0B192C] text-white border border-[#0B192C]"
                    : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300"
                }`}
              >
                <span>{d.label}</span>
                {d.badge && (
                  <span
                    className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {d.code === "" ? initialCourses.length : d.badge}
                  </span>
                )}
              </button>
            );
          })}

          {(selectedDiscipline || searchTerm) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-[#8C6D23] hover:text-[#0B192C] transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* ====================================================================
          2. COURSE RESULTS FEED DIRECTLY BELOW SEARCH CONSOLE (INSTANT VISIBILITY)
          ==================================================================== */}
      <section className="catalog-results-section mb-12" aria-label="Available Programs">
        <div className="catalog-results-header">
          <div className="crh-left">
            <h3 className="crh-title">Available Programs</h3>
            <p className="crh-subtitle">
              Displaying accredited GATE preparation curriculum for{" "}
              <strong>{activeCategory.fullTitle}</strong> ({filteredCourses.length}{" "}
              {filteredCourses.length === 1 ? "Program" : "Programs"})
            </p>
          </div>
          <div className="crh-right">
            <span className="crh-intake-badge">
              <span className="crh-intake-dot" />
              Limited Intake · Direct Faculty Attention
            </span>
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="catalog-courses-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="course-empty-state">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 className="empty-state-title">
              {selectedDiscipline || searchTerm
                ? `No active batches found for "${selectedDiscipline || searchTerm}"`
                : "No courses currently available"}
            </h3>
            <p className="empty-state-desc">
              SIMS GATE is actively updating upcoming batch schedules for this branch. You can reset your filters or chat directly with our counselors in Raipur on WhatsApp to enquire about upcoming start dates.
            </p>
            <div className="empty-state-actions">
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-secondary-outline"
              >
                View All Available Courses
              </button>
              <button
                type="button"
                onClick={() =>
                  openAdvisor(
                    `Upcoming Batches Inquiry for ${selectedDiscipline || searchTerm || "All Streams"}`
                  )
                }
                className="btn-whatsapp-outline"
              >
                <span>Talk to Admissions Advisor ↗</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
