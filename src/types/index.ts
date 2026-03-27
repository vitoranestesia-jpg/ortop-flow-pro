export type TipoProcedimento = 'Osteossíntese' | 'Artroplastia' | 'Outro';
export type TipoRede = 'Própria' | 'Externa';
export type Carater = 'Urgência' | 'Eletivo';
export type StatusAlta = 'Alta hospitalar' | 'Transferência' | 'Óbito hospitalar';
export type ClassificacaoASA = 'I' | 'II' | 'III' | 'IV' | 'V';
export type Sexo = 'M' | 'F';
export type UserRole = 'Gestor' | 'Analista' | 'Auditor';

export interface Hospital {
  id: string;
  nome: string;
  tipoRede: TipoRede;
}

export interface Cirurgiao {
  nome: string;
  crm: string;
}

export interface FornecedorOPME {
  nome: string;
}

export interface CasoCirurgico {
  id: string;
  // Identificação
  idPaciente: string;
  dataNascimento: string;
  sexo: Sexo;
  carteirinha: string;
  classificacaoASA: ClassificacaoASA;
  // Dados cirúrgicos
  dataAdmissao: string;
  dataCirurgia: string;
  cidPrincipal: string;
  codigoTUSS: string;
  tipoProcedimento: TipoProcedimento;
  hospitalId: string;
  tipoRede: TipoRede;
  cirurgiao: Cirurgiao;
  anestesista?: Cirurgiao;
  carater: Carater;
  // Custos
  valorOPME: number;
  descricaoImplante: string;
  codigoANVISA: string;
  fornecedorOPME: string;
  diasUTI: number;
  diasEnfermaria: number;
  valorDiariaUTI: number;
  valorDiariaEnfermaria: number;
  honorarioEquipe: number;
  honorarioAnestesia: number;
  custoExames: number;
  valorCobrado: number;
  valorGlosado: number;
  // Desfechos
  dataAlta: string;
  statusAlta: StatusAlta;
  dataObito?: string;
  complicacoes: string;
  reinternacao30d: boolean;
  motivoReinternacao?: string;
  dataReinternacao?: string;
}

// Computed helpers
export function calcTempoPortaBisturi(admissao: string, cirurgia: string): number {
  const diff = new Date(cirurgia).getTime() - new Date(admissao).getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
}

export function calcTempoInternacao(admissao: string, alta: string): number {
  const diff = new Date(alta).getTime() - new Date(admissao).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function calcCustoDiarias(caso: CasoCirurgico): number {
  return caso.diasUTI * caso.valorDiariaUTI + caso.diasEnfermaria * caso.valorDiariaEnfermaria;
}

export function calcCustoTotal(caso: CasoCirurgico): number {
  return caso.valorOPME + caso.honorarioEquipe + caso.honorarioAnestesia + calcCustoDiarias(caso) + caso.custoExames;
}

export function calcIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}
