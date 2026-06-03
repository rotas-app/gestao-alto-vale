import { Metrica } from "@/types/metrica"

/**
 * Calcula a média de DS de uma lista de métricas.
 * Retorna 0 se a lista estiver vazia.
 */
export function calcularMediaDS(metricas: Metrica[]): number {
  if (!metricas.length) {
    return 0
  }

  const soma = metricas.reduce(
    (acc, item) => acc + item.ds,
    0
  )

  return Number((soma / metricas.length).toFixed(2))
}
