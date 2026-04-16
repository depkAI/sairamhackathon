"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useTasks, useWorkers, useFeedback, updateComplaint, updateTask, addTask, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import {
  BarChart3, CheckCircle2, Clock, AlertCircle, Users, UserCheck, XCircle,
  Star, TrendingUp, FileText, Zap, Wrench, MapPin, Building,
  Activity, ArrowUpRight, ArrowDownRight, Timer,
} from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();
  const feedback = useFeedback();
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [tab, setTab] = useState<"overview" | "complaints" | "tasks" | "analytics" | "live">("overview");

  // --- Counts ---
  const total = complaints.length;
  const solved = complaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const unsolved = complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length;
  const rejected = complaints.filter((c) => c.status === "rejected").length;
  const delayed = tasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;

  // --- Department wise ---
  const deptCounts: Record<string, { total: number; solved: number; unsolved: number }> = {};
  complaints.forEach((c) => {
    if (!deptCounts[c.department]) deptCounts[c.department] = { total: 0, solved: 0, unsolved: 0 };
    deptCounts[c.department].total++;
    if (c.status === "completed" || c.status === "verified") deptCounts[c.department].solved++;
    else if (c.status !== "rejected") deptCounts[c.department].unsolved++;
  });

  // --- Work/Category specific ---
  const catCounts: Record<string, { total: number; solved: number }> = {};
  complaints.forEach((c) => {
    if (!catCounts[c.category]) catCounts[c.category] = { total: 0, solved: 0 };
    catCounts[c.category].total++;
    if (c.status === "completed" || c.status === "verified") catCounts[c.category].solved++;
  });

  // --- Worker performance ---
  const workerStats = workers.map((w) => {
    const wTasks = tasks.filter((t) => t.workerId === w.uid);
    const done = wTasks.filter((t) => t.status === "completed").length;
    const wFeedback = feedback.filter((f) => wTasks.some((t) => t.complaintId === f.complaintId));
    const avg = wFeedback.length > 0 ? wFeedback.reduce((s, f) => s + f.rating, 0) / wFeedback.length : 0;
    const overdue = wTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
    return { ...w, completed: done, totalTasks: wTasks.length, avgRating: avg, overdue };
  });

  // --- Live tracking: active complaints ---
  const liveComplaints = complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const quotationTasks = tasks.filter((t) => t.status === "quotation_submitted");
  const completedTasks = tasks.filter((t) => {
    const comp = complaints.find((c) => c.id === t.complaintId);
    return t.status === "completed" && comp?.status === "completed";
  });

  const assignWorker = async () => {
    if (!assignModal || !selectedWorker || !profile) return;
    const worker = workers.find((w) => w.uid === selectedWorker);
    const complaint = complaints.find((c) => c.id === assignModal);
    if (!worker || !complaint) return;
    try {
      await updateComplaint(assignModal, { status: "assigned", assignedTo: selectedWorker, assignedToName: worker.name });
      const deadline = new Date(); deadline.setHours(deadline.getHours() + 48);
      await addTask({ complaintId: assignModal, complaintTitle: complaint.title, workerId: selectedWorker, workerName: worker.name, accepted: null, deadline, status: "assigned", completionProof: [], createdAt: new Date(), updatedAt: new Date() });
      await addNotification(selectedWorker, "New Task Assigned", `You have been assigned: ${complaint.title}`, "/dashboard/worker");
      await addNotification(complaint.createdBy, "Complaint Update", `"${complaint.title}" assigned to ${worker.name}`, "/dashboard/student");
      toast.success("Worker assigned!");
      setAssignModal(null); setSelectedWorker("");
    } catch { toast.error("Failed"); }
  };

  const handleQuotation = async (taskId: string, approved: boolean) => {
    const task = tasks.find((t) => t.id === taskId); if (!task) return;
    try {
      await updateTask(taskId, { quotationApproved: approved, status: approved ? "in_progress" : "assigned" });
      if (approved) await updateComplaint(task.complaintId, { status: "quotation_approved" });
      await addNotification(task.workerId, approved ? "Quotation Approved" : "Quotation Rejected", `Quotation for "${task.complaintTitle}" ${approved ? "approved" : "rejected"}.`, "/dashboard/worker");
      toast.success(approved ? "Approved" : "Rejected");
    } catch { toast.error("Failed"); }
  };

  const verifyCompletion = async (taskId: string, complaintId: string) => {
    try {
      await updateComplaint(complaintId, { status: "verified" });
      await updateTask(taskId, { status: "completed" });
      const c = complaints.find((x) => x.id === complaintId);
      if (c) await addNotification(c.createdBy, "Complaint Resolved", `"${c.title}" resolved. Please provide feedback.`, "/dashboard/student");
      toast.success("Verified!");
    } catch { toast.error("Failed"); }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "complaints", label: "Complaints", icon: <FileText className="h-4 w-4" /> },
    { key: "tasks", label: "Tasks", icon: <Wrench className="h-4 w-4" /> },
    { key: "live", label: "Live Tracking", icon: <Activity className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> },
  ] as const;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System-wide overview and management</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="gap-1.5 whitespace-nowrap">
                {t.icon}{t.label}
              </Button>
            ))}
          </div>

          {/* ====== OVERVIEW ====== */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total", value: total, icon: <BarChart3 className="h-5 w-5" />, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
                  { label: "Solved", value: solved, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
                  { label: "Unsolved", value: unsolved, icon: <Clock className="h-5 w-5" />, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
                  { label: "Rejected", value: rejected, icon: <XCircle className="h-5 w-5" />, color: "text-red-600 bg-red-50", border: "border-l-red-500" },
                  { label: "Overdue", value: delayed, icon: <AlertCircle className="h-5 w-5" />, color: "text-orange-600 bg-orange-50", border: "border-l-orange-500" },
                ].map((s, i) => (
                  <Card key={i} className={`border-l-4 ${s.border} card-hover`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Solved vs Unsolved Bar */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Resolution Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{solved} solved of {total} total</span>
                    <span className="font-semibold text-foreground">{total > 0 ? Math.round((solved / total) * 100) : 0}%</span>
                  </div>
                  <Progress value={total > 0 ? (solved / total) * 100 : 0} className="h-3" />
                  <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Solved ({solved})</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> In Progress ({inProgress})</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /> Pending ({pending})</div>
                  </div>
                </CardContent>
              </Card>

              {/* Department & Category side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Wise */}
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building className="h-4 w-4 text-blue-500" /> Department Wise</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(deptCounts).sort((a, b) => b[1].total - a[1].total).map(([dept, d]) => (
                      <div key={dept}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground font-medium truncate">{dept}</span>
                          <div className="flex gap-2 shrink-0">
                            <Badge variant="secondary" className="text-[10px]">{d.solved} solved</Badge>
                            <Badge variant="outline" className="text-[10px]">{d.unsolved} open</Badge>
                          </div>
                        </div>
                        <Progress value={d.total > 0 ? (d.solved / d.total) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                    {Object.keys(deptCounts).length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>}
                  </CardContent>
                </Card>

                {/* Work/Category Specific */}
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-purple-500" /> Work Category Wise</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(catCounts).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground font-medium capitalize">{cat}</span>
                          <div className="flex gap-2 shrink-0">
                            <Badge variant="secondary" className="text-[10px]">{d.solved} solved</Badge>
                            <Badge variant="outline" className="text-[10px]">{d.total - d.solved} open</Badge>
                          </div>
                        </div>
                        <Progress value={d.total > 0 ? (d.solved / d.total) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quotation & Verification Actions */}
              {quotationTasks.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Pending Quotation Approvals ({quotationTasks.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {quotationTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div>
                          <p className="font-medium text-sm">{t.complaintTitle}</p>
                          <p className="text-xs text-muted-foreground">Worker: {t.workerName} · Amount: ₹{t.quotationAmount}</p>
                          {t.quotationNote && <p className="text-xs text-muted-foreground mt-0.5">Note: {t.quotationNote}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleQuotation(t.id, true)}><CheckCircle2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleQuotation(t.id, false)}><XCircle className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {completedTasks.length > 0 && (
                <Card className="border-emerald-200">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-500" /> Pending Verification ({completedTasks.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {completedTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div>
                          <p className="font-medium text-sm">{t.complaintTitle}</p>
                          <p className="text-xs text-muted-foreground">Worker: {t.workerName}</p>
                          {t.notes && <p className="text-xs text-muted-foreground mt-0.5">Notes: {t.notes}</p>}
                        </div>
                        <Button size="sm" onClick={() => verifyCompletion(t.id, t.complaintId)}>Verify</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ====== COMPLAINTS ====== */}
          {tab === "complaints" && (
            <div className="space-y-3">
              {complaints.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No complaints yet.</CardContent></Card>}
              {complaints.map((c) => (
                <Card key={c.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{c.title}</h3>
                          <StatusBadge status={c.status} />
                          <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{c.priority}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{c.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>By: {c.createdByName}</span>
                          <span className="flex items-center gap-1"><Building className="h-3 w-3" />{c.department}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                          <span className="capitalize flex items-center gap-1"><Wrench className="h-3 w-3" />{c.category}</span>
                          {c.assignedToName && <span className="flex items-center gap-1"><Users className="h-3 w-3" />Assigned: {c.assignedToName}</span>}
                        </div>
                      </div>
                      {(c.status === "pending" || c.status === "reviewed") && (
                        <Button size="sm" onClick={() => setAssignModal(c.id)} className="shrink-0"><Users className="mr-1 h-3.5 w-3.5" /> Assign</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ====== TASKS ====== */}
          {tab === "tasks" && (
            <div className="space-y-3">
              {tasks.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No tasks yet.</CardContent></Card>}
              {tasks.map((t) => {
                const isOverdue = new Date(t.deadline) < new Date() && t.status !== "completed";
                return (
                  <Card key={t.id} className={isOverdue ? "border-red-200" : ""}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{t.complaintTitle}</h3>
                            <Badge variant={t.status === "completed" ? "secondary" : "outline"} className="text-[10px] capitalize">{t.status.replace(/_/g, " ")}</Badge>
                            {isOverdue && <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Worker: {t.workerName}</span>
                            <span className="flex items-center gap-1"><Timer className="h-3 w-3" />Deadline: {new Date(t.deadline).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ====== LIVE TRACKING ====== */}
          {tab === "live" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500 animate-pulse" /> Active Issues ({liveComplaints.length})</CardTitle></CardHeader>
                <CardContent>
                  {liveComplaints.length === 0 && <p className="text-center py-8 text-muted-foreground">No active issues. All clear!</p>}
                  <div className="space-y-2">
                    {liveComplaints.map((c) => {
                      const task = tasks.find((t) => t.complaintId === c.id && t.status !== "rejected");
                      const isOverdue = task && new Date(task.deadline) < new Date() && task.status !== "completed";
                      return (
                        <div key={c.id} className={`p-4 rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/50" : "border-border"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm">{c.title}</span>
                                <StatusBadge status={c.status} />
                                {isOverdue && <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                <span><Building className="h-3 w-3 inline mr-1" />{c.department}</span>
                                <span><MapPin className="h-3 w-3 inline mr-1" />{c.location}</span>
                                <span className="capitalize"><Wrench className="h-3 w-3 inline mr-1" />{c.category}</span>
                                {c.assignedToName && <span><Users className="h-3 w-3 inline mr-1" />{c.assignedToName}</span>}
                                <span><Clock className="h-3 w-3 inline mr-1" />Updated {new Date(c.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                            {(c.status === "pending" || c.status === "reviewed") && (
                              <Button size="sm" variant="outline" onClick={() => setAssignModal(c.id)}>Assign</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ====== ANALYTICS ====== */}
          {tab === "analytics" && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total", val: total, color: "bg-blue-50 text-blue-700" },
                  { label: "Resolved", val: solved, color: "bg-emerald-50 text-emerald-700" },
                  { label: "Resolution Rate", val: `${total > 0 ? Math.round((solved / total) * 100) : 0}%`, color: "bg-amber-50 text-amber-700" },
                  { label: "Overdue", val: delayed, color: "bg-red-50 text-red-700" },
                ].map((s, i) => (
                  <div key={i} className={`text-center p-5 rounded-xl ${s.color}`}>
                    <div className="text-2xl font-bold">{s.val}</div>
                    <div className="text-xs mt-1 opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Worker Performance */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Worker Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Worker</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">Tasks</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">Done</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">Overdue</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">Rating</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">Rate</th>
                      </tr></thead>
                      <tbody>
                        {workerStats.map((w) => (
                          <tr key={w.uid} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-2"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">{w.name.charAt(0)}</div><div><div className="font-medium">{w.name}</div><div className="text-xs text-muted-foreground capitalize">{w.specialty || w.department}</div></div></div></td>
                            <td className="text-center py-3 px-2">{w.totalTasks}</td>
                            <td className="text-center py-3 px-2 text-emerald-600 font-medium">{w.completed}</td>
                            <td className="text-center py-3 px-2">{w.overdue > 0 ? <span className="text-red-600 font-medium">{w.overdue}</span> : "0"}</td>
                            <td className="text-center py-3 px-2">{w.avgRating > 0 ? <span className="flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{w.avgRating.toFixed(1)}</span> : "—"}</td>
                            <td className="text-center py-3 px-2 font-medium">{w.totalTasks > 0 ? Math.round((w.completed / w.totalTasks) * 100) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {(["critical", "high", "medium", "low"] as const).map((p) => {
                      const count = complaints.filter((c) => c.priority === p).length;
                      const colors = { critical: "bg-red-50 text-red-700 border-red-200", high: "bg-amber-50 text-amber-700 border-amber-200", medium: "bg-blue-50 text-blue-700 border-blue-200", low: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                      return (
                        <div key={p} className={`text-center p-4 rounded-xl border ${colors[p]}`}>
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs capitalize mt-1 opacity-70">{p}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assign Dialog */}
          <Dialog open={!!assignModal} onOpenChange={(open) => !open && setAssignModal(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Worker</DialogTitle></DialogHeader>
              <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} className="w-full px-3 py-2.5 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select a worker</option>
                {workers.map((w) => <option key={w.uid} value={w.uid}>{w.name} ({w.specialty || w.department})</option>)}
              </select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
                <Button onClick={assignWorker} disabled={!selectedWorker}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
