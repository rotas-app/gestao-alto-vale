"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Calendar,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Truck,
} from "lucide-react";

import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { useBase } from "@/contexts/BaseContext";
import type { Metrica } from "@/types/metricas";
import { gerarLinkMercadoLivre } from "@/utils/mercadolivre";
import { criarMotorista } from "@/services/motoristaService";

import {
  criarMetrica,
  editarMetrica,
  excluirMetrica,
  listarMetricas,
  atualizarMetricasMercadoLivre,
} from "@/services/metricaService";
import {
  sincronizarRotasMercadoLivre,
  verificarExtensaoMercadoLivre,
} from "@/services/mercadoLivreExtensionService";

import { calcularDSPorEntregas } from "@/utils/calcDS";

const INTERVALO_SINCRONIZACAO_MS = 15 * 60 * 1000;

function corDS(ds: number) {
  if (ds >= 98) return "text-emerald-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

function obterDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function chaveUltimaSincronizacao(baseId: string, data: string) {
  return `alto-vale:ultima-sincronizacao:${baseId}:${data}`;
}

function formatarTempoRestante(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;

  return `${String(minutos).padStart(2, "0")}:${String(
    segundosRestantes
  ).padStart(2, "0")}`;
}

export default function MetricasPage() {
  const { baseAtual } = useBase();

  const router = useRouter();
  const searchParams = useSearchParams();
  const idRotaFiltro = searchParams.get("idRota") || "";

  const [metricas, setMetricas] = useState<Metrica[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [data, setData] = useState(obterDataHoje);
  const [idRota, setIdRota] = useState("");
  const [extensaoDisponivel, setExtensaoDisponivel] = useState<boolean | null>(
    null
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);
  const [bloqueadoAte, setBloqueadoAte] = useState(0);
  const [agora, setAgora] = useState(() => new Date().getTime());
  const [mensagemSincronizacao, setMensagemSincronizacao] = useState("");

  async function carregarDados() {
    if (!baseAtual) return;

    setMetricas(await listarMetricas(baseAtual));
  }

  function limparFormulario() {
    setEditandoId(null);
    setData(obterDataHoje());
    setIdRota("");
  }

  async function handleSalvar() {
    if (salvandoCadastro) return;

    if (!baseAtual) {
      alert("Selecione uma base");
      return;
    }

    const idRotaNormalizado = idRota.trim();

    if (!data || !/^\d{6,15}$/.test(idRotaNormalizado)) {
      alert("Preencha um ID de rota válido.");
      return;
    }

    const rotaDuplicada = metricas.some(
      (metrica) =>
        metrica.id !== editandoId &&
        String(metrica.idRota || "") === idRotaNormalizado
    );

    if (rotaDuplicada) {
      alert("Este ID de rota já está cadastrado nesta base.");
      return;
    }

    setSalvandoCadastro(true);

    try {
      if (editandoId) {
        await editarMetrica(editandoId, {
          data,
          idRota: idRotaNormalizado,
          updatedAt: new Date(),
        });
        alert("Métrica atualizada");
      } else {
        const novaMetrica = await criarMetrica({
          motoristaId: "",
          motoristaNome: "Aguardando sincronização",
          data,
          codigoGaiola: "",
          idRota: idRotaNormalizado,
          baseId: baseAtual,
          qtdPacotesTotal: 0,
          qtdPacotesNaoEntregues: 0,
          motivoNaoEntrega: "",
          ds: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        try {
          const disponivel = await verificarExtensaoMercadoLivre();
          setExtensaoDisponivel(disponivel);

          if (!disponivel) {
            throw new Error("Extensão não detectada.");
          }

          const [rota] = await sincronizarRotasMercadoLivre([
            idRotaNormalizado,
          ]);

          if (!rota || rota.error) {
            throw new Error(rota?.error || "Rota não encontrada no painel.");
          }

          const motoristaCorrespondente = rota.driverName
            ? await criarMotorista(rota.driverName, baseAtual)
            : undefined;

          await atualizarMetricasMercadoLivre([
            {
              id: novaMetrica.id,
              motoristaId: motoristaCorrespondente?.id,
              motoristaNome:
                motoristaCorrespondente?.nomeCompleto ||
                rota.driverName ||
                "Motorista não identificado",
              motoristaNomeMercadoLivre: rota.driverName,
              codigoGaiola: rota.cluster,
              qtdPacotesTotal: rota.total,
              qtdPacotesEntregues: rota.delivered,
              qtdPacotesNaoEntregues: rota.failed,
              qtdPacotesPendentes: rota.pending,
              qtdPacotesFalhas: rota.failed,
              qtdParadas: rota.stops,
              statusRota: rota.status,
              substatusRota: rota.substatus,
              placaVeiculo: rota.vehicleLicense,
              ds: calcularDSPorEntregas(rota.total, rota.delivered),
            },
          ]);

          alert("Rota cadastrada e sincronizada.");
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Falha ao sincronizar agora.";
          setMensagemSincronizacao(mensagem);
          alert(
            `ID cadastrado. Nao foi possivel sincronizar agora: ${mensagem}`
          );
        }
      }

      limparFormulario();
      await carregarDados();
    } finally {
      setSalvandoCadastro(false);
    }
  }

  function handleEditar(metrica: Metrica) {
    setEditandoId(metrica.id);
    setData(metrica.data);
    setIdRota(metrica.idRota || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleExcluir(id: string) {
    const confirmar = confirm("Deseja realmente excluir esta métrica?");
    if (!confirmar) return;

    await excluirMetrica(id);

    alert("Métrica excluída");
    await carregarDados();
  }

  useEffect(() => {
    let ativo = true;

    const carregamento = baseAtual
      ? listarMetricas(baseAtual)
      : Promise.resolve<Metrica[]>([]);

    carregamento.then((metricasData) => {
      if (!ativo) return;

      setMetricas(metricasData);
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual]);

  useEffect(() => {
    let ativo = true;

    verificarExtensaoMercadoLivre().then((disponivel) => {
      if (ativo) {
        setExtensaoDisponivel(disponivel);
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      if (!baseAtual || !data) {
        setBloqueadoAte(0);
        return;
      }

      const valorSalvo = Number(
        localStorage.getItem(chaveUltimaSincronizacao(baseAtual, data)) || 0
      );

      setBloqueadoAte(valorSalvo);
      setAgora(new Date().getTime());
    }, 0);

    return () => window.clearTimeout(temporizador);
  }, [baseAtual, data]);

  useEffect(() => {
    if (bloqueadoAte <= new Date().getTime()) return;

    const intervalo = window.setInterval(() => {
      setAgora(new Date().getTime());
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [bloqueadoAte]);

  const metricasDoDia = metricas
    .filter((item) => {
      if (idRotaFiltro) {
        return String(item.idRota || "")
          .toLowerCase()
          .includes(idRotaFiltro.toLowerCase());
      }

      return data ? item.data === data : true;
    })
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  const segundosRestantes = Math.max(
    0,
    Math.ceil((bloqueadoAte - agora) / 1000)
  );
  const sincronizacaoBloqueada = segundosRestantes > 0;

  async function handleSincronizarRotas() {
    if (sincronizacaoBloqueada) {
      alert(
        `Aguarde ${formatarTempoRestante(
          segundosRestantes
        )} para sincronizar novamente.`
      );
      return;
    }

    const metricasComRota = metricasDoDia.filter((metrica) =>
      /^\d{6,15}$/.test(String(metrica.idRota || "").trim())
    );

    if (metricasComRota.length === 0) {
      alert("Nenhuma metrica visivel possui um ID de rota valido.");
      return;
    }

    setSincronizando(true);
    setMensagemSincronizacao("");

    try {
      const disponivel = await verificarExtensaoMercadoLivre();
      setExtensaoDisponivel(disponivel);

      if (!disponivel) {
        throw new Error(
          "Extensao nao detectada. Instale a pasta extension e recarregue esta pagina."
        );
      }

      const rotas = await sincronizarRotasMercadoLivre(
        metricasComRota.map((metrica) => String(metrica.idRota))
      );
      const atualizacoes = [];
      let rotasComErro = 0;

      for (const rota of rotas) {
        if (rota.error) {
          rotasComErro += 1;
          continue;
        }

        const metricasDaRota = metricasComRota.filter(
          (metrica) => String(metrica.idRota) === rota.routeId
        );
        const motoristaCorrespondente = rota.driverName
          ? await criarMotorista(rota.driverName, baseAtual)
          : undefined;

        for (const metrica of metricasDaRota) {
          atualizacoes.push({
            id: metrica.id,
            motoristaId: motoristaCorrespondente?.id,
            motoristaNome:
              motoristaCorrespondente?.nomeCompleto ||
              rota.driverName ||
              metrica.motoristaNome,
            motoristaNomeMercadoLivre: rota.driverName,
            codigoGaiola: rota.cluster || metrica.codigoGaiola || "",
            qtdPacotesTotal: rota.total,
            qtdPacotesEntregues: rota.delivered,
            qtdPacotesNaoEntregues: rota.failed,
            qtdPacotesPendentes: rota.pending,
            qtdPacotesFalhas: rota.failed,
            qtdParadas: rota.stops,
            statusRota: rota.status,
            substatusRota: rota.substatus,
            placaVeiculo: rota.vehicleLicense,
            ds: calcularDSPorEntregas(rota.total, rota.delivered),
          });
        }
      }

      if (atualizacoes.length === 0 && rotasComErro > 0) {
        throw new Error(
          "Nenhuma rota foi sincronizada. Verifique se a rota existe no painel e se sua sessao do Mercado Livre esta ativa."
        );
      }

      await atualizarMetricasMercadoLivre(atualizacoes);
      await carregarDados();

      const horarioAtual = new Date().getTime();
      const proximaSincronizacao =
        horarioAtual + INTERVALO_SINCRONIZACAO_MS;
      localStorage.setItem(
        chaveUltimaSincronizacao(baseAtual, data),
        String(proximaSincronizacao)
      );
      setBloqueadoAte(proximaSincronizacao);
      setAgora(horarioAtual);

      const detalhes = [
        `${atualizacoes.length} metrica(s) atualizada(s)`,
        rotasComErro > 0 ? `${rotasComErro} rota(s) com erro` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      setMensagemSincronizacao(detalhes);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Falha ao sincronizar rotas.";

      setMensagemSincronizacao(mensagem);
      alert(mensagem);
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <PageShell
      title="Métricas"
      subtitle="Controle operacional por rota e performance diária."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <PremiumCard className="xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
              <Activity size={22} className="text-yellow-400" />
            </div>

            <div>
              <h2 className="text-white text-2xl font-black">
                {editandoId ? "Editar Métrica" : "Nova Métrica"}
              </h2>

              <p className="text-zinc-500 text-sm">
                Informe somente o ID para buscar os dados automaticamente.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-black border border-zinc-800 p-4">
            <p className="text-zinc-500 text-sm">
              Base operacional ativa
            </p>

            <p className="text-yellow-400 text-2xl font-black mt-1 uppercase">
              {baseAtual || "-"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-4 top-4 text-zinc-500"
                size={18}
              />

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                className="w-full pl-12 p-4 rounded-2xl bg-black border border-zinc-800 text-white"
              />
            </div>

            <input
              placeholder="ID da Rota"
              value={idRota}
              onChange={(e) => setIdRota(e.target.value)}
              className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-sm text-zinc-400">
              Motorista, cluster, placa e quantidades serão preenchidos pelo
              painel após a sincronização.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={handleSalvar}
              disabled={salvandoCadastro}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black px-6 py-4 rounded-2xl transition"
            >
              <Save size={18} />
              {salvandoCadastro
                ? "Salvando..."
                : editandoId
                  ? "Salvar Alterações"
                  : "Cadastrar ID e sincronizar"}
            </button>

            {editandoId && (
              <button
                onClick={limparFormulario}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-6 py-4 rounded-2xl transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center gap-3 mb-5">
            <Truck size={22} className="text-yellow-400" />

            <h2 className="text-white text-2xl font-black">
              Resumo
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-black border border-zinc-800 p-5">
              <p className="text-zinc-500 text-sm">
                Métricas listadas
              </p>

              <p className="text-white text-4xl font-black mt-2">
                {metricasDoDia.length}
              </p>
            </div>

            <div className="rounded-2xl bg-black border border-zinc-800 p-5">
              <p className="text-zinc-500 text-sm">
                Rotas sincronizadas
              </p>

              <p className="text-emerald-400 text-4xl font-black mt-2">
                {
                  metricasDoDia.filter(
                    (metrica) =>
                      metrica.origemSincronizacao ===
                      "mercado_livre_extensao"
                  ).length
                }
              </p>
            </div>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-3xl font-black">
              Métricas do Dia
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Cada rota aparece como uma métrica individual.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleSincronizarRotas}
              disabled={sincronizando || sincronizacaoBloqueada}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black px-5 py-3 rounded-2xl transition"
            >
              <RefreshCw
                size={18}
                className={sincronizando ? "animate-spin" : ""}
              />
              {sincronizando
                ? "Sincronizando..."
                : sincronizacaoBloqueada
                  ? `Aguarde ${formatarTempoRestante(segundosRestantes)}`
                : "Sincronizar rotas do dia"}
            </button>

            <p className="text-zinc-500 text-xs">
              Intervalo mínimo: 15 minutos por base e data.
            </p>

            <p
              className={`text-xs font-bold ${
                extensaoDisponivel
                  ? "text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              {extensaoDisponivel === null
                ? "Verificando extensao..."
                : extensaoDisponivel
                  ? "Extensao conectada"
                  : "Extensao nao detectada"}
            </p>
          </div>
        </div>

        {mensagemSincronizacao && (
          <div className="mb-5 rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
            {mensagemSincronizacao}
          </div>
        )}

        {idRotaFiltro && (
          <div className="mb-5 rounded-3xl bg-yellow-400/10 border border-yellow-400/40 p-5">
            <p className="text-yellow-400 font-black text-lg">
              Resultado da busca:
            </p>

            <p className="text-white mt-1">
              ID da rota: {idRotaFiltro}
            </p>

            <button
              onClick={() => router.push("/metricas")}
              className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-2xl font-black transition"
            >
              Limpar busca
            </button>
          </div>
        )}

        <div className="space-y-4">
          {metricasDoDia.map((metrica) => (
            <div
              key={metrica.id}
              className="rounded-3xl bg-black border border-zinc-800 p-5 hover:border-yellow-400/40 transition"
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <h3 className="text-white text-2xl font-black">
                    {metrica.motoristaNome}
                  </h3>

                  <p className="text-zinc-400 text-sm mt-2">
                    Data: {metrica.data}
                  </p>

                  <p className="text-zinc-400 text-sm mt-1">
                    ID Rota:{" "}
                    {metrica.idRota ? (
                      <a
                        href={gerarLinkMercadoLivre(metrica.idRota)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 underline font-bold"
                      >
                        {metrica.idRota}
                      </a>
                    ) : (
                      "-"
                    )}{" "}
                    | Gaiola: {metrica.codigoGaiola || "-"}
                  </p>

                  <p className="text-zinc-500 text-sm mt-1">
                    Pacotes: {metrica.qtdPacotesTotal} | Insucessos:{" "}
                    {metrica.qtdPacotesNaoEntregues}
                  </p>

                  {metrica.origemSincronizacao ===
                    "mercado_livre_extensao" && (
                    <>
                      <p className="text-zinc-500 text-sm mt-1">
                        Entregues: {metrica.qtdPacotesEntregues || 0} |
                        Pendentes: {metrica.qtdPacotesPendentes || 0} | Placa:{" "}
                        {metrica.placaVeiculo || "-"} | Status:{" "}
                        {metrica.statusRota || "-"}
                      </p>
                      {metrica.motoristaNomeMercadoLivre && (
                        <p className="text-zinc-500 text-sm mt-1">
                          Motorista no painel:{" "}
                          {metrica.motoristaNomeMercadoLivre}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col items-start xl:items-end gap-4">
                  <div className={`text-5xl font-black ${corDS(metrica.ds)}`}>
                    {metrica.ds}%
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(metrica)}
                      className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-3 rounded-2xl transition"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => handleExcluir(metrica.id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-4 py-3 rounded-2xl transition"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {metricasDoDia.length === 0 && (
            <div className="rounded-3xl bg-black border border-zinc-800 p-10 text-center">
              <p className="text-zinc-500">
                Nenhuma métrica encontrada.
              </p>
            </div>
          )}
        </div>
      </PremiumCard>
    </PageShell>
  );
}
