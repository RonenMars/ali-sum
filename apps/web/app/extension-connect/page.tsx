"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "loading" | "success" | "needs-login" | "error";

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          callback?: (response: unknown) => void,
        ) => void;
        lastError?: { message: string };
      };
    };
  }
}

function ExtensionConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const extensionId = searchParams.get("extensionId");

  const [asyncStatus, setAsyncStatus] = useState<Status>("loading");
  const [asyncErrorMsg, setAsyncErrorMsg] = useState("");
  const status = extensionId ? asyncStatus : "error";
  const errorMsg = extensionId ? asyncErrorMsg : "Missing extensionId parameter";

  useEffect(() => {
    if (!extensionId) {
      return;
    }

    (async () => {
      const res = await fetch("/api/auth/extension-token", {
        credentials: "include",
      });

      if (res.status === 401) {
        setAsyncStatus("needs-login");
        return;
      }

      if (!res.ok) {
        setAsyncStatus("error");
        setAsyncErrorMsg(`Failed to mint token (${res.status})`);
        return;
      }

      const { token } = (await res.json()) as { token: string };

      if (!window.chrome?.runtime?.sendMessage) {
        setAsyncStatus("error");
        setAsyncErrorMsg(
          "chrome.runtime not available — open this page in Chrome with the extension installed.",
        );
        return;
      }

      window.chrome.runtime.sendMessage(
        extensionId,
        { type: "SET_TOKEN", token },
        (response) => {
          const lastError = window.chrome?.runtime?.lastError;
          if (lastError) {
            setAsyncStatus("error");
            setAsyncErrorMsg(lastError.message);
            return;
          }
          const ok = (response as { ok?: boolean } | undefined)?.ok;
          if (ok) {
            setAsyncStatus("success");
          } else {
            setAsyncStatus("error");
            setAsyncErrorMsg("Extension rejected the token");
          }
        },
      );
    })();
  }, [extensionId]);

  return (
    <CardContent className="space-y-4 text-sm">
      {status === "loading" && (
        <p className="text-center text-muted-foreground">Connecting…</p>
      )}

      {status === "success" && (
        <>
          <p className="text-center text-[color:var(--positive)]">
            Extension connected successfully.
          </p>
          <p className="text-center text-muted-foreground">
            You can close this tab and return to the extension popup.
          </p>
          <Button className="w-full" onClick={() => window.close()}>
            Close
          </Button>
        </>
      )}

      {status === "needs-login" && (
        <>
          <p className="text-center text-muted-foreground">
            You need to sign in before the extension can be connected.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              const next = `/extension-connect?extensionId=${encodeURIComponent(extensionId ?? "")}`;
              router.push(`/login?callbackUrl=${encodeURIComponent(next)}`);
            }}
          >
            Sign in
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-center text-destructive">{errorMsg}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </>
      )}
    </CardContent>
  );
}

export default function ExtensionConnectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect Extension</CardTitle>
        </CardHeader>
        <Suspense>
          <ExtensionConnectContent />
        </Suspense>
      </Card>
    </div>
  );
}
