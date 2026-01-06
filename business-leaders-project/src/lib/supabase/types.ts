export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      leaders: {
        Row: {
          id: string;
          name: string;
          slug: string;
          title: string;
          photo_url: string;
          photo_credit: string | null;
          photo_license: string | null;
          photo_source_url: string | null;
          photo_attribution: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          title: string;
          photo_url: string;
          photo_credit?: string | null;
          photo_license?: string | null;
          photo_source_url?: string | null;
          photo_attribution?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          title?: string;
          photo_url?: string;
          photo_credit?: string | null;
          photo_license?: string | null;
          photo_source_url?: string | null;
          photo_attribution?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      nuggets: {
        Row: {
          id: string;
          leader_id: string;
          text: string;
          topic_tags: string[];
          type: "quote" | "principle" | "framework" | "story";
          source_title: string | null;
          source_url: string | null;
          source_year: number | null;
          confidence: "verified" | "attributed" | "paraphrased";
          status: "published" | "draft" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          leader_id: string;
          text: string;
          topic_tags?: string[];
          type: "quote" | "principle" | "framework" | "story";
          source_title?: string | null;
          source_url?: string | null;
          source_year?: number | null;
          confidence?: "verified" | "attributed" | "paraphrased";
          status?: "published" | "draft" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          leader_id?: string;
          text?: string;
          topic_tags?: string[];
          type?: "quote" | "principle" | "framework" | "story";
          source_title?: string | null;
          source_url?: string | null;
          source_year?: number | null;
          confidence?: "verified" | "attributed" | "paraphrased";
          status?: "published" | "draft" | "rejected";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nuggets_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "leaders";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          user_id: string;
          nugget_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          nugget_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          nugget_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_nugget_id_fkey";
            columns: ["nugget_id"];
            isOneToOne: false;
            referencedRelation: "nuggets";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Helper types
export type Leader = Database["public"]["Tables"]["leaders"]["Row"];
export type Nugget = Database["public"]["Tables"]["nuggets"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

export type NuggetWithLeader = Nugget & {
  leader: Leader;
};
