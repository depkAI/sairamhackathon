"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useAnnouncements, addAnnouncement, updateComplaint, addNotification } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, BarChart3, Clock, AlertCircle, Activity, Megaphone, Building, MapPin, Wrench, FileText, Plus, Eye } from "lucide-react";

export default function HODDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(profile ? { field: "department", value: profile.department } : undefined);
  const announcements = useAnnouncements(profile?.department);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [tab, setTab] = useState<"dashboard" | "complaints" | "live" | "updates">("dashboard");

  const total = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const resolvedCount = complaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const inProgress = complaints.filter((c) => ["assigned", "in_progress", "quotation_submitted", "quotation_approved"].includes(c.status)).length;
  const critical = complaints.filter((c) => c.priority === "critical" && !["completed", "verified", "rejected"].includes(c.status)).length;
  const reviewed = complaints.filter((c) => c.status === "reviewed").length;

  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  const liveComplaints = complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const detailComplaint = detailModal ? complaints.find((c) => c.id === detailModal) : null;

  const approveComplaint = async (id: string) => {
    const c = complaints.find((x) => x.id === id);
    try {
      await updateComplaint(id, { status: "reviewed" });
      if (c) await addNotification(c.createdBy, "Complaint Reviewed", `"${c.title}" approved by HOD.`, "/dashboard/student");
      toast.success("Approved!");
    } catch { toast.error("Failed"); }
  };

  const rejectComplaint = async () => {
    if (!rejectModal) return;
    const c = complaints.find((x) => x.id === rejectModal);
    try {
      await updateComplaint(rejectModal, { status: "rejected", rejectionReason: rejectReason });
      if (c) await addNotification(c.createdBy, "Complaint Rejected", `"${c.title}" rejected: ${rejectReason}`, "/dashboard/student");
      toast.success("Rejected"); setRejectModal(null); setRejectReason("");
    } catch { toast.error("Failed"); }
  };

  const submitAnnouncement = async () => {
    if (!profile || !annTitle || !annMessage) return;
    try {
      await addAnnouncement({ department: profile.department, title: annTitle, message: annMessage, createdBy: profile.uid, createdByName: profile.name, createdAt: new Date() });
      toast.success("Announcement posted!"); setAnnouncementModal(false); setAnnTitle(""); setAnnMessage("");
    } catch { toast.error("Failed"); }
  };

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "complaints", label: "Complaints", icon: <FileText className="h-4 w-4" /> },
    { key: "live", label: "Live Progress", icon: <Activity className="h-4 w-4" /> },
    { key: "updates", label: "Updates", icon: <Megaphone className="h-4 w-4" /> },
  ] as const;

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Department Dashboard</h1>
            <p className="text-muted-foreground mt-1">{profile?.department}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="gap-1.5 whitespace-nowrap">{t.icon}{t.label}</Button>
            ))}
          </div>

          {/* ====== DASHBOARD ====== */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total", value: total, icon: <BarChart3 className="h-5 w-5" />, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
                  { label: "Pending", value: pendingCount, icon: <Clock className="h-5 w-5" />, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
                  { label: "Reviewed", value: reviewed, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-indigo-600 bg-indigo-50", border: "border-l-indigo-500" },
                  { label: "Resolved", value: resolvedCount, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
                  { label: "Critical", value: critical, icon: <AlertCircle className="h-5 w-5" />, color: "text-red-600 bg-red-50", border: "border-l-red-500" },
                ].map((s, i) => (
                  <Card key={i} className={`border-l-4 ${s.border} card-hover`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                      <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Resolution Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{resolvedCount} resolved of {total}</span>
                    <span className="font-semibold">{total > 0 ? Math.round((resolvedCount / total) * 100) : 0}%</span>
                  </div>
                  <Progress value={total > 0 ? (resolvedCount / total) * 100 : 0} className="h-3" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-purple-500" /> Category Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                      <div key={cat} className="text-center p-3 rounded-lg bg-muted/50 border">
                        <div className="text-xl font-bold text-foreground">{count}</div>
                        <div className="text-xs text-muted-foreground capitalize mt-1">{cat}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ====== COMPLAINTS ====== */}
          {tab === "complaints" && (
            <div className="space-y-3">
              {complaints.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No complaints.</CardContent></Card>}
              {complaints.map((c) => (
                <Card key={c.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{c.title}</h3>
                          <StatusBadge status={c.status} />
                          <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{c.priority}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{c.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>By: {c.createdByName}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                          <span className="capitalize flex items-center gap-1"><Wrench className="h-3 w-3" />{c.category}</span>
                          <span><Clock className="h-3 w-3 inline mr-1" />{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        {c.rejectionReason && <p className="mt-2 text-sm text-red-600">Rejection: {c.rejectionReason}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setDetailModal(c.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        {c.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => approveComplaint(c.id)}><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setRejectModal(c.id)}><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ====== LIVE PROGRESS ====== */}
          {tab === "live" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500 animate-pulse" /> Live — Active Issues ({liveComplaints.length})</CardTitle></CardHeader>
              <CardContent>
                {liveComplaints.length === 0 && <p className="text-center py-8 text-muted-foreground">All clear in your department!</p>}
                <div className="space-y-2">
                  {liveComplaints.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDetailModal(c.id)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{c.title}</span>
                        <StatusBadge status={c.status} />
                        <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{c.priority}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>By: {c.createdByName}</span>
                        <span><MapPin className="h-3 w-3 inline mr-1" />{c.location}</span>
                        {c.assignedToName && <span>Worker: {c.assignedToName}</span>}
                        <span><Clock className="h-3 w-3 inline mr-1" />Updated {new Date(c.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ====== UPDATES / ANNOUNCEMENTS ====== */}
          {tab === "updates" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Department Announcements</h2>
                <Button size="sm" onClick={() => setAnnouncementModal(true)}><Plus className="mr-1 h-3.5 w-3.5" /> New</Button>
              </div>
              {announcements.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>}
              {announcements.map((a) => (
                <Card key={a.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-semibold text-foreground">{a.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{a.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">By {a.createdByName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Complaint Detail Dialog */}
          <Dialog open={!!detailModal} onOpenChange={(open) => !open && setDetailModal(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
              {detailComplaint && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailComplaint.status} />
                    <Badge variant={detailComplaint.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">{detailComplaint.priority}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{detailComplaint.title}</h3>
                  <p className="text-muted-foreground text-sm">{detailComplaint.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Category:</span> <span className="capitalize font-medium">{detailComplaint.category}</span></div>
                    <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{detailComplaint.location}</span></div>
                    <div><span className="text-muted-foreground">Reported By:</span> <span className="font-medium">{detailComplaint.createdByName}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(detailComplaint.createdAt).toLocaleDateString()}</span></div>
                    {detailComplaint.assignedToName && <div><span className="text-muted-foreground">Assigned:</span> <span className="font-medium">{detailComplaint.assignedToName}</span></div>}
                  </div>
                  {detailComplaint.rejectionReason && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">Rejection: {detailComplaint.rejectionReason}</div>}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Reject Complaint</DialogTitle></DialogHeader>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
                <Button variant="destructive" onClick={rejectComplaint} disabled={!rejectReason}>Reject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Announcement Dialog */}
          <Dialog open={announcementModal} onOpenChange={setAnnouncementModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" />
                <Textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} placeholder="Message..." rows={4} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAnnouncementModal(false)}>Cancel</Button>
                <Button onClick={submitAnnouncement} disabled={!annTitle || !annMessage}>Post</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
