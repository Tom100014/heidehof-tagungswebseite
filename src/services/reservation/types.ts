
export interface RestaurantReservation {
  full_name: string;
  salutation?: string;
  room_number: string;
  spa_key_number?: string;
  reservation_date?: Date;
  reservation_time: string;
  contact_method: string;
  contact_value: string;
  privacy_accepted: boolean;
  allow_future_contact: boolean;
  internal_notes?: string;
  person_count: string;
  menu_sent?: boolean;
}

export interface ReservationResponse {
  success: boolean;
  reservationId?: string;
  error?: string;
}

export interface RestaurantMenu {
  id: string;
  language: string;
  pdf_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
