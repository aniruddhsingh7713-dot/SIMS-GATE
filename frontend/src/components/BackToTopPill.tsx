"use client";

import { useEffect, useState } from "react";

export default function BackToTopPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 450);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 left-6 z-40 px-3.5 py-2 rounded-full bg-[#0B192C]/90 hover:bg-[#0B192C] text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg backdrop-blur-md border border-[#C5A059]/40 transition-all duration-200 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
      aria-label="Scroll back to top of page"
      title="Back to Top"
    >
      <span className="text-[#C5A059] font-black text-sm">↑</span>
      <span className="hidden sm:inline">Top</span>
    </button>
  );
}
