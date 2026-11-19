// ==============================================================================
// Supabase Database TypeScript Definitions
// Auto-generated and hand-curated types matching all PostgreSQL tables,
// PostGIS spatial extensions, RLS policies, and RPC stored procedures.
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FeatureType =
  | 'point'
  | 'linestring'
  | 'polygon'
  | 'multipoint'
  | 'multilinestring'
  | 'multipolygon'
  | 'geometrycollection';

export type SharedCollectionPermission = 'read' | 'edit' | 'admin';

export type UserThemePreference = 'light' | 'dark' | 'system';

export type DistanceUnit = 'metric' | 'imperial';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_style: string;
          default_zoom: number;
          default_center_lng: number;
          default_center_lat: number;
          theme: UserThemePreference;
          distance_unit: DistanceUnit;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_style?: string;
          default_zoom?: number;
          default_center_lng?: number;
          default_center_lat?: number;
          theme?: UserThemePreference;
          distance_unit?: DistanceUnit;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_style?: string;
          default_zoom?: number;
          default_center_lng?: number;
          default_center_lat?: number;
          theme?: UserThemePreference;
          distance_unit?: DistanceUnit;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      saved_places: {
        Row: {
          id: string;
          user_id: string | null;
          provider_id: string | null;
          name: string;
          formatted_address: string;
          category: string;
          latitude: number;
          longitude: number;
          location: unknown; // GEOGRAPHY(Point, 4326)
          notes: string | null;
          custom_color: string | null;
          custom_icon: string | null;
          rating: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          provider_id?: string | null;
          name: string;
          formatted_address: string;
          category: string;
          latitude: number;
          longitude: number;
          location?: unknown;
          notes?: string | null;
          custom_color?: string | null;
          custom_icon?: string | null;
          rating?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          provider_id?: string | null;
          name?: string;
          formatted_address?: string;
          category?: string;
          latitude?: number;
          longitude?: number;
          location?: unknown;
          notes?: string | null;
          custom_color?: string | null;
          custom_icon?: string | null;
          rating?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_places_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      place_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          icon: string | null;
          cover_image_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          cover_image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          cover_image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_collections_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          saved_place_id: string;
          sort_order: number;
          notes: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          saved_place_id: string;
          sort_order?: number;
          notes?: string | null;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          saved_place_id?: string;
          sort_order?: number;
          notes?: string | null;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_items_collection_id_fkey';
            columns: ['collection_id'];
            referencedRelation: 'place_collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_items_saved_place_id_fkey';
            columns: ['saved_place_id'];
            referencedRelation: 'saved_places';
            referencedColumns: ['id'];
          },
        ];
      };

      search_history: {
        Row: {
          id: string;
          user_id: string | null;
          query: string;
          selected_place_id: string | null;
          selected_place_name: string | null;
          latitude: number | null;
          longitude: number | null;
          location: unknown | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          query: string;
          selected_place_id?: string | null;
          selected_place_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location?: unknown | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          query?: string;
          selected_place_id?: string | null;
          selected_place_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location?: unknown | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'search_history_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      user_map_features: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          feature_type: FeatureType;
          geom: unknown; // GEOMETRY(Geometry, 4326)
          geojson: Json;
          properties: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          feature_type: FeatureType;
          geom?: unknown;
          geojson: Json;
          properties?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          feature_type?: FeatureType;
          geom?: unknown;
          geojson?: Json;
          properties?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_map_features_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      shared_collections: {
        Row: {
          id: string;
          collection_id: string;
          shared_with_user_id: string;
          permission: SharedCollectionPermission;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          shared_with_user_id: string;
          permission?: SharedCollectionPermission;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          shared_with_user_id?: string;
          permission?: SharedCollectionPermission;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_collections_collection_id_fkey';
            columns: ['collection_id'];
            referencedRelation: 'place_collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_collections_shared_with_user_id_fkey';
            columns: ['shared_with_user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      map_layer_preferences: {
        Row: {
          id: string;
          user_id: string;
          layer_id: string;
          visible: boolean;
          opacity: number;
          style_overrides: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          layer_id: string;
          visible?: boolean;
          opacity?: number;
          style_overrides?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          layer_id?: string;
          visible?: boolean;
          opacity?: number;
          style_overrides?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'map_layer_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      location_shares: {
        Row: {
          id: string;
          user_id: string;
          share_token: string;
          current_location: unknown | null;
          heading: number | null;
          speed: number | null;
          accuracy: number | null;
          battery_level: number | null;
          expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_token?: string;
          current_location?: unknown | null;
          heading?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          battery_level?: number | null;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_token?: string;
          current_location?: unknown | null;
          heading?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          battery_level?: number | null;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_shares_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      nearby_saved_places: {
        Args: {
          center_lng: number;
          center_lat: number;
          radius_meters?: number;
          max_results?: number;
          category_filter?: string | null;
        };
        Returns: {
          id: string;
          user_id: string | null;
          provider_id: string | null;
          name: string;
          formatted_address: string;
          category: string;
          latitude: number;
          longitude: number;
          notes: string | null;
          custom_color: string | null;
          custom_icon: string | null;
          rating: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          distance_meters: number;
        }[];
      };

      features_in_viewport: {
        Args: {
          min_lng: number;
          min_lat: number;
          max_lng: number;
          max_lat: number;
          max_features?: number;
          feature_type_filter?: string | null;
        };
        Returns: {
          id: string;
          user_id: string | null;
          name: string;
          feature_type: string;
          geojson: Json;
          properties: Json;
          created_at: string;
          updated_at: string;
        }[];
      };

      features_intersecting_geometry: {
        Args: {
          target_geom: Json;
          max_features?: number;
        };
        Returns: {
          id: string;
          user_id: string | null;
          name: string;
          feature_type: string;
          geojson: Json;
          properties: Json;
          created_at: string;
          updated_at: string;
        }[];
      };

      spatial_distance: {
        Args: {
          p1_lng: number;
          p1_lat: number;
          p2_lng: number;
          p2_lat: number;
        };
        Returns: number;
      };

      paginated_places: {
        Args: {
          cursor_id?: string | null;
          page_size?: number;
          category_filter?: string | null;
          search_query?: string | null;
        };
        Returns: {
          id: string;
          user_id: string | null;
          provider_id: string | null;
          name: string;
          formatted_address: string;
          category: string;
          latitude: number;
          longitude: number;
          notes: string | null;
          custom_color: string | null;
          custom_icon: string | null;
          rating: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        }[];
      };
    };

    Enums: {
      feature_type: FeatureType;
      shared_collection_permission: SharedCollectionPermission;
      user_theme_preference: UserThemePreference;
      distance_unit: DistanceUnit;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ------------------------------------------------------------------------------
// Convenience Helper Types
// ------------------------------------------------------------------------------

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never;
