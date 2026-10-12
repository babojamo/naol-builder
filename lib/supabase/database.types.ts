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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after_data: Json
          before_data: Json
          created_at: string
          id: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          after_data?: Json
          before_data?: Json
          created_at?: string
          id?: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_data?: Json
          before_data?: Json
          created_at?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      ai_build_imports: {
        Row: {
          build_id: string | null
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          image_count: number
          model_used: string | null
          normalized_json: Json | null
          result_json: Json | null
          status: string
          user_id: string
        }
        Insert: {
          build_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_count: number
          model_used?: string | null
          normalized_json?: Json | null
          result_json?: Json | null
          status: string
          user_id: string
        }
        Update: {
          build_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_count?: number
          model_used?: string | null
          normalized_json?: Json | null
          result_json?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_user_quotas: {
        Row: {
          ai_enabled: boolean
          updated_at: string
          usage_limit: number
          usage_used: number
          user_id: string
        }
        Insert: {
          ai_enabled?: boolean
          updated_at?: string
          usage_limit?: number
          usage_used?: number
          user_id: string
        }
        Update: {
          ai_enabled?: boolean
          updated_at?: string
          usage_limit?: number
          usage_used?: number
          user_id?: string
        }
        Relationships: []
      }
      app_admin_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          email: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      app_admins: {
        Row: {
          created_at: string
          created_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      flyff_fashion_blessing_rules: {
        Row: {
          active: boolean
          appearance_probability: number
          blessing_type: string
          created_at: string
          effective_from: string
          game_version: string
          id: number
          parameter: string
          source_reference: string
          updated_at: string
          value: number
          value_probability: number
        }
        Insert: {
          active?: boolean
          appearance_probability: number
          blessing_type: string
          created_at?: string
          effective_from: string
          game_version: string
          id?: number
          parameter: string
          source_reference: string
          updated_at?: string
          value: number
          value_probability: number
        }
        Update: {
          active?: boolean
          appearance_probability?: number
          blessing_type?: string
          created_at?: string
          effective_from?: string
          game_version?: string
          id?: number
          parameter?: string
          source_reference?: string
          updated_at?: string
          value?: number
          value_probability?: number
        }
        Relationships: []
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
      admin_apply_ai_quota: {
        Args: {
          p_action: string
          p_admin: string
          p_target: string
          p_value?: number
        }
        Returns: Json
      }
      admin_dashboard: { Args: { p_admin: string }; Returns: Json }
      claim_flyff_sync: { Args: never; Returns: boolean }
      claim_verified_admin: {
        Args: { p_email: string; p_user: string }
        Returns: boolean
      }
      complete_ai_build_import: {
        Args: { p_import_id: string; p_normalized?: Json; p_result: Json }
        Returns: undefined
      }
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
      refund_ai_build_import: {
        Args: {
          p_error_code: string
          p_error_message: string
          p_import_id: string
        }
        Returns: undefined
      }
      reserve_ai_build_usage: {
        Args: { p_image_count: number; p_model: string; p_user_id: string }
        Returns: {
          import_id: string
          usage_limit: number
          usage_used: number
        }[]
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
