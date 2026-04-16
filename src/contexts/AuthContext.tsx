"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile, UserRole } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { DEMO_USERS, DEMO_CREDENTIALS, DEMO_PASSWORDS, verifyPassword, hashPassword } from "@/lib/demo-data";

interface AuthContextType {
  user: { uid: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (loginId: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, profileData: Omit<UserProfile, "uid" | "createdAt">) => Promise<UserProfile>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Demo mode: always true for hackathon
const isDemoMode = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Supabase profiles table
  async function fetchProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (error || !data) return null;
    return {
      uid: data.id,
      loginId: data.login_id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      department: data.department,
      phone: data.phone,
      specialty: data.specialty,
      mustChangePassword: data.must_change_password,
      createdAt: new Date(data.created_at),
    };
  }

  useEffect(() => {
    // Always check for a demo session first
    const savedUid = typeof window !== "undefined" ? localStorage.getItem("demo-uid") : null;
    if (savedUid && DEMO_USERS[savedUid]) {
      setUser({ uid: savedUid });
      setProfile(DEMO_USERS[savedUid]);
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      setLoading(false);
      return;
    }

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({ uid: session.user.id });
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({ uid: session.user.id });
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const login = async (loginId: string, password: string): Promise<UserProfile> => {
    // Always try demo credentials first (works regardless of Supabase config)
    const key = loginId.toLowerCase();
    const storedHash = DEMO_PASSWORDS[key];
    if (storedHash && verifyPassword(password, storedHash)) {
      const cred = DEMO_CREDENTIALS.find((c) => c.loginId.toLowerCase() === key);
      if (cred) {
        const userProfile = DEMO_USERS[cred.uid];
        if (userProfile) {
          setUser({ uid: cred.uid });
          setProfile(userProfile);
          localStorage.setItem("demo-uid", cred.uid);
          return userProfile;
        }
      }
    }

    // If not a demo user and no Supabase, fail
    if (isDemoMode) {
      throw new Error("Invalid credentials. Check your Login ID and password.");
    }

    // Supabase: look up email by login_id, then sign in
    const { data: profileData, error: lookupError } = await supabase
      .from("profiles")
      .select("email, id")
      .eq("login_id", loginId)
      .single();

    if (lookupError || !profileData) throw new Error("Invalid credentials. Check your Login ID.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password,
    });
    if (error) throw new Error(error.message);

    const p = await fetchProfile(data.user.id);
    if (!p) throw new Error("Profile not found.");
    setUser({ uid: data.user.id });
    setProfile(p);
    return p;
  };

  const register = async (
    email: string,
    password: string,
    profileData: Omit<UserProfile, "uid" | "createdAt">
  ): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Registration failed.");

    const uid = data.user.id;

    // Insert profile row
    const { error: insertError } = await supabase.from("profiles").insert({
      id: uid,
      login_id: profileData.loginId,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      department: profileData.department,
      phone: profileData.phone,
      specialty: profileData.specialty || null,
      must_change_password: profileData.mustChangePassword,
    });
    if (insertError) throw new Error(insertError.message);

    const p: UserProfile = { ...profileData, uid, createdAt: new Date() };
    setUser({ uid });
    setProfile(p);
    return p;
  };

  const logout = async () => {
    // Always clear demo session
    localStorage.removeItem("demo-uid");
    if (isDemoMode) {
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (isDemoMode) {
      if (!profile) throw new Error("Not logged in");
      const key = profile.loginId.toLowerCase();
      if (!verifyPassword(oldPassword, DEMO_PASSWORDS[key])) {
        throw new Error("Current password is incorrect.");
      }
      DEMO_PASSWORDS[key] = hashPassword(newPassword);
      DEMO_USERS[profile.uid].mustChangePassword = false;
      setProfile({ ...profile, mustChangePassword: false });
      return;
    }

    // Supabase: re-authenticate then update password
    if (!profile) throw new Error("Not logged in");
    // Sign in again to verify old password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: oldPassword,
    });
    if (authError) throw new Error("Current password is incorrect.");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", profile.uid);
    setProfile({ ...profile, mustChangePassword: false });
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...data };
      setProfile(updated);
      if (isDemoMode) {
        DEMO_USERS[profile.uid] = updated;
      } else {
        // Persist to Supabase
        const dbData: Record<string, unknown> = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.phone !== undefined) dbData.phone = data.phone;
        if (data.department !== undefined) dbData.department = data.department;
        if (data.email !== undefined) dbData.email = data.email;
        if (Object.keys(dbData).length > 0) {
          supabase.from("profiles").update(dbData).eq("id", profile.uid).then(({ error }) => {
            if (error) console.error("Failed to update profile:", error.message);
          });
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, login, register, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
