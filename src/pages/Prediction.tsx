import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction } from 'lucide-react';

const variaveis = [
  'Nº total de vidas ativas',
  'Vidas faixa 60-69',
  'Vidas faixa 70-79',
  'Vidas faixa 80+',
  'Incidência fratura fêmur por 1.000 vidas/ano',
  'Custo médio por caso rede própria',
  'Custo médio por caso rede externa',
  '% casos rede própria vs. externa',
  'Custo médio OPME por caso',
  'VCMH (inflação médica)',
  'Taxa de crescimento de vidas',
  'Mortalidade 30d observada',
];

export default function Prediction() {
  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold">Predição de Custos</h1>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-6 flex items-center gap-3">
          <Construction className="h-6 w-6 text-warning shrink-0" />
          <div>
            <p className="font-medium text-warning">Módulo em construção</p>
            <p className="text-sm text-muted-foreground">Esta seção será ativada após a validação do piloto. As variáveis preditivas abaixo representam a estrutura completa do modelo.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Variáveis Preditivas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {variaveis.map(v => (
              <div key={v} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                <span className="text-sm font-medium">{v}</span>
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 text-xs">A preencher após piloto</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
