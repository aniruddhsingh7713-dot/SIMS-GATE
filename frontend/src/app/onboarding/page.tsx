"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  GraduationCap,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6 text-center">
          <div className="size-12 rounded-xl bg-[#0B192C] p-2 flex items-center justify-center animate-pulse">
            <Image src="/sims-logo.png" alt="SIMS GATE" width={36} height={36} className="object-contain" />
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </React.Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [qualification, setQualification] = useState("B.Tech / B.E. Final Year");
  const [college, setCollege] = useState("");
  const [targetExam, setTargetExam] = useState("GATE 2026");
  const [targetBranch, setTargetBranch] = useState("Computer Science (CSE)");
  const [prepLevel, setPrepLevel] = useState("Concept Building & PYQs");

  // Protect route & prefill
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/?auth=login");
      } else if (user.is_onboarded) {
        // Returning student already onboarded
        router.replace("/dashboard");
      } else {
        if (user.full_name) setFullName(user.full_name);
        else if (user.first_name) setFullName(`${user.first_name} ${user.last_name || ""}`.trim());
        if (user.phone) setPhone(user.phone);
        if (user.target_branch) setTargetBranch(user.target_branch);
        if (user.target_exam) setTargetExam(user.target_exam);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!fullName.trim()) {
        setError("Full Name is mandatory.");
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
      if (!dob.trim()) {
        setError("Date of Birth is mandatory.");
        return;
      }
      if (!gender.trim() || gender === "prefer_not_to_say") {
        setError("Gender is mandatory. Please select your gender.");
        return;
      }
    } else if (step === 2) {
      if (!qualification.trim()) {
        setError("Current Education Level is mandatory.");
        return;
      }
      if (!college.trim()) {
        setError("College / University name is mandatory.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!fullName.trim()) {
      setError("Full Name is mandatory.");
      setStep(1);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Phone number is mandatory and must be exactly 10 digits.");
      setStep(1);
      return;
    }
    if (!dob.trim()) {
      setError("Date of Birth is mandatory.");
      setStep(1);
      return;
    }
    if (!gender.trim() || gender === "prefer_not_to_say") {
      setError("Gender is mandatory. Please select your gender.");
      setStep(1);
      return;
    }
    if (!qualification.trim()) {
      setError("Current Education Level is mandatory.");
      setStep(2);
      return;
    }
    if (!college.trim()) {
      setError("College / University name is mandatory.");
      setStep(2);
      return;
    }
    if (!targetExam.trim()) {
      setError("Target Examination is mandatory.");
      return;
    }
    if (!targetBranch.trim()) {
      setError("Target Discipline is mandatory.");
      return;
    }
    if (!prepLevel.trim()) {
      setError("Preparation stage is mandatory.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/onboarding/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          full_name: fullName.trim(),
          phone: cleanPhone,
          dob: dob.trim(),
          gender: gender,
          qualification: qualification,
          college: college.trim(),
          target_exam: targetExam,
          target_branch: targetBranch,
          preparation_level: prepLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Could not save onboarding profile. Please try again.");
      } else {
        // Update context & immediately open dashboard
        updateUser(data.user);
        router.push("/dashboard");
      }
    } catch {
      setError("Cannot reach registration server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-14 rounded-2xl bg-white border border-[#C5A059]/30 p-2 flex items-center justify-center shadow-lg mb-3 animate-pulse">
          <Image src="/sims-logo.png" alt="SIMS Raipur Logo" width={42} height={42} className="object-contain" />
        </div>
        <p className="text-xs text-[#64748B]">Verifying enrollment session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0B192C] flex flex-col justify-between selection:bg-[#C5A059]/20 selection:text-[#0B192C]">
      {/* Top Header */}
      <header className="border-b border-[#EAE6DF] bg-white/80 backdrop-blur-md py-4 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FAF9F5] border border-[#C5A059]/30 flex items-center justify-center p-1">
              <Image src="/sims-logo.png" alt="SIMS Raipur Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-serif font-bold text-base text-[#0B192C]">SIMS</span>
                <span className="text-[11px] font-black tracking-widest text-[#C5A059]">GATE</span>
              </div>
              <span className="text-[10px] text-[#64748B]">Raipur Center · Choubey Colony</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#8C6D23] uppercase tracking-wider block">
              Step {step} of 3
            </span>
            <span className="text-xs text-[#64748B]">Initial Profile Setup</span>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle gold radial background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C5A059]/10 via-transparent to-transparent pointer-events-none rounded-bl-full" />

          {/* Progress Tracker */}
          <div className="relative mb-8">
            <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E3A2F] transition-all duration-300 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2.5 text-[11px] font-semibold text-[#64748B]">
              <span className={step >= 1 ? "text-[#1E3A2F]" : ""}>1. Scholar Identity</span>
              <span className={step >= 2 ? "text-[#1E3A2F]" : ""}>2. Academic Level</span>
              <span className={step >= 3 ? "text-[#1E3A2F]" : ""}>3. Aspirations &amp; Goals</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFinish}>
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                    Welcome to SIMS GATE
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Let&apos;s confirm your student identity for official classroom records and doubt cabin passes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikram Aditya"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      Phone / WhatsApp (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="e.g. 9876543210"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                        Gender *
                      </label>
                      <select
                        required
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-[#1E3A2F] transition-all cursor-pointer shadow-md"
                  >
                    <span>Continue to Education Details</span>
                    <ArrowRight className="size-4 text-[#C5A059]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Academic Background */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                    Academic Qualification
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Helps our faculty gauge prerequisite coverage in engineering mathematics and foundational subjects.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      Current Education Level *
                    </label>
                    <select
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                    >
                      <option value="B.Tech / B.E. 3rd Year">B.Tech / B.E. 3rd Year (Pre-final)</option>
                      <option value="B.Tech / B.E. Final Year">B.Tech / B.E. Final Year</option>
                      <option value="Graduated / Working Professional">Graduated / Working Professional</option>
                      <option value="B.Sc / BCA / MCA">B.Sc / BCA / MCA</option>
                      <option value="Diploma / Other">Diploma / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      College / University *
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. NIT Raipur, CSVTU, BIT Durg, GEC Bilaspur"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-[#1E3A2F] transition-all cursor-pointer shadow-md"
                  >
                    <span>Continue to GATE Aspirations</span>
                    <ArrowRight className="size-4 text-[#C5A059]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Target Aspirations & Learning Goals */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#0B192C]">
                    Target Aspirations &amp; Goals
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Select your primary examination season and target discipline for personalized timetable synchronization.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                        Target Examination *
                      </label>
                      <select
                        value={targetExam}
                        onChange={(e) => setTargetExam(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      >
                        <option value="GATE 2026">GATE 2026</option>
                        <option value="GATE 2027">GATE 2027</option>
                        <option value="GATE + PSU Selections">GATE + PSU Selections</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                        Target GATE Discipline *
                      </label>
                      <select
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      >
                        <option value="Computer Science (CSE)">Computer Science &amp; IT (CSE)</option>
                        <option value="Data Science & AI (DA)">Data Science &amp; AI (DA)</option>
                        <option value="Engineering Mathematics">Engineering Mathematics &amp; Aptitude</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      Current Preparation Stage *
                    </label>
                    <select
                      value={prepLevel}
                      onChange={(e) => setPrepLevel(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0B192C] focus:border-[#C5A059] focus:bg-white focus:outline-none"
                    >
                      <option value="Concept Building & PYQs">Concept Building &amp; 15-Yr PYQs (Standard)</option>
                      <option value="Beginner - Starting from scratch">Beginner — Starting from scratch</option>
                      <option value="Intermediate - Solved partial PYQs">Intermediate — Solved partial syllabus</option>
                      <option value="Advanced - Test series & Rank booster">Advanced — All-India Mock focus</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#14261F] transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Saving Profile Setup...</span>
                    ) : (
                      <>
                        <span>Finish Setup &amp; Enter Dashboard</span>
                        <ArrowRight className="size-4 text-[#C5A059]" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-4 text-center text-xs text-[#94A3B8]">
        SIMS GATE Coaching Institute · 3rd Floor, SBI Building, Choubey Colony, Raipur (CG)
      </footer>
    </div>
  );
}
