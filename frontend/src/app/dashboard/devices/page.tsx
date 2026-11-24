"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  HelpCircle,
  Lock,
  PlusCircle,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateDeviceId, getDeviceHeaders } from "@/lib/deviceFingerprint";

interface DeviceItem {
  id: number;
  slot_number: number;
  device_id: string;
  device_name: string;
  device_type: string;
  operating_system: string;
  browser: string;
  ip_address: string;
  is_active: boolean;
  is_current_device: boolean;
  registered_at: string;
  last_active_at: string;
}

interface ReplacementRequestItem {
  id: number;
  new_device_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function MyDevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [maxAllowed, setMaxAllowed] = useState(2);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [secStatus, setSecStatus] = useState("ACTIVE");
  const [pendingRequests, setPendingRequests] = useState<ReplacementRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal for replacement / removal request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [replacementReason, setReplacementReason] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMyDevices = async () => {
    setIsLoading(true);
    try {
      const currentDeviceId = getOrCreateDeviceId();
      const res = await fetch(`http://127.0.0.1:8000/api/security/my-devices/?current_device_id=${encodeURIComponent(currentDeviceId)}&user_id=${user?.id || ""}`, {
        headers: getDeviceHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        setMaxAllowed(data.max_allowed_devices || 2);
        setRegisteredCount(data.registered_count || 0);
        setSecStatus(data.security_status || "ACTIVE");
        setPendingRequests(data.pending_replacement_requests || []);
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyDevices();
    }
  }, [user?.id]);

  const handleOpenRequestModal = (dev?: DeviceItem) => {
    setSelectedDevice(dev || null);
    setReplacementReason("");
    setNewDeviceName("");
    setSubmitMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementReason.trim()) {
      setSubmitMessage({ type: "error", text: "Please enter a valid reason for device replacement." });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/security/request-device-replacement/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDeviceHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: user?.id,
          device_id: selectedDevice?.device_id || "",
          new_device_name: newDeviceName.trim() || "New Candidate Device",
          reason: replacementReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage({ type: "success", text: "Replacement request submitted for administrative review." });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchMyDevices();
        }, 1200);
      } else {
        setSubmitMessage({ type: "error", text: data.error || "Failed to submit request." });
      }
    } catch (err) {
      setSubmitMessage({ type: "error", text: "Network error submitting replacement request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="size-6 text-[#D4AF37]" />;
      case "tablet":
        return <Tablet className="size-6 text-[#D4AF37]" />;
      default:
        return <Laptop className="size-6 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#071B16] via-[#0F4336] to-[#071B16] border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="size-4" />
              <span>Anti-Account Sharing Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Registered Devices
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              SIMS GATE enforces a strict maximum quota of <strong>2 registered devices</strong> per student account (e.g., your laptop and your mobile phone).
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#071B16]/80 border border-white/10 rounded-2xl p-4 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Active Devices
              </span>
              <span className="text-2xl font-black text-[#D4AF37]">
                {registeredCount} / {maxAllowed}
              </span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Account Status
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                secStatus === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {secStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Replacement Alerts */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="text-amber-300 block font-semibold text-sm">
              Device Replacement Request Pending Review
            </strong>
            <p>
              You submitted a request to replace a device ({pendingRequests[0].new_device_name}). Our administration desk is reviewing your submission. You will be able to register your new device once approved.
            </p>
          </div>
        </div>
      )}

      {/* 2-Device Slots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Authorized Device Slots</span>
            <span className="text-xs font-normal text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
              Account-Level Limit: 2 Devices
            </span>
          </h2>
          <button
            onClick={() => fetchMyDevices()}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh devices"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SLOT 1 */}
          <div className="rounded-2xl bg-[#071B16] border border-[#D4AF37]/30 p-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-wider">
                  Device Slot #1
                </span>
                {devices[0] ? (
                  devices[0].is_current_device ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      This Device
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Active
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">Vacant</span>
                )}
              </div>

              {devices[0] ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#0F4336] border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
                      {getDeviceIcon(devices[0].device_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {devices[0].device_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {devices[0].operating_system} • {devices[0].browser}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#040E0B] rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono text-slate-200">{devices[0].ip_address || "Hidden"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">First Registered:</span>
                      <span>{devices[0].registered_at}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Active:</span>
                      <span className="text-emerald-400">{devices[0].last_active_at}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Laptop className="size-10 mx-auto text-slate-600" />
                  <p className="text-xs">No device registered in Slot 1 yet.</p>
                </div>
              )}
            </div>

            {devices[0] && (
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenRequestModal(devices[0])}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-[#D4AF37]" />
                  <span>Request Replacement</span>
                </button>
              </div>
            )}
          </div>

          {/* SLOT 2 */}
          <div className="rounded-2xl bg-[#071B16] border border-[#D4AF37]/30 p-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-wider">
                  Device Slot #2
                </span>
                {devices[1] ? (
                  devices[1].is_current_device ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      This Device
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Active
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Available Slot
                  </span>
                )}
              </div>

              {devices[1] ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#0F4336] border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
                      {getDeviceIcon(devices[1].device_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {devices[1].device_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {devices[1].operating_system} • {devices[1].browser}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#040E0B] rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono text-slate-200">{devices[1].ip_address || "Hidden"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">First Registered:</span>
                      <span>{devices[1].registered_at}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Active:</span>
                      <span className="text-emerald-400">{devices[1].last_active_at}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-3">
                  <div className="p-3 rounded-full bg-[#0F4336]/40 text-[#D4AF37] w-12 h-12 mx-auto flex items-center justify-center border border-[#D4AF37]/20">
                    <PlusCircle className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">Available Slot #2</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Log in from your secondary device (e.g. your Android or iPhone) to register this slot automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {devices[1] && (
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenRequestModal(devices[1])}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-[#D4AF37]" />
                  <span>Request Replacement</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Policies & Anti-Account Sharing FAQ */}
      <div className="rounded-2xl bg-[#071B16] border border-white/10 p-6 space-y-4 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="size-4 text-[#D4AF37]" />
          <span>SIMS GATE Account Security &amp; Device Policies</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#040E0B] p-4 rounded-xl border border-white/5 space-y-1.5">
            <strong className="text-white block font-semibold">Strict 2-Device Limit</strong>
            <p className="text-slate-400 leading-relaxed">
              Your enrollment grants access for exactly one individual candidate across up to 2 devices. Sharing your account with others will trigger automatic security lockdowns.
            </p>
          </div>
          <div className="bg-[#040E0B] p-4 rounded-xl border border-white/5 space-y-1.5">
            <strong className="text-white block font-semibold">Device Replacement Policy</strong>
            <p className="text-slate-400 leading-relaxed">
              Need to switch to a new phone or laptop? Submit a replacement request. Genuine student hardware changes are approved by our administration.
            </p>
          </div>
          <div className="bg-[#040E0B] p-4 rounded-xl border border-white/5 space-y-1.5">
            <strong className="text-white block font-semibold">Protected Test Series Content</strong>
            <p className="text-slate-400 leading-relaxed">
              Full-length mock exams, live timers, and performance analytics are strictly bound to authorized devices to protect the sanctity of All-India rankings.
            </p>
          </div>
        </div>
      </div>

      {/* Replacement Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B251E] border border-[#D4AF37]/40 rounded-2xl w-full max-w-md p-6 text-slate-100 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  Administration Workflow
                </span>
                <h3 className="font-bold text-white text-base">
                  Request Device Replacement
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {submitMessage && (
              <div className={`p-3 rounded-xl text-xs ${
                submitMessage.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/15 border border-red-500/30 text-red-300"
              }`}>
                {submitMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              {selectedDevice && (
                <div className="p-3 rounded-xl bg-[#040E0B] border border-white/10">
                  <span className="text-slate-400 block mb-1">Target Device to Revoke:</span>
                  <strong className="text-[#D4AF37] block font-semibold">
                    {selectedDevice.device_name}
                  </strong>
                  <span className="text-slate-400 text-[11px]">
                    {selectedDevice.operating_system} • {selectedDevice.browser}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Device Name / Model:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lenovo Legion Windows 11, iPhone 16"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-[#040E0B] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Replacement: <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. My previous laptop broke down and I have purchased this new laptop for preparing for GATE..."
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  className="w-full bg-[#040E0B] border border-[#D4AF37]/30 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E5C158] hover:to-[#C59F30] text-[#0B251E] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer text-xs"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
