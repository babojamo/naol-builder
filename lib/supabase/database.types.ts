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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      builds: {
        Row: {
          build_data: Json
          created_at: string
          id: string
          name: string
          revision: number
          schema_version: number
          slug: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          build_data: Json
          created_at?: string
          id?: string
          name: string
          revision?: number
          schema_version?: number
          slug?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          build_data?: Json
          created_at?: string
          id?: string
          name?: string
          revision?: number
          schema_version?: number
          slug?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flyff_entities: {
        Row: {
          api_version: number
          category: string | null
          class_id: number | null
          element: string | null
          entity_id: string
          generation_id: string
          is_active: boolean
          level: number | null
          name: string | null
          normalized_payload: Json
          rank: string | null
          raw_payload: Json
          resource: string
          subcategory: string | null
          synced_at: string
          two_handed: boolean | null
        }
        Insert: {
          api_version: number
          category?: string | null
          class_id?: number | null
          element?: string | null
          entity_id: string
          generation_id: string
          is_active?: boolean
          level?: number | null
          name?: string | null
          normalized_payload: Json
          rank?: string | null
          raw_payload: Json
          resource: string
          subcategory?: string | null
          synced_at?: string
          two_handed?: boolean | null
        }
        Update: {
          api_version?: number
          category?: string | null
          class_id?: number | null
          element?: string | null
          entity_id?: string
          generation_id?: string
          is_active?: boolean
          level?: number | null
          name?: string | null
          normalized_payload?: Json
          rank?: string | null
          raw_payload?: Json
          resource?: string
          subcategory?: string | null
          synced_at?: string
          two_handed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "flyff_entities_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "flyff_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      flyff_generations: {
        Row: {
          api_version: number
          completed_at: string | null
          created_at: string
          cursor: Json
          expected_counts: Json
          id: string
          status: string
        }
        Insert: {
          api_version: number
          completed_at?: string | null
          created_at?: string
          cursor?: Json
          expected_counts?: Json
          id?: string
          status?: string
        }
        Update: {
          api_version?: number
          completed_at?: string | null
          created_at?: string
          cursor?: Json
          expected_counts?: Json
          id?: string
          status?: string
        }
        Relationships: []
      }
      flyff_sync_state: {
        Row: {
          active_generation: string | null
          cached_version: number | null
          checked_version: number | null
          error: string | null
          id: number
          last_api_check: string | null
          last_successful_sync: string | null
          lease_until: string | null
          record_counts: Json
          status: string
        }
        Insert: {
          active_generation?: string | null
          cached_version?: number | null
          checked_version?: number | null
          error?: string | null
          id: number
          last_api_check?: string | null
          last_successful_sync?: string | null
          lease_until?: string | null
          record_counts?: Json
          status?: string
        }
        Update: {
          active_generation?: string | null
          cached_version?: number | null
          checked_version?: number | null
          error?: string | null
          id?: number
          last_api_check?: string | null
          last_successful_sync?: string | null
          lease_until?: string | null
          record_counts?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flyff_sync_state_active_generation_fkey"
            columns: ["active_generation"]
            isOneToOne: false
            referencedRelation: "flyff_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email_verified_at: string | null
          id: string
          name: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email_verified_at?: string | null
          id: string
          name: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email_verified_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferences?: Json
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
      activate_flyff_generation: {
        Args: { p_generation: string }
        Returns: undefined
      }
      claim_flyff_sync: { Args: never; Returns: boolean }
      consume_verification: { Args: { p_hash: string }; Returns: boolean }
      get_shared_build: {
        Args: { p_key: string }
        Returns: {
          build_data: Json
          id: string
          name: string
          slug: string
          updated_at: string
        }[]
      }
      issue_verification: {
        Args: { p_email: string; p_hash: string; p_user: string }
        Returns: undefined
      }
      save_build: {
        Args: {
          p_build: Json
          p_expected_revision: number
          p_visibility?: string
        }
        Returns: {
          build_data: Json
          created_at: string
          id: string
          name: string
          revision: number
          schema_version: number
          slug: string
          updated_at: string
          user_id: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "builds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      username_available: { Args: { p_username: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
