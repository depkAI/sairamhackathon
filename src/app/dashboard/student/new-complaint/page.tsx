"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Category, Priority, DEPARTMENTS, LOCATIONS } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { Upload, Mic, AlertTriangle } from "lucide-react";

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

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => lower.includes(k))) return "critical";
  if (lower.includes("broken") || lower.includes("leak") || lower.includes("not working")) return "high";
  if (lower.includes("slow") || lower.includes("minor") || lower.includes("small")) return "low";
  return "medium";
}

export default function NewComplaintPage() {
  const { profile } = useAuth();
  const router = useRouter();
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

  const update = (field: string, value: string) => {
    setForm((p) => {
      const updated = { ...p, [field]: value };
      if (field === "description" || field === "title") {
        updated.priority = detectPriority(updated.title + " " + updated.description);
      }
      return updated;
    });
  };

  const checkDuplicate = async () => {
    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const q = query(
        collection(db, "complaints"),
        where("location", "==", form.location),
        where("category", "==", form.category),
        where("status", "in", ["pending", "reviewed", "assigned", "in_progress"])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existing = snap.docs[0].data();
        setDuplicateWarning(`Similar complaint exists: "${existing.title}" at ${existing.location}.`);
      } else {
        setDuplicateWarning("");
      }
    } catch { /* demo mode */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const { collection, addDoc, query, where, getDocs } = await import("firebase/firestore");
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { db, storage } = await import("@/lib/firebase");
      const { sendNotification } = await import("@/lib/notifications");

      const attachmentUrls: string[] = [];
      for (const file of files) {
        const storageRef = ref(storage, `complaints/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snap.ref);
        attachmentUrls.push(url);
      }

      let audioUrl = "";
      if (audio) {
        const audioRef = ref(storage, `complaints/audio/${Date.now()}_${audio.name}`);
        const snap = await uploadBytes(audioRef, audio);
        audioUrl = await getDownloadURL(snap.ref);
      }

      const complaint = {
        ...form,
        attachments: attachmentUrls,
        audioAttachment: audioUrl || null,
        status: "pending",
        createdBy: profile.uid,
        createdByName: profile.name,
        assignedTo: null,
        assignedToName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "complaints"), complaint);

      const hodQuery = query(collection(db, "users"), where("role", "==", "hod"), where("department", "==", form.department));
      const hodSnap = await getDocs(hodQuery);
      for (const hodDoc of hodSnap.docs) {
        await sendNotification(hodDoc.id, "New Complaint", `${profile.name} reported: ${form.title}`, "/dashboard/hod");
      }

      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);
      for (const adminDoc of adminSnap.docs) {
        await sendNotification(adminDoc.id, "New Complaint", `${profile.name} reported: ${form.title}`, "/dashboard/admin");
      }

      toast.success("Complaint submitted successfully!");
      router.push("/dashboard/student");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Report an Issue</h1>

          {duplicateWarning && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-yellow-800">{duplicateWarning}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Detailed description of the problem..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => { update("category", e.target.value); checkDuplicate(); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    form.priority === "critical" ? "bg-red-100 text-red-700" :
                    form.priority === "high" ? "bg-yellow-100 text-yellow-700" :
                    form.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {form.priority} (auto)
                  </span>
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => { update("location", e.target.value); checkDuplicate(); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Upload size={16} className="inline mr-1" /> Attachments (images)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mic size={16} className="inline mr-1" /> Audio Recording
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudio(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
