"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Helpers to set/clear session cookie for middleware
function setSessionCookie() {
  document.cookie = "bixit_session=1; path=/; max-age=86400; SameSite=Lax";
}
function clearSessionCookie() {
  document.cookie = "bixit_session=; path=/; max-age=0; SameSite=Lax";
}

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setSessionCookie();
        // Get user role from Firestore
        const clientDoc = await getDoc(doc(db, "clients", firebaseUser.uid));
        if (clientDoc.exists()) {
          setUserRole("client");
          setProfile({ name: clientDoc.data().name || "Client", ...clientDoc.data() });
        } else {
          const workerDoc = await getDoc(doc(db, "workers", firebaseUser.uid));
          if (workerDoc.exists()) {
            setUserRole("worker");
            setProfile({ name: workerDoc.data().name || "Worker", ...workerDoc.data() });
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
        setProfile(null);
        clearSessionCookie();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
