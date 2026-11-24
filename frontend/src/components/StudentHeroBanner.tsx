"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, LayoutDashboard, Calendar, Sparkles } from "lucide-react";

export default function StudentHeroBanner() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !isAuthenticated || !user) {
    return null;
  }

  const studentName = user.first_name || user.username || "Student";
  const branchName = user.target_branch || "Computer Science (CSE)";

  return (
    <div className="mb-6 rounded-2xl border border-[#C5A059]/30 bg-gradient-to-r from-[#0B192C] via-[#102A43] to-[#0B192C] p-4 sm:p-5 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
            <LayoutDashboard className="size-5 text-[#C5A059]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-[#E8D5A3] uppercase tracking-wider">
                Student Session Active
              </span>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Welcome back, <strong className="text-white font-serif">{studentName}</strong>. Your {branchName} timetable and lectures are ready.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all transform hover:-translate-y-0.5 text-center"
          >
            <span>🎓 Dashboard</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </Link>
          <Link
            href="/test-series"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A059] text-[#0B192C] text-xs font-bold shadow-md hover:bg-[#D4AF37] hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-center"
          >
            <span>🏆 Test Portal</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
