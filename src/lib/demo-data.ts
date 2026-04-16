import { Complaint, Task, Feedback, UserProfile, Notification, Announcement } from "./types";

// --- Simple hash for demo password storage ---
function hashPassword(plain: string): string {
  let hash = 0;
  for (let i = 0; i < plain.length; i++) {
    const chr = plain.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "hashed_" + Math.abs(hash).toString(36);
}

// --- Demo Credentials ---
export interface DemoCredential {
  loginId: string;
  passwordHash: string;
  plainPassword: string; // only for display on login page
  uid: string;
  role: "student" | "hod" | "admin" | "worker";
  label: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  // Students
  { loginId: "22CSE101", plainPassword: "15-08-2004", passwordHash: hashPassword("15-08-2004"), uid: "stu-22cse101", role: "student", label: "Aarav Sharma (CSE)" },
  { loginId: "22ECE205", plainPassword: "03-11-2004", passwordHash: hashPassword("03-11-2004"), uid: "stu-22ece205", role: "student", label: "Priya Menon (ECE)" },
  // Staff / Admin
  { loginId: "STAFF001", plainPassword: "12-06-1985", passwordHash: hashPassword("12-06-1985"), uid: "staff-001", role: "hod", label: "Dr. Rajesh Iyer (HOD - CSE)" },
  { loginId: "ADMIN001", plainPassword: "25-09-1980", passwordHash: hashPassword("25-09-1980"), uid: "admin-001", role: "admin", label: "Priya Kapoor (Admin)" },
  // Workers
  { loginId: "rajesh@electrician", plainPassword: "10-04-1990", passwordHash: hashPassword("10-04-1990"), uid: "wrk-rajesh", role: "worker", label: "Rajesh (Electrician)" },
  { loginId: "kumar@plumber", plainPassword: "22-01-1988", passwordHash: hashPassword("22-01-1988"), uid: "wrk-kumar", role: "worker", label: "Kumar (Plumber)" },
  { loginId: "mani@technician", plainPassword: "14-07-1992", passwordHash: hashPassword("14-07-1992"), uid: "wrk-mani", role: "worker", label: "Mani (Technician)" },
];

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

export { hashPassword };

// --- Demo Users ---
export const DEMO_USERS: Record<string, UserProfile> = {
  "stu-22cse101": {
    uid: "stu-22cse101",
    loginId: "22CSE101",
    name: "Aarav Sharma",
    email: "aarav@campus.edu",
    role: "student",
    department: "Computer Science",
    phone: "9876543210",
    mustChangePassword: false,
    createdAt: new Date("2025-08-15"),
  },
  "stu-22ece205": {
    uid: "stu-22ece205",
    loginId: "22ECE205",
    name: "Priya Menon",
    email: "priya.m@campus.edu",
    role: "student",
    department: "Electronics & Communication",
    phone: "9876543215",
    mustChangePassword: false,
    createdAt: new Date("2025-08-15"),
  },
  "staff-001": {
    uid: "staff-001",
    loginId: "STAFF001",
    name: "Dr. Rajesh Iyer",
    email: "rajesh@campus.edu",
    role: "hod",
    department: "Computer Science",
    phone: "9876543212",
    mustChangePassword: false,
    createdAt: new Date("2024-06-01"),
  },
  "admin-001": {
    uid: "admin-001",
    loginId: "ADMIN001",
    name: "Priya Kapoor",
    email: "priya.k@campus.edu",
    role: "admin",
    department: "Administration",
    phone: "9876543211",
    mustChangePassword: false,
    createdAt: new Date("2025-01-10"),
  },
  "wrk-rajesh": {
    uid: "wrk-rajesh",
    loginId: "rajesh@electrician",
    name: "Rajesh",
    email: "rajesh.w@campus.edu",
    role: "worker",
    department: "General",
    phone: "9876543213",
    specialty: "electrician",
    mustChangePassword: false,
    createdAt: new Date("2025-03-20"),
  },
  "wrk-kumar": {
    uid: "wrk-kumar",
    loginId: "kumar@plumber",
    name: "Kumar",
    email: "kumar.w@campus.edu",
    role: "worker",
    department: "General",
    phone: "9876543214",
    specialty: "plumber",
    mustChangePassword: false,
    createdAt: new Date("2025-04-10"),
  },
  "wrk-mani": {
    uid: "wrk-mani",
    loginId: "mani@technician",
    name: "Mani",
    email: "mani.w@campus.edu",
    role: "worker",
    department: "General",
    phone: "9876543216",
    specialty: "technician",
    mustChangePassword: false,
    createdAt: new Date("2025-05-01"),
  },
};

// --- Demo password store (loginId -> hash) ---
export const DEMO_PASSWORDS: Record<string, string> = {};
DEMO_CREDENTIALS.forEach((c) => {
  DEMO_PASSWORDS[c.loginId.toLowerCase()] = c.passwordHash;
});

// --- Demo Data ---
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);
const hoursFromNow = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

export const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: "c1",
    title: "Power outage in Lab 2",
    description: "Complete power failure in Computer Lab 2 since morning. All systems are down, affecting ongoing project work for 60+ students.",
    category: "electrical",
    priority: "critical",
    location: "Lab 2",
    department: "Computer Science",
    attachments: [],
    status: "in_progress",
    createdBy: "stu-22cse101",
    createdByName: "Aarav Sharma",
    assignedTo: "wrk-rajesh",
    assignedToName: "Rajesh",
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(6),
  },
  {
    id: "c2",
    title: "Water leakage in Block A corridor",
    description: "Persistent water leakage from the ceiling near Room 201. The floor is slippery and poses a safety hazard.",
    category: "plumbing",
    priority: "high",
    location: "Block A",
    department: "Civil Engineering",
    attachments: [],
    status: "assigned",
    createdBy: "stu-22cse101",
    createdByName: "Aarav Sharma",
    assignedTo: "wrk-kumar",
    assignedToName: "Kumar",
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(3),
  },
  {
    id: "c3",
    title: "Broken chairs in Room 305",
    description: "5 chairs in Room 305 have broken armrests and are uncomfortable for students during lectures.",
    category: "furniture",
    priority: "medium",
    location: "Block C",
    department: "Computer Science",
    attachments: [],
    status: "pending",
    createdBy: "stu-22cse101",
    createdByName: "Aarav Sharma",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: "c4",
    title: "WiFi not working in Hostel 1",
    description: "WiFi has been down for the past 2 days in Hostel 1, Block B. Students are unable to access online resources.",
    category: "network",
    priority: "high",
    location: "Hostel 1",
    department: "Hostel",
    attachments: [],
    status: "reviewed",
    createdBy: "stu-22ece205",
    createdByName: "Priya Menon",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: "c5",
    title: "Dirty washrooms in Block B",
    description: "The washrooms on the 2nd floor of Block B have not been cleaned for days. Very unhygienic conditions.",
    category: "cleaning",
    priority: "medium",
    location: "Block B",
    department: "Administration",
    attachments: [],
    status: "verified",
    createdBy: "stu-22cse101",
    createdByName: "Aarav Sharma",
    assignedTo: "wrk-mani",
    assignedToName: "Mani",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
  },
  {
    id: "c6",
    title: "Cracked wall in Auditorium",
    description: "A significant crack has appeared on the left wall of the main auditorium near the stage area.",
    category: "civil",
    priority: "high",
    location: "Auditorium",
    department: "Administration",
    attachments: [],
    status: "completed",
    createdBy: "stu-22ece205",
    createdByName: "Priya Menon",
    assignedTo: "wrk-mani",
    assignedToName: "Mani",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(6),
  },
  {
    id: "c7",
    title: "Projector not working in Room 101",
    description: "The ceiling-mounted projector in Room 101 is not turning on. Tried all troubleshooting steps.",
    category: "electrical",
    priority: "medium",
    location: "Block A",
    department: "Electronics & Communication",
    attachments: [],
    status: "rejected",
    createdBy: "stu-22ece205",
    createdByName: "Priya Menon",
    rejectionReason: "Projector has been replaced. New one is in Room 102.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
  },
  {
    id: "c8",
    title: "AC not cooling in Library",
    description: "The air conditioning system on the ground floor of the library is blowing warm air.",
    category: "electrical",
    priority: "medium",
    location: "Library",
    department: "Library",
    attachments: [],
    status: "quotation_submitted",
    createdBy: "stu-22cse101",
    createdByName: "Aarav Sharma",
    assignedTo: "wrk-rajesh",
    assignedToName: "Rajesh",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  },
];

export const DEMO_TASKS: Task[] = [
  {
    id: "t1", complaintId: "c1", complaintTitle: "Power outage in Lab 2",
    workerId: "wrk-rajesh", workerName: "Rajesh", accepted: true,
    deadline: hoursFromNow(18), status: "in_progress", completionProof: [],
    createdAt: daysAgo(1), updatedAt: hoursAgo(6),
  },
  {
    id: "t2", complaintId: "c2", complaintTitle: "Water leakage in Block A corridor",
    workerId: "wrk-kumar", workerName: "Kumar", accepted: null,
    deadline: hoursFromNow(42), status: "assigned", completionProof: [],
    createdAt: hoursAgo(6), updatedAt: hoursAgo(6),
  },
  {
    id: "t3", complaintId: "c5", complaintTitle: "Dirty washrooms in Block B",
    workerId: "wrk-mani", workerName: "Mani", accepted: true,
    deadline: daysAgo(4), status: "completed", completionProof: [],
    notes: "Deep cleaned all washrooms on 2nd floor. Replaced broken flush in cubicle 3.",
    createdAt: daysAgo(6), updatedAt: daysAgo(4),
  },
  {
    id: "t4", complaintId: "c6", complaintTitle: "Cracked wall in Auditorium",
    workerId: "wrk-mani", workerName: "Mani", accepted: true,
    quotationAmount: 15000, quotationNote: "Need cement, plaster, paint. Estimated 2 days work.",
    quotationApproved: true, deadline: daysAgo(6), status: "completed", completionProof: [],
    notes: "Wall repaired and repainted. Structural integrity verified.",
    createdAt: daysAgo(9), updatedAt: daysAgo(6),
  },
  {
    id: "t5", complaintId: "c8", complaintTitle: "AC not cooling in Library",
    workerId: "wrk-rajesh", workerName: "Rajesh", accepted: true,
    quotationAmount: 8500, quotationNote: "Compressor gas refill and filter replacement needed.",
    deadline: hoursFromNow(10), status: "quotation_submitted", completionProof: [],
    createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
];

export const DEMO_FEEDBACK: Feedback[] = [
  { id: "f1", complaintId: "c5", studentId: "stu-22cse101", studentName: "Aarav Sharma", rating: 4, feedbackText: "Good job cleaning. Much better now!", createdAt: daysAgo(3) },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n1", userId: "stu-22cse101", title: "Complaint Update", message: "Your complaint \"Power outage in Lab 2\" is now in progress.", read: false, link: "/dashboard/student", createdAt: hoursAgo(6) },
  { id: "n2", userId: "stu-22cse101", title: "Complaint Reviewed", message: "Your complaint \"WiFi not working\" has been reviewed by HOD.", read: true, link: "/dashboard/student", createdAt: daysAgo(2) },
  { id: "n3", userId: "admin-001", title: "New Complaint", message: "Aarav Sharma reported: Broken chairs in Room 305", read: false, link: "/dashboard/admin", createdAt: daysAgo(0) },
  { id: "n4", userId: "admin-001", title: "Quotation Submitted", message: "Rajesh submitted ₹8500 for \"AC not cooling in Library\"", read: false, link: "/dashboard/admin", createdAt: daysAgo(1) },
  { id: "n5", userId: "wrk-rajesh", title: "New Task Assigned", message: "You have been assigned: Power outage in Lab 2", read: true, link: "/dashboard/worker", createdAt: daysAgo(1) },
  { id: "n6", userId: "staff-001", title: "New Complaint", message: "Aarav Sharma reported: Broken chairs in Room 305", read: false, link: "/dashboard/hod", createdAt: daysAgo(0) },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", department: "Computer Science", title: "Lab Maintenance Schedule", message: "All labs in Block A will undergo maintenance this weekend. Plan accordingly.", createdBy: "staff-001", createdByName: "Dr. Rajesh Iyer", createdAt: daysAgo(1) },
  { id: "a2", department: "Computer Science", title: "New Equipment Installed", message: "New projectors and desktops have been installed in Lab 3.", createdBy: "staff-001", createdByName: "Dr. Rajesh Iyer", createdAt: daysAgo(5) },
];
