"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useAnnouncements,
  addAnnouncement,
  updateComplaint,
  addNotification,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  AlertCircle,
  Activity,
  Megaphone,
  MapPin,
  Wrench,
  FileText,
  Plus,
  Eye,
  Inbox,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  CalendarDays,
  User,
} from "lucide-react";

export default function HODDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const announcements = useAnnouncements(profile?.department);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  const total = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "completed" || c.status === "verified"
  ).length;
  const inProgress = complaints.filter((c) =>
    ["assigned", "in_progress", "quotation_submitted", "quotation_approved"].includes(c.status)
  ).length;
  const critical = complaints.filter(
    (c) =>
      c.priority === "critical" &&
      !["completed", "verified", "rejected"].includes(c.status)
  ).length;
  const reviewed = complaints.filter((c) => c.status === "reviewed").length;

  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });

  const liveComplaints = complaints
    .filter((c) => !["completed", "verified", "rejected"].includes(c.status))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const detailComplaint = detailModal
    ? complaints.find((c) => c.id === detailModal)
    : null;

  const approveComplaint = async (id: string) => {
    const c = complaints.find((x) => x.id === id);
    try {
      await updateComplaint(id, { status: "reviewed" });
      if (c)
        await addNotification(
          c.createdBy,
          "Complaint Reviewed",
          `"${c.title}" approved by HOD.`,
          "/dashboard/student"
        );
      toast.success("Approved!");
    } catch {
      toast.error("Failed");
    }
  };

  const rejectComplaint = async () => {
    if (!rejectModal) return;
    const c = complaints.find((x) => x.id === rejectModal);
    try {
      await updateComplaint(rejectModal, {
        status: "rejected",
        rejectionReason: rejectReason,
      });
      if (c)
        await addNotification(
          c.createdBy,
          "Complaint Rejected",
          `"${c.title}" rejected: ${rejectReason}`,
          "/dashboard/student"
        );
      toast.success("Rejected");
      setRejectModal(null);
      setRejectReason("");
    } catch {
      toast.error("Failed");
    }
  };

  const submitAnnouncement = async () => {
    if (!profile || !annTitle || !annMessage) return;
    try {
      await addAnnouncement({
        department: profile.department,
        title: annTitle,
        message: annMessage,
        createdBy: profile.uid,
        createdByName: profile.name,
        createdAt: new Date(),
      });
      toast.success("Announcement posted!");
      setAnnouncementModal(false);
      setAnnTitle("");
      setAnnMessage("");
    } catch {
      toast.error("Failed");
    }
  };

  const resolutionPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Department Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.department} &mdash; Overview &amp; Management
              </p>
            </div>
            {critical > 0 && (
              <Alert variant="destructive" className="w-auto sm:max-w-xs">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Critical Issues</AlertTitle>
                <AlertDescription>
                  {critical} unresolved critical complaint{critical !== 1 && "s"}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="complaints" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Complaints</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Live Progress</span>
              </TabsTrigger>
              <TabsTrigger value="updates" className="gap-2">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Updates</span>
              </TabsTrigger>
            </TabsList>

            {/* ================================================================ */}
            {/* DASHBOARD TAB                                                    */}
            {/* ================================================================ */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "Total",
                    value: total,
                    icon: BarChart3,
                    accent: "text-primary",
                    bg: "bg-primary/10",
                  },
                  {
                    label: "Pending",
                    value: pendingCount,
                    icon: Clock,
                    accent: "text-amber-600",
                    bg: "bg-amber-500/10",
                  },
                  {
                    label: "Reviewed",
                    value: reviewed,
                    icon: CheckCircle2,
                    accent: "text-indigo-600",
                    bg: "bg-indigo-500/10",
                  },
                  {
                    label: "Resolved",
                    value: resolvedCount,
                    icon: TrendingUp,
                    accent: "text-emerald-600",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    label: "Critical",
                    value: critical,
                    icon: AlertCircle,
                    accent: "text-red-600",
                    bg: "bg-red-500/10",
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label} className="relative overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {s.label}
                            </p>
                            <p className="text-3xl font-bold mt-1">{s.value}</p>
                          </div>
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${s.bg} ${s.accent}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Resolution Progress + In-Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Resolution Progress
                    </CardTitle>
                    <CardDescription>
                      {resolvedCount} of {total} complaints resolved
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-bold text-emerald-600">
                        {resolutionPct}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {inProgress} in progress
                      </span>
                    </div>
                    <Progress
                      value={resolutionPct}
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>0%</span>
                      <span>Target: 100%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Category Breakdown
                    </CardTitle>
                    <CardDescription>
                      Complaints by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(catCounts).length === 0 ? (
                      <p className="text-center py-6 text-sm text-muted-foreground">
                        No category data yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(catCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, count]) => {
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={cat} className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="capitalize font-medium">{cat}</span>
                                  <span className="text-muted-foreground">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <Progress value={pct} className="h-2" />
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ================================================================ */}
            {/* COMPLAINTS TAB                                                   */}
            {/* ================================================================ */}
            <TabsContent value="complaints" className="space-y-4">
              {complaints.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">
                      No complaints found
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complaints from your department will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All Complaints</CardTitle>
                    <CardDescription>
                      {total} total &mdash; {pendingCount} awaiting review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="hidden md:table-cell">
                              Category
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                              Location
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                              Reported By
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              Date
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {complaints.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate max-w-[200px]">
                                    {c.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                                    {c.description}
                                  </p>
                                  {c.rejectionReason && (
                                    <p className="text-xs text-destructive mt-1 truncate max-w-[200px]">
                                      Rejected: {c.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={c.status} />
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell className="hidden md:table-cell capitalize text-muted-foreground">
                                {c.category}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground">
                                {c.location}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground">
                                {c.createdByName}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => setDetailModal(c.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {c.status === "pending" && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => approveComplaint(c.id)}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setRejectModal(c.id)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ================================================================ */}
            {/* LIVE PROGRESS TAB                                                */}
            {/* ================================================================ */}
            <TabsContent value="live" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                      </span>
                      <div>
                        <CardTitle className="text-base">
                          Active Issues
                        </CardTitle>
                        <CardDescription>
                          {liveComplaints.length} unresolved complaint
                          {liveComplaints.length !== 1 && "s"} in your department
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {liveComplaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500/40 mb-4" />
                      <p className="font-medium text-muted-foreground">
                        All clear in your department!
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No active issues at the moment.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-3">
                        {liveComplaints.map((c) => (
                          <div
                            key={c.id}
                            className="group relative flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                            onClick={() => setDetailModal(c.id)}
                          >
                            <div
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                c.priority === "critical"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {c.priority === "critical" ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <Activity className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-sm">
                                  {c.title}
                                </span>
                                <StatusBadge status={c.status} />
                                <Badge
                                  variant={
                                    c.priority === "critical"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-[10px]"
                                >
                                  {c.priority}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {c.createdByName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {c.location}
                                </span>
                                {c.assignedToName && (
                                  <span className="flex items-center gap-1">
                                    <Wrench className="h-3 w-3" />
                                    {c.assignedToName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(c.updatedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ================================================================ */}
            {/* UPDATES TAB                                                      */}
            {/* ================================================================ */}
            <TabsContent value="updates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Department Announcements
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Share updates with your department
                  </p>
                </div>
                <Button onClick={() => setAnnouncementModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Button>
              </div>

              {announcements.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="font-medium text-muted-foreground">
                      No announcements yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first announcement to keep the department informed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <Card key={a.id} className="transition-all hover:shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">
                              {a.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                              {a.message}
                            </p>
                            <Separator className="my-3" />
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {a.createdByName}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(a.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* ================================================================ */}
          {/* COMPLAINT DETAIL DIALOG                                          */}
          {/* ================================================================ */}
          <Dialog
            open={!!detailModal}
            onOpenChange={(open) => !open && setDetailModal(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Complaint Details</DialogTitle>
              </DialogHeader>
              {detailComplaint && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailComplaint.status} />
                    <Badge
                      variant={
                        detailComplaint.priority === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {detailComplaint.priority}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg leading-snug">
                      {detailComplaint.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                      {detailComplaint.description}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">
                        Category
                      </p>
                      <p className="capitalize font-medium">
                        {detailComplaint.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">
                        Location
                      </p>
                      <p className="font-medium">{detailComplaint.location}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">
                        Reported By
                      </p>
                      <p className="font-medium">
                        {detailComplaint.createdByName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">
                        Date
                      </p>
                      <p className="font-medium">
                        {new Date(detailComplaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {detailComplaint.assignedToName && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">
                          Assigned To
                        </p>
                        <p className="font-medium">
                          {detailComplaint.assignedToName}
                        </p>
                      </div>
                    )}
                  </div>

                  {detailComplaint.rejectionReason && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Rejection Reason</AlertTitle>
                      <AlertDescription>
                        {detailComplaint.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {detailComplaint.status === "pending" && (
                    <>
                      <Separator />
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setDetailModal(null);
                            setRejectModal(detailComplaint.id);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            approveComplaint(detailComplaint.id);
                            setDetailModal(null);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ================================================================ */}
          {/* REJECT REASON DIALOG                                             */}
          {/* ================================================================ */}
          <Dialog
            open={!!rejectModal}
            onOpenChange={(open) => !open && setRejectModal(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Complaint</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejecting this complaint. The student
                will be notified.
              </p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={rejectComplaint}
                  disabled={!rejectReason}
                >
                  Reject Complaint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ================================================================ */}
          {/* ANNOUNCEMENT DIALOG                                              */}
          {/* ================================================================ */}
          <Dialog open={announcementModal} onOpenChange={setAnnouncementModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Announcement</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This announcement will be visible to everyone in your department.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Write your announcement..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAnnouncementModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAnnouncement}
                  disabled={!annTitle || !annMessage}
                >
                  Post Announcement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
