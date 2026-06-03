import jsPDF from "jspdf"

/**
 * Adiciona o cabeçalho padrão da empresa no PDF.
 * Inclui nome do sistema, data/hora de geração e linha separadora.
 */
export function addHeader(pdf: jsPDF): void {
  // Fundo amarelo Alto Vale no cabeçalho
  pdf.setFillColor(255, 214, 0)
  pdf.rect(0, 0, 210, 35, "F")

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("GESTÃO INTERNA - EMPRESA ALTO VALE", 14, 15)

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    14,
    26
  )

  // Reset cor do texto para preto
  pdf.setTextColor(0, 0, 0)
}

/**
 * Adiciona numeração de páginas no rodapé de todas as páginas.
 */
export function addFooter(pdf: jsPDF): void {
  const totalPages = pdf.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Página ${i} de ${totalPages}`,
      180,
      290,
      { align: "right" }
    )
    pdf.text(
      "Gestão Interna - Empresa Alto Vale",
      14,
      290
    )
  }
}
