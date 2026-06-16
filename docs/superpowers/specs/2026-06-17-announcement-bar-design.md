# Ankündigungsbalken über dem Header

**Datum:** 2026-06-17
**Status:** Design freigegeben, Spec zur Umsetzung

## Ziel

Ein vom Admin steuerbarer Balken **über dem Header** auf allen öffentlichen Seiten: freier Text, global an-/ausschaltbar, Farbe wählbar (Presets + eigener Hex). Besucher können ihn per X wegklicken; bei neuem Text erscheint er wieder.

## Festgelegte Entscheidungen (Brainstorming)

1. **Schalten:** Admin-Schalter (global an/aus) **+** Besucher-X (im Browser gemerkt; erscheint bei neuem Text wieder).
2. **Farbe:** Brand-Presets (Teal/Gelb/Grün/Dark/Rot, je mit passender Textfarbe) **+** optional eigener Hex (BG + Text).
3. **Platzierung:** über `<Header />` in der öffentlichen Layout-Hülle; auf allen `(public)`-Seiten.
4. **Admin-Steuerung:** Modal-Editor, geöffnet über einen „Banner"-Button auf der Übersicht.

## Ist-Zustand (verifiziert)

- Header wird in `src/app/(public)/layout.tsx:14` als `<div className="no-print"><Header /></div>` gerendert → Balken kommt direkt davor.
- Keine Settings-/Config-Tabelle für so etwas (nur `bee_rate_config`). → neue Tabelle nötig.
- Admin ist modular: `useAdminData.jsx` (State/Handler), `AdminShell.jsx` (JSX, inkl. „Ankündigung senden"-Button + Broadcast-Modal als Vorbild).
- `logAdmin(action, targetType, targetLabel, detail)` existiert (Audit-Log).

## Feature 1 — Tabelle `site_announcement` (Migration)

Einzeilige Tabelle (Singleton, `id = 1`):
```sql
CREATE TABLE IF NOT EXISTS public.site_announcement (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#0E9493',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_announcement (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.site_announcement ENABLE ROW LEVEL SECURITY;
-- Öffentlich lesbar (auch anon, zum Anzeigen)
CREATE POLICY ann_select ON public.site_announcement FOR SELECT USING (true);
-- Nur Admin schreibt
CREATE POLICY ann_update ON public.site_announcement FOR UPDATE
  USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0')
  WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
```
Anwenden via MCP `apply_migration` (Controller) + als Datei in `supabase/migrations/`.

## Feature 2 — `src/lib/announcement.js` (neu)

```js
import { supabase } from "@/lib/supabase/supabase";

export const ANNOUNCEMENT_PRESETS = [
  { name: "Teal", bg: "#0E9493", text: "#FFFFFF" },
  { name: "Gelb", bg: "#F4C03F", text: "#191615" },
  { name: "Grün", bg: "#5B8C5A", text: "#FFFFFF" },
  { name: "Dark", bg: "#191615", text: "#FFFFFF" },
  { name: "Rot",  bg: "#EB5E55", text: "#FFFFFF" },
];

export async function getAnnouncement() {
  const { data } = await supabase.from("site_announcement").select("*").eq("id", 1).maybeSingle();
  return data || null;
}
```

## Feature 3 — `src/components/layout/AnnouncementBar.jsx` (neu, Client)

- `useEffect` → `getAnnouncement()`.
- Anzeige nur wenn `a.enabled && a.message?.trim() && localStorage.getItem("beedaro_ann_dismissed") !== a.updated_at`.
- Render: volle Breite, `background: a.bg_color`, `color: a.text_color`, zentrierter Text (kleines Megafon-Icon), rechts ein **X**-Button.
- **X** → `localStorage.setItem("beedaro_ann_dismissed", a.updated_at)` + lokales Ausblenden (State).
- SSR-sicher: erst nach Mount rendern (localStorage nur im Browser); vor Mount nichts (kein Layout-Shift-Problem, da Balken optional).

## Feature 4 — Einhängen in `(public)/layout.tsx`

Direkt vor dem Header:
```jsx
<div className="no-print"><AnnouncementBar /></div>
<div className="no-print"><Header /></div>
```

## Feature 5 — Admin-Editor (`useAdminData.jsx` + `AdminShell.jsx`)

- **State** (`useAdminData`): `annOpen` (Modal offen), `ann` ({ enabled, message, bg_color, text_color }). Beim Öffnen aus `getAnnouncement()` laden (Fallback Defaults).
- **`saveAnnouncement()`**: `supabase.from("site_announcement").update({ enabled, message, bg_color, text_color, updated_at: new Date().toISOString() }).eq("id", 1)`; `flash`; `logAdmin("announcement_bar", "banner", enabled ? "an" : "aus")`; `setAnnOpen(false)`.
- **AdminShell:** „Banner"-Button auf der Übersicht (neben „Ankündigung senden"). Modal-Editor:
  - An/Aus-Schalter (Checkbox/Toggle).
  - Text-Feld (`message`).
  - Preset-Reihe (`ANNOUNCEMENT_PRESETS`): Klick setzt `bg_color`+`text_color`. Dazu zwei Hex-Felder (BG + Text) für eigene Farben.
  - **Live-Vorschau** des Balkens (mit aktuellem bg/text/message).
  - „Speichern" / „Abbrechen".
- Audit-Log: `announcement_bar` → in `AUDIT_META` ergänzen (Label „Banner geändert", Icon Megaphone).

## Dateien

- **Migration:** `supabase/migrations/20260617_site_announcement.sql` (Tabelle + RLS + Default-Zeile).
- **Create:** `src/lib/announcement.js`, `src/components/layout/AnnouncementBar.jsx`.
- **Modify:** `src/app/(public)/layout.tsx` (Bar einhängen), `src/components/admin/useAdminData.jsx` (State/Save), `src/components/admin/AdminShell.jsx` (Button + Modal + AUDIT_META), `src/app/(public)/beta/page.jsx` (Checkliste).

## Verifizierung (live, KEIN `npm run build`)

- Migration: Tabelle + Policies da; anon kann SELECT (Balken lädt auch ausgeloggt).
- Admin: „Banner" → Modal; Text + Preset/Hex + Vorschau; Speichern; an-/ausschalten wirkt.
- Öffentlich: Balken über dem Header auf `/` (und einer Unterseite); korrekte Farbe/Text; **X** blendet aus + bleibt nach Reload aus; nach Text-Änderung im Admin (neues `updated_at`) erscheint er wieder.
- Ausgeloggt sichtbar (anon SELECT). Keine Konsolen-/Overlay-Fehler.
- Testdaten danach auf Baseline (Balken wieder „aus").

## Beta-Checkliste (Sektion „Navigation & Header")

- `ann_bar_admin`: Admin „Banner": Text/Farbe (Presets+Hex)/An-Aus mit Live-Vorschau, Speichern wirkt.
- `ann_bar_public`: Balken über dem Header sichtbar (auch ausgeloggt); X blendet aus, bleibt nach Reload aus; neuer Text bringt ihn zurück.

## Out of Scope (bewusst)

- Klickbarer Link im Banner (später als optionales `link`-Feld).
- Mehrere/zielgruppenspezifische Banner, Zeitplanung, Mehrsprachigkeit.
- Banner auf Admin-Seiten (nur öffentliche `(public)`-Seiten).
