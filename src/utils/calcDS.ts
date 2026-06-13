/**
 * Calcula o Delivery Score (DS) de um motorista.
 * DS = ((totalPacotes - naoEntregues) / totalPacotes) * 100
 *
 * @param totalPacotes - Total de pacotes atribuídos
 * @param naoEntregues - Total de pacotes não entregues (insucessos)
 * @returns DS em percentual com 2 casas decimais. Retorna 0 se totalPacotes <= 0.
 */
export function calcularDS(
  totalPacotes: number,
  naoEntregues: number
): number {
  if (totalPacotes <= 0) {
    return 0
  }

  const ds =
    ((totalPacotes - naoEntregues) / totalPacotes) * 100

  return Number(ds.toFixed(2))
}

/**
 * Calcula o DS operacional durante a rota.
 * DS = pacotes entregues / total de pacotes.
 */
export function calcularDSPorEntregas(
  totalPacotes: number,
  pacotesEntregues: number
): number {
  if (totalPacotes <= 0) {
    return 0
  }

  const ds = (pacotesEntregues / totalPacotes) * 100

  return Number(ds.toFixed(2))
}
