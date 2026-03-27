
CREATE TABLE public.casos_cirurgicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('M', 'F')),
  carteirinha TEXT NOT NULL,
  classificacao_asa TEXT NOT NULL CHECK (classificacao_asa IN ('I', 'II', 'III', 'IV', 'V')),
  data_admissao TIMESTAMPTZ NOT NULL,
  data_cirurgia TIMESTAMPTZ NOT NULL,
  cid_principal TEXT NOT NULL,
  codigo_tuss TEXT NOT NULL,
  tipo_procedimento TEXT NOT NULL CHECK (tipo_procedimento IN ('Osteossíntese', 'Artroplastia', 'Outro')),
  hospital_id TEXT NOT NULL,
  tipo_rede TEXT NOT NULL CHECK (tipo_rede IN ('Própria', 'Externa')),
  cirurgiao_nome TEXT NOT NULL,
  cirurgiao_crm TEXT NOT NULL,
  anestesista_nome TEXT,
  anestesista_crm TEXT,
  carater TEXT NOT NULL CHECK (carater IN ('Urgência', 'Eletivo')),
  valor_opme NUMERIC NOT NULL DEFAULT 0,
  descricao_implante TEXT NOT NULL DEFAULT '',
  codigo_anvisa TEXT NOT NULL DEFAULT '',
  fornecedor_opme TEXT NOT NULL DEFAULT '',
  dias_uti INTEGER NOT NULL DEFAULT 0,
  dias_enfermaria INTEGER NOT NULL DEFAULT 0,
  valor_diaria_uti NUMERIC NOT NULL DEFAULT 0,
  valor_diaria_enfermaria NUMERIC NOT NULL DEFAULT 0,
  honorario_equipe NUMERIC NOT NULL DEFAULT 0,
  honorario_anestesia NUMERIC NOT NULL DEFAULT 0,
  custo_exames NUMERIC NOT NULL DEFAULT 0,
  valor_cobrado NUMERIC NOT NULL DEFAULT 0,
  valor_glosado NUMERIC NOT NULL DEFAULT 0,
  data_alta DATE NOT NULL,
  status_alta TEXT NOT NULL CHECK (status_alta IN ('Alta hospitalar', 'Transferência', 'Óbito hospitalar')),
  data_obito DATE,
  complicacoes TEXT NOT NULL DEFAULT '',
  reinternacao_30d BOOLEAN NOT NULL DEFAULT false,
  motivo_reinternacao TEXT,
  data_reinternacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.casos_cirurgicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cases"
  ON public.casos_cirurgicos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cases"
  ON public.casos_cirurgicos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
  ON public.casos_cirurgicos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cases"
  ON public.casos_cirurgicos FOR DELETE
  TO authenticated USING (true);
