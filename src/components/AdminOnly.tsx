"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AdminOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-400 font-bold">
          Verificando permissões...
        </p>
      </main>
    );
  }

  if (user?.cargo !== "admin") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-zinc-900 border border-red-600 rounded p-8 max-w-md text-center">
          <h1 className="text-red-400 text-2xl font-bold mb-4">
            Acesso negado
          </h1>

          <p className="text-white mb-6">
            Você não tem permissão para acessar esta área.
          </p>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}