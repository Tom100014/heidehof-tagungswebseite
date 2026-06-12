## Ziel
Ausbau von `/admin/leads` zu einem vollautomatisierten B2B-Akquise- & Marketing-System, spezialisiert auf den Verkauf der Heidehof-Tagungsräume. Bestehende Tabs, Tabellen und Edge Functions bleiben erhalten und werden erweitert. Öffentliche Website bleibt unverändert.

## Etappen-Empfehlung
Der Umfang ist sehr groß. Vorschlag: in **zwei Etappen** umsetzen, damit jede Etappe sauber getestet werden kann. Wenn du lieber alles in einem Rutsch willst, sag Bescheid — dann mache ich es als einen großen Lauf.

**Etappe 1 — Datenmodell, Pipeline & echtes Dashboard** (dieser Plan)
**Etappe 2 — Outreach-Automation, Tracking, Sequenzen, Inbound-Brücke** (folgt nach Abnahme von Etappe 1)

---

## Etappe 1 — Inhalt

### 1. Datenmodell (Migration)
Neue/erweiterte Tabellen in `public` mit RLS (admin + neue Rolle `sales`), GRANTs, `updated_at`-Trigger:

- **`leads` erweitern**: `lead_score int default 0`, `owner_id uuid`, `tags text[]`, `last_activity_at timestamptz`, `do_not_contact bool default false`, `enrichment_json jsonb`, `contact_role text`, `employee_count int`, `country text default 'DE'`. Status-Enum erweitern um: `enriched, opened, clicked, replied, qualified, offer, won, lost, no_interest`.
- **`pipeline_deals`** (neu): `lead_id`, `stage` (enum: `lead, first_contact, qualified, viewing_offer, negotiation, won, lost`), `estimated_value numeric`, `event_type` (Tagung/Seminar/Workshop/Firmenfeier), `expected_persons int`, `expected_date date`, `probability int`, `room_interest uuid[]` (FK lose auf `conference_rooms`), `notes text`, `owner_id`.
- **`email_sequences`** (neu): `id`, `campaign_id`, `name`, `is_active`.
- **`sequence_steps`** (neu): `sequence_id`, `step_order int`, `wait_days int`, `template_id`, `condition` (jsonb: z.B. `{not_opened: true}`).
- **`email_events`** (neu): `lead_id`, `draft_id`, `campaign_id`, `type` (sent/delivered/opened/clicked/bounced/replied/unsubscribed), `metadata jsonb`, `occurred_at`.
- **`lead_activities`** (neu): `lead_id`, `actor_id`, `type` (email/call/note/status_change/stage_change), `payload jsonb`, `occurred_at` — chronologischer Verlauf.

Erweiterung `app_role`-Enum um `sales` (falls nicht vorhanden), neue Helper-Funktion `has_sales_access(uid)` (= admin oder sales).

### 2. Sales-Pipeline (neuer Tab "Pipeline")
- Route `/admin/leads/pipeline` in `LeadsLayout` einhängen.
- Kanban-Board (Drag&Drop via `@dnd-kit/core`) über die Deal-Stages.
- Pro Spalte: Anzahl Deals + Summe `estimated_value` €.
- Karte zeigt: Firma, Kontakt, Score-Badge, erwarteter Wert, nächste Aktivität.
- Detail-Drawer beim Klick: Lead-Stammdaten, vollständiger `lead_activities`-Verlauf, alle `email_events`, Notizen, Schnellaktionen (Status ändern, Stage verschieben, Notiz hinzufügen, „In Tagungs-Anfrage umwandeln" → schreibt in `tagungs_inquiries`).

### 3. Echtes Dashboard (Tab "Übersicht" ersetzen)
`LeadsDashboard.tsx` neu aufbauen mit Live-KPIs aus den realen Tabellen:
- Leads gesamt / neue (7/30 Tage) / kontaktiert / qualifiziert.
- Öffnungsrate, Klickrate, Antwortrate (aus `email_events`, in Etappe 1 noch 0%, ab Etappe 2 echt).
- Pipeline-Wert €, gewonnene Buchungen, Conversion-Rate.
- **Funnel-Visualisierung**: Lead → Kontaktiert → Geantwortet → Qualifiziert → Gewonnen (mit Drop-off-%).
- Performance je Kampagne (Tabelle) und je Branche (Balken).
- Aktivitäts-Feed (letzte 20 `lead_activities`).
- Lade-Skeletons statt „—".

### 4. Lead-Detail-Seite aufwerten
Bestehende Lead-Liste (`/admin/leads/list`) bekommt:
- Score-Badge, Tags, Letzte-Aktivität-Spalte, Filter nach Status/Score/Stage.
- Detail-Sheet mit Anreicherungs-JSON, Aktivitätsverlauf, „Zu Deal machen"-Button.

### 5. Design & UX
- Konsistent im bestehenden Heidehof-Dark/Gold-Admin-Stil über `HeidehofAdminLayout` und `AdminPageHeader`.
- Voll responsive, Lade-Skeletons, deutsche Beschriftungen, DSGVO-Hinweise.
- Keine Änderungen an bestehender Versand-Logik, Kampagnen-Erstellung oder `lead-agent`-Edge-Function.

### 6. Sicherheit
- RLS-Policies: admins + sales lesen/schreiben, andere keinen Zugriff.
- `service_role` GRANTs für alle neuen Tabellen (Edge-Functions Etappe 2).
- `do_not_contact`/`unsubscribed` strikt in allen Selects beachten.

---

## Etappe 2 — Vorschau (kommt nach Abnahme)
- Open-Pixel + Klick-Redirect-Edge-Function, `email_events` befüllen.
- Multi-Step-Sequenzen-Engine erweitert `lead-automation-tick`.
- Reply-Erkennung via Resend-Webhook → Status `replied`, Sequenz stoppen.
- Inbound-Brücke: Tagungsanfragen vom öffentlichen Formular → Lead + Deal automatisch.
- Auto-Scoring-Function (Größe, Nähe Ingolstadt, Branche, E-Mail-Validität).
- Anreicherung via Google Places / Hunter / Firecrawl / Apollo (mit Fallback wenn Key fehlt).
- Optionaler HubSpot-Sync, Twilio-SMS für Hot-Leads.

---

## Technische Details
- Migration in einer Datei, mit GRANTs in korrekter Reihenfolge (CREATE → GRANT → ENABLE RLS → POLICY).
- `@dnd-kit/core` installieren für Kanban.
- Neue Komponenten unter `src/components/admin/leads/` (PipelineBoard, DealCard, DealDrawer, FunnelChart, KpiGrid, ActivityFeed).
- Neue Hooks: `useLeadPipeline`, `useLeadKpis`, `useLeadActivities`.
- App.tsx: Route `/admin/leads/pipeline` ergänzen.
- `LeadsLayout`: Tab „Pipeline" zwischen „Leads" und „Versand-Center" einfügen.

## Dateien (Etappe 1)
- **Neu**: Migration; `src/pages/admin/leads/LeadsPipeline.tsx`; `src/components/admin/leads/{PipelineBoard,DealCard,DealDrawer,FunnelChart,KpiGrid,ActivityFeed}.tsx`; Hooks.
- **Bearbeiten**: `src/pages/admin/leads/LeadsDashboard.tsx` (komplett neu), `LeadsLayout.tsx` (Tab), `LeadsList.tsx` (Score/Drawer), `src/App.tsx` (Route).

## Bestätigung
Soll ich **Etappe 1 wie oben** starten, oder bevorzugst du den **kompletten Big-Bang** in einem Lauf (höheres Risiko, längere Antwort)?
