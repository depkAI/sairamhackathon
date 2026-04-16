"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/lib/useData";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { profile } = useAuth();
  const router = useRouter();
  const notifications = useNotifications(profile?.uid || "");
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!profile) return null;

  const pageTitle =
    profile.role === "student" ? "Student Portal" :
    profile.role === "admin" ? "Admin Panel" :
    profile.role === "hod" ? "Department Head" :
    "Worker Portal";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 ml-0 md:ml-64">
      <div className="flex items-center justify-between px-6 h-16">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 font-semibold text-sm text-gray-700">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-400 text-sm text-center">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-gray-50 text-sm cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/50" : ""}`}
                      onClick={() => { if (n.link) router.push(n.link); setShowNotifs(false); }}
                    >
                      <div className="font-medium text-gray-800">{n.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-800">{profile.name}</div>
              <div className="text-xs text-gray-400 capitalize">{profile.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
