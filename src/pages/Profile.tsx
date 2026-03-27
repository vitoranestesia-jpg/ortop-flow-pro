import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Administrador</p>
              <p className="text-sm text-muted-foreground">admin@medsenior.com.br</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Papel</p>
              <Badge className="mt-1"><Shield className="h-3 w-3 mr-1" />Gestor / Admin</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unidade</p>
              <p className="text-sm font-medium">MedSenior Rio de Janeiro</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Acesso</p>
              <p className="text-sm font-medium">Todos os módulos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último acesso</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
