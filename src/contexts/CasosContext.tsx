import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CasoCirurgico } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CasosContextType {
  casos: CasoCirurgico[];
  loading: boolean;
  addCaso: (caso: CasoCirurgico) => Promise<void>;
  updateCaso: (caso: CasoCirurgico) => Promise<void>;
  deleteCaso: (id: string) => Promise<void>;
}

const CasosContext = createContext<CasosContextType | null>(null);

function dbToCaso(row: any): CasoCirurgico {
  return {
    id: row.id,
    idPaciente: row.id_paciente,
    dataNascimento: row.data_nascimento,
    sexo: row.sexo,
    carteirinha: row.carteirinha,
    classificacaoASA: row.classificacao_asa,
    dataAdmissao: row.data_admissao,
    dataCirurgia: row.data_cirurgia,
    cidPrincipal: row.cid_principal,
    codigoTUSS: row.codigo_tuss,
    tipoProcedimento: row.tipo_procedimento,
    hospitalId: row.hospital_id,
    tipoRede: row.tipo_rede,
    cirurgiao: { nome: row.cirurgiao_nome, crm: row.cirurgiao_crm },
    anestesista: row.anestesista_nome ? { nome: row.anestesista_nome, crm: row.anestesista_crm } : undefined,
    carater: row.carater,
    valorOPME: Number(row.valor_opme),
    descricaoImplante: row.descricao_implante,
    codigoANVISA: row.codigo_anvisa,
    fornecedorOPME: row.fornecedor_opme,
    diasUTI: row.dias_uti,
    diasEnfermaria: row.dias_enfermaria,
    valorDiariaUTI: Number(row.valor_diaria_uti),
    valorDiariaEnfermaria: Number(row.valor_diaria_enfermaria),
    honorarioEquipe: Number(row.honorario_equipe),
    honorarioAnestesia: Number(row.honorario_anestesia),
    custoExames: Number(row.custo_exames),
    valorCobrado: Number(row.valor_cobrado),
    valorGlosado: Number(row.valor_glosado),
    dataAlta: row.data_alta,
    statusAlta: row.status_alta,
    dataObito: row.data_obito || undefined,
    complicacoes: row.complicacoes,
    reinternacao30d: row.reinternacao_30d,
    motivoReinternacao: row.motivo_reinternacao || undefined,
    dataReinternacao: row.data_reinternacao || undefined,
  };
}

function casoToDb(caso: CasoCirurgico) {
  return {
    id_paciente: caso.idPaciente,
    data_nascimento: caso.dataNascimento,
    sexo: caso.sexo,
    carteirinha: caso.carteirinha,
    classificacao_asa: caso.classificacaoASA,
    data_admissao: caso.dataAdmissao,
    data_cirurgia: caso.dataCirurgia,
    cid_principal: caso.cidPrincipal,
    codigo_tuss: caso.codigoTUSS,
    tipo_procedimento: caso.tipoProcedimento,
    hospital_id: caso.hospitalId,
    tipo_rede: caso.tipoRede,
    cirurgiao_nome: caso.cirurgiao.nome,
    cirurgiao_crm: caso.cirurgiao.crm,
    anestesista_nome: caso.anestesista?.nome || null,
    anestesista_crm: caso.anestesista?.crm || null,
    carater: caso.carater,
    valor_opme: caso.valorOPME,
    descricao_implante: caso.descricaoImplante,
    codigo_anvisa: caso.codigoANVISA,
    fornecedor_opme: caso.fornecedorOPME,
    dias_uti: caso.diasUTI,
    dias_enfermaria: caso.diasEnfermaria,
    valor_diaria_uti: caso.valorDiariaUTI,
    valor_diaria_enfermaria: caso.valorDiariaEnfermaria,
    honorario_equipe: caso.honorarioEquipe,
    honorario_anestesia: caso.honorarioAnestesia,
    custo_exames: caso.custoExames,
    valor_cobrado: caso.valorCobrado,
    valor_glosado: caso.valorGlosado,
    data_alta: caso.dataAlta,
    status_alta: caso.statusAlta,
    data_obito: caso.dataObito || null,
    complicacoes: caso.complicacoes,
    reinternacao_30d: caso.reinternacao30d,
    motivo_reinternacao: caso.motivoReinternacao || null,
    data_reinternacao: caso.dataReinternacao || null,
  };
}

export function CasosProvider({ children }: { children: ReactNode }) {
  const [casos, setCasos] = useState<CasoCirurgico[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCasos = async () => {
    const { data, error } = await supabase
      .from('casos_cirurgicos')
      .select('*')
      .order('data_cirurgia', { ascending: false });
    
    if (error) {
      console.error('Error fetching casos:', error);
      toast({ title: 'Erro ao carregar casos', description: error.message, variant: 'destructive' });
    } else {
      setCasos((data || []).map(dbToCaso));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCasos(); }, []);

  const addCaso = async (caso: CasoCirurgico) => {
    const { error } = await supabase.from('casos_cirurgicos').insert(casoToDb(caso));
    if (error) {
      toast({ title: 'Erro ao salvar caso', description: error.message, variant: 'destructive' });
    } else {
      await fetchCasos();
    }
  };

  const updateCaso = async (caso: CasoCirurgico) => {
    const { error } = await supabase.from('casos_cirurgicos').update(casoToDb(caso)).eq('id', caso.id);
    if (error) {
      toast({ title: 'Erro ao atualizar caso', description: error.message, variant: 'destructive' });
    } else {
      await fetchCasos();
    }
  };

  const deleteCaso = async (id: string) => {
    const { error } = await supabase.from('casos_cirurgicos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir caso', description: error.message, variant: 'destructive' });
    } else {
      await fetchCasos();
    }
  };

  return (
    <CasosContext.Provider value={{ casos, loading, addCaso, updateCaso, deleteCaso }}>
      {children}
    </CasosContext.Provider>
  );
}

export function useCasos() {
  const ctx = useContext(CasosContext);
  if (!ctx) throw new Error('useCasos must be used within CasosProvider');
  return ctx;
}
