export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      battles: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      combatants: {
        Row: {
          id: string;
          battle_id: string;
          name: string;
          type: 'player' | 'monster';
          initiative: number;
          dex_modifier: number;
          max_hp: number;
          current_hp: number;
          armor_class: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          name: string;
          type: 'player' | 'monster';
          initiative: number;
          dex_modifier?: number;
          max_hp?: number;
          current_hp?: number;
          armor_class?: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          name?: string;
          type?: 'player' | 'monster';
          initiative?: number;
          dex_modifier?: number;
          max_hp?: number;
          current_hp?: number;
          armor_class?: number;
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
};
