"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/lib/useData";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  IndianRupee,
  ClipboardCheck,
  Inbox,
} from "lucide-react";

export default function WorkerCompletedTasks() {
  const { profile } = useAuth();
  const tasks = useTasks(
    profile ? { field: "workerId", value: profile.uid } : undefined
  );

  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <ProtectedRoute allowedRoles={["worker"]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8 px-2 sm:px-0 animate-fade-in">
          {/* Page Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Completed Tasks
            </h1>
            <p className="text-muted-foreground">
              History of your completed maintenance work
            </p>
          </div>

          <Separator />

          {/* Completed Tasks Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Completed
              </h2>
              {completedTasks.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-0"
                >
                  {completedTasks.length}
                </Badge>
              )}
            </div>

            {completedTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No completed tasks yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Tasks you complete will appear here for your records.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {completedTasks.map((t) => (
                  <Card
                    key={t.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {t.complaintTitle}
                        </p>
                        {t.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {t.notes}
                          </p>
                        )}
                      </div>
                      {t.quotationAmount && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 font-mono"
                        >
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {t.quotationAmount}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
