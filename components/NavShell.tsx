"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/lib/actions/auth";

const COACH_SECTIONS = [
  { href: "/weekly", label: "Weekly View" },
  { href: "/classes", label: "Classes" },
  { href: "/reports", label: "Reports" },
];

const ADMIN_SECTIONS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/schools", label: "Schools & Grades" },
  { href: "/admin/coaches", label: "Coaches" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/curriculum", label: "Curriculum" },
  { href: "/admin/syllabus", label: "Syllabus" },
];

export default function NavShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Any navigation closes the mobile drawer.
  useEffect(() => setOpen(false), [pathname]);

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(href: string, exact = false) {
    return `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href, exact)
        ? "bg-neutral-900 text-white"
        : "text-neutral-700 hover:bg-neutral-100"
    }`;
  }

  const nav = (
    <div className="space-y-5">
      <nav className="space-y-1">
        {COACH_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={linkClass(s.href)}>
            {s.label}
          </Link>
        ))}
      </nav>

      <div>
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Admin
        </p>
        {adminName ? (
          <nav className="space-y-1">
            {ADMIN_SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={linkClass(s.href, s.exact)}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        ) : (
          <Link href="/login" className={linkClass("/login")}>
            Sign in
          </Link>
        )}
      </div>

      {adminName && (
        <div className="border-t border-neutral-200 pt-3">
          <p className="px-3 pb-2 text-xs text-neutral-500">
            Signed in as{" "}
            <span className="font-medium text-neutral-700">{adminName}</span>
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
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
