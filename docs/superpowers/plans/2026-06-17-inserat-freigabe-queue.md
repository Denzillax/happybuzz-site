# Inserat-Freigabe-Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Es gibt KEINEN Unit-Test-Runner — Verifizierung erfolgt LIVE über das Browser-Preview (serverId `640a8f70-c285-4193-8e4f-9fd48fa12cdf`). NIEMALS `npm run build`/`next build` neben dem Dev-Server. Commits ohne Co-Authored-By.

**Goal:** Neue Inserate gehen beim Publizieren auf `pending_review` und werden erst nach Admin-Freigabe `active`; Ablehnung schickt sie zurück auf `draft` mit Grund + Benachrichtigung.

**Architecture:** Client-Gate (`listings/new` setzt `pending_review`) + serverseitiger raise-only Guard-Trigger (blockt `draft|pending_review → active` für Nicht-Admins) + SECURITY-DEFINER-RPC `admin_review_listing` (einziger Weg zu `active`). Admin-Queue als Filter im bestehenden Inserate-Tab.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres ENUM `listing_status`, RLS, plpgsql RPC), modularer Admin (`useAdminData.jsx` Hook + `tabs/*`).

**Referenz-Spec:** `docs/superpowers/specs/2026-06-17-inserat-freigabe-queue-design.md`

---

### Task FQ1: Migration 1 — Enum-Wert `pending_review`

**Files:**
- Create: `supabase/migrations/20260617_listing_pending_review_enum.sql`
- DB: via MCP `apply_migration` (name `listing_pending_review_enum`)

- [ ] **Step 1: Vorhandene Enum-Werte prüfen**

MCP `execute_sql`:
```sql
select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='listing_status' order by enumsortorder;
```
Erwartet: enthält `active, draft, paused, sold, rented, expired, deleted, pending_pause` (o.ä.), NICHT `pending_review`.

- [ ] **Step 2: Migrationsdatei schreiben**

```sql
-- Neuer Status für die Inserat-Freigabe-Queue.
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending_review';
```

- [ ] **Step 3: Anwenden (MUSS allein laufen)**

MCP `apply_migration` mit obigem SQL. (ADD VALUE darf nicht in derselben Transaktion wie eine Nutzung stehen — daher eigene Migration vor FQ2.)

- [ ] **Step 4: Verifizieren**

`execute_sql` wie Step 1 → `pending_review` ist jetzt enthalten.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260617_listing_pending_review_enum.sql
git commit -m "feat(listings): listing_status Enum-Wert pending_review (FQ1)"
```

---

### Task FQ2: Migration 2 — Spalten + Guard-Trigger + Admin-RPC

**Files:**
- Create: `supabase/migrations/20260617_listing_review_gate.sql`
- DB: via MCP `apply_migration` (name `listing_review_gate`)

- [ ] **Step 1: Migrationsdatei schreiben**

```sql
-- Inserat-Freigabe-Queue: Metadaten, Guard-Trigger, Admin-RPC.

-- 1) Metadaten-Spalten
alter table public.listings add column if not exists submitted_at timestamptz;
alter table public.listings add column if not exists review_reason text;
alter table public.listings add column if not exists reviewed_at timestamptz;

-- 2) Guard-Trigger: nur Admin darf draft|pending_review -> active schalten.
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

drop trigger if exists trg_listing_publish_gate on public.listings;
create trigger trg_listing_publish_gate
  before update on public.listings
  for each row execute function public.enforce_listing_publish_gate();

-- 3) Admin-RPC für Freigeben/Ablehnen (umgeht owner-RLS sauber).
create or replace function public.admin_review_listing(
  p_listing_id uuid, p_decision text, p_reason text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_row public.listings;
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_decision = 'approve' then
    update public.listings
      set status='active', published_at=now(), reviewed_at=now(), review_reason=null
      where id=p_listing_id returning * into v_row;
  elsif p_decision = 'reject' then
    update public.listings
      set status='draft', review_reason=p_reason, reviewed_at=now()
      where id=p_listing_id returning * into v_row;
  else
    raise exception 'invalid decision: %', p_decision;
  end if;
  return json_build_object('id', v_row.id, 'status', v_row.status);
end; $$;
```

- [ ] **Step 2: Anwenden**

MCP `apply_migration` mit obigem SQL.

- [ ] **Step 3: Guard verifizieren (negativ)**

`execute_sql` als Test (läuft als Service-Rolle, auth.uid() = null → Guard greift NICHT; das ist erwartet). Echter Guard-Test erfolgt live in FQ7 (Nicht-Admin-Session). Hier nur prüfen, dass Trigger + Funktionen existieren:
```sql
select tgname from pg_trigger where tgrelid='public.listings'::regclass and tgname='trg_listing_publish_gate';
select proname from pg_proc where proname in ('enforce_listing_publish_gate','admin_review_listing');
```
Erwartet: Trigger + beide Funktionen vorhanden.

- [ ] **Step 4: RPC-Roundtrip prüfen** (mit einem Test-Inserat des Admins)

`execute_sql`: ein eigenes Inserat auf `pending_review` setzen, dann `select public.admin_review_listing('<id>','approve');` → liefert `{"status":"active"}`. Danach zurücksetzen.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260617_listing_review_gate.sql
git commit -m "feat(listings): Guard-Trigger + admin_review_listing RPC + Review-Spalten (FQ2)"
```

---

### Task FQ3: Publish-Flow — `submitForReview` + `listings/new`

**Files:**
- Modify: `src/lib/listings.js` (nach `updateListingStatus`, ~Zeile 199)
- Modify: `src/app/(public)/listings/new/page.jsx:79-82`

- [ ] **Step 1: Helfer in `listings.js` ergänzen**

Nach `updateListingStatus` (Zeile 199) einfügen:
```javascript
// ─── Freigabe-Queue ──────────────────────────────────────────
// Inserat zur Admin-Freigabe einreichen (statt direkt active).
export async function submitForReview(listingId) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "pending_review", submitted_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) throw error;
}

// Admin: Inserat freigeben / ablehnen (RPC umgeht owner-RLS).
export async function reviewListing(listingId, decision, reason = null) {
  const { data, error } = await supabase.rpc("admin_review_listing", {
    p_listing_id: listingId, p_decision: decision, p_reason: reason,
  });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: `listings/new` Import + Publish-Call umstellen**

In [page.jsx:4](src/app/(public)/listings/new/page.jsx:4) `updateListingStatus` durch `submitForReview` ersetzen (im Import). Dann Zeile 79-81:
```javascript
    if (formData.publish) {
      await submitForReview(listing.id);
    }
```

- [ ] **Step 3: Hinweistext anpassen**

Falls nach dem Publizieren ein Erfolgs-Hinweis/Redirect-Text „live"/„veröffentlicht" sagt, auf „Inserat eingereicht — wird geprüft" ändern (Text in `listings/new/page.jsx` rund um den Redirect `router.push("/listings")`, ~Zeile 82). Kein neuer State nötig.

- [ ] **Step 4: Live verifizieren**

Als eingeloggter Nutzer ein Inserat erstellen + publizieren → `preview_eval` prüft: Inserat erscheint NICHT in `/search`, und in `/listings` mit Status (FQ6 macht das Badge hübsch). `execute_sql`: `select status, submitted_at from listings order by created_at desc limit 1;` → `pending_review`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings.js "src/app/(public)/listings/new/page.jsx"
git commit -m "feat(listings): Publizieren reicht zur Freigabe ein (pending_review) (FQ3)"
```

---

### Task FQ4: Admin-Hook — Queue, Aktionen, Badge, Karte

**Files:**
- Modify: `src/components/admin/useAdminData.jsx`

- [ ] **Step 1: Import `reviewListing` + `createNotification`**

Oben bei den lib-Imports ergänzen: `reviewListing` aus `@/lib/listings` und (falls nicht vorhanden) `import { createNotification } from "@/lib/notifications";`.

- [ ] **Step 2: Derived `pendingListings`**

Bei den anderen Derived-Werten (vor `const NAV`) einfügen:
```javascript
const pendingListings = listings.filter(l => l.status === "pending_review")
  .sort((a, b) => new Date(a.submitted_at || a.created_at) - new Date(b.submitted_at || b.created_at));
```
HINWEIS: Die Admin-Inserate-Query lädt `limit(100)`. Bei >100 Inseraten wären sehr alte pending evtl. nicht geladen — für den Start akzeptabel; im Code mit Kommentar markieren.

- [ ] **Step 3: Handler `approveListing` / `rejectListing`**

Bei den anderen Handlern (z.B. nach `toggleListingStatus`, ~Zeile 442) einfügen:
```javascript
const approveListing = async (listingId) => {
  const _l = listings.find(x => x.id === listingId);
  await reviewListing(listingId, "approve");
  setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "active" } : l));
  flash("Inserat freigegeben");
  logAdmin("listing_approve", "listing", _l?.title || listingId);
};
const rejectListing = async (listingId, reason) => {
  const _l = listings.find(x => x.id === listingId);
  await reviewListing(listingId, "reject", reason);
  setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "draft", review_reason: reason } : l));
  flash("Inserat abgelehnt");
  logAdmin("listing_reject", "listing", _l?.title || listingId, { reason });
  if (_l?.user_id) createNotification(_l.user_id, "listing_rejected", "Inserat abgelehnt", reason, "/listings");
};
```

- [ ] **Step 4: NAV-Badge + ATTENTION-Karte + statusPill-Label**

`NAV` Eintrag „listings" (Zeile 665) → Badge ergänzen:
```javascript
    { key: "listings", label: "Inserate", Icon: Package, badge: pendingListings.length },
```
`ATTENTION` (Zeile 701) eine Karte ergänzen:
```javascript
    { n: pendingListings.length, label: "Wartet auf Freigabe", desc: "Neue Inserate zur Prüfung", Icon: Package, color: "#E65100", onClick: () => { setTab("listings"); setSearch(""); setListingMod("pending"); } },
```
`statusPill`-Map (Zeile 531) ergänzen:
```javascript
    pending_review: ["#FFF8E1", "#E65100", "Wartet auf Freigabe"],
```

- [ ] **Step 5: Neuer Listing-Filter-State + return-Objekt**

State bei den anderen `useState` ergänzen: `const [listingMod, setListingMod] = useState("all");`.
Ins return-Objekt aufnehmen: `pendingListings, approveListing, rejectListing, listingMod, setListingMod`.

- [ ] **Step 6: Live verifizieren**

`/admin` neu laden → Inserate-Nav zeigt Badge (Anzahl pending), Übersicht „Zu prüfen" zeigt „Wartet auf Freigabe"-Karte mit Zahl. Konsole fehlerfrei (`preview_console_logs` level error, nur HMR-Artefakte erlaubt).

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/useAdminData.jsx
git commit -m "feat(admin): Freigabe-Queue im Hook (pending, approve/reject, Badge, Karte) (FQ4)"
```

---

### Task FQ5: ListingsTab — Filter-Pills + Freigeben/Ablehnen

**Files:**
- Modify: `src/components/admin/tabs/ListingsTab.jsx`

- [ ] **Step 1: Destrukturierung erweitern**

`const { visibleListings, statusPill, toggleListingStatus } = admin;` →
```javascript
const { listings, listingMod, setListingMod, pendingListings, approveListing, rejectListing, statusPill, toggleListingStatus } = admin;
```

- [ ] **Step 2: Filter-Pills über der Tabelle**

Vor dem `<div ...><table>` einfügen (modPill kommt aus admin — ergänze es in der Destrukturierung: `modPill`):
```jsx
<div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
  {[
    { k: "all", l: `Alle (${listings.length})` },
    { k: "pending", l: `Wartet auf Freigabe (${pendingListings.length})` },
    { k: "active", l: "Aktiv" },
    { k: "paused", l: "Pausiert" },
  ].map(f => (
    <button key={f.k} onClick={() => setListingMod(f.k)} style={modPill(listingMod === f.k)}>{f.l}</button>
  ))}
</div>
```

- [ ] **Step 3: Zeilenquelle filtern**

Statt `visibleListings.map(...)` eine lokale Liste verwenden:
```javascript
const rows = listingMod === "pending" ? pendingListings
  : listingMod === "all" ? visibleListings
  : visibleListings.filter(l => l.status === listingMod);
```
Tabelle iteriert über `rows`.

- [ ] **Step 4: Aktionen-Spalte für pending**

In der Aktionen-Zelle, vor den bestehenden Pause/Aktiv-Buttons:
```jsx
{l.status === "pending_review" && (
  <>
    <button onClick={() => approveListing(l.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Freigeben</button>
    <button onClick={() => { const r = window.prompt("Ablehngrund (wird dem Verkäufer angezeigt):"); if (r && r.trim()) rejectListing(l.id, r.trim()); }} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Ablehnen</button>
  </>
)}
```

- [ ] **Step 5: Live verifizieren**

`/admin` → Inserate-Tab → Filter „Wartet auf Freigabe" zeigt das Test-Inserat; „Freigeben" → wird `active` (taucht in `/search` auf); zweites Inserat „Ablehnen" mit Grund → verschwindet aus pending, Status `draft`. `preview_console_logs` fehlerfrei.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/tabs/ListingsTab.jsx
git commit -m "feat(admin): Inserate-Tab Freigabe-Filter + Freigeben/Ablehnen (FQ5)"
```

---

### Task FQ6: Protokoll-Meta + Verkäufer-Sicht

**Files:**
- Modify: `src/components/admin/tabs/AuditTab.jsx`
- Modify: `src/app/(public)/listings/page.jsx`

- [ ] **Step 1: AUDIT_META erweitern**

In `AuditTab.jsx` im `AUDIT_META`-Objekt ergänzen (Icons `Play`/`XCircle` sind dort schon importiert):
```javascript
  listing_approve:      { label: "Inserat freigegeben",   Icon: Play,    color: "#2E7D32", bg: "#E8F5E9" },
  listing_reject:       { label: "Inserat abgelehnt",     Icon: XCircle, color: "#c62828", bg: "#FFEBEE" },
```

- [ ] **Step 2: Verkäufer-Status-Config**

In `listings/page.jsx` `STATUS_CONFIG` (Zeile 11) ergänzen:
```javascript
  pending_review: { label: "In Prüfung", color: "#E5A100", icon: Clock },
```
und `statusPriority` (Zeile 103) ergänzen: `pending_review: 1,` (gleich nach active).

- [ ] **Step 3: Ablehngrund anzeigen**

Dort wo eine Listing-Karte gerendert wird: wenn `l.status === "draft" && l.review_reason`, einen kleinen roten Hinweis zeigen:
```jsx
{l.status === "draft" && l.review_reason && (
  <div style={{ fontSize: 11, color: "#c62828", marginTop: 4 }}>Abgelehnt: {l.review_reason}</div>
)}
```
(An die bestehende Karten-Struktur anpassen — `getUserListings` liefert `review_reason` mit, da `select("*")`.)

- [ ] **Step 4: Live verifizieren**

Als Verkäufer `/listings`: pending-Inserat zeigt Badge „In Prüfung"; abgelehntes zeigt „Abgelehnt: <Grund>". `/admin` Protokoll: Einträge „Inserat freigegeben"/„Inserat abgelehnt" sichtbar.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/tabs/AuditTab.jsx "src/app/(public)/listings/page.jsx"
git commit -m "feat(listings): Protokoll-Meta + Verkäufer In-Prüfung-Badge & Ablehngrund (FQ6)"
```

---

### Task FQ7: Beta-Checkliste + Abschluss-Verifizierung

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Beta-Checkliste erweitern**

Im passenden Admin-Abschnitt die fünf Punkte ergänzen (gleiches Format wie bestehende Einträge):
```
adm_freigabe_queue     — Inserate landen auf pending_review, erscheinen in der Admin-Queue.
adm_freigabe_approve   — Freigeben macht live + Protokoll + XP.
adm_freigabe_reject    — Ablehnen → draft + Grund + Benachrichtigung.
adm_freigabe_gate      — Nicht-Admin kann nicht selbst aktivieren; renew/unpause funktionieren weiter.
vk_inserat_in_pruefung — Verkäufer sieht „In Prüfung"-Badge und Ablehngrund.
```

- [ ] **Step 2: End-to-End live verifizieren** (als Admin + als Verkäufer)

1. Inserat erstellen+publizieren → `pending_review`, nicht in `/search`.
2. Admin Inserate-Tab „Wartet auf Freigabe" → Freigeben → in `/search` sichtbar, Protokoll `listing_approve`, XP-Trigger gefeuert (XP nur einmal — `execute_sql` Achievements/XP prüfen).
3. Zweites Inserat → Ablehnen mit Grund → `draft` + Grund in `/listings` + Benachrichtigung (`execute_sql` notifications).
4. Guard-Gegenprobe: `execute_sql` als gesetzte Nicht-Admin-`auth.uid()` (oder über die App als Nutzer) versuchen `pending_review→active` → Exception.
5. Renew/Entpausieren eines eigenen aktiven Inserats → funktioniert (Guard blockt nicht).
6. `preview_console_logs` (level error): nur HMR-Artefakte, keine echten Fehler.

- [ ] **Step 3: Baseline wiederherstellen**

Test-Inserate entfernen/zurücksetzen, Banner/Bans unverändert.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "chore(beta): Freigabe-Queue Checkliste + Abschluss-Verifizierung (FQ7)"
```

---

## Self-Review (gegen die Spec)

- **Spec-Abdeckung:** Enum (FQ1) ✓, Spalten+Guard+RPC (FQ2) ✓, Publish-Flow (FQ3) ✓, Hook/Queue/Badge/Karte/Notification (FQ4) ✓, Admin-UI Filter+Aktionen (FQ5) ✓, Protokoll-Meta + Verkäufer-Sicht (FQ6) ✓, Beta+Verifizierung (FQ7) ✓.
- **Konsistenz:** `reviewListing(listingId, decision, reason)` / `admin_review_listing(p_listing_id, p_decision, p_reason)` / `approveListing(id)` / `rejectListing(id, reason)` / `pending_review` / `listingMod` durchgängig identisch benannt.
- **Edge-Cases:** Guard erlaubt `expired→active` (renew) und `paused→active` (unpause), blockt nur aus `draft|pending_review`; Bearbeiten setzt kein status; `limit(100)`-Hinweis dokumentiert; XP feuert bei Freigabe (einmal prüfen).
