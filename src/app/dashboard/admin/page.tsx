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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();
  const feedback = useFeedback();
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");

  // --- Counts ---
  const total = complaints.length;
  const solved = complaints.filter(
    (c) => c.status === "completed" || c.status === "verified"
  ).length;
  const unsolved = complaints.filter(
    (c) => !["completed", "verified", "rejected"].includes(c.status)
  ).length;
  const rejected = complaints.filter((c) => c.status === "rejected").length;
  const delayed = tasks.filter(
    (t) => t.status !== "completed" && new Date(t.deadline) < new Date()
  ).length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter(
    (c) => c.status === "in_progress"
  ).length;

  // --- Department wise ---
  const deptCounts: Record<
    string,
    { total: number; solved: number; unsolved: number }
  > = {};
  complaints.forEach((c) => {
    if (!deptCounts[c.department])
      deptCounts[c.department] = { total: 0, solved: 0, unsolved: 0 };
    deptCounts[c.department].total++;
    if (c.status === "completed" || c.status === "verified")
      deptCounts[c.department].solved++;
    else if (c.status !== "rejected") deptCounts[c.department].unsolved++;
  });

  // --- Work/Category specific ---
  const catCounts: Record<string, { total: number; solved: number }> = {};
  complaints.forEach((c) => {
    if (!catCounts[c.category])
      catCounts[c.category] = { total: 0, solved: 0 };
    catCounts[c.category].total++;
    if (c.status === "completed" || c.status === "verified")
      catCounts[c.category].solved++;
  });

  // --- Worker performance ---
  const workerStats = workers.map((w) => {
    const wTasks = tasks.filter((t) => t.workerId === w.uid);
    const done = wTasks.filter((t) => t.status === "completed").length;
    const wFeedback = feedback.filter((f) =>
      wTasks.some((t) => t.complaintId === f.complaintId)
    );
    const avg =
      wFeedback.length > 0
        ? wFeedback.reduce((s, f) => s + f.rating, 0) / wFeedback.length
        : 0;
    const overdue = wTasks.filter(
      (t) => t.status !== "completed" && new Date(t.deadline) < new Date()
    ).length;
    return {
      ...w,
      completed: done,
      totalTasks: wTasks.length,
      avgRating: avg,
      overdue,
    };
  });

  // --- Live tracking: active complaints ---
  const liveComplaints = complaints
    .filter(
      (c) => !["completed", "verified", "rejected"].includes(c.status)
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const quotationTasks = tasks.filter(
    (t) => t.status === "quotation_submitted"
  );
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
      await updateComplaint(assignModal, {
        status: "assigned",
        assignedTo: selectedWorker,
        assignedToName: worker.name,
      });
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
      await addNotification(
        selectedWorker,
        "New Task Assigned",
        `You have been assigned: ${complaint.title}`,
        "/dashboard/worker"
      );
      await addNotification(
        complaint.createdBy,
        "Complaint Update",
        `"${complaint.title}" assigned to ${worker.name}`,
        "/dashboard/student"
      );
      toast.success("Worker assigned!");
      setAssignModal(null);
      setSelectedWorker("");
    } catch {
      toast.error("Failed");
    }
  };

  const handleQuotation = async (taskId: string, approved: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTask(taskId, {
        quotationApproved: approved,
        status: approved ? "in_progress" : "assigned",
      });
      if (approved)
        await updateComplaint(task.complaintId, {
          status: "quotation_approved",
        });
      await addNotification(
        task.workerId,
        approved ? "Quotation Approved" : "Quotation Rejected",
        `Quotation for "${task.complaintTitle}" ${approved ? "approved" : "rejected"}.`,
        "/dashboard/worker"
      );
      toast.success(approved ? "Approved" : "Rejected");
    } catch {
      toast.error("Failed");
    }
  };

  const verifyCompletion = async (taskId: string, complaintId: string) => {
    try {
      await updateComplaint(complaintId, { status: "verified" });
      await updateTask(taskId, { status: "completed" });
      const c = complaints.find((x) => x.id === complaintId);
      if (c)
        await addNotification(
          c.createdBy,
          "Complaint Resolved",
          `"${c.title}" resolved. Please provide feedback.`,
          "/dashboard/student"
        );
      toast.success("Verified!");
    } catch {
      toast.error("Failed");
    }
  };

  const resolutionPct = total > 0 ? Math.round((solved / total) * 100) : 0;

  const kpiCards = [
    {
      label: "Total Complaints",
      value: total,
      icon: BarChart3,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Solved",
      value: solved,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Unsolved",
      value: unsolved,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      borderColor: "border-red-200 dark:border-red-800",
    },
    {
      label: "Overdue",
      value: delayed,
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              System-wide overview and management
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="complaints" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Complaints</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-1.5">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Live Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* ====== OVERVIEW ====== */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <Card
                      key={kpi.label}
                      className={`${kpi.borderColor} transition-shadow hover:shadow-md`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {kpi.label}
                            </p>
                            <p className="text-3xl font-bold mt-1 text-foreground">
                              {kpi.value}
                            </p>
                          </div>
                          <div
                            className={`h-11 w-11 rounded-xl ${kpi.bgColor} flex items-center justify-center`}
                          >
                            <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Resolution Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Resolution Progress
                  </CardTitle>
                  <CardDescription>
                    {solved} solved of {total} total complaints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Progress
                      value={resolutionPct}
                      className="h-3 flex-1"
                    />
                    <span className="text-lg font-bold text-foreground min-w-[3rem] text-right">
                      {resolutionPct}%
                    </span>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">
                        Solved ({solved})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">
                        In Progress ({inProgress})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">
                        Pending ({pending})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department & Category Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Wise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-500" />
                      Department Breakdown
                    </CardTitle>
                    <CardDescription>
                      Resolution rates by department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-4">
                        {Object.entries(deptCounts)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([dept, d]) => (
                            <div key={dept} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground truncate">
                                  {dept}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    {d.solved} solved
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-normal"
                                  >
                                    {d.unsolved} open
                                  </Badge>
                                </div>
                              </div>
                              <Progress
                                value={
                                  d.total > 0
                                    ? (d.solved / d.total) * 100
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                          ))}
                        {Object.keys(deptCounts).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Building className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No department data yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Category Wise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-purple-500" />
                      Category Breakdown
                    </CardTitle>
                    <CardDescription>
                      Resolution rates by work category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-4">
                        {Object.entries(catCounts)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([cat, d]) => (
                            <div key={cat} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground capitalize">
                                  {cat}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    {d.solved} solved
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-normal"
                                  >
                                    {d.total - d.solved} open
                                  </Badge>
                                </div>
                              </div>
                              <Progress
                                value={
                                  d.total > 0
                                    ? (d.solved / d.total) * 100
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                          ))}
                        {Object.keys(catCounts).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Wrench className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No category data yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Quotation Approvals */}
              {quotationTasks.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Pending Quotation Approvals
                    </CardTitle>
                    <CardDescription>
                      {quotationTasks.length} quotation
                      {quotationTasks.length !== 1 ? "s" : ""} awaiting your
                      review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quotationTasks.map((t) => (
                      <Alert
                        key={t.id}
                        className="flex items-center justify-between gap-4 border-amber-100 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {t.complaintTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Worker: {t.workerName} &middot; Amount: &#8377;
                            {t.quotationAmount}
                          </p>
                          {t.quotationNote && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Note: {t.quotationNote}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleQuotation(t.id, true)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleQuotation(t.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Pending Verification */}
              {completedTasks.length > 0 && (
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      Pending Verification
                    </CardTitle>
                    <CardDescription>
                      {completedTasks.length} task
                      {completedTasks.length !== 1 ? "s" : ""} completed and
                      awaiting verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {completedTasks.map((t) => (
                      <Alert
                        key={t.id}
                        className="flex items-center justify-between gap-4 border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {t.complaintTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Worker: {t.workerName}
                          </p>
                          {t.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Notes: {t.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            verifyCompletion(t.id, t.complaintId)
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ====== COMPLAINTS ====== */}
            <TabsContent value="complaints" className="space-y-4">
              {complaints.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No complaints yet
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Complaints will appear here once submitted
                    </p>
                  </CardContent>
                </Card>
              ) : (
                complaints.map((c) => (
                  <Card
                    key={c.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              {c.title}
                            </h3>
                            <StatusBadge status={c.status} />
                            <Badge
                              variant={
                                c.priority === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px] capitalize"
                            >
                              {c.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {c.description}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {c.createdByName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {c.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {c.location}
                            </span>
                            <span className="flex items-center gap-1 capitalize">
                              <Wrench className="h-3 w-3" />
                              {c.category}
                            </span>
                            {c.assignedToName && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Assigned: {c.assignedToName}
                              </span>
                            )}
                          </div>
                        </div>
                        {(c.status === "pending" ||
                          c.status === "reviewed") && (
                          <Button
                            size="sm"
                            onClick={() => setAssignModal(c.id)}
                            className="shrink-0"
                          >
                            <Users className="mr-1.5 h-3.5 w-3.5" />
                            Assign Worker
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* ====== TASKS ====== */}
            <TabsContent value="tasks" className="space-y-4">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Wrench className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No tasks yet
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Tasks will appear here once workers are assigned
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All Tasks</CardTitle>
                    <CardDescription>
                      {tasks.length} total &middot; {delayed} overdue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deadline</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((t) => {
                          const isOverdue =
                            new Date(t.deadline) < new Date() &&
                            t.status !== "completed";
                          return (
                            <TableRow
                              key={t.id}
                              className={
                                isOverdue
                                  ? "bg-red-50/50 dark:bg-red-950/20"
                                  : ""
                              }
                            >
                              <TableCell>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {t.complaintTitle}
                                  </span>
                                  {isOverdue && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px]"
                                    >
                                      OVERDUE
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                      {t.workerName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {t.workerName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    t.status === "completed"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="capitalize text-[10px]"
                                >
                                  {t.status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-sm flex items-center gap-1 ${
                                    isOverdue
                                      ? "text-red-600 font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <Timer className="h-3 w-3" />
                                  {new Date(t.deadline).toLocaleString()}
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

            {/* ====== LIVE TRACKING ====== */}
            <TabsContent value="live" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    Active Issues
                  </CardTitle>
                  <CardDescription>
                    {liveComplaints.length} issue
                    {liveComplaints.length !== 1 ? "s" : ""} currently active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {liveComplaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                      <p className="text-lg font-medium text-foreground">
                        All clear!
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No active issues at the moment
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <div className="space-y-3">
                        {liveComplaints.map((c) => {
                          const task = tasks.find(
                            (t) =>
                              t.complaintId === c.id &&
                              t.status !== "rejected"
                          );
                          const isOverdue =
                            task &&
                            new Date(task.deadline) < new Date() &&
                            task.status !== "completed";
                          return (
                            <div
                              key={c.id}
                              className={`p-4 rounded-lg border transition-colors ${
                                isOverdue
                                  ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="font-semibold text-sm text-foreground">
                                      {c.title}
                                    </span>
                                    <StatusBadge status={c.status} />
                                    {isOverdue && (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px]"
                                      >
                                        OVERDUE
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {c.department}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {c.location}
                                    </span>
                                    <span className="flex items-center gap-1 capitalize">
                                      <Wrench className="h-3 w-3" />
                                      {c.category}
                                    </span>
                                    {c.assignedToName && (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {c.assignedToName}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Updated{" "}
                                      {new Date(
                                        c.updatedAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                {(c.status === "pending" ||
                                  c.status === "reviewed") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAssignModal(c.id)}
                                  >
                                    Assign
                                  </Button>
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

            {/* ====== ANALYTICS ====== */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Complaints",
                    val: total,
                    bgColor: "bg-blue-50 dark:bg-blue-950/40",
                    textColor: "text-blue-700 dark:text-blue-300",
                  },
                  {
                    label: "Resolved",
                    val: solved,
                    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
                    textColor: "text-emerald-700 dark:text-emerald-300",
                  },
                  {
                    label: "Resolution Rate",
                    val: `${resolutionPct}%`,
                    bgColor: "bg-amber-50 dark:bg-amber-950/40",
                    textColor: "text-amber-700 dark:text-amber-300",
                  },
                  {
                    label: "Overdue",
                    val: delayed,
                    bgColor: "bg-red-50 dark:bg-red-950/40",
                    textColor: "text-red-700 dark:text-red-300",
                  },
                ].map((s, i) => (
                  <Card key={i} className={`${s.bgColor} border-none`}>
                    <CardContent className="p-5 text-center">
                      <div className={`text-3xl font-bold ${s.textColor}`}>
                        {s.val}
                      </div>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {s.label}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Worker Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Worker Performance
                  </CardTitle>
                  <CardDescription>
                    Task completion and ratings overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {workerStats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No worker data available
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Worker</TableHead>
                          <TableHead className="text-center">
                            Tasks
                          </TableHead>
                          <TableHead className="text-center">
                            Completed
                          </TableHead>
                          <TableHead className="text-center">
                            Overdue
                          </TableHead>
                          <TableHead className="text-center">
                            Rating
                          </TableHead>
                          <TableHead className="text-center">
                            Success Rate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workerStats.map((w) => (
                          <TableRow key={w.uid}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {w.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {w.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {w.specialty || w.department}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {w.totalTasks}
                            </TableCell>
                            <TableCell className="text-center text-emerald-600 font-medium">
                              {w.completed}
                            </TableCell>
                            <TableCell className="text-center">
                              {w.overdue > 0 ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {w.overdue}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  0
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {w.avgRating > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                  {w.avgRating.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {w.totalTasks > 0
                                ? Math.round(
                                    (w.completed / w.totalTasks) * 100
                                  )
                                : 0}
                              %
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Priority Distribution
                  </CardTitle>
                  <CardDescription>
                    Complaints breakdown by priority level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(
                      ["critical", "high", "medium", "low"] as const
                    ).map((p) => {
                      const count = complaints.filter(
                        (c) => c.priority === p
                      ).length;
                      const config = {
                        critical: {
                          bg: "bg-red-50 dark:bg-red-950/40",
                          text: "text-red-700 dark:text-red-300",
                          border:
                            "border-red-200 dark:border-red-800",
                        },
                        high: {
                          bg: "bg-amber-50 dark:bg-amber-950/40",
                          text: "text-amber-700 dark:text-amber-300",
                          border:
                            "border-amber-200 dark:border-amber-800",
                        },
                        medium: {
                          bg: "bg-blue-50 dark:bg-blue-950/40",
                          text: "text-blue-700 dark:text-blue-300",
                          border:
                            "border-blue-200 dark:border-blue-800",
                        },
                        low: {
                          bg: "bg-emerald-50 dark:bg-emerald-950/40",
                          text: "text-emerald-700 dark:text-emerald-300",
                          border:
                            "border-emerald-200 dark:border-emerald-800",
                        },
                      };
                      const c = config[p];
                      return (
                        <Card
                          key={p}
                          className={`${c.bg} ${c.border}`}
                        >
                          <CardContent className="p-4 text-center">
                            <div
                              className={`text-3xl font-bold ${c.text}`}
                            >
                              {count}
                            </div>
                            <p className="text-xs capitalize mt-1 text-muted-foreground">
                              {p}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Assign Worker Dialog */}
          <Dialog
            open={!!assignModal}
            onOpenChange={(open) => {
              if (!open) {
                setAssignModal(null);
                setSelectedWorker("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Worker</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={selectedWorker}
                  onValueChange={(v) => setSelectedWorker(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.uid} value={w.uid}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                              {w.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {w.name} ({w.specialty || w.department})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignModal(null);
                    setSelectedWorker("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignWorker}
                  disabled={!selectedWorker}
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  Assign Worker
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
