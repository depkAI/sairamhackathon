"use client";

import { useState, useEffect } from "react";
import { Complaint, Task, Feedback, Notification, UserProfile, Announcement, Idea } from "./types";
import { supabase } from "./supabase";
import {
  DEMO_COMPLAINTS,
  DEMO_TASKS,
  DEMO_FEEDBACK,
  DEMO_NOTIFICATIONS,
  DEMO_USERS,
  DEMO_ANNOUNCEMENTS,
  DEMO_IDEAS,
} from "./demo-data";

// Demo mode: always true for hackathon — uses localStorage-backed data
const isDemoMode = true;

// ── Persistent demo store (survives page reloads & login/logout) ──
const STORAGE_KEY = "campus-ops-demo";

function reviveDates<T>(arr: T[]): T[] {
  return arr.map((item) => {
    const obj = item as Record<string, unknown>;
    const out: Record<string, unknown> = { ...obj };
    for (const key of Object.keys(out)) {
      if (
        typeof out[key] === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(out[key] as string)
      ) {
        out[key] = new Date(out[key] as string);
      }
    }
    return out as T;
  });
}

function loadStore() {
  if (typeof window === "undefined") {
    return {
      complaints: [...DEMO_COMPLAINTS],
      tasks: [...DEMO_TASKS],
      feedback: [...DEMO_FEEDBACK],
      notifications: [...DEMO_NOTIFICATIONS],
      announcements: [...DEMO_ANNOUNCEMENTS],
      ideas: [...DEMO_IDEAS],
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        complaints: reviveDates<Complaint>(parsed.complaints),
        tasks: reviveDates<Task>(parsed.tasks),
        feedback: reviveDates<Feedback>(parsed.feedback),
        notifications: reviveDates<Notification>(parsed.notifications),
        announcements: reviveDates<Announcement>(parsed.announcements),
        ideas: reviveDates<Idea>(parsed.ideas || []),
      };
    }
  } catch { /* corrupted — reset */ }
  return {
    complaints: [...DEMO_COMPLAINTS],
    tasks: [...DEMO_TASKS],
    feedback: [...DEMO_FEEDBACK],
    notifications: [...DEMO_NOTIFICATIONS],
    announcements: [...DEMO_ANNOUNCEMENTS],
    ideas: [...DEMO_IDEAS],
  };
}

function saveStore() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      complaints: demoComplaints,
      tasks: demoTasks,
      feedback: demoFeedback,
      notifications: demoNotifications,
      announcements: demoAnnouncements,
      ideas: demoIdeas,
    }));
  } catch { /* storage full — ignore */ }
}

const initial = loadStore();
let demoComplaints = initial.complaints;
let demoTasks = initial.tasks;
let demoFeedback = initial.feedback;
let demoNotifications = initial.notifications;
let demoAnnouncements = initial.announcements;
let demoIdeas = initial.ideas;

type Listener = () => void;
const listeners: Set<Listener> = new Set();
function notify() {
  saveStore();
  listeners.forEach((l) => l());
}

export function resetDemoData() {
  demoComplaints = [...DEMO_COMPLAINTS];
  demoTasks = [...DEMO_TASKS];
  demoFeedback = [...DEMO_FEEDBACK];
  demoNotifications = [...DEMO_NOTIFICATIONS];
  demoAnnouncements = [...DEMO_ANNOUNCEMENTS];
  demoIdeas = [...DEMO_IDEAS];
  saveStore();
  notify();
}

export function useDemoRefresh(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return tick;
}

function filterBy<T>(arr: T[], filter?: { field: string; value: string }): T[] {
  if (!filter) return arr;
  return arr.filter((item) => {
    const val = (item as unknown as Record<string, unknown>)[filter.field];
    return val === filter.value;
  });
}

// ── Helper: map Supabase row → Complaint ──
function toComplaint(row: Record<string, unknown>): Complaint {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as Complaint["category"],
    priority: row.priority as Complaint["priority"],
    location: row.location as string,
    department: row.department as string,
    attachments: (row.attachments as string[]) || [],
    audioAttachment: row.audio_url as string | undefined,
    status: row.status as Complaint["status"],
    createdBy: row.created_by as string,
    createdByName: row.created_by_name as string,
    assignedTo: row.assigned_to as string | undefined,
    assignedToName: row.assigned_to_name as string | undefined,
    rejectionReason: row.rejection_reason as string | undefined,
    isSpam: row.is_spam as boolean | undefined,
    escalatedAt: row.escalated_at ? new Date(row.escalated_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function toTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    complaintId: row.complaint_id as string,
    complaintTitle: row.complaint_title as string,
    workerId: row.worker_id as string,
    workerName: row.worker_name as string,
    accepted: row.accepted as boolean | null,
    quotationAmount: row.quotation_amount as number | undefined,
    quotationNote: row.quotation_note as string | undefined,
    quotationApproved: row.quotation_approved as boolean | undefined,
    deadline: new Date(row.deadline as string),
    status: row.status as Task["status"],
    completionProof: (row.completion_proof as string[]) || [],
    notes: row.notes as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function toFeedback(row: Record<string, unknown>): Feedback {
  return {
    id: row.id as string,
    complaintId: row.complaint_id as string,
    studentId: row.student_id as string,
    studentName: row.student_name as string,
    rating: row.rating as number,
    feedbackText: row.feedback_text as string,
    createdAt: new Date(row.created_at as string),
  };
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    message: row.message as string,
    read: row.read as boolean,
    link: row.link as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function toAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    department: row.department as string,
    title: row.title as string,
    message: row.message as string,
    createdBy: row.created_by as string,
    createdByName: row.created_by_name as string,
    createdAt: new Date(row.created_at as string),
  };
}

// ═══════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════
export function useComplaints(filter?: { field: string; value: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      const data = filterBy(demoComplaints, filter);
      setComplaints(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }

    // Initial fetch
    const fetchComplaints = async () => {
      let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (filter) {
        const col = filter.field === "createdBy" ? "created_by" : filter.field === "assignedTo" ? "assigned_to" : filter.field;
        query = query.eq(col, filter.value);
      }
      const { data } = await query;
      if (data) setComplaints(data.map(toComplaint));
    };
    fetchComplaints();

    // Realtime subscription
    const channel = supabase
      .channel("complaints-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter?.field, filter?.value, tick]);

  return complaints;
}

export async function addComplaint(data: Omit<Complaint, "id">) {
  if (isDemoMode) {
    const c = { ...data, id: `c${Date.now()}` } as Complaint;
    demoComplaints.unshift(c);
    notify();
    return c.id;
  }
  const { data: row, error } = await supabase.from("complaints").insert({
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    location: data.location,
    department: data.department,
    attachments: data.attachments,
    audio_url: data.audioAttachment || null,
    status: data.status,
    created_by: data.createdBy,
    created_by_name: data.createdByName,
    assigned_to: data.assignedTo || null,
    assigned_to_name: data.assignedToName || null,
    is_spam: data.isSpam || false,
  }).select("id").single();
  if (error) throw error;
  return row!.id;
}

export async function updateComplaint(id: string, data: Partial<Complaint>) {
  if (isDemoMode) {
    demoComplaints = demoComplaints.map((c) => c.id === id ? { ...c, ...data, updatedAt: new Date() } : c);
    notify(); return;
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.status !== undefined) update.status = data.status;
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.assignedTo !== undefined) update.assigned_to = data.assignedTo;
  if (data.assignedToName !== undefined) update.assigned_to_name = data.assignedToName;
  if (data.rejectionReason !== undefined) update.rejection_reason = data.rejectionReason;
  if (data.isSpam !== undefined) update.is_spam = data.isSpam;
  if (data.escalatedAt !== undefined) update.escalated_at = (data.escalatedAt as Date).toISOString();

  const { error } = await supabase.from("complaints").update(update).eq("id", id);
  if (error) throw error;
}

// ═══════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════
export function useTasks(filter?: { field: string; value: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      setTasks(filterBy(demoTasks, filter).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }

    const fetchTasks = async () => {
      let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (filter) {
        const col = filter.field === "workerId" ? "worker_id" : filter.field === "complaintId" ? "complaint_id" : filter.field;
        query = query.eq(col, filter.value);
      }
      const { data } = await query;
      if (data) setTasks(data.map(toTask));
    };
    fetchTasks();

    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter?.field, filter?.value, tick]);

  return tasks;
}

export async function addTask(data: Omit<Task, "id">) {
  if (isDemoMode) {
    const t = { ...data, id: `t${Date.now()}` } as Task;
    demoTasks.unshift(t); notify(); return t.id;
  }
  const { data: row, error } = await supabase.from("tasks").insert({
    complaint_id: data.complaintId,
    complaint_title: data.complaintTitle,
    worker_id: data.workerId,
    worker_name: data.workerName,
    accepted: data.accepted,
    deadline: (data.deadline as Date).toISOString(),
    status: data.status,
    completion_proof: data.completionProof,
  }).select("id").single();
  if (error) throw error;
  return row!.id;
}

export async function updateTask(id: string, data: Partial<Task>) {
  if (isDemoMode) {
    demoTasks = demoTasks.map((t) => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t);
    notify(); return;
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.accepted !== undefined) update.accepted = data.accepted;
  if (data.status !== undefined) update.status = data.status;
  if (data.quotationAmount !== undefined) update.quotation_amount = data.quotationAmount;
  if (data.quotationNote !== undefined) update.quotation_note = data.quotationNote;
  if (data.quotationApproved !== undefined) update.quotation_approved = data.quotationApproved;
  if (data.completionProof !== undefined) update.completion_proof = data.completionProof;
  if (data.notes !== undefined) update.notes = data.notes;

  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  if (error) throw error;
}

// ═══════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════
export function useFeedback(filter?: { field: string; value: string }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) { setFeedback(filterBy(demoFeedback, filter)); return; }

    const fetchFeedback = async () => {
      let query = supabase.from("feedback").select("*").order("created_at", { ascending: false });
      if (filter) {
        const col = filter.field === "complaintId" ? "complaint_id" : filter.field === "studentId" ? "student_id" : filter.field;
        query = query.eq(col, filter.value);
      }
      const { data } = await query;
      if (data) setFeedback(data.map(toFeedback));
    };
    fetchFeedback();

    const channel = supabase
      .channel("feedback-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => {
        fetchFeedback();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter?.field, filter?.value, tick]);

  return feedback;
}

export async function addFeedback(data: Omit<Feedback, "id">) {
  if (isDemoMode) { demoFeedback.push({ ...data, id: `f${Date.now()}` } as Feedback); notify(); return; }
  const { error } = await supabase.from("feedback").insert({
    complaint_id: data.complaintId,
    student_id: data.studentId,
    student_name: data.studentName,
    rating: data.rating,
    feedback_text: data.feedbackText,
  });
  if (error) throw error;
}

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      setNotifications(demoNotifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data.map(toNotification));
    };
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, tick]);

  return notifications;
}

export async function addNotification(userId: string, title: string, message: string, link?: string) {
  if (isDemoMode) {
    demoNotifications.unshift({ id: `n${Date.now()}`, userId, title, message, read: false, link, createdAt: new Date() });
    notify(); return;
  }
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    link,
  });
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  if (isDemoMode) {
    demoNotifications = demoNotifications.map((n) => n.id === id ? { ...n, read: true } : n);
    notify(); return;
  }
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  if (isDemoMode) {
    demoNotifications = demoNotifications.map((n) => n.userId === userId ? { ...n, read: true } : n);
    notify(); return;
  }
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

// ═══════════════════════════════════════════
// WORKERS
// ═══════════════════════════════════════════
export function useWorkers() {
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (isDemoMode) {
      setWorkers(Object.values(DEMO_USERS).filter((u) => u.role === "worker"));
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "worker");
      if (data) {
        setWorkers(data.map((row) => ({
          uid: row.id,
          loginId: row.login_id,
          name: row.name,
          email: row.email,
          role: row.role as UserProfile["role"],
          department: row.department,
          phone: row.phone,
          specialty: row.specialty,
          mustChangePassword: row.must_change_password,
          createdAt: new Date(row.created_at),
        })));
      }
    })();
  }, []);
  return workers;
}

// ═══════════════════════════════════════════
// NOTIFY ROLES (dynamic lookup instead of hardcoded UIDs)
// ═══════════════════════════════════════════
export async function notifyRole(
  role: "admin" | "hod",
  title: string,
  message: string,
  link?: string,
  department?: string
) {
  if (isDemoMode) {
    const targets = Object.values(DEMO_USERS).filter(
      (u) => u.role === role && (!department || u.department === department)
    );
    for (const t of targets) {
      demoNotifications.unshift({
        id: `n${Date.now()}-${t.uid}`,
        userId: t.uid,
        title,
        message,
        read: false,
        link,
        createdAt: new Date(),
      });
    }
    notify();
    return;
  }
  let query = supabase.from("profiles").select("id").eq("role", role);
  if (department) query = query.eq("department", department);
  const { data } = await query;
  if (data) {
    for (const row of data) {
      await supabase.from("notifications").insert({
        user_id: row.id,
        title,
        message,
        link,
      });
    }
  }
}

// ═══════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════
export async function updateProfile(uid: string, data: { name?: string; phone?: string; email?: string }) {
  if (isDemoMode) {
    const user = DEMO_USERS[uid as keyof typeof DEMO_USERS];
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.phone !== undefined) user.phone = data.phone;
      if (data.email !== undefined) user.email = data.email;
    }
    notify(); return;
  }
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.email !== undefined) update.email = data.email;

  const { error } = await supabase.from("profiles").update(update).eq("id", uid);
  if (error) throw error;
}

// ═══════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════
export function useAnnouncements(department?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      const data = department ? demoAnnouncements.filter((a) => a.department === department) : demoAnnouncements;
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }

    const fetchAnnouncements = async () => {
      let query = supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (department) query = query.eq("department", department);
      const { data } = await query;
      if (data) setAnnouncements(data.map(toAnnouncement));
    };
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [department, tick]);

  return announcements;
}

export async function addAnnouncement(data: Omit<Announcement, "id">) {
  if (isDemoMode) {
    demoAnnouncements.unshift({ ...data, id: `a${Date.now()}` } as Announcement);
    notify(); return;
  }
  const { error } = await supabase.from("announcements").insert({
    department: data.department,
    title: data.title,
    message: data.message,
    created_by: data.createdBy,
    created_by_name: data.createdByName,
  });
  if (error) throw error;
}

// ═══════════════════════════════════════════
// IDEAS
// ═══════════════════════════════════════════
export function useIdeas(filter?: { field: string; value: string }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const tick = useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      setIdeas(filterBy(demoIdeas, filter).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }
  }, [filter?.field, filter?.value, tick]);

  return ideas;
}

export async function addIdea(data: Omit<Idea, "id">) {
  if (isDemoMode) {
    const idea = { ...data, id: `idea${Date.now()}` } as Idea;
    demoIdeas.unshift(idea);
    notify();
    return idea.id;
  }
  return "";
}

export async function updateIdea(id: string, data: Partial<Idea>) {
  if (isDemoMode) {
    demoIdeas = demoIdeas.map((i) => i.id === id ? { ...i, ...data, updatedAt: new Date() } : i);
    notify(); return;
  }
}
