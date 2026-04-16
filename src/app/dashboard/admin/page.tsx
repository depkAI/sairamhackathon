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

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Alert } from "@/components/ui/alert";
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
  MoreVertical,
  Lightbulb,
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

  const filteredComplaints = filterMonth === "all" ? complaints : complaints.filter((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === filterMonth;
  });
  const monthOptions = Array.from(new Set(complaints.map((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort().reverse();

  const total = filteredComplaints.length;
  const solved = filteredComplaints.filter(
    (c) => c.status === "completed" || c.status === "verified"
  ).length;
  const unsolved = filteredComplaints.filter(
    (c) => !["completed", "verified", "rejected"].includes(c.status)
  ).length;
  const rejected = filteredComplaints.filter((c) => c.status === "rejected").length;
  const delayed = tasks.filter(
    (t) => t.status !== "completed" && new Date(t.deadline) < new Date()
  ).length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;

  const deptCounts: Record<string, { total: number; solved: number; unsolved: number }> = {};
  filteredComplaints.forEach((c) => {
    if (!deptCounts[c.department]) deptCounts[c.department] = { total: 0, solved: 0, unsolved: 0 };
    deptCounts[c.department].total++;
    if (c.status === "completed" || c.status === "verified") deptCounts[c.department].solved++;
    else if (c.status !== "rejected") deptCounts[c.department].unsolved++;
  });

  const catCounts: Record<string, { total: number; solved: number }> = {};
  filteredComplaints.forEach((c) => {
    if (!catCounts[c.category]) catCounts[c.category] = { total: 0, solved: 0 };
    catCounts[c.category].total++;
    if (c.status === "completed" || c.status === "verified") catCounts[c.category].solved++;
  });

  const workerStats = workers.map((w) => {
    const wTasks = tasks.filter((t) => t.workerId === w.uid);
    const done = wTasks.filter((t) => t.status === "completed").length;
    const wFeedback = feedback.filter((f) => wTasks.some((t) => t.complaintId === f.complaintId));
    const avg = wFeedback.length > 0 ? wFeedback.reduce((s, f) => s + f.rating, 0) / wFeedback.length : 0;
    const overdue = wTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
    return { ...w, completed: done, totalTasks: wTasks.length, avgRating: avg, overdue };
  });

  const liveComplaints = filteredComplaints
    .filter((c) => !["completed", "verified", "rejected"].includes(c.status))
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

  const resolutionPct = total > 0 ? Math.round((solved / total) * 100) : 0;

  const kpiCards = [
    { label: "Total Complaints", value: total, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Solved", value: solved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Unsolved", value: unsolved, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Overdue", value: delayed, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Month Filter */}
          <div className="flex items-center gap-3">
            <Select value={filterMonth} onValueChange={(v) => { if (v) setFilterMonth(v); }}>
              <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {monthOptions.map((m) => {
                  const [y, mo] = m.split("-");
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                  return <SelectItem key={m} value={m}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            {filterMonth !== "all" && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setFilterMonth("all")}>Clear</Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="inline-flex h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-1">
              <TabsTrigger value="overview" className="gap-2 text-sm rounded-lg px-4">
                <BarChart3 className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="complaints" className="gap-2 text-sm rounded-lg px-4">
                <FileText className="h-3.5 w-3.5" /> Complaints
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2 text-sm rounded-lg px-4">
                <Wrench className="h-3.5 w-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-2 text-sm rounded-lg px-4">
                <Activity className="h-3.5 w-3.5" /> Live
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-sm rounded-lg px-4">
                <TrendingUp className="h-3.5 w-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="ideas" className="gap-2 text-sm rounded-lg px-4">
                <Lightbulb className="h-3.5 w-3.5" /> Ideas {hodApprovedIdeas.length > 0 && <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-[10px] px-1.5">{hodApprovedIdeas.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <MouseGlowCard
                      key={kpi.label}
                      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in"
                      glowColor={`${kpi.color.includes("blue") ? "rgba(59,130,246,0.08)" : kpi.color.includes("emerald") ? "rgba(16,185,129,0.08)" : kpi.color.includes("amber") ? "rgba(245,158,11,0.08)" : kpi.color.includes("red") ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.08)"}`}
                    >
                      <div className="p-6" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${kpi.color}`} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{kpi.label}</p>
                      </div>
                    </MouseGlowCard>
                  );
                })}
              </div>

              {/* Resolution Progress */}
              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Resolution Progress</CardTitle>
                  <CardDescription className="text-sm">{solved} solved of {total} total</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Progress value={resolutionPct} className="h-2.5 flex-1 rounded-full" />
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100 min-w-[3rem] text-right">{resolutionPct}%</span>
                  </div>
                  <div className="flex flex-wrap gap-5 text-sm">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/300" /><span className="text-gray-500 dark:text-gray-400">Solved ({solved})</span></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-50 dark:bg-amber-950/300" /><span className="text-gray-500 dark:text-gray-400">In Progress ({inProgress})</span></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="text-gray-500 dark:text-gray-400">Pending ({pending})</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Department & Category */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-500" /> Department Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[280px]">
                      <div className="space-y-4">
                        {Object.entries(deptCounts).sort((a, b) => b[1].total - a[1].total).map(([dept, d]) => (
                          <div key={dept} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{dept}</span>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs font-normal rounded-md">{d.solved} solved</Badge>
                                <Badge variant="outline" className="text-xs font-normal rounded-md">{d.unsolved} open</Badge>
                              </div>
                            </div>
                            <Progress value={d.total > 0 ? (d.solved / d.total) * 100 : 0} className="h-1.5 rounded-full" />
                          </div>
                        ))}
                        {Object.keys(deptCounts).length === 0 && (
                          <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
                            <Building className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No department data yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-purple-500" /> Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[280px]">
                      <div className="space-y-4">
                        {Object.entries(catCounts).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{cat}</span>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs font-normal rounded-md">{d.solved} solved</Badge>
                                <Badge variant="outline" className="text-xs font-normal rounded-md">{d.total - d.solved} open</Badge>
                              </div>
                            </div>
                            <Progress value={d.total > 0 ? (d.solved / d.total) * 100 : 0} className="h-1.5 rounded-full" />
                          </div>
                        ))}
                        {Object.keys(catCounts).length === 0 && (
                          <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
                            <Wrench className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No category data yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Quotations */}
              {quotationTasks.length > 0 && (
                <Card className="rounded-2xl border-amber-100 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" /> Pending Quotation Approvals
                    </CardTitle>
                    <CardDescription className="text-sm">{quotationTasks.length} awaiting review</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {quotationTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30/60 border border-amber-100">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{t.complaintTitle}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Worker: {t.workerName} &middot; &#8377;{t.quotationAmount}</p>
                          {t.quotationNote && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.quotationNote}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 h-8 text-sm rounded-lg" onClick={() => handleQuotation(t.id, true)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-950/30 h-8 text-sm rounded-lg" onClick={() => handleQuotation(t.id, false)}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Pending Verification */}
              {completedTasks.length > 0 && (
                <Card className="rounded-2xl border-emerald-100 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" /> Pending Verification
                    </CardTitle>
                    <CardDescription className="text-sm">{completedTasks.length} awaiting verification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {completedTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30/60 border border-emerald-100">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{t.complaintTitle}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Worker: {t.workerName}</p>
                          {t.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.notes}</p>}
                        </div>
                        <Button size="sm" className="h-8 text-sm rounded-lg" onClick={() => verifyCompletion(t.id, t.complaintId)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* COMPLAINTS */}
            <TabsContent value="complaints" className="space-y-4">
              {complaints.length === 0 ? (
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No complaints yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Complaints will appear here once submitted</p>
                  </CardContent>
                </Card>
              ) : (
                complaints.map((c) => (
                  <Card key={c.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{c.title}</h3>
                            <StatusBadge status={c.status} />
                            <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-xs capitalize rounded-md">{c.priority}</Badge>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">{c.description}</p>
                          {c.audioAttachment && (
                            <div className="mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Voice Note</p>
                              <audio controls className="w-full h-7">
                                <source src={c.audioAttachment} />
                              </audio>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.createdByName}</span>
                            <span className="flex items-center gap-1"><Building className="h-3 w-3" />{c.department}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                            <span className="flex items-center gap-1 capitalize"><Wrench className="h-3 w-3" />{c.category}</span>
                            {c.assignedToName && <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" />{c.assignedToName}</span>}
                          </div>
                        </div>
                        {(c.status === "pending" || c.status === "reviewed") && (
                          <Button size="sm" onClick={() => setAssignModal(c.id)} className="shrink-0 h-8 text-sm rounded-lg">
                            <Users className="mr-1.5 h-3.5 w-3.5" /> Assign
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* TASKS */}
            <TabsContent value="tasks" className="space-y-4">
              {tasks.length === 0 ? (
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Wrench className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No tasks yet</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">All Tasks</CardTitle>
                    <CardDescription className="text-sm">{tasks.length} total &middot; {delayed} overdue</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="text-xs">Complaint</TableHead>
                          <TableHead className="text-xs">Worker</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Deadline</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((t) => {
                          const isOverdue = new Date(t.deadline) < new Date() && t.status !== "completed";
                          return (
                            <TableRow key={t.id} className={isOverdue ? "bg-red-50 dark:bg-red-950/30/50" : ""}>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{t.complaintTitle}</span>
                                  {isOverdue && <Badge variant="destructive" className="text-xs rounded-md">OVERDUE</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 font-medium">{t.workerName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.workerName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={t.status === "completed" ? "secondary" : "outline"} className="capitalize text-xs rounded-md">{t.status.replace(/_/g, " ")}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                                  <Timer className="h-3 w-3" />{new Date(t.deadline).toLocaleString()}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* LIVE */}
            <TabsContent value="live" className="space-y-4">
              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500 animate-pulse" /> Active Issues
                  </CardTitle>
                  <CardDescription className="text-sm">{liveComplaints.length} currently active</CardDescription>
                </CardHeader>
                <CardContent>
                  {liveComplaints.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-3" />
                      <p className="text-base font-medium text-gray-700 dark:text-gray-300">All clear!</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No active issues</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-2.5">
                        {liveComplaints.map((c) => {
                          const task = tasks.find((t) => t.complaintId === c.id && t.status !== "rejected");
                          const isOverdue = task && new Date(task.deadline) < new Date() && task.status !== "completed";
                          return (
                            <div key={c.id} className={`p-4 rounded-xl border transition-colors ${isOverdue ? "border-red-200 bg-red-50 dark:bg-red-950/30/50" : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50/50"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{c.title}</span>
                                    <StatusBadge status={c.status} />
                                    {isOverdue && <Badge variant="destructive" className="text-xs rounded-md">OVERDUE</Badge>}
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Building className="h-3 w-3" />{c.department}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                                    <span className="flex items-center gap-1 capitalize"><Wrench className="h-3 w-3" />{c.category}</span>
                                    {c.assignedToName && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.assignedToName}</span>}
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.updatedAt).toLocaleString()}</span>
                                  </div>
                                </div>
                                {(c.status === "pending" || c.status === "reviewed") && (
                                  <Button size="sm" variant="outline" className="h-8 text-sm rounded-lg" onClick={() => setAssignModal(c.id)}>Assign</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANALYTICS */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Complaints", val: total, bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700" },
                  { label: "Resolved", val: solved, bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700" },
                  { label: "Resolution Rate", val: `${resolutionPct}%`, bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700" },
                  { label: "Overdue", val: delayed, bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700" },
                ].map((s, i) => (
                  <Card key={i} className={`${s.bg} border-none rounded-2xl shadow-sm`}>
                    <CardContent className="p-5 text-center">
                      <div className={`text-2xl font-bold ${s.text}`}>{s.val}</div>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" /> Worker Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {workerStats.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">No worker data</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Worker</TableHead>
                          <TableHead className="text-center text-xs">Tasks</TableHead>
                          <TableHead className="text-center text-xs">Done</TableHead>
                          <TableHead className="text-center text-xs">Overdue</TableHead>
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
                                  <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 text-xs font-semibold">{w.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{w.name}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{w.specialty || w.department}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">{w.totalTasks}</TableCell>
                            <TableCell className="text-center text-sm text-emerald-600 font-medium">{w.completed}</TableCell>
                            <TableCell className="text-center">
                              {w.overdue > 0 ? <Badge variant="destructive" className="text-xs rounded-md">{w.overdue}</Badge> : <span className="text-gray-400 dark:text-gray-500 text-sm">0</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {w.avgRating > 0 ? (
                                <span className="inline-flex items-center gap-1 text-sm">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />{w.avgRating.toFixed(1)}
                                </span>
                              ) : <span className="text-gray-400 dark:text-gray-500 text-sm">--</span>}
                            </TableCell>
                            <TableCell className="text-center font-medium text-sm">
                              {w.totalTasks > 0 ? Math.round((w.completed / w.totalTasks) * 100) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(["critical", "high", "medium", "low"] as const).map((p) => {
                      const count = complaints.filter((c) => c.priority === p).length;
                      const cfg = {
                        critical: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700", border: "border-red-100" },
                        high: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700", border: "border-amber-100" },
                        medium: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700", border: "border-blue-100" },
                        low: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700", border: "border-emerald-100" },
                      };
                      const c = cfg[p];
                      return (
                        <Card key={p} className={`${c.bg} ${c.border} rounded-xl`}>
                          <CardContent className="p-4 text-center">
                            <div className={`text-2xl font-bold ${c.text}`}>{count}</div>
                            <p className="text-xs capitalize mt-1 text-gray-500 dark:text-gray-400">{p}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* IDEAS */}
            <TabsContent value="ideas" className="space-y-4">
              {ideas.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-700">
                  <CardContent className="flex flex-col items-center py-16">
                    <Lightbulb className="h-10 w-10 text-amber-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No ideas submitted yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <Card key={idea.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{idea.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by {idea.createdByName} &middot; {idea.department} &middot; {new Date(idea.createdAt).toLocaleDateString()}
                              {idea.hodReviewedByName && <span className="text-emerald-600"> &middot; HOD: {idea.hodReviewedByName}</span>}
                            </p>
                          </div>
                          <Badge variant={idea.status === "approved_by_hod" ? "default" : idea.status === "approved_by_admin" ? "secondary" : idea.status === "rejected" ? "destructive" : "outline"} className="text-xs capitalize shrink-0">
                            {idea.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{idea.description}</p>
                        {idea.status === "approved_by_hod" && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={async () => {
                              await updateIdea(idea.id, { status: "rejected", rejectionReason: "Not feasible at this time.", adminReviewedBy: profile?.uid, adminReviewedByName: profile?.name });
                              await addNotification(idea.createdBy, "Idea Rejected by Admin", `Your idea "${idea.title}" was not approved by admin.`, "/dashboard/student/ideas");
                              toast.success("Idea rejected");
                            }}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={async () => {
                              await updateIdea(idea.id, { status: "approved_by_admin", adminReviewedBy: profile?.uid, adminReviewedByName: profile?.name });
                              await addNotification(idea.createdBy, "Idea Approved!", `Your idea "${idea.title}" has been approved by admin! It will be implemented.`, "/dashboard/student/ideas");
                              toast.success("Idea approved!");
                            }}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Assign Dialog */}
          <Dialog open={!!assignModal} onOpenChange={(open) => { if (!open) { setAssignModal(null); setSelectedWorker(""); } }}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[16px]">Assign Worker</DialogTitle>
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
                            <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600">{w.name.charAt(0)}</AvatarFallback>
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
