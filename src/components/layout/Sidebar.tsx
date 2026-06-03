"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const { user } = useAuth();

  const isAdmin = user?.cargo === "admin";

  return (
    <aside className="w-64 bg-black border-r border-yellow-400 min-h-screen">
      <div className="p-6">
        <h2 className="text-yellow-400 text-xl font-bold">
          Alto Vale
        </h2>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        <Link href="/dashboard" className="text-white hover:text-yellow-400">
          Dashboard
        </Link>

        <Link href="/motoristas" className="text-white hover:text-yellow-400">
          Motoristas
        </Link>

        <Link href="/metricas" className="text-white hover:text-yellow-400">
          Métricas
        </Link>

        <Link href="/rankings" className="text-white hover:text-yellow-400">
          Rankings
        </Link>

        <Link href="/relatorios" className="text-white hover:text-yellow-400">
          Relatórios
        </Link>

        {isAdmin && (
          <>
            <div className="border-t border-zinc-700 my-3" />

            <Link href="/usuarios" className="text-white hover:text-yellow-400">
              Usuários
            </Link>

            <Link href="/configuracoes" className="text-white hover:text-yellow-400">
              Configurações
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}