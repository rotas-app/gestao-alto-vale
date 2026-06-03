import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addHeader, addFooter } from "@/utils/pdfHelpers"
import { corDS } from "@/services/dsService"
import { Metrica } from "@/types/metrica"

interface DadosRelatorioDiario {
  motoristaNome: string
  motoristaId: string
  data: string
  dsMedia: number
  totalPacotes: number
  totalNaoEntregues: number
  rankingPosicao: number
  metricas: Metrica[]
}

/**
 * Gera e faz download do relatório diário de um motorista em PDF.
 */
export async function generateDailyReport(
  data: DadosRelatorioDiario
): Promise<void> {
  const pdf = new jsPDF()

  addHeader(pdf)

  // Título do relatório
  pdf.setFontSize(13)
  pdf.setFont("helvetica", "bold")
  pdf.text("RELATÓRIO DIÁRIO DE DESEMPENHO", 14, 48)

  // Informações do motorista
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Motorista: ${data.motoristaNome}`, 14, 58)
  pdf.text(`Data: ${data.data}`, 14, 65)
  pdf.text(`Posição no Ranking: ${data.rankingPosicao}º`, 14, 72)
  pdf.text(`Total de Pacotes: ${data.totalPacotes}`, 110, 58)
  pdf.text(`Insucessos: ${data.totalNaoEntregues}`, 110, 65)

  // DS em destaque com cor
  const corAtual = corDS(data.dsMedia)
  const [r, g, b] = corAtual
    .replace("#", "")
    .match(/.{2}/g)!
    .map((hex) => parseInt(hex, 16))

  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(r, g, b)
  pdf.text(`DS: ${data.dsMedia}%`, 110, 72)
  pdf.setTextColor(0, 0, 0)

  // Tabela de métricas por gaiola
  autoTable(pdf, {
    startY: 85,
    head: [["Gaiola", "Total Pacotes", "Insucessos", "DS (%)"]],
    body: data.metricas.map((item) => [
      item.codigoGaiola || "-",
      item.qtdPacotesTotal,
      item.qtdPacotesNaoEntregues,
      `${item.ds}%`,
    ]),
    headStyles: {
      fillColor: [255, 214, 0],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 249, 249] },
  })

  addFooter(pdf)

  const nomeArquivo = `relatorio-diario-${data.motoristaNome
    .toLowerCase()
    .replace(/\s+/g, "-")}-${data.data}.pdf`

  pdf.save(nomeArquivo)
}
