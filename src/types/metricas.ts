export interface Metrica {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  data: string;
  codigoGaiola: string;
  qtdPacotesTotal: number;
  qtdPacotesNaoEntregues: number;
  motivoNaoEntrega: string;
  ds: number;
}