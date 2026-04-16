"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComplaints,
  useTasks,
  useWorkers,
  updateComplaint,
  addTask,
  addNotification,
} from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  FileText,
  MapPin,
  UserCheck,
  Users,
  CalendarDays,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

const priorityColor: Record<string, string> = {
  critical:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  medium:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
};

export default function AdminComplaintsPage() {
  const { profile } = useAuth();
  const complaints = useComplaints();
  const tasks = useTasks();
  const workers = useWorkers();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");

  const filtered = useMemo(() => {
    return complaints
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (priorityFilter !== "all" && c.priority !== priorityFilter)
          return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [complaints, search, statusFilter, priorityFilter]);

  const assignWorker = async () => {
    if (!assignModal || !selectedWorker || !profile) return;
    const worker = workers.find((w) => w.uid === selectedWorker);
    const complaint = complaints.find((c) => c.id === assignModal);
    if (!worker || !complaint) return;
    try {
      await updateComplaint(assignModal, {
        status: "assigned",
        assignedTo: selectedWorker,
        assignedToName: worker.name,
      });
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);
      await addTask({
        complaintId: assignModal,
        complaintTitle: complaint.title,
        workerId: selectedWorker,
        workerName: worker.name,
        accepted: null,
        deadline,
        status: "assigned",
        completionProof: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await addNotification(
        selectedWorker,
        "New Task Assigned",
        `You have been assigned: ${complaint.title}`,
        "/dashboard/worker"
      );
      await addNotification(
        complaint.createdBy,
        "Complaint Update",
        `"${complaint.title}" has been assigned to ${worker.name}`,
        "/dashboard/student"
      );
      toast.success("Worker assigned successfully!");
      setAssignModal(null);
      setSelectedWorker("");
    } catch {
      toast.error("Failed to assign worker");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                All Complaints
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {complaints.length} total complaint
                {complaints.length !== 1 ? "s" : ""}
                {filtered.length !== complaints.length &&
                  ` \u00b7 ${filtered.length} shown`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-lg bg-background border-border"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    if (v) setStatusFilter(v);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-lg">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={priorityFilter}
                  onValueChange={(v) => {
                    if (v) setPriorityFilter(v);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-lg">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Complaints
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs font-mono"
                >
                  {filtered.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No complaints found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Priority</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          Department
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Location
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Assigned Worker
                        </TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => (
                        <TableRow key={c.id} className="group">
                          <TableCell>
                            <div className="min-w-0 max-w-[220px]">
                              <p className="text-sm font-medium text-foreground truncate">
                                {c.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {c.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium capitalize ${
                                priorityColor[c.priority] || ""
                              }`}
                            >
                              {c.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {c.department}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {c.location}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {c.assignedToName ? (
                              <span className="text-sm text-foreground flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {c.assignedToName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {c.assignedToName}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                --
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {(c.status === "pending" ||
                              c.status === "reviewed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs rounded-lg gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setAssignModal(c.id)}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Assign
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Assign Worker Dialog */}
          <Dialog
            open={!!assignModal}
            onOpenChange={(open) => {
              if (!open) {
                setAssignModal(null);
                setSelectedWorker("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Assign Worker
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a worker to handle this complaint. They will receive a
                  48-hour deadline.
                </p>
              </DialogHeader>
              <div className="py-4">
                <ScrollArea className="max-h-[250px]">
                  <Select
                    value={selectedWorker}
                    onValueChange={(v) => setSelectedWorker(v ?? "")}
                  >
                    <SelectTrigger className="w-full h-10 text-sm rounded-lg">
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((w) => (
                        <SelectItem
                          key={w.uid}
                          value={w.uid}
                          className="text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                {w.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {w.name}{" "}
                            <span className="text-muted-foreground">
                              ({w.specialty || w.department})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ScrollArea>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignModal(null);
                    setSelectedWorker("");
                  }}
                  className="h-9 text-sm rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignWorker}
                  disabled={!selectedWorker}
                  className="h-9 text-sm rounded-lg"
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  Assign Worker
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
