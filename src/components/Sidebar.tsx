"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
  KeyRound,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard size={18} /> },
    { label: "Report Issue", href: "/dashboard/student/new-complaint", icon: <PlusCircle size={18} /> },
    { label: "Profile", href: "/profile", icon: <User size={18} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={18} /> },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Profile", href: "/profile", icon: <User size={18} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={18} /> },
  ],
  hod: [
    { label: "Dashboard", href: "/dashboard/hod", icon: <LayoutDashboard size={18} /> },
    { label: "Profile", href: "/profile", icon: <User size={18} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={18} /> },
  ],
  worker: [
    { label: "Dashboard", href: "/dashboard/worker", icon: <LayoutDashboard size={18} /> },
    { label: "Profile", href: "/profile", icon: <User size={18} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={18} /> },
  ],
};

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const navItems = roleNavItems[profile.role] || [];
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const roleLabel =
    profile.role === "hod" ? "HOD" :
    profile.role === "admin" ? "Admin" :
    profile.role === "worker" ? `Worker` :
    "Student";

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <Link
          href={`/dashboard/${profile.role}`}
          className="flex items-center gap-3 no-underline"
          onClick={onClose}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs">
            CO
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            CampusOps
          </span>
        </Link>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Menu
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.name}</p>
            <p className="text-[11px] text-sidebar-foreground/50">{roleLabel} &middot; {profile.loginId}</p>
          </div>
        </div>
        <Separator className="my-2 bg-sidebar-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
