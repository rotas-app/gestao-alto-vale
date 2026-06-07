"use client";

import { useState } from "react";
import {
  Clipboard,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import AdminOnly from "@/components/AdminOnly";
import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { useBase } from "@/contexts/BaseContext";
import { criarConviteGestor } from "@/services/conviteService";

export default function UsuariosPage() {
  const { bases } = useBase();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [baseId, setBaseId] = useState("");
  const [linkConvite, setLinkConvite] = useState("");

  async function handleCriarConvite() {
    if (!nome || !email || !baseId) {
      alert("Preencha nome, email e base");
      return;
    }

    const convite = await criarConviteGestor(nome, email, baseId);

    setLinkConvite(convite.link);
    setNome("");
    setEmail("");
    setBaseId("");
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkConvite);
    alert("Link copiado");
  }

  return (
    <AdminOnly>
      <PageShell
        title="Usuários"
        subtitle="Gerencie convites e permissões de gestores."
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <PremiumCard className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <UserPlus size={22} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-black">
                  Convidar gestor
                </h2>

                <p className="text-zinc-500 text-sm">
                  Gere um link de acesso para um novo gestor.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-black border border-zinc-800 px-4 py-3 flex items-center gap-3 focus-within:border-yellow-400 transition">
                <Users size={20} className="text-zinc-500" />

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do gestor"
                  className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full"
                />
              </div>

              <div className="rounded-2xl bg-black border border-zinc-800 px-4 py-3 flex items-center gap-3 focus-within:border-yellow-400 transition">
                <Mail size={20} className="text-zinc-500" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email do gestor"
                  className="bg-transparent outline-none text-white placeholder:text-zinc-500 w-full"
                />
              </div>

              <select
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400 transition"
              >
                <option value="">Selecione a base do gestor</option>

                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.nome}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCriarConvite}
                className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-4 rounded-2xl transition shadow-lg shadow-yellow-400/20"
              >
                <ShieldCheck size={18} />
                Gerar convite
              </button>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center mb-5">
              <ShieldCheck size={22} className="text-yellow-400" />
            </div>

            <h2 className="text-white text-2xl font-black">
              Permissão Admin
            </h2>

            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
              Apenas administradores podem criar convites, visualizar usuários
              e liberar novos gestores para o sistema.
            </p>
          </PremiumCard>
        </div>

        {linkConvite && (
          <PremiumCard>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-yellow-400 uppercase tracking-[0.25em] text-xs font-bold">
                  Convite gerado
                </p>

                <h2 className="text-white text-2xl font-black mt-2">
                  Envie este link para o gestor
                </h2>

                <p className="text-zinc-500 text-sm mt-2">
                  O gestor acessa o link, cria uma senha e entra no painel.
                </p>
              </div>

              <button
                onClick={copiarLink}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-black px-6 py-4 rounded-2xl transition"
              >
                <Clipboard size={18} />
                Copiar link
              </button>
            </div>

            <input
              readOnly
              value={linkConvite}
              className="w-full mt-5 p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none"
            />
          </PremiumCard>
        )}
      </PageShell>
    </AdminOnly>
  );
}
