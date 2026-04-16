"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useTasks } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Activity,
  MapPin,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Timer,
  AlertTriangle,
  Inbox,
} from "lucide-react";

const progressMap: Record<string, number> = {
  pending: 10,
  reviewed: 25,
  assigned: 40,
  in_progress: 60,
  quotation_submitted: 70,
  quotation_approved: 80,
  completed: 95,
};

export default function LiveTrackingPage() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );
  const allTasks = useTasks();

  const activeComplaints = complaints.filter(
    (c) => !["completed", "verified", "rejected"].includes(c.status)
  );

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-indigo-500 animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Live Tracking
            </h1>
            {activeComplaints.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeComplaints.length} active
              </Badge>
            )}
          </div>

          {/* Empty State */}
          {activeComplaints.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="py-20 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  All clear! No active issues
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You have no complaints currently being processed. All your
                  issues have been resolved or are awaiting submission.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Active Complaint Cards */}
          <div className="space-y-3">
            {activeComplaints.map((c) => {
              const task = allTasks.find(
                (t) => t.complaintId === c.id && t.status !== "rejected"
              );

              const statusLabels: Record<string, string> = {
                pending: "Waiting for HOD review",
                reviewed:
                  "Reviewed by HOD \u2014 awaiting worker assignment",
                assigned: task
                  ? `Assigned to ${task.workerName} \u2014 awaiting acceptance`
                  : "Worker being assigned",
                in_progress: task
                  ? `${task.workerName} is working on it`
                  : "Work in progress",
                quotation_submitted: task
                  ? `${task.workerName} submitted quotation (\u20B9${task.quotationAmount}) \u2014 awaiting admin approval`
                  : "Quotation under review",
                quotation_approved: task
                  ? `Quotation approved \u2014 ${task.workerName} proceeding`
                  : "Quotation approved",
                escalated:
                  "Escalated to admin \u2014 deadline was missed",
              };

              const progressPct = progressMap[c.status] ?? 10;

              const deadlineInfo = task?.deadline
                ? (() => {
                    const diff =
                      new Date(task.deadline).getTime() - Date.now();
                    if (diff <= 0)
                      return { text: "OVERDUE", overdue: true };
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const mins = Math.floor(
                      (diff % (1000 * 60 * 60)) / (1000 * 60)
                    );
                    return {
                      text: `${hours}h ${mins}m remaining`,
                      overdue: false,
                    };
                  })()
                : null;

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/student/complaint/${c.id}`}
                  className="block group"
                >
                  <Card
                    className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                      c.status === "escalated"
                        ? "border-red-200 bg-red-50/30"
                        : ""
                    }`}
                  >
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
                            {statusLabels[c.status] ||
                              c.status.replace(/_/g, " ")}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1" />
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{progressPct}%</span>
                        </div>
                        <Progress
                          value={progressPct}
                          className={`h-2 rounded-full ${
                            c.status === "escalated"
                              ? "[&>div]:bg-red-500"
                              : "[&>div]:bg-indigo-500"
                          }`}
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
                          <span
                            className={`flex items-center gap-1.5 ${
                              deadlineInfo.overdue
                                ? "text-red-600 font-medium"
                                : ""
                            }`}
                          >
                            {deadlineInfo.overdue ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <Timer className="h-3.5 w-3.5" />
                            )}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
