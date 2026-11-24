"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Film,
  Award,
  Calendar,
  FileText,
  HelpCircle,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "@/app/dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logoutUser } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggingOutRef = useRef(false);

  // Session Protection Guard
  useEffect(() => {
    if (mounted && !isLoading && !isLoggingOutRef.current) {
      if (!isAuthenticated || !user) {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router, mounted]);

  // Click outside listener for popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const isVerifying = mounted && (isLoading || !isAuthenticated || !user);

  const studentName =
    user?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    "Student";
  const studentInitial = (studentName[0] || "S").toUpperCase();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Live Classes", href: "/dashboard/live-classes", icon: Video },
    { label: "Recorded Lectures", href: "/dashboard/recorded-lectures", icon: Film },
    { label: "Timetable", href: "/dashboard/timetable", icon: Calendar },
    { label: "Notes & Material", href: "/dashboard/study-material", icon: FileText },
    { label: "Doubt Support", href: "/dashboard/doubt-support", icon: HelpCircle },
  ];

  const bottomNavItems = [
    { label: "My Devices", href: "/dashboard/devices", icon: ShieldCheck },
    { label: "Profile", href: "/dashboard/profile", icon: User },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    isLoggingOutRef.current = true;
    setUserDropdownOpen(false);
    logoutUser();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col antialiased">
      {/* --------------------------------------------------------------------------
         TOP APPLICATION NAVBAR (68px Height, Clean, Institutional Quality)
         -------------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 h-[68px] bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between no-print">
        {/* Left: Mobile Toggle + SIMS GATE Brand Logo & Wordmark */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden size-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Toggle navigation sidebar"
          >
            {mobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 group focus-visible:outline-hidden"
          >
            <div className="size-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs group-hover:border-[#C5A059] transition-colors shrink-0">
              <Image
                src="/sims-logo.png"
                alt="SIMS Raipur Official Logo"
                width={38}
                height={38}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-serif font-black text-lg text-slate-900 tracking-wide">
                  GATE
                </span>
                <span className="text-[10px] font-black tracking-widest text-[#C5A059] uppercase">
                  Portal
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Student Learning Center
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Notifications & Student Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative size-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <strong className="text-sm font-bold text-slate-900">
                    Announcements
                  </strong>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-sm mt-1">
                  <div className="py-2.5">
                    <span className="font-semibold text-slate-900 block leading-snug text-xs sm:text-sm">
                      Upcoming Live Session: Algorithms & Problem Solving
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Today · 06:00 PM</span>
                  </div>
                  <div className="py-2.5">
                    <span className="font-semibold text-slate-900 block leading-snug text-xs sm:text-sm">
                      All India GATE Mock Assessment Series Active
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Access in Test Series</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              aria-expanded={userDropdownOpen}
            >
              <div
                className="size-8 rounded-full bg-[#15271E] border border-[#C5A059]/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                suppressHydrationWarning
              >
                {mounted ? studentInitial : "S"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span
                  className="text-xs font-bold text-slate-900 max-w-[120px] truncate leading-tight"
                  suppressHydrationWarning
                >
                  {mounted ? studentName : "Student"}
                </span>
                <span
                  className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase leading-tight mt-0.5 truncate max-w-[120px]"
                  suppressHydrationWarning
                >
                  {mounted && user?.target_branch ? user.target_branch : "Enrolled Scholar"}
                </span>
              </div>
              <ChevronDown className="size-3.5 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-100 mb-2">
                  <strong className="text-sm font-bold text-slate-900 block truncate" suppressHydrationWarning>
                    {mounted ? studentName : "Student"}
                  </strong>
                  <span className="text-xs text-slate-500 block truncate mt-0.5" suppressHydrationWarning>
                    {mounted && user?.email ? user.email : "student@simsgate.com"}
                  </span>
                  <span className="inline-block mt-2 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200" suppressHydrationWarning>
                    {mounted && user?.target_branch ? user.target_branch : "Computer Science"} · {mounted && user?.target_exam ? user.target_exam : "GATE 2026"}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium text-xs sm:text-sm"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <User className="size-4 text-slate-500" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium text-xs sm:text-sm"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings className="size-4 text-slate-500" />
                    <span>Account Settings</span>
                  </Link>

                  {user?.is_staff && (
                    <a
                      href="http://127.0.0.1:8000/admin/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium text-xs sm:text-sm"
                    >
                      <ShieldCheck className="size-4 text-[#C5A059]" />
                      <span>Django Admin Panel ↗</span>
                    </a>
                  )}

                  <div className="h-px bg-slate-100 my-1.5" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors text-left cursor-pointer text-xs sm:text-sm"
                  >
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------------
         MAIN LAYOUT BODY: 240px Forest-Green Sidebar + Content Canvas
         -------------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR: 240px wide (#15271E), clean active and hover states */}
        <aside className="hidden md:flex flex-col justify-between w-60 shrink-0 bg-[#15271E] border-r border-[#1B3226] text-white select-none no-print">
          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium tracking-normal transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${
                    isActive
                      ? "bg-[#1E382A] text-white font-semibold border-l-[3px] border-[#D4AF37] shadow-2xs"
                      : "text-emerald-100/75 hover:text-white hover:bg-[#1A3125]"
                  }`}
                >
                  <Icon
                    className={`size-4.5 ${
                      isActive ? "text-[#D4AF37]" : "text-emerald-200/60"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Bottom Pinned Items: Profile, Settings, Logout */}
          <div className="p-3 border-t border-[#1E382A] space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#1E382A] text-white font-semibold border-l-[3px] border-[#D4AF37]"
                      : "text-emerald-100/70 hover:text-white hover:bg-[#1A3125]"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-[#D4AF37]" : "text-emerald-200/50"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-emerald-100/70 hover:text-red-400 hover:bg-[#1A3125] transition-colors cursor-pointer text-left"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-[#15271E] flex flex-col justify-between p-4 text-white z-10 shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#1E382A]">
                  <span className="font-serif font-bold text-base text-[#D4AF37]">
                    SIMS GATE
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded text-emerald-200/70 hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? "bg-[#1E382A] text-white font-semibold border-l-[3px] border-[#D4AF37]"
                            : "text-emerald-100/75 hover:text-white"
                        }`}
                      >
                        <Icon className={`size-4.5 ${isActive ? "text-[#D4AF37]" : ""}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E382A] space-y-1">
                {bottomNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-[#1E382A] text-white font-semibold border-l-[3px] border-[#D4AF37]"
                          : "text-emerald-100/75 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-red-400 text-left"
                >
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------
           MAIN CONTENT AREA: Clean, Welcoming, 100% Unrestricted Canvas
           -------------------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto bg-[#FAF9F6] p-5 sm:p-7 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Client session verification overlay (only during auth check) */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center select-none no-print">
          <div className="size-14 rounded-2xl bg-[#0B192C] border border-[#C5A059]/40 p-2.5 flex items-center justify-center shadow-lg mb-3 animate-pulse">
            <Image
              src="/sims-logo.png"
              alt="SIMS Raipur Official Logo"
              width={42}
              height={42}
              className="object-contain"
            />
          </div>
          <h2 className="font-serif text-base font-bold text-[#0B192C]">
            SIMS GATE Student Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Loading your dashboard...
          </p>
        </div>
      )}
    </div>
  );
}
