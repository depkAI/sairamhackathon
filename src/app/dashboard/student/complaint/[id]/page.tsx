"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useTasks, useFeedback } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Building, Tag, Clock, User, Star, CheckCircle2 } from "lucide-react";

const statusSteps = [
  { key: "pending", label: "Submitted" },
  { key: "reviewed", label: "Reviewed by HOD" },
  { key: "assigned", label: "Worker Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "verified", label: "Verified" },
];

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const complaints = useComplaints(profile ? { field: "createdBy", value: profile.uid } : undefined);
  const allTasks = useTasks();
  const allFeedback = useFeedback();

  const complaint = complaints.find((c) => c.id === id);
  const task = allTasks.find((t) => t.complaintId === id);
  const feedback = allFeedback.find((f) => f.complaintId === id);

  if (!complaint) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-gray-500">Complaint not found.</p>
            <Link href="/dashboard/student" className="text-blue-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const currentStepIndex = complaint.status === "rejected"
    ? -1
    : statusSteps.findIndex((s) => s.key === complaint.status);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard/student" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{complaint.title}</h1>
                <StatusBadge status={complaint.status} />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                complaint.priority === "critical" ? "bg-red-100 text-red-700 border border-red-200" :
                complaint.priority === "high" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                complaint.priority === "medium" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                "bg-green-100 text-green-700 border border-green-200"
              }`}>
                {complaint.priority} priority
              </span>
            </div>

            <p className="text-gray-600 mb-6">{complaint.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Tag size={14} className="text-gray-400" />
                <span className="capitalize">{complaint.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={14} className="text-gray-400" />
                {complaint.location}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Building size={14} className="text-gray-400" />
                {complaint.department}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} className="text-gray-400" />
                {new Date(complaint.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {complaint.status !== "rejected" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
              <div className="space-y-4">
                {statusSteps.map((step, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "ring-2 ring-green-200" : ""}`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-medium">{i + 1}</span>}
                      </div>
                      <div className={`text-sm ${isCompleted ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {complaint.status === "rejected" && complaint.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h2 className="font-semibold text-red-800 mb-2">Complaint Rejected</h2>
              <p className="text-red-700 text-sm">{complaint.rejectionReason}</p>
            </div>
          )}

          {/* Assigned Worker */}
          {task && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Assigned Worker</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  {task.workerName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{task.workerName}</div>
                  <div className="text-xs text-gray-500">Deadline: {new Date(task.deadline).toLocaleString()}</div>
                </div>
              </div>
              {task.quotationAmount && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-500">Quotation:</span> <span className="font-medium text-gray-800">₹{task.quotationAmount}</span>
                  {task.quotationNote && <span className="text-gray-500 ml-2">— {task.quotationNote}</span>}
                </div>
              )}
              {task.notes && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                  <span className="text-gray-500">Completion Notes:</span> <span className="text-gray-700">{task.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Your Feedback</h2>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} className={i < feedback.rating ? "text-yellow-400" : "text-gray-300"} fill={i < feedback.rating ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="text-gray-600 text-sm">{feedback.feedbackText}</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
