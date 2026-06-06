"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      window.location.href = "/login";
    }
  }, [firebaseUser, loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-400 font-bold">
          Carregando...
        </p>
      </main>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return <>{children}</>;
}