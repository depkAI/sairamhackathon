"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useFeedback, addFeedback, useAnnouncements, useTasks } from "@/lib/useData";
import { Feedback } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Star,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Inbox,
  TrendingUp,
  MessageSquare,
  Megaphone,
  User,
  CalendarDays,
  Activity,
  UserCheck,
  Timer,
  AlertTriangle,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );
  const feedbackList = useFeedback(
    profile ? { field: "studentId", value: profile.uid } : undefined
  );
  const allTasks = useTasks();
  const announcements = useAnnouncements(profile?.department);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  const existingFeedback: Record<string, Feedback> = {};
  feedbackList.forEach((f) => {
    existingFeedback[f.complaintId] = f;
  });

  const submitFeedback = async () => {
    if (!profile || !feedbackModal) return;
    try {
      await addFeedback({
        complaintId: feedbackModal,
        studentId: profile.uid,
        studentName: profile.name,
        rating,
        feedbackText,
        createdAt: new Date(),
      });
      toast.success("Feedback submitted!");
      setFeedbackModal(null);
      setRating(5);
      setFeedbackText("");
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  const pending = complaints.filter(
    (c) => !["completed", "verified", "rejected"].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) =>
    ["completed", "verified"].includes(c.status)
  ).length;

  const stats = [
    {
      label: "Total Issues",
      value: complaints.length,
      icon: FileText,
      gradient: "from-violet-500/10 to-purple-500/5",
      iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
    {
      label: "In Progress",
      value: pending,
      icon: Clock,
      gradient: "from-amber-500/10 to-orange-500/5",
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      gradient: "from-emerald-500/10 to-green-500/5",
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                My Complaints
              </h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your reported campus issues
              </p>
            </div>
            <Link href="/dashboard/student/new-complaint">
              <Button size="lg" className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <MouseGlowCard
                  key={i}
                  className={`overflow-hidden border-0 rounded-2xl shadow-sm bg-gradient-to-br ${s.gradient} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in`}
                >
                  <div className="p-5 flex items-center gap-4" style={{ animationDelay: `${i * 80}ms` }}>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.iconBg} shrink-0`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {s.label}
                      </p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {s.value}
                      </p>
                    </div>
                  </div>
                </MouseGlowCard>
              );
            })}
          </div>

          {/* Live Tracking Section */}
          {complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Live Tracking
                  </h2>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length} active
                  </Badge>
                </div>
                <div className="space-y-3">
                  {complaints
                    .filter((c) => !["completed", "verified", "rejected"].includes(c.status))
                    .map((c) => {
                      const task = allTasks.find((t) => t.complaintId === c.id && t.status !== "rejected");
                      const statusLabels: Record<string, string> = {
                        pending: "Waiting for HOD review",
                        reviewed: "Reviewed by HOD — awaiting worker assignment",
                        assigned: task ? `Assigned to ${task.workerName} — awaiting acceptance` : "Worker being assigned",
                        in_progress: task ? `${task.workerName} is working on it` : "Work in progress",
                        quotation_submitted: task ? `${task.workerName} submitted quotation (₹${task.quotationAmount}) — awaiting admin approval` : "Quotation under review",
                        quotation_approved: task ? `Quotation approved — ${task.workerName} proceeding` : "Quotation approved",
                        escalated: "Escalated to admin — deadline was missed",
                      };
                      const stageOrder = ["pending", "reviewed", "assigned", "in_progress", "completed"];
                      const stageIdx = stageOrder.indexOf(
                        c.status === "quotation_submitted" || c.status === "quotation_approved" ? "in_progress" : c.status === "escalated" ? "in_progress" : c.status
                      );
                      const progressPct = Math.max(10, ((stageIdx + 1) / stageOrder.length) * 100);
                      const deadlineInfo = task?.deadline ? (() => {
                        const diff = new Date(task.deadline).getTime() - Date.now();
                        if (diff <= 0) return { text: "OVERDUE", overdue: true };
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return { text: `${hours}h ${mins}m remaining`, overdue: false };
                      })() : null;

                      return (
                        <Link key={c.id} href={`/dashboard/student/complaint/${c.id}`} className="block group">
                          <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.status === "escalated" ? "border-red-200 bg-red-50/30" : ""}`}>
                            <CardContent className="p-4 sm:p-5 space-y-3">
                              {/* Title row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                      {c.title}
                                    </h3>
                                    <StatusBadge status={c.status} />
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {statusLabels[c.status] || c.status.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1" />
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{Math.round(progressPct)}%</span>
                                </div>
                                <Progress
                                  value={progressPct}
                                  className={`h-2 rounded-full ${c.status === "escalated" ? "[&>div]:bg-red-500" : "[&>div]:bg-indigo-50 dark:bg-indigo-950/300"}`}
                                />
                              </div>

                              {/* Worker & deadline info */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                {task && (
                                  <span className="flex items-center gap-1.5">
                                    <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                                    {task.workerName}
                                  </span>
                                )}
                                {deadlineInfo && (
                                  <span className={`flex items-center gap-1.5 ${deadlineInfo.overdue ? "text-red-600 font-medium" : ""}`}>
                                    {deadlineInfo.overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
                                    {deadlineInfo.text}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {c.location}
                                </span>
                                <span className="flex items-center gap-1.5 capitalize">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {c.category}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Complaints List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                All Complaints
              </h2>
              {complaints.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {complaints.length} total
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Empty State */}
              {complaints.length === 0 && (
                <Card className="border-dashed border-2">
                  <CardContent className="py-20 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                      <Inbox className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      No complaints yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                      You haven't reported any issues. Start by reporting your
                      first campus maintenance issue.
                    </p>
                    <Button>
                      <Link href="/dashboard/student/new-complaint">
                        <Plus className="mr-2 h-4 w-4" />
                        Report Your First Issue
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Complaint Cards */}
              {complaints.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/student/complaint/${c.id}`}
                  className="block group"
                >
                  <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {c.title}
                            </h3>
                            <StatusBadge status={c.status} />
                            <Badge
                              variant={
                                c.priority === "critical"
                                  ? "destructive"
                                  : c.priority === "high"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs font-medium"
                            >
                              {c.priority}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                            {c.description}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5 capitalize">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {c.category}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {c.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            {c.assignedToName && (
                              <span className="flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                                {c.assignedToName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          {(c.status === "completed" ||
                            c.status === "verified") &&
                            !existingFeedback[c.id] && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFeedbackModal(c.id);
                                }}
                              >
                                <Star className="h-3.5 w-3.5" />
                                Rate
                              </Button>
                            )}
                          {existingFeedback[c.id] && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({
                                length: existingFeedback[c.id].rating,
                              }).map((_, j) => (
                                <Star
                                  key={j}
                                  className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                                />
                              ))}
                            </div>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Announcements Section */}
          {announcements.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-indigo-500" />
                      Department Announcements
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-6">{announcements.length} announcement{announcements.length !== 1 && "s"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((a, i) => (
                    <Card key={a.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                            <Megaphone className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{a.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-1.5 leading-relaxed">{a.message}</p>
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
              </div>
            </>
          )}

          {/* Feedback Dialog */}
          <Dialog
            open={!!feedbackModal}
            onOpenChange={(open) => {
              if (!open) {
                setFeedbackModal(null);
                setRating(5);
                setFeedbackText("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Rate Resolution Quality
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Star Rating */}
                <div>
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    How would you rate the resolution?
                  </p>
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className="p-1 rounded-lg transition-all hover:scale-125 hover:bg-amber-50 dark:hover:bg-amber-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Star
                          className={`h-9 w-9 transition-colors ${
                            n <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/20 hover:text-amber-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm font-medium mt-2 text-foreground">
                    {rating === 1
                      ? "Poor"
                      : rating === 2
                      ? "Fair"
                      : rating === 3
                      ? "Good"
                      : rating === 4
                      ? "Very Good"
                      : "Excellent"}
                  </p>
                </div>
                <Separator />
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts on the resolution..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  onClick={() => setFeedbackModal(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitFeedback}>Submit Feedback</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
