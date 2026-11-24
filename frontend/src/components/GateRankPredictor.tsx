"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdvisor } from "@/context/AdvisorContext";

interface Benchmark {
  minMarks: number;
  maxMarks: number;
  rankRange: string;
  gateScore: string;
  category: string;
  iits: string[];
  psus: string[];
  recommendedBatch: string;
}

const BENCHMARKS: Benchmark[] = [
  {
    minMarks: 80,
    maxMarks: 100,
    rankRange: "Top 1 – 50 (Single / Double Digit AIR)",
    gateScore: "920 – 1000",
    category: "Elite Tier-1 Topper Zone",
    iits: ["IISc Bangalore (Direct PhD/M.Tech)", "IIT Bombay (CS/Civil/Mech)", "IIT Delhi", "IIT Madras"],
    psus: ["IOCL (Direct Interview)", "ONGC (E-1 Executive)", "NTPC", "PowerGrid (Rank < 100 Guarantee)"],
    recommendedBatch: "Super-40 Intensive Classroom + All-India CBT Test Series",
  },
  {
    minMarks: 70,
    maxMarks: 79,
    rankRange: "AIR 51 – 300",
    gateScore: "820 – 915",
    category: "Premier Top-Tier IIT Zone",
    iits: ["IIT Kanpur", "IIT Kharagpur", "IIT Roorkee", "IIT Guwahati", "IIT Hyderabad"],
    psus: ["BHEL", "HPCL", "BPCL", "BARC Scientific Officer", "ISRO Scientist/Engr"],
    recommendedBatch: "1-Year Comprehensive Classroom Program + Faculty Cabin Mentorship",
  },
  {
    minMarks: 58,
    maxMarks: 69,
    rankRange: "AIR 301 – 1,200",
    gateScore: "700 – 815",
    category: "Top NITs & Second-Gen IITs Zone",
    iits: ["IIT BHU Varanasi", "IIT Indore", "NIT Trichy", "NIT Surathkal", "NIT Warangal"],
    psus: ["BEL", "DRDO", "Airport Authority of India (AAI)", "State Engineering PSUs"],
    recommendedBatch: "Concept-First Classroom Batch + 15-Year PYQ Derivation Masterclass",
  },
  {
    minMarks: 45,
    maxMarks: 57,
    rankRange: "AIR 1,201 – 3,500",
    gateScore: "560 – 695",
    category: "NITs & Premium M.Tech Zone",
    iits: ["NIT Rourkela", "VNIT Nagpur", "NIT Calicut", "Top Central Universities (CCMT Round 1)"],
    psus: ["State Electricity Boards (CSPDCL)", "Junior Research Fellowships (CSIR/UGC)"],
    recommendedBatch: "Foundation-to-Advanced Complete GATE Classroom Prep",
  },
  {
    minMarks: 0,
    maxMarks: 44,
    rankRange: "AIR 3,500+",
    gateScore: "< 550",
    category: "Core Concept Consolidation Zone",
    iits: ["Top State Engineering Colleges", "CCMT Special Rounds", "Direct PSU Executive Tests"],
    psus: ["Campus Placement Boost", "Private Core R&D Centers"],
    recommendedBatch: "Comprehensive 2-Year Rigorous Coaching (Classroom / Hybrid)",
  },
];

export default function GateRankPredictor() {
  const [marks, setMarks] = useState<number>(72);
  const { openAdvisor } = useAdvisor();

  const currentTier = BENCHMARKS.find((b) => marks >= b.minMarks && marks <= b.maxMarks) || BENCHMARKS[BENCHMARKS.length - 1];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#FBF9F5] via-white to-[#F8F7F3] border-y border-[#EAE6DF] overflow-hidden" id="rank-predictor">
      <div className="section-container px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#8C6D23] text-[11px] sm:text-xs font-bold tracking-wide uppercase">
            <span>⚡ Interactive Estimation Tool</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">0ms Instant Calculation</span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B192C] tracking-tight leading-tight">
            GATE Score &amp; <span className="block sm:inline">Target IIT Predictor</span>
          </h2>
          <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Drag the slider to your expected GATE score out of 100 to instantly inspect your projected All-India Rank range, top IIT admission cutoffs, and eligible PSU recruitments based on previous 10-year official GATE audit matrices.
          </p>
        </div>

        {/* Interactive Workspace Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-[#E2DDD3] shadow-lg p-4 sm:p-8 lg:p-10">
          {/* Slider Control Row */}
          <div className="bg-[#FAF8F5] border border-[#EFECE6] rounded-xl sm:rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                <label htmlFor="gate-marks-slider" className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Select Your Target Marks (Out of 100):
                </label>
                <span className="text-[11px] sm:text-xs text-slate-400">Drag slider left/right to adjust target</span>
              </div>
              <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                <span className="font-serif text-3xl sm:text-5xl font-black text-[#0B192C] tracking-tight">
                  {marks}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">/ 100 Marks</span>
              </div>
            </div>

            {/* Range Input */}
            <div className="space-y-2">
              <input
                id="gate-marks-slider"
                type="range"
                min={25}
                max={95}
                step={1}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
              <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400">
                <span>25 (Cutoff)</span>
                <span className="hidden sm:inline">50 (NIT Target)</span>
                <span>75 (Top IIT)</span>
                <span>95 (AIR 1)</span>
              </div>
            </div>
          </div>

          {/* Results Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {/* Metric 1: Projected Rank */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-white border border-[#EAE6DF] space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimated All-India Rank
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#0F4336] block font-serif">
                {currentTier.rankRange}
              </strong>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F4336]/10 text-[#0F4336]">
                {currentTier.category}
              </span>
            </div>

            {/* Metric 2: GATE Score Normalized */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-white border border-[#EAE6DF] space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Normalized Score (Out of 1000)
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#8C6D23] block font-serif">
                {currentTier.gateScore}
              </strong>
              <span className="text-xs text-slate-500 block">
                Normalized across multi-session normalization curves
              </span>
            </div>

            {/* Metric 3: Classroom Program Match */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-white border border-[#EAE6DF] space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Recommended SIMS Batch
              </span>
              <strong className="text-sm font-bold text-[#0B192C] block leading-snug">
                {currentTier.recommendedBatch}
              </strong>
              <Link href="/#batches" className="inline-flex items-center gap-1 text-xs font-bold text-[#C5A059] hover:underline">
                View Batch Timings &amp; Seats &rarr;
              </Link>
            </div>
          </div>

          {/* Institutions & PSU Target Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            {/* Target IITs */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🏛️</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target IIT Admissions at this Score:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentTier.iits.map((iit, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    {iit}
                  </span>
                ))}
              </div>
            </div>

            {/* Eligible PSUs */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Eligible PSUs &amp; Research Centers:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentTier.psus.map((psu, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white border border-[#C5A059]/40 text-xs font-semibold text-[#8C6D23] shadow-2xs"
                  >
                    {psu}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer CTA within Card */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Need personalized guidance on scoring 75+ in your specific engineering discipline?
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => openAdvisor(`Targeting ${marks} Marks in GATE 2027 - Roadmap Counseling`)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3A5F] text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Book 1-on-1 Faculty Cabin Roadmap</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
