import { useMemo, useState } from 'react';
import { useCasos } from '@/contexts/CasosContext';
import { calcCustoTotal, calcTempoInternacao, calcTempoPortaBisturi } from '@/types';
import { hospitais, getHospitalNome } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, DollarSign, Heart, Clock } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function Dashboard() {
  const { casos } = useCasos();
  const [hospitalFilter, setHospitalFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');

  const filtered = useMemo(() => {
    return casos.filter(c => {
      if (hospitalFilter !== 'todos' && c.hospitalId !== hospitalFilter) return false;
      if (tipoFilter !== 'todos' && c.tipoProcedimento !== tipoFilter) return false;
      return true;
    });
  }, [casos, hospitalFilter, tipoFilter]);

  const totalCasos = filtered.length;
  const custoMedio = totalCasos ? filtered.reduce((s, c) => s + calcCustoTotal(c), 0) / totalCasos : 0;
  const obitos30d = filtered.filter(c => c.statusAlta === 'Óbito hospitalar').length;
  const mortalidade = totalCasos ? (obitos30d / totalCasos) * 100 : 0;
  const tempoMedioInt = totalCasos
    ? filtered.reduce((s, c) => s + calcTempoInternacao(c.dataAdmissao, c.dataAlta), 0) / totalCasos
    : 0;

  // Volume por mês
  const volumePorMes = useMemo(() => {
    return meses.map((mes, i) => {
      const propria = filtered.filter(c => {
        const m = new Date(c.dataCirurgia).getMonth();
        return m === i && c.tipoRede === 'Própria';
      }).length;
      const externa = filtered.filter(c => {
        const m = new Date(c.dataCirurgia).getMonth();
        return m === i && c.tipoRede === 'Externa';
      }).length;
      return { mes, 'Rede Própria': propria, 'Rede Externa': externa };
    });
  }, [filtered]);

  // Custo por componente
  const custoPorComponente = useMemo(() => {
    if (!filtered.length) return [];
    const totais = filtered.reduce(
      (acc, c) => ({
        OPME: acc.OPME + c.valorOPME,
        Honorários: acc.Honorários + c.honorarioEquipe + c.honorarioAnestesia,
        Diárias: acc.Diárias + c.diasUTI * c.valorDiariaUTI + c.diasEnfermaria * c.valorDiariaEnfermaria,
        Exames: acc.Exames + c.custoExames,
      }),
      { OPME: 0, Honorários: 0, Diárias: 0, Exames: 0 }
    );
    return Object.entries(totais).map(([name, value]) => ({
      name,
      valor: Math.round(value / filtered.length),
    }));
  }, [filtered]);

  // Comparativo rede
  const comparativo = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(c => {
      const key = c.hospitalId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return Object.entries(groups).map(([hId, cases]) => {
      const n = cases.length;
      return {
        hospital: getHospitalNome(hId),
        casos: n,
        custoMedio: Math.round(cases.reduce((s, c) => s + calcCustoTotal(c), 0) / n),
        mortalidade: ((cases.filter(c => c.statusAlta === 'Óbito hospitalar').length / n) * 100).toFixed(1),
        tempoInt: (cases.reduce((s, c) => s + calcTempoInternacao(c.dataAdmissao, c.dataAlta), 0) / n).toFixed(1),
        reinternacao: ((cases.filter(c => c.reinternacao30d).length / n) * 100).toFixed(1),
      };
    });
  }, [filtered]);

  // Top fornecedores
  const topFornecedores = useMemo(() => {
    const groups: Record<string, { qtd: number; total: number }> = {};
    filtered.forEach(c => {
      if (!groups[c.fornecedorOPME]) groups[c.fornecedorOPME] = { qtd: 0, total: 0 };
      groups[c.fornecedorOPME].qtd++;
      groups[c.fornecedorOPME].total += c.valorOPME;
    });
    return Object.entries(groups)
      .map(([nome, d]) => ({ nome, ...d, medio: Math.round(d.total / d.qtd) }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Hospital" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Hospitais</SelectItem>
              {hospitais.map(h => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Procedimento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Osteossíntese">Osteossíntese</SelectItem>
              <SelectItem value="Artroplastia">Artroplastia</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Activity className="h-5 w-5" />} title="Total de Casos" value={String(totalCasos)} />
        <KpiCard icon={<DollarSign className="h-5 w-5" />} title="Custo Médio/Caso" value={fmt(custoMedio)} />
        <KpiCard icon={<Heart className="h-5 w-5" />} title="Mortalidade 30d" value={`${mortalidade.toFixed(1)}%`} alert={mortalidade > 10} />
        <KpiCard icon={<Clock className="h-5 w-5" />} title="Tempo Médio Internação" value={`${tempoMedioInt.toFixed(1)} dias`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Volume Cirurgias/Mês</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumePorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                <XAxis dataKey="mes" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,47%,9%)', border: '1px solid hsl(222,30%,18%)', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Rede Própria" stroke="hsl(174,72%,46%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Rede Externa" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Custo Médio por Componente</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={custoPorComponente}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,47%,9%)', border: '1px solid hsl(222,30%,18%)', borderRadius: 8 }}
                  formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" fill="hsl(174,72%,46%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Comparativo Rede Própria vs. Externa
            <Badge variant="outline" className="text-primary border-primary">Estratégico</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-zebra">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">Hospital</th>
                  <th className="text-right p-3">Casos</th>
                  <th className="text-right p-3">Custo Médio</th>
                  <th className="text-right p-3">Mortalidade 30d</th>
                  <th className="text-right p-3">Tempo Int.</th>
                  <th className="text-right p-3">Reinternação 30d</th>
                </tr>
              </thead>
              <tbody>
                {comparativo.map(r => (
                  <tr key={r.hospital} className="border-b border-border/50">
                    <td className="p-3 font-medium">{r.hospital}</td>
                    <td className="text-right p-3">{r.casos}</td>
                    <td className="text-right p-3">{fmt(r.custoMedio)}</td>
                    <td className="text-right p-3">{r.mortalidade}%</td>
                    <td className="text-right p-3">{r.tempoInt} dias</td>
                    <td className="text-right p-3">{r.reinternacao}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Fornecedores */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Top Fornecedores OPME</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-zebra">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">Fornecedor</th>
                  <th className="text-right p-3">Qtd Casos</th>
                  <th className="text-right p-3">Valor Total OPME</th>
                  <th className="text-right p-3">Custo Médio/Caso</th>
                </tr>
              </thead>
              <tbody>
                {topFornecedores.map(f => (
                  <tr key={f.nome} className="border-b border-border/50">
                    <td className="p-3 font-medium">{f.nome}</td>
                    <td className="text-right p-3">{f.qtd}</td>
                    <td className="text-right p-3">{fmt(f.total)}</td>
                    <td className="text-right p-3">{fmt(f.medio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, title, value, alert }: { icon: React.ReactNode; title: string; value: string; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${alert ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
