# Inserat-Freigabe-Queue — Design Spec

**Datum:** 2026-06-17
**Welle:** 3, Teil 1 (Teil 2 = 360°-Nutzer-Ansicht, separat)

## Ziel
Neue Inserate gehen beim Publizieren nicht mehr sofort live, sondern in eine Admin-Freigabe. Erst nach Freigabe werden sie `active` (öffentlich sichtbar). Ablehnung schickt das Inserat zurück auf `draft` mit Begründung und benachrichtigt den Verkäufer.

## Entscheidungen (freigegeben)
- **Scope:** ALLE neuen Inserate brauchen Freigabe (voller Gatekeeper-Modus).
- **Ablehnung:** zurück auf `draft` + Pflicht-Grund + Benachrichtigung; Verkäufer bessert nach und reicht erneut ein.
- **Queue-Ort:** Filter im bestehenden Inserate-Tab (kein neuer Nav-Tab) + Zähler-Badge + „Zu prüfen"-Karte auf der Übersicht.
- **Durchsetzung:** Approach C — Client-Gate + raise-only BEFORE-UPDATE-Guard-Trigger + SECURITY-DEFINER-Admin-RPC. KEIN Rewrite-Trigger (Ansatz B verworfen wegen XP-Trigger-Wechselwirkung).

## Status-Modell
```
draft ──(Verkäufer publiziert)──▶ pending_review ──(Admin gibt frei)──▶ active
  ▲                                      │
  └──────(Admin lehnt ab, + review_reason)
```
- `active`/`paused`/`expired`/`sold`/`rented`/`deleted` bleiben unverändert.
- Öffentliche Lesepfade filtern bereits `status = 'active'` (Suche [listings.js:357](src/lib/listings.js:357), Home/Featured 672/843/860) → `pending_review` ist automatisch unsichtbar, KEIN zusätzlicher Ausschluss nötig.

## Verankerte Fakten (aus dem Code/DB geprüft)
- `listings.status` ist ein Postgres-ENUM `listing_status` (kein Free-Text) → neuer Wert per `ALTER TYPE`.
- Admin-Check-Muster im Projekt: hartkodiert `auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'` (so in site_announcement, admin_audit_log, reports_admin_update_policy).
- Admin kann fremde Inserate NICHT direkt updaten (RLS `USING auth.uid()=user_id`, keine Admin-Policy). Cross-User-Schreibzugriff läuft im Projekt bereits über SECURITY-DEFINER-RPCs (z.B. `pause_seller_listings`). → Freigeben/Ablehnen MUSS über RPC laufen.
- Publish-Chokepoint: [listings/new/page.jsx:79-80](src/app/(public)/listings/new/page.jsx:79) ruft `updateListingStatus(id, "active")` nur wenn `formData.publish`.
- `updateListing` (Bearbeiten) setzt KEIN `status` → Bearbeiten kollidiert nicht mit dem Gate.
- `renewListing` ([listings.js:203](src/lib/listings.js:203)) setzt `active` durch den Besitzer (expired→active) → Guard muss das erlauben.
- `createNotification(userId, type, title, body=null, link=null)` → Tabelle `notifications` (Spalten user_id/type/title/body/link, Leseflag `read`).
- XP/Achievements werden per DB-Trigger bei `→active` vergeben → feuert künftig bei der Admin-Freigabe (sinnvoll: XP erst bei echter Veröffentlichung).

## DB-Änderungen

### Migration 1 — Enum-Wert (eigene Datei, eigener Commit)
`ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending_review';`
- Muss allein laufen (ADD VALUE ist nicht in derselben Transaktion wie eine Nutzung erlaubt). Plan prüft zuerst die vorhandenen Enum-Werte.

### Migration 2 — Spalten + Guard-Trigger + RPC
- Spalten auf `listings`: `submitted_at timestamptz`, `review_reason text`, `reviewed_at timestamptz`.
- **Guard-Trigger** (raise-only, SECURITY INVOKER):
```sql
create or replace function public.enforce_listing_publish_gate()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'active'
     and OLD.status in ('draft','pending_review')
     and auth.uid() is not null
     and auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'Inserate werden erst nach Admin-Freigabe aktiv';
  end if;
  return NEW;
end; $$;
create trigger trg_listing_publish_gate
  before update on public.listings
  for each row execute function public.enforce_listing_publish_gate();
```
  - Blockt nur `draft|pending_review → active` für Nicht-Admins. `expired→active` (renew), `paused→active` (entpausieren), Bearbeiten (status unverändert) bleiben frei. Sold/rented/etc. unberührt. Innerhalb der Admin-RPC ist `auth.uid()` = Admin → passiert.
- **RPC** `admin_review_listing(p_listing_id uuid, p_decision text, p_reason text default null)` (SECURITY DEFINER, search_path public):
  - Prüft `auth.uid() = '48fbdb7f-…'` sonst `raise exception 'not authorized'`.
  - `p_decision='approve'` → `status='active', published_at=now(), reviewed_at=now(), review_reason=null`.
  - `p_decision='reject'`  → `status='draft', review_reason=p_reason, reviewed_at=now()`.
  - Gibt die aktualisierte Zeile (id, status) als json zurück.

## Code-Änderungen

### `src/lib/listings.js`
- Neuer Helper `submitForReview(listingId)` → `update({ status:'pending_review', submitted_at: now })`.
- Neuer Helper `reviewListing(listingId, decision, reason)` → `supabase.rpc('admin_review_listing', {...})` (für den Admin-Client).

### `src/app/(public)/listings/new/page.jsx`
- Zeile 80: `if (formData.publish) await updateListingStatus(listing.id, "active")` → `await submitForReview(listing.id)`. (Entwurf-Speichern bleibt `draft`.)
- Nach dem Einreichen Redirect + Hinweis „Inserat wird geprüft" (statt „live").

### Admin: `src/components/admin/useAdminData.jsx`
- Lade-Query für Inserate so erweitern, dass `pending_review` enthalten ist (Admin sieht alle Status; die bestehende Admin-Inserate-Query nutzt `.neq("status","deleted")` o.ä. — prüfen, dass pending_review nicht herausfällt).
- `pendingListings` Derived (status === 'pending_review', nach submitted_at) + Count für Badge/Overview.
- `approveListing(id)` / `rejectListing(id, reason)` → rufen `reviewListing`, aktualisieren lokalen State, `logAdmin("listing_approve"/"listing_reject", "listing", title, {reason})`, bei reject `createNotification(sellerId, "listing_rejected", "Inserat abgelehnt", reason, "/listings")`.
- Neue Felder ins return-Objekt.

### Admin: `src/components/admin/tabs/ListingsTab.jsx`
- Filter-Pills oben (all/pending/active/paused) — `pending` = „Wartet auf Freigabe", wartende zuerst, mit „seit {submitted_at}".
- In `pending`-Zeilen Aktionen **Freigeben** (→approveListing) und **Ablehnen** (öffnet kleinen Grund-Prompt → rejectListing). Bestehende Pause/Aktiv-Aktionen bleiben für andere Status.

### Admin: `AdminShell.jsx` / `OverviewTab.jsx` / `AuditTab.jsx`
- Nav-Badge-Zähler für offene Freigaben am Inserate-Eintrag (`NAV` in useAdminData liefert `badge`).
- „Freigaben"-Karte in „Zu prüfen" (`ATTENTION`) → springt in den Inserate-Tab, Filter pending.
- `AUDIT_META`: zwei Einträge `listing_approve` (CheckCircle/grün) + `listing_reject` (XCircle/rot).

### Verkäufer: `src/app/(public)/listings` (eigene Inserate)
- Badge „In Prüfung" für `pending_review`; während Prüfung nicht editierbar.
- Abgelehnte (zurück auf `draft`) zeigen den `review_reason` als Hinweis.

## Edge-Cases & Non-Goals
- **Bearbeiten eines aktiven Inserats** löst KEINE neue Prüfung aus (v1). `updateListing` setzt kein status. Re-Review bei Edits = bewusst out-of-scope.
- **Entpausieren / Verlängern** durch den Besitzer bleibt ohne Freigabe (war schon mal approved) — Guard erlaubt es.
- **Bestandsinserate**: bestehende `active` bleiben `active` (Backfill nicht nötig; Migration ändert nur das Enum + Spalten).
- **XP-Doppelvergabe**: verifizieren, dass der XP-Trigger nur einmal bei der ersten Freigabe feuert, nicht erneut bei Pause→Aktiv (bekannte Trigger-Fragilität).

## Verifizierung (live als Admin, KEIN `npm run build` neben Dev-Server)
1. Inserat erstellen + „publizieren" → landet auf `pending_review`, NICHT in Suche/Home sichtbar.
2. Admin Inserate-Tab Filter „Wartet auf Freigabe" → Inserat erscheint mit „seit".
3. Freigeben → `active`, taucht in Suche auf, Protokoll-Eintrag `listing_approve`.
4. Zweites Inserat → Ablehnen mit Grund → zurück auf `draft`, Grund sichtbar, Benachrichtigung beim Verkäufer, Protokoll-Eintrag `listing_reject`.
5. Gegenprobe Gate: Versuch, als Nicht-Admin direkt `pending_review→active` zu setzen, schlägt fehl (Guard-Exception).
6. Renew/Entpausieren eines eigenen Inserats funktioniert weiterhin (Guard blockt nicht).
7. Baseline wiederherstellen (Test-Inserate zurücksetzen/entfernen).

## Beta-Checkliste (erweitern)
- `adm_freigabe_queue` — Inserate landen auf pending_review, erscheinen in der Admin-Queue.
- `adm_freigabe_approve` — Freigeben macht live + Protokoll + XP.
- `adm_freigabe_reject` — Ablehnen → draft + Grund + Benachrichtigung.
- `adm_freigabe_gate` — Nicht-Admin kann nicht selbst aktivieren (Guard greift); renew/unpause funktionieren weiter.
- `vk_inserat_in_pruefung` — Verkäufer sieht „In Prüfung"-Badge und Ablehngrund.
