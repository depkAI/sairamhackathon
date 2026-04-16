"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
  KeyRound,
  Settings,
  MessageSquare,
  Lightbulb,
  Bell,
  FileText,
  Users,
  Wrench,
  BarChart3,
  Megaphone,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, { main: NavItem[]; config: NavItem[] }> = {
  student: {
    main: [
      { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard size={20} /> },
      { label: "Report Issue", href: "/dashboard/student/new-complaint", icon: <PlusCircle size={20} /> },
      { label: "Live Tracking", href: "/dashboard/student/live", icon: <BarChart3 size={20} /> },
      { label: "My Feedback", href: "/dashboard/student/feedback", icon: <MessageSquare size={20} /> },
      { label: "Submit Idea", href: "/dashboard/student/ideas", icon: <Lightbulb size={20} /> },
      { label: "Notifications", href: "/dashboard/student/notifications", icon: <Bell size={20} /> },
    ],
    config: [
      { label: "Profile", href: "/profile", icon: <User size={20} /> },
      { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
    ],
  },
  admin: {
    main: [
      { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
      { label: "Complaints", href: "/dashboard/admin/complaints", icon: <ClipboardList size={20} /> },
      { label: "Workers", href: "/dashboard/admin/workers", icon: <Wrench size={20} /> },
      { label: "Ideas", href: "/dashboard/admin/ideas", icon: <Lightbulb size={20} /> },
      { label: "Users", href: "/dashboard/admin/users", icon: <Users size={20} /> },
      { label: "Analytics", href: "/dashboard/admin/analytics", icon: <BarChart3 size={20} /> },
      { label: "Announcements", href: "/dashboard/admin/announcements", icon: <Megaphone size={20} /> },
    ],
    config: [
      { label: "Profile", href: "/profile", icon: <User size={20} /> },
      { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
    ],
  },
  hod: {
    main: [
      { label: "Dashboard", href: "/dashboard/hod", icon: <LayoutDashboard size={20} /> },
      { label: "Complaints", href: "/dashboard/hod/complaints", icon: <ClipboardList size={20} /> },
      { label: "Live Tracking", href: "/dashboard/hod/live", icon: <BarChart3 size={20} /> },
      { label: "Ideas", href: "/dashboard/hod/ideas", icon: <Lightbulb size={20} /> },
      { label: "Announcements", href: "/dashboard/hod/announcements", icon: <Megaphone size={20} /> },
    ],
    config: [
      { label: "Profile", href: "/profile", icon: <User size={20} /> },
      { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
    ],
  },
  worker: {
    main: [
      { label: "Dashboard", href: "/dashboard/worker", icon: <LayoutDashboard size={20} /> },
      { label: "Active Tasks", href: "/dashboard/worker/tasks", icon: <ClipboardList size={20} /> },
      { label: "Completed", href: "/dashboard/worker/completed", icon: <Settings size={20} /> },
      { label: "Quotations", href: "/dashboard/worker/quotations", icon: <FileText size={20} /> },
    ],
    config: [
      { label: "Profile", href: "/profile", icon: <User size={20} /> },
      { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
    ],
  },
};

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const sections = roleNavItems[profile.role] || { main: [], config: [] };
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const roleLabel =
    profile.role === "hod" ? "HOD" :
    profile.role === "admin" ? "Admin" :
    profile.role === "worker" ? "Worker" :
    "Student";

  return (
    <aside className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
          onClick={onClose}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            CO
          </div>
          <span className="text-[17px] font-bold tracking-tight text-sidebar-foreground">
            CampusOps
          </span>
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="mx-4 mb-2 rounded-xl bg-sidebar-accent/60 p-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800 shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {profile.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 pt-4">
        {/* Main Menu */}
        <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
          Main Menu
        </div>
        <nav className="flex flex-col gap-0.5 mb-6">
          {sections.main.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-indigo-500/15"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Configuration */}
        <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
          Settings
        </div>
        <nav className="flex flex-col gap-0.5">
          {sections.config.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-indigo-500/15"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sign Out */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 h-10"
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
