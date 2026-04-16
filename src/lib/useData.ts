"use client";

import { useState, useEffect } from "react";
import { Complaint, Task, Feedback, Notification, UserProfile, Announcement } from "./types";
import {
  DEMO_COMPLAINTS,
  DEMO_TASKS,
  DEMO_FEEDBACK,
  DEMO_NOTIFICATIONS,
  DEMO_USERS,
  DEMO_ANNOUNCEMENTS,
} from "./demo-data";

const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// In-memory store for demo mutations
let demoComplaints = [...DEMO_COMPLAINTS];
let demoTasks = [...DEMO_TASKS];
let demoFeedback = [...DEMO_FEEDBACK];
let demoNotifications = [...DEMO_NOTIFICATIONS];
let demoAnnouncements = [...DEMO_ANNOUNCEMENTS];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
function notify() { listeners.forEach((l) => l()); }

export function useDemoRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
}

// Generic filter helper
function filterBy<T>(arr: T[], filter?: { field: string; value: string }): T[] {
  if (!filter) return arr;
  return arr.filter((item) => {
    const val = (item as unknown as Record<string, unknown>)[filter.field];
    return val === filter.value;
  });
}

// --- Complaints ---
export function useComplaints(filter?: { field: string; value: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      const data = filterBy(demoComplaints, filter);
      setComplaints(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const q = filter
          ? query(collection(db, "complaints"), where(filter.field, "==", filter.value))
          : query(collection(db, "complaints"));
        unsub = onSnapshot(q, (snap) => {
          setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
      } catch { /* no firebase */ }
    })();
    return () => unsub?.();
  }, [filter?.field, filter?.value]);
  return complaints;
}

export async function addComplaint(data: Omit<Complaint, "id">) {
  if (isDemoMode) {
    const c = { ...data, id: `c${Date.now()}` } as Complaint;
    demoComplaints.unshift(c);
    notify();
    return c.id;
  }
  const { collection, addDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  return (await addDoc(collection(db, "complaints"), data)).id;
}

export async function updateComplaint(id: string, data: Partial<Complaint>) {
  if (isDemoMode) {
    demoComplaints = demoComplaints.map((c) => c.id === id ? { ...c, ...data, updatedAt: new Date() } : c);
    notify(); return;
  }
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  await updateDoc(doc(db, "complaints", id), { ...data, updatedAt: new Date() });
}

// --- Tasks ---
export function useTasks(filter?: { field: string; value: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      setTasks(filterBy(demoTasks, filter).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const q = filter ? query(collection(db, "tasks"), where(filter.field, "==", filter.value)) : query(collection(db, "tasks"));
        unsub = onSnapshot(q, (snap) => { setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))); });
      } catch { /* no firebase */ }
    })();
    return () => unsub?.();
  }, [filter?.field, filter?.value]);
  return tasks;
}

export async function addTask(data: Omit<Task, "id">) {
  if (isDemoMode) {
    const t = { ...data, id: `t${Date.now()}` } as Task;
    demoTasks.unshift(t); notify(); return t.id;
  }
  const { collection, addDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  return (await addDoc(collection(db, "tasks"), data)).id;
}

export async function updateTask(id: string, data: Partial<Task>) {
  if (isDemoMode) {
    demoTasks = demoTasks.map((t) => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t);
    notify(); return;
  }
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  await updateDoc(doc(db, "tasks", id), { ...data, updatedAt: new Date() });
}

// --- Feedback ---
export function useFeedback(filter?: { field: string; value: string }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) { setFeedback(filterBy(demoFeedback, filter)); return; }
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const q = filter ? query(collection(db, "feedback"), where(filter.field, "==", filter.value)) : query(collection(db, "feedback"));
        unsub = onSnapshot(q, (snap) => { setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Feedback))); });
      } catch { /* no firebase */ }
    })();
    return () => unsub?.();
  }, [filter?.field, filter?.value]);
  return feedback;
}

export async function addFeedback(data: Omit<Feedback, "id">) {
  if (isDemoMode) { demoFeedback.push({ ...data, id: `f${Date.now()}` } as Feedback); notify(); return; }
  const { collection, addDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  await addDoc(collection(db, "feedback"), data);
}

// --- Notifications ---
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      setNotifications(demoNotifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        unsub = onSnapshot(query(collection(db, "notifications"), where("userId", "==", userId)), (snap) => {
          setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
      } catch { /* no firebase */ }
    })();
    return () => unsub?.();
  }, [userId]);
  return notifications;
}

export async function addNotification(userId: string, title: string, message: string, link?: string) {
  if (isDemoMode) {
    demoNotifications.unshift({ id: `n${Date.now()}`, userId, title, message, read: false, link, createdAt: new Date() });
    notify(); return;
  }
  const { sendNotification } = await import("./notifications");
  await sendNotification(userId, title, message, link);
}

// --- Workers ---
export function useWorkers() {
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (isDemoMode) {
      setWorkers(Object.values(DEMO_USERS).filter((u) => u.role === "worker"));
      return;
    }
    (async () => {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "worker")));
        setWorkers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
      } catch { /* no firebase */ }
    })();
  }, []);
  return workers;
}

// --- Announcements ---
export function useAnnouncements(department?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  useDemoRefresh();

  useEffect(() => {
    if (isDemoMode) {
      const data = department ? demoAnnouncements.filter((a) => a.department === department) : demoAnnouncements;
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return;
    }
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const q = department
          ? query(collection(db, "announcements"), where("department", "==", department))
          : query(collection(db, "announcements"));
        unsub = onSnapshot(q, (snap) => {
          setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
      } catch { /* no firebase */ }
    })();
    return () => unsub?.();
  }, [department]);
  return announcements;
}

export async function addAnnouncement(data: Omit<Announcement, "id">) {
  if (isDemoMode) {
    demoAnnouncements.unshift({ ...data, id: `a${Date.now()}` } as Announcement);
    notify(); return;
  }
  const { collection, addDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  await addDoc(collection(db, "announcements"), data);
}
