"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import AdvisorModal from "@/components/AdvisorModal";

interface AdvisorContextType {
  isOpen: boolean;
  topic: string;
  courseTitle: string;
  coursePrice: string;
  openAdvisor: (initialTopic?: string, courseTitle?: string, coursePrice?: string) => void;
  closeAdvisor: () => void;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("Classroom Batch Admissions 2027–2028");
  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState("");

  const openAdvisor = (
    initialTopic?: string,
    initialCourseTitle?: string,
    initialCoursePrice?: string
  ) => {
    if (initialTopic) setTopic(initialTopic);
    if (initialCourseTitle) setCourseTitle(initialCourseTitle);
    else setCourseTitle("");
    if (initialCoursePrice) setCoursePrice(initialCoursePrice);
    else setCoursePrice("");
    setIsOpen(true);
  };

  const closeAdvisor = () => {
    setIsOpen(false);
  };

  return (
    <AdvisorContext.Provider
      value={{
        isOpen,
        topic,
        courseTitle,
        coursePrice,
        openAdvisor,
        closeAdvisor,
      }}
    >
      {children}
      <AdvisorModal />
    </AdvisorContext.Provider>
  );
}

export function useAdvisor() {
  const context = useContext(AdvisorContext);
  if (!context) {
    throw new Error("useAdvisor must be used within an AdvisorProvider");
  }
  return context;
}
