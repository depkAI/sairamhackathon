"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useWorkers,
  updateComplaint,
  addNotification,
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
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, AlertCircle, Activity, MapPin, Clock,
  User, ArrowUpRight, MessageCircle, Phone, Wrench,
} from "lucide-react";

export default function HODLivePage() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const workers = useWorkers();

  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const liveComplaints = complaints
    .filter((c) => !["completed", "verified", "rejected"].includes(c.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const detailComplaint = detailModal ? liveComplaints.find((c) => c.id === detailModal) : null;

  const approveComplaint = async (id: string) => {
    const c = liveComplaints.find((x) => x.id === id);
    try {
      await updateComplaint(id, { status: "reviewed" });
      if (c) await addNotification(c.createdBy, "Complaint Reviewed", `"${c.title}" approved by HOD.`, "/dashboard/student");
      toast.success("Approved!");
    } catch { toast.error("Failed"); }
  };

  const rejectComplaint = async () => {
    if (!rejectModal) return;
    const c = liveComplaints.find((x) => x.id === rejectModal);
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
