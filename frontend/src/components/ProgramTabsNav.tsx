"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  House,
  CalendarBlank,
  BookOpen,
  GraduationCap,
  Notebook,
  Question,
  IconProps,
} from "@phosphor-icons/react";
import { ComponentType } from "react";

const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 30,
  mass: 0.7,
};

interface ProgramTab {
  label: string;
  icon: ComponentType<IconProps>;
  href: string;
}

const PROGRAM_TABS: ProgramTab[] = [
  { label: "Overview", icon: House, href: "#courses" },
  { label: "Batches", icon: CalendarBlank, href: "#courses" },
  { label: "Curriculum", icon: BookOpen, href: "#approach" },
  { label: "Faculty", icon: GraduationCap, href: "#approach" },
  { label: "Study Material", icon: Notebook, href: "#courses" },
  { label: "FAQs", icon: Question, href: "#faq" },
];

export default function ProgramTabsNav() {
  const [activeTab, setActiveTab] = useState("Overview");

  const handleClick = (tab: ProgramTab) => {
    setActiveTab(tab.label);
    if (tab.href && tab.href.startsWith("#")) {
      const target = document.querySelector(tab.href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="program-expanding-tabs-wrapper" role="tablist" aria-label="Curriculum & Program Navigation">
      <motion.div
        layout
        transition={SPRING}
        className="flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-[#E8E3D9] bg-[#F8F6F0] p-1.5 shadow-[0_2px_8px_rgba(11,25,55,0.04)]"
      >
        {PROGRAM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.label;

          return (
            <motion.button
              key={tab.label}
              layout
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => handleClick(tab)}
              whileHover={isActive ? undefined : { scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              className={`relative flex h-9 shrink-0 cursor-pointer items-center justify-start overflow-hidden rounded-full pl-2.5 outline-none transition-colors duration-150 ${
                isActive
                  ? "gap-2 bg-[#0B1937] pr-3.5 text-white shadow-[0_3px_10px_rgba(11,25,55,0.18)]"
                  : "w-9 bg-white text-[#64748B] hover:text-[#0B1937] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#ECE7DC]"
              }`}
            >
              <motion.span
                animate={{
                  scale: isActive ? 1.05 : 1,
                  opacity: isActive ? 1 : 0.82,
                }}
                transition={SPRING}
                className={`flex shrink-0 items-center justify-center ${
                  isActive ? "text-[#D8AD63]" : "text-[#64748B]"
                }`}
              >
                <Icon size={16} weight={isActive ? "bold" : "regular"} aria-hidden="true" />
              </motion.span>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={SPRING}
                    className="whitespace-nowrap text-xs font-bold tracking-tight text-white"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
