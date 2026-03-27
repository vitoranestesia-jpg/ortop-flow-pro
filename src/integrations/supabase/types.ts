export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      casos_cirurgicos: {
        Row: {
          anestesista_crm: string | null
          anestesista_nome: string | null
          carater: string
          carteirinha: string
          cid_principal: string
          cirurgiao_crm: string
          cirurgiao_nome: string
          classificacao_asa: string
          codigo_anvisa: string
          codigo_tuss: string
          complicacoes: string
          created_at: string
          custo_exames: number
          data_admissao: string
          data_alta: string
          data_cirurgia: string
          data_nascimento: string
          data_obito: string | null
          data_reinternacao: string | null
          descricao_implante: string
          dias_enfermaria: number
          dias_uti: number
          fornecedor_opme: string
          honorario_anestesia: number
          honorario_equipe: number
          hospital_id: string
          id: string
          id_paciente: string
          motivo_reinternacao: string | null
          reinternacao_30d: boolean
          sexo: string
          status_alta: string
          tipo_procedimento: string
          tipo_rede: string
          valor_cobrado: number
          valor_diaria_enfermaria: number
          valor_diaria_uti: number
          valor_glosado: number
          valor_opme: number
        }
        Insert: {
          anestesista_crm?: string | null
          anestesista_nome?: string | null
          carater: string
          carteirinha: string
          cid_principal: string
          cirurgiao_crm: string
          cirurgiao_nome: string
          classificacao_asa: string
          codigo_anvisa?: string
          codigo_tuss: string
          complicacoes?: string
          created_at?: string
          custo_exames?: number
          data_admissao: string
          data_alta: string
          data_cirurgia: string
          data_nascimento: string
          data_obito?: string | null
          data_reinternacao?: string | null
          descricao_implante?: string
          dias_enfermaria?: number
          dias_uti?: number
          fornecedor_opme?: string
          honorario_anestesia?: number
          honorario_equipe?: number
          hospital_id: string
          id?: string
          id_paciente: string
          motivo_reinternacao?: string | null
          reinternacao_30d?: boolean
          sexo: string
          status_alta: string
          tipo_procedimento: string
          tipo_rede: string
          valor_cobrado?: number
          valor_diaria_enfermaria?: number
          valor_diaria_uti?: number
          valor_glosado?: number
          valor_opme?: number
        }
        Update: {
          anestesista_crm?: string | null
          anestesista_nome?: string | null
          carater?: string
          carteirinha?: string
          cid_principal?: string
          cirurgiao_crm?: string
          cirurgiao_nome?: string
          classificacao_asa?: string
          codigo_anvisa?: string
          codigo_tuss?: string
          complicacoes?: string
          created_at?: string
          custo_exames?: number
          data_admissao?: string
          data_alta?: string
          data_cirurgia?: string
          data_nascimento?: string
          data_obito?: string | null
          data_reinternacao?: string | null
          descricao_implante?: string
          dias_enfermaria?: number
          dias_uti?: number
          fornecedor_opme?: string
          honorario_anestesia?: number
          honorario_equipe?: number
          hospital_id?: string
          id?: string
          id_paciente?: string
          motivo_reinternacao?: string | null
          reinternacao_30d?: boolean
          sexo?: string
          status_alta?: string
          tipo_procedimento?: string
          tipo_rede?: string
          valor_cobrado?: number
          valor_diaria_enfermaria?: number
          valor_diaria_uti?: number
          valor_glosado?: number
          valor_opme?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
