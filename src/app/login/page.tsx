"use client";

import Image from "next/image";
import { useState } from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";

import { login } from "@/services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin() {
    try {
      await login(email, senha);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("E-mail ou senha inválidos");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_35%),linear-gradient(180deg,#09090b,#000000)] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="hidden lg:flex rounded-[2rem] border border-zinc-800 bg-black/60 backdrop-blur-xl p-10 flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black rounded-3xl border border-zinc-800 p-6 w-full max-w-sm shadow-2xl">
              <Image
                src="/logo-alto-vale.png"
                alt="Alto Vale Transportes"
                width={280}
                height={140}
                className="object-contain"
                priority
              />
            </div>

            <div className="mt-10">
              <p className="text-yellow-400 uppercase tracking-[0.35em] text-xs font-bold">
                Gestão Interna
              </p>

              <h1 className="text-white text-5xl font-black mt-4 leading-tight">
                Controle operacional moderno.
              </h1>

              <p className="text-zinc-400 mt-5 text-lg leading-relaxed">
                Acompanhe motoristas, rotas, DS, rankings e relatórios em um
                painel rápido, seguro e profissional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-10">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-yellow-400 text-2xl font-black">DS</p>
              <p className="text-zinc-500 text-xs mt-1">Performance</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-yellow-400 text-2xl font-black">Rotas</p>
              <p className="text-zinc-500 text-xs mt-1">Controle diário</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-yellow-400 text-2xl font-black">PDF</p>
              <p className="text-zinc-500 text-xs mt-1">Relatórios</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-yellow-400/10">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-black rounded-3xl border border-zinc-800 p-5 w-64">
              <Image
                src="/logo-alto-vale.png"
                alt="Alto Vale Transportes"
                width={240}
                height={110}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center mb-6">
            <ShieldCheck className="text-yellow-400" size={24} />
          </div>

          <p className="text-yellow-400 uppercase tracking-[0.35em] text-xs font-bold">
            Acesso Seguro
          </p>

          <h2 className="text-white text-4xl font-black mt-3">
            Entrar no sistema
          </h2>

          <p className="text-zinc-400 mt-3 mb-8">
            Use seu e-mail e senha para acessar o painel Alto Vale.
          </p>

          <div className="space-y-4">
            <div className="rounded-2xl bg-black border border-zinc-800 px-4 py-3 flex items-center gap-3 focus-within:border-yellow-400 transition">
              <Mail size={20} className="text-zinc-500" />

              <input
                className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="rounded-2xl bg-black border border-zinc-800 px-4 py-3 flex items-center gap-3 focus-within:border-yellow-400 transition">
              <Lock size={20} className="text-zinc-500" />

              <input
                type="password"
                className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black p-4 rounded-2xl transition shadow-lg shadow-yellow-400/20"
            >
              Entrar
            </button>
          </div>

          <div className="mt-8 rounded-2xl bg-black border border-zinc-800 p-4">
            <p className="text-zinc-500 text-sm">
              Sistema privado para gestão operacional de motoristas, métricas DS
              e relatórios internos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}