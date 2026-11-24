"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AcademicLockedOverlay from "@/components/AcademicLockedOverlay";
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Bookmark, 
  FileCheck,
  Eye,
  CheckCircle2,
  FolderOpen
} from "lucide-react";

interface StudyMaterial {
  id: number;
  title: string;
  subject: string;
  category: "NOTES" | "FORMULA" | "PYQ" | "REFERENCE";
  category_display: string;
  branch: string;
  file_size: string;
  file_type: string;
  download_url: string;
  uploaded_date: string;
  is_active: boolean;
  order: number;
}

export default function StudyMaterialPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    async function loadEnrollments() {
      if (!user?.id) {
        setLoadingEnrollments(false);
        return;
      }
      try {
        setLoadingEnrollments(true);
        const res = await fetch(`http://127.0.0.1:8000/api/courses/my-enrollments/?user_id=${user.id}&type=COURSE`);
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data.enrollments || []);
        }
      } catch (err) {
        console.error("Failed to load enrollments in study material:", err);
      } finally {
        setLoadingEnrollments(false);
      }
    }
    loadEnrollments();
  }, [user]);

  const isStaffOrAdmin = Boolean(
    user?.is_staff ||
    user?.is_superuser ||
    user?.role === "admin" ||
    user?.role === "teacher"
  );
  const isUnenrolledStudent = !loadingEnrollments && enrollments.length === 0 && !isStaffOrAdmin;

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        setLoading(true);
        const userParam = user?.id ? `?user_id=${user.id}` : "";
        const res = await fetch(`http://127.0.0.1:8000/api/dashboard/study-material/${userParam}`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data.results || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch study material:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, [user]);

  const categories = [
    { key: "ALL", label: "All Repository" },
    { key: "NOTES", label: "Handwritten Lecture Notes" },
    { key: "FORMULA", label: "Formula & Cheat Sheets" },
    { key: "PYQ", label: "15-Yr Solved PYQs" },
  ];

  const filteredMaterials = materials.filter((item) => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "NOTES":
        return { bg: "bg-[#EBF3ED] text-[#1B4332] border-[#A3C7AF]", label: "Handwritten Notes" };
      case "FORMULA":
        return { bg: "bg-[#FEF3E6] text-[#92400E] border-[#FAD2A4]", label: "Formula Sheet" };
      case "PYQ":
        return { bg: "bg-[#EDF2F7] text-[#1E293B] border-[#CBD5E1]", label: "15-Yr PYQ Bank" };
      default:
        return { bg: "bg-stone-100 text-stone-700 border-stone-200", label: "Reference Sheet" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#15271E] tracking-tight">
              Notes <span className="font-sans font-semibold text-[#C5A059] mx-1">&amp;</span> Study Material
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#8C6D37] border border-[#D4AF37]/30">
              Verified Institute Library
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Faculty-curated class annotations, quick-revision formula compendiums, and topic-wise GATE solved archives
          </p>
        </div>

        {/* Download all quick action */}
        <button
          onClick={() => alert("Batch downloading latest week study materials archive (.zip)")}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#15271E] text-stone-100 hover:bg-[#1C362A] rounded-lg transition shadow-sm border border-[#224032]"
        >
          <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
          <span>Download Weekly Pack (.ZIP)</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          STUDY REPOSITORY (Protected by AcademicLockedOverlay)
          ------------------------------------------------------------- */}
      <AcademicLockedOverlay
        isLocked={isUnenrolledStudent}
        title="You haven't purchased any course yet"
        description="You haven't purchased any course yet. Verified faculty lecture notes, formula cheat sheets, and solved PYQs are for enrolled course scholars. If you purchased a Test Series, please visit the Test Portal."
      >
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200/90 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-[#15271E] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#15271E] bg-[#FAF8F5]/60"
          />
        </div>
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((item) => {
          const badge = getCategoryBadge(item.category);
          return (
            <div
              key={item.id}
              className="bg-white border border-stone-200/90 rounded-xl p-5 hover:border-stone-400 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-mono font-medium text-stone-500">
                    {item.branch}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-[#15271E] line-clamp-2 group-hover:text-[#8C6D37] transition leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-stone-600 font-medium mt-1">
                  Subject: <strong className="text-stone-800">{item.subject}</strong>
                </p>

                <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-4 pt-3 border-t border-stone-100">
                  <span className="flex items-center gap-1 font-mono">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    {item.file_type} · {item.file_size}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Updated {item.uploaded_date}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => alert(`Starting download for: ${item.title}`)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#15271E] text-white hover:bg-[#1C362A] rounded-lg transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && !loading && (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-stone-700">No matching materials found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or switch to another category filter.
          </p>
        </div>
      )}
        </div>
      </AcademicLockedOverlay>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#15271E] text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#15271E]">
                  {previewItem.category_display}
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-50 mt-2">
                  {previewItem.title}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="text-stone-400 hover:text-white text-xl leading-none font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700">
              <div className="bg-[#FAF8F5] p-4 rounded-lg border border-stone-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Target Exam / Branch:</span>
                  <span className="font-semibold text-stone-800">GATE · {previewItem.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Curated By:</span>
                  <span className="font-semibold text-stone-800">SIMS Senior Academic Board</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">File Specifications:</span>
                  <span className="font-semibold text-stone-800">{previewItem.file_type} ({previewItem.file_size})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Watermark Security:</span>
                  <span className="font-semibold text-[#2D6A4F]">Digital Student ID Embedded</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                This document is part of the proprietary study material package provided to registered SIMS GATE candidates. Redistribution or sharing without prior authorization is strictly prohibited.
              </p>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Downloading ${previewItem.title}`);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-[#15271E] text-white hover:bg-[#1C362A] rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Download Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
