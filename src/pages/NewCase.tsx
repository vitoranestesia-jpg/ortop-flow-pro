import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasos } from '@/contexts/CasosContext';
import { CasoCirurgico, calcTempoPortaBisturi, calcTempoInternacao, calcCustoDiarias, calcCustoTotal, calcIdade } from '@/types';
import { hospitais, cirurgioes } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const steps = ['Identificação', 'Cirurgia', 'Custos', 'Desfechos'];

const emptyCase: CasoCirurgico = {
  id: '', idPaciente: '', dataNascimento: '', sexo: 'M', carteirinha: '', classificacaoASA: 'II',
  dataAdmissao: '', dataCirurgia: '', cidPrincipal: '', codigoTUSS: '', tipoProcedimento: 'Osteossíntese',
  hospitalId: 'barra', tipoRede: 'Própria', cirurgiao: cirurgioes[0], carater: 'Urgência',
  valorOPME: 0, descricaoImplante: '', codigoANVISA: '', fornecedorOPME: '', diasUTI: 0, diasEnfermaria: 0,
  valorDiariaUTI: 2800, valorDiariaEnfermaria: 850, honorarioEquipe: 0, honorarioAnestesia: 0,
  custoExames: 0, valorCobrado: 0, valorGlosado: 0,
  dataAlta: '', statusAlta: 'Alta hospitalar', complicacoes: '', reinternacao30d: false,
};

export default function NewCase() {
  const { id: editId } = useParams();
  const { casos, addCaso, updateCaso } = useCasos();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!editId;

  const existing = isEdit ? casos.find(c => c.id === editId) : null;
  const [form, setForm] = useState<CasoCirurgico>(existing || { ...emptyCase, id: String(Date.now()), idPaciente: `PAC-${String(Date.now()).slice(-4)}` });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof CasoCirurgico, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-fill tipoRede
      if (field === 'hospitalId') {
        const h = hospitais.find(h => h.id === value);
        updated.tipoRede = h?.tipoRede || 'Externa';
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const setNum = (field: keyof CasoCirurgico, value: string) => set(field, Number(value) || 0);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.idPaciente) errs.idPaciente = 'Obrigatório';
    if (!form.dataNascimento) errs.dataNascimento = 'Obrigatório';
    if (!form.dataAdmissao) errs.dataAdmissao = 'Obrigatório';
    if (!form.dataCirurgia) errs.dataCirurgia = 'Obrigatório';
    if (!form.cidPrincipal) errs.cidPrincipal = 'Obrigatório';
    if (form.cidPrincipal && !/^S72\.\d$/.test(form.cidPrincipal)) errs.cidPrincipal = 'Formato: S72.0 a S72.9';
    if (!form.codigoTUSS) errs.codigoTUSS = 'Obrigatório';
    if (form.codigoTUSS && form.codigoTUSS.length !== 8) errs.codigoTUSS = '8 dígitos';
    if (!form.dataAlta) errs.dataAlta = 'Obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast({ title: 'Erro de validação', description: 'Corrija os campos destacados.', variant: 'destructive' });
      return;
    }
    if (isEdit) {
      updateCaso(form);
      toast({ title: 'Caso atualizado', description: `Caso ${form.idPaciente} atualizado com sucesso.` });
    } else {
      addCaso(form);
      toast({ title: 'Caso registrado', description: `Caso ${form.idPaciente} salvo com sucesso.` });
    }
    navigate('/casos');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tpb = form.dataAdmissao && form.dataCirurgia ? calcTempoPortaBisturi(form.dataAdmissao, form.dataCirurgia) : 0;
  const ti = form.dataAdmissao && form.dataAlta ? calcTempoInternacao(form.dataAdmissao, form.dataAlta) : 0;
  const cd = calcCustoDiarias(form);
  const ct = calcCustoTotal(form);
  const idade = form.dataNascimento ? calcIdade(form.dataNascimento) : 0;

  const InputField = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: keyof CasoCirurgico; type?: string; placeholder?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={String(form[field] || '')} onChange={e => type === 'number' ? setNum(field, e.target.value) : set(field, e.target.value)} placeholder={placeholder} className={errors[field] ? 'border-destructive' : ''} />
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  );

  const CalcField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="calculated-field px-3 py-2 text-sm font-medium">{value}</div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Caso' : 'Novo Caso'}</h1>

      {/* Progress */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
            {i + 1}/{steps.length} {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Identificação do Paciente</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="ID Paciente" field="idPaciente" placeholder="PAC-XXXX" />
            <InputField label="Data de Nascimento" field="dataNascimento" type="date" />
            <CalcField label="Idade" value={idade ? `${idade} anos` : '—'} />
            <div className="space-y-1">
              <Label className="text-xs">Sexo</Label>
              <div className="flex gap-4 pt-2">
                {(['M', 'F'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={form.sexo === s} onChange={() => set('sexo', s)} className="accent-[hsl(174,72%,46%)]" />
                    <span className="text-sm">{s === 'M' ? 'Masculino' : 'Feminino'}</span>
                  </label>
                ))}
              </div>
            </div>
            <InputField label="Carteirinha" field="carteirinha" />
            <div className="space-y-1">
              <Label className="text-xs">Classificação ASA</Label>
              <Select value={form.classificacaoASA} onValueChange={v => set('classificacaoASA', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['I','II','III','IV','V'] as const).map(a => <SelectItem key={a} value={a}>ASA {a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados Cirúrgicos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Data/Hora Admissão" field="dataAdmissao" type="datetime-local" />
            <InputField label="Data/Hora Cirurgia" field="dataCirurgia" type="datetime-local" />
            <CalcField label="Tempo Porta-Bisturi" value={tpb ? `${tpb}h` : '—'} />
            <InputField label="CID Principal" field="cidPrincipal" placeholder="S72.0" />
            <InputField label="Código TUSS" field="codigoTUSS" placeholder="30725089" />
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Procedimento</Label>
              <Select value={form.tipoProcedimento} onValueChange={v => set('tipoProcedimento', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Osteossíntese">Osteossíntese</SelectItem>
                  <SelectItem value="Artroplastia">Artroplastia</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hospital</Label>
              <Select value={form.hospitalId} onValueChange={v => set('hospitalId', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hospitais.map(h => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <CalcField label="Tipo de Rede" value={form.tipoRede} />
            <div className="space-y-1">
              <Label className="text-xs">Cirurgião</Label>
              <Select value={form.cirurgiao.crm} onValueChange={v => { const c = cirurgioes.find(c => c.crm === v); if (c) set('cirurgiao', c); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cirurgioes.map(c => <SelectItem key={c.crm} value={c.crm}>{c.nome} ({c.crm})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Caráter</Label>
              <div className="flex gap-4 pt-2">
                {(['Urgência', 'Eletivo'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={form.carater === s} onChange={() => set('carater', s)} className="accent-[hsl(174,72%,46%)]" />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Custos (R$)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Valor OPME" field="valorOPME" type="number" />
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Descrição do Implante</Label>
              <Textarea value={form.descricaoImplante} onChange={e => set('descricaoImplante', e.target.value)} rows={2} />
            </div>
            <InputField label="Código ANVISA" field="codigoANVISA" />
            <InputField label="Fornecedor OPME" field="fornecedorOPME" />
            <InputField label="Dias UTI" field="diasUTI" type="number" />
            <InputField label="Dias Enfermaria" field="diasEnfermaria" type="number" />
            <InputField label="Valor Diária UTI" field="valorDiariaUTI" type="number" />
            <InputField label="Valor Diária Enfermaria" field="valorDiariaEnfermaria" type="number" />
            <InputField label="Honorário Equipe" field="honorarioEquipe" type="number" />
            <InputField label="Honorário Anestesia" field="honorarioAnestesia" type="number" />
            <InputField label="Custo Exames" field="custoExames" type="number" />
            <InputField label="Valor Cobrado ao Plano" field="valorCobrado" type="number" />
            <InputField label="Valor Glosado" field="valorGlosado" type="number" />
            <CalcField label="Custo Diárias" value={fmt(cd)} />
            <CalcField label="Custo Total do Caso" value={fmt(ct)} />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Desfechos Clínicos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Data Alta" field="dataAlta" type="date" />
            <div className="space-y-1">
              <Label className="text-xs">Status Alta</Label>
              <Select value={form.statusAlta} onValueChange={v => set('statusAlta', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta hospitalar">Alta hospitalar</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Óbito hospitalar">Óbito hospitalar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.statusAlta === 'Óbito hospitalar' && <InputField label="Data Óbito" field="dataObito" type="date" />}
            <CalcField label="Tempo Internação" value={ti ? `${ti} dias` : '—'} />
            <div className="space-y-1 md:col-span-3">
              <Label className="text-xs">Complicações</Label>
              <Textarea value={form.complicacoes} onChange={e => set('complicacoes', e.target.value)} rows={2} placeholder="Descreva complicações, se houver" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reinternação 30d</Label>
              <div className="flex gap-4 pt-2">
                {[true, false].map(v => (
                  <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={form.reinternacao30d === v} onChange={() => set('reinternacao30d', v)} className="accent-[hsl(174,72%,46%)]" />
                    <span className="text-sm">{v ? 'Sim' : 'Não'}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.reinternacao30d && (
              <>
                <div className="space-y-1 md:col-span-1">
                  <Label className="text-xs">Motivo Reinternação</Label>
                  <Input value={form.motivoReinternacao || ''} onChange={e => set('motivoReinternacao', e.target.value)} />
                </div>
                <InputField label="Data Reinternação" field="dataReinternacao" type="date" />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/casos')} >
          {step === 0 ? 'Cancelar' : 'Anterior'}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>Próximo</Button>
        ) : (
          <Button onClick={handleSubmit}>{isEdit ? 'Salvar Alterações' : 'Registrar Caso'}</Button>
        )}
      </div>
    </div>
  );
}
