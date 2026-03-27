import { useParams, useNavigate } from 'react-router-dom';
import { useCasos } from '@/contexts/CasosContext';
import { calcCustoTotal, calcCustoDiarias, calcTempoInternacao, calcTempoPortaBisturi, calcIdade } from '@/types';
import { getHospitalNome } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { casos } = useCasos();
  const caso = casos.find(c => c.id === id);

  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">Caso não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/casos')}>Voltar</Button>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tpb = calcTempoPortaBisturi(caso.dataAdmissao, caso.dataCirurgia);
  const ti = calcTempoInternacao(caso.dataAdmissao, caso.dataAlta);
  const cd = calcCustoDiarias(caso);
  const ct = calcCustoTotal(caso);

  const statusBadge = (s: string) => {
    if (s === 'Alta hospitalar') return <Badge className="badge-alta">Alta hospitalar</Badge>;
    if (s === 'Óbito hospitalar') return <Badge className="badge-obito">Óbito hospitalar</Badge>;
    return <Badge className="badge-transferencia">Transferência</Badge>;
  };

  const Field = ({ label, value, calculated }: { label: string; value: string | number; calculated?: boolean }) => (
    <div className={`p-3 rounded-md ${calculated ? 'calculated-field' : ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/casos')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-bold">{caso.idPaciente}</h1>
          {statusBadge(caso.statusAlta)}
        </div>
        <Button onClick={() => navigate(`/editar-caso/${caso.id}`)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Identificação do Paciente</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="ID Paciente" value={caso.idPaciente} />
            <Field label="Idade" value={`${calcIdade(caso.dataNascimento)} anos`} calculated />
            <Field label="Sexo" value={caso.sexo === 'M' ? 'Masculino' : 'Feminino'} />
            <Field label="Carteirinha" value={caso.carteirinha} />
            <Field label="ASA" value={caso.classificacaoASA} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Dados Cirúrgicos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Hospital" value={getHospitalNome(caso.hospitalId)} />
            <Field label="Tipo de Rede" value={caso.tipoRede} />
            <Field label="Procedimento" value={caso.tipoProcedimento} />
            <Field label="CID" value={caso.cidPrincipal} />
            <Field label="TUSS" value={caso.codigoTUSS} />
            <Field label="Caráter" value={caso.carater} />
            <Field label="Cirurgião" value={`${caso.cirurgiao.nome} (${caso.cirurgiao.crm})`} />
            {caso.anestesista && <Field label="Anestesista" value={`${caso.anestesista.nome} (${caso.anestesista.crm})`} />}
            <Field label="Admissão" value={new Date(caso.dataAdmissao).toLocaleString('pt-BR')} />
            <Field label="Cirurgia" value={new Date(caso.dataCirurgia).toLocaleString('pt-BR')} />
            <Field label="Tempo Porta-Bisturi" value={`${tpb}h`} calculated />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Custos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="OPME" value={fmt(caso.valorOPME)} />
            <Field label="Implante" value={caso.descricaoImplante} />
            <Field label="ANVISA" value={caso.codigoANVISA || '—'} />
            <Field label="Fornecedor" value={caso.fornecedorOPME} />
            <Field label="Dias UTI" value={caso.diasUTI} />
            <Field label="Dias Enfermaria" value={caso.diasEnfermaria} />
            <Field label="Honorário Equipe" value={fmt(caso.honorarioEquipe)} />
            <Field label="Honorário Anestesia" value={fmt(caso.honorarioAnestesia)} />
            <Field label="Exames" value={fmt(caso.custoExames)} />
            <Field label="Cobrado ao Plano" value={fmt(caso.valorCobrado)} />
            <Field label="Glosado" value={fmt(caso.valorGlosado)} />
            <Field label="Custo Diárias" value={fmt(cd)} calculated />
            <Field label="Custo Total" value={fmt(ct)} calculated />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Desfechos Clínicos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Data Alta" value={new Date(caso.dataAlta).toLocaleDateString('pt-BR')} />
            <Field label="Status Alta" value={caso.statusAlta} />
            <Field label="Tempo Internação" value={`${ti} dias`} calculated />
            {caso.dataObito && <Field label="Data Óbito" value={new Date(caso.dataObito).toLocaleDateString('pt-BR')} />}
            <Field label="Complicações" value={caso.complicacoes || 'Nenhuma'} />
            <Field label="Reinternação 30d" value={caso.reinternacao30d ? 'Sim' : 'Não'} />
            {caso.reinternacao30d && <Field label="Motivo Reinternação" value={caso.motivoReinternacao || '—'} />}
            {caso.dataReinternacao && <Field label="Data Reinternação" value={new Date(caso.dataReinternacao).toLocaleDateString('pt-BR')} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
