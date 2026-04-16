"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f5f9" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile by default */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 fixed z-50`}>
        <Sidebar />
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg shadow-md"
        style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Navbar />
      <main className="md:ml-64 p-4 md:p-6">{children}</main>
    </div>
  );
}
