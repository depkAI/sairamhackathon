"use client";

import { ComplaintStatus } from "@/lib/types";

const statusConfig: Record<ComplaintStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700 border border-blue-200" },
  assigned: { label: "Assigned", color: "bg-purple-100 text-purple-700 border border-purple-200" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  quotation_submitted: { label: "Quotation Pending", color: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  quotation_approved: { label: "Quotation Approved", color: "bg-green-100 text-green-700 border border-green-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border border-green-200" },
  verified: { label: "Verified", color: "bg-green-100 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border border-red-200" },
  escalated: { label: "Escalated", color: "bg-orange-100 text-orange-700 border border-orange-200" },
};

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
