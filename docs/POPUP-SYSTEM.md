# 🎉 Event Pop-up System - Hotel der Heidehof

## Übersicht

Das Event Pop-up System ermöglicht es, auffällige Pop-ups für Gäste zu erstellen, um auf Special-Angebote, Tagesmenüs und Events aufmerksam zu machen.

## 🎯 Features

### Admin-Bereich
- ✅ Event-Manager unter `/admin/popup-events`
- ✅ 10 vorkonfigurierte Event-Typen
- ✅ Zeitraum-Verwaltung (1-180 Tage)
- ✅ Produkt-Zuordnung
- ✅ Statistiken & Tracking
- ✅ Bild-Upload

### Frontend
- ✅ Automatisches Pop-up (3 Sekunden nach Seitenload)
- ✅ Session-Tracking (nur 1x pro Session)
- ✅ Luxuriöses Design mit Backdrop Blur
- ✅ Smooth Animations
- ✅ Detail-Seiten pro Event-Typ
- ✅ Responsive Design

## 📋 10 Event-Typen

| Event-Typ | Icon | Verwendung |
|-----------|------|------------|
| `daily_menu` | 🍽️ | Tagesmenü |
| `le_petit_chef` | 👨‍🍳 | Kinder-Koch-Event |
| `shop_highlight` | 🛍️ | Shop Produkt des Tages |
| `spa_month` | 💆 | Spa des Monats |
| `wellness_escape` | 🧘 | Wellness-Paket |
| `romantic_weekend` | 💝 | Romantik Wochenende |
| `business_lunch` | 💼 | Business Lunch |
| `afternoon_tea` | ☕ | Afternoon Tea |
| `seasonal_special` | 🎄 | Saisonales Special |
| `happy_hour` | 🍹 | Happy Hour |

## 🚀 Schnellstart

### 1. Event erstellen

1. Gehe zu `/admin/popup-events`
2. Klicke auf "Neues Event erstellen"
3. Wähle Event-Typ
4. Fülle Titel, Beschreibung, Zeitraum aus
5. Lade ein Bild hoch
6. Aktiviere das Event

### 2. Produkte hinzufügen

Derzeit müssen Produkte über SQL hinzugefügt werden:

```sql
INSERT INTO popup_event_products (
  event_id,
  product_type,
  product_name,
  product_description,
  product_price,
  product_image,
  display_order
) VALUES (
  '<your-event-id>',
  'restaurant',
  'Produkt Name',
  'Beschreibung',
  '€ 19,90',
  '/path/to/image.jpg',
  1
);
```

### 3. Testen

1. Öffne die Startseite (oder eine beliebige Seite)
2. Warte 3 Sekunden
3. Pop-up erscheint automatisch
4. Klicke auf "Details ansehen"
5. Event-Seite wird angezeigt

## 🎨 Hintergrundbilder pro Event-Typ

Die Event-Detail-Seiten (`/event/:eventType`) nutzen theme-spezifische Hintergrundbilder:

```typescript
const EVENT_BACKGROUNDS: Record<string, string> = {
  daily_menu: '/lovable-uploads/[dein-bild].png',
  spa_month: '/lovable-uploads/[spa-bild].png',
  // ... weitere
};
```

**Hinweis:** Aktuell nutzen alle Events das gleiche Hintergrundbild. Du kannst für jeden Event-Typ ein eigenes Bild hochladen und den Pfad in `src/pages/EventDetailPage.tsx` anpassen.

## 📊 Session-Tracking

Das System verhindert, dass das gleiche Pop-up mehrfach in einer Session angezeigt wird:

- Session-ID wird in `localStorage` gespeichert
- Bei jedem Pop-up-View wird die `popup_event_views` Tabelle aktualisiert
- Tracking umfasst:
  - `clicked_through`: Hat der Gast auf "Details ansehen" geklickt?
  - `dismissed`: Hat der Gast das Pop-up geschlossen?
  - `user_agent`: Browser-Info
  - `viewed_at`: Zeitstempel

## 🔧 Technische Details

### Datenbank-Tabellen

**popup_events**
- Event-Verwaltung
- Zeitraum-Logik
- Aktivierungsstatus

**popup_event_products**
- Produkt-Verknüpfung
- Display-Reihenfolge
- Produkt-Details

**popup_event_views**
- Session-Tracking
- Statistiken
- Klick-Tracking

### Supabase-Funktionen

**get_active_popup_event(session_id)**
- Holt aktives Event für Session
- Prüft Zeitraum
- Prüft ob bereits gesehen
- Gibt Event mit Produkten zurück

**mark_popup_event_viewed(event_id, session_id, clicked, dismissed)**
- Markiert Event als gesehen
- Speichert Interaktions-Daten
- Verhindert erneute Anzeige

## 🎯 Nächste Schritte

### Für Phase 5 (Zukünftig):

1. **Admin UI für Produkte**
   - Drag & Drop Produkt-Zuordnung
   - Bild-Upload für Produkte
   - Vorschau im Admin

2. **Erweiterte Statistiken**
   - Click-Through-Rate Dashboard
   - Conversion-Tracking
   - A/B Testing

3. **Theme-spezifische Backgrounds**
   - Upload pro Event-Typ
   - Background-Gallery im Admin
   - Auto-Optimierung

4. **Booking-Integration**
   - Direkt aus Pop-up buchen
   - Warenkorb-Integration
   - Reservation-System

## 📝 Beispiel-Workflow

```typescript
// 1. Gast öffnet Website
// 2. usePopupEvent Hook wird aktiviert

const { popupEvent, isVisible } = usePopupEvent();

// 3. Nach 3 Sekunden erscheint Pop-up
// 4. Gast klickt "Details ansehen"
// 5. Navigate zu /event/daily_menu
// 6. Event-Seite zeigt alle Produkte
// 7. Session wird getrackt
```

## 🐛 Troubleshooting

**Pop-up erscheint nicht:**
- Prüfe ob Event aktiv ist (`is_active = true`)
- Prüfe Zeitraum (`start_date` und `end_date`)
- Prüfe Browser-Console für Fehler
- Lösche `popup_session_id` aus localStorage

**Produkte werden nicht angezeigt:**
- Prüfe `popup_event_products` Tabelle
- Prüfe `event_id` Verknüpfung
- Prüfe `display_order`

**Session-Tracking funktioniert nicht:**
- Prüfe localStorage Permissions
- Prüfe Supabase RLS Policies
- Prüfe Browser Console

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe Browser Console
2. Prüfe Supabase Logs
3. Prüfe RLS Policies
4. Kontaktiere Entwickler

---

**Version:** 1.0.0  
**Erstellt:** 2025-01-29  
**Letzte Aktualisierung:** 2025-01-29
