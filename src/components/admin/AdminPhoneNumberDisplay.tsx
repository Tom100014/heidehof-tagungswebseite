import React, { useState, useEffect } from 'react';
import { formMessagingService } from '@/services/FormMessagingService';

interface AdminPhoneNumberDisplayProps {
  messageType: string;
}

export const AdminPhoneNumberDisplay: React.FC<AdminPhoneNumberDisplayProps> = ({ messageType }) => {
  const [adminNumber, setAdminNumber] = useState<string>('Lädt...');

  useEffect(() => {
    const loadAdminNumber = async () => {
      try {
        const formIdMap: Record<string, string> = {
          'restaurant_reservation': 'table-reservations',
          'bar_max_order': 'bar-max-orders',
          'restaurant_order': 'restaurant-maxwell-orders',
          'restaurant_maxwell_order': 'restaurant-maxwell-orders',
          'direct_order': 'restaurant-maxwell-orders',
          'beauty_appointment': 'beauty-appointments',
          'shop_order': 'shop-orders',
          'conference_order': 'conference-service',
          'complaint': 'complaints-contact'
        };

        // Unterstützt sowohl message_type (z.B. 'restaurant_order') als auch direkte Form-IDs (z.B. 'restaurant-maxwell-orders')
        const primaryId = formIdMap[messageType] || messageType;

        // Fallback-Kandidaten je nach Typ, damit immer eine Nummer gefunden wird
        let candidates: string[] = [];
        if (messageType === 'direct_order') {
          candidates = ['restaurant-maxwell-orders', 'bar-max-orders'];
        } else if (messageType === 'bar_max_order') {
          candidates = ['bar-max-orders', 'restaurant-maxwell-orders'];
        } else if (messageType === 'restaurant_order' || messageType === 'restaurant_maxwell_order') {
          candidates = ['restaurant-maxwell-orders', 'bar-max-orders'];
        } else {
          candidates = [primaryId];
        }
        if (!candidates.includes(primaryId)) candidates.unshift(primaryId);
        candidates.push('table-reservations', 'conference-service', 'complaints-contact');

        let resolvedNumber: string | null = null;
        for (const id of candidates) {
          try {
            const n = await formMessagingService.getPhoneNumber(id);
            if (n) { resolvedNumber = n; break; }
          } catch {}
        }

        setAdminNumber(resolvedNumber || 'Nicht konfiguriert');
      } catch (error) {
        console.error('Fehler beim Laden der Admin-Nummer:', error);
        setAdminNumber('Fehler beim Laden');
      }
    };

    loadAdminNumber();
  }, [messageType]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-light text-slate-400 uppercase tracking-wide">🏨 Admin-Kontaktnummer</label>
      <p className="text-sm text-slate-200 break-all font-light">
        {adminNumber}
      </p>
    </div>
  );
};