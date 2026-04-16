"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  GraduationCap,
  Shield,
  Wrench,
  Eye,
  EyeOff,
  LogIn,
  Building2,
  ClipboardCheck,
  Users,
  Zap,
} from "lucide-react";

type RoleTab = "student" | "staff" | "worker";

const tabConfig: Record<
  RoleTab,
  { icon: React.ReactNode; idLabel: string; idPlaceholder: string }
> = {
  student: {
    icon: <GraduationCap className="h-4 w-4" />,
    idLabel: "Roll Number",
    idPlaceholder: "e.g. 22CSE101",
  },
  staff: {
    icon: <Shield className="h-4 w-4" />,
    idLabel: "Staff ID",
    idPlaceholder: "e.g. STAFF001",
  },
  worker: {
    icon: <Wrench className="h-4 w-4" />,
    idLabel: "Username",
    idPlaceholder: "e.g. rajesh@electrician",
  },
};

const demoByRole: Record<RoleTab, typeof DEMO_CREDENTIALS> = {
  student: DEMO_CREDENTIALS.filter((c) => c.role === "student"),
  staff: DEMO_CREDENTIALS.filter((c) => c.role === "hod" || c.role === "admin"),
  worker: DEMO_CREDENTIALS.filter((c) => c.role === "worker"),
};

export default function LoginPage() {
  const { login, isDemoMode } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoleTab>("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cfg = tabConfig[activeTab];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await login(loginId, password);
      toast.success(`Welcome, ${profile.name}!`);
      router.push(
        profile.mustChangePassword
          ? "/change-password"
          : `/dashboard/${profile.role}`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left hero panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        {/* Decorative background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-sm font-bold text-2xl mb-6 ring-1 ring-white/20">
              CO
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              CampusOps
            </h1>
            <p className="text-lg text-primary-foreground/70 mt-3 max-w-md">
              Smart Campus Issue Reporter. Report, track, and resolve campus
              issues seamlessly.
            </p>
          </div>

          <div className="space-y-5 mt-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Report Issues Instantly</p>
                <p className="text-sm text-primary-foreground/60 mt-0.5">
                  Submit complaints with photos and location details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Role-Based Workflows</p>
                <p className="text-sm text-primary-foreground/60 mt-0.5">
                  Students, staff, and workers each have tailored dashboards
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Real-Time Tracking</p>
                <p className="text-sm text-primary-foreground/60 mt-0.5">
                  Monitor issue resolution from submission to completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground font-bold text-base mb-3">
              CO
            </div>
            <h1 className="text-xl font-bold text-foreground">CampusOps</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Smart Campus Issue Reporter
            </p>
          </div>

          {/* Desktop heading above card */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as RoleTab);
                  setLoginId("");
                  setPassword("");
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="student"
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Student</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="staff"
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Staff</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="worker"
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Worker</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-5 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginId">{cfg.idLabel}</Label>
                      <Input
                        id="loginId"
                        type="text"
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder={cfg.idPlaceholder}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="DD-MM-YYYY"
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Use your Date of Birth as password
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 mt-2"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Signing in...
                        </span>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" /> Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Demo Credentials */}
              {isDemoMode && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Quick Demo Access
                    </p>
                    <div className="grid gap-2">
                      {demoByRole[activeTab].map((acc) => (
                        <button
                          key={acc.loginId}
                          type="button"
                          onClick={() => {
                            setLoginId(acc.loginId);
                            setPassword(acc.plainPassword);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-accent/60 transition-all text-left text-sm group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary">
                              {activeTab === "student" && (
                                <GraduationCap className="h-3.5 w-3.5" />
                              )}
                              {activeTab === "staff" && (
                                <Shield className="h-3.5 w-3.5" />
                              )}
                              {activeTab === "worker" && (
                                <Wrench className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-foreground group-hover:text-primary transition-colors block text-sm">
                                {acc.loginId}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {acc.label}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] capitalize"
                          >
                            {acc.role}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Building2 className="inline h-3 w-3 mr-1 -mt-0.5" />
            Campus Operations Management System
          </p>
        </div>
      </div>
    </div>
  );
}
