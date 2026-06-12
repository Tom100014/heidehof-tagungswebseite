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
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from("app_settings").select("*");
  if (error) {
    console.error("Error loading settings:", error);
    return;
  }
  console.log("Current App Settings in Database:");
  data.forEach(row => {
    console.log(`Key: ${row.key}`);
    console.log(`Value:`, JSON.stringify(row.value, null, 2));
    console.log("------------------------");
  });

  const { data: prompts, error: promptsErr } = await supabase.from("clara_prompts").select("*").order("sort_order");
  if (promptsErr) {
    console.error("Error loading prompts:", promptsErr);
    return;
  }
  console.log("\n\nClara Prompts in Database:");
  prompts.forEach(p => {
    console.log(`Key: ${p.key}, Label: ${p.label}, Sort Order: ${p.sort_order}`);
    console.log(`Content:`, p.content);
    console.log("========================");
  });
}

main();
