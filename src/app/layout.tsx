import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenscape Pro - Quote Accelerator",
  description: "Site-walk notes -> review-ready proposal. AI prepares, Marcus approves.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b-[3px] border-black bg-white/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="h-brutal text-lg">
              🌿 GREENSCAPE PRO{" "}
              <span className="font-bold text-neutral-500">/ Quote Accelerator</span>
            </Link>
            <Link href="/quotes/new" className="btn">
              + New Quote
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
