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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  Mic,
  MicOff,
  AlertTriangle,
  Send,
  ArrowLeft,
  ShieldAlert,
  CheckCircle,
  ImagePlus,
  FileText,
  MapPin,
  Gauge,
  Building,
  Tag,
  Paperclip,
} from "lucide-react";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing / Water" },
  { value: "furniture", label: "Furniture" },
  { value: "network", label: "Network / IT" },
  { value: "cleaning", label: "Cleaning" },
  { value: "civil", label: "Civil / Infrastructure" },
  { value: "other", label: "Other" },
];

const URGENT_KEYWORDS = [
  "fire",
  "flood",
  "sparks",
  "electric shock",
  "collapse",
  "gas leak",
  "emergency",
  "danger",
  "smoke",
];
const SPAM_KEYWORDS = [
  "test",
  "asdf",
  "qwerty",
  "hello",
  "hi",
  "lol",
  "xxx",
  "aaa",
  "bbb",
  "123456",
];

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => lower.includes(k))) return "critical";
  if (
    lower.includes("broken") ||
    lower.includes("leak") ||
    lower.includes("not working")
  )
    return "high";
  if (
    lower.includes("slow") ||
    lower.includes("minor") ||
    lower.includes("small")
  )
    return "low";
  return "medium";
}

function detectSpam(
  title: string,
  desc: string
): { isSpam: boolean; reason: string } {
  const combined = (title + " " + desc).toLowerCase();
  if (desc.length < 10)
    return {
      isSpam: true,
      reason: "Description is too short. Please provide details.",
    };
  if (/(.)\1{5,}/.test(combined))
    return {
      isSpam: true,
      reason: "Description contains repeated characters.",
    };
  if (
    SPAM_KEYWORDS.some(
      (k) =>
        combined === k || (title.toLowerCase() === k && desc.length < 20)
    )
  )
    return {
      isSpam: true,
      reason: "This looks like a test/spam submission.",
    };
  const words = desc.trim().split(/\s+/);
  if (words.length > 2 && new Set(words).size === 1)
    return {
      isSpam: true,
      reason: "Description contains the same word repeated.",
    };
  return { isSpam: false, reason: "" };
}

export default function NewComplaintPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const existingComplaints = useComplaints();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "electrical" as Category,
    priority: "medium" as Priority,
    location: LOCATIONS[0] as string,
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
        updated.priority = detectPriority(
          updated.title + " " + updated.description
        );
        const spam = detectSpam(updated.title, updated.description);
        setSpamWarning(spam.isSpam ? spam.reason : "");
      }
      return updated;
    });
  };

  const checkDuplicate = () => {
    const dup = existingComplaints.find(
      (c) =>
        c.location === form.location &&
        c.category === form.category &&
        !["completed", "verified", "rejected"].includes(c.status)
    );
    setDuplicateWarning(
      dup
        ? `Similar active complaint: "${dup.title}" at ${dup.location}`
        : ""
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setAudio(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.success("Recording started...");
    } catch {
      toast.error("Microphone access denied");
    }
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
    const spam = detectSpam(form.title, form.description);
    if (spam.isSpam) {
      toast.error(spam.reason);
      return;
    }
    setLoading(true);
    try {
      await addComplaint({
        ...form,
        attachments: [],
        audioAttachment: audio ? "audio_attached" : undefined,
        status: "pending",
        createdBy: profile.uid,
        createdByName: profile.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSpam: false,
      });
      await addNotification(
        "staff-001",
        "New Complaint",
        `${profile.name} reported: ${form.title}`,
        "/dashboard/hod"
      );
      await addNotification(
        "admin-001",
        "New Complaint",
        `${profile.name} reported: ${form.title}`,
        "/dashboard/admin"
      );
      toast.success("Complaint submitted!");
      router.push("/dashboard/student");
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig: Record<
    Priority,
    { color: string; bg: string; label: string }
  > = {
    critical: {
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-500/10 border-red-200 dark:border-red-800",
      label: "Critical",
    },
    high: {
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-200 dark:border-amber-800",
      label: "High",
    },
    medium: {
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-200 dark:border-blue-800",
      label: "Medium",
    },
    low: {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800",
      label: "Low",
    },
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Report an Issue
              </h1>
              <p className="text-sm text-muted-foreground">
                Submit a new campus maintenance complaint
              </p>
            </div>
          </div>

          {/* Warnings */}
          {spamWarning && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Spam Detected</AlertTitle>
              <AlertDescription>{spamWarning}</AlertDescription>
            </Alert>
          )}
          {duplicateWarning && (
            <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">
                Possible Duplicate
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                {duplicateWarning}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Complaint Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    required
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Brief description of the issue"
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="desc"
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Provide a detailed description of the problem..."
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classification Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => {
                        update("category", v ?? "");
                        setTimeout(checkDuplicate, 100);
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Priority</Label>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${priorityConfig[form.priority].bg} ${priorityConfig[form.priority].color}`}
                      >
                        <Gauge className="h-3 w-3 mr-1" />
                        {form.priority} (auto)
                      </Badge>
                    </div>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => {
                        if (v) setForm((p) => ({ ...p, priority: (v || "medium") as Priority }))
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </Label>
                    <Select
                      value={form.location}
                      onValueChange={(v) => {
                        update("location", v ?? "");
                        setTimeout(checkDuplicate, 100);
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      Department
                    </Label>
                    <Select
                      value={form.department}
                      onValueChange={(v) => update("department", v ?? "")}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Image Attachments */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Images
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/30 transition-colors">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setFiles(Array.from(e.target.files || []))
                      }
                      className="cursor-pointer"
                    />
                  </div>
                  {files.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      {files.length} file(s) selected
                    </p>
                  )}
                </div>

                <Separator />

                {/* Audio Recording */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5" />
                    Voice Note
                  </Label>
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startRecording}
                        className="gap-1.5"
                      >
                        <Mic className="h-4 w-4 text-red-500" />
                        Record Audio
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={stopRecording}
                        className="gap-1.5 animate-pulse"
                      >
                        <MicOff className="h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">or</span>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudio(e.target.files?.[0] || null)}
                      className="max-w-[200px]"
                    />
                  </div>
                  {audio && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Audio attached: {audio.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !!spamWarning}
              size="lg"
              className="w-full shadow-sm"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Complaint
                </>
              )}
            </Button>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
