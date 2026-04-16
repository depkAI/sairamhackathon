"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useComplaints, updateTask, updateComplaint, addNotification, notifyRole } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileText,
  AlertTriangle,
  Timer,
  Wrench,
  Zap,
  ListChecks,
  Inbox,
  Camera,
  IndianRupee,
  ClipboardCheck,
  RefreshCw,
  MapPin,
  Building,
  Tag,
  Mic,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

function getTimeRemaining(deadline: Date): {
  text: string;
  percent: number;
  overdue: boolean;
} {
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

export default function WorkerActiveTasks() {
  const { profile } = useAuth();
  const tasks = useTasks(
    profile ? { field: "workerId", value: profile.uid } : undefined
  );
  const allComplaints = useComplaints();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [quotationModal, setQuotationModal] = useState<string | null>(null);
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationNote, setQuotationNote] = useState("");
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);
  const escalatedRef = useRef<Set<string>>(new Set());

  // Auto-refresh timer display every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-escalate: if accepted but not completed within deadline, mark as escalated
  useEffect(() => {
    const processEscalations = async () => {
      const overdue = tasks.filter(
        (t) =>
          (t.status === "accepted" || t.status === "in_progress") &&
          new Date(t.deadline) < new Date() &&
          !escalatedRef.current.has(t.id)
      );
      for (const t of overdue) {
        escalatedRef.current.add(t.id);
        try {
          await updateTask(t.id, { status: "escalated" });
          await updateComplaint(t.complaintId, {
            status: "escalated",
            escalatedAt: new Date(),
          });
          await notifyRole(
            "admin",
            "Task Auto-Escalated",
            `Task "${t.complaintTitle}" by ${t.workerName} missed the 48hr deadline.`,
            "/dashboard/admin"
          );
        } catch {
          /* already escalated */
        }
      }
    };
    processEscalations();
  }, [tasks]);

  const acceptTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: true, status: "accepted" });
      if (task)
        await updateComplaint(task.complaintId, { status: "in_progress" });
      toast.success("Task accepted! 48-hour timer started.");
    } catch {
      toast.error("Failed");
    }
  };

  const rejectTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    try {
      await updateTask(taskId, { accepted: false, status: "rejected" });
      if (task)
        await updateComplaint(task.complaintId, {
          status: "reviewed",
          assignedTo: undefined,
          assignedToName: undefined,
        });
      await notifyRole(
        "admin",
        "Task Rejected",
        `${profile?.name} rejected: ${task?.complaintTitle}`,
        "/dashboard/admin"
      );
      toast.success("Task rejected");
    } catch {
      toast.error("Failed");
    }
  };

  const submitQuotation = async () => {
    if (!quotationModal || !quotationAmount) return;
    const amount = parseFloat(quotationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    const task = tasks.find((t) => t.id === quotationModal);
    try {
      await updateTask(quotationModal, {
        quotationAmount: amount,
        quotationNote,
        status: "quotation_submitted",
      });
      if (task)
        await updateComplaint(task.complaintId, {
          status: "quotation_submitted",
        });
      await notifyRole(
        "admin",
        "Quotation Submitted",
        `${profile?.name} submitted ₹${quotationAmount} for "${task?.complaintTitle}"`,
        "/dashboard/admin"
      );
      toast.success("Quotation sent to admin!");
      setQuotationModal(null);
      setQuotationAmount("");
      setQuotationNote("");
    } catch {
      toast.error("Failed");
    }
  };

  const submitCompletion = async () => {
    if (!completionModal) return;
    setLoading(true);
    const task = tasks.find((t) => t.id === completionModal);
    try {
      await updateTask(completionModal, {
        status: "completed",
        completionProof: [],
        notes: completionNotes,
      });
      if (task)
        await updateComplaint(task.complaintId, { status: "completed" });
      await notifyRole(
        "admin",
        "Task Completed",
        `${profile?.name} completed: "${task?.complaintTitle}". Needs verification.`,
        "/dashboard/admin"
      );
      toast.success("Task submitted for verification!");
      setCompletionModal(null);
      setCompletionNotes("");
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = tasks.filter(
    (t) => !["completed", "rejected"].includes(t.status)
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const statusVariant = (status: string) => {
    switch (status) {
      case "assigned":
        return "outline";
      case "escalated":
        return "destructive";
      case "quotation_submitted":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8 px-2 sm:px-0 animate-fade-in">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Active Tasks
              </h1>
              <p className="text-muted-foreground">
                Manage your assigned maintenance work
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />
              Auto-refreshes every 60s
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MouseGlowCard className="relative overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in" glowColor="rgba(59,130,246,0.1)">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Tasks
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {tasks.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 icon-glow-blue flex items-center justify-center transition-shadow duration-300">
                    <ListChecks className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </MouseGlowCard>

            <MouseGlowCard className="relative overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in" glowColor="rgba(245,158,11,0.1)">
              <div className="p-6" style={{ animationDelay: "80ms" }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Active
                    </p>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {activeTasks.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 icon-glow-amber flex items-center justify-center transition-shadow duration-300">
                    <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            </MouseGlowCard>

            <MouseGlowCard className="relative overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100/50 dark:from-emerald-950/30 dark:to-green-900/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in" glowColor="rgba(16,185,129,0.1)">
              <div className="p-6" style={{ animationDelay: "160ms" }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {completedTasks.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 icon-glow-emerald flex items-center justify-center transition-shadow duration-300">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
            </MouseGlowCard>
          </div>

          <Separator />

          {/* Active Tasks Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Active Tasks
              </h2>
              {activeTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {activeTasks.length}
                </Badge>
              )}
            </div>

            {activeTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No active tasks
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    You have no pending work right now. New assignments will
                    appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeTasks.map((t) => {
                  const time = getTimeRemaining(t.deadline);
                  const isNewAssignment =
                    t.status === "assigned" && t.accepted === null;
                  const complaint = allComplaints.find((c) => c.id === t.complaintId);
                  const isExpanded = expandedTask === t.id;

                  return (
                    <Card
                      key={t.id}
                      className={`transition-all duration-200 hover:shadow-md ${
                        time.overdue
                          ? "border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10"
                          : isNewAssignment
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base leading-tight">
                                {t.complaintTitle}
                              </CardTitle>
                              {isNewAssignment && (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px] uppercase tracking-wider">
                                  New
                                </Badge>
                              )}
                            </div>
                            {complaint && (
                              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  <span className="capitalize">{complaint.category}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {complaint.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {complaint.department}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={statusVariant(t.status)}
                                className="capitalize text-[11px]"
                              >
                                {t.status.replace(/_/g, " ")}
                              </Badge>
                              {t.quotationApproved === false &&
                                t.status === "assigned" && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[11px]"
                                  >
                                    Quotation Rejected
                                  </Badge>
                                )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
                                onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    View Details
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {isNewAssignment && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  onClick={() => acceptTask(t.id)}
                                >
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => rejectTask(t.id)}
                                >
                                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {(t.status === "accepted" ||
                              t.status === "in_progress" ||
                              (t.status === "assigned" &&
                                t.quotationApproved === false)) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="shadow-sm"
                                onClick={() => setQuotationModal(t.id)}
                              >
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Quotation
                              </Button>
                            )}
                            {(t.status === "accepted" ||
                              t.status === "in_progress" ||
                              t.quotationApproved === true) &&
                              !time.overdue && (
                                <Button
                                  size="sm"
                                  className="shadow-sm"
                                  onClick={() => setCompletionModal(t.id)}
                                >
                                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                                  Complete
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        {/* Expandable Complaint Details */}
                        {isExpanded && complaint && (
                          <div className="rounded-xl border bg-muted/20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Description
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {complaint.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-background rounded-lg p-2.5 space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Tag className="h-3 w-3" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider">Category</span>
                                </div>
                                <p className="text-xs font-medium text-foreground capitalize">{complaint.category}</p>
                              </div>
                              <div className="bg-background rounded-lg p-2.5 space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider">Location</span>
                                </div>
                                <p className="text-xs font-medium text-foreground">{complaint.location}</p>
                              </div>
                              <div className="bg-background rounded-lg p-2.5 space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Building className="h-3 w-3" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider">Department</span>
                                </div>
                                <p className="text-xs font-medium text-foreground">{complaint.department}</p>
                              </div>
                              <div className="bg-background rounded-lg p-2.5 space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider">Reported</span>
                                </div>
                                <p className="text-xs font-medium text-foreground">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {complaint.attachments && complaint.attachments.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <Image className="h-3 w-3" />
                                  Photos ({complaint.attachments.length})
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  {complaint.attachments.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={url}
                                        alt={`Attachment ${i + 1}`}
                                        className="h-20 w-20 rounded-lg object-cover border hover:opacity-80 transition-opacity cursor-pointer"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {complaint.audioAttachment && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <Mic className="h-3 w-3" />
                                  Voice Note
                                </p>
                                <audio controls className="w-full h-8">
                                  <source src={complaint.audioAttachment} />
                                </audio>
                              </div>
                            )}

                            <p className="text-[11px] text-muted-foreground">
                              Reported by: <span className="font-medium text-foreground">{complaint.createdByName}</span>
                            </p>
                          </div>
                        )}
                        {/* 48-Hour Timer */}
                        <div
                          className={`rounded-xl border p-4 ${
                            time.overdue
                              ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                              : time.percent > 75
                              ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800"
                              : "bg-muted/30 border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {time.overdue ? (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Timer
                                  className={`h-4 w-4 ${
                                    time.percent > 75
                                      ? "text-amber-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              )}
                              <span
                                className={`text-sm font-semibold ${
                                  time.overdue
                                    ? "text-red-600 dark:text-red-400"
                                    : time.percent > 75
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-foreground"
                                }`}
                              >
                                {time.text}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-background border">
                              48h deadline
                            </span>
                          </div>
                          <Progress
                            value={time.percent}
                            className={`h-2.5 rounded-full ${
                              time.overdue
                                ? "[&>div]:bg-red-500"
                                : time.percent > 75
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-emerald-500"
                            }`}
                          />
                          {time.overdue && (
                            <Alert
                              variant="destructive"
                              className="mt-3 border-red-200 dark:border-red-800"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Auto-escalated to admin. This task will be
                                reassigned.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quotation Dialog */}
          <Dialog
            open={!!quotationModal}
            onOpenChange={(open) => !open && setQuotationModal(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Submit Quotation
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="quotation-amount">
                    Estimated Amount (INR)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
                    </span>
                    <Input
                      id="quotation-amount"
                      type="number"
                      min="1"
                      max="10000000"
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotation-notes">
                    Materials / Work Breakdown
                  </Label>
                  <Textarea
                    id="quotation-notes"
                    value={quotationNote}
                    onChange={(e) => setQuotationNote(e.target.value)}
                    placeholder="List materials needed, labor breakdown, and any special requirements..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setQuotationModal(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitQuotation} disabled={!quotationAmount}>
                  <FileText className="mr-1.5 h-4 w-4" />
                  Send to Admin
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Completion Dialog */}
          <Dialog
            open={!!completionModal}
            onOpenChange={(open) => !open && setCompletionModal(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  Submit Completion
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="completion-photos">
                    Completion Proof
                  </Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Upload photos of completed work
                    </p>
                    <Input
                      id="completion-photos"
                      type="file"
                      multiple
                      accept="image/*"
                      className="text-sm max-w-[250px] mx-auto"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completion-summary">Work Summary</Label>
                  <Textarea
                    id="completion-summary"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Describe what was done, any issues encountered, and materials used..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setCompletionModal(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitCompletion} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1.5 h-4 w-4" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
