"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, updateTask, updateComplaint, notifyRole } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2, Clock, Zap, ListChecks, AlertTriangle, FileText, ClipboardCheck,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";
import Link from "next/link";

function getTimeRemaining(deadline: Date): { text: string; percent: number; overdue: boolean } {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const total48h = 48 * 60 * 60 * 1000;
  const diff = dl - now;
  if (diff <= 0) return { text: "OVERDUE", percent: 100, overdue: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const elapsed = total48h - diff;
  const percent = Math.min(100, Math.max(0, (elapsed / total48h) * 100));
  return { text: `${hours}h ${minutes}m left`, percent, overdue: false };
}

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const tasks = useTasks(
    profile ? { field: "workerId", value: profile.uid } : undefined
  );
  const [, setTick] = useState(0);
  const escalatedRef = useRef<Set<string>>(new Set());

  // Auto-refresh timer display every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-escalate overdue tasks
  useEffect(() => {
    const processEscalations = async () => {
      const overdue = tasks.filter(
        (t) =>
          (t.status === "accepted" || t.status === "in_progress") &&
          new Date(t.deadline) < new Date() &&
          !escalatedRef.current.has(t.id)
      );
      for (const t of overdue) {
        escalatedRef.current.add(t.id);
        try {
          await updateTask(t.id, { status: "escalated" });
          await updateComplaint(t.complaintId, { status: "escalated", escalatedAt: new Date() });
          await notifyRole("admin", "Task Auto-Escalated", `Task "${t.complaintTitle}" by ${t.workerName} missed the 48hr deadline.`, "/dashboard/admin");
        } catch { /* already escalated */ }
      }
    };
    processEscalations();
  }, [tasks]);

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "rejected");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = activeTasks.filter((t) => new Date(t.deadline) < new Date());
  const newTasks = tasks.filter((t) => t.accepted === null);

  const kpiCards = [
    { label: "Total Tasks", value: totalTasks, icon: ListChecks, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", glow: "icon-glow-indigo" },
    { label: "Active", value: activeTasks.length, icon: Zap, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", glow: "icon-glow-amber" },
    { label: "Completed", value: completedTasks.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", glow: "icon-glow-emerald" },
    { label: "Overdue", value: overdueTasks.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", glow: "icon-glow-red" },
  ];

  const quickLinks = [
    { label: "Active Tasks", href: "/dashboard/worker/tasks", icon: ClipboardCheck, count: activeTasks.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", glow: "icon-glow-amber", desc: "View and manage your current assignments" },
    { label: "Completed", href: "/dashboard/worker/completed", icon: CheckCircle2, count: completedTasks.length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", glow: "icon-glow-emerald", desc: "View your finished tasks" },
    { label: "Quotations", href: "/dashboard/worker/quotations", icon: FileText, count: tasks.filter((t) => t.quotationAmount).length, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", glow: "icon-glow-purple", desc: "Manage cost estimates" },
  ];

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Alerts */}
          {newTasks.length > 0 && (
            <Alert className="rounded-xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 animate-slide-up">
              <Zap className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                You have <strong>{newTasks.length}</strong> new task{newTasks.length !== 1 && "s"} waiting for acceptance.{" "}
                <Link href="/dashboard/worker/tasks" className="underline font-medium">View tasks</Link>
              </AlertDescription>
            </Alert>
          )}
          {overdueTasks.length > 0 && (
            <Alert variant="destructive" className="rounded-xl animate-slide-up">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>{overdueTasks.length}</strong> task{overdueTasks.length !== 1 && "s"} overdue!{" "}
                <Link href="/dashboard/worker/tasks" className="underline font-medium">Take action now</Link>
              </AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <MouseGlowCard
                  key={kpi.label}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in"
                >
                  <div className="p-6" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-xl ${kpi.bg} ${kpi.glow} flex items-center justify-center transition-shadow duration-300`}>
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

          {/* Upcoming deadlines preview */}
          {activeTasks.length > 0 && (
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  {activeTasks.slice(0, 4).map((t) => {
                    const time = getTimeRemaining(t.deadline);
                    return (
                      <Link key={t.id} href="/dashboard/worker/tasks">
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${time.overdue ? "bg-red-500" : time.percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.complaintTitle}</p>
                          </div>
                          <span className={`text-xs font-medium shrink-0 ${time.overdue ? "text-red-600" : time.percent > 75 ? "text-amber-600" : "text-gray-500"}`}>
                            {time.text}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group h-full">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`h-10 w-10 rounded-xl ${link.bg} ${link.glow} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                            <Icon className={`h-5 w-5 ${link.color}`} />
                          </div>
                          {link.count > 0 && (
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{link.count}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{link.label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{link.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
