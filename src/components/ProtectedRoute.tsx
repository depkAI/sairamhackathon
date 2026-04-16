"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
      router.push(`/dashboard/${profile.role}`);
    }
  }, [user, profile, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile) return null;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
}
