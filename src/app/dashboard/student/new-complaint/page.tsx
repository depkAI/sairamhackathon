"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { addComplaint, useComplaints, addNotification } from "@/lib/useData";
import { Category, Priority, DEPARTMENTS, LOCATIONS } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Upload, Mic, MicOff, AlertTriangle, Send, ArrowLeft, Shield } from "lucide-react";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing / Water" },
  { value: "furniture", label: "Furniture" },
  { value: "network", label: "Network / IT" },
  { value: "cleaning", label: "Cleaning" },
  { value: "civil", label: "Civil / Infrastructure" },
  { value: "other", label: "Other" },
];

const URGENT_KEYWORDS = ["fire", "flood", "sparks", "electric shock", "collapse", "gas leak", "emergency", "danger", "smoke"];
const SPAM_KEYWORDS = ["test", "asdf", "qwerty", "hello", "hi", "lol", "xxx", "aaa", "bbb", "123456"];

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => lower.includes(k))) return "critical";
  if (lower.includes("broken") || lower.includes("leak") || lower.includes("not working")) return "high";
  if (lower.includes("slow") || lower.includes("minor") || lower.includes("small")) return "low";
  return "medium";
}

function detectSpam(title: string, desc: string): { isSpam: boolean; reason: string } {
  const combined = (title + " " + desc).toLowerCase();
  // Too short
  if (desc.length < 10) return { isSpam: true, reason: "Description is too short. Please provide details." };
  // Repeated characters
  if (/(.)\1{5,}/.test(combined)) return { isSpam: true, reason: "Description contains repeated characters." };
  // Spam keywords
  if (SPAM_KEYWORDS.some((k) => combined === k || (title.toLowerCase() === k && desc.length < 20))) return { isSpam: true, reason: "This looks like a test/spam submission." };
  // All same word
  const words = desc.trim().split(/\s+/);
  if (words.length > 2 && new Set(words).size === 1) return { isSpam: true, reason: "Description contains the same word repeated." };
  return { isSpam: false, reason: "" };
}

export default function NewComplaintPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const existingComplaints = useComplaints();
  const [form, setForm] = useState({
    title: "", description: "", category: "electrical" as Category,
    priority: "medium" as Priority, location: LOCATIONS[0] as string,
    department: profile?.department || DEPARTMENTS[0],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [spamWarning, setSpamWarning] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const update = (field: string, value: string) => {
    setForm((p) => {
      const updated = { ...p, [field]: value };
      if (field === "description" || field === "title") {
        updated.priority = detectPriority(updated.title + " " + updated.description);
        // Spam check
        const spam = detectSpam(updated.title, updated.description);
        setSpamWarning(spam.isSpam ? spam.reason : "");
      }
      return updated;
    });
  };

  // Duplicate check
  const checkDuplicate = () => {
    const dup = existingComplaints.find((c) =>
      c.location === form.location && c.category === form.category &&
      !["completed", "verified", "rejected"].includes(c.status)
    );
    setDuplicateWarning(dup ? `Similar active complaint: "${dup.title}" at ${dup.location}` : "");
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
        setAudio(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.success("Recording started...");
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording saved!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Final spam check
    const spam = detectSpam(form.title, form.description);
    if (spam.isSpam) { toast.error(spam.reason); return; }

    setLoading(true);
    try {
      await addComplaint({
        ...form, attachments: [], audioAttachment: audio ? "audio_attached" : undefined,
        status: "pending", createdBy: profile.uid, createdByName: profile.name,
        createdAt: new Date(), updatedAt: new Date(), isSpam: false,
      });

      // Notify HODs and admins
      await addNotification("staff-001", "New Complaint", `${profile.name} reported: ${form.title}`, "/dashboard/hod");
      await addNotification("admin-001", "New Complaint", `${profile.name} reported: ${form.title}`, "/dashboard/admin");

      toast.success("Complaint submitted!");
      router.push("/dashboard/student");
    } catch { toast.error("Failed to submit"); }
    finally { setLoading(false); }
  };

  const priorityColors: Record<Priority, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-amber-100 text-amber-700 border-amber-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Report an Issue</h1>
              <p className="text-muted-foreground text-sm">Submit a new campus maintenance complaint</p>
            </div>
          </div>

          {/* Warnings */}
          {spamWarning && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div><p className="font-medium text-red-800 text-sm">Spam Detected</p><p className="text-red-600 text-xs mt-0.5">{spamWarning}</p></div>
              </CardContent>
            </Card>
          )}
          {duplicateWarning && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div><p className="font-medium text-amber-800 text-sm">Possible Duplicate</p><p className="text-amber-600 text-xs mt-0.5">{duplicateWarning}</p></div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader><CardTitle className="text-base">Complaint Details</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Brief description of the issue" className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Detailed description of the problem..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select value={form.category} onChange={(e) => { update("category", e.target.value); setTimeout(checkDuplicate, 100); }}
                      className="w-full h-11 px-3 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Priority</Label>
                      <Badge className={`text-[10px] border ${priorityColors[form.priority]}`}>{form.priority} (auto)</Badge>
                    </div>
                    <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                      className="w-full h-11 px-3 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <select value={form.location} onChange={(e) => { update("location", e.target.value); setTimeout(checkDuplicate, 100); }}
                      className="w-full h-11 px-3 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <select value={form.department} onChange={(e) => update("department", e.target.value)}
                      className="w-full h-11 px-3 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-4 w-4" /> Image Attachments</Label>
                  <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                  {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mic className="h-4 w-4" /> Audio Complaint</Label>
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button type="button" variant="outline" size="sm" onClick={startRecording} className="gap-1.5">
                        <Mic className="h-4 w-4 text-red-500" /> Record Audio
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="gap-1.5 animate-pulse">
                        <MicOff className="h-4 w-4" /> Stop Recording
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">or</span>
                    <Input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] || null)} className="max-w-[200px]" />
                  </div>
                  {audio && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckIcon /> Audio attached: {audio.name}</p>}
                </div>

                <Button type="submit" disabled={loading || !!spamWarning} className="w-full h-11">
                  {loading ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Complaint</>}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function CheckIcon() {
  return <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
