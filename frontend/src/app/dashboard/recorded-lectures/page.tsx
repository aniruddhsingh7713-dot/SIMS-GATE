"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";
import {
  Play,
  Search,
  ChevronDown,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface LectureItem {
  id: number;
  title: string;
  subtitle: string;
  duration: string;
  date: string;
  videoUrl: string;
}

export default function RecordedLecturesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("");
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  const [subjects, setSubjects] = useState<Array<{ name: string; count: number }>>([]);
  const [lecturesData, setLecturesData] = useState<Record<string, LectureItem[]>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // 1. Fetch student enrollments
  useEffect(() => {
    async function loadEnrollments() {
      if (!user?.id) {
        setLoadingEnrollments(false);
        setLoadingContent(false);
        return;
      }
      try {
        setLoadingEnrollments(true);
        const res = await fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}&type=COURSE`);
        if (res.ok) {
          const data = await res.json();
          const list = data.enrollments || [];
          setEnrollments(list);
          if (list.length > 0) {
            setSelectedCourseSlug(list[0].course_slug || "");
          } else {
            setLoadingContent(false);
          }
        }
      } catch (err) {
        console.error("Failed to load enrollments in recorded lectures:", err);
      } finally {
        setLoadingEnrollments(false);
      }
    }
    loadEnrollments();
  }, [user]);

  // 2. Fetch course modules & real lectures for the student's enrolled course
  useEffect(() => {
    if (!selectedCourseSlug) return;

    async function loadCourseContent() {
      try {
        setLoadingContent(true);
        const userParam = user?.id ? `?user_id=${user.id}` : "";
        const res = await fetch(`http://127.0.0.1:8000/api/courses/${selectedCourseSlug}/${userParam}`);
        if (res.ok) {
          const data = await res.json();
          const modules = data.modules || [];

          if (modules.length > 0) {
            const newSubjects: Array<{ name: string; count: number }> = [];
            const newLecturesData: Record<string, LectureItem[]> = {};

            modules.forEach((mod: any, mIdx: number) => {
              const cleanName = mod.title.replace(/^Module\s+\d+:\s*/i, "").trim() || `Module ${mIdx + 1}`;
              const lecs = (mod.lectures || []).map((l: any, lIdx: number) => ({
                id: l.id || mIdx * 100 + lIdx,
                title: l.title,
                subtitle: mod.title,
                duration: l.duration || "1h 15m",
                date: l.is_preview_free ? "Free Preview Session" : "Classroom Archive",
                videoUrl: l.video_url || "https://www.youtube.com/embed/dQw4w9WgXcQ",
              }));

              newSubjects.push({
                name: cleanName,
                count: lecs.length,
              });

              newLecturesData[cleanName] = lecs;
            });

            setSubjects(newSubjects);
            setLecturesData(newLecturesData);
            if (newSubjects.length > 0) {
              setSelectedSubject(newSubjects[0].name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load course lectures:", err);
      } finally {
        setLoadingContent(false);
      }
    }

    loadCourseContent();
  }, [selectedCourseSlug, user]);

  const isStaffOrAdmin = Boolean(
    user?.is_staff ||
    user?.is_superuser ||
    user?.role === "admin" ||
    user?.role === "teacher"
  );
  const isUnenrolledStudent = !loadingEnrollments && enrollments.length === 0 && !isStaffOrAdmin;

  const currentLectures = lecturesData[selectedSubject] || (subjects.length > 0 && lecturesData[subjects[0].name]) || [];

  const filteredLectures = currentLectures.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------------
         HEADER WITH TITLE & CONTROLS
         -------------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EAE6DF]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D23] block">
            Academic Classroom Library
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B192C] tracking-tight mt-0.5">
            Recorded Lectures
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Access your course lectures, neatly organized by syllabus module and topic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Course Selector (if student has courses) */}
          {enrollments.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#64748B] font-semibold">Course:</span>
              <select
                value={selectedCourseSlug}
                onChange={(e) => setSelectedCourseSlug(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0B192C] focus:border-[#C5A059] focus:outline-none cursor-pointer font-medium"
              >
                {enrollments.map((enr) => (
                  <option key={enr.id} value={enr.course_slug}>
                    {enr.course_title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] hidden md:inline font-semibold">Subject</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0B192C] focus:border-[#C5A059] focus:outline-none cursor-pointer font-medium max-w-[200px]"
            >
              {subjects.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0B192C] focus:border-[#C5A059] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Course Banner Pill for Enrolled Course */}
      {enrollments.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-4 text-[#8C6D23]" />
            <span className="font-bold text-[#0B192C]">
              {enrollments.find((e) => e.course_slug === selectedCourseSlug)?.course_title || enrollments[0].course_title}
            </span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#64748B] font-medium">
              {enrollments[0].batch_name || "Active Batch"}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#15803D] bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 py-0.5 rounded-full">
            ● Full Syllabus Access
          </span>
        </div>
      )}

      {/* -------------------------------------------------------------
          LECTURE REPOSITORY (Protected by AcademicLockedOverlay)
          ------------------------------------------------------------- */}
      <AcademicLockedOverlay
        isLocked={isUnenrolledStudent}
        title="You haven't purchased any course yet"
        description="You haven't purchased any course yet. Classroom lecture recordings and theory sessions are for enrolled course scholars. If you purchased a Test Series, please visit the Test Portal."
      >
        <div className="space-y-6">
          {loadingContent ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#EAE6DF] text-xs text-[#64748B]">
              <div className="inline-block size-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="font-semibold text-[#0B192C]">Loading syllabus modules & lectures for your course...</p>
            </div>
          ) : (
            /* TWO-COLUMN LAYOUT: Subject Navigation + Video List */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Subject Navigation List */}
            <div className="md:col-span-4 lg:col-span-3 rounded-2xl bg-white border border-[#EAE6DF] p-2.5 shadow-2xs space-y-1">
              {subjects.map((sub) => {
                const isSelected = selectedSubject === sub.name;
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => setSelectedSubject(sub.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#1E3A2F] text-white shadow-2xs"
                        : "text-[#475569] hover:bg-[#FAF9F5] hover:text-[#0B192C]"
                    }`}
                  >
                    <span className="truncate pr-2">{sub.name}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {sub.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Lecture List */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-1.5 font-serif">
                  <span>{selectedSubject}</span>
                  <ChevronDown className="size-4 text-[#8C6D23]" />
                </h3>
                <span className="text-xs text-[#64748B]">
                  {filteredLectures.length} Lectures Available
                </span>
              </div>

              {filteredLectures.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white text-xs text-[#64748B]">
                  No lectures found matching &quot;{searchQuery}&quot; in {selectedSubject}.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLectures.map((lec) => (
                    <div
                      key={lec.id}
                      className="rounded-2xl bg-white border border-[#EAE6DF] p-3.5 sm:p-4 shadow-2xs hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        {/* Video Thumbnail Box */}
                        <div
                          onClick={() => setActiveVideoModal(lec.videoUrl)}
                          className="relative w-28 sm:w-36 aspect-video rounded-xl bg-[#0B192C] flex items-center justify-center shrink-0 cursor-pointer group overflow-hidden border border-[#CBD5E1]"
                        >
                          <div className="size-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Play className="size-3.5 fill-current text-[#D4AF37]" />
                          </div>
                          <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white">
                            {lec.duration}
                          </span>
                        </div>

                        {/* Title & Topic */}
                        <div>
                          <h4 className="text-sm font-bold text-[#0B192C] leading-snug">
                            {lec.title}
                          </h4>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {lec.subtitle}
                          </p>
                          <span className="text-[11px] text-[#94A3B8] block mt-1">
                            {lec.date}
                          </span>
                        </div>
                      </div>

                      {/* Right: Watch Action Button */}
                      <button
                        type="button"
                        onClick={() => setActiveVideoModal(lec.videoUrl)}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[#0B192C] text-xs font-semibold hover:border-[#C5A059] hover:bg-[#FAF9F5] transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        <Play className="size-3 fill-current text-[#8C6D23]" />
                        <span>Watch Class</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </AcademicLockedOverlay>

      {/* Video Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={activeVideoModal}
              title="Classroom Lecture Recording"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-4 right-4 size-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
