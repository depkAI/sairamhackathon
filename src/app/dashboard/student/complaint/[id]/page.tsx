"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useComplaints, useTasks, useFeedback } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sendWhatsAppMessage, getWhatsAppPhone } from "@/lib/whatsapp";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  Building,
  Tag,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  IndianRupee,
  FileText,
  Circle,
  User,
  CalendarClock,
  MessageSquare,
  Phone,
} from "lucide-react";

const BASE_STEPS = [
  { key: "pending", label: "Submitted", description: "Your complaint has been received" },
  { key: "reviewed", label: "Reviewed by HOD", description: "Department head has reviewed the issue" },
  { key: "assigned", label: "Worker Assigned", description: "A maintenance worker has been assigned" },
  { key: "in_progress", label: "In Progress", description: "Work is currently underway" },
];

const QUOTATION_STEPS = [
  { key: "quotation_submitted", label: "Quotation Submitted", description: "Worker submitted a cost estimate for approval" },
  { key: "quotation_approved", label: "Quotation Approved", description: "Admin approved the quotation — work proceeding" },
];

const FINAL_STEPS = [
  { key: "completed", label: "Completed", description: "The issue has been resolved" },
  { key: "verified", label: "Verified", description: "Resolution has been verified by admin" },
];

function getStatusSteps(complaintStatus: string, hasQuotation: boolean) {
  const showQuotation = hasQuotation ||
    ["quotation_submitted", "quotation_approved"].includes(complaintStatus);
  if (showQuotation) {
    return [...BASE_STEPS, ...QUOTATION_STEPS, ...FINAL_STEPS];
  }
  return [...BASE_STEPS, ...FINAL_STEPS];
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );
  const allTasks = useTasks();
  const allFeedback = useFeedback();

  const complaint = complaints.find((c) => c.id === id);
  const task = allTasks.find((t) => t.complaintId === id);
  const feedback = allFeedback.find((f) => f.complaintId === id);

  if (!complaint) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="max-w-3xl mx-auto text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Complaint not found
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This complaint may have been removed or you don&apos;t have access.
            </p>
            <Button variant="outline">
              <Link href="/dashboard/student">Back to Dashboard</Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const hasQuotation = task?.quotationAmount != null;
  const statusSteps = getStatusSteps(complaint.status, hasQuotation);

  const currentStepIndex =
    complaint.status === "rejected" || complaint.status === "escalated"
      ? -1
      : statusSteps.findIndex((s) => s.key === complaint.status);

  const progressPercent =
    complaint.status === "rejected" || complaint.status === "escalated"
      ? 0
      : ((currentStepIndex + 1) / statusSteps.length) * 100;

  const priorityConfig: Record<string, { color: string; bg: string }> = {
    critical: {
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-500/10 border-red-200 dark:border-red-800",
    },
    high: {
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-200 dark:border-amber-800",
    },
    medium: {
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-200 dark:border-blue-800",
    },
    low: {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800",
    },
  };

  const pConfig = priorityConfig[complaint.priority] || priorityConfig.medium;

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back */}
          <Button variant="ghost" size="sm" className="-ml-2">
            <Link
              href="/dashboard/student"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          {/* Header Card */}
          <Card className="shadow-sm overflow-hidden">
            {complaint.status !== "rejected" && complaint.status !== "escalated" && (
              <div className="h-1 bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-3 flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground leading-tight">
                    {complaint.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={complaint.status} />
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${pConfig.bg} ${pConfig.color}`}
                    >
                      {complaint.priority} priority
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {complaint.description}
              </p>

              {complaint.audioAttachment && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Voice Note
                  </p>
                  <audio controls className="w-full h-8">
                    <source src={complaint.audioAttachment} />
                  </audio>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    icon: Tag,
                    label: "Category",
                    value: complaint.category,
                    capitalize: true,
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: complaint.location,
                  },
                  {
                    icon: Building,
                    label: "Department",
                    value: complaint.department,
                  },
                  {
                    icon: Clock,
                    label: "Reported",
                    value: new Date(complaint.createdAt).toLocaleDateString(),
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="bg-muted/50 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-medium text-foreground ${
                          item.capitalize ? "capitalize" : ""
                        }`}
                      >
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {complaint.status !== "rejected" && complaint.status !== "escalated" && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="relative">
                  {statusSteps.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    const isLast = i === statusSteps.length - 1;

                    return (
                      <div key={step.key} className="flex gap-4 relative">
                        {!isLast && (
                          <div className="absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]">
                            <div
                              className={`w-full h-full ${
                                i < currentStepIndex
                                  ? "bg-emerald-500"
                                  : "bg-muted"
                              }`}
                            />
                          </div>
                        )}

                        <div className="shrink-0 relative z-10">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                              isCompleted
                                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                                : "bg-muted text-muted-foreground"
                            } ${
                              isCurrent
                                ? "ring-[3px] ring-emerald-500/20 ring-offset-2 ring-offset-background"
                                : ""
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>

                        <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                          <p
                            className={`text-sm font-medium ${
                              isCompleted
                                ? "text-foreground"
                                : "text-muted-foreground"
                            } ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Alert */}
          {complaint.status === "rejected" && complaint.rejectionReason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Complaint Rejected</AlertTitle>
              <AlertDescription>{complaint.rejectionReason}</AlertDescription>
            </Alert>
          )}

          {/* Escalation Alert */}
          {complaint.status === "escalated" && (
            <Alert variant="destructive" className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-300">Complaint Escalated</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                The assigned worker missed the 48-hour deadline. This complaint has been escalated to the admin for reassignment.
              </AlertDescription>
            </Alert>
          )}

          {/* Assigned Worker */}
          {task && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Assigned Worker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {task.workerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {task.workerName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Deadline:{" "}
                      {new Date(task.deadline).toLocaleString()}
                    </p>
                  </div>
                  {(() => {
                    const isNotAccepted = task.accepted !== true;
                    const isOverdue = new Date(task.deadline).getTime() < Date.now();
                    const canMessage = isNotAccepted || isOverdue;
                    if (!canMessage) return null;

                    const storageKey = `whatsapp-sent-${complaint.id}`;
                    const alreadySent = typeof window !== "undefined" && localStorage.getItem(storageKey) === "true";
                    if (alreadySent) {
                      return (
                        <Badge variant="secondary" className="text-xs text-muted-foreground gap-1 shrink-0">
                          <Phone className="h-3 w-3" />
                          Message Sent
                        </Badge>
                      );
                    }

                    const message = `Hi ${task.workerName}, I'm following up on my complaint:\n\n*${complaint.title}*\nCategory: ${complaint.category}\nLocation: ${complaint.location}\nDepartment: ${complaint.department}\n\nDetails: ${complaint.description}\n\nPlease update me on the progress. Thank you!`;
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 shrink-0"
                        onClick={async () => {
                          const result = await sendWhatsAppMessage(getWhatsAppPhone(), message);
                          if (result.success) {
                            localStorage.setItem(storageKey, "true");
                            toast.success(result.fallback ? "WhatsApp opened" : "WhatsApp message sent!");
                          }
                        }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    );
                  })()}
                </div>

                {task.quotationAmount != null && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                      <IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Quotation: {task.quotationAmount}
                      </p>
                      {task.quotationNote && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {task.quotationNote}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {task.notes && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Completion Notes
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {feedback && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Your Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < feedback.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/20"
                        }
                      />
                    ))}
                    <span className="text-sm font-medium text-foreground ml-2">
                      {feedback.rating}/5
                    </span>
                  </div>
                  {feedback.feedbackText && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      &ldquo;{feedback.feedbackText}&rdquo;
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
