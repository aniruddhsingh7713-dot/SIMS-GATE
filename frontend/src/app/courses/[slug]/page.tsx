"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Clock,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Play,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  User,
  X,
  Share2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import RazorpayCheckoutModal, { CheckoutCourse } from "@/components/RazorpayCheckoutModal";

interface LectureItem {
  id: number;
  title: string;
  duration: string;
  video_url: string;
  notes_pdf_url?: string;
  is_preview_free: boolean;
  is_locked: boolean;
  order: number;
}

interface ModuleItem {
  id: number;
  title: string;
  order: number;
  description?: string;
  lecture_count: number;
  lectures: LectureItem[];
}

interface CourseDetail {
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
  modules: ModuleItem[];
  is_enrolled?: boolean;
}

function CourseDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewLectureTitle, setPreviewLectureTitle] = useState("");
  const [isStudentEnrolled, setIsStudentEnrolled] = useState(false);

  // Load course details by slug
  useEffect(() => {
    async function fetchCourseDetail() {
      if (!slug) return;
      try {
        setLoading(true);
        const userParam = user?.id ? `?user_id=${user.id}` : "";
        const res = await fetch(`http://127.0.0.1:8000/api/courses/${slug}/${userParam}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);

          // Check enrollment status
          if (data.is_enrolled) {
            setIsStudentEnrolled(true);
          } else if (user?.id) {
            // Check student enrollments
            const enrollRes = await fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}`);
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const list = enrollData.enrollments || [];
              const enrolled = list.some((e: any) => e.course_slug === slug);
              setIsStudentEnrolled(enrolled);
            }
          }

          // Expand all modules by default
          if (data.modules && data.modules.length > 0) {
            const initialMap: Record<number, boolean> = {};
            data.modules.forEach((_: any, idx: number) => {
              initialMap[idx] = true;
            });
            setExpandedModules(initialMap);
          }
        }
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseDetail();
  }, [slug, user]);

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleOpenPreview = (lecture: LectureItem) => {
    if (lecture.video_url) {
      setPreviewLectureTitle(lecture.title);
      setPreviewVideoUrl(lecture.video_url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-32 px-4 py-16 space-y-6">
          <div className="h-10 w-2/3 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-6 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        <div className="max-w-3xl mx-auto pt-36 px-4 py-16 text-center space-y-4">
          <h2 className="font-serif text-3xl font-bold text-slate-900">Course Not Found</h2>
          <p className="text-sm text-slate-600">The program you are looking for does not exist or has been archived.</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#15271E] text-white text-sm font-bold"
          >
            Browse Course Catalog
          </Link>
        </div>
      </div>
    );
  }

  const formattedFee = Number(course.price).toLocaleString("en-IN");
  const featureList = course.features
    ? course.features.split(",").map((f) => f.trim())
    : [
        "150+ In-Depth Theory & Derivation Lectures",
        "Handwritten Ex-IITian Faculty Notes (PDF)",
        "15+ Years GATE Solved Question Bank",
        "Weekly Proctored CBT Mock Test Series",
        "Direct 1-on-1 Cabin Doubt Sessions in Raipur"
      ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* Course Detail Hero Masthead */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-[#15271E] via-[#1E3A2F] to-[#15271E] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title & Pedigree */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C378]">
                {course.category_display || course.category}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-slate-200">
                {course.exam_name}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-3xl font-light leading-relaxed">
              {course.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#C5A059]" />
                <span><strong>{course.duration || "12 Months"}</strong> Access</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-emerald-400" />
                <span><strong>{course.total_lectures || 140}+</strong> Lectures</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span><strong>{course.rating || "4.9"}</strong> Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-4 text-slate-400" />
                <span><strong>{course.students_enrolled || 1200}+</strong> Enrolled Scholars</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mini Highlight Card */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase">Admission Tuition</span>
              <span className="font-serif text-3xl font-extrabold text-[#E5C378]">
                ₹{formattedFee}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Includes full classroom coaching, online HD live access, notes, and weekly CBT mock tests.
            </p>

            {isStudentEnrolled ? (
              <Link
                href="/dashboard/courses"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                <span>Already Enrolled — Continue Learning</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F46] text-[#15271E] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Sparkles className="size-4" />
                <span>Enroll Now / Buy Now</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Page Layout: Curriculum & Sticky Checkout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: Modules & Curriculum (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Academic Curriculum Breakdown */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                    Course Curriculum <span className="font-sans font-semibold text-[#C5A059] mx-1">&amp;</span> Modules
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Structured syllabus broken down by subjects, derivations, and practice modules.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
                  {course.modules?.length || 0} Modules
                </span>
              </div>

              {/* Accordion Modules */}
              <div className="space-y-3.5 pt-2">
                {course.modules && course.modules.length > 0 ? (
                  course.modules.map((module, mIdx) => {
                    const isExpanded = expandedModules[mIdx] ?? true;
                    return (
                      <div
                        key={module.id || mIdx}
                        className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs transition-all"
                      >
                        {/* Module Header */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mIdx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="size-8 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                              M{module.order || mIdx + 1}
                            </span>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 leading-snug">
                                {module.title}
                              </h3>
                              <span className="text-xs text-slate-500">
                                {module.lectures?.length || 0} Lectures
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="size-5" />
                            ) : (
                              <ChevronRight className="size-5" />
                            )}
                          </div>
                        </button>

                        {/* Module Lectures List */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                            {module.lectures && module.lectures.length > 0 ? (
                              module.lectures.map((lec) => {
                                const isUnlocked = !lec.is_locked || isStudentEnrolled || lec.is_preview_free;
                                return (
                                  <div
                                    key={lec.id}
                                    className="p-4 sm:px-6 flex items-center justify-between gap-3 text-sm"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {lec.is_preview_free ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPreview(lec)}
                                          className="size-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                          title="Play Free Preview"
                                        >
                                          <Play className="size-3.5 fill-current" />
                                        </button>
                                      ) : isStudentEnrolled ? (
                                        <Link
                                          href={`/dashboard/courses`}
                                          className="size-7 rounded-lg bg-[#15271E] text-[#E5C378] flex items-center justify-center shrink-0"
                                        >
                                          <Play className="size-3.5 fill-current" />
                                        </Link>
                                      ) : (
                                        <span className="size-7 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                          <Lock className="size-3.5" />
                                        </span>
                                      )}

                                      <div>
                                        <span className="font-semibold text-slate-900 line-clamp-1 block">
                                          {lec.title}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          Duration: {lec.duration}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Badges / Actions */}
                                    <div className="shrink-0">
                                      {lec.is_preview_free ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPreview(lec)}
                                          className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                                        >
                                          Free Preview
                                        </button>
                                      ) : isStudentEnrolled ? (
                                        <span className="text-xs font-semibold text-emerald-700">
                                          Unlocked
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                                          <Lock className="size-3" />
                                          <span>Paid Only</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 text-xs text-slate-400 italic">
                                Lectures syllabus will unlock upon cohort commencement.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                    Curriculum outline is being finalized by faculty leads.
                  </div>
                )}
              </div>
            </section>

            {/* 2. What's Included / Program Features */}
            <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                What&apos;s Included in this Admission
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {featureList.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Sticky Checkout Box (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="rounded-3xl bg-white border-2 border-[#15271E] shadow-xl p-6 sm:p-7 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Course Enrollment
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-extrabold text-[#15271E]">
                    ₹{formattedFee}
                  </span>
                  <span className="text-xs text-slate-500">One-time Fee</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Validity &amp; Access:</span>
                  <strong className="text-slate-800">{course.duration || "12 Months"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Format:</span>
                  <strong className="text-slate-800">Classroom + Live + VOD</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Institute Center:</span>
                  <strong className="text-slate-800">Choubey Colony, Raipur</strong>
                </div>
              </div>

              {/* Primary CTA */}
              {isStudentEnrolled ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard/courses"
                    className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="size-5 text-emerald-200" />
                    <span>Already Enrolled — Open Course</span>
                  </Link>
                  <p className="text-center text-xs text-emerald-800 font-medium">
                    You have active admission access to this course.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(true)}
                    className="w-full py-4 rounded-2xl bg-[#15271E] hover:bg-[#1E3A2F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Sparkles className="size-4 text-[#C5A059]" />
                    <span>Enroll Now / Buy Now</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    Instant access unlocked upon Razorpay confirmation.
                  </p>
                </div>
              )}

              {/* Guarantee */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-amber-200/60 flex items-center gap-3 text-xs text-amber-950">
                <ShieldCheck className="size-5 text-[#C5A059] shrink-0" />
                <span>Verified by SIMS GATE Academic Senate. 100% syllabus benchmarked.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Free Preview Video Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
                  Free Preview
                </span>
                <span className="text-sm font-semibold truncate max-w-md">
                  {previewLectureTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={previewVideoUrl}
                title={previewLectureTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          price: course.price,
          duration: course.duration,
          category: course.category_display,
          exam_name: course.exam_name,
        }}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => setIsStudentEnrolled(true)}
      />
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <CourseDetailContent />
    </Suspense>
  );
}
