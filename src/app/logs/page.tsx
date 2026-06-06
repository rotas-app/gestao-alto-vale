"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedPage from "@/components/ProtectedPage";

import { listarLogs } from "@/services/logService";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  async function carregarLogs() {
    const data = await listarLogs();
    setLogs(data as any[]);
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row">
        <Sidebar />

        <div className="flex-1">
          <Header />

          <main className="p-6 bg-zinc-950 min-h-screen">
            <h1 className="text-3xl text-yellow-400 font-bold mb-6">
              Auditoria / Logs
            </h1>

            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-zinc-900 border border-zinc-800 rounded p-4"
                >
                  <p className="text-yellow-400 font-bold">
                    {log.acao}
                  </p>

                  <p className="text-white">
                    {log.detalhes}
                  </p>

                  <p className="text-zinc-400 text-sm mt-2">
                    Usuário: {log.usuario}
                  </p>
                </div>
              ))}

              {logs.length === 0 && (
                <p className="text-zinc-400">
                  Nenhum log encontrado.
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}