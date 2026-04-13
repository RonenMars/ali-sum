"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ExtensionTokenButton() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateToken() {
    setLoading(true);
    const res = await fetch("/api/auth/extension-token");
    const data = await res.json();
    setToken(data.token);
    setLoading(false);
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {!token ? (
        <Button onClick={generateToken} disabled={loading} size="sm">
          {loading ? "Generating..." : "Generate Token"}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
              {token}
            </code>
            <Button onClick={copyToken} size="sm" variant="outline">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste this token in the Chrome extension to connect your account.
          </p>
        </div>
      )}
    </div>
  );
}
