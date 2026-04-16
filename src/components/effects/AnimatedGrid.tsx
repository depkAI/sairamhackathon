"use client";

export default function AnimatedGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Animated gradient orbs */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/8 dark:bg-purple-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s", animationDuration: "4s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue-500/5 dark:bg-blue-500/3 blur-3xl animate-float" style={{ animationDelay: "0.8s", animationDuration: "5s" }} />
    </div>
  );
}
