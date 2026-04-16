"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Zap, BarChart3, Users, ArrowRight, CheckCircle,
  Clock, Bell, Wrench, GraduationCap, ChevronRight,
  MessageSquare, TrendingUp, AlertTriangle,
} from "lucide-react";

export default function Home() {
  const { profile, loading } = useAuth();

  const features = [
    { icon: <Zap className="h-5 w-5" />, color: "text-amber-500 bg-amber-500/10", title: "Instant Reporting", desc: "Report issues in seconds with smart categorization, AI priority detection, and audio attachments." },
    { icon: <Clock className="h-5 w-5" />, color: "text-blue-500 bg-blue-500/10", title: "Real-Time Tracking", desc: "Track every complaint from submission to resolution with live status updates and notifications." },
    { icon: <Shield className="h-5 w-5" />, color: "text-emerald-500 bg-emerald-500/10", title: "Accountability", desc: "48-hour deadlines, auto-escalation for overdue tasks, and completion verification workflows." },
    { icon: <BarChart3 className="h-5 w-5" />, color: "text-purple-500 bg-purple-500/10", title: "Deep Analytics", desc: "Department breakdowns, worker performance metrics, resolution trends, and priority analysis." },
  ];

  const steps = [
    { step: "01", icon: <MessageSquare className="h-5 w-5" />, title: "Report", desc: "Student submits complaint with details & attachments", color: "from-blue-500 to-blue-600" },
    { step: "02", icon: <CheckCircle className="h-5 w-5" />, title: "Review", desc: "HOD reviews and approves the complaint", color: "from-indigo-500 to-indigo-600" },
    { step: "03", icon: <Users className="h-5 w-5" />, title: "Assign", desc: "Admin assigns a maintenance worker", color: "from-violet-500 to-violet-600" },
    { step: "04", icon: <Wrench className="h-5 w-5" />, title: "Resolve", desc: "Worker completes task & uploads proof", color: "from-purple-500 to-purple-600" },
    { step: "05", icon: <TrendingUp className="h-5 w-5" />, title: "Verify", desc: "Admin verifies, student gives feedback", color: "from-fuchsia-500 to-fuchsia-600" },
  ];

  const roles = [
    { icon: <GraduationCap className="h-5 w-5" />, role: "Students", color: "from-blue-500 to-cyan-500", features: ["Report issues instantly", "Track complaint status", "Audio & image attachments", "Rate resolution quality"] },
    { icon: <Shield className="h-5 w-5" />, role: "HODs", color: "from-emerald-500 to-teal-500", features: ["Department complaint overview", "Approve or reject issues", "Department announcements", "Live progress monitoring"] },
    { icon: <BarChart3 className="h-5 w-5" />, role: "Admins", color: "from-violet-500 to-purple-500", features: ["System-wide dashboard", "Worker assignment", "Quotation management", "Analytics & reporting"] },
    { icon: <Wrench className="h-5 w-5" />, role: "Workers", color: "from-orange-500 to-amber-500", features: ["Task management board", "48-hour deadline tracking", "Submit quotations", "Upload completion proof"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white font-bold text-sm">CO</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">CampusOps</span>
          </div>
          <div className="flex items-center gap-3">
            {!loading && profile ? (
              <Button>
                <Link href={`/dashboard/${profile.role}`}>
                  Dashboard <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button>
                  <Link href="/login">
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(124,58,237,0.1),transparent_50%)]" />

        <div className="absolute top-20 left-10 animate-float opacity-20">
          <Wrench size={40} className="text-blue-300" />
        </div>
        <div className="absolute top-40 right-20 animate-float delay-200 opacity-15">
          <AlertTriangle size={32} className="text-yellow-300" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float delay-400 opacity-15">
          <GraduationCap size={36} className="text-blue-200" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Badge className="mb-6 animate-fade-in rounded-full bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm hover:bg-white/15">
            Smart Campus Infrastructure Management
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in delay-100 leading-[1.1] tracking-tight">
            Transform Campus
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Maintenance Workflows
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/70 mb-10 max-w-2xl mx-auto animate-fade-in delay-200 leading-relaxed">
            Report issues instantly, track resolution in real-time, and ensure complete
            accountability — from students to maintenance teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
            <Button size="lg" className="bg-white text-blue-950 hover:bg-blue-50 shadow-xl shadow-blue-900/30 text-base px-8 h-12 rounded-xl">
              <Link href="/login">
                Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 h-12 rounded-xl">
              <Link href="/login">View Demo</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-in delay-400">
            {[
              { value: "500+", label: "Issues Resolved" },
              { value: "4.8\u2605", label: "User Rating" },
              { value: "<2hr", label: "Avg Response" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-blue-200/50 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Why CampusOps?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to manage campus infrastructure efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <Card
                key={i}
                className={`group border-border/50 bg-card hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in delay-${(i + 1) * 100}`}
              >
                <CardContent className="p-6">
                  <div className={`w-11 h-11 rounded-lg ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              From complaint to resolution in 5 simple steps
            </p>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-200 via-violet-200 to-fuchsia-200 dark:from-blue-800 dark:via-violet-800 dark:to-fuchsia-800" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`relative text-center animate-fade-in delay-${(i + 1) * 100}`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}>
                    {s.icon}
                  </div>
                  <Badge variant="secondary" className="mb-2 text-xs font-mono">
                    Step {s.step}
                  </Badge>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-[160px] mx-auto">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 rounded-full">For Everyone</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Built for Every Role
            </h2>
            <p className="text-muted-foreground text-lg">
              Dedicated dashboards tailored to each user&apos;s needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => (
              <Card
                key={i}
                className={`group overflow-hidden border-border/50 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in delay-${(i + 1) * 100}`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${r.color}`} />
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                    {r.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-4">{r.role}</h3>
                  <Separator className="mb-4" />
                  <ul className="space-y-2.5">
                    {r.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to Transform Your Campus?
          </h2>
          <p className="text-blue-100/60 text-lg mb-10 max-w-xl mx-auto">
            Join the smart maintenance revolution. Start reporting and resolving issues today.
          </p>
          <Button size="lg" className="bg-white text-blue-950 hover:bg-blue-50 shadow-xl shadow-blue-900/30 text-base px-8 h-12 rounded-xl">
            <Link href="/login">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CO</span>
                </div>
                <span className="font-bold text-xl text-white tracking-tight">CampusOps</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Smart Campus Issue Reporter & Maintenance Workflow System. Digitizing campus infrastructure management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>Report Issues</li>
                <li>Track Complaints</li>
                <li>Admin Dashboard</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Roles</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>Students</li>
                <li>Department Heads</li>
                <li>Administrators</li>
                <li>Workers</li>
              </ul>
            </div>
          </div>
          <Separator className="bg-slate-800 mb-6" />
          <div className="text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} CampusOps. Built for smarter campuses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
