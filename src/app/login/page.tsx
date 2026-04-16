"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { GraduationCap, Shield, Wrench, Eye, EyeOff, ArrowRight } from "lucide-react";

type RoleTab = "student" | "staff" | "worker";

const tabConfig: Record<RoleTab, { icon: React.ReactNode; idLabel: string; idPlaceholder: string }> = {
  student: { icon: <GraduationCap className="h-4 w-4" />, idLabel: "Roll Number", idPlaceholder: "e.g. 22CSE101" },
  staff: { icon: <Shield className="h-4 w-4" />, idLabel: "Staff ID", idPlaceholder: "e.g. STAFF001" },
  worker: { icon: <Wrench className="h-4 w-4" />, idLabel: "Username", idPlaceholder: "e.g. rajesh@electrician" },
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
      router.push(profile.mustChangePassword ? "/change-password" : `/dashboard/${profile.role}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="w-full max-w-[440px] animate-fade-in">
        <Card className="shadow-xl border-border/50 overflow-hidden">
          {/* Header */}
          <div className="relative p-8 text-center" style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}>
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground mx-auto mb-3 animate-pulse-glow">CO</div>
            <h1 className="text-2xl font-bold text-white">CampusOps</h1>
            <p className="text-blue-200/70 text-sm mt-1">Smart Campus Issue Reporter</p>
          </div>

          {/* Role Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as RoleTab); setLoginId(""); setPassword(""); }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none h-12 bg-muted/50">
              <TabsTrigger value="student" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
                <GraduationCap className="h-4 w-4" /> Student
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
                <Shield className="h-4 w-4" /> Staff
              </TabsTrigger>
              <TabsTrigger value="worker" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
                <Wrench className="h-4 w-4" /> Worker
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId">{cfg.idLabel}</Label>
                  <Input id="loginId" type="text" required value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={cfg.idPlaceholder} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (Date of Birth)</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="DD-MM-YYYY" className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 text-base">
                  {loading ? "Signing in..." : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo Credentials */}
          {isDemoMode && (
            <div className="px-6 pb-6">
              <div className="bg-accent rounded-xl p-4 border border-primary/10">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Demo Accounts — Click to fill</p>
                <div className="space-y-1.5">
                  {demoByRole[activeTab].map((acc) => (
                    <button key={acc.loginId} type="button" onClick={() => { setLoginId(acc.loginId); setPassword(acc.plainPassword); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-card rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all text-left text-sm group">
                      <div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{acc.loginId}</span>
                        <span className="text-muted-foreground text-xs ml-2 hidden sm:inline">{acc.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{acc.role}</Badge>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 text-center">Passwords are Date of Birth (DD-MM-YYYY)</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
