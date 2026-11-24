"use client";

import React, { useEffect, useRef } from "react";

interface DynamicBackgroundProps {
  variant?: "midnight-gold" | "editorial-hero" | "light-blue";
  className?: string;
  showParticles?: boolean;
  showGrid?: boolean;
  showGlowOrbs?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
}

export default function DynamicBackground({
  variant = "light-blue",
  className = "",
  showParticles = true,
  showGrid = true,
  showGlowOrbs = true,
}: DynamicBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    // Resize canvas to match container with device pixel ratio for ultra-crisp display
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();

    // Generate balanced, subtle particles (IIT / academic science constellation theme)
    const particleCount = variant === "midnight-gold" 
      ? Math.min(48, Math.max(22, Math.floor(width / 32))) 
      : Math.min(30, Math.max(14, Math.floor(width / 45)));

    const goldColors = variant === "midnight-gold"
      ? ["#C5A059", "#D4AF37", "#E6CA65", "#60A5FA"]
      : variant === "light-blue"
      ? ["#C5A059", "#3B82F6", "#60A5FA", "#D4AF37"]
      : ["#C5A059", "#D4AF37", "#B8860B"];

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const isBlue = (variant === "midnight-gold" || variant === "light-blue") && i % 4 === 0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.4 + 0.8,
        baseAlpha: Math.random() * (variant === "midnight-gold" ? 0.35 : 0.18) + (variant === "midnight-gold" ? 0.15 : 0.08),
        alpha: 0,
        color: isBlue ? "#60A5FA" : goldColors[Math.floor(Math.random() * goldColors.length)],
      });
    }

    // Mouse movement listeners (on the container, passive)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    // Attach mouse listener to parent section if possible for smoother proximity
    const parentSection = container.parentElement || container;
    parentSection.addEventListener("mousemove", handleMouseMove, { passive: true });
    parentSection.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // IntersectionObserver to pause rendering when section is scrolled out of view (0 CPU wasted)
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    let tick = 0;

    // Render loop
    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);
        tick += 0.015;

        // 1. Draw subtle interactive mouse glow spotlight if cursor is inside
        if (mouseRef.current.active && variant === "midnight-gold") {
          const { x, y } = mouseRef.current;
          const radial = ctx.createRadialGradient(x, y, 0, x, y, 280);
          radial.addColorStop(0, "rgba(197, 160, 89, 0.08)");
          radial.addColorStop(0.5, "rgba(11, 25, 44, 0.04)");
          radial.addColorStop(1, "transparent");
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Update and render particles
        const maxConnectDistance = variant === "midnight-gold" ? 115 : 85;

        // Draw connecting filaments first (under particles)
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxConnectDistance) {
              const lineAlpha = (1 - dist / maxConnectDistance) * (variant === "midnight-gold" ? 0.09 : 0.05);
              ctx.beginPath();
              ctx.strokeStyle = variant === "midnight-gold" 
                ? `rgba(197, 160, 89, ${lineAlpha})`
                : `rgba(184, 134, 11, ${lineAlpha})`;
              ctx.lineWidth = 0.75;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw particles and handle movement
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Gentle breathing opacity modulation
          p.alpha = p.baseAlpha + Math.sin(tick + i) * 0.08;

          // Gentle mouse repulsion/attraction
          if (mouseRef.current.active) {
            const mdx = mouseRef.current.x - p.x;
            const mdy = mouseRef.current.y - p.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mdist < 140 && mdist > 0) {
              const force = (140 - mdist) / 140;
              p.x -= (mdx / mdist) * force * 0.6;
              p.y -= (mdy / mdist) * force * 0.6;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Render particle dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.04, Math.min(0.55, p.alpha));
          ctx.fill();

          // Subtle corona glow for larger particles
          if (p.radius > 1.4 && variant === "midnight-gold") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * 0.25;
            ctx.fill();
          }
        }

        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      parentSection.removeEventListener("mousemove", handleMouseMove);
      parentSection.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className={`dynamic-bg-container dynamic-bg-${variant} ${className}`}
      aria-hidden="true"
    >
      {/* 1. Subtle Engineering Blueprint Hairline Grid */}
      {showGrid && (
        <div
          className={`dynamic-bg-grid ${
            variant === "midnight-gold"
              ? "grid-midnight"
              : variant === "light-blue"
              ? "grid-light-blue"
              : "grid-editorial"
          }`}
        />
      )}

      {/* 2. Soft Ambient Drifting Aurora Glow Orbs (midnight & light-blue only) */}
      {showGlowOrbs && variant !== "editorial-hero" && (
        <div className="dynamic-glow-orbs-layer">
          <div className="glow-orb orb-gold-one" />
          <div className="glow-orb orb-navy-two" />
          {variant === "midnight-gold" && <div className="glow-orb orb-amber-three" />}
        </div>
      )}

      {/* 3. Subtle Canvas Particles for Dark / Midnight Themes */}
      {showParticles && variant !== "editorial-hero" && (
        <canvas ref={canvasRef} className="dynamic-bg-canvas" />
      )}
    </div>
  );
}
