"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIdeas,
  updateIdea,
  addNotification,
  notifyRole,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, Lightbulb,
} from "lucide-react";

export default function HODIdeasPage() {
  const { profile } = useAuth();
  const ideas = useIdeas(
    profile ? { field: "department", value: profile.department } : undefined
  );

  const [ideaRejectModal, setIdeaRejectModal] = useState<string | null>(null);
  const [ideaRejectReason, setIdeaRejectReason] = useState("");

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {ideas.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-700">
              <CardContent className="flex flex-col items-center py-16">
                <Lightbulb className="h-10 w-10 text-amber-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No ideas submitted yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <Card key={idea.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{idea.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">by {idea.createdByName} &middot; {new Date(idea.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={idea.status === "pending" ? "secondary" : idea.status === "rejected" ? "destructive" : "default"} className="text-xs capitalize shrink-0">
                        {idea.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{idea.description}</p>
                    {idea.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => setIdeaRejectModal(idea.id)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={async () => {
                          await updateIdea(idea.id, { status: "approved_by_hod", hodReviewedBy: profile?.uid, hodReviewedByName: profile?.name });
                          await addNotification(idea.createdBy, "Idea Approved by HOD", `Your idea "${idea.title}" has been approved by HOD and forwarded to Admin.`, "/dashboard/student/ideas");
                          await notifyRole("admin", "New Idea for Review", `HOD approved idea: "${idea.title}" by ${idea.createdByName}`, "/dashboard/admin");
                          toast.success("Idea approved and forwarded to Admin!");
                        }}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Forward
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Idea Reject Dialog */}
          <Dialog open={!!ideaRejectModal} onOpenChange={(open) => !open && setIdeaRejectModal(null)}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">Reject Idea</DialogTitle></DialogHeader>
              <p className="text-sm text-gray-500">The student will be notified.</p>
              <Textarea value={ideaRejectReason} onChange={(e) => setIdeaRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="text-sm rounded-lg" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIdeaRejectModal(null)} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button variant="destructive" disabled={!ideaRejectReason} className="h-9 text-sm rounded-lg" onClick={async () => {
                  if (!ideaRejectModal) return;
                  const idea = ideas.find((i) => i.id === ideaRejectModal);
                  await updateIdea(ideaRejectModal, { status: "rejected", rejectionReason: ideaRejectReason });
                  if (idea) await addNotification(idea.createdBy, "Idea Rejected", `Your idea "${idea.title}" was rejected: ${ideaRejectReason}`, "/dashboard/student/ideas");
                  toast.success("Idea rejected");
                  setIdeaRejectModal(null);
                  setIdeaRejectReason("");
                }}>Reject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
