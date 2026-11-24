"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * SIMS GATE — High-Performance Site-Wide Custom Cursor
 * 
 * Architecture:
 * - Direct DOM transform manipulation via requestAnimationFrame.
 * - Zero React re-renders on mousemove for 120fps fluid tracking.
 * - Muted Antique Gold (#C5A059) and Royal Navy brand aesthetic.
 * - Auto-disabled on touch devices (@media (pointer: coarse)) and respects prefers-reduced-motion.
 * - Completely non-blocking (pointer-events: none).
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Accessibility & Touch Device check
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || prefersReducedMotion) {
      return;
    }

    setMounted(true);

    // 2. Mutable state for RAF tracking (bypasses React state cycle for 0 overhead)
    const mouse = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let isHovered = false;
    let isMouseDown = false;
    let isVisible = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!isVisible) {
        isVisible = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }
    };

    const onMouseDown = () => {
      isMouseDown = true;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    // Event delegation for detecting actionable/interactive targets
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'a, button, input, select, textarea, [role="button"], label, summary, .cursor-pointer, [data-cursor-hover]'
      );
      isHovered = !!interactive;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });

    // 3. Ultra-smooth lerp loop in RAF
    const LERP_FACTOR = 0.22;

    const render = () => {
      if (isVisible) {
        // Smoothly interpolate ring position towards mouse
        ring.x += (mouse.x - ring.x) * LERP_FACTOR;
        ring.y += (mouse.y - ring.y) * LERP_FACTOR;

        if (dotRef.current) {
          const dotScale = isMouseDown ? 0.65 : isHovered ? 1.4 : 1;
          dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
          dotRef.current.style.backgroundColor = isHovered ? "#B38E3F" : "#C5A059";
        }

        if (ringRef.current) {
          const ringScale = isMouseDown ? 0.8 : isHovered ? 1.5 : 1;
          ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
          ringRef.current.style.borderColor = isHovered ? "rgba(197, 160, 89, 0.9)" : "rgba(197, 160, 89, 0.45)";
          ringRef.current.style.backgroundColor = isHovered ? "rgba(197, 160, 89, 0.12)" : "rgba(197, 160, 89, 0.04)";
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
    >
      {/* High-Precision Center Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 size-2 rounded-full pointer-events-none transition-colors duration-150 ease-out shadow-[0_0_6px_rgba(197,160,89,0.45)]"
        style={{
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Smooth Trailing Outer Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 size-7 rounded-full border border-[#C5A059]/45 pointer-events-none transition-[border-color,background-color] duration-200 ease-out"
        style={{
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
