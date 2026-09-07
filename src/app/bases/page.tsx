"use client";

import { useEffect, useState } from "react";
import { Building2, Power, RefreshCw, Save } from "lucide-react";

import AdminOnly from "@/components/AdminOnly";
import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";
import { useBase } from "@/contexts/BaseContext";
import {
  alterarStatusBase,
  listarBases,
  salvarBase,
  type BaseInput,
} from "@/services/baseService";

const BASE_ITAJAI: BaseInput = {
  id: "itajai",
  nome: "Itajai",
  ativo: true,
};

export default function BasesPage() {
  const { recarregarBases } = useBase();
  const [bases, setBases] = useState<BaseInput[]>([]);
  const [id, setId] = useState(BASE_ITAJAI.id);
  const [nome, setNome] = useState(BASE_ITAJAI.nome);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    try {
      const lista = await listarBases();
      setBases(lista.sort((a, b) => a.nome.localeCompare(b.nome)));
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar() {
    if (salvando) return;

    setSalvando(true);

    try {
      await salvarBase({
        id,
        nome,
        ativo: true,
      });
      await carregar();
      await recarregarBases();
      setId("");
      setNome("");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Nao foi possivel salvar a base."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleCriarItajai() {
    setId(BASE_ITAJAI.id);
    setNome(BASE_ITAJAI.nome);
    await salvarBase(BASE_ITAJAI);
    await carregar();
    await recarregarBases();
  }

  async function handleStatus(base: BaseInput) {
    await alterarStatusBase(base.id, !base.ativo);
    await carregar();
    await recarregarBases();
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void carregar();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AdminOnly>
      <PageShell
        title="Bases"
        subtitle="Cadastre bases operacionais e controle quais ficam disponiveis."
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <PremiumCard className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <Building2 size={22} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-black">Nova base</h2>
                <p className="text-zinc-500 text-sm">
                  Gestores vinculados a uma base enxergam somente os dados dela.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={id}
                onChange={(event) => setId(event.target.value.toLowerCase())}
                placeholder="id-da-base"
                className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder:text-zinc-500"
              />

              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Nome da base"
                className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black px-6 py-4 rounded-2xl transition"
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar base"}
              </button>

              <button
                onClick={handleCriarItajai}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-black px-6 py-4 rounded-2xl transition"
              >
                <Building2 size={18} />
                Garantir Itajai
              </button>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="flex items-center gap-3 mb-5">
              <RefreshCw size={22} className="text-yellow-400" />
              <h2 className="text-white text-2xl font-black">Resumo</h2>
            </div>

            <div className="rounded-2xl bg-black border border-zinc-800 p-5">
              <p className="text-zinc-500 text-sm">Bases ativas</p>
              <p className="text-emerald-400 text-4xl font-black mt-2">
                {bases.filter((base) => base.ativo).length}
              </p>
            </div>
          </PremiumCard>
        </div>

        <PremiumCard>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-white text-3xl font-black">Bases cadastradas</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Use o seletor do topo para alternar a operacao como admin.
              </p>
            </div>

            <button
              onClick={carregar}
              disabled={carregando}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-500 text-white font-black px-5 py-3 rounded-2xl transition"
            >
              <RefreshCw size={18} className={carregando ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          <div className="space-y-3">
            {bases.map((base) => (
              <div
                key={base.id}
                className="rounded-2xl bg-black border border-zinc-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="text-white text-xl font-black">{base.nome}</h3>
                  <p className="text-zinc-500 text-sm mt-1">ID: {base.id}</p>
                </div>

                <button
                  onClick={() => handleStatus(base)}
                  className={`flex items-center justify-center gap-2 font-black px-5 py-3 rounded-2xl transition ${
                    base.ativo
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black"
                  }`}
                >
                  <Power size={18} />
                  {base.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}

            {bases.length === 0 && (
              <div className="rounded-2xl bg-black border border-zinc-800 p-10 text-center">
                <p className="text-zinc-500">Nenhuma base cadastrada.</p>
              </div>
            )}
          </div>
        </PremiumCard>
      </PageShell>
    </AdminOnly>
  );
}
