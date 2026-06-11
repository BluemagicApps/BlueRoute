"use client";

import { useState, type FormEvent } from "react";
import { Mail, ArrowRight, Sparkles, AlertCircle, Inbox } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  "link-expired":
    "That sign-in link is invalid or has expired. Request a fresh one below.",
};

type Status = "idle" | "sending" | "sent";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(
    initialError
      ? (ERROR_MESSAGES[initialError] ??
        "Something went wrong signing you in. Please request a new link.")
      : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    if (sendError) {
      setError(sendError.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 pt-28 pb-16">
      <div className="bg-grid absolute inset-0 -z-10 h-72" />

      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-steel/70 p-8 shadow-soft">
          {status === "sent" ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-indigo text-white">
                <Inbox className="h-6 w-6" />
              </span>
              <h1
                className="mt-5 text-2xl font-semibold text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Check your inbox
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-foam">{email}</span>. Click
                it on this device to open your portal.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm font-medium text-cyan hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-indigo text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1
                className="mt-5 text-2xl font-semibold text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign in to your portal
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                No password needed — we&apos;ll email you a secure one-time
                sign-in link.
              </p>

              {error && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-foam"
                >
                  Work email
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-steel bg-deep px-4 py-3 focus-within:border-cyan">
                  <Mail className="h-4 w-4 shrink-0 text-mist" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm text-foam outline-none placeholder:text-mist/70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-soft transition-opacity disabled:opacity-60"
                >
                  {status === "sending"
                    ? "Sending link…"
                    : "Email me a sign-in link"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-mist">
          First time here? Just enter your email — your account is created
          automatically.
        </p>
      </div>
    </section>
  );
}
