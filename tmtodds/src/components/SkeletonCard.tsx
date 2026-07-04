"use client";

export default function SkeletonCard() {
  return (
    <div className="rounded-[16px] p-4 bg-[#14171D] border border-border-subtle animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="h-4 w-16 rounded bg-white/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/5 mb-3" />
      <div className="flex items-end justify-between">
        <div className="h-4 w-20 rounded bg-white/5" />
        <div className="h-9 w-9 rounded-[10px] bg-white/5" />
      </div>
    </div>
  );
}