import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addHeader, addFooter } from "@/utils/pdfHelpers"
import { RankingMotorista } from "@/types/metrica"

/**
 * Gera e faz download do ranking DS em PDF.
 * Pode ser usado para ranking diário, semanal ou mensal.
 */
export function generateRankingReport(
  ranking: RankingMotorista[],
  titulo: string = "RANKING DS",
  periodo: string = ""
): void {
  const pdf = new jsPDF()

  addHeader(pdf)

  pdf.setFontSize(13)
  pdf.setFont("helvetica", "bold")
  pdf.text(titulo, 14, 48)

  if (periodo) {
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Período: ${periodo}`, 14, 56)
  }

  const startY = periodo ? 65 : 58

  autoTable(pdf, {
    startY,
    head: [["Posição", "Motorista", "DS Médio (%)", "Status"]],
    body: ranking.map((item) => {
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
    bodyStyles: { fontSize: 10 },
  })

  addFooter(pdf)

  const nomeBase = titulo.toLowerCase().replace(/\s+/g, "-")
  pdf.save(`${nomeBase}.pdf`)
}
