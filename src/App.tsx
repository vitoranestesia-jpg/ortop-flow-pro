import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { CasosProvider } from "@/contexts/CasosContext";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import NewCase from "./pages/NewCase";
import CaseDetail from "./pages/CaseDetail";
import Reports from "./pages/Reports";
import Prediction from "./pages/Prediction";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <CasosProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/casos" element={<Cases />} />
              <Route path="/novo-caso" element={<NewCase />} />
              <Route path="/editar-caso/:id" element={<NewCase />} />
              <Route path="/caso/:id" element={<CaseDetail />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/predicao" element={<Prediction />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CasosProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
