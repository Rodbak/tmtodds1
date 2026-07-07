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

        <div className="bg-[rgba(245,196,81,0.1)] border border-border-gold rounded-[12px] px-4 py-3 mb-8">
          <p className="font-archivo font-bold text-[12px] text-accent-gold mb-1">Draft — not yet reviewed by a lawyer</p>
          <p className="font-archivo text-[12px] text-text-secondary leading-snug">
            This is a starting template, not final legal advice. Have it reviewed against Ghana&apos;s Gaming Act 721,
            Data Protection Act 2012 (Act 843), and Paystack&apos;s merchant terms before publishing for real users.
          </p>
        </div>

        <article className="prose-legal">{children}</article>
      </div>
    </div>
  );
}
