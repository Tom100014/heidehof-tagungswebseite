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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          diff: Json
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      admin_help_texts: {
        Row: {
          body_md: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          section: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body_md?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          section?: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          section?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      beauty_bookings: {
        Row: {
          created_at: string
          ends_at: string
          facility_id: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          guest_room: string | null
          id: string
          notes: string | null
          price_eur: number | null
          source: string
          staff_id: string | null
          staff_name: string | null
          starts_at: string
          status: string
          treatment_duration_min: number
          treatment_id: string | null
          treatment_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          facility_id?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          guest_room?: string | null
          id?: string
          notes?: string | null
          price_eur?: number | null
          source?: string
          staff_id?: string | null
          staff_name?: string | null
          starts_at: string
          status?: string
          treatment_duration_min: number
          treatment_id?: string | null
          treatment_title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          facility_id?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          guest_room?: string | null
          id?: string
          notes?: string | null
          price_eur?: number | null
          source?: string
          staff_id?: string | null
          staff_name?: string | null
          starts_at?: string
          status?: string
          treatment_duration_min?: number
          treatment_id?: string | null
          treatment_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "beauty_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "beauty_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_bookings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "wellness_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_facilities: {
        Row: {
          capacity: number
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          sector: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          sector?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          sector?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      beauty_facility_availability: {
        Row: {
          created_at: string
          end_time: string
          facility_id: string
          id: string
          repeat_until: string | null
          repeat_weekly: boolean
          start_time: string
          valid_from: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          facility_id: string
          id?: string
          repeat_until?: string | null
          repeat_weekly?: boolean
          start_time: string
          valid_from?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          facility_id?: string
          id?: string
          repeat_until?: string | null
          repeat_weekly?: boolean
          start_time?: string
          valid_from?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "beauty_facility_availability_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "beauty_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_shift_overrides: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          reason: string | null
          staff_id: string
          start_time: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          staff_id: string
          start_time?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          staff_id?: string
          start_time?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_shift_overrides_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "beauty_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          staff_id: string
          start_time: string
          valid_from: string | null
          valid_to: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          valid_from?: string | null
          valid_to?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          valid_from?: string | null
          valid_to?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "beauty_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "beauty_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_skills: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      beauty_staff: {
        Row: {
          color: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      beauty_staff_skills: {
        Row: {
          skill_id: string
          staff_id: string
        }
        Insert: {
          skill_id: string
          staff_id: string
        }
        Update: {
          skill_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_staff_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "beauty_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_staff_skills_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "beauty_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      cartesia_call_log: {
        Row: {
          agent_id: string | null
          call_id: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          result: Json
          success: boolean
          tool_name: string
        }
        Insert: {
          agent_id?: string | null
          call_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          result?: Json
          success?: boolean
          tool_name: string
        }
        Update: {
          agent_id?: string | null
          call_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          result?: Json
          success?: boolean
          tool_name?: string
        }
        Relationships: []
      }
      category_email_routes: {
        Row: {
          category_key: string
          created_at: string
          emails: string[]
          enabled: boolean
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          emails?: string[]
          enabled?: boolean
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          emails?: string[]
          enabled?: boolean
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      clara_conversations: {
        Row: {
          created_at: string
          extracted: Json
          id: string
          inquiry_sent: boolean
          session_id: string
          transcript: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          extracted?: Json
          id?: string
          inquiry_sent?: boolean
          session_id: string
          transcript?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          extracted?: Json
          id?: string
          inquiry_sent?: boolean
          session_id?: string
          transcript?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clara_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      clara_media: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          description: string
          embedding: string | null
          id: string
          is_active: boolean
          media_type: string
          sort_order: number
          storage_path: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          triggers: string[]
          updated_at: string
          url: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          description?: string
          embedding?: string | null
          id?: string
          is_active?: boolean
          media_type?: string
          sort_order?: number
          storage_path?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          triggers?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          description?: string
          embedding?: string | null
          id?: string
          is_active?: boolean
          media_type?: string
          sort_order?: number
          storage_path?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          triggers?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      clara_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          session_id: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          session_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          session_id?: string | null
        }
        Relationships: []
      }
      clara_prompts: {
        Row: {
          content: string
          description: string | null
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: string
          description?: string | null
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: string
          description?: string | null
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      clara_session_memory: {
        Row: {
          created_at: string
          id: string
          key: string
          session_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          session_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          session_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      clara_usage_log: {
        Row: {
          cost_estimate_eur: number
          created_at: string
          id: string
          meta: Json
          model: string | null
          provider: string | null
          session_id: string | null
          tool: string
          unit_kind: string | null
          units: number
        }
        Insert: {
          cost_estimate_eur?: number
          created_at?: string
          id?: string
          meta?: Json
          model?: string | null
          provider?: string | null
          session_id?: string | null
          tool: string
          unit_kind?: string | null
          units?: number
        }
        Update: {
          cost_estimate_eur?: number
          created_at?: string
          id?: string
          meta?: Json
          model?: string | null
          provider?: string | null
          session_id?: string | null
          tool?: string
          unit_kind?: string | null
          units?: number
        }
        Relationships: []
      }
      clara_voice_sessions: {
        Row: {
          context_category: string | null
          context_room: string | null
          context_section: string | null
          context_source: string | null
          context_topic: string | null
          context_trigger: string | null
          created_at: string
          ended_at: string | null
          id: string
          persona: string
          session_id: string
          started_at: string
          terminated_reason: string | null
          tokens_in: number
          tokens_out: number
          turns: number
          updated_at: string
        }
        Insert: {
          context_category?: string | null
          context_room?: string | null
          context_section?: string | null
          context_source?: string | null
          context_topic?: string | null
          context_trigger?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          persona?: string
          session_id: string
          started_at?: string
          terminated_reason?: string | null
          tokens_in?: number
          tokens_out?: number
          turns?: number
          updated_at?: string
        }
        Update: {
          context_category?: string | null
          context_room?: string | null
          context_section?: string | null
          context_source?: string | null
          context_topic?: string | null
          context_trigger?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          persona?: string
          session_id?: string
          started_at?: string
          terminated_reason?: string | null
          tokens_in?: number
          tokens_out?: number
          turns?: number
          updated_at?: string
        }
        Relationships: []
      }
      clara_voice_turns: {
        Row: {
          assistant_text: string | null
          created_at: string
          id: string
          latency_ms: number | null
          session_id: string
          tokens_in: number
          tokens_out: number
          tool_calls: Json
          turn_index: number
          user_text: string | null
        }
        Insert: {
          assistant_text?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          session_id: string
          tokens_in?: number
          tokens_out?: number
          tool_calls?: Json
          turn_index?: number
          user_text?: string | null
        }
        Update: {
          assistant_text?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          session_id?: string
          tokens_in?: number
          tokens_out?: number
          tool_calls?: Json
          turn_index?: number
          user_text?: string | null
        }
        Relationships: []
      }
      clara_widget_configs: {
        Row: {
          allowed_origins: string[]
          auto_open: boolean
          created_at: string
          greeting: string | null
          id: string
          is_active: boolean
          name: string
          theme: Json
          token: string
          updated_at: string
          voice_enabled: boolean
        }
        Insert: {
          allowed_origins?: string[]
          auto_open?: boolean
          created_at?: string
          greeting?: string | null
          id?: string
          is_active?: boolean
          name: string
          theme?: Json
          token?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Update: {
          allowed_origins?: string[]
          auto_open?: boolean
          created_at?: string
          greeting?: string | null
          id?: string
          is_active?: boolean
          name?: string
          theme?: Json
          token?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      complaints: {
        Row: {
          category: string
          contact: string | null
          created_at: string
          description: string
          guest_name: string | null
          guest_type: string | null
          id: string
          read_at: string | null
          room_or_table: string | null
          source: string
          status: string
          urgency: string
        }
        Insert: {
          category?: string
          contact?: string | null
          created_at?: string
          description: string
          guest_name?: string | null
          guest_type?: string | null
          id?: string
          read_at?: string | null
          room_or_table?: string | null
          source?: string
          status?: string
          urgency?: string
        }
        Update: {
          category?: string
          contact?: string | null
          created_at?: string
          description?: string
          guest_name?: string | null
          guest_type?: string | null
          id?: string
          read_at?: string | null
          room_or_table?: string | null
          source?: string
          status?: string
          urgency?: string
        }
        Relationships: []
      }
      conference_dishes: {
        Row: {
          allergens: Json
          category: Database["public"]["Enums"]["dish_category"]
          created_at: string
          description: string | null
          id: string
          image_prompt: string | null
          image_storage_path: string | null
          image_url: string | null
          is_active: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          service_date: string
          sort_order: number
          title: string
        }
        Insert: {
          allergens?: Json
          category: Database["public"]["Enums"]["dish_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          meal_type?: Database["public"]["Enums"]["meal_type"]
          service_date: string
          sort_order?: number
          title: string
        }
        Update: {
          allergens?: Json
          category?: Database["public"]["Enums"]["dish_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          meal_type?: Database["public"]["Enums"]["meal_type"]
          service_date?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      conference_menu_cards: {
        Row: {
          created_at: string
          id: string
          image_url: string
          meal_type: Database["public"]["Enums"]["meal_type"] | null
          notes: string | null
          service_date: string
          source: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          notes?: string | null
          service_date: string
          source?: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          notes?: string | null
          service_date?: string
          source?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      conference_menu_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          image_url: string
          is_active: boolean
          menu_id: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_type: string
          image_url: string
          is_active?: boolean
          menu_id: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          is_active?: boolean
          menu_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conference_menu_images_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "conference_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_menus: {
        Row: {
          allergens: Json
          created_at: string
          dinner_appetizer: string | null
          dinner_dessert: string | null
          dinner_main_dish_fish: Json | null
          dinner_main_dish_meat: Json | null
          dinner_main_dish_vegetarian: Json | null
          id: string
          lunch_appetizer: string | null
          lunch_dessert: string | null
          lunch_main_dish_fish: Json | null
          lunch_main_dish_meat: Json | null
          lunch_main_dish_vegetarian: Json | null
          menu_date: string
          updated_at: string
        }
        Insert: {
          allergens?: Json
          created_at?: string
          dinner_appetizer?: string | null
          dinner_dessert?: string | null
          dinner_main_dish_fish?: Json | null
          dinner_main_dish_meat?: Json | null
          dinner_main_dish_vegetarian?: Json | null
          id?: string
          lunch_appetizer?: string | null
          lunch_dessert?: string | null
          lunch_main_dish_fish?: Json | null
          lunch_main_dish_meat?: Json | null
          lunch_main_dish_vegetarian?: Json | null
          menu_date: string
          updated_at?: string
        }
        Update: {
          allergens?: Json
          created_at?: string
          dinner_appetizer?: string | null
          dinner_dessert?: string | null
          dinner_main_dish_fish?: Json | null
          dinner_main_dish_meat?: Json | null
          dinner_main_dish_vegetarian?: Json | null
          id?: string
          lunch_appetizer?: string | null
          lunch_dessert?: string | null
          lunch_main_dish_fish?: Json | null
          lunch_main_dish_meat?: Json | null
          lunch_main_dish_vegetarian?: Json | null
          menu_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      conference_order_items: {
        Row: {
          course: string
          created_at: string
          dish_type: string | null
          id: string
          menu_id: string | null
          order_id: string
          quantity: number
        }
        Insert: {
          course: string
          created_at?: string
          dish_type?: string | null
          id?: string
          menu_id?: string | null
          order_id: string
          quantity?: number
        }
        Update: {
          course?: string
          created_at?: string
          dish_type?: string | null
          id?: string
          menu_id?: string | null
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "conference_order_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "conference_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "conference_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_orders: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          guest_name: string
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"] | null
          menu_id: string | null
          notes: string | null
          participants: number
          prepared_reply: string | null
          read_at: string | null
          room_id: string
          service_date: string
          source: string | null
          status: Database["public"]["Enums"]["conference_order_status"]
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          guest_name: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          menu_id?: string | null
          notes?: string | null
          participants?: number
          prepared_reply?: string | null
          read_at?: string | null
          room_id: string
          service_date: string
          source?: string | null
          status?: Database["public"]["Enums"]["conference_order_status"]
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          guest_name?: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          menu_id?: string | null
          notes?: string | null
          participants?: number
          prepared_reply?: string | null
          read_at?: string | null
          room_id?: string
          service_date?: string
          source?: string | null
          status?: Database["public"]["Enums"]["conference_order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "conference_orders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "conference_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_rooms: {
        Row: {
          area_sqm: number | null
          cap_bankett: number | null
          cap_block: number | null
          cap_parlament: number | null
          cap_theater: number | null
          cap_uform: number | null
          capacity: number
          category: string
          created_at: string
          description: string | null
          equipment: string[]
          height_m: number | null
          id: string
          image_url: string | null
          is_active: boolean
          length_m: number | null
          name: string
          sort_order: number
          style: string | null
          subtitle: string | null
          width_m: number | null
        }
        Insert: {
          area_sqm?: number | null
          cap_bankett?: number | null
          cap_block?: number | null
          cap_parlament?: number | null
          cap_theater?: number | null
          cap_uform?: number | null
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          equipment?: string[]
          height_m?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          length_m?: number | null
          name: string
          sort_order?: number
          style?: string | null
          subtitle?: string | null
          width_m?: number | null
        }
        Update: {
          area_sqm?: number | null
          cap_bankett?: number | null
          cap_block?: number | null
          cap_parlament?: number | null
          cap_theater?: number | null
          cap_uform?: number | null
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          equipment?: string[]
          height_m?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          length_m?: number | null
          name?: string
          sort_order?: number
          style?: string | null
          subtitle?: string | null
          width_m?: number | null
        }
        Relationships: []
      }
      daily_menu_assets: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          images: Json | null
          layout_template: string | null
          menu_date: string
          menu_id: string
          pdf_path: string | null
          pdf_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          images?: Json | null
          layout_template?: string | null
          menu_date: string
          menu_id: string
          pdf_path?: string | null
          pdf_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          images?: Json | null
          layout_template?: string | null
          menu_date?: string
          menu_id?: string
          pdf_path?: string | null
          pdf_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_menu_assets_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: true
            referencedRelation: "conference_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      day_journey_steps: {
        Row: {
          autoplay_seconds: number
          body: string
          created_at: string
          eyebrow: string
          icon: string
          id: string
          is_active: boolean
          loop: boolean
          media_type: string
          media_url: string | null
          mobile_media_type: string | null
          mobile_media_url: string | null
          muted: boolean
          object_position: string
          poster_url: string | null
          slug: string
          sort_order: number
          story_md: string
          title: string
          updated_at: string
          video_url: string | null
          video_webm_url: string | null
        }
        Insert: {
          autoplay_seconds?: number
          body?: string
          created_at?: string
          eyebrow?: string
          icon?: string
          id?: string
          is_active?: boolean
          loop?: boolean
          media_type?: string
          media_url?: string | null
          mobile_media_type?: string | null
          mobile_media_url?: string | null
          muted?: boolean
          object_position?: string
          poster_url?: string | null
          slug: string
          sort_order?: number
          story_md?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          video_webm_url?: string | null
        }
        Update: {
          autoplay_seconds?: number
          body?: string
          created_at?: string
          eyebrow?: string
          icon?: string
          id?: string
          is_active?: boolean
          loop?: boolean
          media_type?: string
          media_url?: string | null
          mobile_media_type?: string | null
          mobile_media_url?: string | null
          muted?: boolean
          object_position?: string
          poster_url?: string | null
          slug?: string
          sort_order?: number
          story_md?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          video_webm_url?: string | null
        }
        Relationships: []
      }
      drinks_menu: {
        Row: {
          category: Database["public"]["Enums"]["drinks_category"]
          created_at: string
          description: string | null
          embedding: string | null
          id: string
          image_prompt: string | null
          image_storage_path: string | null
          image_url: string | null
          is_active: boolean
          price_eur: number | null
          price_label: string | null
          producer: string | null
          region: string | null
          slug: string
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
          volume_label: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["drinks_category"]
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_eur?: number | null
          price_label?: string | null
          producer?: string | null
          region?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
          volume_label?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["drinks_category"]
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_eur?: number | null
          price_label?: string | null
          producer?: string | null
          region?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
          volume_label?: string | null
        }
        Relationships: []
      }
      elevenlabs_agents: {
        Row: {
          agent_id: string
          agent_name: string
          context: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          context: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          context?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      elevenlabs_conversations: {
        Row: {
          agent_id: string
          audio_url: string | null
          clara_context: Json | null
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          extracted_fields: Json | null
          id: string
          metadata: Json
          started_at: string
          status: string
          summary: string | null
          transcript: Json
          triggered_action_id: string | null
          triggered_action_type: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          audio_url?: string | null
          clara_context?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          extracted_fields?: Json | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          summary?: string | null
          transcript?: Json
          triggered_action_id?: string | null
          triggered_action_type?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          audio_url?: string | null
          clara_context?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          extracted_fields?: Json | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          summary?: string | null
          transcript?: Json
          triggered_action_id?: string | null
          triggered_action_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string | null
          draft_id: string | null
          id: string
          lead_id: string | null
          metadata: Json
          occurred_at: string
          type: string
        }
        Insert: {
          campaign_id?: string | null
          draft_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          type: string
        }
        Update: {
          campaign_id?: string | null
          draft_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "lead_email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_history: {
        Row: {
          blocks: Json
          created_at: string
          edited_by: string | null
          id: string
          preheader: string | null
          subject: string
          template_key: string
        }
        Insert: {
          blocks: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          preheader?: string | null
          subject: string
          template_key: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          preheader?: string | null
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          blocks: Json
          category: string
          is_active: boolean
          key: string
          label: string
          preheader: string | null
          subject: string
          updated_at: string
          updated_by: string | null
          variables: string[]
        }
        Insert: {
          blocks?: Json
          category?: string
          is_active?: boolean
          key: string
          label: string
          preheader?: string | null
          subject: string
          updated_at?: string
          updated_by?: string | null
          variables?: string[]
        }
        Update: {
          blocks?: Json
          category?: string
          is_active?: boolean
          key?: string
          label?: string
          preheader?: string | null
          subject?: string
          updated_at?: string
          updated_by?: string | null
          variables?: string[]
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          guest_name: string
          id: string
          notes: string | null
          party_size: number
          phone: string | null
          read_at: string | null
          source: Database["public"]["Enums"]["event_booking_source"]
          status: Database["public"]["Enums"]["event_booking_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          guest_name: string
          id?: string
          notes?: string | null
          party_size?: number
          phone?: string | null
          read_at?: string | null
          source?: Database["public"]["Enums"]["event_booking_source"]
          status?: Database["public"]["Enums"]["event_booking_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          guest_name?: string
          id?: string
          notes?: string | null
          party_size?: number
          phone?: string | null
          read_at?: string | null
          source?: Database["public"]["Enums"]["event_booking_source"]
          status?: Database["public"]["Enums"]["event_booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agent_bookable: boolean
          booking_email: string | null
          booking_enabled: boolean
          capacity: number | null
          created_at: string
          description_md: string | null
          embedding: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          gallery_urls: string[]
          hero_image_url: string | null
          id: string
          image_prompt: string | null
          image_storage_path: string | null
          is_active: boolean
          is_published: boolean
          location: string | null
          price_label: string | null
          slug: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          agent_bookable?: boolean
          booking_email?: string | null
          booking_enabled?: boolean
          capacity?: number | null
          created_at?: string
          description_md?: string | null
          embedding?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gallery_urls?: string[]
          hero_image_url?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          is_active?: boolean
          is_published?: boolean
          location?: string | null
          price_label?: string | null
          slug: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          agent_bookable?: boolean
          booking_email?: string | null
          booking_enabled?: boolean
          capacity?: number | null
          created_at?: string
          description_md?: string | null
          embedding?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gallery_urls?: string[]
          hero_image_url?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          is_active?: boolean
          is_published?: boolean
          location?: string | null
          price_label?: string | null
          slug?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_menu: {
        Row: {
          allergens: string[]
          course: Database["public"]["Enums"]["food_course"]
          created_at: string
          description: string | null
          embedding: string | null
          id: string
          image_prompt: string | null
          image_storage_path: string | null
          image_url: string | null
          is_active: boolean
          is_glutenfree: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          price_eur: number | null
          price_label: string | null
          slug: string
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          course: Database["public"]["Enums"]["food_course"]
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          is_glutenfree?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          price_eur?: number | null
          price_label?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          course?: Database["public"]["Enums"]["food_course"]
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          is_glutenfree?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          price_eur?: number | null
          price_label?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_reviews_cache: {
        Row: {
          display_name: string | null
          fetched_at: string
          id: string
          place_id: string
          rating: number | null
          reviews: Json
          user_ratings_total: number | null
        }
        Insert: {
          display_name?: string | null
          fetched_at?: string
          id?: string
          place_id: string
          rating?: number | null
          reviews?: Json
          user_ratings_total?: number | null
        }
        Update: {
          display_name?: string | null
          fetched_at?: string
          id?: string
          place_id?: string
          rating?: number | null
          reviews?: Json
          user_ratings_total?: number | null
        }
        Relationships: []
      }
      google_reviews_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          max_reviews: number
          min_rating: number
          place_id: string | null
          place_query: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_reviews?: number
          min_rating?: number
          place_id?: string | null
          place_query?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_reviews?: number
          min_rating?: number
          place_id?: string | null
          place_query?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hotel_reference_images: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          label: string
          scopes: string[]
          slug: string
          sort_order: number
          source_url: string | null
          storage_path: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url: string
          is_active?: boolean
          label: string
          scopes?: string[]
          slug: string
          sort_order?: number
          source_url?: string | null
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          label?: string
          scopes?: string[]
          slug?: string
          sort_order?: number
          source_url?: string | null
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      image_style_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          is_builtin: boolean
          label: string
          layout_hint: string | null
          layout_instructions: string
          preview_url: string | null
          reference_images: Json
          slug: string
          sort_order: number
          style: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          label: string
          layout_hint?: string | null
          layout_instructions?: string
          preview_url?: string | null
          reference_images?: Json
          slug: string
          sort_order?: number
          style?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          label?: string
          layout_hint?: string | null
          layout_instructions?: string
          preview_url?: string | null
          reference_images?: Json
          slug?: string
          sort_order?: number
          style?: Json
          updated_at?: string
        }
        Relationships: []
      }
      impressionen_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          agent_used: string
          category: string | null
          conversation_summary: string | null
          created_at: string
          guest_contact: string | null
          guest_name: string | null
          id: string
          message: string
          page_context: string | null
          status: string
          ticket_required: boolean
        }
        Insert: {
          agent_used?: string
          category?: string | null
          conversation_summary?: string | null
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: string
          message: string
          page_context?: string | null
          status?: string
          ticket_required?: boolean
        }
        Update: {
          agent_used?: string
          category?: string | null
          conversation_summary?: string | null
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: string
          message?: string
          page_context?: string | null
          status?: string
          ticket_required?: boolean
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          category: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          label: string
          last_check_at: string | null
          last_error: string | null
          required_secrets: string[]
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          label: string
          last_check_at?: string | null
          last_error?: string | null
          required_secrets?: string[]
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          label?: string
          last_check_at?: string | null
          last_error?: string | null
          required_secrets?: string[]
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      kitchen_report_runs: {
        Row: {
          error: string | null
          id: string
          orders_count: number | null
          pdf_url: string | null
          recipients: Json
          run_at: string
          service_date: string | null
          success: boolean
          trigger_source: string
        }
        Insert: {
          error?: string | null
          id?: string
          orders_count?: number | null
          pdf_url?: string | null
          recipients?: Json
          run_at?: string
          service_date?: string | null
          success?: boolean
          trigger_source?: string
        }
        Update: {
          error?: string | null
          id?: string
          orders_count?: number | null
          pdf_url?: string | null
          recipients?: Json
          run_at?: string
          service_date?: string | null
          success?: boolean
          trigger_source?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          actor_id: string | null
          deal_id: string | null
          id: string
          lead_id: string
          occurred_at: string
          payload: Json
          type: string
        }
        Insert: {
          actor_id?: string | null
          deal_id?: string | null
          id?: string
          lead_id: string
          occurred_at?: string
          payload?: Json
          type: string
        }
        Update: {
          actor_id?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string
          occurred_at?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_automation: {
        Row: {
          campaign_id: string
          daily_cap: number
          is_active: boolean
          last_run_at: string | null
          last_run_stats: Json
          send_hour_end: number
          send_hour_start: number
          updated_at: string
          weekdays: number[]
        }
        Insert: {
          campaign_id: string
          daily_cap?: number
          is_active?: boolean
          last_run_at?: string | null
          last_run_stats?: Json
          send_hour_end?: number
          send_hour_start?: number
          updated_at?: string
          weekdays?: number[]
        }
        Update: {
          campaign_id?: string
          daily_cap?: number
          is_active?: boolean
          last_run_at?: string | null
          last_run_stats?: Json
          send_hour_end?: number
          send_hour_start?: number
          updated_at?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "lead_automation_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_campaigns: {
        Row: {
          created_at: string
          daily_cap: number
          filters: Json
          id: string
          mode: string
          name: string
          schedule: Json
          stats: Json
          status: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_cap?: number
          filters?: Json
          id?: string
          mode?: string
          name: string
          schedule?: Json
          stats?: Json
          status?: string
          template_key?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_cap?: number
          filters?: Json
          id?: string
          mode?: string
          name?: string
          schedule?: Json
          stats?: Json
          status?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_email_drafts: {
        Row: {
          ai_generated_at: string | null
          ai_meta: Json
          approved_at: string | null
          attachments: Json
          body_html: string
          body_text: string
          campaign_id: string | null
          created_at: string
          error_message: string | null
          id: string
          images: Json
          lead_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          ai_generated_at?: string | null
          ai_meta?: Json
          approved_at?: string | null
          attachments?: Json
          body_html?: string
          body_text?: string
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          images?: Json
          lead_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated_at?: string | null
          ai_meta?: Json
          approved_at?: string | null
          attachments?: Json
          body_html?: string
          body_text?: string
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          images?: Json
          lead_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_email_drafts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_enrichment_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          lead_id: string
          result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id: string
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_enrichment_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          campaign_id: string | null
          id: string
          lead_id: string
          occurred_at: string
          payload: Json
          type: string
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          lead_id: string
          occurred_at?: string
          payload?: Json
          type: string
        }
        Update: {
          campaign_id?: string | null
          id?: string
          lead_id?: string
          occurred_at?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_inbound_log: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          lead_id: string | null
          raw: Json
          source: string
          source_record_id: string | null
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          raw?: Json
          source: string
          source_record_id?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          raw?: Json
          source?: string
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_inbound_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_inbound_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_replies: {
        Row: {
          body_html: string | null
          body_text: string | null
          campaign_id: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          in_reply_to: string | null
          is_auto_reply: boolean
          lead_id: string | null
          message_id: string | null
          raw: Json
          received_at: string
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_auto_reply?: boolean
          lead_id?: string | null
          message_id?: string | null
          raw?: Json
          received_at?: string
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_auto_reply?: boolean
          lead_id?: string | null
          message_id?: string | null
          raw?: Json
          received_at?: string
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_replies_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_replies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sequences: {
        Row: {
          campaign_id: string
          delay_days: number
          id: string
          step: number
          template_key: string
        }
        Insert: {
          campaign_id: string
          delay_days?: number
          id?: string
          step: number
          template_key: string
        }
        Update: {
          campaign_id?: string
          delay_days?: number
          id?: string
          step?: number
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          bounced_at: string | null
          campaign_id: string | null
          city: string | null
          company: string
          contact_name: string | null
          contact_role: string | null
          country: string
          created_at: string
          do_not_contact: boolean
          email: string | null
          employee_count: number | null
          enrichment: Json
          enrolled_at: string | null
          enrolled_sequence_id: string | null
          enrolled_step: number | null
          id: string
          industry: string | null
          last_activity_at: string | null
          last_sent_at: string | null
          lead_score: number
          next_action_at: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          replied_at: string | null
          sequence_step: number
          source: string | null
          status: string
          tags: string[]
          unsubscribed: boolean
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          city?: string | null
          company: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string
          created_at?: string
          do_not_contact?: boolean
          email?: string | null
          employee_count?: number | null
          enrichment?: Json
          enrolled_at?: string | null
          enrolled_sequence_id?: string | null
          enrolled_step?: number | null
          id?: string
          industry?: string | null
          last_activity_at?: string | null
          last_sent_at?: string | null
          lead_score?: number
          next_action_at?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          replied_at?: string | null
          sequence_step?: number
          source?: string | null
          status?: string
          tags?: string[]
          unsubscribed?: boolean
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          city?: string | null
          company?: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string
          created_at?: string
          do_not_contact?: boolean
          email?: string | null
          employee_count?: number | null
          enrichment?: Json
          enrolled_at?: string | null
          enrolled_sequence_id?: string | null
          enrolled_step?: number | null
          id?: string
          industry?: string | null
          last_activity_at?: string | null
          last_sent_at?: string | null
          lead_score?: number
          next_action_at?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          replied_at?: string | null
          sequence_step?: number
          source?: string | null
          status?: string
          tags?: string[]
          unsubscribed?: boolean
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_enrolled_sequence_id_fkey"
            columns: ["enrolled_sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_category_prompts: {
        Row: {
          category: string
          id: string
          kind: string
          negative_prompt: string | null
          prompt: string
          style_hint: string | null
          updated_at: string
        }
        Insert: {
          category: string
          id?: string
          kind: string
          negative_prompt?: string | null
          prompt: string
          style_hint?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          kind?: string
          negative_prompt?: string | null
          prompt?: string
          style_hint?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_layout_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          prompt: string | null
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          prompt?: string | null
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          prompt?: string | null
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: []
      }
      mews_field_permissions: {
        Row: {
          allowed: boolean
          category: string
          description: string | null
          field_key: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          category?: string
          description?: string | null
          field_key: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          category?: string
          description?: string | null
          field_key?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      mews_mappings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: string
          local_id: string
          local_label: string | null
          mews_id: string
          mews_label: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          local_id: string
          local_label?: string | null
          mews_id: string
          mews_label?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          local_id?: string
          local_label?: string | null
          mews_id?: string
          mews_label?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mews_settings: {
        Row: {
          auto_send_conference_orders: boolean
          auto_send_inquiries: boolean
          auto_send_restaurant_orders: boolean
          client_name: string
          default_account_id: string | null
          default_outlet_id: string | null
          environment: string
          hotel_name: string | null
          id: string
          is_enabled: boolean
          last_test_at: string | null
          last_test_error: string | null
          last_test_status: string | null
          platform_address: string
          send_window_end: string | null
          send_window_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_send_conference_orders?: boolean
          auto_send_inquiries?: boolean
          auto_send_restaurant_orders?: boolean
          client_name?: string
          default_account_id?: string | null
          default_outlet_id?: string | null
          environment?: string
          hotel_name?: string | null
          id?: string
          is_enabled?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          platform_address?: string
          send_window_end?: string | null
          send_window_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_send_conference_orders?: boolean
          auto_send_inquiries?: boolean
          auto_send_restaurant_orders?: boolean
          client_name?: string
          default_account_id?: string | null
          default_outlet_id?: string | null
          environment?: string
          hotel_name?: string | null
          id?: string
          is_enabled?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          platform_address?: string
          send_window_end?: string | null
          send_window_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mews_sync_log: {
        Row: {
          action: string
          created_at: string
          direction: string
          error: string | null
          http_status: number | null
          id: string
          request: Json | null
          response: Json | null
          source_id: string | null
          source_table: string | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          direction: string
          error?: string | null
          http_status?: number | null
          id?: string
          request?: Json | null
          response?: Json | null
          source_id?: string | null
          source_table?: string | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          direction?: string
          error?: string | null
          http_status?: number | null
          id?: string
          request?: Json | null
          response?: Json | null
          source_id?: string | null
          source_table?: string | null
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          payload: Json
          recipient: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          payload?: Json
          recipient?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          payload?: Json
          recipient?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_visibility: {
        Row: {
          category: string
          coming_soon: boolean
          is_visible: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          coming_soon?: boolean
          is_visible?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          coming_soon?: boolean
          is_visible?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_logos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          sort_order: number
          storage_path: string | null
          target_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          sort_order?: number
          storage_path?: string | null
          target_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          sort_order?: number
          storage_path?: string | null
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_agent_calls: {
        Row: {
          agent_id: string
          agent_name: string | null
          cartesia_call_id: string
          category: string
          created_at: string
          direction: string | null
          ended_at: string | null
          from_number: string | null
          id: string
          priority: string
          raw_payload: Json
          started_at: string | null
          status: string | null
          summary: string | null
          to_number: string | null
          transcript: Json
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_name?: string | null
          cartesia_call_id: string
          category?: string
          created_at?: string
          direction?: string | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          priority?: string
          raw_payload?: Json
          started_at?: string | null
          status?: string | null
          summary?: string | null
          to_number?: string | null
          transcript?: Json
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_name?: string | null
          cartesia_call_id?: string
          category?: string
          created_at?: string
          direction?: string | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          priority?: string
          raw_payload?: Json
          started_at?: string | null
          status?: string | null
          summary?: string | null
          to_number?: string | null
          transcript?: Json
          updated_at?: string
        }
        Relationships: []
      }
      phone_call_contexts: {
        Row: {
          call_id: string | null
          clara_context: Json
          consumed_at: string | null
          created_at: string
          expires_at: string
          phone_hint: string | null
          token: string
        }
        Insert: {
          call_id?: string | null
          clara_context?: Json
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          phone_hint?: string | null
          token: string
        }
        Update: {
          call_id?: string | null
          clara_context?: Json
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          phone_hint?: string | null
          token?: string
        }
        Relationships: []
      }
      pipeline_deals: {
        Row: {
          created_at: string
          estimated_value: number
          event_type: string | null
          expected_date: string | null
          expected_persons: number | null
          id: string
          lead_id: string
          notes: string | null
          owner_id: string | null
          position: number
          probability: number
          room_interest: string[]
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_value?: number
          event_type?: string | null
          expected_date?: string | null
          expected_persons?: number | null
          id?: string
          lead_id: string
          notes?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          room_interest?: string[]
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_value?: number
          event_type?: string | null
          expected_date?: string | null
          expected_persons?: number | null
          id?: string
          lead_id?: string
          notes?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          room_interest?: string[]
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      print_assets: {
        Row: {
          asset_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          layout_template: string | null
          meta: Json
          onedrive_url: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          prompt_used: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          layout_template?: string | null
          meta?: Json
          onedrive_url?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          prompt_used?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          layout_template?: string | null
          meta?: Json
          onedrive_url?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          prompt_used?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onboarding_state: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_state?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_state?: Json
          user_id?: string
        }
        Relationships: []
      }
      prompt_layouts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          is_builtin: boolean
          label: string
          prompt_text: string
          reference_image_ids: string[]
          reference_roles: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          label: string
          prompt_text?: string
          reference_image_ids?: string[]
          reference_roles?: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          label?: string
          prompt_text?: string
          reference_image_ids?: string[]
          reference_roles?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      requests_archive: {
        Row: {
          archived_at: string
          category: string | null
          embedding: string | null
          id: string
          original_created_at: string | null
          payload: Json
          read_by: string | null
          source_id: string
          source_table: string
          summary: string
        }
        Insert: {
          archived_at?: string
          category?: string | null
          embedding?: string | null
          id?: string
          original_created_at?: string | null
          payload?: Json
          read_by?: string | null
          source_id: string
          source_table: string
          summary?: string
        }
        Update: {
          archived_at?: string
          category?: string | null
          embedding?: string | null
          id?: string
          original_created_at?: string | null
          payload?: Json
          read_by?: string | null
          source_id?: string
          source_table?: string
          summary?: string
        }
        Relationships: []
      }
      restaurant_orders: {
        Row: {
          category: string | null
          created_at: string
          guest_name: string | null
          guest_type: string
          id: string
          items: Json
          notes: string | null
          prepared_reply: string | null
          read_at: string | null
          source: string
          status: string
          table_or_room: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          guest_name?: string | null
          guest_type?: string
          id?: string
          items?: Json
          notes?: string | null
          prepared_reply?: string | null
          read_at?: string | null
          source?: string
          status?: string
          table_or_room?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          guest_name?: string | null
          guest_type?: string
          id?: string
          items?: Json
          notes?: string | null
          prepared_reply?: string | null
          read_at?: string | null
          source?: string
          status?: string
          table_or_room?: string | null
        }
        Relationships: []
      }
      restaurant_reservations: {
        Row: {
          confirmed_summary: string | null
          contact: string | null
          created_at: string
          guest_name: string
          id: string
          notes: string | null
          persons: number
          read_at: string | null
          reservation_date: string | null
          reservation_time: string | null
          session_id: string | null
          source: string
          status: string
        }
        Insert: {
          confirmed_summary?: string | null
          contact?: string | null
          created_at?: string
          guest_name: string
          id?: string
          notes?: string | null
          persons?: number
          read_at?: string | null
          reservation_date?: string | null
          reservation_time?: string | null
          session_id?: string | null
          source?: string
          status?: string
        }
        Update: {
          confirmed_summary?: string | null
          contact?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          notes?: string | null
          persons?: number
          read_at?: string | null
          reservation_date?: string | null
          reservation_time?: string | null
          session_id?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          capacity_label: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          eyebrow: string
          features: Json
          hero_image_url: string | null
          hero_storage_path: string | null
          id: string
          image_prompt: string | null
          is_active: boolean
          name: string
          opening_hours: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          capacity_label?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          eyebrow?: string
          features?: Json
          hero_image_url?: string | null
          hero_storage_path?: string | null
          id?: string
          image_prompt?: string | null
          is_active?: boolean
          name: string
          opening_hours?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          capacity_label?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          eyebrow?: string
          features?: Json
          hero_image_url?: string | null
          hero_storage_path?: string | null
          id?: string
          image_prompt?: string | null
          is_active?: boolean
          name?: string
          opening_hours?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean
          room_id: string
          sort_order: number
          source: string
          storage_path: string | null
          tags: string[]
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          room_id: string
          sort_order?: number
          source?: string
          storage_path?: string | null
          tags?: string[]
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          room_id?: string
          sort_order?: number
          source?: string
          storage_path?: string | null
          tags?: string[]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "conference_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_orders: {
        Row: {
          category: string | null
          created_at: string
          guest_name: string | null
          id: string
          items: Json
          notes: string | null
          prepared_reply: string | null
          read_at: string | null
          room_number: string
          source: string
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          prepared_reply?: string | null
          read_at?: string | null
          room_number: string
          source?: string
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          prepared_reply?: string | null
          read_at?: string | null
          room_number?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      room_setups: {
        Row: {
          capacity_range: string | null
          created_at: string
          description: string | null
          id: string
          ideal_for: string | null
          image_url: string | null
          is_active: boolean
          slug: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          capacity_range?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ideal_for?: string | null
          image_url?: string | null
          is_active?: boolean
          slug: string
          sort_order?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          capacity_range?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ideal_for?: string | null
          image_url?: string | null
          is_active?: boolean
          slug?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sequence_steps: {
        Row: {
          body_html: string | null
          condition: Json
          created_at: string
          id: string
          sequence_id: string
          step_order: number
          subject: string | null
          template_key: string | null
          use_ai: boolean
          wait_days: number
        }
        Insert: {
          body_html?: string | null
          condition?: Json
          created_at?: string
          id?: string
          sequence_id: string
          step_order: number
          subject?: string | null
          template_key?: string | null
          use_ai?: boolean
          wait_days?: number
        }
        Update: {
          body_html?: string | null
          condition?: Json
          created_at?: string
          id?: string
          sequence_id?: string
          step_order?: number
          subject?: string | null
          template_key?: string | null
          use_ai?: boolean
          wait_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          description: string | null
          field_type: string
          id: string
          label: string | null
          page: string
          section_key: string
          sort_order: number
          updated_at: string
          value_de: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_type?: string
          id?: string
          label?: string | null
          page: string
          section_key: string
          sort_order?: number
          updated_at?: string
          value_de?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_type?: string
          id?: string
          label?: string | null
          page?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
          value_de?: string
        }
        Relationships: []
      }
      site_content_history: {
        Row: {
          created_at: string
          edited_by: string | null
          id: string
          page: string
          section_key: string
          value_de: string
        }
        Insert: {
          created_at?: string
          edited_by?: string | null
          id?: string
          page: string
          section_key: string
          value_de?: string
        }
        Update: {
          created_at?: string
          edited_by?: string | null
          id?: string
          page?: string
          section_key?: string
          value_de?: string
        }
        Relationships: []
      }
      site_images: {
        Row: {
          alt: string | null
          brightness: number
          media_type: string
          poster_url: string | null
          slug: string
          storage_path: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          alt?: string | null
          brightness?: number
          media_type?: string
          poster_url?: string | null
          slug: string
          storage_path?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          alt?: string | null
          brightness?: number
          media_type?: string
          poster_url?: string | null
          slug?: string
          storage_path?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      site_media: {
        Row: {
          alt: string | null
          created_at: string
          description: string | null
          id: string
          label: string | null
          page: string
          section_key: string
          sort_order: number
          storage_path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string | null
          page: string
          section_key: string
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string | null
          page?: string
          section_key?: string
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_seo: {
        Row: {
          canonical: string | null
          created_at: string
          description: string | null
          id: string
          keywords: string | null
          noindex: boolean
          og_image_url: string | null
          route: string
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          noindex?: boolean
          og_image_url?: string | null
          route: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          noindex?: boolean
          og_image_url?: string | null
          route?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tagungs_inquiries: {
        Row: {
          anfrage_text: string | null
          angebot_generated_at: string | null
          angebot_text: string | null
          anlass: string | null
          besonderheiten: string | null
          conversation: Json | null
          created_at: string
          datum: string | null
          dauer: string | null
          dispatch_error: Json | null
          dispatch_status: string | null
          dispatched_at: string | null
          email: string | null
          email_error: string | null
          email_sent: boolean
          firma: string | null
          guest_notified_at: string | null
          hubspot_contact_id: string | null
          hubspot_deal_id: string | null
          id: string
          name: string | null
          outlook_event_id: string | null
          pauschalvorschlag: string | null
          personen: string | null
          prepared_reply: string | null
          raumvorschlag: string | null
          read_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at: string | null
          teams_message_id: string | null
          technik: string | null
          telefon: string | null
          uebernachtung: string | null
          verpflegung: string | null
          zusammenfassung: string | null
        }
        Insert: {
          anfrage_text?: string | null
          angebot_generated_at?: string | null
          angebot_text?: string | null
          anlass?: string | null
          besonderheiten?: string | null
          conversation?: Json | null
          created_at?: string
          datum?: string | null
          dauer?: string | null
          dispatch_error?: Json | null
          dispatch_status?: string | null
          dispatched_at?: string | null
          email?: string | null
          email_error?: string | null
          email_sent?: boolean
          firma?: string | null
          guest_notified_at?: string | null
          hubspot_contact_id?: string | null
          hubspot_deal_id?: string | null
          id?: string
          name?: string | null
          outlook_event_id?: string | null
          pauschalvorschlag?: string | null
          personen?: string | null
          prepared_reply?: string | null
          raumvorschlag?: string | null
          read_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          teams_message_id?: string | null
          technik?: string | null
          telefon?: string | null
          uebernachtung?: string | null
          verpflegung?: string | null
          zusammenfassung?: string | null
        }
        Update: {
          anfrage_text?: string | null
          angebot_generated_at?: string | null
          angebot_text?: string | null
          anlass?: string | null
          besonderheiten?: string | null
          conversation?: Json | null
          created_at?: string
          datum?: string | null
          dauer?: string | null
          dispatch_error?: Json | null
          dispatch_status?: string | null
          dispatched_at?: string | null
          email?: string | null
          email_error?: string | null
          email_sent?: boolean
          firma?: string | null
          guest_notified_at?: string | null
          hubspot_contact_id?: string | null
          hubspot_deal_id?: string | null
          id?: string
          name?: string | null
          outlook_event_id?: string | null
          pauschalvorschlag?: string | null
          personen?: string | null
          prepared_reply?: string | null
          raumvorschlag?: string | null
          read_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          teams_message_id?: string | null
          technik?: string | null
          telefon?: string | null
          uebernachtung?: string | null
          verpflegung?: string | null
          zusammenfassung?: string | null
        }
        Relationships: []
      }
      tagungs_packages: {
        Row: {
          badge: string | null
          created_at: string
          eyebrow: string
          highlights: Json
          id: string
          image_url: string | null
          inclusions: Json
          is_active: boolean
          is_bestseller: boolean
          number_label: string
          price_note: string
          price_suffix: string
          price_value: string
          slug: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          eyebrow?: string
          highlights?: Json
          id?: string
          image_url?: string | null
          inclusions?: Json
          is_active?: boolean
          is_bestseller?: boolean
          number_label?: string
          price_note?: string
          price_suffix?: string
          price_value?: string
          slug: string
          sort_order?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          eyebrow?: string
          highlights?: Json
          id?: string
          image_url?: string | null
          inclusions?: Json
          is_active?: boolean
          is_bestseller?: boolean
          number_label?: string
          price_note?: string
          price_suffix?: string
          price_value?: string
          slug?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tech_features: {
        Row: {
          body_md: string
          bullets: Json
          created_at: string
          eyebrow: string
          id: string
          image_url: string | null
          is_active: boolean
          layout: string
          number_label: string
          slug: string
          sort_order: number
          storage_path: string | null
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string
          bullets?: Json
          created_at?: string
          eyebrow?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          layout?: string
          number_label?: string
          slug: string
          sort_order?: number
          storage_path?: string | null
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          bullets?: Json
          created_at?: string
          eyebrow?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          layout?: string
          number_label?: string
          slug?: string
          sort_order?: number
          storage_path?: string | null
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_category_prompts: {
        Row: {
          category: Database["public"]["Enums"]["wellness_category"]
          id: string
          negative_prompt: string | null
          prompt: string
          style_hint: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["wellness_category"]
          id?: string
          negative_prompt?: string | null
          prompt?: string
          style_hint?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["wellness_category"]
          id?: string
          negative_prompt?: string | null
          prompt?: string
          style_hint?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wellness_sections: {
        Row: {
          body_md: string | null
          created_at: string
          embedding: string | null
          eyebrow: string
          features: Json
          hero_image_url: string | null
          hero_storage_path: string | null
          id: string
          is_active: boolean
          master_image_prompt: string | null
          opening_hours: string | null
          page: Database["public"]["Enums"]["wellness_page"]
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          embedding?: string | null
          eyebrow?: string
          features?: Json
          hero_image_url?: string | null
          hero_storage_path?: string | null
          id?: string
          is_active?: boolean
          master_image_prompt?: string | null
          opening_hours?: string | null
          page: Database["public"]["Enums"]["wellness_page"]
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          embedding?: string | null
          eyebrow?: string
          features?: Json
          hero_image_url?: string | null
          hero_storage_path?: string | null
          id?: string
          is_active?: boolean
          master_image_prompt?: string | null
          opening_hours?: string | null
          page?: Database["public"]["Enums"]["wellness_page"]
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wellness_treatments: {
        Row: {
          bookable: boolean
          buffer_minutes: number
          category: Database["public"]["Enums"]["wellness_category"]
          created_at: string
          description: string | null
          duration_label: string | null
          duration_minutes: number | null
          embedding: string | null
          id: string
          image_prompt: string | null
          image_storage_path: string | null
          image_url: string | null
          is_active: boolean
          price_eur: number | null
          price_label: string | null
          required_skill: string | null
          slug: string
          sort_order: number
          tags: string[]
          target_page: Database["public"]["Enums"]["wellness_page"]
          title: string
          updated_at: string
        }
        Insert: {
          bookable?: boolean
          buffer_minutes?: number
          category?: Database["public"]["Enums"]["wellness_category"]
          created_at?: string
          description?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_eur?: number | null
          price_label?: string | null
          required_skill?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          target_page?: Database["public"]["Enums"]["wellness_page"]
          title: string
          updated_at?: string
        }
        Update: {
          bookable?: boolean
          buffer_minutes?: number
          category?: Database["public"]["Enums"]["wellness_category"]
          created_at?: string
          description?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          id?: string
          image_prompt?: string | null
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          price_eur?: number | null
          price_label?: string | null
          required_skill?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          target_page?: Database["public"]["Enums"]["wellness_page"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_attach_order_item: { Args: { _order_id: string }; Returns: boolean }
      create_conference_order: {
        Args: {
          p_company: string
          p_email: string
          p_guest_name: string
          p_items?: Json
          p_meal_type: string
          p_notes: string
          p_participants: number
          p_room_id: string
          p_service_date: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_diff?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: string
      }
      match_archive: {
        Args: {
          filter_category?: string
          filter_source?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          id: string
          original_created_at: string
          payload: Json
          similarity: number
          source_table: string
          summary: string
        }[]
      }
      match_clara_media: {
        Args: {
          filter_category?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          caption: string
          category: string
          description: string
          id: string
          media_type: string
          similarity: number
          tags: string[]
          thumbnail_url: string
          title: string
          triggers: string[]
          url: string
        }[]
      }
      match_menu: {
        Args: {
          filter_kind?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          kind: string
          price_label: string
          similarity: number
          title: string
        }[]
      }
      match_wellness: {
        Args: {
          filter_page?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          description: string
          id: string
          kind: string
          similarity: number
          title: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_order_status_by_room: {
        Args: {
          p_meal_type: string
          p_room_name: string
          p_service_date: string
          p_status: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "beauty_staff"
        | "fb_staff"
        | "conference_staff"
        | "front_desk"
        | "director"
      conference_order_status:
        | "new"
        | "confirmed"
        | "in_kitchen"
        | "completed"
        | "cancelled"
      dish_category:
        | "vegetarian"
        | "meat"
        | "fish"
        | "vegan"
        | "dessert"
        | "starter"
      drinks_category:
        | "aperitif"
        | "weisswein"
        | "rotwein"
        | "rose"
        | "bier"
        | "softdrink"
        | "kaffee"
        | "tee"
        | "spirituose"
        | "cocktail"
        | "wasser"
        | "dessertwein"
        | "longdrink"
        | "digestif"
      event_booking_source: "web" | "clara" | "admin"
      event_booking_status: "new" | "confirmed" | "cancelled" | "waitlist"
      event_type:
        | "hochzeit"
        | "firmenfeier"
        | "weihnachtsfeier"
        | "silvester"
        | "brunch"
        | "gala"
        | "live_music"
        | "tagung"
        | "sonstiges"
      food_course:
        | "vorspeise"
        | "suppe"
        | "salat"
        | "hauptgang_fleisch"
        | "hauptgang_fisch"
        | "hauptgang_vegi"
        | "beilage"
        | "dessert"
        | "kinder"
        | "snack"
      inquiry_status:
        | "neu"
        | "in_bearbeitung"
        | "angebot_gesendet"
        | "gewonnen"
        | "abgesagt"
      meal_type: "breakfast" | "lunch" | "coffee" | "dinner"
      wellness_category:
        | "beauty_men"
        | "beauty_women"
        | "depilation"
        | "massagen"
        | "hand_fuss"
        | "sonstiges"
        | "sauna"
        | "pool"
        | "ruhebereich"
        | "spa_general"
        | "wellness_general"
      wellness_page: "wellness" | "spa"
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
      app_role: [
        "admin",
        "user",
        "beauty_staff",
        "fb_staff",
        "conference_staff",
        "front_desk",
        "director",
      ],
      conference_order_status: [
        "new",
        "confirmed",
        "in_kitchen",
        "completed",
        "cancelled",
      ],
      dish_category: [
        "vegetarian",
        "meat",
        "fish",
        "vegan",
        "dessert",
        "starter",
      ],
      drinks_category: [
        "aperitif",
        "weisswein",
        "rotwein",
        "rose",
        "bier",
        "softdrink",
        "kaffee",
        "tee",
        "spirituose",
        "cocktail",
        "wasser",
        "dessertwein",
        "longdrink",
        "digestif",
      ],
      event_booking_source: ["web", "clara", "admin"],
      event_booking_status: ["new", "confirmed", "cancelled", "waitlist"],
      event_type: [
        "hochzeit",
        "firmenfeier",
        "weihnachtsfeier",
        "silvester",
        "brunch",
        "gala",
        "live_music",
        "tagung",
        "sonstiges",
      ],
      food_course: [
        "vorspeise",
        "suppe",
        "salat",
        "hauptgang_fleisch",
        "hauptgang_fisch",
        "hauptgang_vegi",
        "beilage",
        "dessert",
        "kinder",
        "snack",
      ],
      inquiry_status: [
        "neu",
        "in_bearbeitung",
        "angebot_gesendet",
        "gewonnen",
        "abgesagt",
      ],
      meal_type: ["breakfast", "lunch", "coffee", "dinner"],
      wellness_category: [
        "beauty_men",
        "beauty_women",
        "depilation",
        "massagen",
        "hand_fuss",
        "sonstiges",
        "sauna",
        "pool",
        "ruhebereich",
        "spa_general",
        "wellness_general",
      ],
      wellness_page: ["wellness", "spa"],
    },
  },
} as const
