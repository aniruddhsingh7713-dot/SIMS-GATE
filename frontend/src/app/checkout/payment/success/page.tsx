"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function CheckoutPaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard/courses?purchased=true");
    }, 2200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200 text-center p-8 space-y-6">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-[#15271E] via-[#C5A059] to-[#15271E]" />

        {/* Brand Crest */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center p-2 shadow-sm">
          <Image
            src="/sims-logo.png"
            alt="SIMS Raipur Official Logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Payment Verified!
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your admission order is confirmed and course enrollment has been activated in your academic dashboard.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
          <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
          <span>Redirecting to your active courses...</span>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href="/dashboard/courses?purchased=true"
            className="w-full py-3.5 px-6 rounded-xl bg-[#15271E] hover:bg-[#1F382B] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Open My Courses Now</span>
            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
