// @ts-nocheck
import Mustache from 'mustache';
import { supabase } from '@/integrations/supabase/client';

export type MessageChannel = 'whatsapp' | 'sms' | 'email';

interface RenderOptions {
  formType: string;
  templateKey?: string; // optional, falls back to `${formType}.admin`
  channel: MessageChannel;
  language?: string; // default 'de'
  data: Record<string, any>;
}

async function fetchActiveTemplate({ formType, templateKey, channel, language = 'de' }: Omit<RenderOptions, 'data'>) {
  const key = templateKey || `${formType}.admin`;

  // 1) Try unified: ignore channel, match key + language
  let { data, error } = await supabase
    .from('message_templates')
    .select('id, content, variables, language')
    .eq('template_key', key)
    .eq('language', language)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Template fetch error (unified exact):', error.message);
  }

  // 2) Fallback: same key, any language (still unified/no channel)
  if (!data) {
    const anyLang = await supabase
      .from('message_templates')
      .select('id, content, variables, language')
      .eq('template_key', key)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (!anyLang.error) data = anyLang.data as any;
  }

  // 3) Fallback: generic key based on form type
  if (!data && templateKey) {
    const generic = await supabase
      .from('message_templates')
      .select('id, content, variables, language')
      .eq('template_key', `${formType}.admin`)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (!generic.error) data = generic.data as any;
  }

  return data as { id: string; content: string; variables?: any; language: string } | null;
}

export async function renderAdminTemplate(opts: RenderOptions): Promise<string | null> {
  const tpl = await fetchActiveTemplate(opts);
  if (!tpl) return null;

  try {
    // Ensure safe values for Mustache
    const safeData = JSON.parse(JSON.stringify(opts.data ?? {}));
    return Mustache.render(tpl.content, safeData);
  } catch (e) {
    console.error('Template render error:', e);
    return null;
  }
}

export function buildReservationContext(formData: any) {
  const formattedDate = formData?.reservationDate
    ? new Date(formData.reservationDate).toLocaleDateString('de-DE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';
  return {
    hotelName: 'Hotel Heidehof',
    restaurantName: 'Restaurant Maxwell',
    firstName: formData?.firstName || '',
    lastName: formData?.lastName || '',
    fullName: `${formData?.firstName || ''} ${formData?.lastName || ''}`.trim(),
    guestType: formData?.guestType || '',
    roomNumber: formData?.guestType === 'hotel_guest' ? (formData?.roomNumber || '') : 'Externer Gast',
    phoneNumber: formData?.phoneNumber || '',
    reservationDate: formData?.reservationDate || '',
    reservationTime: formData?.reservationTime || '',
    personCount: formData?.personCount || '',
    specialRequests: formData?.specialRequests || '',
    formattedDate,
  };
}
