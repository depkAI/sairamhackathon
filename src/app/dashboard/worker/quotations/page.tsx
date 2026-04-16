"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, updateTask, updateComplaint, notifyRole } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  FileText,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Plus,
  AlertCircle,
  Inbox,
  Receipt,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

export default function QuotationsPage() {
  const { profile } = useAuth();
  const tasks = useTasks(
    profile ? { field: "workerId", value: profile.uid } : undefined
  );

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tasks that can have a quotation generated
  const eligibleTasks = tasks.filter(
    (t) =>
      t.status === "accepted" ||
      t.status === "in_progress" ||
      (t.status === "assigned" && t.quotationApproved === false)
  );

  // Submitted quotations (pending approval)
  const pendingQuotations = tasks.filter(
    (t) => t.status === "quotation_submitted"
  );

  // Approved quotations
  const approvedQuotations = tasks.filter(
    (t) => t.quotationApproved === true && t.quotationAmount != null
  );

  // Rejected quotations (already resubmitted or waiting)
  const rejectedQuotations = tasks.filter(
    (t) => t.quotationApproved === false && t.status !== "quotation_submitted" && t.quotationAmount != null
  );

  const handleSubmit = async () => {
    if (!selectedTask || !amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }
    setSubmitting(true);
    const task = tasks.find((t) => t.id === selectedTask);
    try {
      await updateTask(selectedTask, {
        quotationAmount: parsed,
        quotationNote: note,
        status: "quotation_submitted",
      });
      if (task) {
        await updateComplaint(task.complaintId, { status: "quotation_submitted" });
      }
      await notifyRole(
        "admin",
        "Quotation Submitted",
        `${profile?.name} submitted ₹${parsed} for "${task?.complaintTitle}"`,
        "/dashboard/admin"
      );
      toast.success("Quotation sent to admin for approval!");
      setSelectedTask(null);
      setAmount("");
      setNote("");
    } catch {
      toast.error("Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: "Pending Approval", value: pendingQuotations.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Approved", value: approvedQuotations.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Rejected", value: rejectedQuotations.length, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  ];

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Quotations
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and track quotations for your assigned tasks
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <MouseGlowCard
                  key={s.label}
                  className={`rounded-2xl border-0 ${s.bg} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in`}
                >
                  <div className="p-5 flex items-center gap-4" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </MouseGlowCard>
              );
            })}
          </div>

          <Separator />

          {/* Generate New Quotation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Generate Quotation
              </h2>
            </div>

            {eligibleTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-1">
                    No tasks need a quotation
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Accept a task first, then you can generate a quotation for materials and labor costs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">New Quotation</CardTitle>
                  <CardDescription>Select a task and fill in the cost breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Task Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Task</Label>
                    <div className="grid gap-2">
                      {eligibleTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTask(t.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                            selectedTask === t.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedTask === t.id
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {t.complaintTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              Status: {t.status.replace(/_/g, " ")}
                              {t.quotationApproved === false && " (previous quotation rejected)"}
                            </p>
                          </div>
                          {selectedTask === t.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTask && (
                    <>
                      <Separator />

                      {/* Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="q-amount" className="text-sm font-medium">
                          Estimated Amount (INR)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            ₹
                          </span>
                          <Input
                            id="q-amount"
                            type="number"
                            min="1"
                            max="10000000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-8 h-11 text-lg font-semibold"
                          />
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-2">
                        <Label htmlFor="q-note" className="text-sm font-medium">
                          Materials & Work Breakdown
                        </Label>
                        <Textarea
                          id="q-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={"e.g.\n- 2x LED tube lights: ₹400\n- Wiring kit: ₹200\n- Labor (2 hrs): ₹500\n- Total: ₹1,100"}
                          rows={5}
                          className="resize-none text-sm"
                        />
                      </div>

                      {/* Submit */}
                      <Button
                        onClick={handleSubmit}
                        disabled={!amount || submitting}
                        className="w-full h-11 text-sm font-medium"
                        size="lg"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Submitting...
                          </span>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Quotation to Admin
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* Pending Quotations */}
          {pendingQuotations.length > 0 && (
            <>
              <Separator />
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Pending Approval
                  </h2>
                  <Badge variant="secondary" className="ml-auto">
                    {pendingQuotations.length}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {pendingQuotations.map((t) => (
                    <Card key={t.id} className="rounded-2xl border-amber-100 dark:border-amber-900/30">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                              <Receipt className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.complaintTitle}</p>
                              {t.quotationNote && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{t.quotationNote}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Waiting for admin approval
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-foreground flex items-center">
                              <IndianRupee className="h-4 w-4" />
                              {t.quotationAmount?.toLocaleString()}
                            </p>
                            <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-200 dark:border-amber-800">
                              Pending
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Approved Quotations */}
          {approvedQuotations.length > 0 && (
            <>
              <Separator />
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Approved
                  </h2>
                  <Badge variant="secondary" className="ml-auto text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-0">
                    {approvedQuotations.length}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {approvedQuotations.map((t) => (
                    <Card key={t.id} className="rounded-2xl border-emerald-100 dark:border-emerald-900/30">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.complaintTitle}</p>
                              {t.quotationNote && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.quotationNote}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                              <IndianRupee className="h-4 w-4" />
                              {t.quotationAmount?.toLocaleString()}
                            </p>
                            <Badge className="mt-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                              Approved
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Rejected Quotations */}
          {rejectedQuotations.length > 0 && (
            <>
              <Separator />
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Rejected
                  </h2>
                  <Badge variant="destructive" className="ml-auto">
                    {rejectedQuotations.length}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {rejectedQuotations.map((t) => (
                    <Card key={t.id} className="rounded-2xl border-red-100 dark:border-red-900/30">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                              <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.complaintTitle}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Rejected by admin — you can resubmit from the form above
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-red-500 line-through flex items-center">
                              <IndianRupee className="h-4 w-4" />
                              {t.quotationAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
