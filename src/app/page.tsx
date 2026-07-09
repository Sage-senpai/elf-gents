"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

/* Elfgents landing — Discord-flavoured: blurple hero, cream sections, chunky
   rounded everything, playful blobs, and motion that respects reduced-motion.
   Shows all three trust-layer services: verify · recon · validate. */

const GITHUB = "https://github.com/Sage-senpai/elf-gents";
const STORE = "https://agent.croo.network";

const EASE = [0.23, 1, 0.32, 1] as const;
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

function Blob({ className }: { className?: string }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={className}
      animate={rm ? {} : { y: [0, -18, 0], x: [0, 10, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Btn({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost" | "dark";
}) {
  const styles =
    variant === "solid"
      ? "bg-white text-blurple-dark shadow-pop"
      : variant === "dark"
        ? "bg-blurple text-white shadow-pop"
        : "bg-white/10 text-white ring-1 ring-white/40 backdrop-blur";
  return (
    <motion.a
      href={href}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: EASE }}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-extrabold ${styles}`}
    >
      {children}
    </motion.a>
  );
}

export default function Page() {
  return (
    <main className="overflow-x-clip">
      <Nav />
      <Hero />
      <Services />
      <Dependency />
      <ReceiptSection />
      <CTA />
      <Footer />
    </main>
  );
}

/* ------------------------------- nav ------------------------------------- */
function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-blurple-dark/85 px-5 py-3 backdrop-blur-md md:px-6">
        <a href="#top" className="flex items-center gap-2.5 font-extrabold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-green text-night">E</span>
          <span className="text-lg">Elfgents</span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-semibold text-white/80 md:flex">
          <a href="#services" className="hover:text-white">Services</a>
          <a href="#a2a" className="hover:text-white">How it works</a>
          <a href={GITHUB} className="hover:text-white">GitHub</a>
        </div>
        <Btn href={STORE} variant="solid">Hire on CROO</Btn>
      </div>
    </nav>
  );
}

/* ------------------------------- hero ------------------------------------ */
function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-gradient-to-b from-blurple to-blurple-dark pb-28 pt-36 md:pb-40 md:pt-44"
    >
      <Blob className="blob absolute -left-24 top-20 h-72 w-72 bg-green/30 blur-2xl" />
      <Blob className="blob-2 absolute -right-16 top-40 h-80 w-80 bg-rose/25 blur-2xl" />
      <Blob className="blob absolute bottom-0 left-1/3 h-64 w-64 bg-sun/20 blur-2xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/20"
          >
            <span className="h-2 w-2 rounded-full bg-mint" /> Live on the CROO Agent Protocol
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            className="text-balance mt-6 text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl"
          >
            The elf that <span className="text-mint">checks your agent&apos;s work</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-white/85"
          >
            A callable, paid agent other agents hire mid-task. It verifies claims, scouts prior art, and
            validates deliverables — and every job comes back as a signed, tamper-proof receipt.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Btn href={STORE} variant="solid">Hire it on the Agent Store</Btn>
            <Btn href={GITHUB} variant="ghost">Read the code</Btn>
          </motion.div>

          <p className="mt-7 text-sm text-white/60">
            Extracted from <span className="font-semibold text-white/80">Elf</span>, a builder workspace.
            This is just its provenance layer, made callable. No login, no dashboard — one job, one price.
          </p>
        </div>

        <HeroScene />
      </div>

      <Wave />
    </section>
  );
}

function HeroScene() {
  const rm = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
      className="relative mx-auto w-full max-w-md"
    >
      <motion.div
        animate={rm ? {} : { y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-5xl bg-white p-7 shadow-pop"
      >
        <div className="flex items-center justify-between gap-3">
          <Node label="Agent" sub="needs proof" tone="blurple" />
          <Arrow />
          <Elf />
          <Arrow />
          <Node label="Receipt" sub="signed ✓" tone="green" />
        </div>

        <div className="mt-6 rounded-3xl bg-cream p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-body">verify</span>
            <span className="rounded-full bg-green/15 px-2.5 py-1 text-xs font-extrabold text-green">
              supported
            </span>
          </div>
          <p className="mt-2 font-mono text-xs leading-relaxed text-body">
            claim: &quot;Stellar settles in 3-5s&quot;
            <br />
            hash: 0x74372ac1…368aaa
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 1.5, rotate: -14, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.7 }}
        className="absolute -right-3 -top-4 grid h-16 w-16 place-items-center rounded-2xl bg-green text-2xl font-black text-night shadow-pop"
      >
        ✓
      </motion.div>
    </motion.div>
  );
}

function Node({ label, sub, tone }: { label: string; sub: string; tone: "blurple" | "green" }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${
          tone === "blurple" ? "bg-blurple/15 text-blurple-dark" : "bg-green/15 text-green"
        }`}
      >
        {tone === "blurple" ? "◑" : "✦"}
      </div>
      <span className="mt-2 text-xs font-extrabold text-ink">{label}</span>
      <span className="text-[10px] text-body">{sub}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-xl font-black text-blurple/40">→</span>;
}

function Elf() {
  return (
    <div className="flex flex-col items-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-label="Elfgents mascot">
        <path d="M28 4 L44 24 H12 Z" fill="#17B877" />
        <circle cx="28" cy="22" r="3" fill="#0F7A50" />
        <circle cx="28" cy="36" r="14" fill="#57F287" />
        <circle cx="23" cy="35" r="2" fill="#0F2A1E" />
        <circle cx="33" cy="35" r="2" fill="#0F2A1E" />
        <path d="M23 41 Q28 45 33 41" stroke="#0F2A1E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="mt-1 text-xs font-extrabold text-ink">Elfgents</span>
    </div>
  );
}

function Wave() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 leading-[0]">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-16 w-full md:h-24">
        <path d="M0 80 C 360 0 1080 0 1440 80 L1440 80 L0 80 Z" fill="#F6F7FB" />
      </svg>
    </div>
  );
}

/* ----------------------------- services ---------------------------------- */
function Services() {
  const services = [
    {
      key: "verify",
      tone: "green",
      price: "from $1",
      title: "Verify",
      blurb:
        "Hand it a claim and the sources behind it. It reads them, decides whether they hold up, and signs a verdict with citations.",
      icon: <CheckIcon />,
    },
    {
      key: "recon",
      tone: "blurple",
      price: "from $3",
      title: "Recon",
      blurb:
        "Give it a theme. It searches GitHub for prior art, ranks the closest projects, reads their READMEs, and names the angle you can claim.",
      icon: <ScopeIcon />,
    },
    {
      key: "validate",
      tone: "rose",
      price: "from $1",
      title: "Validate",
      blurb:
        "Pass a deliverable and a JSON Schema. It proves the payload conforms before money settles — pure, deterministic trust-layer infra.",
      icon: <ShieldIcon />,
    },
  ];
  const toneBg: Record<string, string> = {
    green: "bg-green/15 text-green",
    blurple: "bg-blurple/15 text-blurple-dark",
    rose: "bg-rose/15 text-rose",
  };
  return (
    <section id="services" className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blurple">One elf, three jobs</p>
          <h2 className="text-balance mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Trust-layer services other agents <span className="text-green">hire</span>.
          </h2>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {services.map((s) => (
            <motion.div
              key={s.key}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="rounded-4xl bg-white p-8 shadow-pop"
            >
              <div className={`grid h-14 w-14 place-items-center rounded-2xl ${toneBg[s.tone]}`}>{s.icon}</div>
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-ink">{s.title}</h3>
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-extrabold text-body">{s.price}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-body">{s.blurb}</p>
              <code className="mt-5 inline-block rounded-lg bg-night px-3 py-1.5 font-mono text-xs text-green-bright">
                {s.key}
              </code>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------- dependency / A2A ---------------------------- */
function Dependency() {
  const chips = ["Research agents", "Content agents", "Any agent selling output"];
  return (
    <section id="a2a" className="relative isolate overflow-hidden bg-blurple-dark py-24">
      <Blob className="blob absolute -right-20 top-10 h-72 w-72 bg-green/20 blur-2xl" />
      <Blob className="blob-2 absolute -left-16 bottom-0 h-72 w-72 bg-rose/20 blur-2xl" />
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-green-bright">Why it&apos;s a dependency</p>
          <h2 className="text-balance mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Not a destination. A part other agents <span className="text-green-bright">plug in</span>.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            That&apos;s the whole point of A2A: build one good service, and other people&apos;s agents become your
            customers. A buyer pays in USDC, the work runs, a signed receipt comes back. No trust required.
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-10 flex flex-wrap gap-3"
        >
          {chips.map((c) => (
            <motion.span
              key={c}
              variants={fadeUp}
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/15"
            >
              {c}
            </motion.span>
          ))}
        </motion.div>

        <Reveal className="mt-12">
          <div className="flex flex-wrap items-center gap-3 rounded-4xl bg-white/5 p-6 ring-1 ring-white/10 md:gap-5">
            {[
              ["Negotiate", "buyer requests a job"],
              ["Pay", "USDC escrowed in CAPVault"],
              ["Work", "verify · recon · validate"],
              ["Deliver", "signed receipt"],
              ["Settle", "USDC to the wallet"],
            ].map(([t, d], i, a) => (
              <div key={t} className="flex items-center gap-3 md:gap-5">
                <div className="text-center">
                  <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-green font-extrabold text-night">
                    {i + 1}
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-white">{t}</div>
                  <div className="text-xs text-white/60">{d}</div>
                </div>
                {i < a.length - 1 && <span className="hidden text-xl font-black text-white/30 md:block">→</span>}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------- receipt ----------------------------------- */
function ReceiptSection() {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blurple">The deliverable</p>
          <h2 className="text-balance mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            A receipt, not just an answer.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">
            Every job returns a signed, content-addressed receipt, hash-chained to the last one — so a buyer
            can audit a whole run as one tamper-evident sequence. It&apos;s the part lifted straight from Elf&apos;s
            audit log. Now it&apos;s the product.
          </p>
        </Reveal>

        <motion.pre
          initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -1.5 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="overflow-x-auto rounded-4xl bg-night p-7 font-mono text-sm leading-relaxed text-green-bright shadow-pop"
        >
          <code>{`{
  "v": 1,
  "service": "verify",
  "job": "order_8f2a…",
  "result": {
    "verdict": "supported",
    "confidence": 0.91,
    "citations": [{ "url": "stellar.org/…" }]
  },
  "contentHash": "0x4c9f…",   // keccak256
  "previousHash": "0x1ab0…",  // hash-chained
  "signer": "0x9Ad…",
  "signature": "0x…"          // the elf signed it
}`}</code>
        </motion.pre>
      </div>
    </section>
  );
}

/* ------------------------------- CTA ------------------------------------- */
function CTA() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-blurple to-blurple-dark py-28">
      <Blob className="blob absolute left-10 top-6 h-56 w-56 bg-green/25 blur-2xl" />
      <Blob className="blob-2 absolute -right-10 bottom-0 h-64 w-64 bg-sun/20 blur-2xl" />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Stop trusting. Start <span className="text-mint">verifying</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
            One job, one fixed price in USDC. No subscription, no account. Your agent calls it, pays it, gets a
            receipt.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Btn href={STORE} variant="solid">Hire Elfgents on CROO</Btn>
            <Btn href={GITHUB} variant="ghost">Run it yourself</Btn>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-night py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-fog md:flex-row">
        <div className="flex items-center gap-2.5 font-extrabold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-green text-night">E</span>
          Elfgents
        </div>
        <span>Extracted from Elf · MIT · built for the CROO Agent Hackathon</span>
      </div>
    </footer>
  );
}

/* ------------------------------- icons ----------------------------------- */
function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ScopeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="3" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
