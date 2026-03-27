import { createContext, useContext, useState, ReactNode } from 'react';
import { CasoCirurgico } from '@/types';
import { mockCasos } from '@/data/mockData';

interface CasosContextType {
  casos: CasoCirurgico[];
  addCaso: (caso: CasoCirurgico) => void;
  updateCaso: (caso: CasoCirurgico) => void;
  deleteCaso: (id: string) => void;
}

const CasosContext = createContext<CasosContextType | null>(null);

export function CasosProvider({ children }: { children: ReactNode }) {
  const [casos, setCasos] = useState<CasoCirurgico[]>(mockCasos);

  const addCaso = (caso: CasoCirurgico) => setCasos(prev => [...prev, caso]);
  const updateCaso = (caso: CasoCirurgico) => setCasos(prev => prev.map(c => c.id === caso.id ? caso : c));
  const deleteCaso = (id: string) => setCasos(prev => prev.filter(c => c.id !== id));

  return (
    <CasosContext.Provider value={{ casos, addCaso, updateCaso, deleteCaso }}>
      {children}
    </CasosContext.Provider>
  );
}

export function useCasos() {
  const ctx = useContext(CasosContext);
  if (!ctx) throw new Error('useCasos must be used within CasosProvider');
  return ctx;
}
