"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useAnnouncements,
  addAnnouncement,
  updateComplaint,
  addNotification,
  useWorkers,
  useIdeas,
  updateIdea,
  notifyRole,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { sendWhatsAppMessage, getWhatsAppPhone } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, BarChart3, Clock, AlertCircle, Activity,
  Megaphone, MapPin, Wrench, FileText, Plus, Eye, Inbox, TrendingUp,
  ShieldAlert, ArrowUpRight, CalendarDays, User, MoreVertical,
  Phone, MessageCircle, Lightbulb,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

export default function HODDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const workers = useWorkers();
  const announcements = useAnnouncements(profile?.department);
  const ideas = useIdeas(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const pendingIdeas = ideas.filter((i) => i.status === "pending");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [ideaRejectModal, setIdeaRejectModal] = useState<string | null>(null);
  const [ideaRejectReason, setIdeaRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredComplaints = filterMonth === "all" ? complaints : complaints.filter((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === filterMonth;
  });

  const total = filteredComplaints.length;
  const pendingCount = filteredComplaints.filter((c) => c.status === "pending").length;
  const resolvedCount = filteredComplaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const inProgress = filteredComplaints.filter((c) => ["assigned", "in_progress", "quotation_submitted", "quotation_approved"].includes(c.status)).length;
  const critical = filteredComplaints.filter((c) => c.priority === "critical" && !["completed", "verified", "rejected"].includes(c.status)).length;
  const reviewed = filteredComplaints.filter((c) => c.status === "reviewed").length;

  const catCounts: Record<string, number> = {};
  filteredComplaints.forEach((c) => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  const liveComplaints = filteredComplaints
    .filter((c) => !["completed", "verified", "rejected"].includes(c.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Generate month options from complaints
  const monthOptions = Array.from(new Set(complaints.map((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort().reverse();

  const detailComplaint = detailModal ? filteredComplaints.find((c) => c.id === detailModal) : null;

  const approveComplaint = async (id: string) => {
    const c = filteredComplaints.find((x) => x.id === id);
    try {
      await updateComplaint(id, { status: "reviewed" });
      if (c) await addNotification(c.createdBy, "Complaint Reviewed", `"${c.title}" approved by HOD.`, "/dashboard/student");
      toast.success("Approved!");
    } catch { toast.error("Failed"); }
  };

  const rejectComplaint = async () => {
    if (!rejectModal) return;
    const c = filteredComplaints.find((x) => x.id === rejectModal);
    try {
      await updateComplaint(rejectModal, { status: "rejected", rejectionReason: rejectReason });
      if (c) await addNotification(c.createdBy, "Complaint Rejected", `"${c.title}" rejected: ${rejectReason}`, "/dashboard/student");
      toast.success("Rejected");
      setRejectModal(null);
      setRejectReason("");
    } catch { toast.error("Failed"); }
  };

  const submitAnnouncement = async () => {
    if (!profile || !annTitle || !annMessage) return;
    try {
      await addAnnouncement({ department: profile.department, title: annTitle, message: annMessage, createdBy: profile.uid, createdByName: profile.name, createdAt: new Date() });
      toast.success("Announcement posted!");
      setAnnouncementModal(false);
      setAnnTitle("");
      setAnnMessage("");
    } catch { toast.error("Failed"); }
  };

  const resolutionPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const kpiCards = [
    { label: "Total", value: total, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Reviewed", value: reviewed, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Resolved", value: resolvedCount, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Critical", value: critical, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  ];

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Critical Alert */}
          {critical > 0 && (
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 dark:bg-red-950/30 animate-slide-up">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">Critical Issues</AlertTitle>
              <AlertDescription className="text-sm">{critical} unresolved critical complaint{critical !== 1 && "s"}</AlertDescription>
            </Alert>
          )}

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

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="inline-flex h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-1">
              <TabsTrigger value="dashboard" className="gap-2 text-sm rounded-lg px-4"><BarChart3 className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
              <TabsTrigger value="complaints" className="gap-2 text-sm rounded-lg px-4"><FileText className="h-3.5 w-3.5" /> Complaints</TabsTrigger>
              <TabsTrigger value="live" className="gap-2 text-sm rounded-lg px-4"><Activity className="h-3.5 w-3.5" /> Live</TabsTrigger>
              <TabsTrigger value="ideas" className="gap-2 text-sm rounded-lg px-4"><Lightbulb className="h-3.5 w-3.5" /> Ideas {pendingIdeas.length > 0 && <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-[10px] px-1.5">{pendingIdeas.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="updates" className="gap-2 text-sm rounded-lg px-4"><Megaphone className="h-3.5 w-3.5" /> Updates</TabsTrigger>
            </TabsList>

            {/* DASHBOARD */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <MouseGlowCard
                      key={kpi.label}
                      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in"
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" /> Resolution Progress
                    </CardTitle>
                    <CardDescription className="text-sm">{resolvedCount} of {total} resolved</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-emerald-600">{resolutionPct}%</span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">{inProgress} in progress</span>
                    </div>
                    <Progress value={resolutionPct} className="h-2.5 rounded-full" />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-indigo-500" /> Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(catCounts).length === 0 ? (
                      <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={cat} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="capitalize font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{cat}</span>
                                <span className="text-gray-400 dark:text-gray-500">{count} ({pct}%)</span>
                              </div>
                              <Progress value={pct} className="h-1.5 rounded-full" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* COMPLAINTS */}
            <TabsContent value="complaints" className="space-y-4">
              {filteredComplaints.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-700">
                  <CardContent className="flex flex-col items-center py-16">
                    <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">No complaints found</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">All Complaints</CardTitle>
                    <CardDescription className="text-sm">{total} total &mdash; {pendingCount} awaiting review</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Title</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Priority</TableHead>
                            <TableHead className="hidden md:table-cell text-xs">Category</TableHead>
                            <TableHead className="hidden lg:table-cell text-xs">Location</TableHead>
                            <TableHead className="text-right text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredComplaints.map((c) => (
                            <TableRow key={c.id} className="group hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/50/50 transition-colors">
                              <TableCell>
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{c.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px] mt-0.5">{c.description}</p>
                              </TableCell>
                              <TableCell><StatusBadge status={c.status} /></TableCell>
                              <TableCell><Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-[11px] capitalize rounded-md">{c.priority}</Badge></TableCell>
                              <TableCell className="hidden md:table-cell capitalize text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">{c.category}</TableCell>
                              <TableCell className="hidden lg:table-cell text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">{c.location}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDetailModal(c.id)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {c.status === "reviewed" && !c.assignedTo && workers.length > 0 && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                      title={`WhatsApp ${workers[0].name}`}
                                      onClick={(e) => { e.stopPropagation(); sendWhatsAppMessage(getWhatsAppPhone(), `Hi ${workers[0].name}, urgent issue: "${c.title}" at ${c.location}. Please check CampusOps.`); toast.success("WhatsApp message sent!"); }}
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {c.status === "pending" && (
                                    <>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:bg-emerald-950/30" onClick={() => approveComplaint(c.id)}>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30" onClick={() => setRejectModal(c.id)}>
                                        <XCircle className="h-3.5 w-3.5" />
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

            {/* LIVE */}
            <TabsContent value="live" className="space-y-4">
              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-50 dark:bg-indigo-950/300" /></span>
                    <div>
                      <CardTitle className="text-base font-semibold">Active Issues</CardTitle>
                      <CardDescription className="text-sm">{liveComplaints.length} unresolved</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {liveComplaints.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-3" />
                      <p className="text-sm font-medium text-gray-600">All clear!</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-2.5">
                        {liveComplaints.map((c, i) => (
                          <div key={c.id} className="group relative flex items-start gap-3.5 rounded-xl border border-gray-100 dark:border-gray-800 p-4 transition-all duration-200 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/50/50 hover:shadow-sm cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 60}ms` }} onClick={() => setDetailModal(c.id)}>
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.priority === "critical" ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500"}`}>
                              {c.priority === "critical" ? <AlertCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{c.title}</span>
                                <StatusBadge status={c.status} />
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.createdByName}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                            {/* Quick contact for unassigned reviewed complaints */}
                            {c.status === "reviewed" && !c.assignedTo && (
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {workers.slice(0, 1).map((w) => (
                                  <div key={w.uid} className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                      title={`WhatsApp ${w.name}`}
                                      onClick={() => { sendWhatsAppMessage(getWhatsAppPhone(), `Hi ${w.name}, urgent issue: "${c.title}" at ${c.location}. Please check CampusOps.`); toast.success("WhatsApp message sent!"); }}
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <a href="tel:+919384557144" title={`Call ${w.name}`}>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                        <Phone className="h-3.5 w-3.5" />
                                      </Button>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                            <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
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
                            <p className="text-xs text-muted-foreground mt-0.5">by {idea.createdByName} &middot; {new Date(idea.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={idea.status === "pending" ? "secondary" : idea.status === "rejected" ? "destructive" : "default"} className="text-xs capitalize shrink-0">
                            {idea.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{idea.description}</p>
                        {idea.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => setIdeaRejectModal(idea.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={async () => {
                              await updateIdea(idea.id, { status: "approved_by_hod", hodReviewedBy: profile?.uid, hodReviewedByName: profile?.name });
                              await addNotification(idea.createdBy, "Idea Approved by HOD", `Your idea "${idea.title}" has been approved by HOD and forwarded to Admin.`, "/dashboard/student/ideas");
                              await notifyRole("admin", "New Idea for Review", `HOD approved idea: "${idea.title}" by ${idea.createdByName}`, "/dashboard/admin");
                              toast.success("Idea approved and forwarded to Admin!");
                            }}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Forward
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* UPDATES */}
            <TabsContent value="updates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Announcements</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Share updates with your department</p>
                </div>
                <Button onClick={() => setAnnouncementModal(true)} className="gap-2 h-9 text-sm rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> New
                </Button>
              </div>
              {announcements.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-700">
                  <CardContent className="flex flex-col items-center py-16">
                    <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">No announcements yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a, i) => (
                    <Card key={a.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                            <Megaphone className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{a.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1.5 leading-relaxed">{a.message}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-3">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.createdByName}</span>
                              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(a.createdAt).toLocaleDateString()}</span>
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

          {/* Detail Dialog */}
          <Dialog open={!!detailModal} onOpenChange={(open) => !open && setDetailModal(null)}>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">Complaint Details</DialogTitle></DialogHeader>
              {detailComplaint && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailComplaint.status} />
                    <Badge variant={detailComplaint.priority === "critical" ? "destructive" : "secondary"} className="text-[11px] capitalize rounded-md">{detailComplaint.priority}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{detailComplaint.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-2 leading-relaxed">{detailComplaint.description}</p>
                  </div>
                  {detailComplaint.audioAttachment && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Voice Note</p>
                      <audio controls className="w-full h-8">
                        <source src={detailComplaint.audioAttachment} />
                      </audio>
                    </div>
                  )}
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-1">Category</p><p className="capitalize font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{detailComplaint.category}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-1">Location</p><p className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{detailComplaint.location}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-1">Reported By</p><p className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{detailComplaint.createdByName}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-1">Date</p><p className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{new Date(detailComplaint.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  {/* Contact Workers — only when reviewed but no worker assigned */}
                  {detailComplaint.status === "reviewed" && !detailComplaint.assignedTo && workers.length > 0 && (
                    <>
                      <div className="h-px bg-gray-100 dark:bg-gray-800" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          No worker assigned — Contact available workers
                        </p>
                        <div className="space-y-2">
                          {workers.map((w) => (
                            <div key={w.uid} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center h-7 w-7 rounded-md bg-orange-50 dark:bg-orange-950/30 text-orange-500">
                                  <Wrench className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{w.name}</p>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">{w.specialty || "General"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                  title={`WhatsApp ${w.name}`}
                                  onClick={() => { sendWhatsAppMessage(getWhatsAppPhone(), `Hi ${w.name}, this is ${profile?.name} (HOD). We have an urgent issue: "${detailComplaint.title}" at ${detailComplaint.location}. Please check the CampusOps app for details.`); toast.success("WhatsApp message sent!"); }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <a href="tel:+919384557144">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" title={`Call ${w.name}`}>
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {detailComplaint.status === "pending" && (
                    <>
                      <div className="h-px bg-gray-100" />
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 h-9 text-sm rounded-lg" onClick={() => { setDetailModal(null); setRejectModal(detailComplaint.id); }}>
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm rounded-lg" onClick={() => { approveComplaint(detailComplaint.id); setDetailModal(null); }}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">Reject Complaint</DialogTitle></DialogHeader>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">The student will be notified.</p>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="text-sm rounded-lg" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectModal(null)} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button variant="destructive" onClick={rejectComplaint} disabled={!rejectReason} className="h-9 text-sm rounded-lg">Reject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Idea Reject Dialog */}
          <Dialog open={!!ideaRejectModal} onOpenChange={(open) => !open && setIdeaRejectModal(null)}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">Reject Idea</DialogTitle></DialogHeader>
              <p className="text-sm text-gray-500">The student will be notified.</p>
              <Textarea value={ideaRejectReason} onChange={(e) => setIdeaRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="text-sm rounded-lg" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIdeaRejectModal(null)} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button variant="destructive" disabled={!ideaRejectReason} className="h-9 text-sm rounded-lg" onClick={async () => {
                  if (!ideaRejectModal) return;
                  const idea = ideas.find((i) => i.id === ideaRejectModal);
                  await updateIdea(ideaRejectModal, { status: "rejected", rejectionReason: ideaRejectReason });
                  if (idea) await addNotification(idea.createdBy, "Idea Rejected", `Your idea "${idea.title}" was rejected: ${ideaRejectReason}`, "/dashboard/student/ideas");
                  toast.success("Idea rejected");
                  setIdeaRejectModal(null);
                  setIdeaRejectReason("");
                }}>Reject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Announcement Dialog */}
          <Dialog open={announcementModal} onOpenChange={setAnnouncementModal}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">New Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Title</label>
                  <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" className="text-sm h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Message</label>
                  <Textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} placeholder="Write your announcement..." rows={4} className="text-sm rounded-lg" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAnnouncementModal(false)} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button onClick={submitAnnouncement} disabled={!annTitle || !annMessage} className="h-9 text-sm rounded-lg">Post</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
