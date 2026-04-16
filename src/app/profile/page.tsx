"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFeedback, useComplaints, useTasks } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Star,
  BarChart3,
  Hash,
  Wrench,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function ProfilePage() {
  const { profile } = useAuth();
  const complaints = useComplaints(
    profile?.role === "student" ? { field: "createdBy", value: profile.uid } : undefined
  );
  const tasks = useTasks(
    profile?.role === "worker" ? { field: "workerId", value: profile.uid } : undefined
  );
  const feedback = useFeedback();

  if (!profile) return null;

  const workerFeedback = feedback.filter((f) => {
    const task = tasks.find((t) => t.complaintId === f.complaintId);
    return !!task;
  });
  const avgRating =
    workerFeedback.length > 0
      ? workerFeedback.reduce((sum, f) => sum + f.rating, 0) / workerFeedback.length
      : 0;

  const roleLabel =
    profile.role === "hod"
      ? "HOD / Department Head"
      : profile.role === "admin"
        ? "Administrator"
        : profile.role === "worker"
          ? "Maintenance Worker"
          : "Student";

  const roleBadgeVariant =
    profile.role === "admin"
      ? "destructive"
      : profile.role === "hod"
        ? "default"
        : "secondary";

  const infoItems = [
    { icon: Hash, label: "Login ID", value: profile.loginId },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: Building, label: "Department", value: profile.department },
    ...(profile.specialty
      ? [{ icon: Wrench, label: "Specialty", value: profile.specialty, capitalize: true }]
      : []),
    {
      icon: Calendar,
      label: "Joined",
      value: new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>

          {/* Profile Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-2xl">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                  <Badge variant={roleBadgeVariant as "default" | "secondary" | "destructive"}>
                    {roleLabel}
                  </Badge>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="grid gap-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span
                      className={`font-medium text-foreground ${
                        (item as { capitalize?: boolean }).capitalize ? "capitalize" : ""
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Stats */}
          {profile.role === "student" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  My Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-0 bg-blue-50 shadow-none dark:bg-blue-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <ClipboardList className="mb-1 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {complaints.length}
                      </span>
                      <span className="text-xs text-muted-foreground">Total Reported</span>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-green-50 shadow-none dark:bg-green-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <CheckCircle2 className="mb-1 h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {complaints.filter((c) => ["completed", "verified"].includes(c.status)).length}
                      </span>
                      <span className="text-xs text-muted-foreground">Resolved</span>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-yellow-50 shadow-none dark:bg-yellow-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <Clock className="mb-1 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length}
                      </span>
                      <span className="text-xs text-muted-foreground">In Progress</span>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worker Stats */}
          {profile.role === "worker" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  My Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Card className="border-0 bg-blue-50 shadow-none dark:bg-blue-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <ClipboardList className="mb-1 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {tasks.length}
                      </span>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-green-50 shadow-none dark:bg-green-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <CheckCircle2 className="mb-1 h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {completedTasks}
                      </span>
                      <span className="text-xs text-muted-foreground">Done</span>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-yellow-50 shadow-none dark:bg-yellow-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <TrendingUp className="mb-1 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                      </span>
                      <span className="text-xs text-muted-foreground">Rate</span>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-purple-50 shadow-none dark:bg-purple-950/30">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <Star className="mb-1 h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {avgRating > 0 ? avgRating.toFixed(1) : "\u2014"}
                      </span>
                      <span className="text-xs text-muted-foreground">Rating</span>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
