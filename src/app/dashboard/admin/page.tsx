"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useTasks,
  useWorkers,
  useFeedback,
  updateComplaint,
  updateTask,
  addTask,
  addNotification,
  useIdeas,
  updateIdea,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  UserCheck,
  XCircle,
  Star,
  TrendingUp,
  FileText,
  Wrench,
  MapPin,
  Building,
  Activity,
  Timer,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Shield,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();
  const feedback = useFeedback();
  const ideas = useIdeas();
  const hodApprovedIdeas = ideas.filter((i) => i.status === "approved_by_hod");
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [showAllComplaints, setShowAllComplaints] = useState(false);

  const filteredComplaints = filterMonth === "all" ? complaints : complaints.filter((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === filterMonth;
  });
  const monthOptions = Array.from(new Set(complaints.map((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort().reverse();

  const total = filteredComplaints.length;
  const solved = filteredComplaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const unsolved = filteredComplaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length;
  const rejected = filteredComplaints.filter((c) => c.status === "rejected").length;
  const delayed = tasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;
  const resolutionPct = total > 0 ? Math.round((solved / total) * 100) : 0;

  // Department breakdown
  const deptCounts: Record<string, { total: number; solved: number; unsolved: number }> = {};
  filteredComplaints.forEach((c) => {
    if (!deptCounts[c.department]) deptCounts[c.department] = { total: 0, solved: 0, unsolved: 0 };
    deptCounts[c.department].total++;
    if (c.status === "completed" || c.status === "verified") deptCounts[c.department].solved++;
    else if (c.status !== "rejected") deptCounts[c.department].unsolved++;
  });

  // Category breakdown
  const catCounts: Record<string, { total: number; solved: number }> = {};
  filteredComplaints.forEach((c) => {
    if (!catCounts[c.category]) catCounts[c.category] = { total: 0, solved: 0 };
    catCounts[c.category].total++;
    if (c.status === "completed" || c.status === "verified") catCounts[c.category].solved++;
  });

  // Worker stats
  const workerStats = workers.map((w) => {
    const wTasks = tasks.filter((t) => t.workerId === w.uid);
    const done = wTasks.filter((t) => t.status === "completed").length;
    const wFeedback = feedback.filter((f) => wTasks.some((t) => t.complaintId === f.complaintId));
    const avg = wFeedback.length > 0 ? wFeedback.reduce((s, f) => s + f.rating, 0) / wFeedback.length : 0;
    const overdue = wTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
    return { ...w, completed: done, totalTasks: wTasks.length, avgRating: avg, overdue };
  });

  // Recent / active
  const recentComplaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const quotationTasks = tasks.filter((t) => t.status === "quotation_submitted");
  const completedTasks = tasks.filter((t) => {
    const comp = complaints.find((c) => c.id === t.complaintId);
    return t.status === "completed" && comp?.status === "completed";
  });

  // Actions
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
        complaintId: assignModal, complaintTitle: complaint.title, workerId: selectedWorker,
        workerName: worker.name, accepted: null, deadline, status: "assigned",
        completionProof: [], createdAt: new Date(), updatedAt: new Date(),
      });
      await addNotification(selectedWorker, "New Task Assigned", `You have been assigned: ${complaint.title}`, "/dashboard/worker");
      await addNotification(complaint.createdBy, "Complaint Update", `"${complaint.title}" assigned to ${worker.name}`, "/dashboard/student");
      toast.success("Worker assigned!");
      setAssignModal(null);
      setSelectedWorker("");
    } catch { toast.error("Failed"); }
  };

  const handleQuotation = async (taskId: string, approved: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
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

  const kpiCards = [
    { label: "Total Complaints", value: total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", glow: "icon-glow-blue", change: total > 0 ? `+${total}` : "0", up: true },
    { label: "Resolved", value: solved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", glow: "icon-glow-emerald", change: `${resolutionPct}%`, up: true },
    { label: "In Progress", value: unsolved, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", glow: "icon-glow-amber", change: `${unsolved}`, up: false },
    { label: "Workers", value: workers.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", glow: "icon-glow-indigo", change: `${workers.length} active`, up: true },
    { label: "Overdue", value: delayed, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", glow: "icon-glow-red", change: delayed > 0 ? `${delayed} tasks` : "None", up: false },
  ];

  const displayedComplaints = showAllComplaints ? recentComplaints : recentComplaints.slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

          {/* ── Row 1: KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {kpiCards.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <MouseGlowCard
                  key={kpi.label}
                  className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in"
                >
                  <div className="p-5" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                      <div className={`h-9 w-9 rounded-xl ${kpi.bg} ${kpi.glow} flex items-center justify-center transition-shadow duration-300`}>
                        <Icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {kpi.up ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <span className={`text-xs font-medium ${kpi.up ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                </MouseGlowCard>
              );
            })}
          </div>

          {/* ── Row 2: Resolution Chart + Category Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resolution Progress (2/3 width) */}
            <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Resolution Progress</CardTitle>
                    <CardDescription className="text-sm mt-0.5">{solved} resolved of {total} total complaints</CardDescription>
                  </div>
                  <Select value={filterMonth} onValueChange={(v) => { if (v) setFilterMonth(v); }}>
                    <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      {monthOptions.map((m) => {
                        const [y, mo] = m.split("-");
                        const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                        return <SelectItem key={m} value={m}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Big percentage + bar */}
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-5xl font-bold tracking-tight text-foreground">{resolutionPct}%</p>
                    <p className="text-sm text-muted-foreground mt-1">resolution rate</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Progress value={resolutionPct} className="h-3 rounded-full" />
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Solved <span className="font-semibold text-foreground">{solved}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">In Progress <span className="font-semibold text-foreground">{inProgress}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="text-muted-foreground">Pending <span className="font-semibold text-foreground">{pending}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Rejected <span className="font-semibold text-foreground">{rejected}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini stat cards row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Avg Response", value: "<2hr", icon: Timer, bg: "bg-blue-50 dark:bg-blue-950/20" },
                    { label: "Active Workers", value: workers.length, icon: Users, bg: "bg-indigo-50 dark:bg-indigo-950/20" },
                    { label: "Quotations", value: quotationTasks.length, icon: FileText, bg: "bg-amber-50 dark:bg-amber-950/20" },
                    { label: "Verify Queue", value: completedTasks.length, icon: Shield, bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                  ].map((s) => {
                    const SIcon = s.icon;
                    return (
                      <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                        <SIcon className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown (1/3 width) */}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" /> Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(catCounts).length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">No data yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(catCounts).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => {
                      const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium capitalize text-foreground">{cat}</span>
                            <span className="text-muted-foreground font-mono text-xs">{d.total} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 3: Action Items (Quotations + Verifications) ── */}
          {(quotationTasks.length > 0 || completedTasks.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Quotations */}
              {quotationTasks.length > 0 && (
                <Card className="rounded-2xl border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Quotation Approvals</CardTitle>
                        <CardDescription className="text-xs">{quotationTasks.length} awaiting review</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quotationTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{t.complaintTitle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.workerName} &middot; ₹{t.quotationAmount}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg" onClick={() => handleQuotation(t.id, true)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" onClick={() => handleQuotation(t.id, false)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Pending Verification */}
              {completedTasks.length > 0 && (
                <Card className="rounded-2xl border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Pending Verification</CardTitle>
                        <CardDescription className="text-xs">{completedTasks.length} awaiting verification</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {completedTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{t.complaintTitle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.workerName}</p>
                        </div>
                        <Button size="sm" className="h-7 text-xs rounded-lg px-3" onClick={() => verifyCompletion(t.id, t.complaintId)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Row 4: Department Breakdown + Worker Performance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" /> Department Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-4">
                    {Object.entries(deptCounts).sort((a, b) => b[1].total - a[1].total).map(([dept, d]) => {
                      const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium text-foreground">{dept}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-600 font-medium">{d.solved} solved</span>
                              <span className="text-xs text-muted-foreground">{d.unsolved} open</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(deptCounts).length === 0 && (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <Building className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">No department data yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Worker Performance */}
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Worker Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {workerStats.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No worker data</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Worker</TableHead>
                        <TableHead className="text-center text-xs">Tasks</TableHead>
                        <TableHead className="text-center text-xs">Done</TableHead>
                        <TableHead className="text-center text-xs">Rating</TableHead>
                        <TableHead className="text-center text-xs">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workerStats.map((w) => (
                        <TableRow key={w.uid}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{w.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{w.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{w.specialty || w.department}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{w.totalTasks}</TableCell>
                          <TableCell className="text-center text-sm text-emerald-600 font-medium">{w.completed}</TableCell>
                          <TableCell className="text-center">
                            {w.avgRating > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />{w.avgRating.toFixed(1)}
                              </span>
                            ) : <span className="text-muted-foreground text-sm">--</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={w.totalTasks > 0 && (w.completed / w.totalTasks) >= 0.7 ? "default" : "secondary"} className="text-xs font-mono">
                              {w.totalTasks > 0 ? Math.round((w.completed / w.totalTasks) * 100) : 0}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 5: Ideas (if any HOD-approved) ── */}
          {hodApprovedIdeas.length > 0 && (
            <Card className="rounded-2xl border-border shadow-sm border-l-4 border-l-amber-400">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Ideas Awaiting Admin Approval</CardTitle>
                    <CardDescription className="text-xs">{hodApprovedIdeas.length} approved by HOD, need your review</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {hodApprovedIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground">{idea.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">by {idea.createdByName} &middot; {idea.department}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" onClick={async () => {
                        await updateIdea(idea.id, { status: "rejected", rejectionReason: "Not feasible at this time.", adminReviewedBy: profile?.uid, adminReviewedByName: profile?.name });
                        await addNotification(idea.createdBy, "Idea Rejected by Admin", `Your idea "${idea.title}" was not approved.`, "/dashboard/student/ideas");
                        toast.success("Rejected");
                      }}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={async () => {
                        await updateIdea(idea.id, { status: "approved_by_admin", adminReviewedBy: profile?.uid, adminReviewedByName: profile?.name });
                        await addNotification(idea.createdBy, "Idea Approved!", `Your idea "${idea.title}" has been approved!`, "/dashboard/student/ideas");
                        toast.success("Approved!");
                      }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Row 6: Recent Complaints Table ── */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Complaints</CardTitle>
                  <CardDescription className="text-sm">{complaints.length} total complaints</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAllComplaints(!showAllComplaints)}>
                  {showAllComplaints ? "Show Less" : "View All"} <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {complaints.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No complaints yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Complaint</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Priority</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedComplaints.map((c) => (
                      <TableRow key={c.id} className="group">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate max-w-[250px]">{c.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{c.location}
                              {c.assignedToName && <><span className="mx-1">&middot;</span><UserCheck className="h-3 w-3" />{c.assignedToName}</>}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{c.department}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-xs capitalize">{c.priority}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(c.status === "pending" || c.status === "reviewed") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setAssignModal(c.id)}>
                              Assign
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Assign Worker Dialog ── */}
          <Dialog open={!!assignModal} onOpenChange={(open) => { if (!open) { setAssignModal(null); setSelectedWorker(""); } }}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Assign Worker</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedWorker} onValueChange={(v) => setSelectedWorker(v ?? "")}>
                  <SelectTrigger className="w-full h-10 text-sm rounded-lg">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.uid} value={w.uid} className="text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{w.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {w.name} ({w.specialty || w.department})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { setAssignModal(null); setSelectedWorker(""); }} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button onClick={assignWorker} disabled={!selectedWorker} className="h-9 text-sm rounded-lg">
                  <Users className="h-4 w-4 mr-1.5" /> Assign Worker
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
