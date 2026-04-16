"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard size={20} /> },
    { label: "Report Issue", href: "/dashboard/student/new-complaint", icon: <PlusCircle size={20} /> },
    { label: "Profile", href: "/profile", icon: <User size={20} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Profile", href: "/profile", icon: <User size={20} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
  ],
  hod: [
    { label: "Dashboard", href: "/dashboard/hod", icon: <LayoutDashboard size={20} /> },
    { label: "Profile", href: "/profile", icon: <User size={20} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
  ],
  worker: [
    { label: "Dashboard", href: "/dashboard/worker", icon: <LayoutDashboard size={20} /> },
    { label: "Profile", href: "/profile", icon: <User size={20} /> },
    { label: "Change Password", href: "/change-password", icon: <KeyRound size={20} /> },
  ],
};

const sidebarStyle: React.CSSProperties = {
  position: "fixed", left: 0, top: 0, height: "100vh", width: 256,
  backgroundColor: "#0f1a2e", color: "#ffffff",
  display: "flex", flexDirection: "column", zIndex: 40,
};

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const navItems = roleNavItems[profile.role] || [];
  const handleLogout = async () => { await logout(); router.push("/login"); };

  const roleLabel = profile.role === "hod" ? "HOD" : profile.role === "admin" ? "Admin" : profile.role === "worker" ? `Worker — ${profile.specialty || "General"}` : "Student";

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href={`/dashboard/${profile.role}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 36, height: 36, backgroundColor: "#3b82f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>CO</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "#ffffff" }}>CampusOps</span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <div style={{ padding: "0 12px", marginBottom: 8, fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Menu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8,
                fontSize: 14, fontWeight: 500, textDecoration: "none",
                backgroundColor: isActive ? "#2563eb" : "transparent",
                color: isActive ? "#ffffff" : "#d1d5db",
              }}>
                {item.icon}{item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px", marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, backgroundColor: "rgba(59,130,246,0.2)", color: "#60a5fa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{profile.loginId}</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{roleLabel}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <LogOut size={20} />Sign Out
        </button>
      </div>
    </aside>
  );
}
