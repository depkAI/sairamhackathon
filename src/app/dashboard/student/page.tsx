"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useFeedback, addFeedback } from "@/lib/useData";
import { Feedback } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";
import { Plus, MessageSquare, Star, Clock, FileText, TrendingUp, CheckCircle2, AlertCircle, MapPin } from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(profile ? { field: "createdBy", value: profile.uid } : undefined);
  const feedbackList = useFeedback(profile ? { field: "studentId", value: profile.uid } : undefined);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  const existingFeedback: Record<string, Feedback> = {};
  feedbackList.forEach((f) => { existingFeedback[f.complaintId] = f; });

  const submitFeedback = async () => {
    if (!profile || !feedbackModal) return;
    try {
      await addFeedback({ complaintId: feedbackModal, studentId: profile.uid, studentName: profile.name, rating, feedbackText, createdAt: new Date() });
      toast.success("Feedback submitted!");
      setFeedbackModal(null); setRating(5); setFeedbackText("");
    } catch { toast.error("Failed to submit feedback"); }
  };

  const pending = complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length;
  const resolved = complaints.filter((c) => ["completed", "verified"].includes(c.status)).length;

  const stats = [
    { label: "Total Complaints", value: complaints.length, icon: <FileText className="h-5 w-5" />, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
    { label: "In Progress", value: pending, icon: <Clock className="h-5 w-5" />, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
    { label: "Resolved", value: resolved, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
  ];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
              <p className="text-muted-foreground mt-1">Track and manage your reported issues</p>
            </div>
            <Button className="shadow-sm">
              <Link href="/dashboard/student/new-complaint"><Plus className="mr-2 h-4 w-4" /> Report Issue</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <Card key={i} className={`border-l-4 ${s.border} card-hover animate-fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold text-foreground animate-count-up">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Complaints */}
          <div className="space-y-3">
            {complaints.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <MessageSquare className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                  <h3 className="font-semibold text-foreground mb-1">No complaints yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Click &quot;Report Issue&quot; to get started</p>
                  <Button variant="outline"><Link href="/dashboard/student/new-complaint"><Plus className="mr-2 h-4 w-4" /> Report Issue</Link></Button>
                </CardContent>
              </Card>
            )}
            {complaints.map((c, i) => (
              <Link key={c.id} href={`/dashboard/student/complaint/${c.id}`} className="block">
                <Card className="card-hover border-border/50 group animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{c.title}</h3>
                          <StatusBadge status={c.status} />
                          <Badge variant={c.priority === "critical" ? "destructive" : c.priority === "high" ? "default" : "secondary"} className="text-[10px]">
                            {c.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{c.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 capitalize"><AlertCircle className="h-3 w-3" />{c.category}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {(c.status === "completed" || c.status === "verified") && !existingFeedback[c.id] && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setFeedbackModal(c.id); }} className="shrink-0">
                          <Star className="mr-1 h-3.5 w-3.5" /> Feedback
                        </Button>
                      )}
                      {existingFeedback[c.id] && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: existingFeedback[c.id].rating }).map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Feedback Dialog */}
          <Dialog open={!!feedbackModal} onOpenChange={(open) => !open && setFeedbackModal(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Rate Resolution Quality</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                      <Star className={`h-8 w-8 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="How was the resolution?" rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeedbackModal(null)}>Cancel</Button>
                <Button onClick={submitFeedback}>Submit Feedback</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
