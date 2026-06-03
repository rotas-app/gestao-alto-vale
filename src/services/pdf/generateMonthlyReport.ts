import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addHeader, addFooter } from "@/utils/pdfHelpers"
import { corDS } from "@/services/dsService"
import { RankingMotorista } from "@/types/metrica"

interface DadosRelatorioMensal {
  mes: string        // ex: "Junho/2025"
  dsMediaOperacao: number
  totalPacotes: number
  totalNaoEntregues: number
  totalMotoristas: number
  metaDS: number
  rankingCompleto: RankingMotorista[]
}

/**
 * Gera e faz download do relatório mensal completo da operação em PDF.
 * Inclui capa executiva, top 10 e ranking geral.
 */
export async function generateMonthlyReport(
  data: DadosRelatorioMensal
): Promise<void> {
  const pdf = new jsPDF()

  // ── CAPA EXECUTIVA ──────────────────────────────────
  pdf.setFillColor(255, 214, 0)
  pdf.rect(0, 0, 210, 297, "F")

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(22)
  pdf.setFont("helvetica", "bold")
  pdf.text("GESTÃO INTERNA", 105, 80, { align: "center" })
  pdf.text("EMPRESA ALTO VALE", 105, 95, { align: "center" })

  pdf.setFontSize(16)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Relatório Mensal - ${data.mes}`, 105, 115, { align: "center" })

  pdf.setFontSize(12)
  pdf.text(`DS Geral da Operação: ${data.dsMediaOperacao}%`, 105, 145, { align: "center" })
  pdf.text(`Total de Pacotes: ${data.totalPacotes}`, 105, 158, { align: "center" })
  pdf.text(`Total de Insucessos: ${data.totalNaoEntregues}`, 105, 171, { align: "center" })
  pdf.text(`Total de Motoristas: ${data.totalMotoristas}`, 105, 184, { align: "center" })
  pdf.text(`Meta DS: ${data.metaDS}%`, 105, 197, { align: "center" })

  const atingiuMeta = data.dsMediaOperacao >= data.metaDS
  const corMeta = corDS(data.dsMediaOperacao)
  const [r, g, b] = corMeta
    .replace("#", "")
    .match(/.{2}/g)!
    .map((hex) => parseInt(hex, 16))

  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(r, g, b)
  pdf.text(
    atingiuMeta ? "✔ META ATINGIDA" : "✘ META NÃO ATINGIDA",
    105,
    215,
    { align: "center" }
  )

  // Top 3 motoristas na capa
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("Top 3 Motoristas", 105, 240, { align: "center" })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)

  data.rankingCompleto.slice(0, 3).forEach((m, i) => {
    pdf.text(
      `${i + 1}. ${m.motoristaNome} — ${m.dsMedia}%`,
      105,
      252 + i * 10,
      { align: "center" }
    )
  })

  // ── PÁGINA 2: RANKING GERAL ──────────────────────────
  pdf.addPage()
  addHeader(pdf)

  pdf.setFontSize(13)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  pdf.text("RANKING MENSAL COMPLETO", 14, 48)

  autoTable(pdf, {
    startY: 58,
    head: [["Posição", "Motorista", "DS Médio (%)", "Status"]],
    body: data.rankingCompleto.map((item) => {
      const status =
        item.dsMedia >= 98
          ? "Excelente"
          : item.dsMedia >= 95
          ? "Atenção"
          : "Crítico"

      return [
        `${item.posicao}º`,
        item.motoristaNome,
        `${item.dsMedia}%`,
        status,
      ]
    }),
    headStyles: {
      fillColor: [255, 214, 0],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    didDrawCell: (hookData) => {
      // Colorir célula de status
      if (hookData.column.index === 3 && hookData.section === "body") {
        const val = hookData.cell.text[0]
        if (val === "Excelente") hookData.cell.styles.textColor = [34, 197, 94]
        else if (val === "Atenção") hookData.cell.styles.textColor = [255, 193, 7]
        else hookData.cell.styles.textColor = [220, 53, 69]
      }
    },
  })

  addFooter(pdf)

  pdf.save(`relatorio-mensal-${data.mes.replace("/", "-").toLowerCase()}.pdf`)
}
