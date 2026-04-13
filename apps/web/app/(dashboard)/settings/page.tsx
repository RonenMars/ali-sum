import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExtensionTokenButton } from "@/components/dashboard/extension-token-button";

async function getSyncHistory(userId: string) {
  return prisma.syncLog.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
}

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, syncLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getSyncHistory(userId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and extension connection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{user?.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chrome Extension</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate an API token to connect the Chrome extension to your account.
            Copy this token and paste it in the extension settings.
          </p>
          <ExtensionTokenButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No sync history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div key={log.id}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "default"
                            : log.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(log.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <span>
                      {log.ordersNew} new / {log.ordersFound} found
                    </span>
                  </div>
                  {log.error && (
                    <p className="text-xs text-destructive mt-1">{log.error}</p>
                  )}
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
