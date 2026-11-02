export type CicloRota = "AM" | "PM" | "SD";

export function identificarCicloRota(
  codigoGaiola?: string | null
): CicloRota | undefined {
  const partes = String(codigoGaiola || "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  for (const parte of partes) {
    const ciclo = parte.match(/^(AM|PM|SD)\d*$/)?.[1];
    if (ciclo === "AM" || ciclo === "PM" || ciclo === "SD") {
      return ciclo;
    }
  }

  return undefined;
}
