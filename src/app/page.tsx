"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function Home() {
  const { profile, loading } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f1a2e] via-[#162240] to-[#1a2d5a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">CampusOps</h1>
          <div className="flex gap-3">
            {!loading && profile ? (
              <Link
                href={`/dashboard/${profile.role}`}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border border-white/30 px-5 py-2 rounded-lg font-medium hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-blue-700 px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Smart Campus Issue
            <br />
            Reporting & Resolution
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Digitize your campus maintenance workflows. Report issues instantly,
            track resolution in real-time, and ensure accountability at every step.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-blue-50 transition flex items-center gap-2"
            >
              Report an Issue <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Why CampusOps?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Zap className="text-yellow-500" size={28} />, title: "Instant Reporting", desc: "Report issues in seconds with smart categorization and priority detection." },
            { icon: <Clock className="text-blue-500" size={28} />, title: "Real-Time Tracking", desc: "Track every complaint from submission to resolution with live status updates." },
            { icon: <Shield className="text-green-500" size={28} />, title: "Accountability", desc: "48-hour deadlines, auto-escalation, and completion verification." },
            { icon: <BarChart3 className="text-purple-500" size={28} />, title: "Analytics", desc: "Department-wise breakdowns, worker performance, and trend analysis." },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="mb-4">{f.icon}</div>
              <h4 className="font-semibold text-lg mb-2">{f.title}</h4>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="space-y-6">
            {[
              { step: "1", title: "Student Reports Issue", desc: "Submit a complaint with details, photos, and audio." },
              { step: "2", title: "HOD Reviews", desc: "Department head reviews and approves or rejects." },
              { step: "3", title: "Admin Assigns Worker", desc: "Admin assigns a maintenance worker with a 48-hour deadline." },
              { step: "4", title: "Worker Resolves", desc: "Worker completes the task and uploads proof." },
              { step: "5", title: "Verified & Feedback", desc: "Admin verifies completion, student gives feedback." },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{s.title}</h4>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Built for Everyone</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Users size={24} />, role: "Students", features: ["Report issues instantly", "Track complaint status", "Give feedback on resolution"] },
            { icon: <Shield size={24} />, role: "HODs", features: ["Review department complaints", "Approve or reject", "Department analytics"] },
            { icon: <BarChart3 size={24} />, role: "Admins", features: ["Global dashboard", "Assign workers", "Verify completions"] },
            { icon: <CheckCircle size={24} />, role: "Workers", features: ["Accept/reject tasks", "Submit quotations", "Upload completion proof"] },
          ].map((r, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                {r.icon}
                <h4 className="font-semibold text-lg">{r.role}</h4>
              </div>
              <ul className="space-y-2">
                {r.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>CampusOps — Smart Campus Issue Reporter & Maintenance Workflow System</p>
      </footer>
    </div>
  );
}
