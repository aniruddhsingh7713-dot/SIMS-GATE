"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Calendar, 
  GraduationCap, 
  Target, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2,
  Sparkles,
  Building,
  Phone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [targetExam, setTargetExam] = useState(user?.target_exam || "GATE 2026");
  const [targetBranch, setTargetBranch] = useState(user?.target_branch || "Computer Science & IT (CSE)");
  const [qualification, setQualification] = useState(user?.qualification || "B.Tech Final Year / Graduate");
  const [college, setCollege] = useState(user?.college_name || "National Institute of Technology (NIT), Raipur");
  const [prepLevel, setPrepLevel] = useState(user?.preparation_level || "INTERMEDIATE");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("First Name is mandatory.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last Name is mandatory.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Phone number is mandatory.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!college.trim()) {
      setError("College / Institute Name is mandatory.");
      return;
    }
    if (!qualification.trim()) {
      setError("Current Education Level is mandatory.");
      return;
    }
    if (!targetExam.trim()) {
      setError("Target Examination is mandatory.");
      return;
    }
    if (!targetBranch.trim()) {
      setError("Target Branch is mandatory.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/onboarding/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: cleanPhone,
          qualification: qualification.trim(),
          college_name: college.trim(),
          target_exam: targetExam.trim(),
          target_branch: targetBranch.trim(),
          preparation_level: prepLevel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          updateUser(data.user);
        }
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile details.");
      }
    } catch {
      setError("Cannot reach server. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#15271E] tracking-tight">
            Academic Profile
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Registered student credentials, target examination goals, and institute enrollment data
          </p>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#15271E] text-stone-100 hover:bg-[#1C362A] rounded-lg transition shadow-sm border border-[#224032]"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{editing ? "Cancel Editing" : "Edit Profile Details"}</span>
        </button>
      </div>

      {success && (
        <div className="bg-[#EBF3ED] border border-[#A3C7AF] text-[#1B4332] p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
          <span>Profile information successfully updated!</span>
        </div>
      )}

      {/* Main Student Identity Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#15271E] text-[#D4AF37] flex items-center justify-center font-serif text-3xl font-bold border-2 border-[#D4AF37]/40 shadow-inner">
            {(user?.first_name || user?.username || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-2xl font-bold text-[#15271E]">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : (user?.username || "Student")}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Scholar
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Roll No: SIMS-GATE-2026-9812 · Cohort Alpha
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                {user?.email || "student@simsgate.com"}
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-stone-400" />
                Raipur Classroom Campus
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] border border-[#D4AF37]/30 rounded-xl p-4 text-xs space-y-1.5 min-w-[220px]">
          <div className="text-[10px] uppercase font-bold text-[#8C6D37] tracking-wider">
            Enrolled Batch
          </div>
          <div className="font-serif font-bold text-sm text-[#15271E]">
            Super-30 Intensive Cohort
          </div>
          <div className="text-stone-500 text-[11px]">
            GATE 2026 · Valid till Feb 2026
          </div>
        </div>
      </div>

      {editing ? (
        /* Edit Form */
        <form onSubmit={handleSave} className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="font-serif font-bold text-lg text-[#15271E] border-b border-stone-200 pb-3">
            Edit Student Details
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:ring-1 focus:ring-[#15271E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:ring-1 focus:ring-[#15271E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone / WhatsApp (10 Digits) *</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:ring-1 focus:ring-[#15271E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Examination *</label>
              <select
                required
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
              >
                <option value="GATE 2026">GATE 2026</option>
                <option value="GATE 2027">GATE 2027</option>
                <option value="ESE / PSU Combined">ESE / PSU Combined</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Branch *</label>
              <select
                required
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
              >
                <option value="Computer Science & IT (CSE)">Computer Science & IT (CSE)</option>
                <option value="Data Science & Artificial Intelligence (DA)">Data Science & AI (DA)</option>
                <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
                <option value="Electronics & Communication (ECE)">Electronics & Communication (ECE)</option>
                <option value="Electrical Engineering (EE)">Electrical Engineering (EE)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">College / Institute Name *</label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Current Education Level *</label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-[#15271E] text-white hover:bg-[#1C362A] rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      ) : (
        /* Academic Details Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Exam & Subject */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-stone-800 font-serif font-bold text-base pb-3 border-b border-stone-100">
              <Target className="w-4 h-4 text-[#8C6D37]" />
              <span>Target Examination & Disciplines</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Target Exam:</span>
                <span className="font-semibold text-stone-800">{user?.target_exam || "GATE 2026"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Engineering Branch:</span>
                <span className="font-semibold text-stone-800">{user?.target_branch || "Computer Science & IT (CSE)"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Preparation Level:</span>
                <span className="font-semibold text-[#2D6A4F]">{user?.preparation_level || "INTERMEDIATE"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-500">Institute Target Goal:</span>
                <span className="font-semibold text-[#8C6D37]">All India Rank (AIR) &lt; 50</span>
              </div>
            </div>
          </div>

          {/* Academic Background */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-stone-800 font-serif font-bold text-base pb-3 border-b border-stone-100">
              <GraduationCap className="w-4 h-4 text-[#15271E]" />
              <span>Academic Background</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Current Qualification:</span>
                <span className="font-semibold text-stone-800">{user?.qualification || "B.Tech Final Year"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">College / University:</span>
                <span className="font-semibold text-stone-800 text-right max-w-[200px] truncate">{user?.college_name || "National Institute of Technology, Raipur"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Date of Birth:</span>
                <span className="font-semibold text-stone-800">{user?.dob || "14 Aug 2002"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-500">Gender:</span>
                <span className="font-semibold text-stone-800">{user?.gender || "Not specified"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
