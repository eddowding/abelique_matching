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
      group_connections: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          match_reason: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          match_reason?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          match_reason?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_connections_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_connections_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_connections_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_hidden_profiles: {
        Row: {
          created_at: string | null
          group_id: string
          hidden_id: string
          hidden_until: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          hidden_id: string
          hidden_until?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          hidden_id?: string
          hidden_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_hidden_profiles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_hidden_profiles_hidden_id_fkey"
            columns: ["hidden_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_hidden_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_match_requests: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          requester_id: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          requester_id: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          requester_id?: string
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_match_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_match_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_match_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          embedding: string | null
          group_id: string
          id: string
          joined_at: string | null
          profile_data: Json
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          embedding?: string | null
          group_id: string
          id?: string
          joined_at?: string | null
          profile_data?: Json
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          embedding?: string | null
          group_id?: string
          id?: string
          joined_at?: string | null
          profile_data?: Json
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          invite_code: string
          name: string
          password: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          password?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          password?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
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
      notification_preferences: {
        Row: {
          created_at: string | null
          email_mutual_matches: boolean | null
          email_new_requests: boolean | null
          email_weekly_digest: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_mutual_matches?: boolean | null
          email_new_requests?: boolean | null
          email_weekly_digest?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_mutual_matches?: boolean | null
          email_new_requests?: boolean | null
          email_weekly_digest?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          sent_at: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          sent_at?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          sent_at?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
      match_group_profiles: {
        Args: {
          p_group_id: string
          p_query_embedding: string
          p_match_count?: number
          p_current_user_id?: string
        }
        Returns: {
          user_id: string
          full_name: string
          email: string
          linkedin_url: string | null
          profile_data: Json
          similarity: number
        }[]
      }
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

// Existing types
export type Profile = Tables<'profiles'>
export type Connection = Tables<'connections'>
export type MatchRequest = Tables<'match_requests'>
export type HiddenProfile = Tables<'hidden_profiles'>

// New group types
export type Group = Tables<'groups'>
export type GroupMembership = Tables<'group_memberships'>
export type GroupMatchRequest = Tables<'group_match_requests'>
export type GroupConnection = Tables<'group_connections'>
export type GroupHiddenProfile = Tables<'group_hidden_profiles'>

// Profile data interface for group memberships
export interface GroupProfileData {
  bio?: string
  current_work?: string
  looking_for?: string[]
  offering?: string[]
  linkedin_url?: string
}
