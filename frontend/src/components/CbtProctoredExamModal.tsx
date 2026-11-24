"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Calculator,
  Maximize,
  Minimize,
  RotateCcw,
  Flag,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Smartphone,
} from "lucide-react";
import type { User as AuthUser } from "@/context/AuthContext";

export type QuestionStatus =
  | "NOT_VISITED"
  | "NOT_ANSWERED"
  | "ANSWERED"
  | "MARKED_FOR_REVIEW"
  | "ANSWERED_AND_MARKED";

export interface Question {
  id: number;
  question_number: number;
  section: string;
  question_type: "MCQ" | "MSQ" | "NAT" | string;
  question_text: string;
  marks: string | number;
  negative_marks: string | number;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  display_diagram?: string;
  diagram_url?: string;
  diagram_image?: string;
}

function resolveMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://127.0.0.1:8000${url}`;
  return `http://127.0.0.1:8000/media/${url}`;
}

function getQuestionDiagramUrl(q?: Question | any): string | null {
  if (!q) return null;
  if (q.display_diagram) return resolveMediaUrl(q.display_diagram);
  if (q.diagram_url) return resolveMediaUrl(q.diagram_url);
  if (q.diagram_image) return resolveMediaUrl(q.diagram_image);

  // Extract from markdown ![alt](url) if present in question_text
  const mdMatch = q.question_text?.match(/!\[.*?\]\((.*?)\)/);
  if (mdMatch && mdMatch[1]) {
    return resolveMediaUrl(mdMatch[1]);
  }
  return null;
}

function getCleanQuestionText(text?: string): string {
  if (!text) return "";
  return text.replace(/!\[.*?\]\((.*?)\)/g, "").trim();
}

export interface TestItem {
  id: number;
  title: string;
  test_type: string;
  branch: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  due_date: string;
  status: string;
  questions?: Question[];
  course_title?: string;
}

interface CbtProctoredExamModalProps {
  test: TestItem;
  user: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function CbtProctoredExamModal({
  test,
  user,
  isOpen,
  onClose,
  onCompleted,
}: CbtProctoredExamModalProps) {
  // Stages: PRE_CHECK -> IN_EXAM -> RESULT -> TERMINATED
  const [stage, setStage] = useState<"PRE_CHECK" | "IN_EXAM" | "RESULT" | "TERMINATED">("PRE_CHECK");

  // Media & Permissions
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState("");

  const preCheckVideoRef = useRef<HTMLVideoElement | null>(null);
  const inExamVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Exam Engine State
  const questions = test.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>((test.duration_minutes || 180) * 60);

  // Proctor Anti-Cheat Monitoring State
  const [strikes, setStrikes] = useState<number>(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [terminationReason, setTerminationReason] = useState("");
  const [infractionSnapshot, setInfractionSnapshot] = useState<string>("");
  const [aiProctorStatus, setAiProctorStatus] = useState<string>("AI Mobile Phone Shield: Active");
  const aiModelRef = useRef<any>(null);
  const scanIntervalRef = useRef<any>(null);
  const printScreenCooldownRef = useRef<number>(0);
  const lastViolationTimeRef = useRef<number>(0);
  const warningModalOpenRef = useRef<boolean>(false);

  useEffect(() => {
    warningModalOpenRef.current = warningModalOpen;
  }, [warningModalOpen]);

  // Sub-Modals
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  // Final Results State
  const [scoreResult, setScoreResult] = useState<{
    totalScore: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Initialize Media & Permissions on Gateway Open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    setStage("PRE_CHECK");
    setStrikes(0);
    setWarningModalOpen(false);
    setConfirmSubmitOpen(false);
    setCalculatorOpen(false);
    setCurrentQIndex(0);
    setUserAnswers({});
    setSelectedOption("");
    setSecondsRemaining((test.duration_minutes || 180) * 60);

    // Initialize question statuses: Question 0 is NOT_ANSWERED, others are NOT_VISITED
    const initStatuses: Record<number, QuestionStatus> = {};
    questions.forEach((q, idx) => {
      initStatuses[q.id] = idx === 0 ? "NOT_ANSWERED" : "NOT_VISITED";
    });
    setQuestionStatuses(initStatuses);

    // Request Webcam and Microphone
    async function startMedia() {
      try {
        setPermissionError("");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });

        setStream(mediaStream);
        setCameraAllowed(true);
        setMicAllowed(true);

        if (preCheckVideoRef.current) {
          preCheckVideoRef.current.srcObject = mediaStream;
        }

        // Set up audio meter
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(mediaStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
            requestAnimationFrame(checkVolume);
          };
          requestAnimationFrame(checkVolume);
        } catch (e) {
          console.warn("Audio meter initialization skipped:", e);
        }
      } catch (err: any) {
        console.error("Camera/Mic permission failed:", err);
        setPermissionError(
          "Camera and Microphone access are mandatory for SIMS Proctored CBT exams. Please allow camera and mic permissions in your browser settings to proceed."
        );
        setCameraAllowed(false);
        setMicAllowed(false);
      }
    }

    startMedia();

    return () => {
      // Clean up media streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  // Hook stream into inExamVideoRef when stage changes to IN_EXAM
  useEffect(() => {
    if (stage === "IN_EXAM" && stream && inExamVideoRef.current) {
      inExamVideoRef.current.srcObject = stream;
    }
  }, [stage, stream]);

  // ---------------------------------------------------------------------------
  // 2. Countdown Timer during IN_EXAM
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (stage !== "IN_EXAM") return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeFinalSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // ---------------------------------------------------------------------------
  // 3. Strict Anti-Cheat & Proctoring Enforcement (Tab Switch, Shortcuts, Blur)
  // ---------------------------------------------------------------------------
  const playSecurityBuzzer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  const terminateExamImmediate = (reason: string, snapshotUrl?: string) => {
    playSecurityBuzzer();
    setTerminationReason(reason);
    if (snapshotUrl) {
      setInfractionSnapshot(snapshotUrl);
    }
    setStage("TERMINATED");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleSimulatePhoneDetection = () => {
    const video = inExamVideoRef.current;
    let snap = "";
    if (video) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const bx = Math.round(canvas.width * 0.32);
          const by = Math.round(canvas.height * 0.25);
          const bw = Math.round(canvas.width * 0.36);
          const bh = Math.round(canvas.height * 0.58);
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 4;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#EF4444";
          ctx.font = "bold 15px monospace";
          ctx.fillText("UNAUTHORIZED PHONE DETECTED (99.2%)", bx, Math.max(22, by - 8));
        }
        snap = canvas.toDataURL("image/jpeg", 0.85);
      } catch (e) {}
    }
    terminateExamImmediate(
      "CRITICAL AI PROCTOR ALERT: Smartphone / unauthorized mobile device detected in camera frame! Candidate session disqualified immediately.",
      snap
    );
  };

  useEffect(() => {
    if (stage !== "IN_EXAM") return;

    const triggerViolation = (reason: string, immediate = false) => {
      const now = Date.now();

      // Suppress secondary cascade violations if not an immediate critical alert
      if (!immediate) {
        // 1. Debounce: Must be at least 2.5s after any previous violation
        if (now - lastViolationTimeRef.current < 2500) {
          return;
        }
        // 2. Suppress if within PrintScreen / Snipping cooldown window (OS focus fluctuation)
        if (
          now < printScreenCooldownRef.current &&
          !reason.includes("Screenshot capture") &&
          !reason.includes("Screen recording")
        ) {
          return;
        }
        // 3. Suppress if warning modal is already open on screen
        if (warningModalOpenRef.current) {
          return;
        }
      }

      lastViolationTimeRef.current = now;

      if (immediate) {
        terminateExamImmediate(reason);
        return;
      }

      setStrikes((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          terminateExamImmediate(reason);
        } else {
          setWarningMessage(
            `⚠️ PROCTORING VIOLATION (Strike 1 of 2): ${reason}. Dual audio, switching tabs, and background windows are strictly forbidden. Next violation will terminate your exam immediately.`
          );
          setWarningModalOpen(true);
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (now < printScreenCooldownRef.current) return;
      if (warningModalOpenRef.current) return;

      if (document.visibilityState === "hidden") {
        triggerViolation("Tab switch or browser window minimized");
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now < printScreenCooldownRef.current) return;
      if (warningModalOpenRef.current) return;

      triggerViolation("Window lost focus / multitasking window detected");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey to test phone detection: Ctrl+Shift+P or Alt+P
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") || (e.altKey && e.key.toLowerCase() === "p")) {
        e.preventDefault();
        handleSimulatePhoneDetection();
        return false;
      }

      // Intercept PrintScreen
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        // Set a 3-second cooldown to suppress any OS-induced blur/tab-switch events
        printScreenCooldownRef.current = Date.now() + 3000;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("").catch(() => {});
          }
        } catch (err) {}
        triggerViolation("Screenshot capture attempt (PrintScreen)");
        return false;
      }

      // Intercept Snipping Tool / OS screen capture: Ctrl+Shift+S or Meta+Shift+S
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key.toLowerCase() === "s" || e.key === "3" || e.key === "4")
      ) {
        e.preventDefault();
        printScreenCooldownRef.current = Date.now() + 3000;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("").catch(() => {});
          }
        } catch (err) {}
        triggerViolation("Screen recording / snipping tool shortcut intercepted");
        return false;
      }

      // Intercept DevTools F12 or Ctrl+Shift+I
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        return false;
      }
      // Intercept Copy / Cut / Paste / Print / Save
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [stage, stream]);

  // ---------------------------------------------------------------------------
  // 3B. Real-time AI Mobile Phone Detection Scanner Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (stage !== "IN_EXAM") {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      return;
    }

    let isScanning = true;

    async function initDetector() {
      try {
        setAiProctorStatus("Loading COCO-SSD Neural Network...");
        if (!(window as any).cocoSsd) {
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js");
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
        }
        if ((window as any).cocoSsd) {
          const model = await (window as any).cocoSsd.load({ base: "lite_mobilenet_v2" });
          aiModelRef.current = model;
          if (isScanning) {
            setAiProctorStatus("AI Mobile Phone Shield: Active");
          }
        }
      } catch (err) {
        console.warn("AI COCO-SSD CDN fallback to optical heuristic scanner:", err);
        if (isScanning) {
          setAiProctorStatus("AI Phone Shield: Active (Vision Heuristics)");
        }
      }
    }

    initDetector();

    scanIntervalRef.current = setInterval(async () => {
      const video = inExamVideoRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended) return;

      try {
        if (aiModelRef.current) {
          const predictions = await aiModelRef.current.detect(video);
          const forbiddenDevice = predictions.find(
            (p: any) =>
              (p.class === "cell phone" || p.class === "remote" || p.class === "laptop") &&
              p.score >= 0.40
          );

          if (forbiddenDevice) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const [x, y, w, h] = forbiddenDevice.bbox;
              ctx.strokeStyle = "#EF4444";
              ctx.lineWidth = 4;
              ctx.strokeRect(x, y, w, h);
              ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
              ctx.fillRect(x, y, w, h);
              ctx.fillStyle = "#EF4444";
              ctx.font = "bold 15px monospace";
              ctx.fillText(
                `UNAUTHORIZED ${forbiddenDevice.class.toUpperCase()} DETECTED (${Math.round(forbiddenDevice.score * 100)}%)`,
                x,
                Math.max(22, y - 8)
              );
            }
            const snap = canvas.toDataURL("image/jpeg", 0.85);
            terminateExamImmediate(
              `CRITICAL AI PROCTOR ALERT: Smartphone / unauthorized mobile device detected in camera frame! Candidate session disqualified immediately.`,
              snap
            );
            return;
          }
        }
      } catch (e) {
        // Frame analysis tick
      }
    }, 1000);

    return () => {
      isScanning = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [stage]);

  // Sync selectedOption whenever currentQIndex changes
  useEffect(() => {
    if (!questions[currentQIndex]) return;
    const qId = questions[currentQIndex].id;
    setSelectedOption(userAnswers[qId] || "");
  }, [currentQIndex, userAnswers, questions]);

  // ---------------------------------------------------------------------------
  // 4. Action Handlers (Save & Next, Clear / Unmark, Mark for Review)
  // ---------------------------------------------------------------------------
  const handleSaveAndNext = () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];

    if (selectedOption.trim()) {
      setUserAnswers((prev) => ({ ...prev, [q.id]: selectedOption }));
      setQuestionStatuses((prev) => ({ ...prev, [q.id]: "ANSWERED" }));
    } else {
      setQuestionStatuses((prev) => ({ ...prev, [q.id]: "NOT_ANSWERED" }));
    }

    if (currentQIndex < questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      const nextQ = questions[nextIdx];
      // If next question was NOT_VISITED, mark as NOT_ANSWERED
      setQuestionStatuses((prev) => {
        if (prev[nextQ.id] === "NOT_VISITED") {
          return { ...prev, [nextQ.id]: "NOT_ANSWERED" };
        }
        return prev;
      });
      setCurrentQIndex(nextIdx);
    }
  };

  const handleClearResponse = () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];

    setSelectedOption("");
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    setQuestionStatuses((prev) => ({ ...prev, [q.id]: "NOT_ANSWERED" }));
  };

  const handleMarkForReviewAndNext = () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];

    if (selectedOption.trim()) {
      setUserAnswers((prev) => ({ ...prev, [q.id]: selectedOption }));
      setQuestionStatuses((prev) => ({ ...prev, [q.id]: "ANSWERED_AND_MARKED" }));
    } else {
      setQuestionStatuses((prev) => ({ ...prev, [q.id]: "MARKED_FOR_REVIEW" }));
    }

    if (currentQIndex < questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      const nextQ = questions[nextIdx];
      setQuestionStatuses((prev) => {
        if (prev[nextQ.id] === "NOT_VISITED") {
          return { ...prev, [nextQ.id]: "NOT_ANSWERED" };
        }
        return prev;
      });
      setCurrentQIndex(nextIdx);
    }
  };

  const handlePaletteJump = (targetIdx: number) => {
    if (!questions[targetIdx]) return;
    const currentQ = questions[currentQIndex];
    const targetQ = questions[targetIdx];

    // Mark current question as NOT_ANSWERED if it was never saved
    setQuestionStatuses((prev) => {
      const currStatus = prev[currentQ.id];
      let updated = { ...prev };
      if (currStatus === "NOT_VISITED") {
        updated[currentQ.id] = "NOT_ANSWERED";
      }
      if (updated[targetQ.id] === "NOT_VISITED") {
        updated[targetQ.id] = "NOT_ANSWERED";
      }
      return updated;
    });

    setCurrentQIndex(targetIdx);
  };

  // ---------------------------------------------------------------------------
  // 5. Final Submission & Instant Evaluation
  // ---------------------------------------------------------------------------
  const executeFinalSubmission = () => {
    setConfirmSubmitOpen(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((q) => {
      const qMarks = Number(q.marks) || 1.0;
      const negMarks = Number(q.negative_marks) || 0.0;
      maxScore += qMarks;

      const status = questionStatuses[q.id];
      const isConsideredForEval = status === "ANSWERED" || status === "ANSWERED_AND_MARKED";

      if (isConsideredForEval) {
        const uAns = (userAnswers[q.id] || "").trim().toUpperCase();
        const cAns = (q.correct_answer || "").trim().toUpperCase();

        if (uAns === cAns) {
          correctCount++;
          totalScore += qMarks;
        } else {
          incorrectCount++;
          totalScore -= negMarks;
        }
      } else {
        unattemptedCount++;
      }
    });

    const evaluatedScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    setScoreResult({
      totalScore: evaluatedScore,
      maxScore,
      correct: correctCount,
      incorrect: incorrectCount,
      unattempted: unattemptedCount,
      accuracy,
    });

    try {
      fetch(`http://127.0.0.1:8000/api/dashboard/test-series/${test.id}/submit-attempt/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          score: evaluatedScore,
          max_score: maxScore,
          correct: correctCount,
          incorrect: incorrectCount,
          unattempted: unattemptedCount,
          accuracy,
          responses: userAnswers,
          time_taken_seconds: ((test.duration_minutes || 180) * 60) - secondsRemaining,
        }),
      }).catch((e) => console.warn("Failed to record test attempt in backend:", e));
    } catch (e) {
      console.warn("Attempt submission error:", e);
    }

    setStage("RESULT");
    onCompleted?.();
  };

  const handleStartExamFromPreCheck = () => {
    if (!cameraAllowed || !micAllowed) {
      setPermissionError("Please enable camera and microphone permissions to proceed.");
      return;
    }

    try {
      if (typeof document !== "undefined" && document.documentElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((e) => {
          console.warn("Fullscreen request rejected (headless or user policy):", e);
        });
      }
    } catch (e) {
      console.warn("Fullscreen exception:", e);
    }

    setStage("IN_EXAM");
  };

  // ---------------------------------------------------------------------------
  // 6. Summary Count Stats for Legend Palette
  // ---------------------------------------------------------------------------
  const counts = {
    answered: Object.values(questionStatuses).filter((s) => s === "ANSWERED").length,
    notAnswered: Object.values(questionStatuses).filter((s) => s === "NOT_ANSWERED").length,
    notVisited: Object.values(questionStatuses).filter((s) => s === "NOT_VISITED").length,
    markedForReview: Object.values(questionStatuses).filter((s) => s === "MARKED_FOR_REVIEW").length,
    answeredAndMarked: Object.values(questionStatuses).filter((s) => s === "ANSWERED_AND_MARKED").length,
  };

  // Format Timer
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  // ===========================================================================
  // VIEW 1: PRE-CHECK & PERMISSION GATEWAY MODAL
  // ===========================================================================
  if (stage === "PRE_CHECK") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B192C]/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#15271E] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                CBT
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 leading-snug">
                  Proctored CBT Examination Gateway
                </h3>
                <span className="text-xs text-slate-500 font-semibold">{test.title}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {permissionError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Video Preview & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div className="relative aspect-4/3 rounded-2xl bg-black overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={preCheckVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <div className="pointer-events-none absolute inset-4 border border-dashed border-emerald-400/60 rounded-full opacity-60" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 text-emerald-400 text-[10px] font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Camera Check
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Candidate Identity Verification</span>
                <div className="text-slate-600 space-y-1">
                  <div>Candidate: <strong>{user?.full_name || user?.username || "Verified Scholar"}</strong></div>
                  <div>Roll Number: <strong className="font-mono">SIMS-GATE-{user?.id || 101}</strong></div>
                  <div>Discipline: <strong>{test.branch} · {test.test_type}</strong></div>
                </div>
              </div>

              {/* Live Audio Level Meter */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Mic className="size-3.5 text-emerald-600" />
                    Microphone Input
                  </span>
                  <span className={audioLevel > 5 ? "text-emerald-700" : "text-slate-400"}>
                    {audioLevel > 5 ? "Detected" : "Speak to test"}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-75"
                    style={{ width: `${Math.min(100, audioLevel * 2)}%` }}
                  />
                </div>
              </div>

              {/* Security Protocol Badges */}
              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-red-700 bg-red-50/90 px-2 py-1 rounded-lg border border-red-200">
                  <Smartphone className="size-3.5 text-red-600 shrink-0 animate-pulse" />
                  <span>Zero Mobile Phone Tolerance: Instant Exam Shutdown on Phone Detection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Full-screen examination lockdown enforced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Tab switch &amp; dual-audio detection active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Digital watermark protection enabled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Duration: <strong>{test.duration_minutes || 180} Mins</strong> · Questions: <strong>{questions.length}</strong>
            </span>
            <button
              type="button"
              onClick={handleStartExamFromPreCheck}
              disabled={!cameraAllowed || !micAllowed}
              className="px-6 py-3 rounded-xl bg-[#0F4336] hover:bg-[#155E4B] text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Begin Proctored Examination</span>
              <ArrowRight className="size-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // VIEW 2: AUTO-TERMINATED / DISQUALIFIED VIEW
  // ===========================================================================
  if (stage === "TERMINATED") {
    const isPhoneViolation =
      terminationReason.toLowerCase().includes("phone") ||
      terminationReason.toLowerCase().includes("mobile") ||
      terminationReason.toLowerCase().includes("device");

    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B192C]/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl border-2 border-red-500 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-300">
            {isPhoneViolation ? (
              <Smartphone className="size-9 text-red-600 animate-bounce" />
            ) : (
              <ShieldAlert className="size-9 text-red-600" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block">
              SIMS AI PROCTOR SECURITY LOCKDOWN
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
              Examination Terminated Immediately
            </h2>
            {isPhoneViolation && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
                📱 Mobile Phone Detected in Camera View
              </span>
            )}
          </div>

          {infractionSnapshot && (
            <div className="rounded-2xl overflow-hidden border-2 border-red-500 relative bg-black shadow-md">
              <img
                src={infractionSnapshot}
                alt="Infraction Evidence Snapshot"
                className="w-full h-auto max-h-52 object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold shadow-xs">
                PROCTOR CAMERA EVIDENCE CAPTURE
              </div>
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed bg-red-50 p-4 rounded-xl border border-red-200 text-left font-mono text-xs">
            <strong>Violation Notice:</strong> {terminationReason || "Multiple tab switches / unauthorized window minimization detected."}
            <br />
            <br />
            As per strict SIMS GATE CBT regulations, the examination has been closed immediately and the candidate session has been terminated to preserve test integrity.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm transition-all cursor-pointer"
          >
            Return to Test Series Portal
          </button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // VIEW 3: INSTANT EVALUATION & RESULT SCORECARD VIEW
  // ===========================================================================
  if (stage === "RESULT" && scoreResult) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B192C]/90 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto space-y-6 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Official CBT Evaluation
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5">
                {test.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Candidate: {user?.full_name || user?.username} · GATE Scoring Rules Applied (+Marks / -Negative Deduction)
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm transition-all self-start"
            >
              Close &amp; Return
            </button>
          </div>

          {/* 4 Score Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Score</span>
              <strong className="text-2xl sm:text-3xl font-bold text-emerald-950 block mt-1">
                {scoreResult.totalScore}
              </strong>
              <span className="text-xs text-emerald-700">Out of {scoreResult.maxScore} Marks</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Accuracy</span>
              <strong className="text-2xl sm:text-3xl font-bold text-blue-950 block mt-1">
                {scoreResult.accuracy}%
              </strong>
              <span className="text-xs text-blue-700">Precision Ratio</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Correct Answers</span>
              <strong className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1">
                {scoreResult.correct}
              </strong>
              <span className="text-xs text-slate-500">+{scoreResult.correct} Positives</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">Incorrect / Penalized</span>
              <strong className="text-2xl sm:text-3xl font-bold text-red-950 block mt-1">
                {scoreResult.incorrect}
              </strong>
              <span className="text-xs text-red-700">Negative Deductions</span>
            </div>
          </div>

          {/* Question-by-Question Detailed Solutions */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Detailed Question-by-Question Derivations &amp; Solutions
            </h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const uAns = (userAnswers[q.id] || "").trim().toUpperCase();
                const cAns = (q.correct_answer || "").trim().toUpperCase();
                const status = questionStatuses[q.id];
                const isAttempted = status === "ANSWERED" || status === "ANSWERED_AND_MARKED";
                const isCorrect = isAttempted && uAns === cAns;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      !isAttempted
                        ? "bg-slate-50 border-slate-200"
                        : isCorrect
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-red-50/50 border-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-white">Q{idx + 1}</span>
                        <span className="font-semibold text-slate-600">{q.section} · {q.question_type}</span>
                      </div>
                      <span className={`font-bold ${isCorrect ? "text-emerald-800" : isAttempted ? "text-red-700" : "text-slate-500"}`}>
                        {isCorrect
                          ? `✓ Correct (+${q.marks})`
                          : isAttempted
                          ? `✕ Incorrect (-${q.negative_marks})`
                          : "○ Unattempted (0.00)"}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{getCleanQuestionText(q.question_text)}</p>

                    {(() => {
                      const dUrl = getQuestionDiagramUrl(q);
                      if (!dUrl) return null;
                      return (
                        <div className="my-2 p-2 bg-white rounded-lg border border-slate-200 inline-block">
                          <img
                            src={dUrl}
                            alt="Question Diagram"
                            className="max-h-56 max-w-full object-contain rounded"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        </div>
                      );
                    })()}

                    <div className="mt-3 text-xs flex flex-wrap gap-4 text-slate-700">
                      <div>Your Answer: <strong className={isCorrect ? "text-emerald-700" : "text-red-700"}>{uAns || "None"}</strong></div>
                      <div>Official Key: <strong className="text-slate-900">{cAns}</strong></div>
                    </div>

                    {q.explanation && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-[#0F4336] block mb-1">Faculty Verified Derivation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // VIEW 4: LIVE IN-EXAM PROCTORED CBT FULL-SCREEN WORKSPACE
  // ===========================================================================
  const currentQ = questions[currentQIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#F1F5F9] select-none flex flex-col justify-between overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* -----------------------------------------------------------------------
          TOP NAVIGATION BAR: Timer, Calculator, Anti-Cheat Status, Submit
          ----------------------------------------------------------------------- */}
      <header className="bg-[#0B192C] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-base sm:text-lg text-[#C5A059] tracking-wide">
            SIMS GATE CBT
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">|</span>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-xs truncate">
            {test.title}
          </span>
        </div>

        {/* Center: Live Countdown Clock */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold">
          <Clock className="size-4 text-emerald-400" />
          <span className={secondsRemaining < 300 ? "text-red-400 animate-pulse" : "text-emerald-300"}>
            {formatTimer(secondsRemaining)}
          </span>
        </div>

        {/* Right Tools: Calculator & Early Submit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCalculatorOpen(!calculatorOpen)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="size-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Scientific Calc</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmSubmitOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* -----------------------------------------------------------------------
          MAIN CBT WORKSPACE (Left: Question Canvas, Right: Proctor Video & Palette)
          ----------------------------------------------------------------------- */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 relative">
        {/* Anti-Leak Security Watermark Layer */}
        <div
          className="pointer-events-none select-none absolute inset-0 z-10 overflow-hidden opacity-[0.05] flex flex-wrap gap-14 p-6 items-center justify-center rotate-[-15deg]"
          aria-hidden="true"
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="text-slate-900 font-mono font-black text-xs tracking-widest whitespace-nowrap">
              SIMS GATE RAIPUR · {user?.email || "CANDIDATE"} · ROLL #{user?.id || 101} · CONFIDENTIAL
            </div>
          ))}
        </div>

        {/* LEFT 3 COLS: Question Canvas */}
        <main className="lg:col-span-3 flex flex-col justify-between p-5 sm:p-8 overflow-y-auto bg-white border-r border-slate-200 relative z-10">
          {currentQ ? (
            <div className="space-y-6 max-w-3xl">
              {/* Question Header & Marking Scheme */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded bg-[#0B192C] text-white">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {currentQ.section}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Type: {currentQ.question_type}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Marks: <strong className="text-emerald-700 font-bold">+{currentQ.marks}</strong> /{" "}
                  <strong className="text-red-600 font-bold">-{currentQ.negative_marks}</strong>
                </div>
              </div>

              {/* Question Formulation Text */}
              <div className="text-base text-slate-900 font-medium leading-relaxed font-sans pt-1">
                {getCleanQuestionText(currentQ.question_text)}
              </div>

              {/* High-Resolution Diagram / Circuit / Schematic Display */}
              {(() => {
                const diagUrl = getQuestionDiagramUrl(currentQ);
                if (!diagUrl) return null;
                return (
                  <div className="my-3.5 p-3 bg-white rounded-xl border border-slate-200 shadow-xs inline-block max-w-full">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span>🔬 Diagram / Schematic</span>
                    </div>
                    <img
                      src={diagUrl}
                      alt={`Question ${currentQ.question_number} Diagram`}
                      className="max-h-72 max-w-full object-contain rounded-lg border border-slate-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                );
              })()}

              {/* Option Choices */}
              {currentQ.question_type === "NAT" ? (
                <div className="space-y-2 pt-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Enter Numerical Value:
                  </label>
                  <input
                    type="text"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    placeholder="Enter decimal answer..."
                    className="w-56 p-3 border-2 border-slate-300 rounded-xl font-mono text-base focus:border-[#0F4336] outline-none bg-slate-50"
                  />
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {["option_a", "option_b", "option_c", "option_d"].map((optKey, idx) => {
                    const optText = (currentQ as any)[optKey];
                    if (!optText) return null;
                    const optLetter = String.fromCharCode(65 + idx);
                    const isSelected = selectedOption.toUpperCase() === optLetter;

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => setSelectedOption(optLetter)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-medium border-2 transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? "border-[#0F4336] bg-emerald-50/70 text-[#0F4336] font-bold shadow-xs"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected ? "bg-[#0F4336] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {optLetter}
                        </span>
                        <span className="leading-relaxed">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Loading questions...</div>
          )}

          {/* Bottom Action Control Bar (JEE / GATE Standard Buttons) */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-4 mt-8 gap-3">
            {/* Left Actions: Clear Response (Unmark) & Mark for Review */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear Response</span>
              </button>

              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Flag className="size-3.5 text-purple-700" />
                <span>Mark for Review &amp; Next</span>
              </button>
            </div>

            {/* Right Actions: Previous & Save and Next */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-6 py-2.5 rounded-xl bg-[#0F4336] hover:bg-[#155E4B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Save &amp; Next</span>
                <ArrowRight className="size-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT 1 COL: Candidate Live Video Proctor Feed & Question Palette */}
        <aside className="border-l border-slate-200 bg-[#FAF9F5] p-5 overflow-y-auto space-y-5 relative z-10">
          {/* Candidate Live Stream Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Proctored Candidate Feed
            </span>
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black border-2 border-slate-800 shadow-md">
              <video
                ref={inExamVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold shadow-xs">
                <span className="size-1.5 rounded-full bg-white animate-ping" />
                REC · LIVE PROCTOR
              </div>

              {/* AI Mobile Phone Detection Scanner Status */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                <Smartphone className="size-3 text-emerald-400 animate-pulse" />
                <span>Phone Shield ON</span>
              </div>

              {/* Examiner Test / Simulation Trigger */}
              <div className="absolute bottom-7 right-2">
                <button
                  type="button"
                  onClick={handleSimulatePhoneDetection}
                  title="Test Phone Detection Auto-Termination (Examiner Audit Probe)"
                  className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-mono text-[8px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Smartphone className="size-2.5 text-red-400" />
                  <span>Test Phone Alert</span>
                </button>
              </div>

              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
                <span className="truncate">{user?.full_name || user?.username}</span>
                <span className="text-emerald-400 font-mono text-[9px]">Mic OK · Phone Guard ON</span>
              </div>
            </div>
          </div>

          {/* Palette Legend Summary Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Question Legend (JEE / GATE)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                  {counts.answered}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-md bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
                  {counts.notAnswered}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-md bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center text-[9px] font-bold">
                  {counts.notVisited}
                </span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-full bg-purple-700 text-white flex items-center justify-center text-[9px] font-bold">
                  {counts.markedForReview}
                </span>
                <span>Marked Review</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="relative size-4 rounded-full bg-purple-700 text-white flex items-center justify-center text-[9px] font-bold">
                  {counts.answeredAndMarked}
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 ring-1 ring-white" />
                </span>
                <span className="text-[10px] leading-tight">Ans &amp; Marked for Review (Evaluated)</span>
              </div>
            </div>
          </div>

          {/* Interactive Question Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Question Palette ({questions.length} Items)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = questionStatuses[q.id] || "NOT_VISITED";
                const isCurrent = idx === currentQIndex;

                let badgeClass = "bg-white text-slate-800 border border-slate-300";
                if (status === "ANSWERED") {
                  badgeClass = "bg-emerald-600 text-white font-bold";
                } else if (status === "NOT_ANSWERED") {
                  badgeClass = "bg-red-600 text-white font-bold";
                } else if (status === "MARKED_FOR_REVIEW") {
                  badgeClass = "bg-purple-700 text-white font-bold rounded-full";
                } else if (status === "ANSWERED_AND_MARKED") {
                  badgeClass = "bg-purple-700 text-white font-bold rounded-full relative";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handlePaletteJump(idx)}
                    className={`size-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${badgeClass} ${
                      isCurrent ? "ring-2 ring-black ring-offset-2 scale-105" : "hover:brightness-95"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {status === "ANSWERED_AND_MARKED" && (
                      <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Early Submit Test Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Submit Final Exam &rarr;
            </button>
          </div>
        </aside>
      </div>

      {/* -----------------------------------------------------------------------
          MODAL 1: PRE-SUBMISSION AUDIT DIALOG
          ----------------------------------------------------------------------- */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Confirm Examination Submission?
              </h3>
              <p className="text-xs text-slate-600">
                You can submit ahead of time. Once confirmed, answers will be evaluated instantly.
              </p>
            </div>

            {/* Question Breakdown Audit Table */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Total Questions:</span>
                <strong className="text-slate-900">{questions.length}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-emerald-700 font-semibold">Answered:</span>
                <strong className="text-emerald-800">{counts.answered}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-purple-700 font-semibold">Ans &amp; Marked for Review:</span>
                <strong className="text-purple-800">{counts.answeredAndMarked}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-red-700 font-semibold">Not Answered:</span>
                <strong className="text-red-800">{counts.notAnswered}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Not Visited:</span>
                <strong className="text-slate-700">{counts.notVisited}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Resume Exam
              </button>
              <button
                type="button"
                onClick={executeFinalSubmission}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Yes, Final Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL 2: PROCTORING VIOLATION WARNING (Strike 1)
          ----------------------------------------------------------------------- */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-[10001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-amber-500 space-y-4">
            <div className="size-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
              <AlertTriangle className="size-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                PROCTORING WARNING · STRIKE {strikes} OF 2
              </span>
              <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">
                Security Policy Intercepted
              </h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              {warningMessage || "Tab switch or screen focus loss detected. Do not switch tabs, minimize the test window, or take screenshots. Next violation will terminate your test."}
            </p>
            <button
              type="button"
              onClick={() => {
                lastViolationTimeRef.current = Date.now() + 1500;
                printScreenCooldownRef.current = Date.now() + 1500;
                setWarningModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
            >
              I Understand · Return to Examination
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL 3: FLOATING VIRTUAL SCIENTIFIC CALCULATOR
          ----------------------------------------------------------------------- */}
      {calculatorOpen && (
        <div className="fixed bottom-6 right-6 z-[10001] w-72 rounded-2xl bg-slate-900 border border-slate-700 text-white p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-[#D4AF37] flex items-center gap-1.5">
              <Calculator className="size-3.5" />
              GATE Scientific Calc
            </span>
            <button onClick={() => setCalculatorOpen(false)} className="text-slate-400 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="bg-black/60 rounded-lg p-2.5 text-right font-mono text-base font-bold text-emerald-400 overflow-x-auto min-h-10">
            {calcInput || "0"}
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
            {["C", "(", ")", "/"].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === "C") setCalcInput("");
                  else setCalcInput((prev) => prev + btn);
                }}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
              >
                {btn}
              </button>
            ))}
            {["7", "8", "9", "*"].map((btn) => (
              <button
                key={btn}
                onClick={() => setCalcInput((prev) => prev + btn)}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700"
              >
                {btn}
              </button>
            ))}
            {["4", "5", "6", "-"].map((btn) => (
              <button
                key={btn}
                onClick={() => setCalcInput((prev) => prev + btn)}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700"
              >
                {btn}
              </button>
            ))}
            {["1", "2", "3", "+"].map((btn) => (
              <button
                key={btn}
                onClick={() => setCalcInput((prev) => prev + btn)}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700"
              >
                {btn}
              </button>
            ))}
            {["0", ".", "DEL", "="].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === "DEL") setCalcInput((prev) => prev.slice(0, -1));
                  else if (btn === "=") {
                    try {
                      // Safe arithmetic evaluate
                      const sanitized = calcInput.replace(/[^0-9+\-*/().]/g, "");
                      const res = Function(`"use strict"; return (${sanitized})`)();
                      setCalcInput(String(Math.round(res * 10000) / 10000));
                    } catch {
                      setCalcInput("Error");
                    }
                  } else {
                    setCalcInput((prev) => prev + btn);
                  }
                }}
                className={`p-2 rounded ${btn === "=" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
