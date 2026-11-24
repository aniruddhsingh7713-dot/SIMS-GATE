"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Shield, 
  Smartphone, 
  CheckCircle2, 
  Key, 
  Sliders, 
  Video, 
  Save, 
  Moon, 
  Monitor 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [testReminders, setTestReminders] = useState(true);
  const [doubtEmail, setDoubtEmail] = useState(true);
  const [videoSpeed, setVideoSpeed] = useState("1.0x");
  const [videoQuality, setVideoQuality] = useState("1080p");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#15271E] tracking-tight">
            Portal Settings
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage your notification preferences, video player defaults, and security credentials
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#15271E] text-stone-100 hover:bg-[#1C362A] rounded-lg transition shadow-sm border border-[#224032]"
        >
          <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Save Preferences</span>
        </button>
      </div>

      {saved && (
        <div className="bg-[#EBF3ED] border border-[#A3C7AF] text-[#1B4332] p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
          <span>Your settings preferences have been saved!</span>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-serif font-bold text-base pb-3 border-b border-stone-100">
          <Bell className="w-4 h-4 text-[#8C6D37]" />
          <span>Notifications & Academic Alerts</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <div>
              <div className="font-semibold text-stone-800">WhatsApp Class Reminders</div>
              <div className="text-stone-500 mt-0.5">Receive class links and timetable changes 15 mins before lectures</div>
            </div>
            <input
              type="checkbox"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[#15271E] focus:ring-[#15271E]"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <div>
              <div className="font-semibold text-stone-800">Weekly CBT Mock Test Notifications</div>
              <div className="text-stone-500 mt-0.5">Automated reminders when Saturday proctored tests become active</div>
            </div>
            <input
              type="checkbox"
              checked={testReminders}
              onChange={(e) => setTestReminders(e.target.checked)}
              className="w-4 h-4 rounded text-[#15271E] focus:ring-[#15271E]"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-stone-800">Faculty Doubt Resolution Alerts</div>
              <div className="text-stone-500 mt-0.5">Instant notification when a faculty member answers your academic query</div>
            </div>
            <input
              type="checkbox"
              checked={doubtEmail}
              onChange={(e) => setDoubtEmail(e.target.checked)}
              className="w-4 h-4 rounded text-[#15271E] focus:ring-[#15271E]"
            />
          </div>
        </div>
      </div>

      {/* Video Lecture Preferences */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-serif font-bold text-base pb-3 border-b border-stone-100">
          <Video className="w-4 h-4 text-[#15271E]" />
          <span>Recorded Lectures & Stream Quality</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Default Playback Speed
            </label>
            <select
              value={videoSpeed}
              onChange={(e) => setVideoSpeed(e.target.value)}
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:ring-1 focus:ring-[#15271E]"
            >
              <option value="1.0x">1.0x (Normal Pace)</option>
              <option value="1.25x">1.25x (Recommended Revision)</option>
              <option value="1.5x">1.5x (Fast Track)</option>
              <option value="2.0x">2.0x (Rapid Review)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Preferred Resolution
            </label>
            <select
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value)}
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:ring-1 focus:ring-[#15271E]"
            >
              <option value="1080p">1080p Full HD (Broadband)</option>
              <option value="720p">720p HD (Balanced Data)</option>
              <option value="480p">480p SD (Data Saver)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Password & Security */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-serif font-bold text-base pb-3 border-b border-stone-100">
          <Key className="w-4 h-4 text-[#D97706]" />
          <span>Security & Password</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-stone-50"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => alert("Password update request submitted.")}
            className="px-4 py-2 text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
