import { useState, useMemo } from 'react';
import { useCasos } from '@/contexts/CasosContext';
import { calcCustoTotal, calcTempoInternacao, calcTempoPortaBisturi } from '@/types';
import { getHospitalNome } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FIELD_GROUPS = {
  identificacao: {
    label: 'Identificação',
    fields: [
      { key: 'idPaciente', label: 'ID Paciente' },
      { key: 'dataNascimento', label: 'Data Nascimento' },
      { key: 'sexo', label: 'Sexo' },
      { key: 'carteirinha', label: 'Carteirinha' },
      { key: 'classificacaoASA', label: 'ASA' },
    ],
  },
  cirurgico: {
    label: 'Dados Cirúrgicos',
    fields: [
      { key: 'hospital', label: 'Hospital' },
      { key: 'tipoRede', label: 'Tipo Rede' },
      { key: 'tipoProcedimento', label: 'Tipo Procedimento' },
      { key: 'cidPrincipal', label: 'CID' },
      { key: 'codigoTUSS', label: 'TUSS' },
      { key: 'carater', label: 'Caráter' },
      { key: 'cirurgiao', label: 'Cirurgião' },
      { key: 'dataAdmissao', label: 'Data Admissão' },
      { key: 'dataCirurgia', label: 'Data Cirurgia' },
      { key: 'tempoPortaBisturi', label: 'Tempo Porta-Bisturi (h)' },
    ],
  },
  custos: {
    label: 'Custos',
    fields: [
      { key: 'valorOPME', label: 'OPME (R$)' },
      { key: 'descricaoImplante', label: 'Implante' },
      { key: 'codigoANVISA', label: 'ANVISA' },
      { key: 'fornecedorOPME', label: 'Fornecedor' },
      { key: 'diasUTI', label: 'Dias UTI' },
      { key: 'diasEnfermaria', label: 'Dias Enfermaria' },
      { key: 'honorarioEquipe', label: 'Honorário Equipe (R$)' },
      { key: 'honorarioAnestesia', label: 'Honorário Anestesia (R$)' },
      { key: 'custoExames', label: 'Exames (R$)' },
      { key: 'valorCobrado', label: 'Valor Cobrado (R$)' },
      { key: 'valorGlosado', label: 'Valor Glosado (R$)' },
      { key: 'custoTotal', label: 'Custo Total (R$)' },
    ],
  },
  desfechos: {
    label: 'Desfechos',
    fields: [
      { key: 'dataAlta', label: 'Data Alta' },
      { key: 'statusAlta', label: 'Status Alta' },
      { key: 'tempoInternacao', label: 'Tempo Internação (dias)' },
      { key: 'complicacoes', label: 'Complicações' },
      { key: 'reinternacao30d', label: 'Reinternação 30d' },
    ],
  },
} as const;

type FieldKey = (typeof FIELD_GROUPS)[keyof typeof FIELD_GROUPS]['fields'][number]['key'];

function getAllFieldKeys(): FieldKey[] {
  return Object.values(FIELD_GROUPS).flatMap(g => g.fields.map(f => f.key)) as FieldKey[];
}

function getFieldLabel(key: string): string {
  for (const g of Object.values(FIELD_GROUPS)) {
    const f = g.fields.find(f => f.key === key);
    if (f) return f.label;
  }
  return key;
}

function resolveFieldValue(caso: any, key: string): string {
  switch (key) {
    case 'hospital': return getHospitalNome(caso.hospitalId);
    case 'cirurgiao': return `${caso.cirurgiao.nome} (${caso.cirurgiao.crm})`;
    case 'tempoPortaBisturi': return calcTempoPortaBisturi(caso.dataAdmissao, caso.dataCirurgia).toString();
    case 'custoTotal': return calcCustoTotal(caso).toFixed(2);
    case 'tempoInternacao': return calcTempoInternacao(caso.dataAdmissao, caso.dataAlta).toString();
    case 'reinternacao30d': return caso.reinternacao30d ? 'Sim' : 'Não';
    case 'dataAdmissao':
    case 'dataCirurgia': return new Date(caso[key]).toLocaleString('pt-BR');
    case 'dataNascimento':
    case 'dataAlta': return new Date(caso[key]).toLocaleDateString('pt-BR');
    default: return String(caso[key] ?? '');
  }
}

export default function ExportData() {
  const { casos } = useCasos();
  const { toast } = useToast();

  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set(getAllFieldKeys()));
  const [hospitalFilter, setHospitalFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [caraterFilter, setCaraterFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const filtered = useMemo(() => {
    return casos.filter(c => {
      if (hospitalFilter !== 'todos' && c.hospitalId !== hospitalFilter) return false;
      if (tipoFilter !== 'todos' && c.tipoProcedimento !== tipoFilter) return false;
      if (caraterFilter !== 'todos' && c.carater !== caraterFilter) return false;
      if (statusFilter !== 'todos' && c.statusAlta !== statusFilter) return false;
      if (dateFrom && new Date(c.dataCirurgia) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.dataCirurgia) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [casos, hospitalFilter, tipoFilter, caraterFilter, statusFilter, dateFrom, dateTo]);

  const toggleField = (key: FieldKey) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAllFields = () => setSelectedFields(new Set(getAllFieldKeys()));
  const clearAllFields = () => setSelectedFields(new Set());

  const toggleGroup = (groupKey: keyof typeof FIELD_GROUPS) => {
    const groupFields = FIELD_GROUPS[groupKey].fields.map(f => f.key) as FieldKey[];
    const allSelected = groupFields.every(k => selectedFields.has(k));
    setSelectedFields(prev => {
      const next = new Set(prev);
      groupFields.forEach(k => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const handleExport = () => {
    if (selectedFields.size === 0) {
      toast({ title: 'Selecione ao menos um campo', variant: 'destructive' });
      return;
    }
    if (filtered.length === 0) {
      toast({ title: 'Nenhum caso encontrado com os filtros aplicados', variant: 'destructive' });
      return;
    }

    const fields = getAllFieldKeys().filter(k => selectedFields.has(k));
    const headers = fields.map(getFieldLabel);
    const rows = filtered.map(c => fields.map(k => resolveFieldValue(c, k)));

    const sep = format === 'csv' ? ';' : '\t';
    const content = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\n');
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel';
    const ext = format === 'csv' ? 'csv' : 'xls';

    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ortopgest_dados_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${filtered.length} casos exportados com ${fields.length} campos.`,
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exportar Dados</h1>
          <p className="text-sm text-muted-foreground">Baixe os dados estruturados filtrados por período, tipo ou outras variáveis</p>
        </div>
        <Badge variant="secondary" className="text-sm w-fit">
          {filtered.length} caso{filtered.length !== 1 ? 's' : ''} selecionado{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" />Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Período da Cirurgia</Label>
              <div className="flex gap-2">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hospital</Label>
              <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="barra">Barra da Tijuca</SelectItem>
                  <SelectItem value="botafogo">Botafogo</SelectItem>
                  <SelectItem value="sao-lucas">São Lucas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo Procedimento</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Osteossíntese">Osteossíntese</SelectItem>
                  <SelectItem value="Artroplastia">Artroplastia</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Caráter</Label>
              <Select value={caraterFilter} onValueChange={setCaraterFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Urgência">Urgência</SelectItem>
                  <SelectItem value="Eletivo">Eletivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status Alta</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Alta hospitalar">Alta</SelectItem>
                  <SelectItem value="Óbito hospitalar">Óbito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Campos para Exportação</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllFields}>Selecionar todos</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAllFields}>Limpar</Button>
            </div>
          </div>
          <CardDescription className="text-xs">Escolha quais dados incluir no arquivo exportado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(FIELD_GROUPS) as [keyof typeof FIELD_GROUPS, typeof FIELD_GROUPS[keyof typeof FIELD_GROUPS]][]).map(([groupKey, group]) => {
              const groupFields = group.fields.map(f => f.key) as FieldKey[];
              const allSelected = groupFields.every(k => selectedFields.has(k));
              const someSelected = groupFields.some(k => selectedFields.has(k));

              return (
                <div key={groupKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      ref={el => { if (el) (el as any).indeterminate = someSelected && !allSelected; }}
                      onCheckedChange={() => toggleGroup(groupKey)}
                    />
                    <span className="text-xs font-semibold text-primary">{group.label}</span>
                  </div>
                  <div className="space-y-1 pl-4">
                    {group.fields.map(f => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedFields.has(f.key as FieldKey)}
                          onCheckedChange={() => toggleField(f.key as FieldKey)}
                        />
                        <span className="text-xs">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exportar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Formato:</Label>
              <div className="flex gap-2">
                <Button
                  variant={format === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('csv')}
                >
                  <FileText className="h-4 w-4 mr-1" />CSV
                </Button>
                <Button
                  variant={format === 'xlsx' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('xlsx')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
                </Button>
              </div>
            </div>
            <Button onClick={handleExport} disabled={selectedFields.size === 0 || filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar {filtered.length} caso{filtered.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
