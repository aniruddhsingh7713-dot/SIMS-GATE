"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TestSeriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/test-series");
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-500 font-medium">
      Redirecting to CBT Test Series Portal...
    </div>
  );
}
