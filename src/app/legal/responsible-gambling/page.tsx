export default function ResponsibleGamblingPage() {
  return (
    <>
      <h1 className="font-anton text-[30px] tracking-wide uppercase mb-1">Responsible Gambling</h1>
      <p className="text-text-muted text-[12px] mb-8">Last updated: [update to your actual publish date] · Drafted July 2026. Replace remaining bracketed text before publishing.</p>

      <Section title="TMTODDS is analysis, not a betting operator">
        <P>
          TMTODDS publishes football predictions and tracks how they perform. We don&apos;t take bets, hold your
          betting funds, or operate a sportsbook. If you choose to bet with a licensed operator based on something
          you read here, that&apos;s a decision between you and that operator — and it should stay something you can
          comfortably afford, whether a Pick wins or loses.
        </P>
      </Section>

      <Section title="18+ only">
        <P>This service, and sports betting generally, is restricted to adults 18 and over.</P>
      </Section>

      <Section title="Keeping it under control">
        <Ul
          items={[
            "Treat betting as entertainment with a cost, not a way to make money.",
            "Decide a limit before the day's games start, not during them.",
            "Never chase a loss with a bigger stake.",
            "Don't bet money earmarked for rent, food, fees, or family obligations.",
            "Take breaks — a losing run isn't a signal to stake more; often it's a signal to stop for the day.",
          ]}
        />
      </Section>

      <Section title="Signs it's becoming a problem">
        <Ul
          items={[
            "Betting more than you planned, or more than you can afford to lose.",
            "Lying to people close to you about how much you're betting.",
            "Borrowing money to bet or to cover betting losses.",
            "Feeling anxious, irritable, or unable to stop thinking about betting.",
          ]}
        />
        <P>If any of this sounds familiar, it&apos;s worth talking to someone — a doctor, a trusted person, or one of the resources below.</P>
      </Section>

      <Section title="Where to get help in Ghana">
        <P>
          The <B>Gaming Commission of Ghana</B> (established under the Gaming Act, 2006, Act 721) is the official
          regulator of licensed betting and gaming in the country — gamingcommission.gov.gh.
        </P>
        <P>
          The <B>Mental Health Authority of Ghana</B> (mha-ghana.com) is the national public body for mental health
          support and can be a starting point if gambling is affecting your wellbeing.
        </P>
        <P className="text-accent-gold">
          [Important: insert a verified, currently-active local helpline number here before publishing — for
          example a Gaming Commission or Mental Health Authority support line. We deliberately left this as a
          placeholder rather than print a number we couldn&apos;t confirm is still correct; a wrong number in this
          spot is worse than none. Check gamingcommission.gov.gh and mha-ghana.com directly for current contact
          details.]
        </P>
        <P>
          If you bank with a Ghanaian Mobile Money provider or commercial bank, you can also ask them directly about
          blocking outgoing payments to betting operators.
        </P>
      </Section>

      <Section title="Self-exclusion">
        <P>
          If you have an account with a betting operator and want to stop, contact that operator directly to close
          your account or ask about self-exclusion options. [If the Gaming Commission of Ghana operates (or later
          launches) a national self-exclusion register, link it here once you&apos;ve confirmed it&apos;s live —
          we found references to one but couldn&apos;t verify current status from an official source, so didn&apos;t
          state it as fact.]
        </P>
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

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-archivo text-[13px] text-text-secondary leading-relaxed mb-2 ${className}`}>{children}</p>;
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
