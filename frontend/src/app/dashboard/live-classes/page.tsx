"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  User,
  Clock,
  MapPin,
  Bell,
  Play,
  FileText,
  Radio,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";

interface LiveLecture {
  id: number;
  course?: number;
  course_title?: string;
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
  notes_url?: string;
}

interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  branch: string;
  category: string;
  exam_name?: string;
}

export default function LiveClassesPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState<boolean>(true);

  // Enrolled courses & active selected course
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeCourse, setActiveCourse] = useState<EnrolledCourse | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  // Live class streams
  const [activeLiveClass, setActiveLiveClass] = useState<LiveLecture | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveLecture[]>([]);
  const [pastClasses, setPastClasses] = useState<LiveLecture[]>([]);

  // Video Player Modal State
  const [activeVideoModal, setActiveVideoModal] = useState<boolean>(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [activeModalTitle, setActiveModalTitle] = useState<string>("");

  const [remindersSet, setRemindersSet] = useState<Record<number, boolean>>({});

  const isStaffOrAdmin = Boolean(
    user?.is_staff ||
    user?.is_superuser ||
    user?.role === "admin" ||
    user?.role === "teacher"
  );

  // Fetch live lectures strictly filtered by user's enrolled course(s)
  useEffect(() => {
    let isCancelled = false;
    async function fetchLectures() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("user_id", String(user.id));
        if (selectedCourseId) {
          queryParams.append("course_id", String(selectedCourseId));
        }

        const res = await fetch(`http://127.0.0.1:8000/api/dashboard/live-lectures/?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setIsEnrolled(Boolean(data.is_enrolled));
            setEnrolledCourses(data.enrolled_courses || []);
            setActiveCourse(data.active_course || null);
            if (!selectedCourseId && data.active_course?.id) {
              setSelectedCourseId(data.active_course.id);
            }
            setActiveLiveClass(data.active_live_class || null);
            setUpcomingClasses(data.upcoming_classes || []);
            setPastClasses(data.past_classes || []);
          }
        }
      } catch (err) {
        console.error("Failed to load live classes:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchLectures();
    return () => {
      isCancelled = true;
    };
  }, [user, selectedCourseId]);

  const toggleReminder = (id: number) => {
    setRemindersSet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenStream = (lecture: LiveLecture) => {
    setSelectedVideoUrl(lecture.embed_video_url || lecture.video_url);
    setActiveModalTitle(`${lecture.subject}: ${lecture.title}`);
    setActiveVideoModal(true);
  };

  const isAccessLocked = !loading && !isEnrolled && !isStaffOrAdmin;

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------------
         HEADER SECTION: Clean typography, no wrapping, enrolled course identity
         -------------------------------------------------------------------------- */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Live Interactive Classes
              </h1>
              {activeCourse && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  {activeCourse.title}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Faculty studio broadcasts, interactive doubt clearing & core syllabus live lectures.
            </p>
          </div>

          {/* If student has purchased more than 1 course, let them switch courses */}
          {enrolledCourses.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs sm:text-sm shrink-0">
              <span className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Course:
              </span>
              {enrolledCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeCourse?.id === c.id
                      ? "bg-[#15271E] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {c.title.split(":")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          PROTECTED STREAMS (Active enrollment required)
          -------------------------------------------------------------------------- */}
      <AcademicLockedOverlay
        isLocked={isAccessLocked}
        title="You haven't purchased any course yet"
        description="You haven't purchased any course yet. Live interactive classes are for enrolled course scholars. If you purchased a Test Series, please visit the Test Portal."
      >
        <div className="space-y-6">
          {/* FEATURED LIVE STREAM BANNER: Displayed only when faculty is actively broadcasting */}
          {activeLiveClass ? (
            <div className="rounded-2xl bg-white border-2 border-red-500 shadow-md p-6 sm:p-7 relative overflow-hidden bg-gradient-to-r from-red-50/30 via-white to-white">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white tracking-wide shadow-xs animate-pulse">
                    <span className="size-2 rounded-full bg-white" />
                    LIVE BROADCAST NOW
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {activeLiveClass.course_title || activeCourse?.title || "Enrolled Session"}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {activeLiveClass.room_or_mode || "Raipur Studio 1 · Live Interactive"}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-4">
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    {activeLiveClass.subject}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {activeLiveClass.title}
                  </h2>
                  {activeLiveClass.description && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {activeLiveClass.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm pt-1">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <Clock className="size-4 text-amber-600" />
                      {activeLiveClass.scheduled_time} ({activeLiveClass.duration})
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
                      <User className="size-4 text-slate-500" />
                      {activeLiveClass.faculty_name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenStream(activeLiveClass)}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-bold transition-all cursor-pointer shrink-0 shadow-md hover:shadow-lg"
                >
                  <Play className="size-5 fill-current text-white" />
                  <span>Join Live Classroom</span>
                </button>
              </div>
            </div>
          ) : (
            /* PROFESSIONAL STUDIO STANDBY CARD (Replaces the ugly code jargon banner) */
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <Radio className="size-6 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Live Broadcast Offline
                      </span>
                      {activeCourse && (
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Cohort: {activeCourse.title}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-1.5">
                      No live broadcast currently in session
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                      {upcomingClasses.length > 0
                        ? `Next interactive studio lecture: "${upcomingClasses[0].title}" on ${upcomingClasses[0].scheduled_time}.`
                        : "Faculty live streams are conducted as per the academic schedule. Review scheduled lectures below or explore recorded session archives."}
                    </p>
                  </div>
                </div>

                {upcomingClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleReminder(upcomingClasses[0].id)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all shrink-0 cursor-pointer"
                  >
                    <Bell className="size-4 text-amber-600" />
                    <span>{remindersSet[upcomingClasses[0].id] ? "Reminder Scheduled" : "Notify When Live"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------------
             SCHEDULE TABS: Scheduled Upcoming vs Recorded Archive
             -------------------------------------------------------------------------- */}
          <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 transition-colors cursor-pointer relative ${
                activeTab === "upcoming"
                  ? "text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Scheduled Live Sessions ({upcomingClasses.length})</span>
              {activeTab === "upcoming" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-3 transition-colors cursor-pointer relative ${
                activeTab === "past"
                  ? "text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Recorded Session Archives ({pastClasses.length})</span>
              {activeTab === "past" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
              )}
            </button>
          </div>

          {/* --------------------------------------------------------------------------
             LECTURE ITEMS LIST
             -------------------------------------------------------------------------- */}
          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">
              <div className="inline-block size-5 border-2 border-[#15271E] border-t-transparent rounded-full animate-spin mr-2" />
              Loading live lecture schedule...
            </div>
          ) : activeTab === "upcoming" ? (
            <div className="space-y-4">
              {upcomingClasses.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <p className="font-semibold text-slate-800">
                    No upcoming live classes scheduled for this cohort right now.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Academic coordinators publish new schedule updates weekly.
                  </p>
                </div>
              ) : (
                upcomingClasses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {item.subject}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {item.target_exam || activeCourse?.title || "Academic Program"}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Clock className="size-4 text-amber-600" />
                          {item.scheduled_time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="size-4 text-slate-400" />
                          {item.faculty_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-4 text-slate-400" />
                          {item.room_or_mode || "Raipur Studio"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleReminder(item.id)}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                          remindersSet[item.id]
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <Bell className="size-4 text-amber-600" />
                        <span>{remindersSet[item.id] ? "Reminder Set" : "Remind Me"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenStream(item)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#15271E] text-white text-sm font-bold hover:bg-[#1E3A2F] transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="size-4 fill-current text-[#D4AF37]" />
                        <span>Enter Lobby</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pastClasses.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <p className="font-semibold text-slate-800">No recorded archives available for this program yet.</p>
                </div>
              ) : (
                pastClasses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.subject}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Duration: {item.duration}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <User className="size-4 text-slate-400" />
                          {item.faculty_name}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="size-4 text-amber-600" />
                          {item.scheduled_time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.notes_url && item.notes_url !== "#" && (
                        <a
                          href={item.notes_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
                        >
                          <FileText className="size-4 text-slate-500" />
                          <span>Lecture Notes</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenStream(item)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#15271E] text-white text-sm font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="size-4 fill-current text-[#D4AF37]" />
                        <span>Watch Recording</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </AcademicLockedOverlay>

      {/* --------------------------------------------------------------------------
         VIDEO PLAYER MODAL
         -------------------------------------------------------------------------- */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveVideoModal(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#15271E] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#1E3A2F]">
              <div className="flex items-center gap-3">
                {activeLiveClass && selectedVideoUrl.includes(activeLiveClass.video_url.slice(-8)) && (
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
                title="Classroom Video Player"
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
