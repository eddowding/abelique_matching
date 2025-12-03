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
      connections: {
        Row: {
          created_at: string | null
          id: string
          match_reason: string | null
          user_a: string | null
          user_b: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_reason?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_reason?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_profiles: {
        Row: {
          created_at: string | null
          hidden_id: string
          hidden_until: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hidden_id: string
          hidden_until?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hidden_id?: string
          hidden_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_profiles_hidden_id_fkey"
            columns: ["hidden_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hidden_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_requests: {
        Row: {
          created_at: string | null
          id: string
          requester_id: string | null
          status: string | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          target_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          current_work: string | null
          email: string
          embedding: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          looking_for: string[] | null
          offering: string[] | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          current_work?: string | null
          email: string
          embedding?: string | null
          full_name: string
          id: string
          linkedin_url?: string | null
          looking_for?: string[] | null
          offering?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          current_work?: string | null
          email?: string
          embedding?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          looking_for?: string[] | null
          offering?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_profiles: {
        Args: {
          query_embedding: string
          match_count?: number
          current_user_id?: string
        }
        Returns: {
          id: string
          full_name: string
          email: string
          linkedin_url: string | null
          bio: string | null
          current_work: string | null
          looking_for: string[] | null
          offering: string[] | null
          created_at: string | null
          updated_at: string | null
          similarity: number
        }[]
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Connection = Tables<'connections'>
export type MatchRequest = Tables<'match_requests'>
export type HiddenProfile = Tables<'hidden_profiles'>
