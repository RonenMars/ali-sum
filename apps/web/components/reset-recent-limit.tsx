"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ResetRecentLimit() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.has("recentLimit")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("recentLimit");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
