"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Link2,
  LoaderCircle,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";

import AdminOnly from "@/components/AdminOnly";
import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";
import { useAuth } from "@/hooks/useAuth";

interface StatusMercadoLivre {
  connected: boolean;
  mlUserId?: string;
  nickname?: string;
  email?: string;
  scope?: string;
  expiresAt?: string | null;
}

async function lerResposta(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "A API da integração não iniciou corretamente. Confira o runtime Node.js e as variáveis do Vercel."
    );
  }

  return response.json();
}

export default function IntegracoesPage() {
  const { firebaseUser } = useAuth();
  const [status, setStatus] = useState<StatusMercadoLivre>({
    connected: false,
  });
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState("");
  const [mensagem, setMensagem] = useState(() => {
    if (typeof window === "undefined") return "";

    const resultado = new URLSearchParams(window.location.search).get(
      "mercadolivre"
    );

    if (resultado === "conectado") {
      return "Conta do Mercado Livre conectada com sucesso.";
    }

    if (resultado?.startsWith("erro")) {
      return "Não foi possível concluir a autorização. Revise as credenciais e tente novamente.";
    }

    return "";
  });

  const requisicaoAutenticada = useCallback(
    async (url: string, init?: RequestInit) => {
      if (!firebaseUser) {
        throw new Error("Usuário não autenticado.");
      }

      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await lerResposta(response);

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível concluir a operação.");
      }

      return data;
    },
    [firebaseUser]
  );

  const carregarStatus = useCallback(async () => {
    if (!firebaseUser) return;

    setCarregando(true);

    try {
      const data = (await requisicaoAutenticada(
        "/api/mercadolivre/status"
      )) as StatusMercadoLivre;

      setStatus(data);
    } catch (error) {
      setMensagem(
        error instanceof Error ? error.message : "Erro ao carregar integração."
      );
    } finally {
      setCarregando(false);
    }
  }, [firebaseUser, requisicaoAutenticada]);

  useEffect(() => {
    if (!firebaseUser) return;

    let ativo = true;

    firebaseUser
      .getIdToken()
      .then((idToken) =>
        fetch("/api/mercadolivre/status", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then(async (response) => {
        const data = await lerResposta(response);

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar integração.");
        }

        return data as StatusMercadoLivre;
      })
      .then((data) => {
        if (ativo) {
          setStatus(data);
        }
      })
      .catch((error) => {
        if (ativo) {
          setMensagem(
            error instanceof Error
              ? error.message
              : "Erro ao carregar integração."
          );
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [firebaseUser]);

  async function conectar() {
    setAcao("conectar");
    setMensagem("");

    try {
      const data = await requisicaoAutenticada(
        "/api/mercadolivre/auth-url",
        { method: "POST" }
      );

      window.location.href = data.url;
    } catch (error) {
      setMensagem(
        error instanceof Error ? error.message : "Falha ao iniciar conexão."
      );
      setAcao("");
    }
  }

  async function testar() {
    setAcao("testar");
    setMensagem("");

    try {
      const data = await requisicaoAutenticada("/api/mercadolivre/test", {
        method: "POST",
      });

      setMensagem(
        `Conexão válida para ${data.user.nickname} (ID ${data.user.id}).`
      );
      await carregarStatus();
    } catch (error) {
      setMensagem(
        error instanceof Error ? error.message : "Falha ao testar conexão."
      );
    } finally {
      setAcao("");
    }
  }

  async function desconectar() {
    if (!confirm("Deseja desconectar a conta atual do Mercado Livre?")) {
      return;
    }

    setAcao("desconectar");
    setMensagem("");

    try {
      await requisicaoAutenticada("/api/mercadolivre/disconnect", {
        method: "POST",
      });
      setMensagem("Conta desconectada. Você pode autorizar outra conta.");
      await carregarStatus();
    } catch (error) {
      setMensagem(
        error instanceof Error ? error.message : "Falha ao desconectar."
      );
    } finally {
      setAcao("");
    }
  }

  return (
    <AdminOnly>
      <PageShell
        title="Integrações"
        subtitle="Conecte serviços externos sem expor senhas ou credenciais."
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <PremiumCard className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <PlugZap size={22} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-black">
                  Mercado Livre
                </h2>
                <p className="text-zinc-500 text-sm">
                  OAuth público para testar conta, pedidos e envios.
                </p>
              </div>
            </div>

            {carregando ? (
              <div className="flex items-center gap-3 text-zinc-400">
                <LoaderCircle className="animate-spin" size={20} />
                Consultando conexão...
              </div>
            ) : status.connected ? (
              <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-black">
                  <CheckCircle2 size={20} />
                  Conta conectada
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
                  <div>
                    <p className="text-zinc-500">Usuário</p>
                    <p className="text-white font-bold mt-1">
                      {status.nickname || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">ID Mercado Livre</p>
                    <p className="text-white font-bold mt-1">
                      {status.mlUserId || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">E-mail</p>
                    <p className="text-white font-bold mt-1">
                      {status.email || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Permissões</p>
                    <p className="text-white font-bold mt-1">
                      {status.scope || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-black border border-zinc-800 p-5">
                <p className="text-white font-bold">Nenhuma conta conectada</p>
                <p className="text-zinc-500 text-sm mt-2">
                  A conta autorizada define quais pedidos e envios poderão ser
                  consultados.
                </p>
              </div>
            )}

            {mensagem && (
              <div className="mt-5 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-zinc-200">
                {mensagem}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-5">
              {!status.connected && (
                <button
                  onClick={conectar}
                  disabled={Boolean(acao)}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black px-6 py-4 rounded-2xl transition"
                >
                  <Link2 size={18} />
                  {acao === "conectar"
                    ? "Abrindo autorização..."
                    : "Conectar Mercado Livre"}
                </button>
              )}

              {status.connected && (
                <>
                  <button
                    onClick={testar}
                    disabled={Boolean(acao)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black px-6 py-4 rounded-2xl transition"
                  >
                    <RefreshCw
                      size={18}
                      className={acao === "testar" ? "animate-spin" : ""}
                    />
                    Testar conexão
                  </button>

                  <button
                    onClick={desconectar}
                    disabled={Boolean(acao)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black px-6 py-4 rounded-2xl transition"
                  >
                    <Unplug size={18} />
                    Desconectar
                  </button>
                </>
              )}
            </div>
          </PremiumCard>

          <PremiumCard>
            <ShieldCheck size={26} className="text-yellow-400" />
            <h2 className="text-white text-2xl font-black mt-4">
              Armazenamento seguro
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed mt-3">
              Os tokens são guardados no servidor, criptografados e renovados
              automaticamente. Login e senha do Mercado Livre não são
              armazenados.
            </p>
          </PremiumCard>
        </div>
      </PageShell>
    </AdminOnly>
  );
}
