import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary font-archivo">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 font-archivo font-bold text-[13px] text-accent-lime mb-8">
          <ArrowLeft size={15} />
          Back to TMTODDS
        </Link>

        <article className="prose-legal">{children}</article>
      </div>
    </div>
  );
}
