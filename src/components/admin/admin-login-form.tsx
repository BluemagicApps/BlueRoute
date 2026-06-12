"use client";

import { useState, type FormEvent } from "react";
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }
    // Full navigation so the server reads the fresh session cookie; the /admin
    // layout then verifies the admins-table membership (non-admins bounce).
    window.location.assign("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-abyss px-5">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-steel/70 p-8 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-indigo text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1
            className="mt-5 text-2xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Staff access only. Use the credentials issued by your
            administrator.
          </p>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="text-sm font-medium text-foam">
                Email
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-steel bg-deep px-4 py-3 focus-within:border-cyan">
                <Mail className="h-4 w-4 shrink-0 text-mist" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-foam outline-none placeholder:text-mist/70"
                  placeholder="you@blueroute.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-foam">
                Password
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-steel bg-deep px-4 py-3 focus-within:border-cyan">
                <Lock className="h-4 w-4 shrink-0 text-mist" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-foam outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-soft transition-opacity disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-mist">
          Customer? <a href="/login" className="font-medium text-cyan hover:underline">Sign in to the portal</a> instead.
        </p>
      </div>
    </main>
  );
}
