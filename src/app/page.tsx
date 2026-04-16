"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Zap, BarChart3, Users, ArrowRight, CheckCircle,
  Clock, Bell, Wrench, GraduationCap, ChevronRight,
  MessageSquare, TrendingUp, AlertTriangle,
} from "lucide-react";

export default function Home() {
  const { profile, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CO</span>
            </div>
            <span className="font-bold text-xl text-foreground">CampusOps</span>
          </div>
          <div className="flex gap-3">
            {!loading && profile ? (
              <Button>
                <Link href={`/dashboard/${profile.role}`}>Dashboard <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost"><Link href="/login">Sign In</Link></Button>
                <Button><Link href="/login">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 50%, #2563eb 100%)" }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.2) 0%, transparent 50%)" }} />
        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float opacity-20"><Wrench size={40} className="text-blue-300" /></div>
        <div className="absolute top-40 right-20 animate-float delay-200 opacity-15"><AlertTriangle size={32} className="text-yellow-300" /></div>
        <div className="absolute bottom-20 left-1/4 animate-float delay-400 opacity-15"><GraduationCap size={36} className="text-blue-200" /></div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm">
            Smart Campus Infrastructure Management
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in delay-100 leading-tight tracking-tight">
            Transform Campus
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Maintenance Workflows
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto animate-fade-in delay-200 leading-relaxed">
            Report issues instantly, track resolution in real-time, and ensure complete
            accountability — from students to maintenance teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
            <Button size="lg" className="bg-white text-primary hover:bg-blue-50 shadow-xl shadow-blue-900/20 text-base px-8 py-6">
              <Link href="/login">Report an Issue <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6">
              <Link href="/login">View Demo</Link>
            </Button>
          </div>
          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in delay-400">
            {[
              { value: "500+", label: "Issues Resolved" },
              { value: "4.8★", label: "User Rating" },
              { value: "<2hr", label: "Avg Response" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-blue-200/60 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why CampusOps?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Everything you need to manage campus infrastructure efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Zap className="h-6 w-6" />, color: "text-amber-500 bg-amber-50", title: "Instant Reporting", desc: "Report issues in seconds with smart categorization, AI priority detection, and audio attachments." },
              { icon: <Clock className="h-6 w-6" />, color: "text-blue-500 bg-blue-50", title: "Real-Time Tracking", desc: "Track every complaint from submission to resolution with live status updates and notifications." },
              { icon: <Shield className="h-6 w-6" />, color: "text-emerald-500 bg-emerald-50", title: "Accountability", desc: "48-hour deadlines, auto-escalation for overdue tasks, and completion verification workflows." },
              { icon: <BarChart3 className="h-6 w-6" />, color: "text-purple-500 bg-purple-50", title: "Deep Analytics", desc: "Department breakdowns, worker performance metrics, resolution trends, and priority analysis." },
            ].map((f, i) => (
              <Card key={i} className="card-hover border-border/50 bg-card group cursor-default animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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
      <section className="py-20 sm:py-28 bg-muted/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">From complaint to resolution in 5 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "01", icon: <MessageSquare className="h-6 w-6" />, title: "Report", desc: "Student submits complaint with details & attachments", color: "from-blue-500 to-blue-600" },
              { step: "02", icon: <CheckCircle className="h-6 w-6" />, title: "Review", desc: "HOD reviews and approves the complaint", color: "from-indigo-500 to-indigo-600" },
              { step: "03", icon: <Users className="h-6 w-6" />, title: "Assign", desc: "Admin assigns a maintenance worker", color: "from-violet-500 to-violet-600" },
              { step: "04", icon: <Wrench className="h-6 w-6" />, title: "Resolve", desc: "Worker completes task & uploads proof", color: "from-purple-500 to-purple-600" },
              { step: "05", icon: <TrendingUp className="h-6 w-6" />, title: "Verify", desc: "Admin verifies, student gives feedback", color: "from-fuchsia-500 to-fuchsia-600" },
            ].map((s, i) => (
              <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-muted-foreground mb-1">{s.step}</div>
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">For Everyone</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built for Every Role</h2>
            <p className="text-muted-foreground text-lg">Dedicated dashboards tailored to each user&apos;s needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <GraduationCap className="h-6 w-6" />, role: "Students", color: "from-blue-500 to-cyan-500", features: ["Report issues instantly", "Track complaint status", "Audio & image attachments", "Rate resolution quality"] },
              { icon: <Shield className="h-6 w-6" />, role: "HODs", color: "from-emerald-500 to-teal-500", features: ["Department complaint overview", "Approve or reject issues", "Department announcements", "Live progress monitoring"] },
              { icon: <BarChart3 className="h-6 w-6" />, role: "Admins", color: "from-violet-500 to-purple-500", features: ["System-wide dashboard", "Worker assignment", "Quotation management", "Analytics & reporting"] },
              { icon: <Wrench className="h-6 w-6" />, role: "Workers", color: "from-orange-500 to-amber-500", features: ["Task management board", "48-hour deadline tracking", "Submit quotations", "Upload completion proof"] },
            ].map((r, i) => (
              <Card key={i} className="card-hover overflow-hidden border-border/50 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`h-2 bg-gradient-to-r ${r.color}`} />
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-4`}>
                    {r.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-3">{r.role}</h3>
                  <ul className="space-y-2.5">
                    {r.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
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
      <section className="py-20" style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform Your Campus?</h2>
          <p className="text-blue-100/70 text-lg mb-8">Join the smart maintenance revolution. Start reporting and resolving issues today.</p>
          <Button size="lg" className="bg-white text-primary hover:bg-blue-50 shadow-xl text-base px-8 py-6">
            <Link href="/login">Get Started Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-muted py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CO</span>
                </div>
                <span className="font-bold text-xl text-white">CampusOps</span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Smart Campus Issue Reporter & Maintenance Workflow System. Digitizing campus infrastructure management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Report Issues</li>
                <li>Track Complaints</li>
                <li>Admin Dashboard</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Roles</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Students</li>
                <li>Department Heads</li>
                <li>Administrators</li>
                <li>Workers</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} CampusOps. Built for smarter campuses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
