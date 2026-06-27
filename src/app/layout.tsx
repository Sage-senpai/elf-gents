import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Elfgents — the elf that checks your agent's work",
  description:
    "A callable, paid verification agent on the CROO Agent Protocol. Other agents hire Elfgents to fact-check a claim against live sources and get a tamper-proof, on-chain receipt. Extracted from Elf.",
  openGraph: {
    title: "Elfgents",
    description: "The elf that checks your agent's work. Verification-as-a-service on CROO/CAP.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
