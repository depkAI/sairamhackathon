"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile, UserRole } from "@/lib/types";
import { DEMO_USERS, DEMO_CREDENTIALS, DEMO_PASSWORDS, verifyPassword, hashPassword } from "@/lib/demo-data";

interface AuthContextType {
  user: { uid: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (loginId: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      const savedUid = typeof window !== "undefined" ? localStorage.getItem("demo-uid") : null;
      if (savedUid && DEMO_USERS[savedUid]) {
        setUser({ uid: savedUid });
        setProfile(DEMO_USERS[savedUid]);
      }
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");
        const { auth, db } = await import("@/lib/firebase");
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser({ uid: firebaseUser.uid });
            const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
            if (docSnap.exists()) {
              setProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
      } catch { setLoading(false); }
    })();
    return () => unsubscribe?.();
  }, []);

  const login = async (loginId: string, password: string): Promise<UserProfile> => {
    if (isDemoMode) {
      const key = loginId.toLowerCase();
      const storedHash = DEMO_PASSWORDS[key];
      if (!storedHash) throw new Error("Invalid credentials. Check your Login ID.");
      if (!verifyPassword(password, storedHash)) throw new Error("Incorrect password.");

      const cred = DEMO_CREDENTIALS.find((c) => c.loginId.toLowerCase() === key);
      if (!cred) throw new Error("User not found.");
      const userProfile = DEMO_USERS[cred.uid];
      if (!userProfile) throw new Error("User profile not found.");

      setUser({ uid: cred.uid });
      setProfile(userProfile);
      localStorage.setItem("demo-uid", cred.uid);
      return userProfile;
    }

    // Firebase mode
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
    const { auth, db } = await import("@/lib/firebase");

    // Find user by loginId
    const q = query(collection(db, "users"), where("loginId", "==", loginId));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Invalid credentials.");
    const userData = snap.docs[0].data();

    await signInWithEmailAndPassword(auth, userData.email, password);
    const p = { uid: snap.docs[0].id, ...userData } as UserProfile;
    setProfile(p);
    return p;
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem("demo-uid");
      setUser(null);
      setProfile(null);
      return;
    }
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase");
    await signOut(auth);
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
      // Update stored password
      DEMO_PASSWORDS[key] = hashPassword(newPassword);
      // Mark as no longer needing password change
      DEMO_USERS[profile.uid].mustChangePassword = false;
      setProfile({ ...profile, mustChangePassword: false });
      return;
    }
    // Firebase mode
    const { updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import("firebase/auth");
    const { doc, updateDoc } = await import("firebase/firestore");
    const { auth, db } = await import("@/lib/firebase");
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
    if (profile) {
      await updateDoc(doc(db, "users", profile.uid), { mustChangePassword: false });
      setProfile({ ...profile, mustChangePassword: false });
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...data };
      setProfile(updated);
      if (isDemoMode) {
        DEMO_USERS[profile.uid] = updated;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, login, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
