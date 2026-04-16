"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import MouseSpotlight from "@/components/effects/MouseSpotlight";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6fa] dark:bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-[260px] md:flex-col">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0 border-r-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="md:pl-[260px] flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-5 py-6 md:px-10 md:py-8 relative">
          <MouseSpotlight color="rgba(99, 102, 241, 0.04)" size={700} />
          <div className="relative z-10 page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
