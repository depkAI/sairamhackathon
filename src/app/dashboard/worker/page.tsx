"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, updateTask, updateComplaint, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Clock, Upload, FileText, AlertTriangle, Timer, Wrench, Zap } from "lucide-react";

function getTimeRemaining(deadline: Date): { text: string; percent: number; overdue: boolean } {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const total48h = 48 * 60 * 60 * 1000;
  const diff = dl - now;
  if (diff <= 0) return { text: "OVERDUE", percent: 100, overdue: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const elapsed = total48h - diff;
  const percent = Math.min(100, Math.max(0, (elapsed / total48h) * 100));
  return { text: `${hours}h ${minutes}m left`, percent, overdue: false };
}

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const tasks = useTasks(profile ? { field: "workerId", value: profile.uid } : undefined);
  const [quotationModal, setQuotationModal] = useState<string | null>(null);
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationNote, setQuotationNote] = useState("");
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  // Auto-refresh timer display every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-escalate: if accepted but not completed within deadline, mark as escalated
  useEffect(() => {
    tasks.forEach(async (t) => {
      if ((t.status === "accepted" || t.status === "in_progress") && new Date(t.deadline) < new Date()) {
        try {
          await updateTask(t.id, { status: "escalated" });
          await updateComplaint(t.complaintId, { status: "escalated", escalatedAt: new Date() });
          await addNotification("admin-001", "Task Auto-Escalated", `Task "${t.complaintTitle}" by ${t.workerName} missed the 48hr deadline.`, "/dashboard/admin");
        } catch { /* already escalated */ }
      }
    });
  }, [tasks]);

  const acceptTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: true, status: "accepted" });
      if (task) await updateComplaint(task.complaintId, { status: "in_progress" });
      toast.success("Task accepted! 48-hour timer started.");
    } catch { toast.error("Failed"); }
  };

  const rejectTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: false, status: "rejected" });
      if (task) await updateComplaint(task.complaintId, { status: "reviewed", assignedTo: undefined, assignedToName: undefined });
      await addNotification("admin-001", "Task Rejected", `${profile?.name} rejected: ${task?.complaintTitle}`, "/dashboard/admin");
      toast.success("Task rejected");
    } catch { toast.error("Failed"); }
  };

  const submitQuotation = async () => {
    if (!quotationModal || !quotationAmount) return;
    const task = tasks.find((t) => t.id === quotationModal);
    try {
      await updateTask(quotationModal, { quotationAmount: parseFloat(quotationAmount), quotationNote, status: "quotation_submitted" });
      if (task) await updateComplaint(task.complaintId, { status: "quotation_submitted" });
      await addNotification("admin-001", "Quotation Submitted", `${profile?.name} submitted ₹${quotationAmount} for "${task?.complaintTitle}"`, "/dashboard/admin");
      toast.success("Quotation sent to admin!");
      setQuotationModal(null); setQuotationAmount(""); setQuotationNote("");
    } catch { toast.error("Failed"); }
  };

  const submitCompletion = async () => {
    if (!completionModal) return;
    setLoading(true);
    const task = tasks.find((t) => t.id === completionModal);
    try {
      await updateTask(completionModal, { status: "completed", completionProof: [], notes: completionNotes });
      if (task) await updateComplaint(task.complaintId, { status: "completed" });
      await addNotification("admin-001", "Task Completed", `${profile?.name} completed: "${task?.complaintTitle}". Needs verification.`, "/dashboard/admin");
      toast.success("Task submitted for verification!");
      setCompletionModal(null); setCompletionNotes("");
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };

  const activeTasks = tasks.filter((t) => !["completed", "rejected"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage assigned maintenance work</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Tasks", value: tasks.length, icon: <Wrench className="h-5 w-5" />, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
              { label: "Active", value: activeTasks.length, icon: <Zap className="h-5 w-5" />, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
              { label: "Completed", value: completedTasks.length, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
            ].map((s, i) => (
              <Card key={i} className={`border-l-4 ${s.border} card-hover`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                  <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active Tasks */}
          <div>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Active Tasks</h2>
            <div className="space-y-3">
              {activeTasks.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No active tasks. Enjoy the break!</CardContent></Card>}
              {activeTasks.map((t) => {
                const time = getTimeRemaining(t.deadline);
                return (
                  <Card key={t.id} className={`card-hover ${time.overdue ? "border-red-200" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-2">{t.complaintTitle}</h3>

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant={
                              t.status === "assigned" ? "outline" :
                              t.status === "escalated" ? "destructive" :
                              t.status === "quotation_submitted" ? "secondary" : "default"
                            } className="text-[10px] capitalize">{t.status.replace(/_/g, " ")}</Badge>
                            {t.quotationApproved === false && t.status === "assigned" && (
                              <Badge variant="destructive" className="text-[10px]">Quotation Rejected</Badge>
                            )}
                          </div>

                          {/* 48hr Timer */}
                          <div className={`p-3 rounded-lg border ${time.overdue ? "bg-red-50 border-red-200" : "bg-muted/50"}`}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="flex items-center gap-1.5">
                                {time.overdue ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Timer className="h-4 w-4 text-muted-foreground" />}
                                <span className={time.overdue ? "text-red-600 font-bold" : "text-muted-foreground"}>
                                  {time.text}
                                </span>
                              </span>
                              <span className="text-xs text-muted-foreground">48hr limit</span>
                            </div>
                            <Progress value={time.percent} className={`h-2 ${time.overdue ? "[&>div]:bg-red-500" : ""}`} />
                            {time.overdue && (
                              <p className="text-xs text-red-600 mt-1.5 font-medium">⚠ Auto-escalated to admin. Task will be reassigned.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {t.status === "assigned" && t.accepted === null && (
                            <>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => acceptTask(t.id)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Accept</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => rejectTask(t.id)}><XCircle className="mr-1 h-3.5 w-3.5" /> Reject</Button>
                            </>
                          )}
                          {(t.status === "accepted" || t.status === "in_progress" || (t.status === "assigned" && t.quotationApproved === false)) && (
                            <Button size="sm" variant="outline" onClick={() => setQuotationModal(t.id)}>
                              <FileText className="mr-1 h-3.5 w-3.5" /> Quotation
                            </Button>
                          )}
                          {(t.status === "accepted" || t.status === "in_progress" || t.quotationApproved === true) && !time.overdue && (
                            <Button size="sm" onClick={() => setCompletionModal(t.id)}>
                              <Upload className="mr-1 h-3.5 w-3.5" /> Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Completed */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Completed ({completedTasks.length})</h2>
              <div className="space-y-2">
                {completedTasks.map((t) => (
                  <Card key={t.id} className="opacity-80">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">{t.complaintTitle}</span>
                        {t.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.notes}</p>}
                      </div>
                      {t.quotationAmount && <Badge variant="secondary" className="text-[10px] shrink-0">₹{t.quotationAmount}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quotation Dialog */}
          <Dialog open={!!quotationModal} onOpenChange={(open) => !open && setQuotationModal(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Quotation to Admin</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Estimated Amount (₹)</label>
                  <Input type="number" value={quotationAmount} onChange={(e) => setQuotationAmount(e.target.value)} placeholder="Enter amount" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Materials / Notes</label>
                  <Textarea value={quotationNote} onChange={(e) => setQuotationNote(e.target.value)} placeholder="Materials needed, work breakdown..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuotationModal(null)}>Cancel</Button>
                <Button onClick={submitQuotation} disabled={!quotationAmount}>Send to Admin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Completion Dialog */}
          <Dialog open={!!completionModal} onOpenChange={(open) => !open && setCompletionModal(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Task Completion</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Completion Proof (photos)</label>
                  <Input type="file" multiple accept="image/*" className="text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Work Summary</label>
                  <Textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Describe the work done..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCompletionModal(null)}>Cancel</Button>
                <Button onClick={submitCompletion} disabled={loading}>{loading ? "Submitting..." : "Submit for Verification"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
