import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasos } from '@/contexts/CasosContext';
import { CasoCirurgico } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileUp, FileSpreadsheet, FileText, ClipboardCheck, AlertTriangle,
  Check, X, ChevronRight, Upload, Loader2, ShieldCheck, ShieldAlert, ShieldX
} from 'lucide-react';

type UploadState = 'upload' | 'processing' | 'review';
type Confidence = 'alta' | 'media' | 'baixa' | 'erro';

interface ExtractedField {
  value: string | number | boolean;
  confidence: Confidence;
}

interface ExtractedCase {
  id: string;
  fields: Record<string, ExtractedField>;
  overallConfidence: Confidence;
  approved: boolean;
  reviewed: boolean;
  fieldsTotal: number;
  fieldsHigh: number;
}

interface UploadHistory {
  filename: string;
  date: string;
  casesExtracted: number;
  status: 'processed' | 'pending_review' | 'error';
}

const mockHistory: UploadHistory[] = [
  { filename: 'faturamento_janeiro_2025.xlsx', date: '2025-01-28', casesExtracted: 8, status: 'processed' },
  { filename: 'laudos_opme_fevereiro.pdf', date: '2025-02-15', casesExtracted: 5, status: 'processed' },
  { filename: 'autorizacoes_marco.pdf', date: '2025-03-10', casesExtracted: 3, status: 'pending_review' },
];

const processingMessages = [
  'Lendo estrutura do arquivo...',
  'Identificando campos clínicos...',
  'Mapeando CID e códigos TUSS...',
  'Calculando campos automáticos...',
  'Preparando revisão...',
];

function makeField(value: string | number | boolean, confidence: Confidence = 'alta'): ExtractedField {
  return { value, confidence };
}

function generateMockExtracted(): ExtractedCase[] {
  const base = [
    // 2 Alta
    {
      id: 'ext-1', overallConfidence: 'alta' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 20,
      fields: {
        idPaciente: makeField('PAC-0101'), dataNascimento: makeField('1955-06-12'), sexo: makeField('M'),
        carteirinha: makeField('MS-2025-0101'), classificacaoASA: makeField('II'),
        dataAdmissao: makeField('2025-03-02T08:00'), dataCirurgia: makeField('2025-03-02T11:00'),
        cidPrincipal: makeField('S72.0'), codigoTUSS: makeField('30725089'),
        tipoProcedimento: makeField('Osteossíntese'), hospitalId: makeField('barra'), tipoRede: makeField('Própria'),
        cirurgiaoNome: makeField('Dr. Carlos Mendes'), cirurgiaoCrm: makeField('12345-RJ'), carater: makeField('Urgência'),
        valorOPME: makeField(11000), descricaoImplante: makeField('DHS 135° Synthes'),
        codigoANVISA: makeField('10345700'), fornecedorOPME: makeField('Synthes Brasil'),
        diasUTI: makeField(0), diasEnfermaria: makeField(4), valorDiariaUTI: makeField(2800),
        valorDiariaEnfermaria: makeField(850), honorarioEquipe: makeField(4500), honorarioAnestesia: makeField(2200),
        custoExames: makeField(1000), valorCobrado: makeField(25000), valorGlosado: makeField(300),
        dataAlta: makeField('2025-03-06'), statusAlta: makeField('Alta hospitalar'),
        complicacoes: makeField(''), reinternacao30d: makeField(false),
      },
    },
    {
      id: 'ext-2', overallConfidence: 'alta' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 20,
      fields: {
        idPaciente: makeField('PAC-0102'), dataNascimento: makeField('1948-11-25'), sexo: makeField('F'),
        carteirinha: makeField('MS-2025-0102'), classificacaoASA: makeField('III'),
        dataAdmissao: makeField('2025-03-05T14:00'), dataCirurgia: makeField('2025-03-05T17:30'),
        cidPrincipal: makeField('S72.1'), codigoTUSS: makeField('30725089'),
        tipoProcedimento: makeField('Artroplastia'), hospitalId: makeField('botafogo'), tipoRede: makeField('Própria'),
        cirurgiaoNome: makeField('Dra. Ana Rocha'), cirurgiaoCrm: makeField('23456-RJ'), carater: makeField('Urgência'),
        valorOPME: makeField(18500), descricaoImplante: makeField('Prótese parcial Stryker'),
        codigoANVISA: makeField('10345701'), fornecedorOPME: makeField('Stryker'),
        diasUTI: makeField(2), diasEnfermaria: makeField(6), valorDiariaUTI: makeField(2600),
        valorDiariaEnfermaria: makeField(800), honorarioEquipe: makeField(5500), honorarioAnestesia: makeField(2500),
        custoExames: makeField(1800), valorCobrado: makeField(42000), valorGlosado: makeField(1000),
        dataAlta: makeField('2025-03-13'), statusAlta: makeField('Alta hospitalar'),
        complicacoes: makeField(''), reinternacao30d: makeField(false),
      },
    },
    // 2 Média
    {
      id: 'ext-3', overallConfidence: 'media' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 16,
      fields: {
        idPaciente: makeField('PAC-0103'), dataNascimento: makeField('1940-03-08'), sexo: makeField('M'),
        carteirinha: makeField('MS-2025-0103'), classificacaoASA: makeField('III'),
        dataAdmissao: makeField('2025-03-10T09:00'), dataCirurgia: makeField('2025-03-10T12:30'),
        cidPrincipal: makeField('S72.0'), codigoTUSS: makeField('30725089'),
        tipoProcedimento: makeField('Osteossíntese'), hospitalId: makeField('sao-lucas'), tipoRede: makeField('Externa'),
        cirurgiaoNome: makeField('Dr. Pedro Lima'), cirurgiaoCrm: makeField('34567-RJ'), carater: makeField('Eletivo'),
        valorOPME: makeField(13000), descricaoImplante: makeField('Placa LCP DePuy'),
        codigoANVISA: makeField('10345702'), fornecedorOPME: makeField('DePuy'),
        diasUTI: makeField(1), diasEnfermaria: makeField(5), valorDiariaUTI: makeField(3200),
        valorDiariaEnfermaria: makeField(1100), honorarioEquipe: makeField(6000),
        honorarioAnestesia: makeField(2800, 'media'), custoExames: makeField(1500, 'media'),
        valorCobrado: makeField(35000), valorGlosado: makeField(800),
        dataAlta: makeField('2025-03-16'), statusAlta: makeField('Alta hospitalar'),
        complicacoes: makeField(''), reinternacao30d: makeField(false),
      },
    },
    {
      id: 'ext-4', overallConfidence: 'media' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 16,
      fields: {
        idPaciente: makeField('PAC-0104'), dataNascimento: makeField('1937-09-18'), sexo: makeField('F'),
        carteirinha: makeField('MS-2025-0104'), classificacaoASA: makeField('IV'),
        dataAdmissao: makeField('2025-03-15T06:00'), dataCirurgia: makeField('2025-03-15T09:00'),
        cidPrincipal: makeField('S72.1'), codigoTUSS: makeField('30725089'),
        tipoProcedimento: makeField('Artroplastia'), hospitalId: makeField('barra'), tipoRede: makeField('Própria'),
        cirurgiaoNome: makeField('Dr. Sergio Costa'), cirurgiaoCrm: makeField('45678-RJ'), carater: makeField('Urgência'),
        valorOPME: makeField(20000), descricaoImplante: makeField('Prótese total Zimmer'),
        codigoANVISA: makeField('10345703'), fornecedorOPME: makeField('Zimmer Biomet'),
        diasUTI: makeField(3), diasEnfermaria: makeField(7), valorDiariaUTI: makeField(2800),
        valorDiariaEnfermaria: makeField(850), honorarioEquipe: makeField(7000),
        honorarioAnestesia: makeField(3000, 'media'), custoExames: makeField(2200, 'media'),
        valorCobrado: makeField(50000), valorGlosado: makeField(2000),
        dataAlta: makeField('2025-03-25'), statusAlta: makeField('Alta hospitalar'),
        complicacoes: makeField('Anemia pós-operatória'), reinternacao30d: makeField(false),
      },
    },
    // 1 Baixa
    {
      id: 'ext-5', overallConfidence: 'baixa' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 12,
      fields: {
        idPaciente: makeField('PAC-0105'), dataNascimento: makeField('1943-01-30'), sexo: makeField('F'),
        carteirinha: makeField('MS-2025-0105'), classificacaoASA: makeField('III'),
        dataAdmissao: makeField('2025-03-20T10:00'), dataCirurgia: makeField('2025-03-20T14:00'),
        cidPrincipal: makeField('', 'baixa'), codigoTUSS: makeField('30725089'),
        tipoProcedimento: makeField('Osteossíntese'), hospitalId: makeField('sao-lucas'), tipoRede: makeField('Externa'),
        cirurgiaoNome: makeField('Dra. Julia Neves'), cirurgiaoCrm: makeField('56789-RJ'), carater: makeField('Urgência'),
        valorOPME: makeField(0, 'baixa'), descricaoImplante: makeField('', 'baixa'),
        codigoANVISA: makeField('', 'baixa'), fornecedorOPME: makeField('', 'baixa'),
        diasUTI: makeField(1), diasEnfermaria: makeField(5), valorDiariaUTI: makeField(3200),
        valorDiariaEnfermaria: makeField(1100), honorarioEquipe: makeField(5500),
        honorarioAnestesia: makeField(2600, 'media'), custoExames: makeField(1400, 'media'),
        valorCobrado: makeField(30000), valorGlosado: makeField(900),
        dataAlta: makeField('2025-03-26'), statusAlta: makeField('Alta hospitalar'),
        complicacoes: makeField(''), reinternacao30d: makeField(false),
      },
    },
    // 1 Erro
    {
      id: 'ext-6', overallConfidence: 'erro' as Confidence, approved: false, reviewed: false, fieldsTotal: 20, fieldsHigh: 0,
      fields: {
        idPaciente: makeField('—', 'erro'), dataNascimento: makeField('', 'erro'), sexo: makeField('', 'erro'),
        carteirinha: makeField('', 'erro'), classificacaoASA: makeField('', 'erro'),
        dataAdmissao: makeField('', 'erro'), dataCirurgia: makeField('', 'erro'),
        cidPrincipal: makeField('', 'erro'), codigoTUSS: makeField('', 'erro'),
        tipoProcedimento: makeField('', 'erro'), hospitalId: makeField('', 'erro'), tipoRede: makeField('', 'erro'),
        cirurgiaoNome: makeField('', 'erro'), cirurgiaoCrm: makeField('', 'erro'), carater: makeField('', 'erro'),
        valorOPME: makeField(0, 'erro'), descricaoImplante: makeField('', 'erro'),
        codigoANVISA: makeField('', 'erro'), fornecedorOPME: makeField('', 'erro'),
        diasUTI: makeField(0, 'erro'), diasEnfermaria: makeField(0, 'erro'), valorDiariaUTI: makeField(0, 'erro'),
        valorDiariaEnfermaria: makeField(0, 'erro'), honorarioEquipe: makeField(0, 'erro'),
        honorarioAnestesia: makeField(0, 'erro'), custoExames: makeField(0, 'erro'),
        valorCobrado: makeField(0, 'erro'), valorGlosado: makeField(0, 'erro'),
        dataAlta: makeField('', 'erro'), statusAlta: makeField('', 'erro'),
        complicacoes: makeField('', 'erro'), reinternacao30d: makeField(false, 'erro'),
      },
    },
  ];
  return base;
}

const fieldLabels: Record<string, string> = {
  idPaciente: 'ID Paciente', dataNascimento: 'Data Nascimento', sexo: 'Sexo',
  carteirinha: 'Carteirinha', classificacaoASA: 'ASA',
  dataAdmissao: 'Data Admissão', dataCirurgia: 'Data Cirurgia',
  cidPrincipal: 'CID Principal', codigoTUSS: 'Código TUSS',
  tipoProcedimento: 'Tipo Procedimento', hospitalId: 'Hospital', tipoRede: 'Tipo Rede',
  cirurgiaoNome: 'Cirurgião', cirurgiaoCrm: 'CRM Cirurgião', carater: 'Caráter',
  valorOPME: 'Valor OPME', descricaoImplante: 'Implante',
  codigoANVISA: 'ANVISA', fornecedorOPME: 'Fornecedor OPME',
  diasUTI: 'Dias UTI', diasEnfermaria: 'Dias Enfermaria',
  valorDiariaUTI: 'Diária UTI', valorDiariaEnfermaria: 'Diária Enfermaria',
  honorarioEquipe: 'Honorário Equipe', honorarioAnestesia: 'Honorário Anestesia',
  custoExames: 'Custo Exames', valorCobrado: 'Valor Cobrado', valorGlosado: 'Valor Glosado',
  dataAlta: 'Data Alta', statusAlta: 'Status Alta',
  complicacoes: 'Complicações', reinternacao30d: 'Reinternação 30d',
};

function confidenceBadge(c: Confidence) {
  switch (c) {
    case 'alta': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Alta</Badge>;
    case 'media': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs"><ShieldAlert className="h-3 w-3 mr-1" />Média</Badge>;
    case 'baixa': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs"><ShieldX className="h-3 w-3 mr-1" />Baixa</Badge>;
    case 'erro': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><X className="h-3 w-3 mr-1" />Erro</Badge>;
  }
}

function historyStatusBadge(s: string) {
  if (s === 'processed') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Processado</Badge>;
  if (s === 'pending_review') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Revisão pendente</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Erro</Badge>;
}

export default function ImportData() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addCaso } = useCasos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [extracted, setExtracted] = useState<ExtractedCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ExtractedCase | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const acceptedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const acceptedExts = ['.pdf', '.xls', '.xlsx'];

  const isValidFile = (file: File) => {
    if (acceptedTypes.includes(file.type)) return true;
    return acceptedExts.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const startProcessing = useCallback((name: string) => {
    setFileName(name);
    setState('processing');
    setProgress(0);
    setProgressMsg(processingMessages[0]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < processingMessages.length) {
        setProgress((step / processingMessages.length) * 100);
        setProgressMsg(processingMessages[step]);
      } else {
        clearInterval(interval);
        setProgress(100);
        setExtracted(generateMockExtracted());
        setState('review');
      }
    }, 700);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      toast({ title: 'Arquivo inválido', description: 'Aceita apenas PDF, XLS ou XLSX.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O limite é 10MB.', variant: 'destructive' });
      return;
    }
    startProcessing(file.name);
  }, [startProcessing, toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openReviewPanel = (c: ExtractedCase) => {
    if (c.overallConfidence === 'erro') return;
    setSelectedCase({ ...c, fields: { ...c.fields } });
    setSheetOpen(true);
  };

  const updateFieldValue = (key: string, value: string | number | boolean) => {
    if (!selectedCase) return;
    setSelectedCase(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [key]: { ...prev.fields[key], value, confidence: 'alta' as Confidence },
        },
      };
    });
  };

  const saveCase = () => {
    if (!selectedCase) return;
    setExtracted(prev => prev.map(c =>
      c.id === selectedCase.id
        ? { ...selectedCase, approved: true, reviewed: true }
        : c
    ));
    setSheetOpen(false);
    toast({ title: 'Caso revisado', description: `${selectedCase.fields.idPaciente.value} salvo com sucesso.` });
  };

  const skipCase = () => {
    setSheetOpen(false);
  };

  const approvedCount = extracted.filter(c => c.approved).length;
  const importableCount = extracted.filter(c => c.overallConfidence !== 'erro').length;
  const pendingLow = extracted.filter(c => c.overallConfidence === 'baixa' && !c.reviewed).length;
  const needsReview = extracted.filter(c => (c.overallConfidence === 'media' || c.overallConfidence === 'baixa') && !c.reviewed).length;

  const canImport = pendingLow === 0 && approvedCount > 0;

  const handleImport = async () => {
    const toImport = extracted.filter(c => c.approved || (c.overallConfidence === 'alta' && c.overallConfidence !== 'erro'));
    let count = 0;
    for (const ec of toImport) {
      const f = ec.fields;
      const caso: CasoCirurgico = {
        id: crypto.randomUUID(),
        idPaciente: String(f.idPaciente.value),
        dataNascimento: String(f.dataNascimento.value),
        sexo: String(f.sexo.value) as any,
        carteirinha: String(f.carteirinha.value),
        classificacaoASA: String(f.classificacaoASA.value) as any,
        dataAdmissao: String(f.dataAdmissao.value),
        dataCirurgia: String(f.dataCirurgia.value),
        cidPrincipal: String(f.cidPrincipal.value),
        codigoTUSS: String(f.codigoTUSS.value),
        tipoProcedimento: String(f.tipoProcedimento.value) as any,
        hospitalId: String(f.hospitalId.value),
        tipoRede: String(f.tipoRede.value) as any,
        cirurgiao: { nome: String(f.cirurgiaoNome.value), crm: String(f.cirurgiaoCrm.value) },
        carater: String(f.carater.value) as any,
        valorOPME: Number(f.valorOPME.value),
        descricaoImplante: String(f.descricaoImplante.value),
        codigoANVISA: String(f.codigoANVISA.value),
        fornecedorOPME: String(f.fornecedorOPME.value),
        diasUTI: Number(f.diasUTI.value),
        diasEnfermaria: Number(f.diasEnfermaria.value),
        valorDiariaUTI: Number(f.valorDiariaUTI.value),
        valorDiariaEnfermaria: Number(f.valorDiariaEnfermaria.value),
        honorarioEquipe: Number(f.honorarioEquipe.value),
        honorarioAnestesia: Number(f.honorarioAnestesia.value),
        custoExames: Number(f.custoExames.value),
        valorCobrado: Number(f.valorCobrado.value),
        valorGlosado: Number(f.valorGlosado.value),
        dataAlta: String(f.dataAlta.value),
        statusAlta: String(f.statusAlta.value) as any,
        complicacoes: String(f.complicacoes.value),
        reinternacao30d: Boolean(f.reinternacao30d.value),
      };
      await addCaso(caso);
      count++;
    }
    setConfirmOpen(false);
    toast({ title: `${count} casos importados com sucesso`, description: 'Os casos foram adicionados ao sistema.' });
    navigate('/casos');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  // ---- STATE 1: UPLOAD ----
  if (state === 'upload') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Importar Dados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arraste um arquivo PDF ou Excel com dados de faturamento. A IA extrai e organiza automaticamente.
          </p>
        </div>

        {/* Dropzone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
            ${dragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-accent/30'}
            ${shakeError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xls,.xlsx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <FileUp className={`h-12 w-12 mx-auto mb-4 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-lg font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground mt-1">Aceita PDF, XLS e XLSX — até 10MB</p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><ClipboardCheck className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-sm">Laudos de OPME</p>
                  <p className="text-xs text-muted-foreground mt-1">Extrai implante, ANVISA, fornecedor, valor</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><FileSpreadsheet className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-sm">Planilhas de faturamento</p>
                  <p className="text-xs text-muted-foreground mt-1">Lê colunas e mapeia para os campos do banco</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-sm">Relatórios de autorização</p>
                  <p className="text-xs text-muted-foreground mt-1">Extrai TUSS, CID, data, cirurgião</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        {mockHistory.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico de uploads</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3">Arquivo</th>
                      <th className="text-left p-3">Data</th>
                      <th className="text-right p-3">Casos</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((h, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3 flex items-center gap-2">
                          {h.filename.endsWith('.pdf') ? <FileText className="h-4 w-4 text-red-400" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />}
                          {h.filename}
                        </td>
                        <td className="p-3">{new Date(h.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-right">{h.casesExtracted}</td>
                        <td className="p-3 text-center">{historyStatusBadge(h.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ---- STATE 2: PROCESSING ----
  if (state === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="font-medium">{fileName}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{progressMsg}</span>
          </div>
          <p className="text-xs text-muted-foreground">Isso leva alguns segundos</p>
          <Button variant="ghost" size="sm" onClick={() => setState('upload')}>Cancelar</Button>
        </div>
      </div>
    );
  }

  // ---- STATE 3: REVIEW ----
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revisão da Extração</h1>
          <p className="text-muted-foreground text-sm mt-1">Arquivo: <span className="font-medium text-foreground">{fileName}</span></p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setState('upload'); setExtracted([]); }}>
          Novo upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: File preview */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Arquivo original</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">Excel • 342 KB • 3 abas</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-accent/30 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Casos detectados:</span> <span className="font-medium">{extracted.length}</span></p>
              <p><span className="text-muted-foreground">Confiança alta:</span> <span className="font-medium text-emerald-400">{extracted.filter(c => c.overallConfidence === 'alta').length}</span></p>
              <p><span className="text-muted-foreground">Precisam revisão:</span> <span className="font-medium text-amber-400">{needsReview}</span></p>
              <p><span className="text-muted-foreground">Erros:</span> <span className="font-medium text-red-400">{extracted.filter(c => c.overallConfidence === 'erro').length}</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Extracted cases table */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-sm">Casos extraídos pela IA</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">ID Paciente</th>
                    <th className="text-left p-2">Tipo Proc.</th>
                    <th className="text-right p-2">Custo OPME</th>
                    <th className="text-center p-2">Confiança</th>
                    <th className="text-center p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {extracted.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border/50 transition-colors ${c.overallConfidence === 'erro' ? 'opacity-50' : 'hover:bg-accent/50 cursor-pointer'}`}
                      onClick={() => openReviewPanel(c)}
                    >
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-mono text-xs">{String(c.fields.idPaciente.value) || '—'}</td>
                      <td className="p-2">{String(c.fields.tipoProcedimento.value) || '—'}</td>
                      <td className="p-2 text-right font-mono">{c.overallConfidence === 'erro' ? '—' : fmt(Number(c.fields.valorOPME.value))}</td>
                      <td className="p-2 text-center">{confidenceBadge(c.overallConfidence)}</td>
                      <td className="p-2 text-center">
                        {c.overallConfidence === 'erro' ? (
                          <Badge variant="destructive" className="text-xs">Não importável</Badge>
                        ) : c.approved ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : c.overallConfidence !== 'alta' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Pronto</span>
                        )}
                      </td>
                      <td className="p-2">
                        {c.overallConfidence !== 'erro' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{extracted.length}</span> casos extraídos —{' '}
              <span className="font-medium text-emerald-400">{approvedCount + extracted.filter(c => c.overallConfidence === 'alta' && !c.approved).length}</span> prontos para importar —{' '}
              <span className="font-medium text-amber-400">{needsReview}</span> precisam de revisão
            </p>
            <div className="flex gap-2">
              {needsReview > 0 && (
                <Button variant="outline" size="sm" onClick={() => {
                  const pending = extracted.find(c => (c.overallConfidence === 'media' || c.overallConfidence === 'baixa') && !c.reviewed);
                  if (pending) openReviewPanel(pending);
                }}>
                  Revisar pendentes
                </Button>
              )}
              <Button
                size="sm"
                disabled={!canImport}
                onClick={() => setConfirmOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {approvedCount + extracted.filter(c => c.overallConfidence === 'alta' && !c.approved).length} casos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Panel */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Revisar caso {selectedCase && String(selectedCase.fields.idPaciente.value)}
              {selectedCase && confidenceBadge(selectedCase.overallConfidence)}
            </SheetTitle>
          </SheetHeader>
          {selectedCase && (
            <div className="mt-6 space-y-4">
              <div className="text-xs text-muted-foreground">
                {Object.values(selectedCase.fields).filter(f => f.confidence === 'alta').length} de {Object.keys(selectedCase.fields).length} campos com alta confiança
              </div>
              <div className="space-y-3">
                {Object.entries(selectedCase.fields).map(([key, field]) => (
                  <div key={key} className={`p-3 rounded-lg border transition-all ${
                    field.confidence === 'alta' ? 'border-border bg-transparent' :
                    field.confidence === 'media' ? 'border-amber-500/30 bg-amber-500/5' :
                    field.confidence === 'baixa' ? 'border-orange-500/40 bg-orange-500/10' :
                    'border-red-500/40 bg-red-500/10'
                  }`}>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      {fieldLabels[key] || key}
                      {field.confidence === 'media' && <ShieldAlert className="h-3 w-3 text-amber-400" />}
                      {field.confidence === 'baixa' && <ShieldX className="h-3 w-3 text-orange-400" />}
                    </Label>
                    {key === 'sexo' ? (
                      <Select value={String(field.value)} onValueChange={(v) => updateFieldValue(key, v)}>
                        <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : key === 'reinternacao30d' ? (
                      <Select value={String(field.value)} onValueChange={(v) => updateFieldValue(key, v === 'true')}>
                        <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Não</SelectItem>
                          <SelectItem value="true">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="mt-1 h-8 text-sm"
                        value={String(field.value)}
                        placeholder={field.confidence === 'baixa' ? 'Verificar manualmente' : ''}
                        onChange={(e) => updateFieldValue(key, typeof field.value === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button className="flex-1" onClick={saveCase}><Check className="h-4 w-4 mr-2" />Salvar este caso</Button>
                <Button variant="outline" className="flex-1" onClick={skipCase}>Pular</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importação</AlertDialogTitle>
            <AlertDialogDescription>
              {approvedCount + extracted.filter(c => c.overallConfidence === 'alta' && !c.approved).length} casos serão adicionados ao sistema. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
