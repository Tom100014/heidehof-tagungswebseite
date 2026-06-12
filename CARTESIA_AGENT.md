# Cartesia Code-Mode Agent (Clara)

This repo's `main.py` is the entrypoint Cartesia runs for agent
`agent_gjYusgM21heczyikufbJ4P` (template `at_basic_chat`) when the agent is
connected to GitHub in **code mode**.

## Was registriert wird

Sieben ausfuehrbare Tool-Funktionen, die alle gegen die Supabase Edge-Function
`cartesia-phone-handler` POSTen und damit direkt in die richtigen Admin-Tabellen
schreiben:

| Tool | Zieltabelle |
|---|---|
| `get_call_context` | `phone_call_contexts` (read) |
| `send_inquiry` | `tagungs_inquiries` |
| `create_conference_order` | `conference_orders` |
| `make_table_reservation` | `restaurant_reservations` |
| `request_wellness_appointment` | `wellness_appointments` / Beauty |
| `submit_complaint` | `complaints` |
| `take_restaurant_order` | `orders` / Restaurant |

Zusaetzlich: `end_call` und `transfer_call` aus dem Line-SDK.

## Konfiguration (in Cartesia Secrets setzen)

| Variable | Pflicht | Default |
|---|---|---|
| `CARTESIA_WEBHOOK_URL` | nein | `https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-phone-handler` |
| `CARTESIA_WEBHOOK_SECRET` | optional | leer – wenn gesetzt, MUSS gleicher Wert auch als Edge-Function-Secret stehen |
| `CARTESIA_AGENT_ID` | nein | `agent_gjYusgM21heczyikufbJ4P` |
| `CARTESIA_LLM_MODEL` | nein | `gemini/gemini-2.5-flash` |
| `GEMINI_API_KEY` *(oder OPENAI_API_KEY / ANTHROPIC_API_KEY)* | **ja** | – |

## Deploy

Cartesia deployt automatisch bei `git push` auf den verbundenen Branch.
Anschliessend im Cartesia-Dashboard pruefen, dass die 7 Tools als Functions
gelistet sind und einen Testanruf starten.
