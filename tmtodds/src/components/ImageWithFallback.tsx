"use client";

import { Zap } from "lucide-react";
import Image from "next/image";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({ src, alt, className = "" }: ImageWithFallbackProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#1a2410] to-bg-secondary ${className}`}>
      <Zap size={48} className="text-accent-lime/60" />
    </div>
  );
}