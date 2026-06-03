import { calcularDS } from "@/utils/calcDS"

/**
 * Gera o valor de DS a partir de totais de pacotes.
 * Camada de serviço que isola a lógica de cálculo do Firestore.
 */
export function gerarDSMetrica(
  totalPacotes: number,
  naoEntregues: number
): number {
  return calcularDS(totalPacotes, naoEntregues)
}

/**
 * Retorna o status visual (cor) baseado no valor de DS.
 * >= 98 → "success" (verde)
 * >= 95 → "warning" (amarelo)
 * < 95  → "danger"  (vermelho)
 */
export function statusDS(ds: number): "success" | "warning" | "danger" {
  if (ds >= 98) return "success"
  if (ds >= 95) return "warning"
  return "danger"
}

/**
 * Retorna a cor hex correspondente ao status do DS.
 * Útil para aplicar cores diretamente em componentes e PDFs.
 */
export function corDS(ds: number): string {
  if (ds >= 98) return "#22c55e"  // verde
  if (ds >= 95) return "#ffc107"  // amarelo
  return "#dc3545"                 // vermelho
}
