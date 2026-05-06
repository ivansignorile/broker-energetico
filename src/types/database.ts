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
      clienti: {
        Row: {
          commerciale_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          indirizzo: string | null
          lat: number | null
          lng: number | null
          nome: string
          note: string | null
          telefono: string | null
          tipo_cliente: Database["public"]["Enums"]["tipo_cliente"]
          updated_at: string
        }
        Insert: {
          commerciale_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          lat?: number | null
          lng?: number | null
          nome: string
          note?: string | null
          telefono?: string | null
          tipo_cliente: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string
        }
        Update: {
          commerciale_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          lat?: number | null
          lng?: number | null
          nome?: string
          note?: string | null
          telefono?: string | null
          tipo_cliente?: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clienti_commerciale_id_fkey"
            columns: ["commerciale_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clienti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contratti: {
        Row: {
          allegato_path: string | null
          categoria: Database["public"]["Enums"]["categoria_contratto"]
          cliente_id: string
          created_at: string
          created_by: string | null
          data_inizio: string
          data_scadenza: string
          fornitore_id: string
          id: string
          mercato: Database["public"]["Enums"]["mercato"] | null
          note: string | null
          pdr: string | null
          pod: string | null
          replaced_by_id: string | null
          stato: Database["public"]["Enums"]["stato_contratto"]
          tipo: Database["public"]["Enums"]["tipo_contratto"]
          updated_at: string
        }
        Insert: {
          allegato_path?: string | null
          categoria: Database["public"]["Enums"]["categoria_contratto"]
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_inizio: string
          data_scadenza: string
          fornitore_id: string
          id?: string
          mercato?: Database["public"]["Enums"]["mercato"] | null
          note?: string | null
          pdr?: string | null
          pod?: string | null
          replaced_by_id?: string | null
          stato?: Database["public"]["Enums"]["stato_contratto"]
          tipo: Database["public"]["Enums"]["tipo_contratto"]
          updated_at?: string
        }
        Update: {
          allegato_path?: string | null
          categoria?: Database["public"]["Enums"]["categoria_contratto"]
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_inizio?: string
          data_scadenza?: string
          fornitore_id?: string
          id?: string
          mercato?: Database["public"]["Enums"]["mercato"] | null
          note?: string | null
          pdr?: string | null
          pod?: string | null
          replaced_by_id?: string | null
          stato?: Database["public"]["Enums"]["stato_contratto"]
          tipo?: Database["public"]["Enums"]["tipo_contratto"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_fornitore_id_fkey"
            columns: ["fornitore_id"]
            isOneToOne: false
            referencedRelation: "fornitori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "contratti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "v_contratti"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          id: string
          job_name: string
          ok: boolean
          run_at: string
          summary: Json | null
        }
        Insert: {
          id?: string
          job_name: string
          ok: boolean
          run_at?: string
          summary?: Json | null
        }
        Update: {
          id?: string
          job_name?: string
          ok?: boolean
          run_at?: string
          summary?: Json | null
        }
        Relationships: []
      }
      documenti: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          data_scadenza: string | null
          descrizione: string | null
          file_path: string
          id: string
          note: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_scadenza?: string | null
          descrizione?: string | null
          file_path: string
          id?: string
          note?: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_scadenza?: string | null
          descrizione?: string | null
          file_path?: string
          id?: string
          note?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documenti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fornitori: {
        Row: {
          attivo: boolean
          contatti: Json | null
          created_at: string
          id: string
          nome: string
          note: string | null
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          contatti?: Json | null
          created_at?: string
          id?: string
          nome: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          contatti?: Json | null
          created_at?: string
          id?: string
          nome?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifiche_log: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          recipient_email: string
          sent_at: string
          soglia: number
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          recipient_email: string
          sent_at?: string
          soglia: number
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          recipient_email?: string
          sent_at?: string
          soglia?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          attivo: boolean
          created_at: string
          email: string
          id: string
          nome_completo: string
          ruolo: Database["public"]["Enums"]["ruolo"]
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          email: string
          id: string
          nome_completo: string
          ruolo: Database["public"]["Enums"]["ruolo"]
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          ruolo?: Database["public"]["Enums"]["ruolo"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_contratti: {
        Row: {
          allegato_path: string | null
          categoria: Database["public"]["Enums"]["categoria_contratto"] | null
          cliente_id: string | null
          created_at: string | null
          created_by: string | null
          data_inizio: string | null
          data_scadenza: string | null
          fornitore_id: string | null
          giorni_alla_scadenza: number | null
          id: string | null
          is_in_scadenza: boolean | null
          mercato: Database["public"]["Enums"]["mercato"] | null
          note: string | null
          pdr: string | null
          pod: string | null
          replaced_by_id: string | null
          stato: Database["public"]["Enums"]["stato_contratto"] | null
          tipo: Database["public"]["Enums"]["tipo_contratto"] | null
          updated_at: string | null
        }
        Insert: {
          allegato_path?: string | null
          categoria?: Database["public"]["Enums"]["categoria_contratto"] | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_inizio?: string | null
          data_scadenza?: string | null
          fornitore_id?: string | null
          giorni_alla_scadenza?: never
          id?: string | null
          is_in_scadenza?: never
          mercato?: Database["public"]["Enums"]["mercato"] | null
          note?: string | null
          pdr?: string | null
          pod?: string | null
          replaced_by_id?: string | null
          stato?: Database["public"]["Enums"]["stato_contratto"] | null
          tipo?: Database["public"]["Enums"]["tipo_contratto"] | null
          updated_at?: string | null
        }
        Update: {
          allegato_path?: string | null
          categoria?: Database["public"]["Enums"]["categoria_contratto"] | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_inizio?: string | null
          data_scadenza?: string | null
          fornitore_id?: string | null
          giorni_alla_scadenza?: never
          id?: string | null
          is_in_scadenza?: never
          mercato?: Database["public"]["Enums"]["mercato"] | null
          note?: string | null
          pdr?: string | null
          pod?: string | null
          replaced_by_id?: string | null
          stato?: Database["public"]["Enums"]["stato_contratto"] | null
          tipo?: Database["public"]["Enums"]["tipo_contratto"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_fornitore_id_fkey"
            columns: ["fornitore_id"]
            isOneToOne: false
            referencedRelation: "fornitori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "contratti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "v_contratti"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cliente_visibile: {
        Args: { target_cliente_id: string }
        Returns: boolean
      }
      current_ruolo: {
        Args: never
        Returns: Database["public"]["Enums"]["ruolo"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      categoria_contratto:
        | "energia"
        | "rinnovabili"
        | "riscaldamento"
        | "utility"
        | "servizi"
      mercato: "libero" | "tutelato"
      ruolo: "admin" | "commerciale" | "operatore"
      stato_contratto:
        | "bozza"
        | "attivo"
        | "scaduto"
        | "rinnovato"
        | "annullato"
      tipo_cliente: "privato" | "azienda"
      tipo_contratto:
        | "luce"
        | "gas"
        | "dual_fuel"
        | "fotovoltaico"
        | "accumulo"
        | "comunita_energetica"
        | "ricarica_ev"
        | "teleriscaldamento"
        | "gpl"
        | "pellet"
        | "idrico"
        | "internet_fibra"
        | "telefonia"
        | "efficienza_energetica"
        | "diagnosi_energetica"
        | "manutenzione"
        | "assicurativo"
      tipo_documento:
        | "carta_identita"
        | "passaporto"
        | "patente"
        | "permesso_soggiorno"
        | "codice_fiscale"
        | "tessera_sanitaria"
        | "partita_iva"
        | "visura_camerale"
        | "certificato_attribuzione_piva"
        | "bolletta_recente"
        | "delega_voltura"
        | "mandato_consulenza"
        | "privacy_gdpr"
        | "iban"
        | "rid_sepa"
        | "altro"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      categoria_contratto: [
        "energia",
        "rinnovabili",
        "riscaldamento",
        "utility",
        "servizi",
      ],
      mercato: ["libero", "tutelato"],
      ruolo: ["admin", "commerciale", "operatore"],
      stato_contratto: ["bozza", "attivo", "scaduto", "rinnovato", "annullato"],
      tipo_cliente: ["privato", "azienda"],
      tipo_contratto: [
        "luce",
        "gas",
        "dual_fuel",
        "fotovoltaico",
        "accumulo",
        "comunita_energetica",
        "ricarica_ev",
        "teleriscaldamento",
        "gpl",
        "pellet",
        "idrico",
        "internet_fibra",
        "telefonia",
        "efficienza_energetica",
        "diagnosi_energetica",
        "manutenzione",
        "assicurativo",
      ],
      tipo_documento: [
        "carta_identita",
        "passaporto",
        "patente",
        "permesso_soggiorno",
        "codice_fiscale",
        "tessera_sanitaria",
        "partita_iva",
        "visura_camerale",
        "certificato_attribuzione_piva",
        "bolletta_recente",
        "delega_voltura",
        "mandato_consulenza",
        "privacy_gdpr",
        "iban",
        "rid_sepa",
        "altro",
      ],
    },
  },
} as const
