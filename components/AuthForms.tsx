"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { bootstrapAdminAction, signInAction } from "@/lib/actions/auth";

export default function AuthForms({ bootstrap }: { bootstrap: boolean }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Sign in</h2>
        <ActionForm
          action={signInAction}
          submitLabel="Sign in"
          pendingLabel="Signing in…"
          successMessage="Signed in."
        >
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
        </ActionForm>
      </section>

      {bootstrap && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            Set up the first admin
          </h2>
          <p className="mb-3 text-sm text-amber-800">
            No admin account exists yet. Create one here — this form disappears
            for good once it does, and further admins are added from the Coaches
            page.
          </p>
          <ActionForm
            action={bootstrapAdminAction}
            submitLabel="Create admin account"
            pendingLabel="Creating…"
            successMessage="Admin account created."
          >
            <Field label="Your name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                className={inputClass}
              />
            </Field>
            <Field label="Password (8+ characters)">
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
