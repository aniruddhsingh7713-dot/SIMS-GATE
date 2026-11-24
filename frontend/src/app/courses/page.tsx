"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  BookOpen,
  Clock,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Filter,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import RazorpayCheckoutModal, { CheckoutCourse } from "@/components/RazorpayCheckoutModal";

interface CourseItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  category_display: string;
  branch: string;
  branch_display: string;
  exam_name: string;
  price: string | number;
  duration: string;
  total_lectures: number;
  rating: number | string;
  students_enrolled: number;
  thumbnail_url: string;
  features: string;
  is_active: boolean;
  is_enrolled?: boolean;
}

const CATEGORIES = [
  { key: "ALL", label: "All Programs", description: "All active academic disciplines" },
  { key: "GATE_CHEMISTRY", label: "GATE Chemistry", description: "Physical, Organic & Inorganic" },
  { key: "GATE_CSE", label: "GATE Computer Science & IT", description: "Algorithms, OS, TOC & Networks" },
  { key: "GATE_CH", label: "GATE Chemical Engineering", description: "CRE, Thermodynamics & Mass Transfer" },
  { key: "FOUNDATION_8_10", label: "Foundation (8th – 10th)", description: "Olympiad & NTSE Science" },
  { key: "SCHOOL_11_12", label: "School Science (11th & 12th)", description: "Board, JEE & NEET Foundation" },
  { key: "HIGHER_ED", label: "Higher Ed (B.Sc / M.Sc / CSIR NET)", description: "IIT JAM & Research JRF" },
  { key: "PHARMACY", label: "Pharmacy (GPAT / B.Pharm)", description: "Pharmacology & Formulations" },
  { key: "ENGINEERING", label: "Engineering (B.Tech / M.Tech)", description: "Core University Curricula" },
  { key: "RESEARCH", label: "Ph.D & Specialized Research", description: "Aptitude, Proposal & Interviews" },
];

export default function CourseCatalogPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<CheckoutCourse | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [enrolledCourseSlugs, setEnrolledCourseSlugs] = useState<Set<string>>(new Set());

  // Fetch courses and student active enrollments
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userParam = user?.id ? `?user_id=${user.id}` : "";

        // 1. Fetch courses
        const coursesRes = await fetch(`http://127.0.0.1:8000/api/courses/${userParam}`);
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const list: CourseItem[] = Array.isArray(data) ? data : data.results || [];
          setCourses(list);
        }

        // 2. Fetch student's actual enrollments from PostgreSQL
        if (user?.id) {
          const enrollRes = await fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}`);
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            const list = enrollData.enrollments || [];
            const slugs = new Set<string>();
            list.forEach((e: any) => {
              if (e.course_slug) slugs.add(e.course_slug);
            });
            setEnrolledCourseSlugs(slugs);
          }
        }
      } catch (err) {
        console.error("Failed to load course catalog:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Filtered courses based on category and search
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Category match
      if (activeCategory !== "ALL" && c.category !== activeCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = (c.description || "").toLowerCase().includes(q);
        const matchesExam = (c.exam_name || "").toLowerCase().includes(q);
        const matchesBranch = (c.branch || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesExam && !matchesBranch) {
          return false;
        }
      }

      return true;
    });
  }, [courses, activeCategory, searchQuery]);

  const handleOpenCheckout = (course: CourseItem) => {
    setSelectedCourseForCheckout({
      id: course.id,
      title: course.title,
      slug: course.slug,
      price: course.price,
      duration: course.duration,
      category: course.category_display,
      exam_name: course.exam_name,
    });
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = (courseSlug: string) => {
    setEnrolledCourseSlugs((prev) => new Set([...prev, courseSlug]));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* Catalog Hero Banner */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-[#15271E] via-[#1E3A2F] to-[#15271E] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-7xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-xs sm:text-sm font-semibold text-[#E5C378] tracking-wide uppercase">
            <GraduationCap className="size-4" />
            <span>Official Academic Course Catalog</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Rigorous Preparation for India&apos;s Toughest Examinations
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Choose from comprehensive GATE master courses, school science cohorts, higher education chemistry, and research programs taught by Ex-IITian faculty.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-1.5 border border-slate-200">
              <Search className="size-5 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Search courses by subject, exam (e.g. GATE Chemistry, Algorithms, Class 11th)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Category Filter Tabs (Horizontal Scrollable Frosted Glass Pills) */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="size-3.5 text-slate-600" />
            <span className="drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]">Select Program Category</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-[#0B192C] to-[#15271E] text-white border-white/20 shadow-sm"
                      : "bg-white/70 backdrop-blur-md text-slate-700 border-white/80 hover:bg-white/90 hover:border-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 relative z-10">
          <span className="text-sm font-semibold text-slate-600">
            Showing <strong className="text-slate-900">{filteredCourses.length}</strong> available course(s)
          </span>

          {activeCategory !== "ALL" && (
            <button
              onClick={() => setActiveCategory("ALL")}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Reset Category
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-96 rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-6 animate-pulse space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
                <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 space-y-4 relative z-10">
            <BookOpen className="size-12 text-slate-300 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-slate-800">
              No courses found for this selection
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Try choosing another category tab or clearing your search term to view all published programs.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("ALL");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B192C] to-[#15271E] text-white text-sm font-bold cursor-pointer shadow-sm"
            >
              View All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseSlugs.has(course.slug) || course.is_enrolled;
              const formattedFee = Number(course.price).toLocaleString("en-IN");

              return (
                <article
                  key={course.id}
                  className="group rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_-4px_rgba(11,25,44,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/95 hover:border-slate-300/80 hover:shadow-[0_16px_36px_-6px_rgba(11,25,44,0.1),inset_0_1px_1px_rgba(255,255,255,1)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 sm:p-6 space-y-4 flex-1">
                    {/* Official SIMS Emblem + Glassmorphic Program Header */}
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-10 rounded-xl bg-white/80 backdrop-blur-md border border-white/90 flex items-center justify-center p-1 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.04)]">
                          <Image
                            src="/sims-logo.png"
                            alt="SIMS Raipur Official Logo"
                            width={36}
                            height={36}
                            className="size-7 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]">
                              SIMS GATE
                            </span>
                            <span className="size-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-semibold text-emerald-700 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]">
                              Offline &amp; Live
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 truncate block font-medium">
                            {course.category_display || course.category}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-slate-700 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] shrink-0">
                        {course.exam_name}
                      </span>
                    </div>

                    {/* Course Title & Overview with Glassmorphism Typographic Effect */}
                    <div className="space-y-1.5 pt-0.5">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="font-sans text-[1.125rem] font-extrabold tracking-tight bg-gradient-to-br from-[#0B192C] via-[#102A43] to-[#1E3A5F] bg-clip-text text-transparent group-hover:from-[#0B192C] group-hover:to-[#B89047] transition-all line-clamp-2 leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] block"
                      >
                        {course.title}
                      </Link>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal drop-shadow-[0_0.5px_0_rgba(255,255,255,0.6)]">
                        {course.description}
                      </p>
                    </div>

                    {/* Frosted Glass Academic Delivery Stats */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 py-2.5 px-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-400 shrink-0" />
                        <span className="drop-shadow-[0_0.5px_0_rgba(255,255,255,0.7)]">
                          <strong>{course.duration || "12 Months"}</strong> Access
                        </span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-slate-400 shrink-0" />
                        <span className="drop-shadow-[0_0.5px_0_rgba(255,255,255,0.7)]">
                          <strong>{course.total_lectures || 140}+</strong> Lectures
                        </span>
                      </div>
                    </div>

                    {/* Rating & Institute Info */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Star className="size-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0.5px_0_rgba(0,0,0,0.05)]" />
                        <span className="font-bold text-slate-900 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]">
                          {course.rating || "4.9"}
                        </span>
                        <span className="text-slate-400 font-medium">
                          ({course.students_enrolled || 1200}+ scholars)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/70 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.7)]">
                        Raipur Center · Choubey Colony
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Frosted Glass Footer with Metallic/Glass Tuition Typography */}
                  <div className="px-5 sm:px-6 py-4 bg-white/50 backdrop-blur-md border-t border-white/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]">
                        Total Tuition
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-sans text-sm font-bold text-[#C5A059] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                          ₹
                        </span>
                        <span className="font-sans text-2xl font-black bg-gradient-to-b from-[#0B192C] to-[#1E293B] bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                          {formattedFee}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]"
                        title="View Detailed Syllabus & Preview Lectures"
                      >
                        Syllabus
                      </Link>

                      {isEnrolled ? (
                        <Link
                          href="/dashboard/courses"
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-200" />
                          <span>Continue</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(course)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B192C] to-[#15271E] hover:from-[#152E4D] hover:to-[#0B192C] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md border border-white/10"
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        course={selectedCourseForCheckout}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
