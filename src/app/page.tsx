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
import toast from "react-hot-toast";
import {
  Shield,
  Eye,
  EyeOff,
  LogIn,
  ClipboardCheck,
  Users,
  Zap,
  BarChart3,
  Lock,
} from "lucide-react";
import MouseSpotlight from "@/components/effects/MouseSpotlight";
import AnimatedGrid from "@/components/effects/AnimatedGrid";

const staffCredentials = DEMO_CREDENTIALS.filter(
  (c) => c.role === "hod" || c.role === "admin"
);

export default function Home() {
  const { login, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (!authLoading && profile) {
    router.push(`/dashboard/${profile.role}`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const prof = await login(loginId, password);
      toast.success(`Welcome, ${prof.name}!`);
      router.push(
        prof.mustChangePassword ? "/change-password" : `/dashboard/${prof.role}`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-950">
      {/* Left branding panel — Cyber theme */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gray-950">
        {/* Cyber grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(0,255,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Neon glow blobs */}
        <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[250px] w-[250px] rounded-full bg-teal-400/5 blur-[80px]" />
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.03] to-transparent animate-pulse" />

        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20 text-white">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 backdrop-blur-sm font-bold text-xl mb-8 shadow-[0_0_20px_rgba(0,255,200,0.15)]">
              <span className="text-cyan-400">CO</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                CampusOps
              </span>
            </h1>
            <p className="text-[15px] text-gray-400 mt-2.5 max-w-sm leading-relaxed">
              Staff & Admin Portal — Manage campus infrastructure, assign tasks,
              and track resolutions.
            </p>
          </div>

          <div className="space-y-5 mt-2">
            {[
              {
                icon: <ClipboardCheck className="h-4 w-4" />,
                title: "Review & Approve Complaints",
                desc: "Triage incoming issues and approve valid complaints",
              },
              {
                icon: <Users className="h-4 w-4" />,
                title: "Assign & Manage Workers",
                desc: "Route tasks to maintenance teams with deadlines",
              },
              {
                icon: <Zap className="h-4 w-4" />,
                title: "Real-Time Dashboard",
                desc: "Monitor resolution progress and escalation alerts",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3.5 group">
                <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-400/10 border border-cyan-400/15 group-hover:border-cyan-400/30 group-hover:shadow-[0_0_15px_rgba(0,255,200,0.1)] transition-all duration-300">
                  <span className="text-cyan-400">{item.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-100">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16 relative bg-gray-950">
        <MouseSpotlight color="rgba(6, 182, 212, 0.04)" size={600} />
        <AnimatedGrid />
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-sm mb-3">
              CO
            </div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              CampusOps
            </h1>
            <p className="text-gray-400 text-[13px] mt-0.5">
              Staff & Admin Portal
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-7">
            <h2 className="text-xl font-bold text-gray-100">
              Staff Login
            </h2>
            <p className="text-gray-400 text-[13px] mt-1">
              Sign in with your staff credentials to continue
            </p>
          </div>

          <Card className="shadow-sm border-gray-800 rounded-2xl bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-400/10 text-cyan-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-[16px] text-gray-100">Admin Sign In</CardTitle>
                  <CardDescription className="text-[13px] text-gray-400">
                    HODs & Administrators only
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="loginId"
                    className="text-[13px] font-medium text-gray-300"
                  >
                    Staff ID
                  </Label>
                  <Input
                    id="loginId"
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. STAFF001"
                    className="h-10 text-[13px] rounded-lg border-gray-700 bg-gray-800/50 text-gray-100 placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-[13px] font-medium text-gray-300"
                  >
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
                      className="h-10 text-[13px] pr-10 rounded-lg border-gray-700 bg-gray-800/50 text-gray-100 placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[13px] text-gray-500">
                    Use your Date of Birth as password
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 mt-1 text-[13px] font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-gray-950 border-0"
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

              {/* Demo credentials */}
              <div className="h-px bg-gray-800" />
              <div>
                <p className="text-[12px] font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Quick Demo Access
                </p>
                <div className="grid gap-1.5">
                  {staffCredentials.map((acc) => (
                    <button
                      key={acc.loginId}
                      type="button"
                      onClick={() => {
                        setLoginId(acc.loginId);
                        setPassword(acc.plainPassword);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-800 bg-gray-800/30 hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-cyan-400/10 text-cyan-400">
                          {acc.role === "admin" ? (
                            <BarChart3 className="h-3.5 w-3.5" />
                          ) : (
                            <Shield className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200 group-hover:text-cyan-400 transition-colors block text-[13px]">
                            {acc.loginId}
                          </span>
                          <span className="text-gray-500 text-[13px]">
                            {acc.label}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[12px] capitalize rounded-md bg-gray-800 text-gray-300 border-gray-700"
                      >
                        {acc.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            &copy; {new Date().getFullYear()} CampusOps — Staff & Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
}
