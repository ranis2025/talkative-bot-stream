export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_tokens: {
        Row: {
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          token: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          token: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_tokens_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          id: string
          password: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          role: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          password: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          password: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          password?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      chat_bots: {
        Row: {
          app_user_id: string | null
          bot_id: string
          bot_token: string | null
          created_at: string | null
          id: string
          name: string
          openai_key: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          app_user_id?: string | null
          bot_id: string
          bot_token?: string | null
          created_at?: string | null
          id?: string
          name: string
          openai_key?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          app_user_id?: string | null
          bot_id?: string
          bot_token?: string | null
          created_at?: string | null
          id?: string
          name?: string
          openai_key?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_bots_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_status: {
        Row: {
          bot_id: string
          chat_id: string
          created_at: string
          error_message: string | null
          id: string
          message_id: string
          retry_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          chat_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_id: string
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          chat_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      protalk_chats: {
        Row: {
          bot_id: string | null
          bots_ids: string[] | null
          created_at: string | null
          id: string
          is_group_chat: boolean | null
          messages: Json | null
          title: string
          token: string
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          bots_ids?: string[] | null
          created_at?: string | null
          id: string
          is_group_chat?: boolean | null
          messages?: Json | null
          title: string
          token: string
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          bots_ids?: string[] | null
          created_at?: string | null
          id?: string
          is_group_chat?: boolean | null
          messages?: Json | null
          title?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      token_bot_assignments: {
        Row: {
          bot_id: string
          bot_name: string | null
          bot_token: string | null
          created_at: string
          id: string
          token_id: string
        }
        Insert: {
          bot_id: string
          bot_name?: string | null
          bot_token?: string | null
          created_at?: string
          id?: string
          token_id: string
        }
        Update: {
          bot_id?: string
          bot_name?: string | null
          bot_token?: string | null
          created_at?: string
          id?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_bot_assignments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "access_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          app_user_id: string | null
          created_at: string | null
          default_bot_id: string | null
          email: string | null
          id: string
          theme: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_user_id?: string | null
          created_at?: string | null
          default_bot_id?: string | null
          email?: string | null
          id?: string
          theme?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_user_id?: string | null
          created_at?: string | null
          default_bot_id?: string | null
          email?: string | null
          id?: string
          theme?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_tokens: {
        Args: { admin_id: string }
        Returns: {
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          token: string
          updated_at: string
        }[]
      }
      transfer_token: {
        Args: { token_id: string; new_admin_id: string }
        Returns: boolean
      }
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
