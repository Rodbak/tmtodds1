export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-anton text-[30px] tracking-wide uppercase mb-1">Privacy Policy</h1>
      <p className="text-text-muted text-[12px] mb-8">Last updated: [update to your actual publish date] · Drafted July 2026. Replace remaining bracketed text before publishing.</p>

      <Section title="1. What we collect">
        <Ul
          items={[
            "Account info: name, email, password (stored hashed by our auth provider, never in plain text).",
            "Subscription info: which plan you're on, when it expires, and a payment reference number — not your card or Mobile Money details, which Paystack handles directly (see below).",
            "Content you post: messages you send in the members' lounge.",
            "Basic technical data: IP address and browser info, standard for any web server log.",
          ]}
        />
      </Section>

      <Section title="2. How we use it">
        <Ul
          items={[
            "To run your account and show you the Picks your plan includes.",
            "To activate your plan after a successful payment.",
            "To operate the members' lounge, including moderating it.",
            "To contact you about your account (e.g. a password reset) — not for marketing unless you opt in. [Confirm this matches what you actually plan to do.]",
          ]}
        />
      </Section>

      <Section title="3. Who we share it with">
        <P>We use a small number of processors to run the service, each only for their specific job:</P>
        <Ul
          items={[
            "Supabase — hosts our database and handles authentication (your login session and hashed password).",
            "Paystack — processes payments. Paystack receives what it needs to charge you (via Mobile Money or card) and tells us only whether it succeeded; we never see or store your full card or Mobile Money PIN.",
          ]}
        />
        <P>We don&apos;t sell personal data to third parties.</P>
      </Section>

      <Section title="4. Your rights">
        <P>
          Under Ghana&apos;s Data Protection Act, 2012 (Act 843), you can ask us to confirm what personal data we
          hold about you, correct it, or delete it. Email privacy@tmtodds.com [confirm this inbox exists and is monitored] to make a request — we&apos;ll aim
          to respond within [X] days. TMTODDS [confirm: is there a separate registered company name, or does TMTODDS operate as a sole proprietorship under this name?] [is / is not yet] registered as a data controller with Ghana&apos;s
          Data Protection Commission — register at dataprotection.org.gh before launch if not already done; it&apos;s a
          legal requirement for organizations processing personal data in Ghana, not an optional step.
        </P>
      </Section>

      <Section title="5. Data retention">
        <P>
          We keep account data for as long as your account is active, plus [X months/years] afterward for basic
          bookkeeping (e.g. payment records), then delete or anonymize it. [Set a real retention period — this is a
          decision for you, not something to leave as a placeholder indefinitely.]
        </P>
      </Section>

      <Section title="6. Cookies and analytics">
        <P>We use one essential cookie to keep you signed in — required for the app to function.</P>
        <P>
          We also use <B>Google Analytics</B> to understand how the app is used (which pages get visited, roughly
          how many people use it). This only runs if you click &quot;Accept&quot; on the banner shown on your first
          visit; choosing &quot;Decline&quot; means Google Analytics never loads for you. Google Analytics uses its
          own cookies and receives your IP address and general usage patterns — see{" "}
          <a href="https://policies.google.com/privacy" className="underline">Google&apos;s Privacy Policy</a>{" "}
          for how Google handles that data.
        </P>
      </Section>

      <Section title="7. Children">
        <P>This service is for adults 18 and over. We don&apos;t knowingly collect data from anyone under 18.</P>
      </Section>

      <Section title="8. Changes to this policy">
        <P>If this policy changes materially, we&apos;ll post the update here with a new &quot;last updated&quot; date.</P>
      </Section>

      <Section title="9. Contact">
        <P>Questions or requests about your data: privacy@tmtodds.com [confirm this inbox exists and is monitored].</P>
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

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 mb-2">
      {items.map((item) => (
        <li key={item} className="font-archivo text-[13px] text-text-secondary leading-relaxed mb-1">
          {item}
        </li>
      ))}
    </ul>
  );
}
