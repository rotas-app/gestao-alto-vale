import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addHeader, addFooter } from "@/utils/pdfHelpers"
import { corDS } from "@/services/dsService"
import { Metrica } from "@/types/metrica"

interface DadosRelatorioSemanal {
  motoristaNome: string
  dataInicio: string
  dataFim: string
  dsMedia: number
  totalPacotes: number
  totalNaoEntregues: number
  rankingPosicao: number
  metricasPorDia: { data: string; ds: number; pacotes: number; insucessos: number }[]
}

/**
 * Gera e faz download do relatório semanal de um motorista em PDF.
 */
export async function generateWeeklyReport(
  data: DadosRelatorioSemanal
): Promise<void> {
  const pdf = new jsPDF()

  addHeader(pdf)

  pdf.setFontSize(13)
  pdf.setFont("helvetica", "bold")
  pdf.text("RELATÓRIO SEMANAL DE DESEMPENHO", 14, 48)

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Motorista: ${data.motoristaNome}`, 14, 58)
  pdf.text(
    `Período: ${data.dataInicio} até ${data.dataFim}`,
    14,
    65
  )
  pdf.text(`Posição no Ranking: ${data.rankingPosicao}º`, 14, 72)
  pdf.text(`Total de Pacotes: ${data.totalPacotes}`, 110, 58)
  pdf.text(`Total Insucessos: ${data.totalNaoEntregues}`, 110, 65)

  // DS médio em destaque
  const corAtual = corDS(data.dsMedia)
  const [r, g, b] = corAtual
    .replace("#", "")
    .match(/.{2}/g)!
    .map((hex) => parseInt(hex, 16))

  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(r, g, b)
  pdf.text(`DS Médio: ${data.dsMedia}%`, 110, 72)
  pdf.setTextColor(0, 0, 0)

  // Tabela diária da semana
  autoTable(pdf, {
    startY: 85,
    head: [["Data", "Pacotes", "Insucessos", "DS (%)"]],
    body: data.metricasPorDia.map((item) => [
      item.data,
      item.pacotes,
      item.insucessos,
      `${item.ds}%`,
    ]),
    headStyles: {
      fillColor: [255, 214, 0],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    foot: [["MÉDIA", data.totalPacotes, data.totalNaoEntregues, `${data.dsMedia}%`]],
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 240] },
  })

  addFooter(pdf)

  const nomeArquivo = `relatorio-semanal-${data.motoristaNome
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`

  pdf.save(nomeArquivo)
}
