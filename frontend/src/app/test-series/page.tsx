import React, { Suspense } from "react";
import TestSeriesPortalClient from "./TestSeriesPortalClient";
import type { Course } from "@/components/CourseCard";

async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/courses/", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? data.value ?? [];
    return list.filter((course: Course) => course.is_active);
  } catch (error) {
    console.error("Failed to fetch courses for test series portal:", error);
    return [];
  }
}

async function TestSeriesPortalWrapper() {
  const courses = await getCourses();
  return <TestSeriesPortalClient initialCatalogCourses={courses} />;
}

export default function TestSeriesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading SIMS GATE Test Series Portal...</div>}>
      <TestSeriesPortalWrapper />
    </Suspense>
  );
}
