import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { loginWithGoogle as googleLogin, logout as googleLogout } from "../auth/googleSignIn";

interface AuthContextType {
  user: User | null;
  role: "user" | "admin" | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

async function ensureUserDoc(user: User): Promise<"user" | "admin"> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      role: "user",
      displayName: user.displayName || "",
      email: user.email || "",
      createdAt: serverTimestamp(),
    });
    return "user";
  }
  return (snap.data().role as "user" | "admin") ?? "user";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const r = await ensureUserDoc(u);
        setRole(r);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    await googleLogin();
  };

  const handleLogout = async () => {
    await googleLogout();
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, loginWithGoogle: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
