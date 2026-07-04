"use client";

import { Zap } from "lucide-react";

interface BrandProps {
  size?: "sm" | "md";
}

export default function Brand({ size = "md" }: BrandProps) {
  const box = size === "md" ? "w-8 h-8 rounded-[9px]" : "w-7 h-7 rounded-[8px]";
  const iconSize = size === "md" ? 18 : 16;
  const text = size === "md" ? "text-[21px]" : "text-[19px]";
  return (
    <div className="flex items-center gap-2">
      <div className={`${box} bg-accent-lime flex items-center justify-center flex-shrink-0`}>
        <Zap size={iconSize} className="text-bg-primary" />
      </div>
      <span className={`font-anton ${text} tracking-wider text-text-primary uppercase`}>TMTODDS</span>
    </div>
  );
}