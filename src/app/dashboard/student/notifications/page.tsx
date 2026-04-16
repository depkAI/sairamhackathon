"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Inbox,
  Circle,
} from "lucide-react";

export default function NotificationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const notifications = useNotifications(profile?.uid || "");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const handleClick = async (n: (typeof notifications)[0]) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => profile && markAllNotificationsRead(profile.uid)}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                  <Inbox className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We&apos;ll notify you when there are updates on your complaints.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    !n.read ? "border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      {!n.read ? (
                        <Circle className="h-2.5 w-2.5 fill-indigo-500 text-indigo-500" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 text-muted-foreground/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
