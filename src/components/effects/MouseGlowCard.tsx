"use client";

import { useRef, useState, useCallback } from "react";

interface MouseGlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export default function MouseGlowCard({
  children,
  className = "",
  glowColor = "rgba(99, 102, 241, 0.08)",
}: MouseGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setGlow({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        opacity: 1,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setGlow((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(300px circle at ${glow.x}px ${glow.y}px, ${glowColor}, transparent 70%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
