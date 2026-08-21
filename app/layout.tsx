import type { Metadata } from "next";
import NavShell from "@/components/NavShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Report",
  description:
    "Weekly attendance and remarks for every student, per lesson plan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
