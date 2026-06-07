export interface Motorista {
  id: string;
  nomeCompleto: string;
  telefone?: string;
  observacao?: string;
  ativo: boolean;
  baseId?: string;
  createdAt?: unknown;
}
