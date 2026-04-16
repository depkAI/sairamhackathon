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
import toast from "react-hot-toast";
import {
  GraduationCap,
  Shield,
  Wrench,
  Eye,
  EyeOff,
  LogIn,
  ClipboardCheck,
  Users,
  Zap,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import MouseSpotlight from "@/components/effects/MouseSpotlight";
import AnimatedGrid from "@/components/effects/AnimatedGrid";

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
  const { login } = useAuth();
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-950">
      {/* Left panel — Cyber theme */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gray-950">
        {/* Cyber grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(0,255,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Neon glow blobs */}
        <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[250px] w-[250px] rounded-full bg-teal-400/5 blur-[80px]" />
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.03] to-transparent animate-pulse" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 2xl:px-24 text-white w-full">
          {/* Logo */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 backdrop-blur-sm font-bold text-xl mb-8 shadow-[0_0_20px_rgba(0,255,200,0.15)] hover:shadow-[0_0_30px_rgba(0,255,200,0.3)] hover:border-cyan-400/40 hover:bg-cyan-400/15 transition-all duration-500 cursor-default">
              <span className="text-cyan-400">CO</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                CampusOps
              </span>
            </h1>
            <p className="text-base xl:text-lg text-gray-400 mt-4 max-w-md leading-relaxed">
              Smart Campus Issue Reporter. Report, track, and resolve campus
              issues seamlessly.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {[
              { icon: <ClipboardCheck className="h-5 w-5" />, title: "Report Issues Instantly", desc: "Submit complaints with photos, audio notes, and precise location details" },
              { icon: <Users className="h-5 w-5" />, title: "Role-Based Workflows", desc: "Students, staff, and workers each have tailored dashboards and actions" },
              { icon: <Zap className="h-5 w-5" />, title: "Real-Time Tracking", desc: "Monitor issue resolution from submission to completion with live updates" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 group p-3 -mx-3 rounded-xl hover:bg-cyan-400/[0.04] transition-all duration-300 cursor-default">
                <div className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/15 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(0,255,200,0.15)] group-hover:bg-cyan-400/15 transition-all duration-300">
                  <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">{item.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-gray-100 group-hover:text-cyan-300 transition-colors duration-300">{item.title}</p>
                  <p className="text-sm text-gray-500 group-hover:text-gray-400 mt-1 leading-relaxed transition-colors duration-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="mt-14 pt-8 border-t border-gray-800/60">
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "500+", label: "Issues Resolved" },
                { value: "4.8\u2605", label: "User Rating" },
                { value: "<2hr", label: "Avg Response" },
              ].map((s, i) => (
                <div key={i} className="group p-3 -mx-1 rounded-lg hover:bg-cyan-400/[0.05] transition-all duration-300 cursor-default">
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all duration-300">{s.value}</p>
                  <p className="text-xs text-gray-600 group-hover:text-gray-400 mt-1 uppercase tracking-wider font-medium transition-colors duration-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16 overflow-y-auto relative">
        <MouseSpotlight color="rgba(6, 182, 212, 0.04)" size={600} />
        <AnimatedGrid />
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-500 font-bold text-sm mb-3">
              CO
            </div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-500">CampusOps</h1>
            <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">Smart Campus Issue Reporter</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-7">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="shadow-sm border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-xl hover:shadow-cyan-500/[0.04] dark:hover:shadow-cyan-500/[0.08] hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-500">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-[16px]">Sign in</CardTitle>
              <CardDescription className="text-[13px]">
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as RoleTab);
                  setLoginId("");
                  setPassword("");
                }}
              >
                <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl bg-gray-100/80 dark:bg-gray-800/60">
                  <TabsTrigger value="student" className="gap-1.5 text-[13px] rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="gap-1.5 text-[13px] rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                    <Shield className="h-3.5 w-3.5" />
                    Staff
                  </TabsTrigger>
                  <TabsTrigger value="worker" className="gap-1.5 text-[13px] rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                    <Wrench className="h-3.5 w-3.5" />
                    Worker
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-5 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginId" className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                        {cfg.idLabel}
                      </Label>
                      <Input
                        id="loginId"
                        type="text"
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder={cfg.idPlaceholder}
                        className="h-10 text-[13px] rounded-lg border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-cyan-400/60 focus:ring-cyan-400/20 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.08)] transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="DD-MM-YYYY"
                          className="h-10 text-[13px] pr-10 rounded-lg border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-cyan-400/60 focus:ring-cyan-400/20 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.08)] transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        Use your Date of Birth as password
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 mt-1 text-[13px] font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] text-white border-0 transition-all duration-300"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

              {/* Demo Credentials — always shown for hackathon demo */}
              {(
                <>
                  <div className="h-px bg-gray-100 dark:bg-gray-800" />
                  <div>
                    <p className="text-[12px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                      Quick Demo Access
                    </p>
                    <div className="grid gap-1.5">
                      {demoByRole[activeTab].map((acc) => (
                        <button
                          key={acc.loginId}
                          type="button"
                          onClick={() => {
                            setLoginId(acc.loginId);
                            setPassword(acc.plainPassword);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-cyan-300 dark:hover:border-cyan-800 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 hover:shadow-sm hover:shadow-cyan-500/[0.06] active:scale-[0.99] transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all duration-200">
                              {activeTab === "student" && <GraduationCap className="h-3.5 w-3.5" />}
                              {activeTab === "staff" && <Shield className="h-3.5 w-3.5" />}
                              {activeTab === "worker" && <Wrench className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-200 block text-[13px]">
                                {acc.loginId}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500 text-[13px]">{acc.label}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[12px] capitalize rounded-md group-hover:bg-cyan-100 dark:group-hover:bg-cyan-950/40 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors duration-200">
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

          <p className="text-center text-[13px] text-gray-400 dark:text-gray-500 mt-6">
            Campus Operations Management System
          </p>
        </div>
      </div>
    </div>
  );
}
