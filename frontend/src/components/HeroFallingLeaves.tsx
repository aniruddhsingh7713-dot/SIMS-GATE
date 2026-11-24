"use client";

import React, { useEffect, useRef } from "react";

interface HeroLeaf {
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
}

export default function HeroFallingLeaves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;

    // Use IntersectionObserver to pause rendering when scrolled past hero
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let width = (canvas.width = canvas.parentElement?.clientWidth || 450);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const goldColors = ["#D4AF37", "#C5A059", "#E5C158", "#F3E5AB"];

    const spawnLeaf = (delay = 0, initialYOffset = 0): HeroLeaf => {
      const spawnX = width * (0.28 + Math.random() * 0.44);
      const spawnY = height * (0.16 + Math.random() * 0.28);

      return {
        active: delay === 0,
        delay,
        x: spawnX,
        y: spawnY + initialYOffset,
        originX: spawnX,
        originY: spawnY,
        size: Math.random() * 3 + 8.5,
        speedY: Math.random() * 0.32 + 0.42,
        swaySpeed: Math.random() * 0.016 + 0.01,
        swayAmp: Math.random() * 14 + 14,
        swayPhase: Math.random() * Math.PI * 2,
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.024 + 0.014,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.014,
        opacity: initialYOffset > 0 ? 0.8 : 0,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
      };
    };

    // Exactly 3 staggered leaves for an understated, elegant feel
    const leaves: HeroLeaf[] = [
      spawnLeaf(0, height * 0.3),
      spawnLeaf(0, 0),
      spawnLeaf(90),
    ];

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < leaves.length; i++) {
          const leaf = leaves[i];

          if (!leaf.active) {
            if (leaf.delay > 0) {
              leaf.delay--;
            } else {
              leaves[i] = spawnLeaf(0);
            }
            continue;
          }

          leaf.y += leaf.speedY;
          leaf.swayPhase += leaf.swaySpeed;
          leaf.x = leaf.originX + Math.sin(leaf.swayPhase) * leaf.swayAmp;
          leaf.flipPhase += leaf.flipSpeed;
          leaf.angle += leaf.angularSpeed;

          const dist = leaf.y - leaf.originY;
          if (dist < 40) {
            leaf.opacity = Math.min(0.85, (dist / 40) * 0.85);
          } else if (leaf.y > height - 60) {
            leaf.opacity = Math.max(0, (height - leaf.y) / 60);
          } else {
            leaf.opacity = 0.85;
          }

          if (leaf.y >= height || leaf.opacity <= 0.01) {
            leaf.active = false;
            leaf.delay = Math.floor(Math.random() * 80 + 50);
            continue;
          }

          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(leaf.angle);

          const flipScale = Math.cos(leaf.flipPhase);
          ctx.scale((leaf.size / 10) * flipScale, leaf.size / 10);
          ctx.fillStyle = leaf.color;
          ctx.globalAlpha = leaf.opacity;

          ctx.shadowColor = "#C5A059";
          ctx.shadowBlur = 4;

          // Organic botanical petal
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.bezierCurveTo(6, -5, 7, 3, 0, 10);
          ctx.bezierCurveTo(-7, 3, -6, -5, 0, -10);
          ctx.closePath();
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.stroke();

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}
