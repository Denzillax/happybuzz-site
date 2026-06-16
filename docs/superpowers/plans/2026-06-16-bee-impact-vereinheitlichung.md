# Bee-Impact-Vereinheitlichung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bee-Impact app-weit auf eine kanonische Definition (bezahlte Gebühren) bringen, die Doppelzählung beheben, und auf der Startseite einen spielerischen Meilenstein-Fortschritt zeigen.

**Architecture:** Zwei Supabase-RPCs umschreiben (+ Backfill) als kanonische Quelle; das Frontend (Startseite/Impact/Hive/Profil) zieht daraus; eine kleine Leiter-Konstante + Helfer für die Meilensteine.

**Tech Stack:** Supabase (plpgsql RPC), Next.js 14 Client Components.

**Verifizierung:** Live-Preview (kein Unit-Test-Runner). **NIE `npm run build`** neben dem Dev-Server. Datenänderungen (Backfill) sind gewollt; Testdaten nach Flow-Test auf Baseline.

**Kanonik:** geflossen = `fee_ledger.bee_impact` wo `status='paid'`; unterwegs = nicht paid, nicht cancelled; articles = Anzahl nicht-stornierter Zeilen.

---

## Task 1: Migration — RPCs + Backfill

**Files:**
- Create: `supabase/migrations/20260616_bee_impact_paid_canonical.sql`
- Apply: via MCP `apply_migration`

- [ ] **Step 1: Migration-SQL schreiben + anwenden**

Inhalt (Datei + `apply_migration`, name `bee_impact_paid_canonical`):
```sql
-- get_community_impact_stats: impact = bezahlt, + unterwegs, articles = nicht-storniert
CREATE OR REPLACE FUNCTION public.get_community_impact_stats()
 RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select json_build_object(
    'impact',    coalesce(sum(bee_impact) filter (where status = 'paid'), 0),
    'unterwegs', coalesce(sum(bee_impact) filter (where status <> 'paid' and status <> 'cancelled'), 0),
    'articles',  count(*) filter (where status <> 'cancelled')
  ) from public.fee_ledger;
$function$;

-- recalc_bee_impact: nur Verkäuferseite + bezahlt (behebt Doppelzählung)
CREATE OR REPLACE FUNCTION public.recalc_bee_impact(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_total decimal;
begin
  select coalesce(sum(bee_impact), 0) into v_total
  from public.fee_ledger where seller_id = p_user_id and status = 'paid';
  update public.profiles set bee_impact_total = v_total where id = p_user_id;
end; $function$;

-- Backfill aller Profile auf die neue Basis
update public.profiles p set bee_impact_total = coalesce(
  (select sum(bee_impact) from public.fee_ledger where seller_id = p.id and status = 'paid'), 0);
```

- [ ] **Step 2: Verifizieren (SQL)**

```sql
select get_community_impact_stats();
select round(sum(bee_impact_total)::numeric,2) prof, (select round(sum(bee_impact)::numeric,2) from fee_ledger where status='paid') paid from profiles;
```
Erwartet: `impact`≈10.96, `unterwegs`≈59.28, `articles`=42; `prof` == `paid` (kein Doppelzählen mehr).

- [ ] **Step 3: Commit (Migrations-Datei)**

```bash
git add supabase/migrations/20260616_bee_impact_paid_canonical.sql
git commit -m "feat(impact): RPCs auf bezahlte Gebuehren + Doppelzaehlung-Fix + Backfill"
```

---

## Task 2: Projekt-Leiter (`src/lib/impact.js`, neu)

**Files:**
- Create: `src/lib/impact.js`

- [ ] **Step 1: Datei anlegen**

```js
// Meilenstein-Leiter für den Bee-Impact-Fortschritt (CHF bezahlt). Editierbar.
export const IMPACT_MILESTONES = [
  { at: 250,   name: "Blühwiese (5 m²)" },
  { at: 500,   name: "Wildbienenhotel" },
  { at: 1500,  name: "Streuobstwiese" },
  { at: 5000,  name: "Bienenweide (1 ha)" },
  { at: 10000, name: "Naturschutz-Fonds" },
];

// Nächste unerreichte Stufe + Vorgänger-Schwelle (Basis des Segment-Fortschritts).
export function nextMilestone(geflossen) {
  const g = Number(geflossen) || 0;
  const idx = IMPACT_MILESTONES.findIndex((m) => m.at > g);
  if (idx === -1) {
    const last = IMPACT_MILESTONES[IMPACT_MILESTONES.length - 1];
    return { name: last.name, target: last.at, prev: last.at, reached: true };
  }
  return {
    name: IMPACT_MILESTONES[idx].name,
    target: IMPACT_MILESTONES[idx].at,
    prev: idx === 0 ? 0 : IMPACT_MILESTONES[idx - 1].at,
    reached: false,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/impact.js
git commit -m "feat(impact): Meilenstein-Leiter + nextMilestone-Helfer"
```

---

## Task 3: `getCommunityImpactStats`-Shape (`src/lib/listings.js`)

**Files:**
- Modify: `src/lib/listings.js:634-638`

- [ ] **Step 1: Default-Shape ergänzen**

Ersetze:
```js
export async function getCommunityImpactStats() {
  const { data, error } = await supabase.rpc("get_community_impact_stats");
  if (error) return { impact: 0, articles: 0 };
  return data || { impact: 0, articles: 0 };
}
```
durch:
```js
export async function getCommunityImpactStats() {
  const { data, error } = await supabase.rpc("get_community_impact_stats");
  if (error) return { impact: 0, unterwegs: 0, articles: 0 };
  return data || { impact: 0, unterwegs: 0, articles: 0 };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/listings.js
git commit -m "feat(impact): getCommunityImpactStats liefert unterwegs mit"
```

---

## Task 4: Startseite (`src/components/home/CommunityImpact.jsx`)

**Files:**
- Modify: `src/components/home/CommunityImpact.jsx` (Import; State-Default; Zeile 44; Guard ~50; Cards ~54-58; Meilenstein nach dem Cards-Grid ~111)

- [ ] **Step 1: Import + State-Default**

Nach den bestehenden Imports ergänzen:
```js
import { nextMilestone } from "@/lib/impact";
```
State-Default (Zeile 24) erweitern:
```js
  const [stats, setStats] = useState({ impact: 0, unterwegs: 0, articles: 0 });
```

- [ ] **Step 2: „Von dir beigetragen" auf bezahlt (Zeile 44)**

Ersetze
```js
      const { data: rows } = await supabase.from("fee_ledger").select("bee_impact").eq("seller_id", session.user.id).neq("status", "cancelled");
```
durch
```js
      const { data: rows } = await supabase.from("fee_ledger").select("bee_impact").eq("seller_id", session.user.id).eq("status", "paid");
```

- [ ] **Step 3: Sichtbarkeits-Guard lockern (Zeile 50)**

Ersetze `if (!stats || stats.impact <= 0) return null;` durch:
```js
  if (!stats || (Number(stats.impact || 0) <= 0 && Number(stats.unterwegs || 0) <= 0)) return null;
```

- [ ] **Step 4: 3. Karte umbenennen (Zeile 57)**

In der `cards`-Definition das Label der CHF-Karte von `"für Naturschutz"` auf `"geflossen"` ändern:
```js
    { value: `CHF ${chf(stats.impact)}`, label: "geflossen" },
```

- [ ] **Step 5: Meilenstein-Block einfügen**

Direkt **nach** dem schliessenden `</div>` des Cards-Grids (nach Zeile 111, vor `{userImpact > 0 && (`) einfügen:
```jsx
          {(() => {
            const ms = nextMilestone(stats.impact);
            const span = Math.max(1, ms.target - ms.prev);
            const paidPct = Math.max(0, Math.min(100, ((Number(stats.impact || 0) - ms.prev) / span) * 100));
            const wegPct = Math.max(0, Math.min(100 - paidPct, (Number(stats.unterwegs || 0) / span) * 100));
            const remaining = Math.max(0, ms.target - Number(stats.impact || 0));
            return (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #E2E2E2" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Nächstes Ziel: {ms.name}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>CHF {chf(stats.impact)} / {chf(ms.target)}</span>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: "#EAF3DE", marginTop: 10, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${paidPct}%`, background: GREEN }} />
                  <div style={{ width: `${wegPct}%`, background: "repeating-linear-gradient(45deg,#C0DD97,#C0DD97 5px,#EAF3DE 5px,#EAF3DE 10px)" }} />
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: MUTED }}>
                  {ms.reached
                    ? <>Alle Ziele erreicht. <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} unterwegs.</b></>
                    : <>Noch <b style={{ color: GREEN }}>CHF {chf(remaining)}</b>{Number(stats.unterwegs || 0) > 0 ? <> — <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} schon unterwegs</b>.</> : "."}</>}
                </p>
              </div>
            );
          })()}
```
(`GREEN`/`DARK`/`MUTED`/`chf` sind oben in der Datei definiert.)

- [ ] **Step 6: Live verifizieren**

Startseite (`/`): Sektion zeigt 3 Kennzahlen (Artikel/CO2/geflossen) + Meilenstein-Balken (grün=geflossen, schraffiert=unterwegs) + „Noch CHF X — CHF Y schon unterwegs"; eingeloggt zusätzlich „Von dir beigetragen" (bezahlt). Kein Konsolenfehler.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/CommunityImpact.jsx
git commit -m "feat(impact): Startseite Meilenstein-Fortschritt (geflossen/unterwegs) + bezahlt-Basis"
```

---

## Task 5: Wiring `recalc_bee_impact` (`src/components/admin/useAdminData.jsx`)

**Files:**
- Modify: `src/components/admin/useAdminData.jsx:459` (`confirmAndReactivate`)

- [ ] **Step 1: recalc nach Bezahlt-Markierung aufrufen**

Ersetze
```js
    await supabase.from("fee_ledger").update({ status: "paid" }).eq("fee_invoice_id", invId);
    await supabase.rpc("reactivate_seller_listings", { p_seller_id: sellerId });
```
durch
```js
    await supabase.from("fee_ledger").update({ status: "paid" }).eq("fee_invoice_id", invId);
    await supabase.rpc("recalc_bee_impact", { p_user_id: sellerId });
    await supabase.rpc("reactivate_seller_listings", { p_seller_id: sellerId });
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/useAdminData.jsx
git commit -m "feat(impact): bee_impact_total bei bezahlter FEE-Rechnung neu berechnen"
```

---

## Task 6: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In einer passenden Sektion (z.B. „Impact"/„Hive" oder bei den Home-Items) einfügen:
```jsx
      { id: "impact_canonical", label: "Bee-Impact zählt app-weit nur bezahlte Gebühren (Startseite/Impact/Hive/Profil identisch, keine Doppelzählung)" },
      { id: "impact_milestone", label: "Startseite zeigt Meilenstein-Fortschritt zum nächsten Projekt (geflossen + unterwegs) plus Artikel/CO2" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Bee-Impact-Vereinheitlichung erweitert"
```

---

## Task 7: Abschluss-Verifizierung + Bezahlt-Flow

- [ ] **Step 1: Konsistenz prüfen**

`/` (Startseite), `/impact`, `/hive`: alle zeigen denselben bezahlten Bee-Impact (≈10.96 mit aktuellen Daten); keine 70/121-Diskrepanz mehr; keine Fehler.

- [ ] **Step 2: Bezahlt-Flow-Test (dann Baseline)**

Eine überfällige FEE-Test-Rechnung erzeugen/„Bezahlt" markieren → `bee_impact_total` des Verkäufers + Community-Zahl steigen um den Positions-Impact. **Danach Testdaten auf Baseline** (Rechnung/Status/Backfill der betroffenen Profile zurücksetzen via `recalc_bee_impact` bzw. SQL). Keine Test-Pollution zurücklassen.

- [ ] **Step 3: Code-Review-Subagent**

Read-only Review: RPCs (filter-Logik korrekt, paid-only, Backfill), `nextMilestone` (Segment/Grenzfälle: 0, über letztem Ziel), CommunityImpact (Balken-Mathe gekappt, Guard, paid-Zeile), recalc-Wiring (kein Handler-Bruch). Urteil „Sauber" oder „N Punkte".

---

## Self-Review (Plan gegen Spec)

- **F1 RPC get_community_impact_stats (impact=paid, unterwegs, articles):** Task 1. ✓
- **F2 recalc_bee_impact seller+paid + Backfill + Wiring:** Task 1 (Funktion+Backfill) + Task 5 (Wiring). ✓
- **F3 Projekt-Leiter + nextMilestone:** Task 2. ✓
- **F4 getCommunityImpactStats-Shape:** Task 3. ✓
- **F5 CommunityImpact (3 Kennzahlen + Meilenstein + Guard + Von-dir paid):** Task 4. ✓
- **F6 /impact ohne Code-Change:** in Task 7 Step 1 verifiziert. ✓
- **Beta:** Task 6. ✓
- **Typkonsistenz:** RPC-Keys `impact/unterwegs/articles` durchgängig; `nextMilestone`→`{name,target,prev,reached}` genau so im Render genutzt; `recalc_bee_impact(p_user_id)` Signatur in Migration + Wiring identisch. ✓
- **Admin-Karte:** bewusst unverändert (Spec Out-of-Scope). ✓
