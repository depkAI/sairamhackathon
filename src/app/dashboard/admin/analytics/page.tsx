"use client";

import { useComplaints, useTasks, useWorkers, useFeedback, useIdeas } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, Users,
  Star, Wrench, Building, FileText, Lightbulb, Shield,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";

export default function AnalyticsPage() {
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();
  const feedback = useFeedback();
  const ideas = useIdeas();

  const total = complaints.length;
  const solved = complaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter((c) => ["assigned", "in_progress", "quotation_submitted", "quotation_approved"].includes(c.status)).length;
  const rejected = complaints.filter((c) => c.status === "rejected").length;
  const escalated = complaints.filter((c) => c.status === "escalated").length;
  const resolutionPct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const overdueTasks = tasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length;

  // Priority distribution
  const priorities = (["critical", "high", "medium", "low"] as const).map((p) => ({
    label: p,
    count: complaints.filter((c) => c.priority === p).length,
    color: p === "critical" ? "bg-red-500" : p === "high" ? "bg-amber-500" : p === "medium" ? "bg-blue-500" : "bg-emerald-500",
    textColor: p === "critical" ? "text-red-600" : p === "high" ? "text-amber-600" : p === "medium" ? "text-blue-600" : "text-emerald-600",
    bg: p === "critical" ? "bg-red-50 dark:bg-red-950/30" : p === "high" ? "bg-amber-50 dark:bg-amber-950/30" : p === "medium" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-emerald-50 dark:bg-emerald-950/30",
  }));

  // Department stats
  const deptStats: Record<string, { total: number; solved: number }> = {};
  complaints.forEach((c) => {
    if (!deptStats[c.department]) deptStats[c.department] = { total: 0, solved: 0 };
    deptStats[c.department].total++;
    if (c.status === "completed" || c.status === "verified") deptStats[c.department].solved++;
  });

  // Category stats
  const catStats: Record<string, number> = {};
  complaints.forEach((c) => { catStats[c.category] = (catStats[c.category] || 0) + 1; });

  // Worker performance
  const workerPerf = workers.map((w) => {
    const wTasks = tasks.filter((t) => t.workerId === w.uid);
    const done = wTasks.filter((t) => t.status === "completed").length;
    const wFeedback = feedback.filter((f) => wTasks.some((t) => t.complaintId === f.complaintId));
    const avg = wFeedback.length > 0 ? wFeedback.reduce((s, f) => s + f.rating, 0) / wFeedback.length : 0;
    return { name: w.name, specialty: w.specialty || w.department, total: wTasks.length, done, avg, rate: wTasks.length > 0 ? Math.round((done / wTasks.length) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);

  // Average feedback rating
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "N/A";

  const kpis = [
    { label: "Resolution Rate", value: `${resolutionPct}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Overdue Tasks", value: overdueTasks, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Total Ideas", value: ideas.length, icon: Lightbulb, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Active Workers", value: workers.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Escalated", value: escalated, icon: Shield, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Comprehensive campus operations insights</p>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <MouseGlowCard key={kpi.label} className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-scale-in">
                  <div className="p-4 text-center" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                  </div>
                </MouseGlowCard>
              );
            })}
          </div>

          {/* Status Overview + Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Complaint Status Overview
                </CardTitle>
                <CardDescription>{total} total complaints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Solved", count: solved, color: "bg-emerald-500", pct: total > 0 ? (solved / total) * 100 : 0 },
                  { label: "In Progress", count: inProgress, color: "bg-blue-500", pct: total > 0 ? (inProgress / total) * 100 : 0 },
                  { label: "Pending", count: pending, color: "bg-amber-500", pct: total > 0 ? (pending / total) * 100 : 0 },
                  { label: "Rejected", count: rejected, color: "bg-red-500", pct: total > 0 ? (rejected / total) * 100 : 0 },
                  { label: "Escalated", count: escalated, color: "bg-orange-500", pct: total > 0 ? (escalated / total) * 100 : 0 },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="text-muted-foreground font-mono">{s.count} ({Math.round(s.pct)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" /> Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {priorities.map((p) => (
                    <div key={p.label} className={`${p.bg} rounded-xl p-4 text-center`}>
                      <p className={`text-3xl font-bold ${p.textColor}`}>{p.count}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{p.label}</p>
                    </div>
                  ))}
                </div>
                {total > 0 && (
                  <div className="h-4 rounded-full overflow-hidden flex">
                    {priorities.map((p) => (
                      <div key={p.label} className={`${p.color} transition-all duration-500`} style={{ width: `${(p.count / total) * 100}%` }} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Department + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" /> Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(deptStats).sort((a, b) => b[1].total - a[1].total).map(([dept, d]) => {
                  const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
                  return (
                    <div key={dept}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-foreground">{dept}</span>
                        <span className="text-xs text-muted-foreground">{d.solved}/{d.total} resolved ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2 rounded-full" />
                    </div>
                  );
                })}
                {Object.keys(deptStats).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" /> Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(catStats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium capitalize text-foreground">{cat}</span>
                        <span className="text-xs text-muted-foreground font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(catStats).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
          </div>

          {/* Worker Leaderboard */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Worker Leaderboard
              </CardTitle>
              <CardDescription>Ranked by completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              {workerPerf.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No worker data</p>
              ) : (
                <div className="space-y-3">
                  {workerPerf.map((w, i) => (
                    <div key={w.name} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                        #{i + 1}
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{w.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground">{w.name}</p>
                          <div className="flex items-center gap-3">
                            {w.avg > 0 && (
                              <span className="text-sm flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{w.avg.toFixed(1)}
                              </span>
                            )}
                            <Badge variant={w.rate >= 70 ? "default" : "secondary"} className="font-mono text-xs">{w.rate}%</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={w.rate} className="h-1.5 flex-1 rounded-full" />
                          <span className="text-xs text-muted-foreground">{w.done}/{w.total} tasks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Summary */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Student Feedback Summary
              </CardTitle>
              <CardDescription>{feedback.length} total feedback submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No feedback yet</p>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = feedback.filter((f) => f.rating === star).length;
                    const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0;
                    return (
                      <div key={star} className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-center gap-0.5 mb-1">
                          {Array.from({ length: star }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
