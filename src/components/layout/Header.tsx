"use client";

import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";

export default function Header() {
  const { user } = useAuth();

  async function sair() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <header className="h-16 border-b border-yellow-400 bg-zinc-900 flex items-center justify-between px-6">
      <h1 className="text-white font-bold">
        Gestão Interna Alto Vale
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-yellow-400 font-bold">
            {user?.nome || "Usuário"}
          </p>
          <p className="text-zinc-400 text-sm">
            {user?.cargo || "-"}
          </p>
        </div>

        <button
          onClick={sair}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sair
        </button>
      </div>
    </header>
  );
}