"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { addComplaint, useComplaints, notifyRole, useWorkers, addTask, updateComplaint, addNotification } from "@/lib/useData";
import { Category, Priority, DEPARTMENTS, LOCATIONS, Complaint, UserProfile } from "@/lib/types";
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
  Copy,
  Wrench,
  UserCheck,
  Sparkles,
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
  "asdf",
  "qwerty",
  "lol",
  "xxx",
  "aaa",
  "bbb",
  "123456",
];

function detectCategory(text: string): Category | null {
  const lower = text.toLowerCase();
  const categoryKeywords: { category: Category; keywords: string[] }[] = [
    { category: "plumbing", keywords: ["pipe", "water", "leak", "tap", "drain", "flush", "toilet", "plumb", "sewage", "tank", "bathroom", "restroom"] },
    { category: "electrical", keywords: ["wire", "switch", "power", "voltage", "circuit", "fan", "light", "socket", "electrical", "fuse", "short circuit"] },
    { category: "network", keywords: ["wifi", "internet", "network", "server", "printer", "computer", "projector", "cctv", "camera"] },
    { category: "furniture", keywords: ["chair", "desk", "table", "door", "window", "cupboard", "shelf", "bench", "locker"] },
    { category: "cleaning", keywords: ["dirty", "garbage", "trash", "dust", "stain", "smell", "hygiene", "sweep", "mop", "waste"] },
    { category: "civil", keywords: ["wall", "crack", "ceiling", "floor", "roof", "paint", "tile", "staircase", "railing", "collapse"] },
  ];
  let bestCategory: Category | null = null;
  let bestCount = 0;
  for (const { category, keywords } of categoryKeywords) {
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }
  return bestCount > 0 ? bestCategory : null;
}

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
  if (desc.trim().length < 5)
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
  if (words.length > 3 && new Set(words).size === 1)
    return {
      isSpam: true,
      reason: "Description contains the same word repeated.",
    };
  return { isSpam: false, reason: "" };
}

// ── Smart duplicate detection using word-overlap similarity ──
function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2)
  );
}

function similarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap++;
  }
  return overlap / Math.max(setA.size, setB.size);
}

function findSimilarComplaint(
  title: string,
  description: string,
  existing: Complaint[]
): Complaint | null {
  const inputText = `${title} ${description}`;
  const active = existing.filter(
    (c) => !["completed", "verified", "rejected"].includes(c.status)
  );
  let bestMatch: Complaint | null = null;
  let bestScore = 0;
  for (const c of active) {
    const candidateText = `${c.title} ${c.description}`;
    const titleSim = similarity(title, c.title);
    const fullSim = similarity(inputText, candidateText);
    // weighted: title match matters more
    const score = titleSim * 0.6 + fullSim * 0.4;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }
  // threshold: 0.45 = strong enough overlap to flag
  return bestScore >= 0.45 ? bestMatch : null;
}

// ── Auto-suggest worker by category → specialty mapping ──
const CATEGORY_SPECIALTY_MAP: Record<Category, string[]> = {
  electrical: ["electrician", "technician"],
  plumbing: ["plumber", "technician"],
  furniture: ["technician", "general"],
  network: ["technician", "general"],
  cleaning: ["general", "technician"],
  civil: ["general", "technician"],
  other: ["general", "technician"],
};

function suggestWorker(
  category: Category,
  title: string,
  description: string,
  workers: UserProfile[]
): UserProfile | null {
  const text = `${title} ${description}`.toLowerCase();
  const preferredSpecialties = CATEGORY_SPECIALTY_MAP[category] || ["general"];

  // keyword patterns per specialty
  const keywordMap: Record<string, string> = {
    electrician: "wire|switch|power|voltage|circuit|fan|light|socket|electrical|fuse|short",
    plumber: "pipe|water|leak|tap|drain|flush|toilet|plumb|sewage|tank|bathroom|restroom",
    technician: "projector|computer|network|wifi|server|printer|ac|air condition|camera|cctv",
  };

  let bestWorker: UserProfile | null = null;
  let bestScore = -1;

  for (const worker of workers) {
    const spec = worker.specialty || "general";
    let score = 0;

    // Count how many keywords from the description match this worker's specialty
    const pattern = keywordMap[spec];
    if (pattern) {
      const keywords = pattern.split("|");
      const matchCount = keywords.filter((kw) => text.includes(kw)).length;
      score += matchCount * 10; // keyword matches are strongest signal
    }

    // Category-based bonus (weaker than keyword matches)
    const catIndex = preferredSpecialties.indexOf(spec);
    if (catIndex === 0) score += 5;
    else if (catIndex > 0) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestWorker = worker;
    }
  }
  return bestWorker;
}

export default function NewComplaintPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const existingComplaints = useComplaints();
  const workers = useWorkers();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "electrical" as Category,
    priority: "medium" as Priority,
    location: LOCATIONS[0] as string,
    department: profile?.department || DEPARTMENTS[0],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [imageWarning, setImageWarning] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [duplicateMatch, setDuplicateMatch] = useState<Complaint | null>(null);
  const [suggestedWorker, setSuggestedWorker] = useState<UserProfile | null>(null);
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
        // Auto-detect category from title + description
        const detectedCat = detectCategory(updated.title + " " + updated.description);
        if (detectedCat) {
          updated.category = detectedCat;
        }
        const spam = detectSpam(updated.title, updated.description);
        setSpamWarning(spam.isSpam ? spam.reason : "");
      }
      // Re-check duplicate & worker suggestion on title/description/category change
      if (["title", "description", "category"].includes(field)) {
        setTimeout(() => {
          checkDuplicateSmart(updated.title, updated.description, updated.category);
        }, 300);
      }
      return updated;
    });
  };

  const checkDuplicateSmart = (title: string, desc: string, category: Category) => {
    // Smart similarity-based duplicate detection
    if (title.length < 3 && desc.length < 5) {
      setDuplicateWarning("");
      setDuplicateMatch(null);
      setSuggestedWorker(null);
      return;
    }
    const dup = findSimilarComplaint(title, desc, existingComplaints);
    if (dup) {
      setDuplicateMatch(dup);
      setDuplicateWarning(
        `This issue has already been reported: "${dup.title}" (${dup.status.replace("_", " ")})`
      );
    } else {
      setDuplicateMatch(null);
      setDuplicateWarning("");
    }
    // Auto-suggest worker based on category + description
    const worker = suggestWorker(category, title, desc, workers);
    setSuggestedWorker(worker);
  };

  const checkDuplicate = () => {
    checkDuplicateSmart(form.title, form.description, form.category);
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
    // Block if duplicate found
    if (duplicateMatch) {
      toast.error("This issue has already been reported. Check the existing complaint.");
      return;
    }
    setLoading(true);
    try {
      // Convert audio to data URL for demo mode / upload to storage in production
      let audioUrl: string | undefined;
      if (audio) {
        audioUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audio);
        });
      }

      const complaintId = await addComplaint({
        ...form,
        attachments: [],
        audioAttachment: audioUrl || undefined,
        status: "pending",
        createdBy: profile.uid,
        createdByName: profile.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSpam: false,
      });

      // Notify HOD & admin
      await notifyRole(
        "hod",
        "New Complaint",
        `${profile.name} reported: ${form.title}`,
        "/dashboard/hod",
        form.department
      );
      await notifyRole(
        "admin",
        "New Complaint",
        `${profile.name} reported: ${form.title}`,
        "/dashboard/admin"
      );

      // Auto-assign suggested worker if available
      if (suggestedWorker) {
        await updateComplaint(complaintId, {
          status: "assigned",
          assignedTo: suggestedWorker.uid,
          assignedToName: suggestedWorker.name,
        });
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 48);
        await addTask({
          complaintId,
          complaintTitle: form.title,
          workerId: suggestedWorker.uid,
          workerName: suggestedWorker.name,
          accepted: null,
          deadline,
          status: "assigned",
          completionProof: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await addNotification(
          suggestedWorker.uid,
          "New Task Auto-Assigned",
          `You have been auto-assigned: "${form.title}" based on your specialty.`,
          "/dashboard/worker"
        );
        await addNotification(
          profile.uid,
          "Worker Auto-Assigned",
          `${suggestedWorker.name} (${suggestedWorker.specialty || "general"}) has been automatically assigned to your complaint.`,
          "/dashboard/student"
        );
        toast.success(`Submitted & auto-assigned to ${suggestedWorker.name}!`);
      } else {
        toast.success("Complaint submitted!");
      }
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
          {duplicateMatch && (
            <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20">
              <Copy className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-300">
                Already Reported
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-400 space-y-2">
                <p>{duplicateWarning}</p>
                <div className="flex items-center gap-3 mt-2 p-2.5 rounded-lg bg-red-100/50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-red-900 dark:text-red-200 truncate">{duplicateMatch.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-red-600 dark:text-red-400">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-red-200/50 dark:bg-red-900/40 font-medium">{duplicateMatch.status.replace("_", " ")}</span>
                      <span>{duplicateMatch.location}</span>
                      {duplicateMatch.assignedToName && <span>Assigned to {duplicateMatch.assignedToName}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-1">Please track the existing complaint instead of submitting a new one.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-suggested worker */}
          {suggestedWorker && !duplicateMatch && form.title.length >= 3 && (
            <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-950/20">
              <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <AlertTitle className="text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Smart Worker Match
              </AlertTitle>
              <AlertDescription className="text-cyan-700 dark:text-cyan-400">
                <div className="flex items-center gap-3 mt-2 p-2.5 rounded-lg bg-cyan-100/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-200/50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-cyan-900 dark:text-cyan-200">{suggestedWorker.name}</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 capitalize">{suggestedWorker.specialty || "General"} specialist</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 shrink-0">
                    Auto-assign
                  </Badge>
                </div>
                <p className="text-xs mt-2">This worker will be automatically assigned when you submit based on the issue category and description.</p>
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
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []);
                        // Image spam detection
                        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                        const invalid = selected.filter((f) => !ALLOWED_TYPES.includes(f.type));
                        const tooLarge = selected.filter((f) => f.size > MAX_SIZE);
                        const duplicateNames = selected.filter((f, i) => selected.findIndex((s) => s.name === f.name) !== i);

                        if (invalid.length > 0) {
                          setImageWarning(`Invalid file type: ${invalid.map((f) => f.name).join(", ")}. Only JPEG, PNG, WebP, GIF allowed.`);
                          setFiles([]);
                          return;
                        }
                        if (tooLarge.length > 0) {
                          setImageWarning(`File too large: ${tooLarge.map((f) => f.name).join(", ")}. Max 10MB per image.`);
                          setFiles([]);
                          return;
                        }
                        if (selected.length > 5) {
                          setImageWarning("Maximum 5 images allowed per complaint.");
                          setFiles([]);
                          return;
                        }
                        if (duplicateNames.length > 0) {
                          setImageWarning("Duplicate files detected. Please select unique images.");
                          setFiles([]);
                          return;
                        }
                        setImageWarning("");
                        setFiles(selected);
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  {imageWarning && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {imageWarning}
                    </p>
                  )}
                  {files.length > 0 && !imageWarning && (
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
                    <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Audio attached: {audio.name}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAudio(null)}
                        className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30"
                      >
                        <MicOff className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !!spamWarning || !!imageWarning || !!duplicateMatch}
              size="lg"
              className="w-full shadow-sm transition-all duration-200 hover:brightness-125 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                "Submitting..."
              ) : duplicateMatch ? (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Already Reported — Cannot Submit
                </>
              ) : suggestedWorker ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Submit & Auto-Assign to {suggestedWorker.name}
                </>
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
