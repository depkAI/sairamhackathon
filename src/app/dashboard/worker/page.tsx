"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, updateTask, updateComplaint, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Clock, Upload, FileText, AlertTriangle } from "lucide-react";

function getTimeRemaining(deadline: Date): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "OVERDUE";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const tasks = useTasks(profile ? { field: "workerId", value: profile.uid } : undefined);
  const [quotationModal, setQuotationModal] = useState<string | null>(null);
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationNote, setQuotationNote] = useState("");
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const acceptTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: true, status: "accepted" });
      if (task) await updateComplaint(task.complaintId, { status: "in_progress" });
      toast.success("Task accepted!");
    } catch { toast.error("Action failed"); }
  };

  const rejectTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: false, status: "rejected" });
      if (task) await updateComplaint(task.complaintId, { status: "reviewed", assignedTo: undefined, assignedToName: undefined });
      await addNotification("demo-admin", "Task Rejected", `${profile?.name} rejected: ${task?.complaintTitle}. Needs reassignment.`, "/dashboard/admin");
      toast.success("Task rejected");
    } catch { toast.error("Action failed"); }
  };

  const submitQuotation = async () => {
    if (!quotationModal || !quotationAmount) return;
    const task = tasks.find((t) => t.id === quotationModal);
    try {
      await updateTask(quotationModal, { quotationAmount: parseFloat(quotationAmount), quotationNote, status: "quotation_submitted" });
      if (task) await updateComplaint(task.complaintId, { status: "quotation_submitted" });
      await addNotification("demo-admin", "Quotation Submitted", `${profile?.name} submitted ₹${quotationAmount} for "${task?.complaintTitle}"`, "/dashboard/admin");
      toast.success("Quotation submitted!");
      setQuotationModal(null);
      setQuotationAmount("");
      setQuotationNote("");
    } catch { toast.error("Submission failed"); }
  };

  const submitCompletion = async () => {
    if (!completionModal) return;
    setLoading(true);
    const task = tasks.find((t) => t.id === completionModal);
    try {
      // In demo mode, skip file upload
      await updateTask(completionModal, { status: "completed", completionProof: [], notes: completionNotes });
      if (task) await updateComplaint(task.complaintId, { status: "completed" });
      await addNotification("demo-admin", "Task Completed", `${profile?.name} completed: "${task?.complaintTitle}". Needs verification.`, "/dashboard/admin");
      toast.success("Completion submitted!");
      setCompletionModal(null);
      setCompletionNotes("");
      setProofFiles([]);
    } catch { toast.error("Submission failed"); }
    finally { setLoading(false); }
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "rejected");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
              <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Active</div>
              <div className="text-3xl font-bold text-yellow-600">{activeTasks.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
            </div>
          </div>

          <h2 className="font-semibold text-lg mb-4 text-gray-900">Active Tasks</h2>
          <div className="space-y-4 mb-8">
            {activeTasks.length === 0 && <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-500">No active tasks.</div>}
            {activeTasks.map((t) => {
              const timeLeft = getTimeRemaining(t.deadline);
              const isOverdue = timeLeft === "OVERDUE";
              return (
                <div key={t.id} className={`bg-white rounded-xl shadow-sm border p-5 ${isOverdue ? "border-red-200 bg-red-50/50" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{t.complaintTitle}</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          t.status === "assigned" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                          t.status === "accepted" ? "bg-green-100 text-green-700 border-green-200" :
                          t.status === "in_progress" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                          t.status === "quotation_submitted" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>{t.status.replace(/_/g, " ")}</span>
                        <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600 font-bold" : "text-gray-500"}`}>
                          {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}{timeLeft}
                        </span>
                      </div>
                      {t.quotationApproved === false && t.status === "assigned" && (
                        <div className="text-xs text-red-600 mb-2">Quotation was rejected. Please revise.</div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-wrap justify-end">
                      {t.status === "assigned" && t.accepted === null && (
                        <>
                          <button onClick={() => acceptTask(t.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><CheckCircle2 size={18} /></button>
                          <button onClick={() => rejectTask(t.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><XCircle size={18} /></button>
                        </>
                      )}
                      {(t.status === "accepted" || t.status === "in_progress" || (t.status === "assigned" && t.quotationApproved === false)) && (
                        <button onClick={() => setQuotationModal(t.id)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm">
                          <FileText size={14} /> Quotation
                        </button>
                      )}
                      {(t.status === "accepted" || t.status === "in_progress" || t.quotationApproved === true) && (
                        <button onClick={() => setCompletionModal(t.id)} className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm">
                          <Upload size={14} /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {completedTasks.length > 0 && (
            <>
              <h2 className="font-semibold text-lg mb-4 text-gray-900">Completed Tasks</h2>
              <div className="space-y-3">
                {completedTasks.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 opacity-80">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500" />
                      <span className="font-medium text-gray-800">{t.complaintTitle}</span>
                      {t.notes && <span className="text-xs text-gray-400">— {t.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {quotationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Submit Quotation</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={quotationAmount} onChange={(e) => setQuotationAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea rows={2} value={quotationNote} onChange={(e) => setQuotationNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Materials needed, etc." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setQuotationModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                  <button onClick={submitQuotation} disabled={!quotationAmount} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">Submit</button>
                </div>
              </div>
            </div>
          )}

          {completionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Submit Completion</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proof (photos)</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => setProofFiles(Array.from(e.target.files || []))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="What was done..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCompletionModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                  <button onClick={submitCompletion} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">{loading ? "Uploading..." : "Submit"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
