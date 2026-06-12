
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: string | number;
  notes?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  room_number?: string | number;
  table_number?: string;
  items: string | OrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'offen' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert' | 'new' | 'neu';
  timestamp: string;
  total?: number;
  contact_method?: string;
  contact_value?: string;
  notes?: string;
  
  // Zusätzliche Eigenschaften für verschiedene Komponenten
  created_at?: string;
  updated_at?: string;
  department?: string;
  kategorie?: string;
  priority?: boolean;
  highlight?: boolean;
  total_amount?: number;
  appointment_date?: string;
  guest_count?: number;
  delivery_location?: string;
  allow_future_contact?: boolean;
  venue?: string; // Hinzugefügt für Restaurant/Bar Mäx Venues
  
  // Beauty-spezifische Properties
  treatment_name?: string;
  treatment_type?: string;
  duration_minutes?: number;
  preferred_staff?: string;
  exact_time?: string;
  time_preference?: string;
  staff_id?: string;
  room_id?: string;
  
  // Restaurant-spezifische Properties
  bedNumber?: string;
  tentNumber?: string;
  specificLocation?: string;
  
  // Shop-spezifische Properties
  shop_items?: OrderItem[];
  contact_info?: string;
  pickup_method?: string;
  payment_method?: string;
  order_type?: string;
  
  // Konferenz-spezifische Properties
  conference_room?: string;
  order_date?: string;
  send_method?: string;
  lunch_menu?: any;
  dinner_menu?: any;
  guest_info?: any;
  menu_selections?: string[];
  dietary_restrictions?: string;
  special_requests?: string;
  meal_type?: 'lunch' | 'dinner' | 'both';
  conference_day?: string;
  group_size?: number;
  
  // Contact Request / Beschwerde-spezifische Properties
  contact_type?: 'email' | 'whatsapp' | 'sms' | 'pickup';
  service_context?: any;
  complaint_type?: string;
  complaint_message?: string;
  complaint_categories?: string[];
  other_complaint?: string;
  complaint_severity?: 'low' | 'medium' | 'high' | 'urgent';
  response_required?: boolean;
  guest_type?: 'hotel' | 'spa';
  key_number?: string;
}

export interface FormattedOrder extends Order {
  timestamp: string;
}

export const parseOrderItems = (items: string | OrderItem[]): OrderItem[] => {
  if (typeof items === 'string') {
    // Convert a string description into a single OrderItem
    return [{
      id: 'generated',
      name: items,
      quantity: 1
    }];
  }
  return items;
};

