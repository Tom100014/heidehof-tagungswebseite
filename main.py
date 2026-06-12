"""Cartesia voice agent (code-mode) for Hotel Heidehof / Clara.

This file is the entrypoint Cartesia executes when the agent runs in
Git/code-mode. It defines Clara's system prompt and registers 7 loopback
tools that forward to the Supabase Edge Function `cartesia-phone-handler`,
which persists the data into the correct admin tables.

Tools registered:
  - get_call_context
  - send_inquiry
  - create_conference_order
  - make_table_reservation
  - request_wellness_appointment
  - submit_complaint
  - take_restaurant_order

All tools share the same webhook contract (POST JSON):
  { "tool_name": <name>, "parameters": {...}, "session_id": ..., "agent_id": ... }
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

import httpx

from line.llm_agent import LlmAgent, LlmConfig, end_call, transfer_call
from line.voice_agent_app import VoiceAgentApp


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

WEBHOOK_URL = os.getenv(
    "CARTESIA_WEBHOOK_URL",
    "https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-phone-handler",
)
WEBHOOK_SECRET = os.getenv("CARTESIA_WEBHOOK_SECRET", "").strip()
AGENT_ID = os.getenv("CARTESIA_AGENT_ID", "agent_gjYusgM21heczyikufbJ4P")

# LLM provider (Cartesia code-mode uses any LiteLLM-compatible model).
LLM_MODEL = os.getenv("CARTESIA_LLM_MODEL", "gemini/gemini-2.5-flash")
LLM_API_KEY = (
    os.getenv("GEMINI_API_KEY")
    or os.getenv("GOOGLE_API_KEY")
    or os.getenv("OPENAI_API_KEY")
    or os.getenv("ANTHROPIC_API_KEY")
)


SYSTEM_PROMPT = """Du bist Clara, die digitale Hotel-Assistentin des Hotel Heidehof.
Sprich freundlich, ruhig, hotelprofessionell auf Deutsch (wechsle auf Englisch,
wenn der Gast Englisch spricht). Halte Antworten kurz und natuerlich.

ABLAUF:
1. Rufe direkt nach der Begruessung still `get_call_context` auf, um zu sehen,
   von welcher Seite/Sektion der Gast anruft. Sprich den Kontext nicht aus,
   nutze ihn nur als Hilfe.
2. Frage gezielt nach den fehlenden Daten je nach Anliegen.
3. Wiederhole vor dem Speichern eine kurze Zusammenfassung (`confirmed_summary`)
   und lass den Gast sie bestaetigen.
4. Erst NACH der Bestaetigung das passende Tool aufrufen:
   - Tagungs-/Event-Anfrage  -> send_inquiry
   - Tagungs-Menue           -> create_conference_order
   - Tischreservierung       -> make_table_reservation
   - Wellness/Spa-Termin     -> request_wellness_appointment
   - Beschwerde/Reklamation  -> submit_complaint
   - Restaurant/Bar/Zimmer-Bestellung -> take_restaurant_order
5. Bestaetige dem Gast danach kurz, dass die Anfrage an die Rezeption /
   das richtige Team weitergeleitet wurde.

DATENSCHUTZ:
- Erfasse nur, was wirklich gebraucht wird.
- Wenn der Gast keine Zimmernummer/Spa-Schluesselnummer hat, frage nach
  Name + E-Mail oder Telefon, damit das Team zurueckrufen kann.
- Erklaere kurz, dass die Daten nur fuer die Bearbeitung der Anfrage
  gespeichert werden.

Bei ungewoehnlichen Anliegen, bei denen kein Tool passt, biete an, an die
Rezeption weiterzuleiten (`transfer_call`) oder das Gespraech zu beenden
(`end_call`).
"""


# ---------------------------------------------------------------------------
# Webhook helper
# ---------------------------------------------------------------------------

async def _call_webhook(tool_name: str, parameters: dict, ctx: Any) -> str:
    """POST a tool invocation to the Supabase webhook and return a short
    natural-language confirmation the LLM can read back to the caller."""

    session_id = ""
    try:
        session_id = getattr(ctx, "session_id", "") or getattr(ctx, "call_id", "") or ""
    except Exception:
        session_id = ""

    payload = {
        "tool_name": tool_name,
        "parameters": parameters,
        "session_id": session_id,
        "agent_id": AGENT_ID,
    }
    headers = {"Content-Type": "application/json"}
    if WEBHOOK_SECRET:
        headers["x-cartesia-secret"] = WEBHOOK_SECRET

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(WEBHOOK_URL, json=payload, headers=headers)
        if r.status_code >= 400:
            return (
                f"Tool {tool_name} fehlgeschlagen (HTTP {r.status_code}). "
                "Bitte dem Gast sagen, dass die Rezeption sich kurz melden wird."
            )
        try:
            data = r.json()
        except Exception:
            return f"Tool {tool_name}: gespeichert."
        # get_call_context returns the actual context object – pass it through.
        if tool_name == "get_call_context":
            return json.dumps(data, ensure_ascii=False)
        msg = data.get("message") if isinstance(data, dict) else None
        return msg or "Erfolgreich gespeichert."
    except Exception as e:  # pragma: no cover
        return (
            f"Tool {tool_name} hatte einen Netzwerkfehler ({e}). "
            "Sage dem Gast, dass die Rezeption sich melden wird."
        )


# ---------------------------------------------------------------------------
# Tool definitions (loopback – result is fed back into the LLM)
# ---------------------------------------------------------------------------

async def get_call_context(ctx, context_token: Optional[str] = None) -> str:
    """Liest still den Website-/Button-Kontext des aktuellen Anrufers
    (Seite, Sektion, Produkt). Direkt nach der Begruessung aufrufen.

    Args:
        context_token: Optionaler Token aus den Call-Metadaten.
    """
    params = {"context_token": context_token} if context_token else {}
    return await _call_webhook("get_call_context", params, ctx)


async def send_inquiry(
    ctx,
    confirmed_summary: str,
    name: str,
    anlass: str,
    personen: str,
    email: Optional[str] = None,
    telefon: Optional[str] = None,
    firma: Optional[str] = None,
    datum: Optional[str] = None,
    nachricht: Optional[str] = None,
) -> str:
    """Speichert eine allgemeine Tagungs-/Event-Anfrage. Erst NACH Vorlesen
    und Bestaetigung der `confirmed_summary` aufrufen.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        name: Vollstaendiger Name des Anfragenden.
        anlass: Art der Veranstaltung.
        personen: Anzahl Personen (Text).
        email: E-Mail-Adresse, falls genannt.
        telefon: Telefonnummer, falls genannt.
        firma: Firma (optional).
        datum: Wunschdatum.
        nachricht: Freitext / besondere Wuensche.
    """
    return await _call_webhook(
        "send_inquiry",
        {
            "confirmed_summary": confirmed_summary,
            "name": name,
            "anlass": anlass,
            "personen": personen,
            "email": email,
            "telefon": telefon,
            "firma": firma,
            "datum": datum,
            "nachricht": nachricht,
        },
        ctx,
    )


async def create_conference_order(
    ctx,
    confirmed_summary: str,
    room_name: str,
    service_date: str,
    guest_name: str,
    participants: int,
    items: list[dict],
    meal_type: Optional[str] = None,
    company: Optional[str] = None,
    email: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Tagungs-/Seminar-Menuebestellung. Erst nach Bestaetigung aufrufen.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        room_name: Name des Tagungsraums.
        service_date: Servicedatum (YYYY-MM-DD).
        guest_name: Ansprechpartner.
        participants: Anzahl Teilnehmer.
        items: Liste von {dish, quantity, category?}.
        meal_type: breakfast | lunch | dinner | coffeebreak.
        company: Firma (optional).
        email: E-Mail.
        notes: Hinweise / Allergien.
    """
    return await _call_webhook(
        "create_conference_order",
        {
            "confirmed_summary": confirmed_summary,
            "room_name": room_name,
            "service_date": service_date,
            "guest_name": guest_name,
            "participants": participants,
            "items": items,
            "meal_type": meal_type,
            "company": company,
            "email": email,
            "notes": notes,
        },
        ctx,
    )


async def make_table_reservation(
    ctx,
    confirmed_summary: str,
    date: str,
    time: str,
    persons: int,
    name: str,
    telefon: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Tischreservierung Restaurant Maxwell / Bar Maex. Erst nach Bestaetigung.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        date: Datum (YYYY-MM-DD).
        time: Uhrzeit (HH:MM).
        persons: Anzahl Personen.
        name: Name des Gasts.
        telefon: Telefonnummer.
        notes: Wuensche, Allergien, Anlass.
    """
    return await _call_webhook(
        "make_table_reservation",
        {
            "confirmed_summary": confirmed_summary,
            "date": date,
            "time": time,
            "persons": persons,
            "name": name,
            "telefon": telefon,
            "notes": notes,
        },
        ctx,
    )


async def request_wellness_appointment(
    ctx,
    confirmed_summary: str,
    treatment: str,
    date: str,
    guest_name: str,
    time: Optional[str] = None,
    persons: Optional[int] = None,
    contact: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Wellness-/Spa-Terminwunsch. Erst nach Bestaetigung aufrufen.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        treatment: Behandlung.
        date: Wunschdatum (YYYY-MM-DD).
        guest_name: Name.
        time: Uhrzeit (HH:MM).
        persons: Anzahl Personen.
        contact: Telefon oder E-Mail.
        notes: Besondere Wuensche.
    """
    return await _call_webhook(
        "request_wellness_appointment",
        {
            "confirmed_summary": confirmed_summary,
            "treatment": treatment,
            "date": date,
            "guest_name": guest_name,
            "time": time,
            "persons": persons,
            "contact": contact,
            "notes": notes,
        },
        ctx,
    )


async def submit_complaint(
    ctx,
    confirmed_summary: str,
    category: str,
    description: str,
    urgency: Optional[str] = None,
    guest_name: Optional[str] = None,
    contact: Optional[str] = None,
    room_or_table: Optional[str] = None,
    desired_solution: Optional[str] = None,
) -> str:
    """Beschwerde / Reklamation aufnehmen. Erst nach Bestaetigung aufrufen.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        category: zimmer | restaurant | service | sauberkeit | technik | sonstiges.
        description: Was ist passiert.
        urgency: low | normal | high | critical.
        guest_name: Name.
        contact: Telefon oder E-Mail.
        room_or_table: Zimmer-/Tischnummer.
        desired_solution: Was wuenscht der Gast.
    """
    return await _call_webhook(
        "submit_complaint",
        {
            "confirmed_summary": confirmed_summary,
            "category": category,
            "description": description,
            "urgency": urgency,
            "guest_name": guest_name,
            "contact": contact,
            "room_or_table": room_or_table,
            "desired_solution": desired_solution,
        },
        ctx,
    )


async def take_restaurant_order(
    ctx,
    confirmed_summary: str,
    guest_name: str,
    items: list[dict],
    guest_type: Optional[str] = None,
    table_or_room: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Restaurant-/Bar-/Zimmer-Bestellung. Erst nach Bestaetigung aufrufen.

    Args:
        confirmed_summary: Vom Gast bestaetigte Zusammenfassung.
        guest_name: Name.
        items: Liste von {item, quantity, notes?}.
        guest_type: hotel_guest | extern | conference.
        table_or_room: Tischnummer oder Zimmer (bei Hotelgast).
        notes: Allgemeine Hinweise.
    """
    return await _call_webhook(
        "take_restaurant_order",
        {
            "confirmed_summary": confirmed_summary,
            "guest_name": guest_name,
            "items": items,
            "guest_type": guest_type,
            "table_or_room": table_or_room,
            "notes": notes,
        },
        ctx,
    )


CLARA_TOOLS = [
    get_call_context,
    send_inquiry,
    create_conference_order,
    make_table_reservation,
    request_wellness_appointment,
    submit_complaint,
    take_restaurant_order,
    end_call,
    transfer_call,
]


# ---------------------------------------------------------------------------
# Agent factory
# ---------------------------------------------------------------------------

SUPABASE_URL = os.getenv(
    "SUPABASE_URL", "https://qkwgqdyamomvaihbofbw.supabase.co"
)
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrd2dxZHlhbW9tdmFpaGJvZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDMyMTIsImV4cCI6MjA5MzY3OTIxMn0.DovpYAlaiIKy1D866tQ2ylpNqZrxJ6mxR7-lXkmcI0Y",
)


async def _load_full_prompt() -> str:
    """Lade den vollstaendigen, im Admin gepflegten Clara-Prompt
    (inkl. Speise-/Getraenke-/Wellness-Karte) aus app_settings.
    Faellt auf den eingebetteten Fallback-Prompt zurueck, wenn der
    Abruf scheitert."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/app_settings",
                params={"key": "eq.cartesia_agent_prompt", "select": "value"},
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                },
            )
        if r.status_code < 400:
            rows = r.json()
            if rows:
                v = rows[0].get("value")
                if isinstance(v, str) and v.strip():
                    return v
                if isinstance(v, dict):
                    text = v.get("prompt") or v.get("text")
                    if isinstance(text, str) and text.strip():
                        return text
    except Exception:
        pass
    return SYSTEM_PROMPT


async def get_agent(env, call_request):  # noqa: ARG001 - Cartesia API contract
    prompt = await _load_full_prompt()
    return LlmAgent(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        tools=CLARA_TOOLS,
        config=LlmConfig(
            system_prompt=prompt,
            introduction=(
                "Herzlich willkommen im Hotel Heidehof, hier ist Clara. "
                "Wie kann ich Ihnen helfen?"
            ),
        ),
    )



app = VoiceAgentApp(get_agent=get_agent)


if __name__ == "__main__":
    app.run()
