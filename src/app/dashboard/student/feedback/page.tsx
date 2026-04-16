"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFeedback, useComplaints } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MessageSquare,
  Inbox,
  TrendingUp,
  Award,
} from "lucide-react";

export default function FeedbackPage() {
  const { profile } = useAuth();
  const feedbackList = useFeedback(
    profile ? { field: "studentId", value: profile.uid } : undefined
  );
  const complaints = useComplaints(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );

  const avgRating =
    feedbackList.length > 0
      ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length
      : 0;

  const ratingLabel = (r: number) =>
    r === 1 ? "Poor" : r === 2 ? "Fair" : r === 3 ? "Good" : r === 4 ? "Very Good" : "Excellent";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Feedback
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback on resolved complaints
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-orange-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 shrink-0">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/10 to-purple-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{feedbackList.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-green-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits Earned</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {feedbackList.length * 10 + complaints.filter((c) => ["completed", "verified"].includes(c.status)).length * 5}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          {feedbackList.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                  <Inbox className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No feedback yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Once your complaints are resolved, you can rate them and your feedback will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((f) => {
                const complaint = complaints.find((c) => c.id === f.complaintId);
                return (
                  <Card key={f.id} className="shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {complaint?.title || "Complaint"}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {ratingLabel(f.rating)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < f.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-foreground ml-1">
                          {f.rating}/5
                        </span>
                      </div>
                      {f.feedbackText && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          &ldquo;{f.feedbackText}&rdquo;
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
