"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFeedback, useComplaints, useTasks, useIdeas } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useState } from "react";
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
  Pencil,
  Award,
  Lightbulb,
  Coins,
} from "lucide-react";

export default function ProfilePage() {
  const { profile, updateProfile: contextUpdateProfile } = useAuth();
  const complaints = useComplaints(
    profile?.role === "student" ? { field: "createdBy", value: profile.uid } : undefined
  );
  const tasks = useTasks(
    profile?.role === "worker" ? { field: "workerId", value: profile.uid } : undefined
  );
  const feedback = useFeedback();
  const ideas = useIdeas(
    profile?.role === "student" ? { field: "createdBy", value: profile.uid } : undefined
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

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
    { icon: Phone, label: "Phone", value: profile.phone || "Not set" },
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

  const openEditDialog = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone || "");
    setEditEmail(profile.email);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      contextUpdateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-100">My Profile</h1>
            <Button
              variant="outline"
              onClick={openEditDialog}
              className="gap-2 h-9 text-sm rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all duration-200"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>

          {/* Profile Info Card */}
          <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-white dark:ring-gray-800 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">{profile.name}</h2>
                  <Badge variant={roleBadgeVariant as "default" | "secondary" | "destructive"} className="mt-1 text-xs rounded-md">
                    {roleLabel}
                  </Badge>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-5" />

              <div className="grid gap-3.5">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 text-sm w-24 shrink-0">{item.label}</span>
                    <span
                      className={`font-medium text-gray-700 dark:text-gray-300 ${
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

          {/* Student Stats & Credits */}
          {profile.role === "student" && (() => {
            const resolvedCount = complaints.filter((c) => ["completed", "verified"].includes(c.status)).length;
            const feedbackGiven = feedback.filter((f) => f.studentId === profile.uid).length;
            const approvedIdeas = ideas.filter((i) => ["approved_by_hod", "approved_by_admin"].includes(i.status)).length;
            // Points: 5 per resolved, 10 per feedback, 20 per approved idea
            const totalCredits = resolvedCount * 5 + feedbackGiven * 10 + approvedIdeas * 20;

            return (
              <>
                {/* Credits Card */}
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Award className="h-7 w-7 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                        <p className="text-4xl font-bold tracking-tight text-amber-700 dark:text-amber-400">{totalCredits}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1 justify-end"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {resolvedCount} resolved (+{resolvedCount * 5})</p>
                        <p className="flex items-center gap-1 justify-end"><Star className="h-3 w-3 text-amber-500" /> {feedbackGiven} feedback (+{feedbackGiven * 10})</p>
                        <p className="flex items-center gap-1 justify-end"><Lightbulb className="h-3 w-3 text-purple-500" /> {approvedIdeas} ideas (+{approvedIdeas * 20})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3 px-6 pt-5">
                    <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      My Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: ClipboardList, value: complaints.length, label: "Reported", bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", valueColor: "text-blue-700" },
                        { icon: CheckCircle2, value: resolvedCount, label: "Resolved", bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
                        { icon: Clock, value: complaints.filter((c) => !["completed", "verified", "rejected"].includes(c.status)).length, label: "In Progress", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: "text-amber-700" },
                        { icon: Lightbulb, value: ideas.length, label: "Ideas", bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600", valueColor: "text-purple-700" },
                      ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <Card key={i} className={`border-0 ${stat.bg} shadow-none rounded-xl`}>
                            <CardContent className="flex flex-col items-center justify-center p-4">
                              <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center mb-2`}>
                                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                              </div>
                              <span className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.label}</span>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {/* Worker Stats */}
          {profile.role === "worker" && (
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  My Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: ClipboardList, value: tasks.length, label: "Total", bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", valueColor: "text-blue-700" },
                    { icon: CheckCircle2, value: completedTasks, label: "Done", bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
                    { icon: TrendingUp, value: `${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`, label: "Rate", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: "text-amber-700" },
                    { icon: Star, value: avgRating > 0 ? avgRating.toFixed(1) : "\u2014", label: "Rating", bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600", valueColor: "text-purple-700" },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={i} className={`border-0 ${stat.bg} shadow-none rounded-xl`}>
                        <CardContent className="flex flex-col items-center justify-center p-4">
                          <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center mb-2`}>
                            <Icon className={`h-4 w-4 ${stat.iconColor} ${stat.label === "Rating" ? "fill-amber-400 text-amber-400" : ""}`} />
                          </div>
                          <span className={`text-2xl font-bold ${stat.valueColor}`}>
                            {stat.value}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.label}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Profile Dialog */}
          <Dialog open={editing} onOpenChange={(open) => !open && setEditing(false)}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="text-sm h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="text-sm h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <Input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="text-sm h-10 rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving} className="h-9 text-sm rounded-lg">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="h-9 text-sm rounded-lg">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
