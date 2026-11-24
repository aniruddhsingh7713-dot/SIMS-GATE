"use client";

import * as React from "react";
import { useState, useId, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Eye, EyeOff, X, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getClientDeviceMetadata, getDeviceHeaders } from "@/lib/deviceFingerprint";

/* --------------------------------------------------------------------------
   Typewriter Component
   -------------------------------------------------------------------------- */
export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-[#C5A059] font-light">{cursor}</span>
    </span>
  );
}

/* --------------------------------------------------------------------------
   Dynamic Falling Golden Leaves (Awwwards Fluid Physics Canvas)
   Leaves detach specifically from the SIMS Golden Tree canopy with 3D flutter
   -------------------------------------------------------------------------- */
interface ActiveGoldenLeaf {
  active: boolean;
  delay: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  speedY: number;
  swaySpeed: number;
  swayAmp: number;
  swayPhase: number;
  flipPhase: number;
  flipSpeed: number;
  angle: number;
  angularSpeed: number;
  opacity: number;
  color: string;
  darkColor: string;
}

interface GoldenSpore {
  x: number;
  y: number;
  originX: number;
  size: number;
  speedY: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  alpha: number;
  maxAlpha: number;
}

interface GoldenLeavesCanvasProps {
  treeRef: React.RefObject<HTMLDivElement | null>;
}

function GoldenLeavesCanvas({ treeRef }: GoldenLeavesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const goldPalettes = [
      { light: "#F5E4B8", main: "#D4AF37", dark: "#99731E" },
      { light: "#F9EDC7", main: "#C5A059", dark: "#8A6B29" },
      { light: "#FFF0C2", main: "#E5C158", dark: "#A88320" },
      { light: "#F3E5AB", main: "#DFB748", dark: "#92711D" },
    ];

    // Spawn leaf strictly from tree canopy coordinates
    const spawnLeafFromTree = (delay = 0, initialYOffset = 0): ActiveGoldenLeaf => {
      let spawnX = width * 0.5;
      let spawnY = height * 0.32;

      if (treeRef.current && canvas) {
        const treeRect = treeRef.current.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        if (treeRect.width > 20 && treeRect.height > 20) {
          const relLeft = treeRect.left - canvasRect.left;
          const relTop = treeRect.top - canvasRect.top;
          const treeW = treeRect.width;
          const treeH = treeRect.height;
          // Spawn across the full golden canopy branches
          spawnX = relLeft + treeW * (0.22 + Math.random() * 0.56);
          spawnY = relTop + treeH * (0.12 + Math.random() * 0.32);
        }
      }

      const palette = goldPalettes[Math.floor(Math.random() * goldPalettes.length)];
      const startY = spawnY + initialYOffset;

      return {
        active: delay === 0,
        delay,
        x: spawnX,
        y: startY,
        originX: spawnX,
        originY: spawnY,
        size: Math.random() * 3.5 + 9.5,
        speedY: Math.random() * 0.38 + 0.48,
        swaySpeed: Math.random() * 0.018 + 0.012,
        swayAmp: Math.random() * 16 + 18,
        swayPhase: Math.random() * Math.PI * 2,
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.028 + 0.016,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.016,
        opacity: initialYOffset > 0 ? 0.88 : 0,
        color: palette.main,
        darkColor: palette.dark,
      };
    };

    // Staggered initial leaves: one already mid-descent, one detaching, two queued
    const leaves: ActiveGoldenLeaf[] = [
      spawnLeafFromTree(0, height * 0.22),
      spawnLeafFromTree(0, 0),
      spawnLeafFromTree(55),
      spawnLeafFromTree(115),
    ];

    // Ambient floating golden spores (lightweight motes of knowledge)
    const spores: GoldenSpore[] = Array.from({ length: 14 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      originX: Math.random() * width,
      size: Math.random() * 1.4 + 0.6,
      speedY: Math.random() * 0.22 + 0.16,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.015 + 0.008,
      swayAmp: Math.random() * 12 + 6,
      alpha: Math.random() * 0.5 + 0.2,
      maxAlpha: Math.random() * 0.5 + 0.25,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render ambient golden spores
      for (let s = 0; s < spores.length; s++) {
        const sp = spores[s];
        sp.y += sp.speedY;
        sp.swayPhase += sp.swaySpeed;
        sp.x = sp.originX + Math.sin(sp.swayPhase) * sp.swayAmp;

        if (sp.y > height) {
          sp.y = -10;
          sp.originX = Math.random() * width;
          sp.x = sp.originX;
        }

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = "#C5A059";
        ctx.globalAlpha = sp.alpha * 0.45;
        ctx.fill();
      }

      // 2. Render falling golden leaves
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        if (!leaf.active) {
          if (leaf.delay > 0) {
            leaf.delay--;
          } else {
            leaves[i] = spawnLeafFromTree(0);
          }
          continue;
        }

        leaf.y += leaf.speedY;
        leaf.swayPhase += leaf.swaySpeed;
        leaf.x = leaf.originX + Math.sin(leaf.swayPhase) * leaf.swayAmp + Math.cos(leaf.swayPhase * 0.4) * 6;
        leaf.flipPhase += leaf.flipSpeed;
        leaf.angle += leaf.angularSpeed;

        const distFromOrigin = leaf.y - leaf.originY;
        if (distFromOrigin < 45) {
          leaf.opacity = Math.min(0.95, (distFromOrigin / 45) * 0.95);
        } else if (leaf.y > height - 75) {
          leaf.opacity = Math.max(0, (height - leaf.y) / 75);
        } else {
          leaf.opacity = 0.95;
        }

        if (leaf.y >= height || leaf.opacity <= 0.01) {
          leaf.active = false;
          leaf.delay = Math.floor(Math.random() * 60 + 40);
          continue;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);

        const flipScale = Math.cos(leaf.flipPhase);
        const isBackFacing = flipScale < 0;

        ctx.scale((leaf.size / 10) * flipScale, leaf.size / 10);
        ctx.fillStyle = isBackFacing ? leaf.darkColor : leaf.color;
        ctx.globalAlpha = leaf.opacity;

        // Golden soft halo
        ctx.shadowColor = "#D4AF37";
        ctx.shadowBlur = 6;

        // Botanical Leaf Body: Curved tip and delicate teardrop flank
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.bezierCurveTo(7, -6, 8, 4, 0, 11);
        ctx.bezierCurveTo(-8, 4, -7, -6, 0, -11);
        ctx.closePath();
        ctx.fill();

        // Leaf Spine / Vein Detail
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isBackFacing ? "rgba(255, 235, 175, 0.4)" : "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 9);
        // Side branch veins
        ctx.moveTo(0, -4);
        ctx.lineTo(3.5, -2);
        ctx.moveTo(0, 1);
        ctx.lineTo(-3.5, 3);
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [treeRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}

/* --------------------------------------------------------------------------
   Awwwards Style Password Input
   -------------------------------------------------------------------------- */
interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn(
              "h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 pe-10 text-sm text-[#0B192C] transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10",
              className
            )}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-[#94A3B8] transition-colors hover:text-[#0B192C] focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

/* --------------------------------------------------------------------------
   Live Django Backend Integrated Sign In Form
   -------------------------------------------------------------------------- */
function SignInForm({
  onSuccess,
  onSwitchToSignUp,
  initialDestination = "dashboard",
  onDestinationChange,
}: {
  onSuccess?: () => void;
  onSwitchToSignUp: () => void;
  initialDestination?: "dashboard" | "test-series";
  onDestinationChange?: (dest: "dashboard" | "test-series") => void;
}) {
  const router = useRouter();
  const { loginUser, triggerDeviceLimitExceeded } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [destination, setDestinationState] = useState<"dashboard" | "test-series">(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/test-series")) {
      return "test-series";
    }
    return initialDestination;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialDestination) {
      setDestinationState(initialDestination);
    }
  }, [initialDestination]);

  const selectDestination = (dest: "dashboard" | "test-series") => {
    setDestinationState(dest);
    if (onDestinationChange) {
      onDestinationChange(dest);
    }
  };

  const handleRedirect = (authedUser: any) => {
    if (authedUser?.is_staff) {
      window.location.href = "http://127.0.0.1:8000/admin/";
      return;
    }
    if (authedUser?.role === "teacher") {
      window.location.href = "/dashboard?role=teacher";
      return;
    }

    if (destination === "test-series") {
      if (onSuccess) {
        onSuccess();
      }
      window.location.href = "/test-series";
      return;
    }

    // Default to /dashboard
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect") || urlParams.get("next");
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/test-series")) {
        window.location.href = redirectParam;
        return;
      }
    }

    if (onSuccess) {
      onSuccess();
    }
    window.location.href = "/dashboard";
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const devMeta = getClientDeviceMetadata();
      const res = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDeviceHeaders() },
        body: JSON.stringify({
          username: identifier.trim(),
          password: password,
          ...devMeta,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "DEVICE_LIMIT_EXCEEDED" && triggerDeviceLimitExceeded) {
          triggerDeviceLimitExceeded(data.device_limit);
        }
        setError(data.error || "Invalid username/email or password.");
      } else {
        setSuccess(data.message || "Welcome back to SIMS GATE!");
        loginUser(data.user);
        setTimeout(() => {
          handleRedirect(data.user);
        }, 300);
      }
    } catch {
      setError("Cannot reach authentication server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#0B192C]">
          Welcome Back
        </h2>
        <p className="text-xs text-[#64748B]">
          Select your portal destination and enter your credentials.
        </p>
      </div>

      {/* Two Portal Selection Tabs: Dashboard or Test Portal */}
      <div className="flex flex-col gap-1.5 text-left bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">
            Sign-In Target:
          </span>
          <span className="text-[11px] font-bold text-[#8C6D23]">
            {destination === "dashboard" ? "🎓 Classroom & Batches" : "🏆 CBT Mock Tests"}
          </span>
        </div>
        <div className="relative grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => selectDestination("dashboard")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              destination === "dashboard"
                ? "text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {destination === "dashboard" && (
              <motion.div
                layoutId="activePortalDestination"
                className="absolute inset-0 bg-[#0B192C] rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">🎓</span>
            <span className="relative z-10">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => selectDestination("test-series")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              destination === "test-series"
                ? "text-[#0B192C]"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {destination === "test-series" && (
              <motion.div
                layoutId="activePortalDestination"
                className="absolute inset-0 bg-[#C5A059] rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">🏆</span>
            <span className="relative z-10">Test Portal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-1.5 text-left">
          <label
            htmlFor="signin-identifier"
            className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
          >
            Email or Username
          </label>
          <input
            id="signin-identifier"
            name="username"
            type="text"
            placeholder="student@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#0B192C] transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10"
          />
        </div>

        <PasswordInput
          id="signin-password"
          name="password"
          label="Password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0B192C] px-5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#102A43] hover:shadow-lg hover:shadow-[#0B192C]/25 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>
                {destination === "dashboard" ? "Sign In to Dashboard" : "Sign In to Test Portal"}
              </span>
              <ArrowRight className="size-4 text-[#C5A059] transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

      {/* Switch to Create Account trigger */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-xs text-[#64748B] hover:text-[#0B192C] font-medium transition-colors cursor-pointer group"
        >
          New aspirant at SIMS GATE?{" "}
          <span className="font-bold text-[#8C6D23] underline decoration-[#C5A059]/40 underline-offset-4 group-hover:decoration-[#C5A059]">
            Create account →
          </span>
        </button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------------------
   Live Django Backend Integrated Sign Up Form
   -------------------------------------------------------------------------- */
function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
  initialDestination = "dashboard",
  onDestinationChange,
}: {
  onSuccess?: () => void;
  onSwitchToSignIn: () => void;
  initialDestination?: "dashboard" | "test-series";
  onDestinationChange?: (dest: "dashboard" | "test-series") => void;
}) {
  const router = useRouter();
  const { loginUser, triggerDeviceLimitExceeded } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("Computer Science (CSE)");
  const [password, setPassword] = useState("");
  const [destination, setDestinationState] = useState<"dashboard" | "test-series">(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/test-series")) {
      return "test-series";
    }
    return initialDestination;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialDestination) {
      setDestinationState(initialDestination);
    }
  }, [initialDestination]);

  const selectDestination = (dest: "dashboard" | "test-series") => {
    setDestinationState(dest);
    if (onDestinationChange) {
      onDestinationChange(dest);
    }
  };

  const handleRedirect = (authedUser: any) => {
    if (authedUser?.is_staff) {
      window.location.href = "http://127.0.0.1:8000/admin/";
      return;
    }
    if (authedUser?.role === "teacher") {
      window.location.href = "/dashboard?role=teacher";
      return;
    }

    if (destination === "test-series") {
      if (onSuccess) {
        onSuccess();
      }
      window.location.href = "/test-series";
      return;
    }

    // Default to /dashboard
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect") || urlParams.get("next");
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/test-series")) {
        window.location.href = redirectParam;
        return;
      }
    }

    if (onSuccess) {
      onSuccess();
    }
    window.location.href = "/dashboard";
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Full Name is mandatory.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid Email Address is mandatory.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Phone number is mandatory.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!branch.trim()) {
      setError("Target Discipline is mandatory.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password is mandatory (minimum 6 characters).");
      return;
    }

    setLoading(true);

    try {
      const devMeta = getClientDeviceMetadata();
      const res = await fetch("http://127.0.0.1:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDeviceHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: cleanPhone,
          target_branch: branch,
          target_exam: "GATE 2026",
          password: password,
          ...devMeta,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please check your details.");
      } else {
        setSuccess(data.message || "Account created successfully! Redirecting to dashboard...");
        loginUser(data.user);
        setTimeout(() => {
          handleRedirect(data.user);
        }, 350);
      }
    } catch {
      setError("Cannot reach registration server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#0B192C]">
          Create Account
        </h2>
        <p className="text-xs text-[#64748B]">
          Register for test series enrollment, batch schedule &amp; faculty cabin passes.
        </p>
      </div>

      {/* Two Portal Selection Tabs: Dashboard or Test Portal */}
      <div className="flex flex-col gap-1.5 text-left bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">
            Select Portal Target:
          </span>
          <span className="text-[11px] font-bold text-[#8C6D23]">
            {destination === "dashboard" ? "🎓 Classroom & Batches" : "🏆 CBT Mock Tests"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => selectDestination("dashboard")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              destination === "dashboard"
                ? "bg-[#0B192C] text-white shadow-sm ring-1 ring-[#0B192C]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <span>🎓</span>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => selectDestination("test-series")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              destination === "test-series"
                ? "bg-[#C5A059] text-[#0B192C] shadow-sm ring-1 ring-[#C5A059]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <span>🏆</span>
            <span>Test Portal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-1 text-left">
          <label
            htmlFor="signup-name"
            className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
          >
            Full Name *
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            placeholder="e.g. Vikram Aditya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0B192C] transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 text-left">
            <label
              htmlFor="signup-email"
              className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
            >
              Email Address *
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0B192C] transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10"
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label
              htmlFor="signup-phone"
              className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
            >
              Phone / WhatsApp (10 Digits) *
            </label>
            <input
              id="signup-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              autoComplete="tel"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0B192C] transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label
            htmlFor="signup-branch"
            className="text-[11px] font-semibold tracking-wider text-[#475569] uppercase"
          >
            Target Discipline *
          </label>
          <select
            id="signup-branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0B192C] transition-all duration-200 focus:border-[#C5A059] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C5A059]/10"
          >
            <option value="Computer Science (CSE)">Computer Science &amp; IT (CSE)</option>
            <option value="Data Science & AI (DA)">Data Science &amp; AI (DA)</option>
            <option value="Engineering Mathematics">Engineering Mathematics &amp; Aptitude</option>
            <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
            <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
          </select>
        </div>

        <PasswordInput
          id="signup-password"
          name="password"
          label="Password (min. 6 characters) *"
          placeholder="Create secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] px-5 text-sm font-bold text-[#0B192C] shadow-md shadow-[#C5A059]/25 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Creating Profile...</span>
            </>
          ) : (
            <>
              <span>
                {destination === "dashboard"
                  ? "Register & Enter Dashboard"
                  : "Register & Enter Test Portal"}
              </span>
              <ArrowRight className="size-4 text-[#0B192C] transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

      {/* Switch to Sign In trigger */}
      <div className="pt-1.5 text-center">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-xs text-[#64748B] hover:text-[#0B192C] font-medium transition-colors cursor-pointer group"
        >
          Already registered with us?{" "}
          <span className="font-bold text-[#8C6D23] underline decoration-[#C5A059]/40 underline-offset-4 group-hover:decoration-[#C5A059]">
            Sign in to portal →
          </span>
        </button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------------------
   3D Perspective Wrap-Up & Morph Transition Variants
   User requirement: "mst animation se wrap uo hoke ya kuch sexy animation
   se wrap hpke login card c reate accnt me shoift ho"
   -------------------------------------------------------------------------- */
const wrapVariants: Variants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 55 : -55,
    x: direction > 0 ? 36 : -36,
    scale: 0.92,
    opacity: 0,
    filter: "blur(6px)",
  }),
  center: {
    rotateY: 0,
    x: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 340,
      damping: 27,
      mass: 0.75,
    },
  },
  exit: (direction: number) => ({
    rotateY: direction > 0 ? -55 : 55,
    x: direction > 0 ? -36 : 36,
    scale: 0.92,
    opacity: 0,
    filter: "blur(6px)",
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0],
    },
  }),
};

/* --------------------------------------------------------------------------
   Auth Form Container with 3D Spatial Wrap-Up Animation
   -------------------------------------------------------------------------- */
function AuthFormContainer({
  isSignIn,
  direction,
  onToggle,
  onSuccess,
  initialDestination = "dashboard",
  onDestinationChange,
}: {
  isSignIn: boolean;
  direction: number;
  onToggle: (state: boolean) => void;
  onSuccess?: () => void;
  initialDestination?: "dashboard" | "test-series";
  onDestinationChange?: (dest: "dashboard" | "test-series") => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center px-4 py-3 sm:px-0">
      {/* Awwwards Smooth Segmented Pill Switcher */}
      <div className="relative mb-5 flex rounded-xl bg-[#F1F5F9] p-1 border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={cn(
            "relative z-10 flex-1 py-2 text-xs font-bold tracking-wide transition-colors duration-200 text-center cursor-pointer",
            isSignIn ? "text-[#0B192C]" : "text-[#64748B] hover:text-[#0B192C]"
          )}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={cn(
            "relative z-10 flex-1 py-2 text-xs font-bold tracking-wide transition-colors duration-200 text-center cursor-pointer",
            !isSignIn ? "text-[#0B192C]" : "text-[#64748B] hover:text-[#0B192C]"
          )}
        >
          Create Account
        </button>
        <motion.div
          className="absolute inset-y-1 bg-white rounded-lg shadow-sm border border-[#C5A059]/30"
          animate={{
            left: isSignIn ? "4px" : "50%",
            right: isSignIn ? "50%" : "4px",
          }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
        />
      </div>

      {/* 3D Perspective Wrap-Up & Morph Container */}
      <div style={{ perspective: 1200 }} className="relative w-full">
        <motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {isSignIn ? (
              <motion.div
                key="signin-form"
                custom={direction}
                variants={wrapVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: "preserve-3d" }}
              >
                <SignInForm
                  onSuccess={onSuccess}
                  onSwitchToSignUp={() => onToggle(false)}
                  initialDestination={initialDestination}
                  onDestinationChange={onDestinationChange}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                custom={direction}
                variants={wrapVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: "preserve-3d" }}
              >
                <SignUpForm
                  onSuccess={onSuccess}
                  onSwitchToSignIn={() => onToggle(true)}
                  initialDestination={initialDestination}
                  onDestinationChange={onDestinationChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   AuthUI Props
   -------------------------------------------------------------------------- */
export interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

export interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  onClose?: () => void;
  isModal?: boolean;
  initialTab?: "login" | "signup";
  initialDestination?: "dashboard" | "test-series";
  onDestinationChange?: (dest: "dashboard" | "test-series") => void;
}

/* --------------------------------------------------------------------------
   Exported Awwwards-Crafted AuthUI Component
   User requirement: "logo wala same rhega dono mia ukso chamge mt krba"
   (The right panel stays rock-solid uninterrupted while left wraps up)
   -------------------------------------------------------------------------- */
export function AuthUI({
  onClose,
  isModal = false,
  initialTab = "login",
  initialDestination = "dashboard",
  onDestinationChange,
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialTab === "login");
  const [direction, setDirection] = useState(1);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSignIn(initialTab === "login");
  }, [initialTab]);

  const handleToggle = (toSignIn: boolean) => {
    if (toSignIn === isSignIn) return;
    setDirection(toSignIn ? -1 : 1);
    setIsSignIn(toSignIn);
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-white shadow-2xl transition-all duration-300",
        isModal
          ? "max-w-5xl rounded-3xl border border-[#CBD5E1]/70 max-h-[92vh] flex flex-col md:grid md:grid-cols-2"
          : "min-h-screen md:grid md:grid-cols-2"
      )}
    >
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Bespoke Awwwards Floating Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-30 flex size-9 items-center justify-center rounded-full bg-white/80 text-[#0B192C] shadow-md backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:scale-105 hover:bg-white hover:text-red-600 border border-[#E2E8F0] cursor-pointer"
          aria-label="Close authentication window"
        >
          <X className="size-4" />
        </button>
      )}

      {/* LEFT COLUMN: Pure White & Editorial Layout with 3D Wrap-Up Switch */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-white overflow-y-auto">
        <AuthFormContainer
          isSignIn={isSignIn}
          direction={direction}
          onToggle={handleToggle}
          onSuccess={onClose}
          initialDestination={initialDestination}
          onDestinationChange={onDestinationChange}
        />
      </div>

      {/* RIGHT COLUMN: Permanent Stable Royal Navy Atmosphere + Golden Tree + Falling Leaves */}
      {/* Kept 100% constant and uninterrupted across tab switches as requested */}
      <div
        className="relative hidden md:flex flex-col items-center justify-between p-8 text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, #152E4D 0%, #0B192C 60%, #050D18 100%)",
        }}
      >
        {/* Dynamic Falling Golden Leaves Canvas */}
        <GoldenLeavesCanvas treeRef={treeContainerRef} />

        {/* Ambient Golden Radial Glow */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-80 w-80 rounded-full bg-[#C5A059]/20 blur-3xl" />
        </div>

        {/* Centerpiece: Floating Grand SIMS Golden Tree Logo */}
        <div
          ref={treeContainerRef}
          className="relative z-20 flex flex-col items-center text-center my-auto py-4"
        >
          <motion.div
            className="relative mb-4 flex items-center justify-center p-2"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Ethereal Golden Tree Canopy Radiance */}
            <div className="pointer-events-none absolute -inset-6 z-0 flex items-center justify-center">
              <div
                className="h-56 w-56 rounded-full bg-gradient-to-tr from-[#C5A059]/30 via-[#E2B962]/20 to-transparent blur-2xl animate-pulse"
                style={{ animationDuration: "5s" }}
              />
            </div>

            <Image
              src="/sims-logo.png"
              alt="SIMS Raipur Official Logo"
              width={360}
              height={360}
              priority
              className="relative z-10 h-44 sm:h-52 md:h-56 w-auto object-contain drop-shadow-[0_20px_45px_rgba(197,160,89,0.55)] transition-transform duration-700 hover:scale-105"
            />
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-[0.22em] text-[#C5A059] uppercase">
              SIMS GATE
            </span>
          </div>
          <p className="text-xs text-[#CBD5E1] tracking-widest uppercase font-semibold">
            Raipur Campus · Shaping Minds, Building Futures
          </p>
        </div>

        {/* Floating Minimalist Motto (Unboxed & Clean) */}
        <div className="relative z-20 w-full text-center pb-2">
          <p className="font-serif text-xs sm:text-sm font-medium leading-relaxed italic text-white/85">
            &ldquo;Excellence is the result of disciplined execution.&rdquo;
          </p>
          <span className="mt-1 block text-[10px] font-semibold tracking-widest uppercase text-[#C5A059]/75">
            SIMS Academic Directorate
          </span>
        </div>

        {/* Bottom edge gold accent */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-60" />
      </div>
    </div>
  );
}

export default AuthUI;
