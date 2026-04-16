"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  updateComplaint,
  addNotification,
  useWorkers,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { sendWhatsAppMessage, getWhatsAppPhone } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, AlertCircle, Eye, Inbox, MessageCircle,
  Phone, Wrench,
} from "lucide-react";

export default function HODComplaintsPage() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const workers = useWorkers();

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredComplaints = filterMonth === "all" ? complaints : complaints.filter((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === filterMonth;
  });

  const total = filteredComplaints.length;
  const pendingCount = filteredComplaints.filter((c) => c.status === "pending").length;

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

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
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
                  {/* Contact Workers */}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
