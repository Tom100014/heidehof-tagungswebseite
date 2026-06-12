# Clara Voice → Bestellung → Küche – Roadmap

## Status

✅ **Erledigt**
- Mobile-Layout der Eingabezeile gefixt (Textarea kollabiert nicht mehr)
- Stammdaten-Import-Button im Admin (`/admin/wissensbasis`)
- `clara-chat` Edge-Function läuft (200 OK in <500ms getestet)

## Offen – nächste Sprints

### Sprint A: Sprach-Bestellung (Konferenz/Restaurant)
**Ziel:** Gast sagt "Ich brauche 8x Schnitzel und 2x vegetarisch für Raum Berlin morgen 12 Uhr" → Clara erstellt Bestellung → Popup im Admin/Küche.

Schritte:
1. Neues Tool `create_conference_order` in `clara-chat/index.ts` (nutzt bereits existierende RPC `create_conference_order`).
2. ClaraRagChat: Tool-Call-Result als Toast + Realtime-Push an `/admin/conference-orders`.
3. AdminKitchen: bereits Realtime-Subscription auf `conference_orders` – nur Sound-Notification + visueller Pop-up-Layer fehlen.

### Sprint B: Cartesia-Sprachnavigation verifizieren & erweitern
**Ziel:** Die Cartesia-basierte Sprachsteuerung (im Footer) navigiert zuverlässig über das `show_heidehof_page`-Tool.

Status:
- ElevenLabs wurde vollständig durch Cartesia (Sonic-2 TTS + Ink-Whisper STT) in [ClaraCartesiaVoice.tsx](file:///Users/thomasschuh/hotel-dream-guide/src/components/clara/ClaraCartesiaVoice.tsx) abgelöst.
- Das Navigations-Tool `show_heidehof_page` (sowie `navigate_to_section`) ist in der Edge-Function [clara-chat/index.ts](file:///Users/thomasschuh/hotel-dream-guide/supabase/functions/clara-chat/index.ts) definiert.
- Der Client-seitige Event-Handler in `ClaraCartesiaVoice.tsx` (Zeilen 64-73 & 97-106) fängt diese Tool-Calls bereits ab und dispatcht die Events (`clara:open-page` und `clara:navigate-internal`), welche von UI-Overlays wie [HeidehofPageOverlay.tsx](file:///Users/thomasschuh/hotel-dream-guide/src/components/clara/HeidehofPageOverlay.tsx) verarbeitet werden.
- **Todo:** Verifizieren, dass die Routen/Sektionen nahtlos geladen werden, und ggf. weitere Navigationstools (z.B. spezielle Zielseiten) hinzufügen.

### Sprint C: Sprach-Assistent für Küche/Service
**Ziel:** Service-Personal sagt "Tisch 5 ist fertig" → System updatet Status.
Braucht: Erfordert einen separaten Mitarbeiter-Login + reduziertes Tool-Set.

## Empfehlung
Erst Sprint A (Bestellung), dann B (Navigation), dann C.
