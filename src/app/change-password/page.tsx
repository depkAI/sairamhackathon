"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const { profile, changePassword } = useAuth();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      toast.error("New password must be different from current password.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password changed successfully!");
      router.push(`/dashboard/${profile?.role || "student"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", padding: 16 }}>
      <div style={{ maxWidth: 440, width: "100%", backgroundColor: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, backgroundColor: "#f59e0b", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Lock size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Change Password</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
            {profile?.mustChangePassword
              ? "You must change your password before continuing."
              : "Update your account password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {profile && (
            <div style={{ marginBottom: 16, padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#475569" }}>
              Logged in as <strong>{profile.loginId}</strong> ({profile.name})
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input type={showOld ? "text" : "password"} required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                style={{ width: "100%", padding: "10px 42px 10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button type="button" onClick={() => setShowOld(!showOld)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input type={showNew ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: "100%", padding: "10px 42px 10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button type="button" onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 12, backgroundColor: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Updating..." : "Change Password"}
          </button>

          {!profile?.mustChangePassword && (
            <button type="button" onClick={() => router.back()}
              style={{ width: "100%", padding: 12, backgroundColor: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
