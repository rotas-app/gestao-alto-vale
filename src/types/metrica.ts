export interface Metrica {
  motoristaId: string
  motoristaNome: string
  data: string // formato: "YYYY-MM-DD"
  qtdPacotesTotal: number
  qtdPacotesNaoEntregues: number
  ds: number
  codigoGaiola?: string
}

export interface RankingMotorista {
  motoristaId: string
  motoristaNome: string
  dsMedia: number
  posicao: number
}

export interface RelatorioPDF {
  motoristaNome: string
  periodo: string
  totalPacotes: number
  totalNaoEntregues: number
  dsMedia: number
  rankingPosicao: number
}

export interface DashboardData {
  melhorDia: RankingMotorista | undefined
  melhorSemana: RankingMotorista | undefined
  melhorMes: RankingMotorista | undefined
  piorDia: RankingMotorista | undefined
}
