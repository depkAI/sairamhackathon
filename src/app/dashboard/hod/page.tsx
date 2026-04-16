"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useAnnouncements,
  useWorkers,
  useIdeas,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2, BarChart3, Clock, AlertCircle, TrendingUp,
  ShieldAlert, Wrench, Lightbulb, Megaphone, Activity, MoreVertical,
} from "lucide-react";
import MouseGlowCard from "@/components/effects/MouseGlowCard";
import Link from "next/link";

export default function HODDashboard() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const workers = useWorkers();
  const announcements = useAnnouncements(profile?.department);
  const ideas = useIdeas(
    profile ? { field: "department", value: profile.department } : undefined
  );
  const pendingIdeas = ideas.filter((i) => i.status === "pending");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredComplaints = filterMonth === "all" ? complaints : complaints.filter((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === filterMonth;
  });

  const total = filteredComplaints.length;
  const pendingCount = filteredComplaints.filter((c) => c.status === "pending").length;
  const resolvedCount = filteredComplaints.filter((c) => c.status === "completed" || c.status === "verified").length;
  const inProgress = filteredComplaints.filter((c) => ["assigned", "in_progress", "quotation_submitted", "quotation_approved"].includes(c.status)).length;
  const critical = filteredComplaints.filter((c) => c.priority === "critical" && !["completed", "verified", "rejected"].includes(c.status)).length;
  const reviewed = filteredComplaints.filter((c) => c.status === "reviewed").length;
  const liveCount = filteredComplaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length;

  const catCounts: Record<string, number> = {};
  filteredComplaints.forEach((c) => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  const monthOptions = Array.from(new Set(complaints.map((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort().reverse();

  const resolutionPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const kpiCards = [
    { label: "Total", value: total, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", glow: "icon-glow-indigo" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", glow: "icon-glow-amber" },
    { label: "Reviewed", value: reviewed, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", glow: "icon-glow-blue" },
    { label: "Resolved", value: resolvedCount, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", glow: "icon-glow-emerald" },
    { label: "Critical", value: critical, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", glow: "icon-glow-red" },
  ];

  const quickLinks = [
    { label: "Complaints", href: "/dashboard/hod/complaints", icon: BarChart3, count: total, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", glow: "icon-glow-indigo" },
    { label: "Live Tracking", href: "/dashboard/hod/live", icon: Activity, count: liveCount, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", glow: "icon-glow-cyan" },
    { label: "Ideas", href: "/dashboard/hod/ideas", icon: Lightbulb, count: pendingIdeas.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", glow: "icon-glow-amber" },
    { label: "Announcements", href: "/dashboard/hod/announcements", icon: Megaphone, count: announcements.length, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", glow: "icon-glow-purple" },
  ];

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Critical Alert */}
          {critical > 0 && (
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 dark:bg-red-950/30 animate-slide-up">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">Critical Issues</AlertTitle>
              <AlertDescription className="text-sm">{critical} unresolved critical complaint{critical !== 1 && "s"}</AlertDescription>
            </Alert>
          )}

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

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

          {/* Resolution + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Resolution Progress
                </CardTitle>
                <CardDescription className="text-sm">{resolvedCount} of {total} resolved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-emerald-600">{resolutionPct}%</span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{inProgress} in progress</span>
                </div>
                <Progress value={resolutionPct} className="h-2.5 rounded-full" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-indigo-500" /> Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(catCounts).length === 0 ? (
                  <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{cat}</span>
                            <span className="text-gray-400 dark:text-gray-500">{count} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-1.5 rounded-full" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation Cards */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Access</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
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
