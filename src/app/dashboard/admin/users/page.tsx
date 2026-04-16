"use client";

import { useState, useMemo } from "react";
import { useAllUsers, useComplaints, useTasks } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Users,
  GraduationCap,
  Shield,
  Wrench,
  Search,
  Building,
  Mail,
  Phone,
} from "lucide-react";

interface UserProfile {
  uid: string;
  loginId: string;
  name: string;
  email: string;
  role: "student" | "hod" | "admin" | "worker";
  department: string;
  phone: string;
  specialty?: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

const roleBadgeStyles: Record<string, string> = {
  student:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  hod: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  worker:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

const roleLabels: Record<string, string> = {
  student: "Student",
  hod: "HOD",
  admin: "Admin",
  worker: "Worker",
};

export default function AdminUsersPage() {
  const users = useAllUsers() as UserProfile[];
  const complaints = useComplaints();
  const tasks = useTasks();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Derive unique departments from user list
  const departments = useMemo(() => {
    const depts = new Set(users.map((u) => u.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  // Complaint count per student (createdBy → count)
  const complaintCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of complaints) {
      map[c.createdBy] = (map[c.createdBy] || 0) + 1;
    }
    return map;
  }, [complaints]);

  // Task count per worker (workerId → count)
  const taskCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      map[t.workerId] = (map[t.workerId] || 0) + 1;
    }
    return map;
  }, [tasks]);

  // Role counts
  const students = users.filter((u) => u.role === "student");
  const hods = users.filter((u) => u.role === "hod");
  const admins = users.filter((u) => u.role === "admin");
  const workers = users.filter((u) => u.role === "worker");

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (deptFilter !== "all") {
      result = result.filter((u) => u.department === deptFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.loginId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, roleFilter, deptFilter, search]);

  const statCards = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800/50",
    },
    {
      label: "Students",
      value: students.length,
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "HODs",
      value: hods.length,
      icon: Building,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      label: "Admins",
      value: admins.length,
      icon: Shield,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Workers",
      value: workers.length,
      icon: Wrench,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* ── Page Header ── */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              All Users
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} registered user{users.length !== 1 ? "s" : ""}{" "}
              across all roles
            </p>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Filters ── */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or login ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 rounded-lg text-sm"
                  />
                </div>

                {/* Role filter */}
                <Select
                  value={roleFilter}
                  onValueChange={(v) => { if (v) setRoleFilter(v); }}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm rounded-lg">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="hod">HOD</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                  </SelectContent>
                </Select>

                {/* Department filter */}
                <Select
                  value={deptFilter}
                  onValueChange={(v) => { if (v) setDeptFilter(v); }}
                >
                  <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm rounded-lg">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── Users Table ── */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Users
                <Badge variant="secondary" className="ml-1 text-xs font-mono">
                  {filteredUsers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Users className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Login ID</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          Department
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Phone
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Activity
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Joined
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.uid} className="group">
                          {/* Avatar + Name */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback
                                  className={`text-xs font-semibold ${
                                    user.role === "student"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                      : user.role === "hod"
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                        : user.role === "admin"
                                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                  }`}
                                >
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate max-w-[180px]">
                                  {user.name}
                                </p>
                                {user.specialty && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.specialty}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Login ID */}
                          <TableCell>
                            <span className="text-sm font-mono text-muted-foreground">
                              {user.loginId}
                            </span>
                          </TableCell>

                          {/* Role Badge */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize font-medium ${roleBadgeStyles[user.role]}`}
                            >
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>

                          {/* Department */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {user.department}
                              </span>
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {user.email}
                              </span>
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{user.phone || "--"}</span>
                            </div>
                          </TableCell>

                          {/* Activity: complaints for students, tasks for workers */}
                          <TableCell className="hidden xl:table-cell">
                            {user.role === "student" && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {complaintCountMap[user.uid] || 0} complaint
                                {(complaintCountMap[user.uid] || 0) !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}
                            {user.role === "worker" && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                {taskCountMap[user.uid] || 0} task
                                {(taskCountMap[user.uid] || 0) !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}
                            {user.role !== "student" &&
                              user.role !== "worker" && (
                                <span className="text-xs text-muted-foreground">
                                  --
                                </span>
                              )}
                          </TableCell>

                          {/* Joined Date */}
                          <TableCell className="hidden xl:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
