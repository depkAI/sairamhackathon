"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnnouncements, addAnnouncement } from "@/lib/useData";
import { DEPARTMENTS } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  Megaphone, Plus, User, CalendarDays, Building, Inbox, Send,
} from "lucide-react";

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const allAnnouncements = useAnnouncements();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dept, setDept] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!profile || !title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await addAnnouncement({
        department: dept,
        title: title.trim(),
        message: message.trim(),
        createdBy: profile.uid,
        createdByName: profile.name,
        createdAt: new Date(),
      });
      toast.success("Announcement posted!");
      setShowCreate(false);
      setTitle("");
      setMessage("");
      setDept("General");
    } catch {
      toast.error("Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Announcements</h1>
              <p className="text-muted-foreground mt-1">Broadcast messages to departments across campus</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-5 text-center">
                <Megaphone className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{allAnnouncements.length}</p>
                <p className="text-xs text-muted-foreground">Total Posted</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-5 text-center">
                <Building className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {new Set(allAnnouncements.map((a) => a.department)).size}
                </p>
                <p className="text-xs text-muted-foreground">Departments Reached</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-5 text-center">
                <CalendarDays className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {allAnnouncements.filter((a) => {
                    const d = new Date(a.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Announcements List */}
          {allAnnouncements.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Inbox className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">No announcements yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create your first announcement to broadcast to campus departments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((a, i) => (
                <Card key={a.id} className="rounded-2xl border-border shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Megaphone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-foreground">{a.title}</h3>
                          <Badge variant="secondary" className="text-xs shrink-0">{a.department}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.createdByName}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Announcement Dialog */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  New Announcement
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={dept} onValueChange={(v) => { if (v) setDept(v); }}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement..."
                    rows={4}
                    className="resize-none rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!title.trim() || !message.trim() || submitting}>
                  {submitting ? "Posting..." : <><Send className="h-4 w-4 mr-1.5" /> Post Announcement</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
