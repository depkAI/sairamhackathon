"use client";

import { Badge } from "@/components/ui/badge";
import type { ComplaintStatus } from "@/lib/types";

const config: Record<ComplaintStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  reviewed: { label: "Reviewed", variant: "outline" },
  assigned: { label: "Assigned", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  quotation_submitted: { label: "Quotation Sent", variant: "secondary" },
  quotation_approved: { label: "Quotation OK", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  escalated: { label: "Escalated", variant: "destructive" },
};

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
  return (
    <Badge variant={variant} className="text-[10px] font-medium">
      {label}
    </Badge>
  );
}
