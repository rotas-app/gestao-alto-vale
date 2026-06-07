"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { Bell, LogOut, Search } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useBase } from "@/contexts/BaseContext";

export default function Header() {
  const { user } = useAuth();
  const { bases, baseAtual, setBaseAtual } = useBase();

  const [idBusca, setIdBusca] = useState("");

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  function buscarRota() {
    const id = idBusca.trim();

    if (!id) {
      alert("Digite o ID da rota");
      return;
    }

    window.location.href = `/metricas?idRota=${encodeURIComponent(id)}`;
    setIdBusca("");
  }

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="ml-16 md:ml-0">
          <p className="text-xs text-zinc-500 uppercase tracking-[0.25em]">
            Gestão Interna
          </p>

          <h1 className="text-white font-bold text-lg md:text-2xl">
            Alto Vale Transportes
          </h1>
        </div>

        <div className="hidden xl:flex items-center gap-3">
          {user?.cargo === "admin" && (
            <select
              value={baseAtual}
              onChange={(e) => setBaseAtual(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-400"
            >
              <option value="">Selecionar base</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.nome}
                </option>
              ))}
            </select>
          )}

          {user?.cargo === "gestor" && (
            <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-4 py-3 text-sm">
              Base: {user.baseId || "-"}
            </div>
          )}

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 w-[420px] focus-within:border-yellow-400 transition">
            <Search size={18} className="text-zinc-500 mr-2" />

            <input
              value={idBusca}
              onChange={(e) => setIdBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscarRota();
              }}
              placeholder="Buscar ID da rota..."
              className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full text-sm"
            />

            <button
              onClick={buscarRota}
              className="ml-3 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-xl font-black text-xs transition"
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-yellow-400 transition">
            <Bell size={18} />
          </button>

          <div className="hidden md:block text-right">
            <p className="text-white text-sm font-bold">
              {user?.nome || "Usuário"}
            </p>

            <p className="text-zinc-500 text-xs uppercase">
              {user?.cargo || "perfil"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}