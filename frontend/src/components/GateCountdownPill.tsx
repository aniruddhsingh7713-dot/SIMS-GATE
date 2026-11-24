"use client";

import { useEffect, useState } from "react";

export default function GateCountdownPill() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    // GATE 2027 expected commencement: First Saturday of February 2027 (Feb 6, 2027)
    const targetDate = new Date("2027-02-06T09:00:00+05:30").getTime();
    const now = Date.now();
    const diff = targetDate - now;
    if (diff > 0) {
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } else {
      // If past, target next cycle
      setDaysLeft(280);
    }
  }, []);

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 shadow-xs mb-3 text-xs sm:text-xs">
      <span className="flex items-center gap-1.5 font-bold text-[#8C6D23]">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-[#8C6D23]" />
        </span>
        GATE 2027 COUNTDOWN
      </span>
      <span className="text-slate-300">|</span>
      <span className="font-semibold text-slate-800">
        {daysLeft !== null ? (
          <>
            <strong className="text-[#0B192C] font-extrabold">{daysLeft} Days</strong> Remaining
          </>
        ) : (
          "Session 2027–2028"
        )}
      </span>
      <span className="hidden sm:inline text-slate-300">•</span>
      <span className="hidden sm:inline text-[#0F4336] font-bold text-[11px]">
        Offline Batches Open (Max 40 Seats)
      </span>
    </div>
  );
}
