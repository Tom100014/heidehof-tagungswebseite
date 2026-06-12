# Heidehof Hotel-Agent Architektur

## Ziel

Eine Clara-Intelligenz bedient mehrere professionelle Eingangskanäle:

- Website-Clara: Seitenkontext, Chat, Voice, visuelle Führung.
- Telefon-Clara: Cartesia Agent, Rückruf/Telefonie, Call-Transkript.
- QR/Bestelllink: strukturierte Bestellung für Tisch, Zimmer, Bar, Liege oder Tagungsraum.
- Admin: einheitliche Vorgänge für Service, Küche, Tagung, Rezeption und Direktion.

## Grundregel

Kein neuer Kanal darf eigene Hoteldaten, eigene Kategorien oder eigene Admin-Logik erfinden. Jeder Kanal muss denselben Kontext und dieselben Vorgangstypen nutzen:

- `restaurant_orders`
- `room_orders`
- `conference_orders`
- `tagungs_inquiries`
- `complaints`
- `wellness_appointments`
- `phone_agent_calls`

## Website- und Telefon-Kontext

Jeder Start von Clara oder Telefon-Clara muss einen `ClaraInquiryContext` erhalten:

- aktuelle Route
- sichtbare Sektion
- Produkt oder Raum
- Kategorie
- Trigger
- Uhrzeit, Datum, Wetter, sofern vorhanden

Der Telefon-Rückruf erhält diesen Kontext als `metadata.clara_context`. Dadurch weiß der Telefonagent, ob ein Gast gerade Speisekarte, Getränkekarte, Tagungsraum, Wellness oder Pauschalen betrachtet.

## Admin-Modi

`assistant_mode` steuert nur die Sichtbarkeit der Kanäle:

- `both`: Website-Clara und Telefon-Rückruf aktiv.
- `clara_only`: nur Website-Clara.
- `phone_only`: Section-Buttons starten Telefon-Rückruf statt Web-Clara.

Die Intelligenz bleibt in allen Modi Clara. Telefon ist kein separates Produkt, sondern ein Eingang in dasselbe Hotel-Agent-System.

## Nächste Ausbaustufen

1. Cartesia-Agent-Prompt auf `metadata.clara_context` ausrichten.
2. Telefonate nach dem Call automatisch in den passenden Admin-Vorgang überführen.
3. QR-Bestelllinks mit Ort-Typen ausstatten: Zimmer, Tisch, Bar, Terrasse, Liege, Tagungsraum.
4. POS/PMS-Schnittstelle vorbereiten: `external_system`, `external_id`, `sync_status`.
