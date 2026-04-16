"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import toast from "react-hot-toast";
import { GraduationCap, Shield, Wrench, Eye, EyeOff } from "lucide-react";

type RoleTab = "student" | "staff" | "worker";

const roleTabs: { key: RoleTab; label: string; icon: React.ReactNode; idLabel: string; idPlaceholder: string; pwLabel: string; pwPlaceholder: string }[] = [
  { key: "student", label: "Student", icon: <GraduationCap size={18} />, idLabel: "Roll Number", idPlaceholder: "e.g. 22CSE101", pwLabel: "Date of Birth", pwPlaceholder: "DD-MM-YYYY" },
  { key: "staff", label: "Staff / Admin", icon: <Shield size={18} />, idLabel: "Staff ID", idPlaceholder: "e.g. STAFF001", pwLabel: "Date of Birth", pwPlaceholder: "DD-MM-YYYY" },
  { key: "worker", label: "Worker", icon: <Wrench size={18} />, idLabel: "Username", idPlaceholder: "e.g. rajesh@electrician", pwLabel: "Date of Birth", pwPlaceholder: "DD-MM-YYYY" },
];

const demoByRole: Record<RoleTab, typeof DEMO_CREDENTIALS> = {
  student: DEMO_CREDENTIALS.filter((c) => c.role === "student"),
  staff: DEMO_CREDENTIALS.filter((c) => c.role === "hod" || c.role === "admin"),
  worker: DEMO_CREDENTIALS.filter((c) => c.role === "worker"),
};

export default function LoginPage() {
  const { login, isDemoMode } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoleTab>("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentTab = roleTabs.find((t) => t.key === activeTab)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await login(loginId, password);
      toast.success(`Welcome, ${profile.name}!`);
      if (profile.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(`/dashboard/${profile.role}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (id: string, pw: string) => {
    setLoginId(id);
    setPassword(pw);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", padding: "16px" }}>
      <div style={{ maxWidth: 440, width: "100%", backgroundColor: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, backgroundColor: "#3b82f6", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 12 }}>
            CO
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>CampusOps</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Smart Campus Issue Reporter</p>
        </div>

        {/* Role Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoginId(""); setPassword(""); }}
              style={{
                flex: 1,
                padding: "14px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                backgroundColor: activeTab === tab.key ? "#fff" : "#f8fafc",
                color: activeTab === tab.key ? "#2563eb" : "#64748b",
                borderBottom: activeTab === tab.key ? "2px solid #2563eb" : "2px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {currentTab.idLabel}
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={currentTab.idPlaceholder}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {currentTab.pwLabel}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={currentTab.pwPlaceholder}
                style={{ width: "100%", padding: "10px 42px 10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials */}
        {isDemoMode && (
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                Demo Accounts — Click to fill
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {demoByRole[activeTab].map((acc) => (
                  <button
                    key={acc.loginId}
                    onClick={() => fillCredentials(acc.loginId, acc.plainPassword)}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "#fff",
                      border: "1px solid #dbeafe",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13,
                      width: "100%",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{acc.loginId}</span>
                      <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 12 }}>{acc.label}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, backgroundColor: "#dbeafe", color: "#1d4ed8", fontWeight: 500, textTransform: "capitalize" }}>
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#60a5fa", margin: "8px 0 0", textAlign: "center" }}>
                Passwords are Date of Birth (DD-MM-YYYY)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
