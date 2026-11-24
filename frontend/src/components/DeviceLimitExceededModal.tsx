"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Laptop,
  Smartphone,
  Tablet,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { getDeviceHeaders } from "@/lib/deviceFingerprint";

interface RegisteredDeviceItem {
  id: number;
  device_name: string;
  device_type: string;
  operating_system: string;
  browser: string;
  last_active_at?: string;
  registered_at?: string;
}

interface DeviceLimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptedDevice?: {
    device_name?: string;
    operating_system?: string;
    browser?: string;
    device_type?: string;
  };
  registeredDevices?: RegisteredDeviceItem[];
  studentUserId?: number;
}

export default function DeviceLimitExceededModal({
  isOpen,
  onClose,
  attemptedDevice,
  registeredDevices = [],
  studentUserId,
}: DeviceLimitExceededModalProps) {
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [selectedDeviceToRemove, setSelectedDeviceToRemove] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("Please provide a brief reason for requesting device replacement.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/security/request-device-replacement/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDeviceHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: studentUserId,
          device_id: selectedDeviceToRemove,
          new_device_name: attemptedDevice?.device_name || "New Device",
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to submit replacement request. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to security server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="size-5 text-[#D4AF37]" />;
      case "tablet":
        return <Tablet className="size-5 text-[#D4AF37]" />;
      default:
        return <Laptop className="size-5 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0B251E] border border-[#D4AF37]/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#071B16] via-[#0F4336] to-[#071B16] px-6 py-4 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="size-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Anti-Account Sharing Security
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">
                Device Limit Exceeded (2/2 Active)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close warning"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {!showReplacementForm ? (
            <>
              {/* Security Alert Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-3 text-amber-200/90 text-[13px] leading-relaxed">
                <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-1">
                    Maximum 2 Registered Devices Allowed
                  </strong>
                  Your SIMS GATE student account is already active on the maximum allowable 2 devices. To safeguard proprietary test series and prevent unauthorized account distribution, this 3rd device cannot be registered automatically.
                </div>
              </div>

              {/* Attempted Device (Blocked) */}
              <div className="bg-[#071B16] border border-red-500/30 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    {getDeviceIcon(attemptedDevice?.device_type)}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">
                      Blocked Attempt (Device #3)
                    </span>
                    <p className="font-bold text-white text-sm">
                      {attemptedDevice?.device_name || "New Unrecognized Device"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {attemptedDevice?.operating_system} • {attemptedDevice?.browser}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  Blocked
                </span>
              </div>

              {/* Existing 2 Authorized Devices */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2.5 flex items-center justify-between">
                  <span>Currently Authorized Devices (2/2)</span>
                  <span className="text-emerald-400 text-[11px] font-normal">Active & Protected</span>
                </h3>

                <div className="space-y-2">
                  {registeredDevices.length > 0 ? (
                    registeredDevices.map((dev, idx) => (
                      <div
                        key={dev.id || idx}
                        className="bg-[#0F352B]/70 border border-[#D4AF37]/25 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                            {getDeviceIcon(dev.device_type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#D4AF37]">
                                Slot #{idx + 1}
                              </span>
                              <p className="font-semibold text-white text-sm">
                                {dev.device_name}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400">
                              {dev.operating_system} • {dev.browser}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Loading registered device records...
                    </div>
                  )}
                </div>
              </div>

              {/* What Should You Do? */}
              <div className="bg-[#071B16] rounded-xl p-4 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="size-4 text-[#D4AF37]" />
                  What can you do?
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>Log in from one of your existing authorized devices shown above.</li>
                  <li>
                    If you permanently changed or lost an old device (e.g. bought a new laptop or phone), submit a <strong>Device Replacement Request</strong> below for administrative verification.
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReplacementForm(true)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E5C158] hover:to-[#C59F30] text-[#0B251E] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="size-4" />
                  <span>Request Device Replacement</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs tracking-wider transition-colors cursor-pointer text-center"
                >
                  Switch to Authorized Device
                </button>
              </div>
            </>
          ) : (
            /* Replacement Request Form */
            <form onSubmit={handleReplacementSubmit} className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-base">Request Device Replacement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submit a formal request to revoke an old device and authorize your new device. Our administration team processes genuine requests swiftly.
                </p>
              </div>

              {submissionSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="size-8" />
                  </div>
                  <h4 className="font-bold text-white text-base">Request Submitted Successfully</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Your device replacement request has been queued for administrative verification. You will be notified once reviewed.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B251E] font-bold text-xs uppercase tracking-wider"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Device to Replace / Revoke:
                    </label>
                    <select
                      value={selectedDeviceToRemove}
                      onChange={(e) => setSelectedDeviceToRemove(Number(e.target.value) || "")}
                      className="w-full bg-[#071B16] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">-- Choose one of your existing devices --</option>
                      {registeredDevices.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.device_name} ({dev.operating_system} - {dev.browser})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Reason for Replacement: <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. My previous phone was damaged and I have purchased this new laptop for preparing for GATE..."
                      className="w-full bg-[#071B16] border border-[#D4AF37]/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] placeholder:text-slate-500"
                      required
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#071B16] border border-white/5 text-[11.5px] text-slate-400">
                    ℹ️ For security, device replacement requests are logged with your IP address, device fingerprints, and student credentials.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E5C158] hover:to-[#C59F30] text-[#0B251E] font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? "Submitting..." : "Submit for Admin Review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReplacementForm(false)}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
