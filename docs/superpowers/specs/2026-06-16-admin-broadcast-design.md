# Admin Broadcast / Ankündigung (Welle 3, Teil 1)

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Review

## Ziel

Der Admin kann eine Ankündigung als In-App-Benachrichtigung an alle (oder ein Segment der) Nutzer
senden — über einen Composer mit Zielgruppe, Live-Empfängerzahl und Vorschau. Erscheint bei den
Nutzern in der Glocke (NotificationBell).

## Festgelegte Entscheidungen (Brainstorming)

1. **Zielgruppe:** Alle + einfacher Segment-Filter (Alle / Privat / Unternehmen via `profiles.account_type`).
2. **Auslöser:** Button „Ankündigung senden" auf der Übersicht → Composer-**Modal** (kein eigener Nav-Tab).
3. **Kanal:** In-App-Notification (Glocke), Typ `announcement`. Kein E-Mail-Versand.

## Kontext (verifiziert)

- `notifications`-Spalten: `id, user_id, type, title, message, link, is_read, created_at`.
- **RLS:** INSERT-Policy „System can insert notifications" mit `with check (true)` → der Admin darf
  Notifications für beliebige `user_id` anlegen. **Kein DB-Umbau / keine RLS-Änderung nötig.**
- Lese-/Anzeigepfad: `src/components/shared/NotificationBell.jsx` rendert `type` → Icon (Map `ICONS`),
  `title`, `message`, `is_read`, `link`. Korrekte Notification-Lib: `src/lib/api/notifications.js`
  (schreibt `message`/`is_read`).
- Admin lädt bereits alle Profile in `users` (mit `account_type`) → Empfängerzahl + Zielliste client-seitig.
- **Vorgefundener Alt-Bug (separat, nicht Teil dieser Spec):** `src/lib/notifications.js` (alt) schreibt
  `body`/`read` statt `message`/`is_read` und passt nicht zur Tabelle; wird u.a. von `src/lib/api/invoices.js`
  importiert → diese Notifications schlagen vermutlich still fehl. Separat fixen (dem User gemeldet).

## Feature — Ankündigungs-Composer

### State (Admin)
```js
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcSegment, setBcSegment] = useState("all"); // all | private | business
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcLink, setBcLink] = useState("");
  const [bcSending, setBcSending] = useState(false);
```

### Zielliste + Empfängerzahl (vor `return`, aus geladenen `users`)
```js
  const bcTargets = users.filter(u =>
    bcSegment === "all" ? true :
    bcSegment === "business" ? u.account_type === "business" :
    u.account_type !== "business"); // "private" inkl. null/Default
```
„Geht an {bcTargets.length} Nutzer" wird live im Modal angezeigt.

### Senden (Batch-Insert, kein RPC nötig)
```js
  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) return;
    setBcSending(true);
    const rows = bcTargets.map(u => ({
      user_id: u.id, type: "announcement",
      title: bcTitle.trim(), message: bcMessage.trim(),
      link: bcLink.trim() || null, is_read: false,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    setBcSending(false);
    if (error) { flash("Fehler beim Senden"); return; }
    flash(`Ankündigung an ${rows.length} Nutzer gesendet`);
    setBroadcastOpen(false); setBcTitle(""); setBcMessage(""); setBcLink(""); setBcSegment("all");
  };
```

### Auslöser-Button (Übersicht)
Im `{tab === "overview" && ( … )}`-Block, ganz oben (vor dem Stat-Karten-Grid), eine rechtsbündige Zeile:
```jsx
<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
  <button onClick={() => setBroadcastOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.dark, color: "#fff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
    <Megaphone size={15} /> Ankündigung senden
  </button>
</div>
```
(`Megaphone` aus lucide-react importieren.)

### Composer-Modal
Vor dem Toast rendern (analog `mahnModal`): dunkler Kopf mit Megafon + „Ankündigung senden"; Felder:
- **Zielgruppe**-Pills (Alle / Privat / Unternehmen) → `setBcSegment`; daneben „geht an N Nutzer".
- **Titel** (`<input>` → `bcTitle`).
- **Nachricht** (`<textarea>` → `bcMessage`).
- **Link (optional)** (`<input>` → `bcLink`, Platzhalter z.B. `/listings/new`).
- **Vorschau in der Glocke**: Megafon-Icon + `bcTitle` + `bcMessage` (Live).
- Footer: „Abbrechen" (schließt, ohne zu senden) und „An {bcTargets.length} Nutzer senden" (ruft `sendBroadcast`; disabled wenn Titel/Nachricht leer, N=0, oder `bcSending`).

### NotificationBell — Icon für `announcement`
In `src/components/shared/NotificationBell.jsx`: `Megaphone` zum lucide-Import ergänzen und in der `ICONS`-Map
`announcement: Megaphone,` hinzufügen (sonst Fallback `Bell`).

## Dateien

- **Modify:** `src/app/(public)/admin/page.jsx` (State, `bcTargets`, `sendBroadcast`, Button, Composer-Modal, `Megaphone`-Import).
- **Modify:** `src/components/shared/NotificationBell.jsx` (Icon-Map + Import).
- **Modify:** `src/app/(public)/beta/page.jsx` (Checkliste).
- Keine DB-Migration.

## Out of Scope (bewusst)

- Echter E-Mail-Versand der Ankündigung.
- Broadcast-Historie (eigene Tabelle/Übersicht gesendeter Ankündigungen).
- Zeitplanung / wiederkehrende Ankündigungen.
- Reichere Segmentierung (aktive Verkäufer, offene Rechnung, Region).
- Fix des Alt-Bugs in `src/lib/notifications.js` (separat).

## Verifizierung

- Live als Admin (`/admin`, Dev-Server läuft; KEIN `npm run build`).
- Button öffnet Composer; Empfängerzahl stimmt mit Segment (Alle/Privat/Unternehmen).
- Senden an ein kleines Segment (z.B. „Unternehmen") → Notifications-Rows entstehen (per SQL-Check),
  Toast zeigt die Anzahl. **Test-Sauberkeit:** die im Test erzeugten `announcement`-Notifications danach
  per SQL wieder löschen (kein Zumüllen der Test-Konten).
- Empfänger-Sicht: eine erzeugte Notification erscheint in der Glocke mit Megafon-Icon, Titel, Text.
- Validierung: leeres Titel/Nachricht-Feld → Senden disabled. Zeggy-Baseline unverändert.

## Beta-Checkliste (Sektion „Admin-Bereich")

- `adm_broadcast_open`: „Ankündigung senden"-Button auf der Übersicht öffnet den Composer.
- `adm_broadcast_segment`: Zielgruppe Alle/Privat/Unternehmen ändert die Live-Empfängerzahl.
- `adm_broadcast_send`: Senden legt In-App-Notifications an; Empfänger sehen sie in der Glocke (Megafon-Icon).
- `adm_broadcast_validate`: leeres Titel/Nachricht-Feld lässt sich nicht senden.
