export default function TermsPage() {
  return (
    <>
      <h1 className="font-anton text-[30px] tracking-wide uppercase mb-1">Terms of Service</h1>
      <p className="text-text-muted text-[12px] mb-8">Last updated: [update to your actual publish date] · Drafted July 2026. Replace remaining bracketed text before publishing.</p>

      <Section title="1. What TMTODDS is">
        <P>
          TMTODDS provides football analysis, predictions, and commentary (&quot;Picks&quot;) for informational and
          entertainment purposes. TMTODDS is <B>not a bookmaker</B>, does not accept bets, and does not process
          wagers. Any betting you choose to do based on a Pick happens with a licensed betting operator of your
          choice, entirely at your own discretion and risk.
        </P>
      </Section>

      <Section title="2. No guarantees">
        <P>
          Picks reflect analysis and opinion, not certainty. Past results (shown on the Proof & Results page) are
          historical performance, not a promise of future outcomes. Football is unpredictable; every Pick carries a
          real risk of being wrong. Nothing on this service should be read as a guaranteed, &quot;fixed&quot;, or
          rigged outcome — because it isn&apos;t one.
        </P>
      </Section>

      <Section title="3. Eligibility">
        <P>
          You must be at least 18 years old to create an account or subscribe. By registering, you confirm you meet
          this requirement. [Confirm 18 is the correct minimum age for your jurisdiction — Ghana&apos;s Gaming Act
          721 treats 18 as the age of majority for gambling-adjacent activity, but have this checked.]
        </P>
      </Section>

      <Section title="4. Accounts">
        <P>
          You&apos;re responsible for keeping your login credentials confidential and for all activity under your
          account. Tell us promptly at support@tmtodds.com [confirm this inbox exists and is monitored] if you suspect unauthorized access.
        </P>
      </Section>

      <Section title="5. Subscriptions and payment">
        <P>
          Paid tiers are billed upfront for a fixed period (weekly or monthly, as shown on the VIP page) via
          Paystack. Subscriptions do <B>not auto-renew</B> — access simply expires at the end of the period unless
          you subscribe again. Prices are shown in Ghana Cedis (₵) and may change; a change never affects a period
          you&apos;ve already paid for.
        </P>
        <P>
          <B>Refunds: </B>No refunds once a Pick tied to your current plan has been posted for that period. If you
          subscribe and no Pick has been posted yet for your plan, contact support@tmtodds.com [confirm this inbox
          exists and is monitored] to request a refund before your first Pick arrives. [This is a reasonable
          starting position, not a substitute for confirming it against Ghanaian consumer law and Paystack&apos;s own
          merchant terms.]
        </P>
      </Section>

      <Section title="6. The members' lounge (chat)">
        <P>
          Be respectful. Don&apos;t post anything illegal, harassing, hateful, or spammy. We can remove any message
          and, for repeated or serious violations, suspend or close an account, at our discretion.
        </P>
      </Section>

      <Section title="7. Intellectual property">
        <P>
          Picks, written analysis, the TMTODDS name, and the design of this app belong to TMTODDS [confirm: is there a separate registered company name, or does TMTODDS operate as a sole proprietorship under this name?]. You may
          use them for personal, non-commercial reference; you may not republish, resell, or redistribute Picks in
          bulk (for example, forwarding the day&apos;s board to a paid group of your own).
        </P>
      </Section>

      <Section title="8. Limitation of liability">
        <P>
          To the fullest extent permitted by law, TMTODDS [confirm: is there a separate registered company name, or does TMTODDS operate as a sole proprietorship under this name?] is not liable for any losses arising from bets you
          place with a third-party operator, including losses based on a Pick. This service is analysis, not
          financial or betting advice. [This clause needs a lawyer&apos;s eyes — enforceability of broad liability
          waivers varies by jurisdiction.]
        </P>
      </Section>

      <Section title="9. Termination">
        <P>
          You can stop using the service and let your subscription lapse at any time. We can suspend or terminate an
          account that violates these terms, including sharing paid Picks publicly or abusive behavior toward staff
          or other members.
        </P>
      </Section>

      <Section title="10. Governing law">
        <P>These terms are governed by the laws of Ghana. [Confirm venue/jurisdiction language with a lawyer.]</P>
      </Section>

      <Section title="11. Contact">
        <P>Questions about these terms: [support email / phone].</P>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-archivo font-extrabold text-[15px] text-text-primary mb-2">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="font-archivo text-[13px] text-text-secondary leading-relaxed mb-2">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-text-primary">{children}</span>;
}
