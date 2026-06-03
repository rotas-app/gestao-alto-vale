"use client";

import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

interface AppUser {
  uid: string;
  email: string;
  nome: string;
  cargo: "admin" | "gestor";
  status: "ativo" | "inativo";
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarPerfil(uid: string) {
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setUser(null);
      return;
    }

    setUser({
      uid,
      email: snap.data().email,
      nome: snap.data().nome,
      cargo: snap.data().cargo,
      status: snap.data().status,
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        await carregarPerfil(currentUser.uid);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}