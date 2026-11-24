"use client";

import React, { useState, useEffect } from "react";
import { 
  HelpCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  UserCheck, 
  MapPin, 
  Plus, 
  Ticket, 
  Copy, 
  Share2, 
  Check, 
  Users, 
  Calendar, 
  Search,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";

interface DoubtQuery {
  id: number;
  student_name: string;
  subject: string;
  topic: string;
  query_text: string;
  faculty_assigned: string;
  status: "PENDING" | "IN_REVIEW" | "ANSWERED" | "SCHEDULED";
  status_display?: string;
  session_status?: "NOT_REQUESTED" | "PENDING_APPROVAL" | "ACCEPTED" | "REJECTED";
  session_status_display?: string;
  support_type?: "REGULAR" | "PERSONAL_FACULTY" | "WHATSAPP_GROUP";
  preferred_date?: string;
  preferred_time?: string;
  cabin_pass: string;
  reply_text: string;
  whatsapp_shared_intent?: boolean;
  created_at: string;
}

interface FacultySlot {
  id: number;
  faculty: number;
  faculty_name: string;
  faculty_qualification: string;
  day_name: string;
  date_str: string;
  time_slot: string;
  venue: string;
  is_available: boolean;
  notes: string;
}

interface WhatsAppConfig {
  group_name: string;
  group_invite_url: string;
  academic_desk_phone: string;
  academic_desk_url: string;
  guidelines: string[];
}

export default function DoubtSupportPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

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
        }
      } catch (err) {
        console.error("Failed to load enrollments in doubt support:", err);
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
  const isUnenrolledStudent = !loadingEnrollments && enrollments.length === 0 && !isStaffOrAdmin;

  const [queries, setQueries] = useState<DoubtQuery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAskModal, setShowAskModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [activeDoubt, setActiveDoubt] = useState<DoubtQuery | null>(null);

  // Form submission state
  const [subject, setSubject] = useState("Database Management Systems");
  const [topic, setTopic] = useState("");
  const [queryText, setQueryText] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("Prof. Aniruddh Singh (Ex-IITian)");
  const [submitting, setSubmitting] = useState(false);

  // Option A (1-on-1 Faculty Session)
  const [facultySlots, setFacultySlots] = useState<FacultySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [requestingSession, setRequestingSession] = useState(false);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState("");

  // Option B (WhatsApp)
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDoubts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/doubt-support/");
      if (res.ok) {
        const data = await res.json();
        setQueries(data.results || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch doubts from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultySlots = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/doubt-support/faculty-availability/");
      if (res.ok) {
        const data = await res.json();
        const slots: FacultySlot[] = data.results || data || [];
        setFacultySlots(slots);
        if (slots.length > 0) {
          setSelectedSlotId(slots[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch faculty slots:", err);
    }
  };

  const fetchWhatsAppConfig = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/doubt-support/config/");
      if (res.ok) {
        const data = await res.json();
        setWhatsappConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp config:", err);
    }
  };

  useEffect(() => {
    fetchDoubts();
    fetchFacultySlots();
    fetchWhatsAppConfig();
  }, []);

  // Submit new doubt
  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setSubmitting(true);
    try {
      const studentName = user?.first_name 
        ? `${user.first_name} ${user.last_name || ""}`.trim()
        : user?.username || "SIMS Student";

      const res = await fetch("http://127.0.0.1:8000/api/dashboard/doubt-support/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          subject,
          topic: topic.trim() || "General Concept",
          query_text: queryText,
          faculty_assigned: selectedFaculty,
          support_type: "REGULAR",
          status: "PENDING",
        }),
      });

      if (res.ok) {
        setShowAskModal(false);
        setTopic("");
        setQueryText("");
        fetchDoubts();
      }
    } catch (err) {
      console.error("Failed to submit doubt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Request 1-on-1 Session
  const handleRequestFacultySession = async () => {
    if (!activeDoubt) return;

    setRequestingSession(true);
    try {
      const slot = facultySlots.find((s) => s.id === selectedSlotId);
      const chosenDate = slot ? `${slot.day_name} (${slot.date_str})` : "Tomorrow";
      const chosenTime = slot ? slot.time_slot : "04:30 PM – 05:30 PM";
      const chosenFaculty = slot ? slot.faculty_name : selectedFaculty;

      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/doubt-support/${activeDoubt.id}/request-session/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_date: chosenDate,
          preferred_time: chosenTime,
          faculty_assigned: chosenFaculty,
        }),
      });

      if (res.ok) {
        setSessionSuccessMsg(`Cabin session requested for ${chosenDate} at ${chosenTime}! Your teacher will confirm.`);
        fetchDoubts();
        setTimeout(() => {
          setShowSessionModal(false);
          setSessionSuccessMsg("");
        }, 2500);
      }
    } catch (err) {
      console.error("Failed to request faculty session:", err);
    } finally {
      setRequestingSession(false);
    }
  };

  // WhatsApp Message
  const constructWhatsAppMessage = (doubt: DoubtQuery) => {
    const studentLabel = doubt.student_name || "SIMS GATE Student";
    return `Hello SIMS GATE Faculty,\n\n*Subject:* ${doubt.subject}\n*Topic:* ${doubt.topic}\n*Doubt:* ${doubt.query_text}\n\nCould you please help me clarify this concept?\n\n— ${studentLabel}`;
  };

  const handleCopyMessage = (doubt: DoubtQuery) => {
    const msg = constructWhatsAppMessage(doubt);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenGroup = (doubt: DoubtQuery) => {
    handleCopyMessage(doubt);
    const groupUrl = whatsappConfig?.group_invite_url || "https://chat.whatsapp.com/invite/SIMSGATE2026Doubts";
    window.open(groupUrl, "_blank", "noopener,noreferrer");
  };

  // Filter queries
  const filteredQueries = queries.filter((q) => {
    if (activeFilter === "PENDING" && q.status === "ANSWERED") return false;
    if (activeFilter === "RESOLVED" && q.status !== "ANSWERED") return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSubject = q.subject.toLowerCase().includes(query);
      const matchesTopic = q.topic.toLowerCase().includes(query);
      const matchesText = q.query_text.toLowerCase().includes(query);
      return matchesSubject || matchesTopic || matchesText;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AcademicLockedOverlay
        isLocked={isUnenrolledStudent}
        title="You haven't purchased any course yet"
        description="You haven't purchased any course yet. Faculty doubt cabins and cabin passes are for enrolled course scholars. If you purchased a Test Series, please visit the Test Portal."
      >
        <div className="space-y-6">
          {/* -------------------------------------------------------------
              TOP HERO: BIG TEXT, IMMEDIATE CLARITY, ZERO CONFUSION
              ------------------------------------------------------------- */}
          <div className="bg-white border-2 border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Doubt Support <span className="font-sans font-semibold text-[#C5A059] mx-1">&amp;</span> Helpdesk
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-2 leading-relaxed">
              Got stuck on any topic or GATE question? Ask your teachers below for clear explanations, or book a 1-on-1 private cabin discussion.
            </p>
          </div>

          {/* Big, Obvious Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setQueryText("");
                setShowAskModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-bold bg-[#15271E] text-white hover:bg-[#1E3A2F] rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-5 h-5 text-[#D4AF37]" />
              <span>Ask a Doubt</span>
            </button>

            <a
              href={whatsappConfig?.group_invite_url || "https://chat.whatsapp.com/invite/SIMSGATE2026Doubts"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-bold bg-[#25D366]/15 text-[#137333] hover:bg-[#25D366]/25 rounded-xl transition border border-[#25D366]/40 cursor-pointer"
            >
              <Users className="w-5 h-5 text-[#25D366]" />
              <span>WhatsApp Group</span>
            </a>
          </div>
        </div>

        {/* Clean, Simple Helper Bar */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center gap-6 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8C6D37] shrink-0" />
            <span><strong>Teacher Walk-in Hours:</strong> 04:30 PM – 07:30 PM Daily (Cabins 3A & 3B)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#15803D] shrink-0" />
            <span><strong>Average Reply Time:</strong> Usually answered within 3 hours</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FILTER TABS & SEARCH (SIMPLE, LARGE, READABLE)
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        
        {/* Simple Tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: "ALL", label: `All Doubts (${queries.length})` },
            { key: "PENDING", label: "Waiting for Answer" },
            { key: "RESOLVED", label: "Answered" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-[#15271E] text-white shadow-xs"
                  : "text-stone-700 hover:text-black hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your questions or topics..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15271E]"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------
          DOUBTS LIST: BIG FONTS, NO CONFUSING NESTED BOXES
          ------------------------------------------------------------- */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-2xl">
            <div className="inline-block w-5 h-5 border-2 border-[#15271E] border-t-transparent rounded-full animate-spin mr-2" />
            Loading your doubts...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-stone-200 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-stone-800">No doubt questions here</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              Whenever you have a question, click &quot;Ask a Doubt&quot; above and our teachers will help you.
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="mt-4 px-5 py-2.5 text-sm font-bold bg-[#15271E] text-white rounded-xl hover:bg-[#1E3A2F] transition cursor-pointer"
            >
              Ask a Doubt Now
            </button>
          </div>
        ) : (
          filteredQueries.map((q) => {
            const hasReply = Boolean(q.reply_text);
            const isSessionBooked = q.session_status && q.session_status !== "NOT_REQUESTED";

            return (
              <div
                key={q.id}
                className="bg-white border-2 border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 hover:border-stone-300 transition"
              >
                {/* 1. Header Row: Subject, Topic, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-base sm:text-lg text-stone-900">
                      {q.subject}
                    </span>
                    <span className="text-stone-300 text-lg hidden sm:inline">•</span>
                    <span className="text-xs sm:text-sm font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-md border border-stone-200">
                      {q.topic || "General Concept"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Clear Status Badge */}
                    {hasReply ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-green-700" />
                        <span>Answered by Faculty</span>
                      </span>
                    ) : q.session_status === "ACCEPTED" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Cabin Pass Confirmed</span>
                      </span>
                    ) : q.session_status === "PENDING_APPROVAL" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Session Pending Approval</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waiting for Teacher Reply</span>
                      </span>
                    )}

                    <span className="text-xs text-stone-500 font-medium">
                      {new Date(q.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* 2. The Question (Large, Readable Text) */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Your Question:
                  </div>
                  <div className="text-sm sm:text-base font-medium text-stone-900 leading-relaxed bg-[#FAF9F6] p-4 sm:p-5 rounded-xl border border-stone-200">
                    {q.query_text}
                  </div>
                </div>

                {/* 3. 1-on-1 Cabin Pass (if requested) */}
                {isSessionBooked && (
                  <div className={`p-4 rounded-xl border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    q.session_status === "ACCEPTED" 
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 shrink-0 text-[#8C6D37]" />
                      <div>
                        <div className="font-bold text-sm">
                          {q.session_status === "ACCEPTED" ? "1-on-1 Cabin Appointment Confirmed!" : "1-on-1 Appointment Requested"}
                        </div>
                        <div className="text-xs sm:text-sm mt-0.5">
                          <strong>When:</strong> {q.preferred_date} at {q.preferred_time}
                        </div>
                        {q.cabin_pass && (
                          <div className="text-xs font-mono font-bold mt-1 text-[#8C6D37]">
                            Pass Code: {q.cabin_pass} · Venue: Faculty Cabin 3B
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded bg-white border border-stone-200 shrink-0 self-start sm:self-auto">
                      {q.session_status === "ACCEPTED" ? "Confirmed Pass" : "Approval in Progress"}
                    </span>
                  </div>
                )}

                {/* 4. Faculty Answer (Prominent Green Box) */}
                {hasReply ? (
                  <div className="bg-[#F0FDF4] p-5 rounded-xl border-2 border-[#BBF7D0] space-y-2">
                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#14532D]">
                      <UserCheck className="w-5 h-5 text-[#15803D]" />
                      <span>Answer from {q.faculty_assigned}:</span>
                    </div>
                    <p className="text-sm sm:text-base text-stone-800 leading-relaxed pl-7">
                      {q.reply_text}
                    </p>
                  </div>
                ) : !isSessionBooked ? (
                  <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-stone-200 flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                    <Clock className="w-4 h-4 text-[#8C6D37] shrink-0" />
                    <span>Your question has been sent to <strong>{q.faculty_assigned}</strong>. The answer will appear here shortly.</span>
                  </div>
                ) : null}

                {/* 5. Clear Bottom Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div className="text-stone-600 font-medium">
                    Assigned Teacher: <strong className="text-stone-800">{q.faculty_assigned}</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Book 1-on-1 Button */}
                    {!isSessionBooked && (
                      <button
                        onClick={() => {
                          setActiveDoubt(q);
                          setShowSessionModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-stone-100 text-stone-800 hover:bg-[#15271E] hover:text-white transition cursor-pointer border border-stone-300"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book 1-on-1 Session</span>
                      </button>
                    )}

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        setActiveDoubt(q);
                        setShowWhatsAppModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#25D366]/15 text-[#137333] hover:bg-[#25D366]/25 transition cursor-pointer border border-[#25D366]/40"
                    >
                      <Share2 className="w-4 h-4 text-[#25D366]" />
                      <span>Ask on WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
        </div>
      </AcademicLockedOverlay>

      {/* ----------------------------------------------------------------------
          MODAL 1: ASK A DOUBT (LARGE TEXT, SIMPLE & FAST)
          ---------------------------------------------------------------------- */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#15271E] text-white p-6 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#D4AF37] text-[#15271E]">
                  Ask Faculty
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">
                  Submit Your Doubt Question
                </h3>
              </div>
              <button 
                onClick={() => setShowAskModal(false)}
                className="text-stone-300 hover:text-white text-2xl leading-none font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitDoubt} className="p-6 space-y-4 text-sm text-stone-800">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  Select Subject Area
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 text-sm border-2 border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:border-[#15271E]"
                >
                  <option value="Database Management Systems">Database Management Systems (DBMS)</option>
                  <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                  <option value="Theory of Computation & Automata">Theory of Computation & Automata</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Engineering Mathematics & Aptitude">Engineering Mathematics & Aptitude</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Theorem, DFA Minimization, SQL Normalization..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 text-sm border-2 border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:border-[#15271E]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  Type Your Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the exact question, formula, or proof you are struggling with..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="w-full p-3 text-sm border-2 border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:border-[#15271E]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  Faculty Specialist
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full p-3 text-sm border-2 border-stone-200 rounded-xl bg-stone-50"
                >
                  <option value="Prof. Aniruddh Singh (Ex-IITian)">Prof. Aniruddh Singh (AIR 14, Ex-IITian)</option>
                  <option value="Er. Priyanshu Gupta">Er. Priyanshu Gupta (Systems Lead)</option>
                  <option value="Dr. H. S. Sharma">Dr. H. S. Sharma (Senior Academic Board)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-bold bg-[#15271E] text-white hover:bg-[#1E3A2F] rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                  <span>{submitting ? "Submitting..." : "Submit Question"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL 2: BOOK 1-ON-1 CABIN APPOINTMENT
          ---------------------------------------------------------------------- */}
      {showSessionModal && activeDoubt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#15271E] text-white p-6 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#D4AF37] text-[#15271E]">
                  Private Cabin Appointment
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">
                  Book 1-on-1 Faculty Session
                </h3>
              </div>
              <button 
                onClick={() => setShowSessionModal(false)}
                className="text-stone-300 hover:text-white text-2xl leading-none font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-stone-800">
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="font-bold text-stone-900">{activeDoubt.subject}</div>
                <div className="text-stone-600 text-xs mt-0.5">{activeDoubt.topic}</div>
              </div>

              {sessionSuccessMsg ? (
                <div className="p-4 bg-green-50 border border-green-200 text-green-900 rounded-xl flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-green-700 shrink-0" />
                  <span className="font-medium">{sessionSuccessMsg}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-stone-800 mb-2">
                      Choose an Available Teacher Slot:
                    </label>
                    <div className="space-y-2.5">
                      {facultySlots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#15271E] bg-[#FAF8F5] shadow-xs"
                                : "border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-stone-900 text-sm">
                                {slot.faculty_name}
                              </div>
                              <div className="text-stone-600 text-xs mt-0.5">
                                {slot.day_name} ({slot.date_str}) · <strong>{slot.time_slot}</strong>
                              </div>
                              <div className="text-xs text-[#8C6D37] mt-0.5 font-medium">
                                📍 {slot.venue}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-[#15271E] bg-[#15271E] text-white" : "border-stone-300"
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSessionModal(false)}
                      className="px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestFacultySession}
                      disabled={requestingSession}
                      className="px-6 py-2.5 text-sm font-bold bg-[#15271E] text-white hover:bg-[#1E3A2F] rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Ticket className="w-4 h-4 text-[#D4AF37]" />
                      <span>{requestingSession ? "Requesting..." : "Confirm Appointment"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL 3: SHARE IN WHATSAPP GROUP (SIMPLE, 1-CLICK)
          ---------------------------------------------------------------------- */}
      {showWhatsAppModal && activeDoubt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#128C7E] text-white p-6 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-white/20 text-white">
                  WhatsApp Support
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">
                  Share Doubt in WhatsApp Group
                </h3>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="text-white/70 hover:text-white text-2xl leading-none font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-stone-800">
              <p className="text-stone-600">
                Your question is ready to paste into the official SIMS GATE discussion group:
              </p>

              {/* Formatted Message Preview */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-stone-900">
                {constructWhatsAppMessage(activeDoubt)}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(activeDoubt)}
                  className="w-full sm:flex-1 py-3 px-4 text-sm font-bold bg-stone-100 text-stone-800 hover:bg-stone-200 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-stone-300"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Question</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenGroup(activeDoubt)}
                  className="w-full sm:flex-1 py-3 px-4 text-sm font-bold bg-[#25D366] text-white hover:bg-[#1EBE5D] rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Open WhatsApp Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
