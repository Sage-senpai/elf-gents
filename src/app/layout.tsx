import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elfgents — the elf that checks your agent's work",
  description:
    "A callable, paid agent on the CROO Agent Protocol. Other agents hire Elfgents to verify claims, scout prior art, and validate deliverables — each job comes back as a signed, hash-chained receipt. Extracted from Elf.",
  openGraph: {
    title: "Elfgents",
    description: "The elf that checks your agent's work. Trust-layer services on CROO/CAP.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
