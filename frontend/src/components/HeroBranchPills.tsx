"use client";

const BRANCHES = [
  { label: "Computer Science", code: "CSE", icon: "💻", href: "/courses?category=GATE_CSE" },
  { label: "Data Science & AI", code: "DA", icon: "🤖", href: "/courses?category=GATE_DA" },
  { label: "Civil Engineering", code: "CE", icon: "🏗️", href: "/courses?category=GATE_CIVIL" },
  { label: "Chemical Engg", code: "CH", icon: "🧪", href: "/courses?category=GATE_CHEMICAL" },
  { label: "Mechanical Engg", code: "ME", icon: "⚙️", href: "/courses?category=GATE_MECHANICAL" },
  { label: "GATE Chemistry", code: "CY", icon: "🔬", href: "/courses?category=GATE_CHEMISTRY" },
];

export default function HeroBranchPills() {
  const handleScrollToBranch = (href: string) => {
    // Navigate smoothly
    window.location.href = href;
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-200/80">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Fast Stream Explorer:
        </span>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          (Select your discipline for instant syllabus &amp; batch details)
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {BRANCHES.map((b) => (
          <button
            key={b.code}
            type="button"
            onClick={() => handleScrollToBranch(b.href)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-[#0B192C] hover:text-white border border-slate-200/90 text-slate-700 text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs hover:shadow-sm hover:border-[#0B192C]"
          >
            <span className="text-sm">{b.icon}</span>
            <span>{b.code}</span>
            <span className="hidden md:inline font-normal opacity-75 text-[11px]">· {b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
