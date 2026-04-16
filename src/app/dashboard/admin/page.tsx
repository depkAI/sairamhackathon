"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useTasks, useWorkers, useFeedback, updateComplaint, updateTask, addTask, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import toast from "react-hot-toast";
import { useState } from "react";
import { BarChart3, CheckCircle2, Clock, AlertCircle, Users, UserCheck, XCircle, Star, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();
  const feedback = useFeedback();
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [tab, setTab] = useState<"overview" | "complaints" | "tasks" | "analytics">("overview");

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "pending" || c.status === "reviewed").length;
  const resolved = complaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const delayed = tasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;

  const deptCounts: Record<string, number> = {};
  complaints.forEach((c) => { deptCounts[c.department] = (deptCounts[c.department] || 0) + 1; });

  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  // Worker performance
  const workerStats = workers.map((w) => {
    const workerTasks = tasks.filter((t) => t.workerId === w.uid);
    const completed = workerTasks.filter((t) => t.status === "completed").length;
    const totalT = workerTasks.length;
    const workerFeedback = feedback.filter((f) => {
      const task = tasks.find((t) => t.complaintId === f.complaintId && t.workerId === w.uid);
      return !!task;
    });
    const avgRating = workerFeedback.length > 0
      ? workerFeedback.reduce((sum, f) => sum + f.rating, 0) / workerFeedback.length
      : 0;
    const overdue = workerTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
    return { ...w, completed, totalTasks: totalT, avgRating, overdue };
  });

  const assignWorker = async () => {
    if (!assignModal || !selectedWorker || !profile) return;
    const worker = workers.find((w) => w.uid === selectedWorker);
    const complaint = complaints.find((c) => c.id === assignModal);
    if (!worker || !complaint) return;

    try {
      await updateComplaint(assignModal, { status: "assigned", assignedTo: selectedWorker, assignedToName: worker.name });
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);
      await addTask({
        complaintId: assignModal,
        complaintTitle: complaint.title,
        workerId: selectedWorker,
        workerName: worker.name,
        accepted: null,
        deadline,
        status: "assigned",
        completionProof: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await addNotification(selectedWorker, "New Task Assigned", `You have been assigned: ${complaint.title}`, "/dashboard/worker");
      await addNotification(complaint.createdBy, "Complaint Update", `Your complaint "${complaint.title}" assigned to ${worker.name}`, "/dashboard/student");

      toast.success("Worker assigned!");
      setAssignModal(null);
      setSelectedWorker("");
    } catch { toast.error("Failed to assign worker"); }
  };

  const handleQuotation = async (taskId: string, approved: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTask(taskId, { quotationApproved: approved, status: approved ? "in_progress" : "assigned" });
      if (approved) await updateComplaint(task.complaintId, { status: "quotation_approved" });
      await addNotification(task.workerId, approved ? "Quotation Approved" : "Quotation Rejected",
        approved ? `Quotation for "${task.complaintTitle}" approved.` : `Quotation for "${task.complaintTitle}" rejected.`, "/dashboard/worker");
      toast.success(approved ? "Quotation approved" : "Quotation rejected");
    } catch { toast.error("Action failed"); }
  };

  const verifyCompletion = async (taskId: string, complaintId: string) => {
    try {
      await updateComplaint(complaintId, { status: "verified" });
      await updateTask(taskId, { status: "completed" });
      const complaint = complaints.find((c) => c.id === complaintId);
      if (complaint) await addNotification(complaint.createdBy, "Complaint Resolved", `"${complaint.title}" has been resolved. Please provide feedback.`, "/dashboard/student");
      toast.success("Completion verified!");
    } catch { toast.error("Verification failed"); }
  };

  const quotationTasks = tasks.filter((t) => t.status === "quotation_submitted");
  const completedTasks = tasks.filter((t) => {
    const complaint = complaints.find((c) => c.id === t.complaintId);
    return t.status === "completed" && complaint?.status === "completed";
  });

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(["overview", "complaints", "tasks", "analytics"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition whitespace-nowrap ${
                tab === t ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>{t}</button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg"><BarChart3 className="text-blue-600" size={24} /></div>
                  <div><div className="text-2xl font-bold text-gray-900">{total}</div><div className="text-gray-500 text-sm">Total</div></div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg"><Clock className="text-yellow-600" size={24} /></div>
                  <div><div className="text-2xl font-bold text-gray-900">{pending}</div><div className="text-gray-500 text-sm">Pending</div></div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg"><CheckCircle2 className="text-green-600" size={24} /></div>
                  <div><div className="text-2xl font-bold text-gray-900">{resolved}</div><div className="text-gray-500 text-sm">Resolved</div></div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-lg"><AlertCircle className="text-red-600" size={24} /></div>
                  <div><div className="text-2xl font-bold text-gray-900">{delayed}</div><div className="text-gray-500 text-sm">Delayed</div></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-900">Department Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / total) * 100}%` }} /></div>
                          <span className="text-sm font-medium w-8 text-right text-gray-700">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-900">Category Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{cat}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(count / total) * 100}%` }} /></div>
                          <span className="text-sm font-medium w-8 text-right text-gray-700">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {quotationTasks.length > 0 && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900"><AlertCircle size={18} className="text-yellow-500" /> Pending Quotation Approvals</h3>
                  <div className="space-y-3">
                    {quotationTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-800">{t.complaintTitle}</div>
                          <div className="text-xs text-gray-500">Worker: {t.workerName} | Amount: ₹{t.quotationAmount}</div>
                          {t.quotationNote && <div className="text-xs text-gray-500 mt-1">Note: {t.quotationNote}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleQuotation(t.id, true)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><CheckCircle2 size={18} /></button>
                          <button onClick={() => handleQuotation(t.id, false)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><XCircle size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900"><UserCheck size={18} className="text-green-500" /> Pending Verification</h3>
                  <div className="space-y-3">
                    {completedTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-800">{t.complaintTitle}</div>
                          <div className="text-xs text-gray-500">Worker: {t.workerName}</div>
                          {t.notes && <div className="text-xs text-gray-500">Notes: {t.notes}</div>}
                        </div>
                        <button onClick={() => verifyCompletion(t.id, t.complaintId)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 shadow-sm">Verify</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "complaints" && (
            <div className="space-y-4">
              {complaints.length === 0 && <p className="text-gray-500 text-center py-8">No complaints yet.</p>}
              {complaints.map((c) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{c.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        <span>By: {c.createdByName}</span><span>{c.department}</span><span>{c.location}</span><span className="capitalize">{c.category}</span>
                        {c.assignedToName && <span>Assigned: {c.assignedToName}</span>}
                      </div>
                    </div>
                    {(c.status === "pending" || c.status === "reviewed") && (
                      <button onClick={() => setAssignModal(c.id)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 ml-4 shadow-sm">
                        <Users size={14} /> Assign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-4">
              {tasks.length === 0 && <p className="text-gray-500 text-center py-8">No tasks assigned yet.</p>}
              {tasks.map((t) => {
                const isOverdue = new Date(t.deadline) < new Date() && t.status !== "completed";
                return (
                  <div key={t.id} className={`bg-white rounded-xl shadow-sm border p-5 ${isOverdue ? "border-red-200" : "border-gray-100"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{t.complaintTitle}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        t.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                        t.status === "in_progress" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>{t.status.replace(/_/g, " ")}</span>
                      {isOverdue && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">OVERDUE</span>}
                    </div>
                    <div className="text-sm text-gray-500">Worker: {t.workerName} | Deadline: {new Date(t.deadline).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "analytics" && (
            <div className="space-y-6">
              {/* Resolution Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Resolution Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{total}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Complaints</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{resolved}</div>
                    <div className="text-xs text-gray-500 mt-1">Resolved</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{total > 0 ? Math.round((resolved / total) * 100) : 0}%</div>
                    <div className="text-xs text-gray-500 mt-1">Resolution Rate</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{delayed}</div>
                    <div className="text-xs text-gray-500 mt-1">Overdue Tasks</div>
                  </div>
                </div>
              </div>

              {/* Worker Performance */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Worker Performance</h3>
                {workerStats.length === 0 ? (
                  <p className="text-gray-500 text-sm">No workers registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-2 font-medium text-gray-500">Worker</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">Tasks</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">Completed</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">Overdue</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">Avg Rating</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workerStats.map((w) => (
                          <tr key={w.uid} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">{w.name.charAt(0)}</div>
                                <div>
                                  <div className="font-medium text-gray-800">{w.name}</div>
                                  <div className="text-xs text-gray-400">{w.department}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2 text-gray-700">{w.totalTasks}</td>
                            <td className="text-center py-3 px-2"><span className="text-green-600 font-medium">{w.completed}</span></td>
                            <td className="text-center py-3 px-2">
                              {w.overdue > 0 ? <span className="text-red-600 font-medium">{w.overdue}</span> : <span className="text-gray-400">0</span>}
                            </td>
                            <td className="text-center py-3 px-2">
                              {w.avgRating > 0 ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                                  <span className="font-medium">{w.avgRating.toFixed(1)}</span>
                                </div>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`font-medium ${w.totalTasks > 0 && (w.completed / w.totalTasks) >= 0.7 ? "text-green-600" : "text-yellow-600"}`}>
                                {w.totalTasks > 0 ? Math.round((w.completed / w.totalTasks) * 100) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Priority Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Priority Distribution</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(["critical", "high", "medium", "low"] as const).map((p) => {
                    const count = complaints.filter((c) => c.priority === p).length;
                    const colors = { critical: "bg-red-500", high: "bg-yellow-500", medium: "bg-blue-500", low: "bg-green-500" };
                    return (
                      <div key={p} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${colors[p]}`} />
                          <span className="text-xs text-gray-500 capitalize">{p}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {assignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Assign Worker</h3>
                <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a worker</option>
                  {workers.map((w) => <option key={w.uid} value={w.uid}>{w.name} ({w.department})</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setAssignModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                  <button onClick={assignWorker} disabled={!selectedWorker} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">Assign</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
