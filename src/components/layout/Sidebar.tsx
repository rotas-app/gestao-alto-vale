"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 bg-yellow-400 text-black px-3 py-2 rounded font-bold"
      >
        MENU
      </button>

      <aside
        className={`
          fixed md:relative z-40
          top-0 left-0
          h-screen w-64
          bg-black border-r border-yellow-400
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-6">
          <h2 className="text-yellow-400 text-2xl font-bold">
            Alto Vale
          </h2>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          <Link
            href="/dashboard"
            className="text-white hover:text-yellow-400"
          >
            Dashboard
          </Link>

          <Link
            href="/motoristas"
            className="text-white hover:text-yellow-400"
          >
            Motoristas
          </Link>

          <Link
            href="/metricas"
            className="text-white hover:text-yellow-400"
          >
            Métricas
          </Link>

          <Link
            href="/rankings"
            className="text-white hover:text-yellow-400"
          >
            Rankings
          </Link>

          <Link
            href="/relatorios"
            className="text-white hover:text-yellow-400"
          >
            Relatórios
          </Link>

          <Link
            href="/usuarios"
            className="text-white hover:text-yellow-400"
          >
            Usuários
          </Link>
        </nav>
      </aside>
    </>
  );
}