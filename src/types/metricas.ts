export interface Metrica {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  data: string;
  codigoGaiola?: string;
  idRota?: string;
  qtdPacotesTotal: number;
  qtdPacotesNaoEntregues: number;
  motivoNaoEntrega?: string;
  ds: number;
  baseId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
