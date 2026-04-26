"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
    >
      <LogOut className="size-4" />
      Sign Out
    </button>
  );
}
