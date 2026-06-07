"use client";

import { signOut } from "firebase/auth";
import { LogOut, Bell, Search } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
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

        <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 w-96">
          <Search size={18} className="text-zinc-500 mr-2" />

          <input
            placeholder="Pesquisar no sistema..."
            className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-yellow-400">
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