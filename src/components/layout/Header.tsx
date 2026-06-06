"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  async function handleLogout() {
    await signOut(auth);

    window.location.href = "/login";
  }

  return (
    <header className="bg-black border-b border-yellow-400 px-6 py-4 flex items-center justify-between">
      <h1 className="text-white font-bold text-sm md:text-lg ml-16 md:ml-0">
        Gestão Interna Alto Vale
      </h1>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm"
      >
        Sair
      </button>
    </header>
  );
}