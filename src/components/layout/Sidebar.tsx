"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Route,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/motoristas",
    label: "Motoristas",
    icon: Users,
  },
  {
    href: "/metricas",
    label: "Métricas",
    icon: ClipboardList,
  },
  {
    href: "/rankings",
    label: "Rankings",
    icon: BarChart3,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: FileText,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: ShieldCheck,
  },
  {
    href: "/logs",
    label: "Logs",
    icon: Route,
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 h-11 w-11 flex items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}

      <aside
        className={`
          fixed md:sticky z-40
          top-0 left-0
          h-screen w-72
          bg-zinc-950 border-r border-zinc-800
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <div className="bg-black rounded-2xl border border-zinc-800 p-4 flex items-center justify-center">
              <Image
                src="/logo-alto-vale.png"
                alt="Alto Vale Transportes"
                width={190}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            <p className="text-zinc-500 text-xs uppercase tracking-[0.25em] mt-4">
              Painel Operacional
            </p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="
                    group flex items-center gap-3
                    rounded-2xl px-4 py-3
                    text-zinc-300
                    hover:bg-yellow-400 hover:text-black
                    transition-all duration-200
                  "
                >
                  <Icon
                    size={20}
                    className="text-yellow-400 group-hover:text-black transition"
                  />

                  <span className="font-semibold">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-yellow-400 font-bold text-sm">
                Alto Vale
              </p>

              <p className="text-zinc-500 text-xs mt-1">
                Gestão de motoristas e performance DS.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
