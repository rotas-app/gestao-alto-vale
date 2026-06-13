export interface Metrica {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  motoristaNomeMercadoLivre?: string;
  data: string;
  codigoGaiola?: string;
  idRota?: string;
  qtdPacotesTotal: number;
  qtdPacotesNaoEntregues: number;
  qtdPacotesEntregues?: number;
  qtdPacotesPendentes?: number;
  qtdPacotesFalhas?: number;
  qtdParadas?: number;
  statusRota?: string;
  substatusRota?: string;
  placaVeiculo?: string;
  sincronizadoEm?: unknown;
  origemSincronizacao?: "mercado_livre_extensao";
  motivoNaoEntrega?: string;
  ds: number;
  baseId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
