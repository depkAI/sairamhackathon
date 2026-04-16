"use client";

import { Badge } from "@/components/ui/badge";
import type { ComplaintStatus } from "@/lib/types";

const config: Record<ComplaintStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
  reviewed: { label: "Reviewed", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  assigned: { label: "Assigned", className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  quotation_submitted: { label: "Quotation Sent", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800" },
  quotation_approved: { label: "Quotation OK", className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  verified: { label: "Verified", className: "bg-green-50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
  escalated: { label: "Escalated", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800" },
};

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  const { label, className } = config[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${className}`}>
      {label}
    </Badge>
  );
}
