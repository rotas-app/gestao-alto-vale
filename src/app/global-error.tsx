"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-black flex items-center justify-center p-6">
        <main className="w-full max-w-lg rounded-3xl border border-red-500/40 bg-zinc-950 p-8 text-center">
          <p className="text-red-400 text-sm font-bold uppercase tracking-[0.25em]">
            Falha inesperada
          </p>

          <h1 className="mt-4 text-3xl font-black text-white">
            Não foi possível concluir esta operação
          </h1>

          <p className="mt-4 text-zinc-400">
            O erro foi registrado para análise. Tente novamente e, se persistir,
            informe o horário ao suporte.
          </p>

          <button
            onClick={reset}
            className="mt-7 rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
