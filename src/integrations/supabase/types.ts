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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          accao: string
          actor_id: string | null
          criado_em: string
          detalhe: Json
          entidade: string | null
          id: string
          project_id: string
        }
        Insert: {
          accao: string
          actor_id?: string | null
          criado_em?: string
          detalhe?: Json
          entidade?: string | null
          id?: string
          project_id: string
        }
        Update: {
          accao?: string
          actor_id?: string | null
          criado_em?: string
          detalhe?: Json
          entidade?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string
          email: string | null
          id: string
          is_admin: boolean
          nome: string | null
          plano: string
          plano_expira_em: string | null
          plano_notas: string
          updated_at: string
        }
        Insert: {
          criado_em?: string
          email?: string | null
          id: string
          is_admin?: boolean
          nome?: string | null
          plano?: string
          plano_expira_em?: string | null
          plano_notas?: string
          updated_at?: string
        }
        Update: {
          criado_em?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          nome?: string | null
          plano?: string
          plano_expira_em?: string | null
          plano_notas?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          convidado_por: string
          criado_em: string
          email: string
          estado: string
          expira_em: string
          id: string
          papel: string
          project_id: string
          token: string
        }
        Insert: {
          convidado_por: string
          criado_em?: string
          email: string
          estado?: string
          expira_em?: string
          id?: string
          papel?: string
          project_id: string
          token?: string
        }
        Update: {
          convidado_por?: string
          criado_em?: string
          email?: string
          estado?: string
          expira_em?: string
          id?: string
          papel?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          convidado_por: string | null
          criado_em: string
          id: string
          papel: string
          project_id: string
          user_id: string
        }
        Insert: {
          convidado_por?: string | null
          criado_em?: string
          id?: string
          papel?: string
          project_id: string
          user_id: string
        }
        Update: {
          convidado_por?: string | null
          criado_em?: string
          id?: string
          papel?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          arquivado: boolean
          criado_em: string
          descricao: string
          gastos_legado: number
          icon: string
          id: string
          legacy_id: string | null
          meta: number
          nome: string
          notas: string
          owner_id: string
          proximo_recebimento: string | null
          receita_legado: number
          tipo: string
          updated_at: string
        }
        Insert: {
          arquivado?: boolean
          criado_em?: string
          descricao?: string
          gastos_legado?: number
          icon?: string
          id?: string
          legacy_id?: string | null
          meta?: number
          nome: string
          notas?: string
          owner_id: string
          proximo_recebimento?: string | null
          receita_legado?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          arquivado?: boolean
          criado_em?: string
          descricao?: string
          gastos_legado?: number
          icon?: string
          id?: string
          legacy_id?: string | null
          meta?: number
          nome?: string
          notas?: string
          owner_id?: string
          proximo_recebimento?: string | null
          receita_legado?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          criado_em: string
          custo_unitario: number
          id: string
          legacy_id: string | null
          nome: string
          preco_venda: number
          project_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          criado_em?: string
          custo_unitario?: number
          id?: string
          legacy_id?: string | null
          nome?: string
          preco_venda?: number
          project_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          criado_em?: string
          custo_unitario?: number
          id?: string
          legacy_id?: string | null
          nome?: string
          preco_venda?: number
          project_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cliente: string
          criado_em: string
          criado_por: string | null
          custo: number
          data: string
          descricao: string
          id: string
          legacy_id: string | null
          origem: string
          project_id: string
          qty: number
          tipo: string
          valor: number
        }
        Insert: {
          cliente?: string
          criado_em?: string
          criado_por?: string | null
          custo?: number
          data?: string
          descricao?: string
          id?: string
          legacy_id?: string | null
          origem?: string
          project_id: string
          qty?: number
          tipo: string
          valor?: number
        }
        Update: {
          cliente?: string
          criado_em?: string
          criado_por?: string | null
          custo?: number
          data?: string
          descricao?: string
          id?: string
          legacy_id?: string | null
          origem?: string
          project_id?: string
          qty?: number
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          data_key: string
          data_value: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data_key: string
          data_value?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data_key?: string
          data_value?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      definir_plano: {
        Args: {
          p_expira?: string
          p_notas?: string
          p_plano: string
          p_user: string
        }
        Returns: undefined
      }
      e_dono_do_projecto: { Args: { p_project: string }; Returns: boolean }
      limite_colaboradores: { Args: { p_plano: string }; Returns: number }
      limite_projectos: { Args: { p_plano: string }; Returns: number }
      migrar_negocios_de_user_data: {
        Args: { p_user: string }
        Returns: number
      }
      plano_efectivo: { Args: { p_user: string }; Returns: string }
      pode_editar_projecto: { Args: { p_project: string }; Returns: boolean }
      pode_ver_projecto: { Args: { p_project: string }; Returns: boolean }
      safe_date: { Args: { t: string }; Returns: string }
      safe_numeric: { Args: { t: string }; Returns: number }
      safe_timestamptz: { Args: { t: string }; Returns: string }
      sincronizar_negocios_de_user_data: {
        Args: { p_user: string }
        Returns: {
          projectos_novos: number
          stock_novo: number
          transacoes_novas: number
        }[]
      }
      sou_admin: { Args: never; Returns: boolean }
      vender_stock: { Args: { p_item: string; p_qty: number }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
