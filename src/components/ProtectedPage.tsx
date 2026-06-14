"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, user, loading } = useAuth();

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

  if (!user || user.status !== "ativo") {
    const semPerfil = !user;

    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/40 bg-zinc-950 p-8 text-center shadow-2xl">
          <p className="text-red-400 text-sm font-bold uppercase tracking-[0.25em]">
            Acesso bloqueado
          </p>

          <h1 className="mt-4 text-3xl font-black text-white">
            {semPerfil ? "Perfil não encontrado" : "Usuário inativo"}
          </h1>

          <p className="mt-4 text-zinc-400 leading-relaxed">
            {semPerfil
              ? "Sua autenticação existe, mas o perfil de acesso não foi encontrado. Entre em contato com o administrador."
              : "Seu acesso foi desativado. Entre em contato com o administrador para solicitar a reativação."}
          </p>

          <button
            onClick={async () => {
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("@/lib/firebase");

              await signOut(auth);
              window.location.href = "/login";
            }}
            className="mt-7 rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Voltar ao login
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
