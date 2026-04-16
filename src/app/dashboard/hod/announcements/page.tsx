"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAnnouncements,
  addAnnouncement,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  Megaphone, Plus, Inbox, User, CalendarDays,
} from "lucide-react";

export default function HODAnnouncementsPage() {
  const { profile } = useAuth();
  const announcements = useAnnouncements(profile?.department);

  const [announcementModal, setAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  const submitAnnouncement = async () => {
    if (!profile || !annTitle || !annMessage) return;
    try {
      await addAnnouncement({ department: profile.department, title: annTitle, message: annMessage, createdBy: profile.uid, createdByName: profile.name, createdAt: new Date() });
      toast.success("Announcement posted!");
      setAnnouncementModal(false);
      setAnnTitle("");
      setAnnMessage("");
    } catch { toast.error("Failed"); }
  };

  return (
    <ProtectedRoute allowedRoles={["hod"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Announcements</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500">Share updates with your department</p>
            </div>
            <Button onClick={() => setAnnouncementModal(true)} className="gap-2 h-9 text-sm rounded-lg">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </div>

          {announcements.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-700">
              <CardContent className="flex flex-col items-center py-16">
                <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((a, i) => (
                <Card key={a.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{a.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1.5 leading-relaxed">{a.message}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-3">
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

          {/* Announcement Dialog */}
          <Dialog open={announcementModal} onOpenChange={setAnnouncementModal}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="text-[16px]">New Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Title</label>
                  <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" className="text-sm h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Message</label>
                  <Textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} placeholder="Write your announcement..." rows={4} className="text-sm rounded-lg" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAnnouncementModal(false)} className="h-9 text-sm rounded-lg">Cancel</Button>
                <Button onClick={submitAnnouncement} disabled={!annTitle || !annMessage} className="h-9 text-sm rounded-lg">Post</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
