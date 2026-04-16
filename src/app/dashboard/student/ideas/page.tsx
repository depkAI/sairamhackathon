"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIdeas, addIdea, notifyRole } from "@/lib/useData";
import { DEPARTMENTS } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  Lightbulb,
  Plus,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending HOD Review", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  approved_by_hod: { label: "HOD Approved — With Admin", variant: "default", icon: <ArrowRight className="h-3 w-3" /> },
  approved_by_admin: { label: "Approved", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function IdeasPage() {
  const { profile } = useAuth();
  const ideas = useIdeas(
    profile ? { field: "createdBy", value: profile.uid } : undefined
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(profile?.department || DEPARTMENTS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile) return;
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Please provide a more detailed description (at least 20 characters)");
      return;
    }
    setLoading(true);
    try {
      await addIdea({
        title: title.trim(),
        description: description.trim(),
        department,
        status: "pending",
        createdBy: profile.uid,
        createdByName: profile.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await notifyRole(
        "hod",
        "New Idea Submitted",
        `${profile.name} submitted an idea: "${title.trim()}"`,
        "/dashboard/hod",
        department
      );
      toast.success("Idea submitted successfully!");
      setShowForm(false);
      setTitle("");
      setDescription("");
    } catch {
      toast.error("Failed to submit idea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-amber-500" />
                My Ideas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Submit improvement ideas for your campus
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Idea
            </Button>
          </div>

          {/* Idea Cards */}
          {ideas.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <Lightbulb className="h-7 w-7 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No ideas yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Have an idea to improve your campus? Submit it and it will be reviewed by your HOD and admin.
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Submit Your First Idea
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => {
                const config = statusConfig[idea.status] || statusConfig.pending;
                return (
                  <Card key={idea.id} className="shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{idea.title}</h3>
                        <Badge variant={config.variant} className="gap-1 text-xs shrink-0">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{idea.department}</span>
                        <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                        {idea.hodReviewedByName && (
                          <span className="text-emerald-600">HOD: {idea.hodReviewedByName}</span>
                        )}
                        {idea.adminReviewedByName && (
                          <span className="text-indigo-600">Admin: {idea.adminReviewedByName}</span>
                        )}
                      </div>
                      {idea.rejectionReason && (
                        <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900">
                          <p className="text-xs text-red-700 dark:text-red-400">
                            Reason: {idea.rejectionReason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Submit Idea Dialog */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Submit a New Idea
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short, descriptive title for your idea"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your idea in detail — what problem does it solve and how?"
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Department</Label>
                  <Select value={department} onValueChange={(v) => { if (v) setDepartment(v); }}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
                  {loading ? "Submitting..." : <><Send className="h-3.5 w-3.5" /> Submit Idea</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
