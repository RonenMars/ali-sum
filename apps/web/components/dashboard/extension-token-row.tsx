"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Inline row for the Extension section: shows current state ("Not generated"
 * or the token + Copy button) and lets the user generate a fresh token via
 * the existing /api/auth/extension-token endpoint.
 */
export function ExtensionTokenRow() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/extension-token");
      if (!res.ok) throw new Error("Couldn't generate token.");
      const data = await res.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <KeyRound className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Connect Token</p>
          <p className="text-xs text-muted-foreground">
            {token
              ? "Paste this in the Chrome extension to link your account."
              : "Generate a token to connect the Chrome extension."}
          </p>
        </div>
        {!token && (
          <button
            type="button"
            onClick={generateToken}
            disabled={loading}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        )}
      </div>

      {token && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <code className="flex-1 truncate font-mono text-[11px] text-foreground">
            {token}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className={cn(
              "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary",
              copied && "text-[color:var(--positive)]"
            )}
            aria-label="Copy token"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
