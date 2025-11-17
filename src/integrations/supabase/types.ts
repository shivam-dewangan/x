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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      batch_approvals: {
        Row: {
          admin_id: string
          approved_at: string | null
          batch_id: string
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          admin_id: string
          approved_at?: string | null
          batch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          admin_id?: string
          approved_at?: string | null
          batch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "batch_approvals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_number: string
          blockchain_tx_hash: string | null
          created_at: string
          farmer_id: string
          farming_conditions: string | null
          harvest_date: string
          herb_name: string
          id: string
          images: string[] | null
          moisture_level: number | null
          price_per_kg: number | null
          purity_report_url: string | null
          qr_code_data: string | null
          quantity_kg: number
          status: Database["public"]["Enums"]["batch_status"]
          updated_at: string
        }
        Insert: {
          batch_number: string
          blockchain_tx_hash?: string | null
          created_at?: string
          farmer_id: string
          farming_conditions?: string | null
          harvest_date: string
          herb_name: string
          id?: string
          images?: string[] | null
          moisture_level?: number | null
          price_per_kg?: number | null
          purity_report_url?: string | null
          qr_code_data?: string | null
          quantity_kg: number
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Update: {
          batch_number?: string
          blockchain_tx_hash?: string | null
          created_at?: string
          farmer_id?: string
          farming_conditions?: string | null
          harvest_date?: string
          herb_name?: string
          id?: string
          images?: string[] | null
          moisture_level?: number | null
          price_per_kg?: number | null
          purity_report_url?: string | null
          qr_code_data?: string | null
          quantity_kg?: number
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Relationships: []
      }
      company_details: {
        Row: {
          company_address: string
          company_name: string
          created_at: string
          gst_number: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address: string
          company_name: string
          created_at?: string
          gst_number?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string
          company_name?: string
          created_at?: string
          gst_number?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_details: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          certifications: string[] | null
          created_at: string
          farm_location: string
          farm_name: string
          id: string
          land_proof_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          certifications?: string[] | null
          created_at?: string
          farm_location: string
          farm_name: string
          id?: string
          land_proof_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          certifications?: string[] | null
          created_at?: string
          farm_location?: string
          farm_name?: string
          id?: string
          land_proof_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          batch_id: string
          blockchain_tx_hash: string | null
          company_id: string
          created_at: string
          farmer_amount: number
          farmer_id: string
          id: string
          payment_status: string
          platform_amount: number
          quantity_kg: number
          total_amount: number
        }
        Insert: {
          batch_id: string
          blockchain_tx_hash?: string | null
          company_id: string
          created_at?: string
          farmer_amount: number
          farmer_id: string
          id?: string
          payment_status?: string
          platform_amount: number
          quantity_kg: number
          total_amount: number
        }
        Update: {
          batch_id?: string
          blockchain_tx_hash?: string | null
          company_id?: string
          created_at?: string
          farmer_amount?: number
          farmer_id?: string
          id?: string
          payment_status?: string
          platform_amount?: number
          quantity_kg?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      batch_status: "pending_approval" | "approved" | "ready_for_sale" | "sold"
      user_role: "farmer" | "admin" | "company" | "consumer"
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
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      batch_status: ["pending_approval", "approved", "ready_for_sale", "sold"],
      user_role: ["farmer", "admin", "company", "consumer"],
    },
  },
} as const
