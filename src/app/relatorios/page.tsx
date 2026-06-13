"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Clock3,
  Download,
  FileText,
  Package,
  PackageCheck,
  Route,
  Save,
  Star,
  XCircle,
} from "lucide-react";

import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";
import { useBase } from "@/contexts/BaseContext";
import {
  buscarRelatorioDiario,
  salvarRelatorioDiario,
} from "@/services/relatorioDiarioService";
import {
  editarMetrica,
  listarMetricas,
} from "@/services/metricaService";
import type { Metrica } from "@/types/metricas";
import { calcularDSPorEntregas } from "@/utils/calcDS";
import { addFooter, addHeader } from "@/utils/pdfHelpers";

const LIMITE_ALERTA_DS = 95;

function dataLocalAtual() {
  const agora = new Date();
  const offset = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offset).toISOString().slice(0, 10);
}

function formatarData(data: string) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${data}T12:00:00`)
  );
}

function numero(valor: number | undefined) {
  return Number(valor || 0);
}

function entreguesDaRota(metrica: Metrica) {
  if (typeof metrica.qtdPacotesEntregues === "number") {
    return metrica.qtdPacotesEntregues;
  }

  return Math.max(
    0,
    numero(metrica.qtdPacotesTotal) -
      numero(metrica.qtdPacotesNaoEntregues)
  );
}

function dsDaRota(metrica: Metrica) {
  return calcularDSPorEntregas(
    numero(metrica.qtdPacotesTotal),
    entreguesDaRota(metrica)
  );
}

function statusDaRota(metrica: Metrica) {
  const status = `${metrica.statusRota || ""} ${
    metrica.substatusRota || ""
  }`.toLocaleLowerCase("pt-BR");

  if (
    status.includes("out_of_area") ||
    status.includes("fora da area") ||
    status.includes("fora da área")
  ) {
    return "Fora da área";
  }

  if (
    status.includes("close") ||
    status.includes("complete") ||
    status.includes("finish") ||
    status.includes("conclu")
  ) {
    return "Concluída";
  }

  if (
    status.includes("active") ||
    status.includes("started") ||
    status.includes("progress") ||
    status.includes("andamento")
  ) {
    return "Em andamento";
  }

  return status.trim() ? metrica.statusRota || "Desconhecido" : "Desconhecido";
}

function nomeDaRota(metrica: Metrica) {
  return metrica.codigoGaiola || metrica.idRota || "Rota sem identificação";
}

function linhaDaRota(metrica: Metrica) {
  const entregues = entreguesDaRota(metrica);
  const total = numero(metrica.qtdPacotesTotal);
  const falhas = numero(
    metrica.qtdPacotesFalhas ?? metrica.qtdPacotesNaoEntregues
  );
  const pendentes = numero(metrica.qtdPacotesPendentes);

  return {
    ...metrica,
    total,
    entregues,
    falhas,
    pendentes,
    dsOperacional: dsDaRota(metrica),
    statusOperacional: statusDaRota(metrica),
  };
}

export default function RelatoriosPage() {
  const { baseAtual, bases } = useBase();
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(dataLocalAtual);
  const [dispatcher, setDispatcher] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [justificativas, setJustificativas] = useState<Record<string, string>>(
    {}
  );
  const [salvandoCabecalho, setSalvandoCabecalho] = useState(false);
  const [salvandoJustificativa, setSalvandoJustificativa] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregamento = baseAtual
      ? listarMetricas(baseAtual)
      : Promise.resolve<Metrica[]>([]);

    carregamento.then((dados) => {
      if (ativo) {
        setMetricas(dados);
      }
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual]);

  useEffect(() => {
    let ativo = true;

    if (!baseAtual || !dataSelecionada) {
      return;
    }

    buscarRelatorioDiario(baseAtual, dataSelecionada).then((relatorio) => {
      if (!ativo) return;

      setDispatcher(relatorio?.dispatcher || "");
      setObservacoesGerais(relatorio?.observacoesGerais || "");
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual, dataSelecionada]);

  const rotas = useMemo(
    () =>
      metricas
        .filter((metrica) => metrica.data === dataSelecionada)
        .map(linhaDaRota),
    [dataSelecionada, metricas]
  );

  const resumo = useMemo(() => {
    const total = rotas.reduce((soma, rota) => soma + rota.total, 0);
    const entregues = rotas.reduce(
      (soma, rota) => soma + rota.entregues,
      0
    );
    const pendentes = rotas.reduce(
      (soma, rota) => soma + rota.pendentes,
      0
    );
    const falhas = rotas.reduce((soma, rota) => soma + rota.falhas, 0);

    return {
      total,
      entregues,
      pendentes,
      falhas,
      ds: calcularDSPorEntregas(total, entregues),
      emAndamento: rotas.filter(
        (rota) => rota.statusOperacional === "Em andamento"
      ).length,
      concluidas: rotas.filter(
        (rota) => rota.statusOperacional === "Concluída"
      ).length,
      outrosStatus: rotas.filter(
        (rota) =>
          rota.statusOperacional !== "Em andamento" &&
          rota.statusOperacional !== "Concluída"
      ).length,
    };
  }, [rotas]);

  const pioresDs = useMemo(
    () =>
      [...rotas]
        .filter((rota) => rota.total > 0)
        .sort(
          (a, b) =>
            a.dsOperacional - b.dsOperacional || b.total - a.total
        )
        .slice(0, 5),
    [rotas]
  );

  const melhoresDs = useMemo(
    () =>
      [...rotas]
        .filter((rota) => rota.total > 0)
        .sort(
          (a, b) =>
            b.dsOperacional - a.dsOperacional ||
            b.entregues - a.entregues
        )
        .slice(0, 5),
    [rotas]
  );

  const rotasComFalha = useMemo(
    () =>
      [...rotas]
        .filter((rota) => rota.falhas > 0)
        .sort(
          (a, b) =>
            b.falhas - a.falhas || b.pendentes - a.pendentes
        ),
    [rotas]
  );

  const rotasComAlerta = useMemo(
    () =>
      [...rotas]
        .filter(
          (rota) =>
            rota.falhas > 0 ||
            rota.pendentes > 0 ||
            rota.dsOperacional < LIMITE_ALERTA_DS
        )
        .sort(
          (a, b) =>
            a.dsOperacional - b.dsOperacional || b.falhas - a.falhas
        ),
    [rotas]
  );

  const nomeBase =
    bases.find((base) => base.id === baseAtual)?.nome || baseAtual || "-";

  async function salvarCabecalho() {
    if (!baseAtual) {
      alert("Selecione uma base antes de salvar.");
      return;
    }

    setSalvandoCabecalho(true);

    try {
      await salvarRelatorioDiario({
        baseId: baseAtual,
        data: dataSelecionada,
        dispatcher: dispatcher.trim(),
        observacoesGerais: observacoesGerais.trim(),
      });
      alert("Informações do relatório salvas.");
    } finally {
      setSalvandoCabecalho(false);
    }
  }

  async function salvarJustificativa(metrica: Metrica) {
    setSalvandoJustificativa(metrica.id);

    try {
      await editarMetrica(metrica.id, {
        motivoNaoEntrega:
          justificativas[metrica.id] ?? metrica.motivoNaoEntrega ?? "",
        updatedAt: new Date(),
      });

      setMetricas((atuais) =>
        atuais.map((item) =>
          item.id === metrica.id
            ? {
                ...item,
                motivoNaoEntrega:
                  justificativas[metrica.id] ??
                  metrica.motivoNaoEntrega ??
                  "",
              }
            : item
        )
      );
    } finally {
      setSalvandoJustificativa("");
    }
  }

  function gerarMensagemWhatsapp() {
    const piores = pioresDs
      .map(
        (rota, index) =>
          `${index + 1}. ${nomeDaRota(rota)} — ${rota.motoristaNome}\n` +
          `DS: ${rota.dsOperacional}% | ${rota.entregues}/${rota.total}`
      )
      .join("\n");

    const falhas = rotasComFalha
      .map(
        (rota, index) =>
          `${index + 1}. ${nomeDaRota(rota)} — ${rota.motoristaNome}\n` +
          `Falhas: ${rota.falhas} | Pendentes: ${rota.pendentes} | ` +
          `Status: ${rota.statusOperacional}`
      )
      .join("\n");

    const melhores = melhoresDs
      .map(
        (rota, index) =>
          `${index + 1}. ${nomeDaRota(rota)} — ${rota.motoristaNome}\n` +
          `DS: ${rota.dsOperacional}% | ${rota.entregues}/${rota.total}`
      )
      .join("\n");

    const justificadas = rotasComAlerta
      .filter(
        (rota) =>
          (justificativas[rota.id] ?? rota.motivoNaoEntrega ?? "").trim()
            .length > 0
      )
      .map(
        (rota) =>
          `• ${nomeDaRota(rota)} — ${rota.motoristaNome}: ${
            justificativas[rota.id] ?? rota.motivoNaoEntrega
          }`
      )
      .join("\n");

    return `*RELATÓRIO FINAL DO DIA*
${formatarData(dataSelecionada)} — ${nomeBase}
Dispatcher: ${dispatcher || "-"}

*Resumo operacional*
Rotas: ${rotas.length}
Pacotes: ${resumo.total}
Entregues: ${resumo.entregues}
Pendentes: ${resumo.pendentes}
Falhas: ${resumo.falhas}
DS Geral: ${resumo.ds}%
Em andamento: ${resumo.emAndamento}
Concluídas: ${resumo.concluidas}
Outros status: ${resumo.outrosStatus}

*Atenção — Piores DS%*
${piores || "Nenhuma rota"}

*Falhas de Entrega*
${falhas || "Nenhuma falha registrada"}

*Destaques — Melhores DS%*
${melhores || "Nenhuma rota"}

*Justificativas*
${justificadas || "Nenhuma justificativa registrada"}

*Observações gerais*
${observacoesGerais || "Sem observações."}`;
  }

  async function copiarWhatsapp() {
    if (rotas.length === 0) {
      alert("Nenhuma rota encontrada na data selecionada.");
      return;
    }

    await navigator.clipboard.writeText(gerarMensagemWhatsapp());
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  function exportarPdf() {
    if (rotas.length === 0) {
      alert("Nenhuma rota encontrada na data selecionada.");
      return;
    }

    const pdf = new jsPDF();
    const documento = pdf as jsPDF & {
      lastAutoTable?: { finalY: number };
    };

    addHeader(pdf);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("RELATÓRIO FINAL DO DIA", 14, 47);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${formatarData(dataSelecionada)} | Base: ${nomeBase} | Dispatcher: ${
        dispatcher || "-"
      }`,
      14,
      55
    );

    autoTable(pdf, {
      startY: 62,
      head: [["Rotas", "Pacotes", "Entregues", "Pendentes", "Falhas", "DS"]],
      body: [
        [
          rotas.length,
          resumo.total,
          resumo.entregues,
          resumo.pendentes,
          resumo.falhas,
          `${resumo.ds}%`,
        ],
      ],
      headStyles: {
        fillColor: [255, 214, 0],
        textColor: [0, 0, 0],
      },
      styles: { halign: "center", fontSize: 9 },
    });

    let inicio = (documento.lastAutoTable?.finalY || 80) + 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Atenção — Piores DS%", 14, inicio);
    autoTable(pdf, {
      startY: inicio + 3,
      head: [["Rota", "Motorista", "DS", "Entregues", "Status"]],
      body: pioresDs.map((rota) => [
        nomeDaRota(rota),
        rota.motoristaNome,
        `${rota.dsOperacional}%`,
        `${rota.entregues}/${rota.total}`,
        rota.statusOperacional,
      ]),
      headStyles: { fillColor: [180, 40, 40] },
      bodyStyles: { fontSize: 8 },
    });

    inicio = (documento.lastAutoTable?.finalY || inicio) + 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Falhas de Entrega", 14, inicio);
    autoTable(pdf, {
      startY: inicio + 3,
      head: [["Rota", "Motorista", "Falhas", "Pendentes", "Status"]],
      body:
        rotasComFalha.length > 0
          ? rotasComFalha.map((rota) => [
              nomeDaRota(rota),
              rota.motoristaNome,
              rota.falhas,
              rota.pendentes,
              rota.statusOperacional,
            ])
          : [["-", "Nenhuma falha registrada", 0, 0, "-"]],
      headStyles: { fillColor: [180, 40, 40] },
      bodyStyles: { fontSize: 8 },
    });

    inicio = (documento.lastAutoTable?.finalY || inicio) + 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Destaques — Melhores DS%", 14, inicio);
    autoTable(pdf, {
      startY: inicio + 3,
      head: [["Rota", "Motorista", "DS", "Entregues", "Status"]],
      body: melhoresDs.map((rota) => [
        nomeDaRota(rota),
        rota.motoristaNome,
        `${rota.dsOperacional}%`,
        `${rota.entregues}/${rota.total}`,
        rota.statusOperacional,
      ]),
      headStyles: { fillColor: [28, 120, 70] },
      bodyStyles: { fontSize: 8 },
    });

    const justificadas = rotasComAlerta.filter(
      (rota) =>
        (justificativas[rota.id] ?? rota.motivoNaoEntrega ?? "").trim()
          .length > 0
    );

    inicio = (documento.lastAutoTable?.finalY || inicio) + 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Justificativas e observações", 14, inicio);
    autoTable(pdf, {
      startY: inicio + 3,
      head: [["Rota", "Motorista", "Justificativa"]],
      body: [
        ...justificadas.map((rota) => [
          nomeDaRota(rota),
          rota.motoristaNome,
          justificativas[rota.id] ?? rota.motivoNaoEntrega ?? "",
        ]),
        [
          "Geral",
          dispatcher || "Dispatcher",
          observacoesGerais || "Sem observações gerais.",
        ],
      ],
      headStyles: {
        fillColor: [255, 214, 0],
        textColor: [0, 0, 0],
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 90 } },
    });

    addFooter(pdf);
    pdf.save(`relatorio-final-${dataSelecionada}.pdf`);
  }

  return (
    <PageShell
      title="Relatório do Dia"
      subtitle="Fechamento operacional compacto para gestão e cliente."
    >
      <PremiumCard className="mb-5">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1">
            <label className="text-zinc-400 text-sm block mb-2">
              Data da operação
            </label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(event) => setDataSelecionada(event.target.value)}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div className="flex-1">
            <label className="text-zinc-400 text-sm block mb-2">
              Dispatcher
            </label>
            <input
              value={dispatcher}
              onChange={(event) => setDispatcher(event.target.value)}
              placeholder="Nome do responsável pelo fechamento"
              className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <button
            onClick={salvarCabecalho}
            disabled={salvandoCabecalho}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-white font-black px-5 py-4 rounded-2xl transition"
          >
            <Save size={18} />
            {salvandoCabecalho ? "Salvando..." : "Salvar informações"}
          </button>

          <button
            onClick={copiarWhatsapp}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-5 py-4 rounded-2xl transition"
          >
            <Clipboard size={18} />
            {copiado ? "Relatório copiado" : "Copiar para WhatsApp"}
          </button>

          <button
            onClick={exportarPdf}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-5 py-4 rounded-2xl transition"
          >
            <Download size={18} />
            Baixar PDF final
          </button>
        </div>
      </PremiumCard>

      <PremiumCard className="mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.22em]">
              Relatório operacional
            </p>
            <h2 className="text-white text-3xl font-black mt-2">
              {formatarData(dataSelecionada)} — {nomeBase}
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Dispatcher: {dispatcher || "não informado"}
            </p>
          </div>
          <FileText className="text-yellow-400" size={32} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <ResumoCard titulo="Rotas" valor={rotas.length} icone={<Route />} />
          <ResumoCard titulo="Pacotes" valor={resumo.total} icone={<Package />} />
          <ResumoCard
            titulo="Entregues"
            valor={resumo.entregues}
            icone={<PackageCheck />}
            cor="text-emerald-400"
          />
          <ResumoCard
            titulo="Pendentes"
            valor={resumo.pendentes}
            icone={<Clock3 />}
            cor="text-orange-400"
          />
          <ResumoCard
            titulo="Falhas"
            valor={resumo.falhas}
            icone={<XCircle />}
            cor="text-red-400"
          />
          <ResumoCard
            titulo="DS Geral"
            valor={`${resumo.ds}%`}
            icone={<CheckCircle2 />}
            cor="text-yellow-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <StatusCard titulo="Em andamento" valor={resumo.emAndamento} />
          <StatusCard titulo="Concluídas" valor={resumo.concluidas} />
          <StatusCard titulo="Outros status" valor={resumo.outrosStatus} />
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ListaDesempenho
          titulo="Atenção — Piores DS%"
          icone={<AlertTriangle className="text-red-400" />}
          rotas={pioresDs}
          vazio="Nenhuma rota encontrada."
        />
        <ListaDesempenho
          titulo="Destaques — Melhores DS%"
          icone={<Star className="text-yellow-400" />}
          rotas={melhoresDs}
          vazio="Nenhuma rota encontrada."
        />
      </div>

      <PremiumCard className="mb-5">
        <div className="flex items-center gap-3 mb-5">
          <XCircle className="text-red-400" />
          <div>
            <h2 className="text-white text-2xl font-black">
              Falhas de Entrega
            </h2>
            <p className="text-zinc-500 text-sm">
              Rotas ordenadas pela maior quantidade de falhas.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rotasComFalha.map((rota, index) => (
            <div
              key={rota.id}
              className="grid grid-cols-1 lg:grid-cols-[55px_1fr_auto] gap-3 items-center rounded-2xl border border-zinc-800 bg-black p-4"
            >
              <span className="text-zinc-600 font-black text-xl">
                {index + 1}.
              </span>
              <div>
                <p className="text-white font-black">
                  {nomeDaRota(rota)} — {rota.motoristaNome}
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Falhas: {rota.falhas} | Pendentes: {rota.pendentes} |
                  Status: {rota.statusOperacional}
                </p>
              </div>
              <span className="text-red-400 text-2xl font-black">
                {rota.falhas}
              </span>
            </div>
          ))}

          {rotasComFalha.length === 0 && (
            <p className="text-zinc-500 text-center py-8">
              Nenhuma falha registrada neste dia.
            </p>
          )}
        </div>
      </PremiumCard>

      <PremiumCard className="mb-5">
        <div className="flex items-center gap-3 mb-5">
          <AlertTriangle className="text-yellow-400" />
          <div>
            <h2 className="text-white text-2xl font-black">
              Justificativas — Rotas com Alerta
            </h2>
            <p className="text-zinc-500 text-sm">
              Aparecem aqui rotas com DS abaixo de {LIMITE_ALERTA_DS}%,
              falhas ou pacotes pendentes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {rotasComAlerta.map((rota) => (
            <div
              key={rota.id}
              className="rounded-2xl border border-zinc-800 bg-black p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div>
                  <p className="text-white font-black text-lg">
                    {nomeDaRota(rota)} — {rota.motoristaNome}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    DS: {rota.dsOperacional}% | {rota.entregues}/{rota.total} |
                    Falhas: {rota.falhas} | Pendentes: {rota.pendentes}
                  </p>
                </div>
                <span className="text-yellow-400 font-black">
                  {rota.statusOperacional}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row gap-3">
                <textarea
                  value={
                    justificativas[rota.id] ??
                    rota.motivoNaoEntrega ??
                    ""
                  }
                  onChange={(event) =>
                    setJustificativas((atuais) => ({
                      ...atuais,
                      [rota.id]: event.target.value,
                    }))
                  }
                  placeholder="Ex: atraso na saída, área com acesso difícil, veículo parado ou ação tomada..."
                  rows={3}
                  className="flex-1 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-yellow-400 resize-y"
                />
                <button
                  onClick={() => salvarJustificativa(rota)}
                  disabled={salvandoJustificativa === rota.id}
                  className="self-stretch lg:self-end flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-white font-black px-5 py-4 rounded-2xl transition"
                >
                  <Save size={17} />
                  {salvandoJustificativa === rota.id
                    ? "Salvando..."
                    : "Salvar justificativa"}
                </button>
              </div>
            </div>
          ))}

          {rotasComAlerta.length === 0 && (
            <p className="text-zinc-500 text-center py-8">
              Nenhuma rota exige justificativa neste dia.
            </p>
          )}
        </div>
      </PremiumCard>

      <PremiumCard>
        <h2 className="text-white text-2xl font-black">
          Observações Gerais do Dispatcher
        </h2>
        <p className="text-zinc-500 text-sm mt-1 mb-4">
          Registre clima, eventos externos, problemas na estação e decisões
          tomadas durante a operação.
        </p>
        <textarea
          value={observacoesGerais}
          onChange={(event) => setObservacoesGerais(event.target.value)}
          placeholder="Adicione as observações gerais da operação..."
          rows={6}
          className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400 resize-y"
        />
        <button
          onClick={salvarCabecalho}
          disabled={salvandoCabecalho}
          className="mt-4 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-black font-black px-6 py-4 rounded-2xl transition"
        >
          <Save size={18} />
          {salvandoCabecalho ? "Salvando..." : "Salvar fechamento do dia"}
        </button>
      </PremiumCard>
    </PageShell>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
  cor = "text-white",
}: {
  titulo: string;
  valor: number | string;
  icone: React.ReactNode;
  cor?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4">
      <div className={`${cor} [&>svg]:h-5 [&>svg]:w-5`}>{icone}</div>
      <p className="text-zinc-500 text-xs mt-4">{titulo}</p>
      <p className={`${cor} text-3xl font-black mt-1`}>{valor}</p>
    </div>
  );
}

function StatusCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3">
      <span className="text-zinc-500 text-sm">{titulo}</span>
      <span className="text-white font-black">{valor}</span>
    </div>
  );
}

function ListaDesempenho({
  titulo,
  icone,
  rotas,
  vazio,
}: {
  titulo: string;
  icone: React.ReactNode;
  rotas: ReturnType<typeof linhaDaRota>[];
  vazio: string;
}) {
  return (
    <PremiumCard>
      <div className="flex items-center gap-3 mb-5">
        {icone}
        <h2 className="text-white text-2xl font-black">{titulo}</h2>
      </div>

      <div className="space-y-3">
        {rotas.map((rota, index) => (
          <div
            key={rota.id}
            className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-black p-4"
          >
            <span className="text-zinc-600 font-black">{index + 1}.</span>
            <div className="min-w-0 flex-1">
              <p className="text-white font-black truncate">
                {nomeDaRota(rota)} — {rota.motoristaNome}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                DS: {rota.dsOperacional}% | {rota.entregues}/{rota.total} |
                Pendentes: {rota.pendentes}
              </p>
            </div>
          </div>
        ))}

        {rotas.length === 0 && (
          <p className="text-zinc-500 text-center py-8">{vazio}</p>
        )}
      </div>
    </PremiumCard>
  );
}
