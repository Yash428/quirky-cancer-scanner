export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          category: string | null
          id: number
          next_question_logic: Json | null
          options: Json
          parent_id: number | null
          question_text: string
          question_type: string
          response_trigger: string | null
          weight: number
        }
        Insert: {
          category?: string | null
          id?: number
          next_question_logic?: Json | null
          options: Json
          parent_id?: number | null
          question_text: string
          question_type: string
          response_trigger?: string | null
          weight?: number
        }
        Update: {
          category?: string | null
          id?: number
          next_question_logic?: Json | null
          options?: Json
          parent_id?: number | null
          question_text?: string
          question_type?: string
          response_trigger?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          advice: string
          cancer_type: string | null
          foods_to_avoid: string[]
          foods_to_eat: string[]
          id: number
          max_score: number
          min_score: number
          precautions: string[] | null
          risk_level: string
        }
        Insert: {
          advice: string
          cancer_type?: string | null
          foods_to_avoid: string[]
          foods_to_eat: string[]
          id?: number
          max_score: number
          min_score: number
          precautions?: string[] | null
          risk_level: string
        }
        Update: {
          advice?: string
          cancer_type?: string | null
          foods_to_avoid?: string[]
          foods_to_eat?: string[]
          id?: number
          max_score?: number
          min_score?: number
          precautions?: string[] | null
          risk_level?: string
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          biomarkers: Json | null
          confidence: string
          detection_result: string
          id: string
          image_name: string
          image_url: string | null
          recommendations: string[] | null
          timestamp: string
          user_id: string
        }
        Insert: {
          biomarkers?: Json | null
          confidence: string
          detection_result: string
          id?: string
          image_name: string
          image_url?: string | null
          recommendations?: string[] | null
          timestamp?: string
          user_id: string
        }
        Update: {
          biomarkers?: Json | null
          confidence?: string
          detection_result?: string
          id?: string
          image_name?: string
          image_url?: string | null
          recommendations?: string[] | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      user_responses: {
        Row: {
          created_at: string | null
          id: number
          question_id: number
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          question_id: number
          response: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          question_id?: number
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          dob: string
          email: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: number
          name: string
          password: string
          refresh_token: string | null
        }
        Insert: {
          dob: string
          email: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: number
          name: string
          password: string
          refresh_token?: string | null
        }
        Update: {
          dob?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: number
          name?: string
          password?: string
          refresh_token?: string | null
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
      gender: "male" | "female" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
