# Admin Audit-Log (Welle 3, Teil 2)

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Review

## Ziel

Jede Admin-Aktion wird protokolliert (wer, was, wann, woran) und in einem eigenen „Protokoll"-Tab
als tages-gruppierte Timeline angezeigt — für Nachvollziehbarkeit und Support.

## Festgelegte Entscheidungen (Brainstorming)

1. **Speicherung:** neue Tabelle `admin_audit_log` (Migration), RLS nur fürs Admin-Konto.
2. **Erfassung:** client-seitiger Helfer `logAdmin(...)`, in alle Admin-Aktionen verdrahtet.
3. **Anzeige:** eigener Nav-Tab „Protokoll" — **Tages-Gruppen** (Heute/Gestern/Datum) + farbige Icon-Kreise + zweizeilige Einträge + Zeit/Admin rechts (v2-Layout). Suche. Read-only.

## Kontext (verifiziert)

- Keine bestehende Audit-/Log-Tabelle.
- Admin (`src/app/(public)/admin/page.jsx`) hat `user` (= eingeloggter Admin, `user.id`) und alle Handler:
  `toggleBan`, `resolveReport`, `pauseReportedListing`, `sendReminder`, `confirmAndReactivate`,
  `cancelOrder`, `toggleListingStatus`, ID-Verify/Reject (inline), `deleteReview`, `sendBroadcast`.
- `users` (alle Profile) ist geladen → Admin-Name + Ziel-Labels client-seitig auflösbar.
- ADMIN_ID = `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`.

## Feature 1 — Migration `admin_audit_log`

Neue Datei `supabase/migrations/<ts>_admin_audit_log.sql`:
```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text,
  target_label text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit_insert ON public.admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE POLICY admin_audit_select ON public.admin_audit_log
  FOR SELECT USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit_log (created_at DESC);
```
Anwenden via Supabase-MCP `apply_migration` (Controller).

## Feature 2 — Helfer `logAdmin` + Aktions-Metadaten (Admin)

State: `const [auditLog, setAuditLog] = useState([]);` (+ `auditLoading`, `auditQuery`).

Helfer (nutzt `user.id`, fire-and-forget, hält die Liste live):
```js
  const logAdmin = async (action, targetType, targetLabel, detail = null) => {
    const row = { admin_id: user?.id || null, action, target_type: targetType, target_label: targetLabel, detail };
    const { data } = await supabase.from("admin_audit_log").insert(row).select().maybeSingle();
    setAuditLog(prev => [data || { ...row, id: `tmp-${Date.now()}`, created_at: new Date().toISOString() }, ...prev]);
  };
```

Aktions-Metadaten (Modul-Level, Lucide-Icons): `AUDIT_META[action] = { label, Icon, color, bg }`. Fallback generisch.
```js
const AUDIT_META = {
  ban:                  { label: "Konto gesperrt",        Icon: Ban,         color: "#EB5E55", bg: "#FFEBEB" },
  unban:                { label: "Konto entsperrt",       Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_resolve:       { label: "Meldung erledigt",      Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_pause_listing: { label: "Inserat pausiert (Meldung)", Icon: Pause,  color: "#E65100", bg: "#FFF3E0" },
  listing_pause:        { label: "Inserat pausiert",      Icon: Pause,       color: "#E65100", bg: "#FFF3E0" },
  listing_activate:     { label: "Inserat aktiviert",     Icon: Play,        color: "#2E7D32", bg: "#E8F5E9" },
  reminder:             { label: "Mahnung gesendet",      Icon: BellRing,    color: "#E65100", bg: "#FFF3E0" },
  fee_paid:             { label: "Bezahlt + reaktiviert", Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  order_cancel:         { label: "Bestellung storniert",  Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  id_verify:            { label: "ID verifiziert",        Icon: ShieldCheck, color: "#0A7170", bg: "#E6F5F5" },
  id_reject:            { label: "ID abgelehnt",          Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  review_delete:        { label: "Bewertung gelöscht",    Icon: Star,        color: "#c62828", bg: "#FFEBEE" },
  broadcast:            { label: "Ankündigung gesendet",  Icon: Megaphone,   color: "#0E9493", bg: "#E6F5F5" },
};
```
(Alle Icons sind in `admin/page.jsx` bereits importiert: Ban, CheckCircle, Pause, Play, BellRing, XCircle, ShieldCheck, Star, Megaphone.)

## Feature 3 — Verdrahtung in die Handler

Je Aktion ein `logAdmin`-Aufruf (Ziel-Label aus vorhandenem Objekt oder Lookup aus State):

- `toggleBan(u)`: `logAdmin(u.is_banned ? "unban" : "ban", "user", u.display_name || u.username, { user_id: u.id })`
  (anhand des Vorzustands; `u.is_banned` ist hier der ALTE Wert, `next = !u.is_banned` → wenn `next` true → "ban").
  → konkret: `const next = !u.is_banned; … logAdmin(next ? "ban" : "unban", "user", u.display_name || u.username);`
- `resolveReport(reportId)`: `const r = reports.find(x => x.id === reportId); logAdmin("report_resolve", "report", r?.listingTitle || r?.reason || reportId);`
- `pauseReportedListing(reportId, listingId)`: `const r = reports.find(x => x.id === reportId); logAdmin("report_pause_listing", "listing", r?.listingTitle || listingId);`
- `sendReminder(inv, level, …)`: `logAdmin("reminder", "invoice", inv.invoice_ref, { level, seller: inv.sellerName });`
- `confirmAndReactivate(invId, sellerId)`: `const i = feeInvoices.find(x => x.id === invId); logAdmin("fee_paid", "invoice", i?.invoice_ref || invId);`
- `cancelOrder(orderId, listingId)`: `logAdmin("order_cancel", "order", makeBeeRef(orderId));`
- `toggleListingStatus(listingId, newStatus)`: `const l = listings.find(x => x.id === listingId); logAdmin(newStatus === "paused" ? "listing_pause" : "listing_activate", "listing", l?.title || listingId);`
- ID-Verify (inline-Button): `logAdmin("id_verify", "user", u.display_name);` · ID-Reject: `logAdmin("id_reject", "user", u.display_name);`
- `deleteReview(reviewId)`: `const rv = reviews.find(x => x.id === reviewId); logAdmin("review_delete", "review", rv ? `${rv.reviewerName} → ${rv.revieweeName}` : reviewId);`
- `sendBroadcast()`: nach erfolgreichem Insert `logAdmin("broadcast", "broadcast", bcTitle.trim(), { count: rows.length, segment: bcSegment });`

Logging ist additiv (kein Verhalten der Handler ändert sich); bei Insert-Fehler bleibt die Aktion selbst gültig.

## Feature 4 — „Protokoll"-Tab

- **Nav:** `{ key: "audit", label: "Protokoll", Icon: ScrollText }` (ScrollText aus lucide-react importieren).
- **Lazy-Load:** `useEffect(() => { if (tab === "audit") loadAudit(); }, [tab])` → `supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200)` in `auditLog`.
- **Suche** (Top-Bar, wie users/listings; Bedingung um `audit` erweitern): filtert nach `target_label` + dem Aktions-Label (`AUDIT_META[a.action]?.label`).
- **Render (v2):** chronologisch; beim Iterieren Tages-Header einfügen, wenn sich der Tag ändert:
  - `dayLabel(created_at)` = „Heute" / „Gestern" / `toLocaleDateString("de-CH", { weekday:"short", day:"numeric", month:"long" })`.
  - Zeile: links Icon-Kreis (34px, `bg`/`color` aus AUDIT_META, `<Icon size={17}>`), Mitte zwei Zeilen (fett = Label, evtl. „Stufe N"-Badge bei reminder aus `detail.level`; darunter `target_label`), rechts Zeit (`toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"})`) + Admin-Name (Lookup `users.find(u => u.id === a.admin_id)?.display_name || "Admin"`).
  - Unbekannte `action`: Fallback `{ label: action, Icon: Clock, color: muted, bg: cream }`.
  - Leerzustand: „Noch keine protokollierten Aktionen."

## Dateien

- **Create:** `supabase/migrations/<ts>_admin_audit_log.sql`.
- **Modify:** `src/app/(public)/admin/page.jsx` (State, `AUDIT_META`, `logAdmin`, Handler-Verdrahtung, Nav, Such-Bedingung, Protokoll-Render, `ScrollText`-Import).
- **Modify:** `src/app/(public)/beta/page.jsx` (Checkliste).

## Out of Scope (bewusst)

- Protokollierung von Lese-Zugriffen oder Nicht-Admin-Aktionen.
- Edit/Löschen von Log-Einträgen (read-only).
- Export/Filter nach Aktionstyp (nur Freitext-Suche).
- DB-Trigger-basiertes Logging (client-seitig genügt; nur der Admin löst diese Aktionen aus).

## Verifizierung

- Migration anwenden (Controller, MCP) + prüfen, dass Tabelle + Policies existieren.
- Live als Admin: eine Aktion auslösen, die leicht reversibel ist — z.B. Zeggy sperren → entsperren — und prüfen, dass im Protokoll-Tab zwei Einträge („Konto gesperrt"/„Konto entsperrt") mit Icon, Ziel, Zeit, Admin erscheinen; per SQL gegenprüfen. Danach Zeggy-Baseline (entsperrt) sicherstellen.
- Tages-Gruppierung zeigt „Heute"-Header. Suche filtert. Keine Konsolenfehler.
- KEIN `npm run build` neben dem Dev-Server.

## Beta-Checkliste (Sektion „Admin-Bereich")

- `adm_audit_tab`: Protokoll-Tab zeigt Admin-Aktionen als tages-gruppierte Timeline (Icon, Ziel, Zeit, Admin).
- `adm_audit_logging`: Jede Admin-Aktion (Sperren/Meldung/Mahnung/Storno/Ankündigung/…) erzeugt einen Protokoll-Eintrag.
- `adm_audit_search`: Suche filtert nach Aktion/Ziel.
