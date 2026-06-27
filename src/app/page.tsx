import Link from "next/link";

/* Elfgents landing — deliberately one screen of flow, not a workspace.
   The whole point: this is the agent and what it does, nothing else. */

const GITHUB = "https://github.com/Sage-senpai/elf-gents";
const STORE = "https://agent.croo.network";

export default function Page() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <Flow />
      <WhoHires />
      <Lifecycle />
      <Receipt />
      <CTA />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-brand-line/70 bg-brand-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-accent text-brand-bg">E</span>
          <span className="text-lg">Elfgents</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-brand-muted md:flex">
          <a href="#flow" className="hover:text-white">How it works</a>
          <a href="#who" className="hover:text-white">Who hires it</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href={GITHUB} className="hover:text-white">GitHub</a>
        </div>
        <a href={STORE} className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-bg hover:opacity-90">
          Hire on CROO
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="grid-bg border-b border-brand-line/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] accent-text">
          A callable agent on the CROO Agent Protocol
        </p>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          The elf that <span className="accent-text">checks your agent&apos;s work</span>.
        </h1>
        <p className="mt-7 max-w-2xl text-lg text-brand-muted">
          Elfgents is a paid agent other agents hire. Send it a claim and the sources behind it.
          It reads them, judges whether they hold up, and hands back a tamper-proof, on-chain
          <span className="text-white"> receipt</span> your agent can staple to its own delivery.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href={STORE} className="rounded-xl bg-brand-accent px-6 py-3 font-semibold text-brand-bg hover:opacity-90">
            Hire it on the Agent Store
          </a>
          <a href={GITHUB} className="rounded-xl border border-brand-line px-6 py-3 font-semibold text-white hover:border-brand-accent">
            Read the code
          </a>
        </div>
        <p className="mt-8 text-sm text-brand-dim">
          Extracted from <span className="text-brand-muted">Elf</span>, a builder workspace. This is just its
          provenance layer, made callable. No dashboard, no login — one job, one price.
        </p>
      </div>
    </section>
  );
}

function Flow() {
  const steps = [
    {
      n: "1",
      t: "An agent sends a claim",
      d: "Any agent, mid-task, passes Elfgents a statement plus the source URLs it wants checked. One CAP call.",
    },
    {
      n: "2",
      t: "Elfgents reads + judges",
      d: "It fetches each source, decides whether they actually support the claim, and signs a content-addressed receipt.",
    },
    {
      n: "3",
      t: "Verified result comes back",
      d: "A verdict, citations, and an on-chain receipt. The hiring agent staples it to its own delivery as proof.",
    },
  ];
  return (
    <section id="flow" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel>The agentic flow</SectionLabel>
      <h2 className="mt-4 max-w-3xl text-3xl font-extrabold md:text-4xl">
        One loop, not a workspace.
      </h2>
      <p className="mt-4 max-w-2xl text-brand-muted">
        Elf is a whole platform. Elfgents is the single thing that platform did best, turned into a
        service you can call: <span className="text-white">claim in, verified receipt out</span>.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.n} className="card relative p-7">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-accent font-bold text-brand-bg">
              {s.n}
            </div>
            <h3 className="mt-5 text-lg font-bold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">{s.d}</p>
            {i < steps.length - 1 && (
              <span className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-2xl accent-text md:block">→</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function WhoHires() {
  const rows = [
    ["Research agents", "Every research track agent must show verifiable sources. They hire Elfgents to prove it."],
    ["Content & creator agents", "Stamp a fact-checked receipt on generated copy before it ships."],
    ["Any agent selling output", "CAP rewards verifiable delivery. Elfgents is how a delivery earns the word ‘verified’."],
  ];
  return (
    <section id="who" className="border-y border-brand-line/60 bg-brand-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionLabel>Why it&apos;s a dependency</SectionLabel>
        <h2 className="mt-4 max-w-3xl text-3xl font-extrabold md:text-4xl">
          Built to be <span className="accent-text">hired by other agents</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-brand-muted">
          Elfgents isn&apos;t a destination, it&apos;s a part other agents plug in. That&apos;s the point of A2A:
          you build one good service and other people&apos;s agents become your customers.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {rows.map(([t, d]) => (
            <div key={t} className="card p-6">
              <h3 className="font-bold accent-text">{t}</h3>
              <p className="mt-2 text-sm text-brand-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Lifecycle() {
  const steps = [
    ["Negotiate", "A buyer agent requests a verification at the listed price."],
    ["Pay", "USDC is escrowed in CAPVault. We never touch it until we deliver."],
    ["Verify", "Elfgents reads the sources and grades the claim."],
    ["Deliver", "It returns the signed receipt as the deliverable."],
    ["Settle", "On delivery, USDC settles into the agent&apos;s wallet."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel>How it settles</SectionLabel>
      <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">The CAP order lifecycle</h2>
      <p className="mt-4 max-w-2xl text-brand-muted">
        Money is escrowed before any work and released only on delivery. Neither side has to trust the other.
      </p>
      <ol className="mt-10 space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="card flex items-center gap-5 p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-accent font-bold text-brand-bg">
              {i + 1}
            </span>
            <div>
              <span className="font-bold">{t}.</span>{" "}
              <span className="text-brand-muted" dangerouslySetInnerHTML={{ __html: d }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Receipt() {
  const sample = `{
  "v": 1,
  "job": "order_8f2a…",
  "result": {
    "claim": "Stellar settles in 3-5 seconds",
    "verdict": "supported",
    "confidence": 0.91,
    "citations": [{ "url": "stellar.org/…", "quote": "…3-5 seconds…" }]
  },
  "contentHash": "0x4c9f…",   // keccak256 of the result
  "previousHash": "0x1ab0…",  // hash-chained to the last job
  "signer": "0x9Ad…",         // the agent's wallet
  "signature": "0x…"          // proves Elfgents issued it
}`;
  return (
    <section className="border-y border-brand-line/60 bg-brand-card/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <SectionLabel>The deliverable</SectionLabel>
          <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">A receipt, not just an answer.</h2>
          <p className="mt-4 text-brand-muted">
            Every job returns a signed, content-addressed receipt. It&apos;s hash-chained to the last one, so a
            buyer can audit a whole run as a tamper-evident sequence. This is the part lifted straight from
            Elf&apos;s audit log — now it&apos;s the product.
          </p>
        </div>
        <pre className="card overflow-x-auto p-6 text-sm leading-relaxed text-brand-accent2">
          <code>{sample}</code>
        </pre>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-28 text-center">
      <h2 className="text-4xl font-extrabold md:text-5xl">
        Stop trusting. Start <span className="accent-text">verifying</span>.
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-brand-muted">
        One verification, one fixed price in USDC. No subscription, no account. Your agent calls it,
        pays it, gets a receipt.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <a href={STORE} className="rounded-xl bg-brand-accent px-7 py-3.5 font-semibold text-brand-bg hover:opacity-90">
          Hire Elfgents on CROO
        </a>
        <a href={GITHUB} className="rounded-xl border border-brand-line px-7 py-3.5 font-semibold text-white hover:border-brand-accent">
          Run it yourself
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-brand-line/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-brand-dim md:flex-row">
        <span>Elfgents · the elf that checks your agent&apos;s work</span>
        <span>Extracted from Elf · MIT · built for the CROO Agent Hackathon</span>
      </div>
    </footer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.25em] accent-text">{children}</p>
  );
}
