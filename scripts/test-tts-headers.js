import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function main() {
  const url = `${supabaseUrl}/functions/v1/clara-tts`;
  console.log("Calling TTS URL:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify({
        text: "Dies ist ein Test für Max Stimme.",
        persona: "max"
      }),
    });
    console.log("Response Status:", res.status);
    console.log("Response Headers:");
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      const json = await res.json();
      console.log("Response JSON:", json);
    } else {
      console.log("Response is binary, content type:", contentType);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

main();
