import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForms from "@/components/AuthForms";
import { getCurrentAdmin, isBootstrapOpen } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const bootstrap = await isBootstrapOpen();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
        <p className="text-sm text-neutral-600">
          Schools, grades, coaches, curriculum and syllabus are admin-only.
          Coaches use the{" "}
          <Link href="/weekly" className="font-medium underline">
            weekly view
          </Link>{" "}
          without signing in.
        </p>
      </header>

      <AuthForms bootstrap={bootstrap} />
    </div>
  );
}
