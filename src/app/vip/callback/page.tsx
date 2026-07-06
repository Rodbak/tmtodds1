"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/app/store/AppProvider";

export const dynamic = "force-dynamic";

type CallbackStatus = "checking" | "success" | "failed";

const COPY: Record<Exclude<CallbackStatus, "checking">, { heading: string; headingColor: string; body: string }> = {
  success: {
    heading: "You're in",
    headingColor: "text-accent-lime",
    body: "Your plan is active. Head back to unlock the full board.",
  },
  failed: {
    heading: "Payment not confirmed",
    headingColor: "text-accent-red",
    body: "If money left your account, it can take a minute to confirm — check the VIP tab shortly, or reach out if it still hasn't updated.",
  },
};

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshAll } = useApp();
  const [status, setStatus] = useState<CallbackStatus>("checking");

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("failed");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.status === "success") {
          setStatus("success");
          refreshAll();
        } else {
          setStatus("failed");
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshAll]);

  return (
    <div className="max-w-sm w-full text-center">
      {status === "checking" ? (
        <p className="text-[14px] text-text-secondary font-archivo mb-6">Confirming your payment…</p>
      ) : (
        <>
          <p className={`font-archivo font-extrabold text-[18px] mb-2 ${COPY[status].headingColor}`}>{COPY[status].heading}</p>
          <p className="text-[13px] text-text-secondary font-archivo mb-6">{COPY[status].body}</p>
        </>
      )}
      <button
        onClick={() => router.push("/")}
        className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[12px] px-5 py-3"
      >
        Back to TMTODDS
      </button>
    </div>
  );
}

export default function VipCallbackPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary text-text-primary px-6">
      <Suspense fallback={<p className="text-[14px] text-text-secondary font-archivo">Loading…</p>}>
        <CallbackInner />
      </Suspense>
    </div>
  );
}
