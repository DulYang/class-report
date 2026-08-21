import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Single gate for the whole admin section. Coaches never sign in, so an
 * unauthenticated visitor is redirected to /login; RLS blocks the writes
 * independently even if a route were reached some other way.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
