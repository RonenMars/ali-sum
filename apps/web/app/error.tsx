"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm text-destructive">Something went wrong.</p>
        {error.message && (
          <p className="text-xs text-muted-foreground">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="text-sm underline underline-offset-4 hover:text-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
