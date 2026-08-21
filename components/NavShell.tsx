"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SECTIONS = [
  { href: "/weekly", label: "Weekly View" },
  { href: "/classes", label: "Classes" },
  { href: "/students", label: "Students" },
  { href: "/reports", label: "Reports" },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Any navigation closes the mobile drawer.
  useEffect(() => setOpen(false), [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="space-y-1">
      {SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            isActive(s.href)
              ? "bg-neutral-900 text-white"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-neutral-700"
        >
          <span aria-hidden>☰</span>
        </button>
        <Link href="/weekly" className="font-bold tracking-tight">
          Class Report
        </Link>
      </div>
      {open && (
        <div className="border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          {nav}
        </div>
      )}

      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white p-4 md:block md:min-h-screen">
          <Link
            href="/weekly"
            className="mb-6 block text-lg font-bold tracking-tight"
          >
            Class Report
          </Link>
          {nav}
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
