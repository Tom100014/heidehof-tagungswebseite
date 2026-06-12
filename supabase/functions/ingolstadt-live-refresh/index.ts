
/**
 * Edge Function: ingolstadt-live-refresh
 * - Ruft für definierte Kategorien die bestehenden Live-Daten (ingolstadt-live-ticker) ab
 * - Speichert sie als Snapshots in public.ingolstadt_live_snapshots
 * - Wird per Cron 06:00, 12:00, 18:00 getriggert (siehe SQL-Migration)
 * - CORS aktiviert
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type WindowLabel = 'morning' | 'noon' | 'afternoon' | 'overnight';

const CATEGORIES = [
  'highlights',
  'events',
  'kino',
  'gastronomy',
  'nightlife',
  'culture',
  'museums',
  'live_music',
  'wellness',
  'sports',
  'outdoor',
  'altmuehltal',
  'shopping',
  'markets',
  'kids',
  'transport',
  'audi',
  'insider_tips',
];

function getSupabaseServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, serviceRole);
}

function toISO(date: Date) {
  return date.toISOString();
}

/**
 * Ermittelt Today-Start/End (UTC) für einfache tägliche Löschung/Ersetzung.
 */
function getTodayRangeUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return { start, end };
}

/**
 * Berechnet grobe Fenster-Start/Ende in UTC (vereinfachte Umsetzung).
 * Wichtig ist nur, innerhalb eines Tages pro Fenster pro Kategorie konsistent zu bleiben.
 */
function computeWindowBounds(label: WindowLabel) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  // Optimiert für 06:00, 12:00, 18:00 Zeitfenster
  // Wir setzen die Fenster so, dass sie am selben UTC-Tag liegen,
  // die genauen Grenzen dienen nur der Eindeutigkeit/Lesbarkeit.
  let start: Date;
  let end: Date;

  switch (label) {
    case 'morning':
      start = new Date(Date.UTC(y, m, d, 4, 0, 0));  // ~06:00 lokal (UTC+2 Sommerzeit)
      end = new Date(Date.UTC(y, m, d, 10, 0, 0));   // bis ca. 12:00 lokal
      break;
    case 'noon':
      start = new Date(Date.UTC(y, m, d, 10, 0, 0)); // ~12:00 lokal
      end = new Date(Date.UTC(y, m, d, 16, 0, 0));   // bis ca. 18:00 lokal
      break;
    case 'afternoon':
      start = new Date(Date.UTC(y, m, d, 16, 0, 0)); // ~18:00 lokal
      end = new Date(Date.UTC(y, m, d, 22, 0, 0));   // Abend
      break;
    default:
      start = new Date(Date.UTC(y, m, d, 22, 0, 0)); // Rest des Tages / Nacht
      end = new Date(Date.UTC(y, m, d + 1, 4, 0, 0)); // bis 06:00 nächster Tag
      break;
  }

  return { window_start: start, window_end: end };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const window_label = (body.window_label as WindowLabel) || 'morning';
    const categories: string[] = Array.isArray(body.categories) && body.categories.length ? body.categories : CATEGORIES;

    const supabase = getSupabaseServiceClient();

    const { start: todayStart, end: todayEnd } = getTodayRangeUTC();
    const { window_start, window_end } = computeWindowBounds(window_label);

    const results: Array<{ category: string; ok: boolean; count: number; error?: string }> = [];

    for (const category of categories) {
      let retryCount = 0;
      const MAX_RETRIES = 3;
      let success = false;

      while (retryCount < MAX_RETRIES && !success) {
        try {
          // 1) Live-Daten über bestehende Edge Function holen (nicht vom Client aufrufen!)
          const { data: tickerData, error: tickerError } = await supabase.functions.invoke('ingolstadt-live-ticker', {
            body: { category },
          });

          if (tickerError) {
            throw new Error(tickerError.message || 'ticker error');
          }

          // Struktur robust interpretieren
          const payload = tickerData?.events || tickerData?.items || tickerData || [];
          const sources = tickerData?.sources || tickerData?.grounding_sources || [];

          if (!Array.isArray(payload) || payload.length === 0) {
            throw new Error('No events available');
          }

          // 2) Snapshot einfügen
          const isoNow = new Date().toISOString();
          const { error: insertError } = await supabase.from('ingolstadt_live_snapshots').insert({
            category,
            payload,
            sources,
            window_label,
            window_start: toISO(window_start),
            window_end: toISO(window_end),
            generated_at: isoNow,
          });

          if (insertError) {
            throw new Error(insertError.message || 'insert error');
          }

          // 3) Alte Snapshots für HEUTE nach erfolgreichem Insert bereinigen (sicherer)
          await supabase
            .from('ingolstadt_live_snapshots')
            .delete()
            .eq('category', category)
            .eq('window_label', window_label)
            .gte('generated_at', toISO(todayStart))
            .lt('generated_at', isoNow);

          results.push({ 
            category, 
            ok: true, 
            count: Array.isArray(payload) ? payload.length : 0,
            retriesNeeded: retryCount 
          });
          success = true;

        } catch (error) {
          retryCount++;
          console.error(`❌ Error processing ${category} (attempt ${retryCount}/${MAX_RETRIES}):`, error);
          
          if (retryCount < MAX_RETRIES) {
            const delayMs = 5000 * retryCount; // Exponential backoff: 5s, 10s, 15s
            console.log(`⏳ Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            results.push({ 
              category, 
              ok: false, 
              count: 0, 
              error: error.message || 'unknown error',
              retriesAttempted: MAX_RETRIES
            });
          }
        }
      }
    }

    const okCount = results.filter(r => r.ok).length;
    const totalCount = results.length;

    return new Response(JSON.stringify({
      message: 'Refresh completed',
      window_label,
      results,
      okCount,
      totalCount,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e: any) {
    console.error('ingolstadt-live-refresh fatal error', e);
    return new Response(JSON.stringify({ error: e?.message || 'unexpected error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
