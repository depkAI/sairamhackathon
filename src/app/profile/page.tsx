"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFeedback, useComplaints, useTasks } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { User, Mail, Phone, Building, Shield, Calendar, Star, BarChart3, Hash, Wrench } from "lucide-react";

export default function ProfilePage() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile?.role === "student" ? { field: "createdBy", value: profile.uid } : undefined
  );
  const tasks = useTasks(
    profile?.role === "worker" ? { field: "workerId", value: profile.uid } : undefined
  );
  const feedback = useFeedback();

  if (!profile) return null;

  const workerFeedback = feedback.filter((f) => {
    const task = tasks.find((t) => t.complaintId === f.complaintId);
    return !!task;
  });
  const avgRating = workerFeedback.length > 0
    ? workerFeedback.reduce((sum, f) => sum + f.rating, 0) / workerFeedback.length : 0;

  const roleLabel = profile.role === "hod" ? "HOD / Department Head" : profile.role === "admin" ? "Administrator" : profile.role === "worker" ? "Maintenance Worker" : "Student";

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>My Profile</h1>

          <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, backgroundColor: "#3b82f6", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24 }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>{profile.name}</h2>
                <span style={{ fontSize: 13, padding: "2px 10px", borderRadius: 12, backgroundColor: "#dbeafe", color: "#1d4ed8", fontWeight: 500 }}>{roleLabel}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                <Hash size={18} style={{ color: "#94a3b8" }} />
                <span><strong>Login ID:</strong> {profile.loginId}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                <Mail size={18} style={{ color: "#94a3b8" }} />
                <span>{profile.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                <Phone size={18} style={{ color: "#94a3b8" }} />
                <span>{profile.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                <Building size={18} style={{ color: "#94a3b8" }} />
                <span>{profile.department}</span>
              </div>
              {profile.specialty && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                  <Wrench size={18} style={{ color: "#94a3b8" }} />
                  <span style={{ textTransform: "capitalize" }}>{profile.specialty}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#475569", fontSize: 14 }}>
                <Calendar size={18} style={{ color: "#94a3b8" }} />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {profile.role === "student" && (
            <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={18} style={{ color: "#3b82f6" }} /> My Statistics
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#1d4ed8" }}>{complaints.length}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Total Reported</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{complaints.filter((c) => ["completed", "verified"].includes(c.status)).length}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Resolved</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#fefce8", borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#ca8a04" }}>{complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>In Progress</div>
                </div>
              </div>
            </div>
          )}

          {profile.role === "worker" && (
            <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={18} style={{ color: "#3b82f6" }} /> My Performance
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#1d4ed8" }}>{tasks.length}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Total</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>{tasks.filter((t) => t.status === "completed").length}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Done</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#fefce8", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#ca8a04" }}>
                    {tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Rate</div>
                </div>
                <div style={{ textAlign: "center", padding: 16, backgroundColor: "#faf5ff", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Star size={16} style={{ color: "#eab308" }} fill="#eab308" />
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#7c3aed" }}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Rating</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
