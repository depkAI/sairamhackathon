"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/useData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Menu, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const notifications = useNotifications(profile?.uid || "");

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!profile) return null;

  const firstName = profile.name.split(" ")[0];

  const handleNotificationClick = async (n: (typeof notifications)[0]) => {
    if (!n.read) {
      await markNotificationRead(n.id);
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    if (profile) {
      await markAllNotificationsRead(profile.uid);
    }
  };

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-5 md:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 h-9 w-9 rounded-xl"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Hi, {firstName}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight hidden sm:block mt-0.5">
          Welcome back to CampusOps
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        {/* Notifications */}
        <Popover>
          <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
            <Bell className="h-[18px] w-[18px] text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white px-1 shadow-sm shadow-red-500/30">
                {unreadCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-0 rounded-2xl shadow-xl border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-[360px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-14 px-6">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Inbox className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                <div className="py-1.5">
                  {notifications.slice(0, 15).map((n, i) => (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${
                        !n.read ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => handleNotificationClick(n)}
                    >
                      {/* Unread indicator */}
                      <div className="flex items-center pt-1.5 shrink-0 w-2">
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-sm leading-snug truncate ${!n.read ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-600 dark:text-gray-300"}`}>
                            {n.title}
                          </p>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 font-medium">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
