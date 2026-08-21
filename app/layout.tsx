import type { Metadata } from "next";
import NavShell from "@/components/NavShell";
import { getCurrentAdmin } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Report",
  description:
    "Weekly attendance and remarks for every student, per lesson plan.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  return (
    <html lang="en">
      <body className="antialiased">
        <NavShell adminName={admin?.name ?? null}>{children}</NavShell>
      </body>
    </html>
  );
}
