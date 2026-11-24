"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, CheckCircle2, Lock, X, AlertCircle, Sparkles, Smartphone, CreditCard, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface CheckoutCourse {
  id: number;
  title: string;
  slug: string;
  price: string | number;
  duration?: string;
  category?: string;
  exam_name?: string;
}

interface RazorpayCheckoutModalProps {
  course: CheckoutCourse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (courseSlug: string) => void;
  isTestSeries?: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutModal({
  course,
  isOpen,
  onClose,
  onSuccess,
  isTestSeries = false,
}: RazorpayCheckoutModalProps) {
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const isTestSeriesPurchase = Boolean(
    isTestSeries ||
    (course && (
      course.category === "TEST_SERIES" ||
      course.slug.toLowerCase().includes("test") ||
      course.title.toLowerCase().includes("test series") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/test-series"))
    ))
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState<any>(null);
  const [testMethod, setTestMethod] = useState<"upi" | "card" | "netbanking">("upi");

  if (!isOpen || !course) return null;

  const numPrice = Number(course.price) || 0;
  const formattedPrice = numPrice.toLocaleString("en-IN");

  const handleClose = () => {
    setSandboxOrderData(null);
    setErrorMessage(null);
    setPaymentSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleInitiatePayment = async () => {
    setErrorMessage(null);

    if (!isAuthenticated || !user) {
      handleClose();
      openAuthModal("login");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on Django backend
      const res = await fetch("http://127.0.0.1:8000/api/courses/checkout/create-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          user_id: user.id,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        if (orderData.already_enrolled) {
          if (isTestSeriesPurchase || orderData.is_test_series) {
            setErrorMessage("You are already actively enrolled in this Test Series! Opening your CBT portal...");
            setTimeout(() => {
              handleClose();
              window.location.href = `/test-series?purchased=1&course_id=${course.id}`;
            }, 1200);
          } else {
            setErrorMessage("You are already enrolled in this course!");
            setTimeout(() => {
              handleClose();
              router.push("/dashboard/courses");
            }, 1500);
          }
          return;
        }
        throw new Error(orderData.error || "Failed to initialize order.");
      }

      // 2. If it's a real live Razorpay order and we have a valid key, load Razorpay checkout script
      if (orderData.is_live_razorpay) {
        const isLoaded = await loadRazorpayScript();

        if (isLoaded && (window as any).Razorpay) {
          const options = {
            key: orderData.key_id,
            amount: orderData.amount_paise,
            currency: orderData.currency || "INR",
            name: "SIMS GATE Raipur",
            description: `Enrollment: ${course.title}`,
            image: "/sims-logo.png",
            order_id: orderData.razorpay_order_id,
            handler: async function (response: any) {
              await verifyPayment({
                order_id: orderData.order_id,
                razorpay_order_id: response.razorpay_order_id || orderData.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || "test_signature",
                payment_method: "Razorpay Live Gateway",
              });
            },
            prefill: {
              name: orderData.prefill?.name || user.full_name || user.username,
              email: orderData.prefill?.email || user.email,
              contact: orderData.prefill?.contact || user.phone || "",
            },
            theme: {
              color: "#0B192C",
            },
            modal: {
              ondismiss: function () {
                setLoading(false);
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", function (response: any) {
            setErrorMessage(response.error?.description || "Payment failed. Please try again.");
            setLoading(false);
          });
          rzp.open();
          return;
        }
      }

      // 3. Fallback to in-modal Razorpay Sandbox Simulator when live credentials are not active
      setSandboxOrderData(orderData);
      setLoading(false);
    } catch (err: any) {
      console.error("Checkout initialization failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setLoading(false);
    }
  };

  const handleConfirmSandboxPayment = async () => {
    if (!sandboxOrderData) return;
    setLoading(true);
    setErrorMessage(null);

    const methodLabels: Record<string, string> = {
      upi: "UPI (Google Pay / PhonePe)",
      card: "Credit / Debit Card",
      netbanking: "Net Banking (SBI / HDFC)",
    };

    await verifyPayment({
      order_id: sandboxOrderData.order_id,
      razorpay_order_id: sandboxOrderData.razorpay_order_id,
      razorpay_payment_id: `pay_sims_${sandboxOrderData.order_id}_${Date.now()}`,
      razorpay_signature: "sims_sandbox_signature",
      payment_method: methodLabels[testMethod] || "Razorpay Sandbox Simulator",
    });
  };

  const verifyPayment = async (payload: {
    order_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    payment_method?: string;
  }) => {
    try {
      const verifyRes = await fetch("http://127.0.0.1:8000/api/courses/checkout/verify-payment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          user_id: user?.id,
          payment_method: payload.payment_method || "Razorpay Standard (UPI/Card)",
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setPaymentSuccess(true);
        setLoading(false);
        setTimeout(() => {
          handleClose();
          onSuccess?.(course.slug);
          if (isTestSeriesPurchase) {
            window.location.href = `/test-series?purchased=1&course_id=${course.id}`;
          } else {
            router.push(`/dashboard/courses?purchased=${course.slug}`);
          }
        }, 1800);
      } else {
        throw new Error(verifyData.error || "Payment signature verification failed.");
      }
    } catch (err: any) {
      console.error("Payment verification failed:", err);
      setErrorMessage(err.message || "Payment verification failed. Please contact academic support.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#15271E] via-[#C5A059] to-[#15271E]" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close checkout modal"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentSuccess ? (
          /* Payment Success State */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans text-2xl font-bold text-slate-900">
                Payment Successful!
              </h3>
              <p className="text-sm text-slate-600">
                {isTestSeriesPurchase ? (
                  <>
                    Congratulations! Your access to <strong>{course.title}</strong> has been activated. Redirecting to your Test Series Portal...
                  </>
                ) : (
                  <>
                    Congratulations! Your admission to <strong>{course.title}</strong> has been confirmed. Redirecting to your learning dashboard...
                  </>
                )}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              {isTestSeriesPurchase
                ? "Redirecting you to your All-India GATE CBT Test Portal..."
                : "Redirecting you to your active courses dashboard..."}
            </div>
          </div>
        ) : sandboxOrderData ? (
          /* Razorpay Sandbox Payment Simulator View */
          <div className="p-6 sm:p-8 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Razorpay Gateway</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      SANDBOX TEST MODE
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">SIMS GATE Raipur Admissions</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Payable</span>
                <span className="font-sans text-lg font-black text-slate-900">₹{formattedPrice}</span>
              </div>
            </div>

            {/* Simulated Payment Methods */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select Test Payment Mode
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setTestMethod("upi")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    testMethod === "upi"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">UPI / QR (Instant)</span>
                      <span className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                  <span className={`size-4 rounded-full border-2 flex items-center justify-center ${testMethod === "upi" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {testMethod === "upi" && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestMethod("card")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    testMethod === "card"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Test Debit / Credit Card</span>
                      <span className="text-[11px] text-slate-500">Visa, MasterCard, RuPay (Test 4111...)</span>
                    </div>
                  </div>
                  <span className={`size-4 rounded-full border-2 flex items-center justify-center ${testMethod === "card" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {testMethod === "card" && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestMethod("netbanking")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    testMethod === "netbanking"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Net Banking</span>
                      <span className="text-[11px] text-slate-500">SBI, HDFC, ICICI, Axis Bank</span>
                    </div>
                  </div>
                  <span className={`size-4 rounded-full border-2 flex items-center justify-center ${testMethod === "netbanking" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {testMethod === "netbanking" && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSandboxPayment}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0B192C] hover:bg-[#152A42] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying &amp; Unlocking Course...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#C5A059]" />
                    <span>Simulate Successful Payment (Instant Unlock)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSandboxOrderData(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center cursor-pointer"
              >
                ← Back to Order Summary
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Details Form */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
                <Image
                  src="/sims-logo.png"
                  alt="SIMS Raipur Official Logo"
                  width={42}
                  height={42}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                  Official Admission Checkout
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                  {course.title}
                </h3>
              </div>
            </div>

            {/* Price & Summary Card */}
            <div className="rounded-2xl bg-[#FAF8F5] border border-amber-200/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Course Tuition Fee</span>
                <span className="text-2xl font-serif font-extrabold text-[#15271E]">
                  ₹{formattedPrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-amber-200/40">
                <span>Access Duration</span>
                <span className="font-semibold text-slate-700">{course.duration || "12 Months Full Access"}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>GST & Taxes</span>
                <span className="font-semibold text-emerald-700">Included in Price</span>
              </div>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Student Details Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Enrolling Student
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-slate-800 block">
                    {user?.full_name || user?.username || "Guest Aspirant"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {user?.email || "Login required before payment"}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 py-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Secure Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <span>Razorpay Encrypted</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#0B192C] hover:bg-[#152A42] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>Proceed to Pay ₹{formattedPrice}</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                By proceeding, you agree to SIMS GATE Academic Terms & Admissions Code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
