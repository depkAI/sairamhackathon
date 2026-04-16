"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useFeedback, addFeedback } from "@/lib/useData";
import { Feedback } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";
import { Plus, MessageSquare, Star, Clock } from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(profile ? { field: "createdBy", value: profile.uid } : undefined);
  const feedbackList = useFeedback(profile ? { field: "studentId", value: profile.uid } : undefined);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  const existingFeedback: Record<string, Feedback> = {};
  feedbackList.forEach((f) => { existingFeedback[f.complaintId] = f; });

  const submitFeedback = async () => {
    if (!profile || !feedbackModal) return;
    try {
      await addFeedback({
        complaintId: feedbackModal,
        studentId: profile.uid,
        studentName: profile.name,
        rating,
        feedbackText,
        createdAt: new Date(),
      });
      toast.success("Feedback submitted!");
      setFeedbackModal(null);
      setRating(5);
      setFeedbackText("");
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  const pending = complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length;
  const resolved = complaints.filter((c) => ["completed", "verified"].includes(c.status)).length;

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
              <p className="text-gray-500 mt-1">Track your reported issues</p>
            </div>
            <Link href="/dashboard/student/new-complaint" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">
              <Plus size={18} /> Report Issue
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Total Complaints</div>
              <div className="text-3xl font-bold text-gray-900">{complaints.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">In Progress</div>
              <div className="text-3xl font-bold text-yellow-600">{pending}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Resolved</div>
              <div className="text-3xl font-bold text-green-600">{resolved}</div>
            </div>
          </div>

          <div className="space-y-4">
            {complaints.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                <MessageSquare className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No complaints yet. Click &quot;Report Issue&quot; to get started.</p>
              </div>
            )}
            {complaints.map((c) => (
              <Link key={c.id} href={`/dashboard/student/complaint/${c.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="capitalize">{c.category}</span>
                      <span>{c.location}</span>
                      <span>{c.department}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {(c.status === "completed" || c.status === "verified") && !existingFeedback[c.id] && (
                    <button onClick={(e) => { e.preventDefault(); setFeedbackModal(c.id); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 ml-4">
                      <Star size={16} /> Feedback
                    </button>
                  )}
                  {existingFeedback[c.id] && (
                    <div className="flex items-center gap-1 text-sm text-yellow-500 ml-4">
                      {Array.from({ length: existingFeedback[c.id].rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {feedbackModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Submit Feedback</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)}><Star size={28} className={n <= rating ? "text-yellow-400" : "text-gray-300"} fill={n <= rating ? "currentColor" : "none"} /></button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea rows={3} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="How was the resolution?" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setFeedbackModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                  <button onClick={submitFeedback} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
