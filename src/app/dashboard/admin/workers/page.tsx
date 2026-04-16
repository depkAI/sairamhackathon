"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkers, useTasks, useFeedback } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  Users,
  UserCheck,
  Star,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  UserX,
} from "lucide-react";

interface WorkerStats {
  uid: string;
  name: string;
  email: string;
  department: string;
  specialty?: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageRating: number;
  ratingCount: number;
}

export default function AdminWorkersPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const tasks = useTasks();
  const feedback = useFeedback();

  const workerStats = useMemo(() => {
    if (!workers || !tasks) return [];

    const now = new Date();

    const stats: WorkerStats[] = workers.map((worker) => {
      const workerTasks = tasks.filter((t) => t.workerId === worker.uid);
      const completedTasks = workerTasks.filter(
        (t) => t.status === "completed"
      );
      const overdueTasks = workerTasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.status !== "rejected" &&
          new Date(t.deadline) < now
      );
      const completionRate =
        workerTasks.length > 0
          ? Math.round((completedTasks.length / workerTasks.length) * 100)
          : 0;

      // Compute average rating from feedback linked through tasks
      const workerCompletedComplaintIds = completedTasks.map(
        (t) => t.complaintId
      );
      const workerFeedback = (feedback || []).filter((f) =>
        workerCompletedComplaintIds.includes(f.complaintId)
      );
      const averageRating =
        workerFeedback.length > 0
          ? parseFloat(
              (
                workerFeedback.reduce((sum, f) => sum + f.rating, 0) /
                workerFeedback.length
              ).toFixed(1)
            )
          : 0;

      return {
        uid: worker.uid,
        name: worker.name,
        email: worker.email,
        department: worker.department,
        specialty: worker.specialty,
        totalTasks: workerTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate,
        averageRating,
        ratingCount: workerFeedback.length,
      };
    });

    // Sort by completion rate descending
    return stats.sort((a, b) => b.completionRate - a.completionRate);
  }, [workers, tasks, feedback]);

  const totalWorkers = workerStats.length;
  const activeWorkers = workerStats.filter((w) => w.totalTasks > 0).length;
  const avgRating =
    workerStats.filter((w) => w.ratingCount > 0).length > 0
      ? parseFloat(
          (
            workerStats
              .filter((w) => w.ratingCount > 0)
              .reduce((sum, w) => sum + w.averageRating, 0) /
            workerStats.filter((w) => w.ratingCount > 0).length
          ).toFixed(1)
        )
      : 0;
  const totalOverdue = workerStats.reduce((sum, w) => sum + w.overdueTasks, 0);

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRateColor(rate: number) {
    if (rate >= 80) return "text-green-500";
    if (rate >= 50) return "text-yellow-500";
    return "text-red-500";
  }

  function getProgressColor(rate: number) {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalWorkers} worker{totalWorkers !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Workers
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalWorkers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Workers
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {activeWorkers}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      with pending tasks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold text-foreground">
                      {avgRating > 0 ? avgRating : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Overdue
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalOverdue}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workers Table */}
          {workerStats.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                  No workers found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Workers will appear here once they are added to the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Worker Performance
                </CardTitle>
                <CardDescription>
                  Overview of all workers sorted by completion rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">
                          Worker
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Department
                        </TableHead>
                        <TableHead className="text-muted-foreground text-center">
                          Tasks
                        </TableHead>
                        <TableHead className="text-muted-foreground text-center">
                          Completed
                        </TableHead>
                        <TableHead className="text-muted-foreground text-center">
                          Overdue
                        </TableHead>
                        <TableHead className="text-muted-foreground text-center">
                          Rating
                        </TableHead>
                        <TableHead className="text-muted-foreground min-w-[160px]">
                          Completion Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workerStats.map((worker) => (
                        <TableRow
                          key={worker.uid}
                          className="border-border hover:bg-muted/50 transition-colors"
                        >
                          {/* Worker Info */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                  {getInitials(worker.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {worker.name}
                                </p>
                                {worker.specialty && (
                                  <p className="text-xs text-muted-foreground">
                                    {worker.specialty}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Department */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-border text-muted-foreground"
                            >
                              {worker.department}
                            </Badge>
                          </TableCell>

                          {/* Total Tasks */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground font-medium">
                                {worker.totalTasks}
                              </span>
                            </div>
                          </TableCell>

                          {/* Completed */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-foreground font-medium">
                                {worker.completedTasks}
                              </span>
                            </div>
                          </TableCell>

                          {/* Overdue */}
                          <TableCell className="text-center">
                            {worker.overdueTasks > 0 ? (
                              <Badge
                                variant="destructive"
                                className="font-medium"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {worker.overdueTasks}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                0
                              </span>
                            )}
                          </TableCell>

                          {/* Rating */}
                          <TableCell className="text-center">
                            {worker.ratingCount > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-foreground font-medium">
                                  {worker.averageRating}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({worker.ratingCount})
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>

                          {/* Completion Rate */}
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-semibold ${getRateColor(worker.completionRate)}`}
                                >
                                  {worker.completionRate}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${getProgressColor(worker.completionRate)}`}
                                  style={{
                                    width: `${worker.completionRate}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
