import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";

function getCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("restaurant") || t.includes("bar") || t.includes("tisch") || t.includes("speisekarte") || t.includes("menü")) {
    return "restaurant";
  }
  if (t.includes("spa") || t.includes("wellness") || t.includes("beauty") || t.includes("behandlung")) {
    return "spa";
  }
  if (t.includes("tagung") || t.includes("event") || t.includes("konferenz") || t.includes("seminar") || t.includes("pauschale")) {
    return "raum";
  }
  if (t.includes("outdoor") || t.includes("aktiv")) {
    return "outdoor";
  }
  if (t.includes("preis") || t.includes("kosten") || t.includes("gebühr")) {
    return "preise";
  }
  if (t.includes("kontakt") || t.includes("anfahrt") || t.includes("adresse")) {
    return "kontakt";
  }
  return "general";
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function main() {
  const filePath = resolve("fixes/heidehof-clara-knowledge.md");
  const content = readFileSync(filePath, "utf-8");

  // Split content by ## headers
  const sections = content.split(/\n## /);
  
  // The first section is the header info before the first ##, we can discard it or treat it as intro.
  // We'll skip the intro, since it just states "Hotel Der Heidehof - reine Hotelinformationen aus dem Backup...".
  const databaseEntries: Array<{ title: string; category: string; content: string; sort_order: number }> = [];
  let sortOrder = 10;

  for (let i = 1; i < sections.length; i++) {
    const rawSection = sections[i];
    const firstNewline = rawSection.indexOf("\n");
    if (firstNewline === -1) continue;

    const title = rawSection.slice(0, firstNewline).trim();
    const body = rawSection.slice(firstNewline).trim();

    // Skip section detailing what was NOT imported
    if (title.toLowerCase().includes("nicht in diese hotel-wissensdatei übernommen")) {
      console.log(`Skipping metadata section: ${title}`);
      continue;
    }

    const category = getCategory(title);
    databaseEntries.push({
      title,
      category,
      content: body,
      sort_order: sortOrder,
    });
    sortOrder += 10;
  }

  // Generate SQL
  let sql = `-- Migration: Import new hotel knowledge base\n`;
  sql += `-- Generated on ${new Date().toISOString()}\n\n`;
  sql += `DELETE FROM public.clara_knowledge;\n\n`;
  
  sql += `INSERT INTO public.clara_knowledge (title, category, content, sort_order, is_active) VALUES\n`;
  
  const valueBlocks = databaseEntries.map(entry => {
    return `  ('${escapeSql(entry.title)}', '${escapeSql(entry.category)}', '${escapeSql(entry.content)}', ${entry.sort_order}, true)`;
  });

  sql += valueBlocks.join(",\n") + ";\n";

  // Create timestamp for migration filename
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-T:]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS

  const migrationFilename = `${timestamp}_import_hotel_knowledge.sql`;
  const migrationPath = resolve(join("supabase/migrations", migrationFilename));

  writeFileSync(migrationPath, sql, "utf-8");
  console.log(`Successfully generated migration file: ${migrationPath}`);
  console.log(`Imported ${databaseEntries.length} sections.`);
}

main();
