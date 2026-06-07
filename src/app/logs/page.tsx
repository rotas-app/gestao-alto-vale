"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ClipboardList,
  FileClock,
  ShieldCheck,
  User,
} from "lucide-react";

import AdminOnly from "@/components/AdminOnly";
import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { listarLogs } from "@/services/logService";

type LogItem = {
  id: string;
  acao: string;
  detalhes: string;
  usuario?: string;
};

function iconePorAcao(acao: string) {
  if (acao.includes("MOTORISTA")) return User;
  if (acao.includes("METRICA")) return ClipboardList;
  return Activity;
}

function corPorAcao(acao: string) {
  if (acao.includes("EXCLUIR")) return "text-red-400";
  if (acao.includes("EDITAR")) return "text-yellow-400";
  if (acao.includes("CRIAR")) return "text-emerald-400";
  return "text-yellow-400";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    let ativo = true;

    listarLogs().then((data) => {
      if (ativo) {
        setLogs(data as LogItem[]);
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <AdminOnly>
      <PageShell
        title="Auditoria"
        subtitle="Registro das principais ações realizadas no sistema."
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <PremiumCard className="xl:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <FileClock size={22} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-black">
                  Logs do sistema
                </h2>

                <p className="text-zinc-500 text-sm">
                  Histórico operacional de criação, edição e exclusão.
                </p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={22} className="text-yellow-400" />

              <h2 className="text-white text-2xl font-black">
                Total
              </h2>
            </div>

            <p className="text-zinc-500 text-sm">
              Registros encontrados
            </p>

            <p className="text-yellow-400 text-5xl font-black mt-3">
              {logs.length}
            </p>
          </PremiumCard>
        </div>

        <PremiumCard>
          <div className="space-y-4">
            {logs.map((log) => {
              const Icon = iconePorAcao(log.acao);

              return (
                <div
                  key={log.id}
                  className="rounded-3xl bg-black border border-zinc-800 p-5 hover:border-yellow-400/40 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Icon
                          size={21}
                          className={corPorAcao(log.acao)}
                        />
                      </div>

                      <div>
                        <p
                          className={`font-black text-lg ${corPorAcao(
                            log.acao
                          )}`}
                        >
                          {log.acao}
                        </p>

                        <p className="text-white mt-1">
                          {log.detalhes}
                        </p>

                        <p className="text-zinc-500 text-sm mt-2">
                          Usuário: {log.usuario || "desconhecido"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="rounded-3xl bg-black border border-zinc-800 p-12 text-center">
                <FileClock className="mx-auto text-zinc-600 mb-4" size={42} />

                <p className="text-zinc-400 text-xl">
                  Nenhum log encontrado.
                </p>
              </div>
            )}
          </div>
        </PremiumCard>
      </PageShell>
    </AdminOnly>
  );
}
