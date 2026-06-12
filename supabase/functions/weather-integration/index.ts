import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let location = 'Ingolstadt';
    try {
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        location = body?.location ?? 'Ingolstadt';
      }
    } catch (_) {
      // ignore – use default
    }

    const latitude = 48.7665;
    const longitude = 11.4257;

    console.log(`Fetching 2-day weather forecast for ${location} (${latitude}, ${longitude})`);

    // Timeout-safe fetch (Open-Meteo is normally <1s; abort after 8s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&timezone=Europe/Berlin&forecast_days=2`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timeoutId));
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API returned ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    console.log('Real-time weather data received:', { current, daily });
    
    // Process today's weather (current conditions)
    const todayCondition = getWeatherCondition(current.weather_code);
    const todayIcon = getWeatherIconFromCode(current.weather_code);
    
    const today = {
      temp: Math.round(current.temperature_2m),
      condition: todayCondition,
      precipitation: Math.round(current.precipitation || 0),
      windSpeed: Math.round(current.wind_speed_10m),
      humidity: Math.round(current.relative_humidity_2m),
      icon: todayIcon,
      recommendation: getWeatherRecommendation(current.temperature_2m, todayCondition)
    };
    
    // Process tomorrow's weather (from daily forecast)
    const tomorrowCondition = getWeatherCondition(daily.weather_code[1]);
    const tomorrowIcon = getWeatherIconFromCode(daily.weather_code[1]);
    const tomorrowAvgTemp = Math.round((daily.temperature_2m_max[1] + daily.temperature_2m_min[1]) / 2);
    
    const tomorrow = {
      temp: tomorrowAvgTemp,
      tempMax: Math.round(daily.temperature_2m_max[1]),
      tempMin: Math.round(daily.temperature_2m_min[1]),
      condition: tomorrowCondition,
      precipitation: Math.round(daily.precipitation_sum[1] || 0),
      windSpeed: Math.round(daily.wind_speed_10m_max[1]),
      icon: tomorrowIcon,
      recommendation: getWeatherRecommendation(tomorrowAvgTemp, tomorrowCondition)
    };
    
    console.log('Processed weather:', { today, tomorrow });
    
    return new Response(
      JSON.stringify({
        success: true,
        today,
        tomorrow,
        location,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Weather API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Wetter-Daten konnten nicht geladen werden'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Map WMO Weather codes to German conditions
function getWeatherCondition(code: number): string {
  const conditionMap: Record<number, string> = {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bewölkt',
    45: 'Neblig',
    48: 'Neblig mit Reifablagerung',
    51: 'Leichter Nieselregen',
    53: 'Mäßiger Nieselregen',
    55: 'Starker Nieselregen',
    61: 'Leichter Regen',
    63: 'Mäßiger Regen',
    65: 'Starker Regen',
    71: 'Leichter Schneefall',
    73: 'Mäßiger Schneefall',
    75: 'Starker Schneefall',
    77: 'Schneegriesel',
    80: 'Leichte Regenschauer',
    81: 'Mäßige Regenschauer',
    82: 'Starke Regenschauer',
    85: 'Leichte Schneeschauer',
    86: 'Starke Schneeschauer',
    95: 'Gewitter',
    96: 'Gewitter mit leichtem Hagel',
    99: 'Gewitter mit starkem Hagel'
  };
  
  return conditionMap[code] || 'Unbekannt';
}

function getWeatherIconFromCode(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌧️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  
  return '🌤️';
}

function getWeatherRecommendation(temp: number, condition: string): string {
  if (temp > 20 && condition === 'Clear') {
    return 'Perfektes Wetter für Outdoor-Aktivitäten und Sightseeing!';
  } else if (temp < 10) {
    return 'Warm anziehen! Ideal für Museen und Indoor-Aktivitäten.';
  } else if (condition.includes('Rain')) {
    return 'Regenwetter - perfekt für Wellness und überdachte Aktivitäten.';
  }
  
  return 'Angenehmes Wetter für alle Aktivitäten!';
}