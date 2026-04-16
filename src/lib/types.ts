export type UserRole = "student" | "hod" | "admin" | "worker";

export type WorkerSpecialty = "electrician" | "plumber" | "technician" | "general";

export type ComplaintStatus =
  | "pending"
  | "reviewed"
  | "assigned"
  | "in_progress"
  | "quotation_submitted"
  | "quotation_approved"
  | "completed"
  | "verified"
  | "rejected"
  | "escalated";

export type Priority = "low" | "medium" | "high" | "critical";

export type Category =
  | "electrical"
  | "plumbing"
  | "furniture"
  | "network"
  | "cleaning"
  | "civil"
  | "other";

export const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Administration",
  "Library",
  "Hostel",
  "Cafeteria",
  "Sports Complex",
  "General",
] as const;

export const LOCATIONS = [
  "Block A",
  "Block B",
  "Block C",
  "Block D",
  "Main Building",
  "Library",
  "Hostel 1",
  "Hostel 2",
  "Cafeteria",
  "Sports Complex",
  "Auditorium",
  "Lab 1",
  "Lab 2",
  "Lab 3",
] as const;

export interface UserProfile {
  uid: string;
  loginId: string;        // Roll No / Staff ID / name@specialty
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  specialty?: WorkerSpecialty; // for workers
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  location: string;
  department: string;
  attachments: string[];
  audioAttachment?: string;
  status: ComplaintStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
  isSpam?: boolean;
  escalatedAt?: Date;
}

export interface Task {
  id: string;
  complaintId: string;
  complaintTitle: string;
  workerId: string;
  workerName: string;
  accepted: boolean | null;
  quotationAmount?: number;
  quotationNote?: string;
  quotationApproved?: boolean;
  deadline: Date;
  status: "assigned" | "accepted" | "in_progress" | "quotation_submitted" | "completed" | "rejected" | "escalated";
  completionProof: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  complaintId: string;
  studentId: string;
  studentName: string;
  rating: number;
  feedbackText: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  department: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export type IdeaStatus = "pending" | "approved_by_hod" | "approved_by_admin" | "rejected";

export interface Idea {
  id: string;
  title: string;
  description: string;
  department: string;
  status: IdeaStatus;
  createdBy: string;
  createdByName: string;
  rejectionReason?: string;
  hodReviewedBy?: string;
  hodReviewedByName?: string;
  adminReviewedBy?: string;
  adminReviewedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}
