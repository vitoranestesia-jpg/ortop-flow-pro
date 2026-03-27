import { useState, useMemo } from 'react';
import { useCasos } from '@/contexts/CasosContext';
import { calcCustoTotal, calcTempoInternacao } from '@/types';
import { getHospitalNome } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Cases() {
  const { casos, deleteCaso } = useCasos();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [caraterFilter, setCaraterFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filtered = useMemo(() => {
    return casos.filter(c => {
      if (hospitalFilter !== 'todos' && c.hospitalId !== hospitalFilter) return false;
      if (tipoFilter !== 'todos' && c.tipoProcedimento !== tipoFilter) return false;
      if (caraterFilter !== 'todos' && c.carater !== caraterFilter) return false;
      if (statusFilter !== 'todos' && c.statusAlta !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.idPaciente.toLowerCase().includes(s) && !c.cirurgiao.crm.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [casos, hospitalFilter, tipoFilter, caraterFilter, statusFilter, search]);

  const handleExportCSV = () => {
    const headers = ['ID Paciente', 'Hospital', 'Tipo Proc.', 'Data Cirurgia', 'Caráter', 'Custo Total', 'Tempo Int.', 'Status'];
    const rows = filtered.map(c => [
      c.idPaciente, getHospitalNome(c.hospitalId), c.tipoProcedimento,
      new Date(c.dataCirurgia).toLocaleDateString('pt-BR'), c.carater,
      calcCustoTotal(c).toFixed(2), calcTempoInternacao(c.dataAdmissao, c.dataAlta),
      c.statusAlta,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'casos_ortopgest.csv'; a.click();
    toast({ title: 'Arquivo gerado com sucesso', description: `${filtered.length} casos exportados.` });
  };

  const handleDelete = (id: string) => {
    deleteCaso(id);
    toast({ title: 'Caso excluído', description: 'O caso foi removido com sucesso.' });
  };

  const statusBadge = (s: string) => {
    if (s === 'Alta hospitalar') return <Badge className="badge-alta text-xs">Alta</Badge>;
    if (s === 'Óbito hospitalar') return <Badge className="badge-obito text-xs">Óbito</Badge>;
    return <Badge className="badge-transferencia text-xs">Transferência</Badge>;
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Lista de Casos</h1>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar ID Paciente ou CRM..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Hospital" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="barra">Barra da Tijuca</SelectItem>
                <SelectItem value="botafogo">Botafogo</SelectItem>
                <SelectItem value="sao-lucas">São Lucas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Tipo: Todos</SelectItem>
                <SelectItem value="Osteossíntese">Osteossíntese</SelectItem>
                <SelectItem value="Artroplastia">Artroplastia</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={caraterFilter} onValueChange={setCaraterFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Caráter: Todos</SelectItem>
                <SelectItem value="Urgência">Urgência</SelectItem>
                <SelectItem value="Eletivo">Eletivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Status: Todos</SelectItem>
                <SelectItem value="Alta hospitalar">Alta</SelectItem>
                <SelectItem value="Óbito hospitalar">Óbito</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Nenhum caso encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-zebra">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3">ID Paciente</th>
                    <th className="text-left p-3">Hospital</th>
                    <th className="text-left p-3">Tipo Proc.</th>
                    <th className="text-left p-3">Data Cirurgia</th>
                    <th className="text-left p-3">Caráter</th>
                    <th className="text-left p-3">Equipe Cirúrgica</th>
                    <th className="text-right p-3">Custo Total</th>
                    <th className="text-right p-3">Tempo Int.</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-center p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="p-3 font-mono text-xs">{c.idPaciente}</td>
                      <td className="p-3">{getHospitalNome(c.hospitalId)}</td>
                      <td className="p-3">{c.tipoProcedimento}</td>
                      <td className="p-3">{new Date(c.dataCirurgia).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">{c.carater}</td>
                      <td className="p-3">{c.cirurgiao.nome}</td>
                      <td className="text-right p-3 font-mono">{fmt(calcCustoTotal(c))}</td>
                      <td className="text-right p-3">{calcTempoInternacao(c.dataAdmissao, c.dataAlta)}d</td>
                      <td className="text-center p-3">{statusBadge(c.statusAlta)}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/caso/${c.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/editar-caso/${c.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita. O caso será removido permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(c.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
