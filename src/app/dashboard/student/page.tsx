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
} from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );
  const feedbackList = useFeedback(
    profile ? { field: "studentId", value: profile.uid } : undefined
  );
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
            <Button size="lg" className="shadow-sm">
              <Link href="/dashboard/student/new-complaint">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card
                  key={i}
                  className={`overflow-hidden border-0 shadow-sm bg-gradient-to-br ${s.gradient}`}
                >
                  <CardContent className="p-5 flex items-center gap-4">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
                              className="text-[10px] font-medium"
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

          {/* Feedback Dialog */}
          <Dialog
            open={!!feedbackModal}
            onOpenChange={(open) => !open && setFeedbackModal(null)}
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
