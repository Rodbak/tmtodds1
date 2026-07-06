"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/app/store/AppProvider";

export const dynamic = "force-dynamic";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshAll } = useApp();
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("failed");
      return;
    }
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setStatus("success");
          refreshAll();
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [searchParams, refreshAll]);

  return (
    <div className="max-w-sm w-full text-center">
      {status === "checking" && <p className="text-[14px] text-text-secondary font-archivo">Confirming your payment…</p>}
      {status === "success" && (
        <>
          <p className="font-archivo font-extrabold text-[18px] text-accent-lime mb-2">You&apos;re in</p>
          <p className="text-[13px] text-text-secondary font-archivo mb-6">Your plan is active. Head back to unlock the full board.</p>
        </>
      )}
      {status === "failed" && (
        <>
          <p className="font-archivo font-extrabold text-[18px] text-accent-red mb-2">Payment not confirmed</p>
          <p className="text-[13px] text-text-secondary font-archivo mb-6">
            If money left your account, it can take a minute to confirm — check the VIP tab shortly, or reach out if it still hasn&apos;t updated.
          </p>
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
