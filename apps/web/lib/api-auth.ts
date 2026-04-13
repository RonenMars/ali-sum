import { NextRequest } from "next/server";
import { auth } from "./auth";
import { jwtVerify } from "jose";

export async function getAuthUserId(req?: NextRequest): Promise<string | null> {
  // Try Bearer token first (extension requests)
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.userId && typeof payload.userId === "string") {
          return payload.userId;
        }
      } catch {
        return null;
      }
    }
  }

  // Fall back to NextAuth session (web app requests)
  const session = await auth();
  return session?.user?.id ?? null;
}
