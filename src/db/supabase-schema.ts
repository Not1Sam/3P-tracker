/**
 * Supabase cloud database schema types.
 * This file defines the TypeScript types for the Supabase cloud database.
 * The actual tables are created via SQL migrations in the Supabase dashboard.
 */

export interface Database {
  public: {
    Tables: {
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          month: number;
          year: number;
          poop_count: number;
          piss_count: number;
          avg_bristol_type: number | null;
          common_piss_color: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: number;
          year: number;
          poop_count?: number;
          piss_count?: number;
          avg_bristol_type?: number | null;
          common_piss_color?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: number;
          year?: number;
          poop_count?: number;
          piss_count?: number;
          avg_bristol_type?: number | null;
          common_piss_color?: number | null;
          updated_at?: string;
        };
      };
      sync_state: {
        Row: {
          user_id: string;
          last_sync_timestamp: string;
          last_sync_month: number;
          last_sync_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          last_sync_timestamp?: string;
          last_sync_month: number;
          last_sync_year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          last_sync_timestamp?: string;
          last_sync_month?: number;
          last_sync_year?: number;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
        };
        Update: {
          username?: string;
        };
      };
      friends: {
        Row: {
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
      };
      invite_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          used: boolean;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          used?: boolean;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          used?: boolean;
          used_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
