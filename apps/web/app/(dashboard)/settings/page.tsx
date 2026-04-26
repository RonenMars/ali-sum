import * as React from "react";
import {
  Calendar,
  Mail,
  Moon,
  Coins,
  User as UserIcon,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ExtensionTokenRow } from "@/components/dashboard/extension-token-row";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

async function getSyncHistory(userId: string) {
  return prisma.syncLog.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
}

async function getPrimaryCurrency(userId: string): Promise<string> {
  const order = await prisma.order.findFirst({
    where: { userId },
    select: { currency: true },
    orderBy: { orderDate: "desc" },
  });
  return order?.currency ?? "USD";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, syncLogs, primaryCurrency] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getSyncHistory(userId),
    getPrimaryCurrency(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, preferences, and extension connection.
        </p>
      </header>

      <Section eyebrow="Account">
        <SettingRow
          icon={<UserIcon className="size-5 text-primary" aria-hidden />}
          label="Name"
          subtitle={user?.name || "—"}
        />
        <SettingRow
          icon={<Mail className="size-5 text-primary" aria-hidden />}
          label="Email"
          subtitle={user?.email ?? "—"}
        />
        <SettingRow
          icon={<Calendar className="size-5 text-primary" aria-hidden />}
          label="Member since"
          subtitle={
            user?.createdAt ? dateFormatter.format(user.createdAt) : "—"
          }
        />
      </Section>

      <Section eyebrow="Preferences">
        <SettingRow
          icon={<Coins className="size-5 text-primary" aria-hidden />}
          label="Currency"
          subtitle={`${primaryCurrency} · detected from your most recent order`}
        />
        <SettingRow
          icon={<Moon className="size-5 text-primary" aria-hidden />}
          label="Display mode"
          subtitle="Midnight Violet"
        />
      </Section>

      <Section eyebrow="Extension">
        <ExtensionTokenRow />
      </Section>

      <Section eyebrow="Sync History">
        {syncLogs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No sync history yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {syncLogs.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-foreground">
                    {dateTimeFormatter.format(log.startedAt)}
                  </span>
                  <StatusPill status={log.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.error
                    ? log.error
                    : `${log.ordersNew} new · ${log.ordersFound} found`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <SignOutButton />
    </div>
  );
}

function Section({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-0">
      <span aria-hidden className="shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "completed"
    ? "bg-[color:var(--positive)]/15 text-[color:var(--positive)]"
    : status === "failed"
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone
      )}
    >
      {status}
    </span>
  );
}
