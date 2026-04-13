"use client";

import { useRouter } from "next/navigation";
import { useTransition, useEffect, useRef } from "react";

export function LoadMoreButton({ href }: { href: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const wasLoadingRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (wasLoadingRef.current && !isPending) {
      buttonRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    wasLoadingRef.current = isPending;
  }, [isPending]);

  return (
    <button
      ref={buttonRef}
      onClick={() => startTransition(() => router.push(href, { scroll: false }))}
      disabled={isPending}
      className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-60 flex items-center gap-2"
    >
      {isPending && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {isPending ? "Loading…" : "Load More"}
    </button>
  );
}
