import { useMemo, useState } from 'react';
import { useCasos } from '@/contexts/CasosContext';
import { calcCustoTotal, calcTempoInternacao, calcTempoPortaBisturi, calcCustoDiarias } from '@/types';
import { getHospitalNome } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const COLORS = ['hsl(174,72%,46%)', 'hsl(38,92%,50%)', 'hsl(280,70%,55%)', 'hsl(0,72%,51%)', 'hsl(210,70%,50%)'];
const tooltipStyle = { backgroundColor: 'hsl(222,47%,9%)', border: '1px solid hsl(222,30%,18%)', borderRadius: 8 };
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function Reports() {
  const { casos } = useCasos();

  // ---- Volume ----
  const volumeMes = meses.map((mes, i) => ({
    mes, total: casos.filter(c => new Date(c.dataCirurgia).getMonth() === i).length,
  }));
  const byTipo = ['Osteossíntese','Artroplastia','Outro'].map(t => ({ name: t, value: casos.filter(c => c.tipoProcedimento === t).length }));
  const byHosp = ['barra','botafogo','sao-lucas'].map(h => ({ name: getHospitalNome(h), value: casos.filter(c => c.hospitalId === h).length }));
  const byCarater = ['Urgência','Eletivo'].map(c => ({ name: c, value: casos.filter(x => x.carater === c).length }));

  // ---- Custo ----
  const custoMedioTotal = casos.length ? Math.round(casos.reduce((s,c) => s + calcCustoTotal(c), 0) / casos.length) : 0;
  const custoComp = (() => {
    const t = casos.reduce((a, c) => ({
      OPME: a.OPME + c.valorOPME,
      Honorários: a.Honorários + c.honorarioEquipe + c.honorarioAnestesia,
      Diárias: a.Diárias + calcCustoDiarias(c),
      Exames: a.Exames + c.custoExames,
    }), { OPME: 0, Honorários: 0, Diárias: 0, Exames: 0 });
    return Object.entries(t).map(([k,v]) => ({ name: k, valor: Math.round(v / casos.length) }));
  })();
  const custoRede = ['Própria','Externa'].map(r => {
    const cs = casos.filter(c => c.tipoRede === r);
    return { name: `Rede ${r}`, valor: cs.length ? Math.round(cs.reduce((s,c) => s + calcCustoTotal(c), 0) / cs.length) : 0 };
  });
  const rankCir = useMemo(() => {
    const g: Record<string, { total: number; n: number }> = {};
    casos.forEach(c => {
      const k = c.cirurgiao.nome;
      if (!g[k]) g[k] = { total: 0, n: 0 };
      g[k].total += calcCustoTotal(c); g[k].n++;
    });
    return Object.entries(g).map(([nome, d]) => ({ nome, medio: Math.round(d.total / d.n) })).sort((a,b) => b.medio - a.medio);
  }, [casos]);
  const topOPME = useMemo(() => {
    const g: Record<string, number> = {};
    casos.forEach(c => { g[c.fornecedorOPME] = (g[c.fornecedorOPME] || 0) + c.valorOPME; });
    return Object.entries(g).map(([nome, total]) => ({ nome, total })).sort((a,b) => b.total - a.total).slice(0, 10);
  }, [casos]);

  // ---- Qualidade ----
  const mort30 = casos.length ? ((casos.filter(c => c.statusAlta === 'Óbito hospitalar').length / casos.length) * 100).toFixed(1) : '0';
  const compTx = casos.length ? ((casos.filter(c => c.complicacoes).length / casos.length) * 100).toFixed(1) : '0';
  const reintTx = casos.length ? ((casos.filter(c => c.reinternacao30d).length / casos.length) * 100).toFixed(1) : '0';
  const tpbUrgencia = (() => {
    const urg = casos.filter(c => c.carater === 'Urgência');
    return urg.length ? (urg.reduce((s,c) => s + calcTempoPortaBisturi(c.dataAdmissao, c.dataCirurgia), 0) / urg.length).toFixed(1) : '0';
  })();
  const tpbEletivo = (() => {
    const el = casos.filter(c => c.carater === 'Eletivo');
    return el.length ? (el.reduce((s,c) => s + calcTempoPortaBisturi(c.dataAdmissao, c.dataCirurgia), 0) / el.length).toFixed(1) : '0';
  })();
  const tiHosp = ['barra','botafogo','sao-lucas'].map(h => {
    const cs = casos.filter(c => c.hospitalId === h);
    return { name: getHospitalNome(h), valor: cs.length ? +(cs.reduce((s,c) => s + calcTempoInternacao(c.dataAdmissao, c.dataAlta), 0) / cs.length).toFixed(1) : 0 };
  });
  const asaDist = ['I','II','III','IV','V'].map(a => ({ name: `ASA ${a}`, value: casos.filter(c => c.classificacaoASA === a).length }));

  // ---- Governança ----
  const taxaGlosa = (() => {
    const cobrado = casos.reduce((s,c) => s + c.valorCobrado, 0);
    const glosado = casos.reduce((s,c) => s + c.valorGlosado, 0);
    return cobrado ? ((glosado / cobrado) * 100).toFixed(1) : '0';
  })();
  const semANVISA = casos.filter(c => !c.codigoANVISA);
  const medianaOPME = (() => {
    const sorted = [...casos].sort((a,b) => a.valorOPME - b.valorOPME);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid].valorOPME : (sorted[mid-1].valorOPME + sorted[mid].valorOPME) / 2;
  })();
  const opmeAtipico = casos.filter(c => c.valorOPME > 2 * medianaOPME);
  const medianaHon = (() => {
    const sorted = [...casos].map(c => c.honorarioEquipe + c.honorarioAnestesia).sort((a,b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
  })();
  const honAtipico = casos.filter(c => (c.honorarioEquipe + c.honorarioAnestesia) > 2 * medianaHon);
  const tpbExcedido = casos.filter(c => c.carater === 'Urgência' && calcTempoPortaBisturi(c.dataAdmissao, c.dataCirurgia) > 6);

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Relatórios de Indicadores</h1>
      <Tabs defaultValue="volume">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="custo">Custo</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Cirurgias por Mês</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="mes" stroke="hsl(215,20%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="total" stroke="hsl(174,72%,46%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Por Tipo de Procedimento</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value}) => `${name}: ${value}`}>
                      {byTipo.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Por Hospital</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byHosp}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={10} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(174,72%,46%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Urgência vs. Eletivo</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCarater}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custo" className="space-y-4 mt-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Custo médio total por caso</p><p className="text-3xl font-bold text-primary">{fmt(custoMedioTotal)}</p></CardContent></Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Custo Médio por Componente</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={custoComp}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="valor" fill="hsl(174,72%,46%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Rede Própria vs. Externa</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={custoRede}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={12} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="valor" radius={[4,4,0,0]}>
                      <Cell fill="hsl(174,72%,46%)" />
                      <Cell fill="hsl(38,92%,50%)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Ranking Cirurgiões por Custo Médio</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm table-zebra">
                <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-3">Cirurgião</th><th className="text-right p-3">Custo Médio</th></tr></thead>
                <tbody>{rankCir.map(r => <tr key={r.nome} className="border-b border-border/50"><td className="p-3">{r.nome}</td><td className="text-right p-3">{fmt(r.medio)}</td></tr>)}</tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Fornecedores OPME</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm table-zebra">
                <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-3">Fornecedor</th><th className="text-right p-3">Valor Total</th></tr></thead>
                <tbody>{topOPME.map(f => <tr key={f.nome} className="border-b border-border/50"><td className="p-3">{f.nome}</td><td className="text-right p-3">{fmt(f.total)}</td></tr>)}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualidade" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Mortalidade 30d</p><p className="text-2xl font-bold">{mort30}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Taxa Complicações</p><p className="text-2xl font-bold">{compTx}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Reinternação 30d</p><p className="text-2xl font-bold">{reintTx}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Porta-Bisturi Médio</p><p className="text-2xl font-bold">Urg: {tpbUrgencia}h / El: {tpbEletivo}h</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Tempo Internação por Hospital</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tiHosp}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                    <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={10} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} dias`} />
                    <Bar dataKey="valor" fill="hsl(174,72%,46%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Distribuição ASA</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={asaDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value}) => `${name}: ${value}`}>
                      {asaDist.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="governanca" className="space-y-4 mt-4">
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Taxa de Glosa</p><p className="text-2xl font-bold">{taxaGlosa}%</p></CardContent></Card>

          {semANVISA.length > 0 && (
            <Card className="border-warning/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Casos sem Código ANVISA ({semANVISA.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {semANVISA.map(c => <Badge key={c.id} variant="outline" className="text-warning border-warning">{c.idPaciente} — {getHospitalNome(c.hospitalId)}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {opmeAtipico.length > 0 && (
            <Card className="border-[hsl(25,95%,53%)]/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[hsl(25,95%,53%)]" />OPME Acima de 2× Mediana ({opmeAtipico.length}) — Mediana: {fmt(medianaOPME)}</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-2">Paciente</th><th className="text-left p-2">Hospital</th><th className="text-right p-2">OPME</th></tr></thead>
                  <tbody>{opmeAtipico.map(c => <tr key={c.id} className="border-b border-border/50"><td className="p-2">{c.idPaciente}</td><td className="p-2">{getHospitalNome(c.hospitalId)}</td><td className="text-right p-2"><Badge className="alert-orange">{fmt(c.valorOPME)}</Badge></td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {honAtipico.length > 0 && (
            <Card className="border-[hsl(25,95%,53%)]/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[hsl(25,95%,53%)]" />Honorários Acima de 2× Mediana ({honAtipico.length})</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-2">Paciente</th><th className="text-right p-2">Total Honorários</th></tr></thead>
                  <tbody>{honAtipico.map(c => <tr key={c.id} className="border-b border-border/50"><td className="p-2">{c.idPaciente}</td><td className="text-right p-2"><Badge className="alert-orange">{fmt(c.honorarioEquipe + c.honorarioAnestesia)}</Badge></td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {tpbExcedido.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Urgência com Porta-Bisturi &gt; 6h ({tpbExcedido.length})</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-2">Paciente</th><th className="text-left p-2">Hospital</th><th className="text-right p-2">Tempo</th></tr></thead>
                  <tbody>{tpbExcedido.map(c => <tr key={c.id} className="border-b border-border/50"><td className="p-2">{c.idPaciente}</td><td className="p-2">{getHospitalNome(c.hospitalId)}</td><td className="text-right p-2"><Badge className="alert-red">{calcTempoPortaBisturi(c.dataAdmissao, c.dataCirurgia)}h</Badge></td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
