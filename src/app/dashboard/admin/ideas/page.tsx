"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIdeas, updateIdea, addNotification } from "@/lib/useData";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  CalendarDays,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

interface Idea {
  id: string;
  title: string;
  description: string;
  department: string;
  status: "pending" | "approved_by_hod" | "approved_by_admin" | "rejected";
  createdBy: string;
  createdByName: string;
  rejectionReason?: string;
  hodReviewedBy?: string;
  hodReviewedByName?: string;
  adminReviewedBy?: string;
  adminReviewedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

function statusBadge(status: Idea["status"]) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "approved_by_hod":
      return (
        <Badge className="gap-1 bg-amber-500/90 text-white hover:bg-amber-500">
          <Clock className="h-3 w-3" />
          HOD Approved
        </Badge>
      );
    case "approved_by_admin":
      return (
        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          Admin Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminIdeasPage() {
  const { profile } = useAuth();
  const ideas: Idea[] = useIdeas() || [];
  const [processing, setProcessing] = useState<string | null>(null);

  const needsReview = ideas.filter((i) => i.status === "approved_by_hod");
  const approvedByAdmin = ideas.filter(
    (i) => i.status === "approved_by_admin"
  );
  const rejected = ideas.filter((i) => i.status === "rejected");

  const handleApprove = async (idea: Idea) => {
    if (!profile) return;
    setProcessing(idea.id);
    try {
      await updateIdea(idea.id, {
        status: "approved_by_admin",
        adminReviewedBy: profile.uid,
        adminReviewedByName: profile.name,
      });
      await addNotification(
        idea.createdBy,
        "Idea Approved by Admin",
        `Your idea "${idea.title}" has been approved by the administration.`,
        "/dashboard/student/ideas"
      );
      toast.success(`"${idea.title}" has been approved.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve idea. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (idea: Idea) => {
    if (!profile) return;
    const reason = window.prompt(
      "Please provide a reason for rejecting this idea:"
    );
    if (!reason) return;
    setProcessing(idea.id);
    try {
      await updateIdea(idea.id, {
        status: "rejected",
        rejectionReason: reason,
        adminReviewedBy: profile.uid,
        adminReviewedByName: profile.name,
      });
      await addNotification(
        idea.createdBy,
        "Idea Rejected",
        `Your idea "${idea.title}" was not approved. Reason: ${reason}`,
        "/dashboard/student/ideas"
      );
      toast.success(`"${idea.title}" has been rejected.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject idea. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const renderIdeaCard = (idea: Idea, showActions: boolean) => (
    <Card
      key={idea.id}
      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-shadow hover:shadow-md"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {idea.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {idea.description}
            </CardDescription>
          </div>
          {statusBadge(idea.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {idea.createdByName}
          </span>
          <span className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {idea.department}
          </span>
          {idea.hodReviewedByName && (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              HOD: {idea.hodReviewedByName}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {formatDate(idea.createdAt)}
          </span>
        </div>

        {idea.rejectionReason && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            <span className="font-medium">Rejection Reason:</span>{" "}
            {idea.rejectionReason}
          </div>
        )}

        {idea.adminReviewedByName && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Reviewed by Admin: {idea.adminReviewedByName}
          </p>
        )}

        {showActions && (
          <>
            <Separator className="dark:bg-gray-700" />
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={() => handleReject(idea)}
                disabled={processing === idea.id}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                onClick={() => handleApprove(idea)}
                disabled={processing === idea.id}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-8 p-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Lightbulb className="h-7 w-7 text-amber-500" />
              Student Ideas
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review ideas approved by HODs
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
                  <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Ideas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {ideas.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Awaiting Review
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {needsReview.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Approved by Admin
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {approvedByAdmin.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {rejected.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="needs-review" className="space-y-6">
            <TabsList className="bg-gray-100 dark:bg-gray-800">
              <TabsTrigger
                value="needs-review"
                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                Needs Review
                {needsReview.length > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white hover:bg-amber-500">
                    {needsReview.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                All Ideas
              </TabsTrigger>
            </TabsList>

            {/* Needs Review Tab */}
            <TabsContent value="needs-review" className="space-y-4">
              {needsReview.length === 0 ? (
                <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      All caught up!
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      There are no ideas awaiting your review right now.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                needsReview.map((idea) => renderIdeaCard(idea, true))
              )}
            </TabsContent>

            {/* All Ideas Tab */}
            <TabsContent value="all" className="space-y-4">
              {ideas.length === 0 ? (
                <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      No ideas yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Student ideas will appear here once submitted.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                ideas.map((idea) => renderIdeaCard(idea, false))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
