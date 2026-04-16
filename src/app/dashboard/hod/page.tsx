"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, updateComplaint, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, BarChart3, Clock, AlertCircle } from "lucide-react";

export default function HODDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(profile ? { field: "department", value: profile.department } : undefined);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved">("all");

  const approveComplaint = async (id: string) => {
    const complaint = complaints.find((c) => c.id === id);
    try {
      await updateComplaint(id, { status: "reviewed" });
      if (complaint) await addNotification(complaint.createdBy, "Complaint Reviewed", `Your complaint "${complaint.title}" has been approved by HOD.`, "/dashboard/student");
      toast.success("Complaint approved!");
    } catch { toast.error("Action failed"); }
  };

  const rejectComplaint = async () => {
    if (!rejectModal) return;
    const complaint = complaints.find((c) => c.id === rejectModal);
    try {
      await updateComplaint(rejectModal, { status: "rejected", rejectionReason: rejectReason });
      if (complaint) await addNotification(complaint.createdBy, "Complaint Rejected", `"${complaint.title}" rejected. Reason: ${rejectReason}`, "/dashboard/student");
      toast.success("Complaint rejected");
      setRejectModal(null);
      setRejectReason("");
    } catch { toast.error("Action failed"); }
  };

  const filtered = complaints.filter((c) => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "reviewed") return c.status === "reviewed";
    if (filter === "resolved") return c.status === "completed" || c.status === "verified";
    return true;
  });

  const total = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const resolvedCount = complaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const critical = complaints.filter((c) => c.priority === "critical" && !["completed", "verified"].includes(c.status)).length;

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
            <p className="text-gray-500 mt-1">{profile?.department}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg"><BarChart3 className="text-blue-600" size={24} /></div>
              <div><div className="text-2xl font-bold text-gray-900">{total}</div><div className="text-gray-500 text-sm">Total</div></div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg"><Clock className="text-yellow-600" size={24} /></div>
              <div><div className="text-2xl font-bold text-gray-900">{pendingCount}</div><div className="text-gray-500 text-sm">Pending Review</div></div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg"><CheckCircle2 className="text-green-600" size={24} /></div>
              <div><div className="text-2xl font-bold text-gray-900">{resolvedCount}</div><div className="text-gray-500 text-sm">Resolved</div></div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg"><AlertCircle className="text-red-600" size={24} /></div>
              <div><div className="text-2xl font-bold text-gray-900">{critical}</div><div className="text-gray-500 text-sm">Critical</div></div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {(["all", "pending", "reviewed", "resolved"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition ${
                filter === f ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>{f} {f === "pending" ? `(${pendingCount})` : ""}</button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">No complaints in this category.</div>}
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{c.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>By: {c.createdByName}</span><span>{c.location}</span><span className="capitalize">{c.category}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    {c.rejectionReason && <div className="mt-2 text-sm text-red-600">Rejection: {c.rejectionReason}</div>}
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => approveComplaint(c.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Approve"><CheckCircle2 size={18} /></button>
                      <button onClick={() => setRejectModal(c.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Reject"><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {rejectModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Reject Complaint</h3>
                <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Reason for rejection..." />
                <div className="flex gap-3">
                  <button onClick={() => setRejectModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                  <button onClick={rejectComplaint} disabled={!rejectReason} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
