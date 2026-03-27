import {
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  BarChart3,
  Download,
  FileUp,
  TrendingUp,
  User,
  LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Casos', url: '/casos', icon: ClipboardList },
  { title: 'Novo Caso', url: '/novo-caso', icon: FilePlus },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Exportar Dados', url: '/exportar', icon: Download },
  { title: 'Importar Dados', url: '/importar', icon: FileUp },
  { title: 'Predição', url: '/predicao', icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary tracking-tight">OrtopGest</h1>
          )}
          {collapsed && (
            <span className="text-primary font-bold text-lg">OG</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfil"
                className="hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <User className="mr-2 h-4 w-4 shrink-0" />
                {!collapsed && <span>Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
