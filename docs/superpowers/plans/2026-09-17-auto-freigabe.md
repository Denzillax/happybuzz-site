# Automatische Inserat-Freigabe: Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Inserate gehen nach einer KI-Vorprüfung automatisch live, nur Blocker und auffällige Inserate neuer Verkäufer landen in der manuellen Warteschlange.

**Architecture:** Der Client reicht wie heute mit `pending_review` ein und stösst danach `POST /api/ai-review` an. Die Route (Service-Role) fragt OpenRouter mit Text und Bildern und übergibt das Ergebnis an die RPC `auto_review_listing`, die den Regelsatz anwendet und den Status setzt. Ein pg_cron-Job alle 5 Minuten holt hängengebliebene Inserate über dieselbe Route nach, authentifiziert per Vault-Token.

**Tech Stack:** Next.js 14 Route Handler, Supabase (Postgres, plpgsql, pg_cron, pg_net, Vault), OpenRouter `anthropic/claude-haiku-4.5` mit Bildeingabe.

Spec: `docs/superpowers/specs/2026-09-17-auto-freigabe-design.md`

---

## Dateien

- Create: `supabase/migrations/20260917_auto_freigabe.sql` (Spalten, Einstellung, RPCs, Vault-Token, Cron)
- Create: `src/app/api/ai-review/route.js` (KI-Aufruf, Ergebnis an RPC)
- Modify: `src/lib/listings.js:257` (`submitForReview` stösst die Route an)
- Modify: `src/app/(public)/listings/page.jsx:20` (Status-Text)
- Modify: `src/components/admin/useAdminData.jsx` (Reiter-Daten, Schalter)
- Modify: `src/components/admin/tabs/ListingsTab.jsx` (KI-Begründung, Reiter "Automatisch freigegeben")
- Modify: `src/components/admin/tabs/SettingsTab.jsx` oder wo `site_settings` bearbeitet wird (Schalter)
- Modify: `src/app/(public)/beta/page.jsx`, `src/lib/replog.js`

Es gibt keine automatisierten Tests im Projekt; geprüft wird per SQL (Regelsatz) und im Browser (Ablauf), siehe Spec-Abschnitt Test.

---

### Task 1: Migration

**Files:** Create `supabase/migrations/20260917_auto_freigabe.sql`

- [ ] **Step 1: Spalten und Einstellung**

```sql
alter table public.listings
  add column if not exists review_ai jsonb,
  add column if not exists review_hold_reason text,
  add column if not exists review_source text check (review_source in ('manual','auto'));
alter table public.site_settings add column if not exists auto_review_enabled boolean not null default true;
```

- [ ] **Step 2: RPC `auto_review_listing(p_listing uuid, p_ergebnis jsonb)`** (SECURITY DEFINER, nur service_role): Vertrauensstufe = `count(listings where user_id = owner and reviewed_at is not null and status in active/scheduled/sold/expired ...) >= 3` und keine Ablehnung (`review_reason is not null and reviewed_at > now() - 90 days`). Regelsatz wie Spec. Statuswechsel nur `where status = 'pending_review'`. Freigabe-Logik = Kopie aus `admin_review_listing` (status/published_at/auction_end). Audit-Eintrag `listing_auto_approve` / `listing_auto_hold`, Meldung an Verkäufer. Rückgabe `{status, entscheidung, grund}`.

- [ ] **Step 3: RPC `auto_review_faellig()`**: Inserate `pending_review`, `submitted_at < now() - 5 min`, `coalesce((review_ai->>'versuche')::int,0) < 2` und `review_ai->'blocker' is null` (also noch ohne Ergebnis). Rückgabe `setof uuid`.

- [ ] **Step 4: RPC `auto_review_versuch(p_listing uuid)`**: zählt `review_ai.versuche` hoch (bei Fehlschlag der KI).

- [ ] **Step 5: Vault-Token und Cron**: `select vault.create_secret(encode(gen_random_bytes(24),'hex'), 'ai_review_token')` falls nicht vorhanden; `cron.schedule('ai-review-nachholen', '*/5 * * * *', ...)` ruft für jede fällige ID `net.http_post('https://beedaro.ch/api/ai-review', headers x-review-token aus Vault, body {listing_id})`.

- [ ] **Step 6: `admin_review_listing` setzt `review_source = 'manual'`** beim Approve (kleines `create or replace`).

- [ ] **Step 7: Commit** `feat(freigabe): Migration automatische Vorpruefung`

### Task 2: Route `/api/ai-review`

**Files:** Create `src/app/api/ai-review/route.js`

- [ ] **Step 1:** Auth: entweder Nutzer-JWT (wie `ai-listing`, muss Besitzer sein) oder Header `x-review-token` == `worker_secret('ai_review_token')` (per Service-Role-RPC).
- [ ] **Step 2:** `site_settings.auto_review_enabled` lesen; aus → `{ok:true, uebersprungen:true}`.
- [ ] **Step 3:** Inserat laden (Titel, Beschreibung als Klartext, Kategorie-Pfad, Typ, Preise, Zustand, bis 4 Bild-URLs). Status muss `pending_review` sein.
- [ ] **Step 4:** OpenRouter-Aufruf mit System-Prompt (Regelsatz, JSON-Schema), `max_tokens 600`, `AbortController` 25 s, Bilder als `image_url`-Parts. JSON parsen, Felder validieren (`blocker[]`, `hinweise[]`, `bilder_geprueft`).
- [ ] **Step 5:** Erfolg → `auto_review_listing(id, ergebnis)`; Fehler → `auto_review_versuch(id)`. Antwort `{ok:true}`.
- [ ] **Step 6: Commit** `feat(freigabe): Route ai-review`

### Task 3: Client und Admin

- [ ] **Step 1:** `submitForReview`: nach dem Update `fetch('/api/ai-review', {method:'POST', headers: Authorization Bearer <session token>, body {listing_id}})` mit `.catch(()=>{})`.
- [ ] **Step 2:** Meine Inserate: Label `pending_review` → "In Prüfung"; wenn `review_hold_reason` gesetzt → "Persönliche Prüfung". Beim Laden `review_hold_reason` mitselektieren (select * deckt es ab).
- [ ] **Step 3:** Admin `useAdminData`: `autoListings = listings.filter(l => l.review_source === 'auto' && reviewed_at > now-7d)`; `toggleAutoReview` schreibt `site_settings.auto_review_enabled`; Laden von `auto_review_enabled` mit den Site-Settings.
- [ ] **Step 4:** Admin `ListingsTab`: Reiter `{k:'auto', l:'Automatisch freigegeben (n)'}`; in der Zeile unter dem Titel eine `KiBegruendung`-Komponente: Blocker rot, Hinweise grau, Vertrauensstufe, "Bilder nicht geprüft".
- [ ] **Step 5:** Admin Einstellungen (dort, wo der Site-Gate-Modus steht): Schalter "Automatische Freigabe".
- [ ] **Step 6:** Beta-Checkliste + Rep-Log.
- [ ] **Step 7: Commit** `feat(freigabe): Client, Admin-Ansicht, Schalter`

### Task 4: Einspielen und Test

- [ ] Migration einspielen (Supabase MCP `apply_migration` oder `npx supabase db push`).
- [ ] Testfälle 1 bis 5 aus der Spec mit dem Testverkäufer-Konto durchspielen, Ergebnisse in `listings.review_ai` und im Admin prüfen.
- [ ] Testdaten löschen, Rep-Log/Checkliste committen.
