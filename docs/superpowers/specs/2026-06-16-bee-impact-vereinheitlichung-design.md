# Bee-Impact vereinheitlichen (bezahlt) + spielerische Startseite

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Umsetzung

## Ziel

Eine **kanonische Bee-Impact-Definition** app-weit: **`bee_impact` aus bezahlten Gebühren** (`fee_ledger.status = 'paid'`). Damit verschwinden die drei widersprüchlichen Quellen + eine Doppelzählung. Auf der Startseite wird der Impact zusätzlich **spielerisch als Meilenstein** dargestellt (geflossen vs. unterwegs, Fortschritt zum nächsten Naturprojekt), die bestehenden Kennzahlen (Artikel gerettet, CO2) bleiben.

## Festgelegte Entscheidungen (Brainstorming)

1. **Kanonisch = bezahlt:** „geflossen" = `fee_ledger.bee_impact` wo `status='paid'`. „unterwegs" = nicht bezahlt, nicht storniert. „Artikel gerettet" = Anzahl nicht-stornierter Verkäufe (Wiederverwendung zählt unabhängig von Bezahlung).
2. **Doppelzählung fixen:** `recalc_bee_impact` nur **Verkäuferseite** + **bezahlt** (statt `purchases` mit Käufer UND Verkäufer).
3. **Startseite:** Meilenstein-Variante (Fortschritt zum nächsten Projekt) + bestehende 3 Kennzahlen.
4. **Projekt-Leiter** als editierbare Konstante im Code.
5. **Admin-Gebühren-Karte bleibt rechnungsbasiert** (Abrechnungssicht; konzeptuell identisch, in echten Daten deckungsgleich).

## Ist-Zustand (verifiziert)

- **3 Quellen:** RPC `get_community_impact_stats` = `Σ fee_ledger.bee_impact where status!='cancelled'` (=70.24); `profiles.bee_impact_total` via `recalc_bee_impact` = `Σ purchases.bee_impact where buyer_id=me OR seller_id=me` (Doppelzählung, Summe 121.70); bezahlt (`fee_ledger.status='paid'`) = 10.96.
- `get_community_impact_stats` wird von **`CommunityImpact.jsx`** (Startseite, via `getCommunityImpactStats` → `data.impact`/`data.articles`) UND **`/impact`-Seite** (`page.jsx:27`, `data.impact`/`data.articles`) genutzt.
- `CommunityImpact.jsx:44` „Von dir beigetragen" = `Σ fee_ledger.bee_impact where seller_id=me AND status!='cancelled'` (zählt unbezahlt mit).
- `recalc_bee_impact(p_user_id)`: `Σ purchases.bee_impact where buyer_id=me OR seller_id=me` → `profiles.bee_impact_total`. Genutzt von Hive (`getCommunityStats` summiert `bee_impact_total`), öffentlichem Profil, Favoriten.
- `confirmAndReactivate` (Admin, `useAdminData.jsx`) setzt beim Bezahlt-Markieren `fee_ledger.status='paid'` für die Rechnungs-Zeilen.

## Feature 1 — RPC `get_community_impact_stats` (Migration)

Rückgabe-Keys **abwärtskompatibel** halten (`impact`/`articles`), `impact` = bezahlt, plus neues `unterwegs`:
```sql
CREATE OR REPLACE FUNCTION public.get_community_impact_stats()
 RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select json_build_object(
    'impact',    coalesce(sum(bee_impact) filter (where status = 'paid'), 0),
    'unterwegs', coalesce(sum(bee_impact) filter (where status <> 'paid' and status <> 'cancelled'), 0),
    'articles',  count(*) filter (where status <> 'cancelled')
  ) from public.fee_ledger;
$function$;
```
→ `/impact` zeigt damit automatisch die bezahlte Zahl (kein Code-Change dort nötig); `CommunityImpact` nutzt zusätzlich `unterwegs`.

## Feature 2 — `recalc_bee_impact` (Migration) + Backfill + Wiring

Funktion auf Verkäuferseite + bezahlt umstellen:
```sql
CREATE OR REPLACE FUNCTION public.recalc_bee_impact(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_total decimal;
begin
  select coalesce(sum(bee_impact), 0) into v_total
  from public.fee_ledger where seller_id = p_user_id and status = 'paid';
  update public.profiles set bee_impact_total = v_total where id = p_user_id;
end; $function$;
```
**Backfill** (alle Profile) in derselben Migration:
```sql
update public.profiles p set bee_impact_total = coalesce(
  (select sum(bee_impact) from public.fee_ledger where seller_id = p.id and status = 'paid'), 0);
```
**Wiring:** In `confirmAndReactivate` (`useAdminData.jsx`) nach dem `fee_ledger.status='paid'`-Update den Verkäufer-Impact aktualisieren: `await supabase.rpc("recalc_bee_impact", { p_user_id: sellerId });` (hält `bee_impact_total` aktuell, sobald eine FEE-Rechnung bezahlt wird).

## Feature 3 — Projekt-Leiter (`src/lib/impact.js`, neu)

```js
export const IMPACT_MILESTONES = [
  { at: 250,   name: "Blühwiese (5 m²)" },
  { at: 500,   name: "Wildbienenhotel" },
  { at: 1500,  name: "Streuobstwiese" },
  { at: 5000,  name: "Bienenweide (1 ha)" },
  { at: 10000, name: "Naturschutz-Fonds" },
];
// Nächste unerreichte Stufe + Vorgänger-Schwelle (für den Segment-Fortschritt).
export function nextMilestone(geflossen) {
  const g = Number(geflossen) || 0;
  const idx = IMPACT_MILESTONES.findIndex((m) => m.at > g);
  if (idx === -1) {
    const last = IMPACT_MILESTONES[IMPACT_MILESTONES.length - 1];
    return { name: last.name, target: last.at, prev: last.at, reached: true };
  }
  return { name: IMPACT_MILESTONES[idx].name, target: IMPACT_MILESTONES[idx].at, prev: idx === 0 ? 0 : IMPACT_MILESTONES[idx - 1].at, reached: false };
}
```

## Feature 4 — `CommunityImpact.jsx`

- `getCommunityImpactStats()` (in `lib/listings.js`) gibt jetzt `{ impact, unterwegs, articles }` weiter (Default `{impact:0, unterwegs:0, articles:0}`).
- Drei Kennzahlen bleiben: **Artikel gerettet** (`articles`), **CO2 vermieden** (`articles*25/1000` t), **geflossen** (`CHF impact`).
- **Meilenstein-Block** darunter: `const ms = nextMilestone(impact);` Fortschrittsbalken im Segment `[ms.prev, ms.target]`: grün = `(impact-ms.prev)/(ms.target-ms.prev)`, schraffiert (unterwegs) oben drauf, gekappt bei `ms.target`. Text: „Nächstes Ziel: {ms.name} · CHF {impact} / {ms.target}" + „Noch CHF {target-impact} — CHF {unterwegs} schon unterwegs". Bei `ms.reached`: „Alle Ziele erreicht — CHF {unterwegs} unterwegs".
- **„Von dir beigetragen"** (Zeile 44): von `.neq("status","cancelled")` auf `.eq("status","paid")` umstellen (eigene bezahlte Gebühren), konsistent mit der Community-Basis.
- Sichtbarkeits-Guard `if (!stats || stats.impact <= 0) return null;` ggf. lockern, damit die Sektion auch bei impact=0 aber unterwegs>0 erscheint → `if (!stats || (stats.impact <= 0 && stats.unterwegs <= 0)) return null;`.

## Feature 5 — `/impact`-Seite

Kein Code-Change nötig: liest `data.impact` (jetzt bezahlt) + `data.articles`. Nur verifizieren, dass die Zahl wie erwartet (bezahlt) erscheint.

## Dateien

- **Migration:** `get_community_impact_stats` + `recalc_bee_impact` neu + Backfill (via MCP apply_migration, als Datei in `supabase/migrations/` ablegen).
- **Modify:** `src/lib/listings.js` (`getCommunityImpactStats`-Shape), `src/lib/impact.js` (neu, Leiter + Helfer), `src/components/home/CommunityImpact.jsx` (Meilenstein + Von-dir paid), `src/components/admin/useAdminData.jsx` (`recalc_bee_impact`-Aufruf in `confirmAndReactivate`), `src/app/(public)/beta/page.jsx` (Checkliste).
- **Kein Change:** `/impact`-Seite (nur Verifizierung), Admin-Gebühren-Karte.

## Verifizierung (live, KEIN `npm run build`)

- **Migration:** RPC liefert `{impact, unterwegs, articles}`; mit aktuellen Daten `impact`≈10.96, `unterwegs`≈59.28, `articles`=42. Backfill: `sum(profiles.bee_impact_total)` = `sum(fee_ledger.bee_impact where status='paid')` (kein Doppelzählen mehr).
- **Startseite:** Sektion zeigt 3 Kennzahlen + Meilenstein-Balken (geflossen grün, unterwegs schraffiert) + „Noch CHF X / CHF Y unterwegs" + „Von dir beigetragen" (bezahlt).
- **/impact + Hive + Profil:** zeigen die neue (bezahlte, nicht-doppelte) Zahl konsistent.
- **Bezahlt-Flow:** Eine FEE-Rechnung im Admin auf „Bezahlt" → `recalc_bee_impact` aktualisiert `bee_impact_total` des Verkäufers; Startseite/Hive steigen entsprechend. Danach Baseline (Testdaten) wiederherstellen.
- Keine Konsolen-/Overlay-Fehler.

## Beta-Checkliste

- `impact_canonical`: Bee-Impact zählt app-weit nur bezahlte Gebühren (Startseite/Impact/Hive/Profil identisch, keine Doppelzählung).
- `impact_milestone`: Startseite zeigt Meilenstein-Fortschritt zum nächsten Projekt (geflossen + unterwegs) plus Artikel/CO2.

## Out of Scope (bewusst)

- Admin-Gebühren-Karte (bleibt rechnungsbasiert).
- Projekt-Ziele aus einer DB-Tabelle/Admin-UI (vorerst Code-Konstante).
- Echte Projekt-Auszahlungen/Tracking (nur Anzeige-Logik).
