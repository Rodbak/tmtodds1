"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const CONSENT_KEY = "tmtodds-analytics-consent";
type Consent = "pending" | "accepted" | "declined";

/**
 * Google Analytics, gated behind an explicit accept/decline choice --
 * the gtag script only loads after "Accept", and the choice persists
 * in localStorage so this doesn't nag on every visit. Renders nothing
 * at all if NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set, so analytics
 * stays entirely optional.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consent, setConsent] = useState<Consent>("pending");
  const [hydrated, setHydrated] = useState(false);

  // One-time read of a prior choice from localStorage on mount -- the
  // same legitimate synchronous-effect pattern used in AppProvider.tsx.
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "accepted" || stored === "declined") setConsent(stored);
    setHydrated(true);
  }, []);

  if (!gaId) return null;

  const respond = (choice: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, choice);
    setConsent(choice);
  };

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {hydrated && consent === "pending" && (
        <div className="fixed top-0 inset-x-0 z-[60] flex justify-center px-4 pt-3">
          <div className="w-full max-w-md bg-bg-secondary border border-border-subtle rounded-[14px] px-4 py-3 flex items-center gap-3 shadow-xl shadow-black/40">
            <p className="flex-1 font-archivo text-[11px] text-text-secondary leading-snug">
              We use Google Analytics to see how the app is used.{" "}
              <a href="/legal/privacy" className="underline text-text-primary">Privacy Policy</a>
            </p>
            <button
              onClick={() => respond("declined")}
              className="flex-shrink-0 font-archivo font-bold text-[11px] text-text-muted px-2 py-1.5"
            >
              Decline
            </button>
            <button
              onClick={() => respond("accepted")}
              className="flex-shrink-0 bg-accent-lime text-bg-primary font-archivo font-extrabold text-[11px] rounded-[8px] px-3 py-1.5"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
