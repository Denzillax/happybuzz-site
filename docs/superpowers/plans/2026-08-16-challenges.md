# Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Challenges bekommen Admin-Verwaltung, automatische Wochen-Rotation aus Vorlagen und automatische Pollen-Auszahlung mit Benachrichtigung.

**Architecture:** Zwei SECURITY-DEFINER-RPCs tragen die Logik (lazy Rotation beim Hive-Laden, serverseitig verifizierter Claim mit `award_xp`). Client bleibt dünn: `lib/gamification.js` ruft RPCs, Hive löst automatisch ein, Admin-Tab verwaltet Vorlagen und Sonder-Challenges über die bestehenden Muster (adminStyles, logAdmin, ROLE_TABS).

**Tech Stack:** Next.js 14 App Router, Supabase (RPCs via MCP `apply_migration`, Projekt `ekfsehsmwzougrgqukgf`), Vitest. Verifikation NUR live (transaktionale SQL-Tests + Preview), KEIN `npm run build`.

**Referenz-Fakten (nachgeschlagen, nicht raten):**
- XP vergeben: `public.award_xp(p_user_id uuid, p_amount int, p_reason text, p_reference uuid)` — existiert, wird von `grant_achievement` benutzt.
- `user_challenges`: `id, user_id, challenge_id, progress, completed, completed_at` (KEIN `claimed_at` — kommt in C1).
- `notifications`: `user_id, type, title, message, link, is_read`.
- `challenges`: `id, title, description, type, target_value, target_action, xp_reward, starts_at, ends_at, active, created_at`.
- Admin: `NAV` in `useAdminData.jsx` (~Zeile 853, Einträge `{ key, label, Icon }`), `AUDIT_META` in `tabs/AuditTab.jsx`, Rollen in `src/lib/staff.js` `ROLE_TABS`, Tabellen-Styles `th, td` aus `@/components/admin/adminStyles`.
- Hive-Challenges-Sektion: `src/app/(public)/hive/page.jsx` Zeilen ~307–337.

---

### Task C1: Migration — Spalten, Constraints, RLS, Seed

**Files:**
- Create: `supabase/migrations/20260816_challenges_admin.sql`
- Live anwenden via MCP `apply_migration` (Name `challenges_admin`), Datei identisch ins Repo.

- [ ] **Step 1: Migration schreiben und live anwenden**

```sql
-- Challenges: Vorlagen fuer Wochen-Rotation + Claim-Sperre + Admin-RLS.
alter table public.challenges
  add column if not exists is_template boolean not null default false,
  add column if not exists template_id uuid references public.challenges(id);

-- eine Instanz pro Vorlage und Woche
create unique index if not exists challenges_template_week_key
  on public.challenges (template_id, starts_at) where template_id is not null;

alter table public.user_challenges
  add column if not exists claimed_at timestamptz;

-- Doppel-Auszahlung ausschliessen
create unique index if not exists user_challenges_user_challenge_key
  on public.user_challenges (user_id, challenge_id);

-- Admin darf Challenges schreiben (Lesen ist/bleibt oeffentlich via bestehender Policy)
drop policy if exists challenges_admin_write on public.challenges;
create policy challenges_admin_write on public.challenges
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Seed: die drei bestehenden Wochen-Challenges als Vorlagen duplizieren.
-- Vorlagen sind nie selbst sichtbar (is_template=true), Zeitraum irrelevant.
insert into public.challenges (title, description, type, target_value, target_action, xp_reward, starts_at, ends_at, active, is_template)
select title, description, 'weekly', target_value, target_action, xp_reward, now(), now(), true, true
from public.challenges
where is_template = false and type = 'weekly'
  and title in ('Fleissige Biene', 'Deal-Maker', 'Glanzleistung')
  and not exists (select 1 from public.challenges t where t.is_template = true and t.title = public.challenges.title);
```

- [ ] **Step 2: Live prüfen**

MCP `execute_sql`:
```sql
select
  (select count(*) from public.challenges where is_template) as vorlagen,
  (select count(*) from pg_indexes where indexname='challenges_template_week_key') as idx1,
  (select count(*) from pg_indexes where indexname='user_challenges_user_challenge_key') as idx2,
  (select count(*) from pg_policies where tablename='challenges' and policyname='challenges_admin_write') as pol;
```
Expected: `vorlagen=3, idx1=1, idx2=1, pol=1`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260816_challenges_admin.sql
git commit -m "feat(challenges): Migration - Vorlagen-Spalten, Claim-Sperre, Admin-RLS, Seed der drei Wochen-Vorlagen"
```

---

### Task C2: RPCs `ensure_weekly_challenges` + `claim_challenge`

**Files:**
- Create: `supabase/migrations/20260816_challenges_rpcs.sql`
- Live anwenden via MCP `apply_migration` (Name `challenges_rpcs`).

- [ ] **Step 1: RPCs schreiben und live anwenden**

```sql
-- Wochen-Rotation: der erste Aufrufer der Woche instanziert alle aktiven
-- Vorlagen. Idempotent ueber den Unique-Index (template_id, starts_at).
create or replace function public.ensure_weekly_challenges()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monday timestamptz;
  v_created integer := 0;
  t record;
begin
  -- Montag 00:00 Europe/Zurich der laufenden Woche
  v_monday := date_trunc('week', (now() at time zone 'Europe/Zurich'))::timestamp
              at time zone 'Europe/Zurich';

  for t in select * from challenges where is_template and active loop
    insert into challenges (title, description, type, target_value, target_action,
                            xp_reward, starts_at, ends_at, active, is_template, template_id)
    values (t.title, t.description, 'weekly', t.target_value, t.target_action,
            t.xp_reward, v_monday, v_monday + interval '7 days' - interval '1 second',
            true, false, t.id)
    on conflict (template_id, starts_at) do nothing;
    if found then v_created := v_created + 1; end if;
  end loop;
  return v_created;
end $$;

-- Claim: prueft den Fortschritt SERVERSEITIG nach, zahlt genau einmal aus
-- (Unique user_challenges), vergibt Pollen ueber den kanonischen Weg award_xp
-- und legt die Benachrichtigung an. Nachtraeglich einloesen: bis 7 Tage nach ends_at.
create or replace function public.claim_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_user uuid := auth.uid();
  v_progress integer := 0;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;

  select * into c from challenges
   where id = p_challenge_id and active and not is_template
     and starts_at <= now() and now() <= ends_at + interval '7 days';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_claimable'); end if;

  if c.target_action = 'listing_created' then
    select count(*) into v_progress from listings
     where user_id = v_user and status <> 'deleted' and created_at >= c.starts_at;
  elsif c.target_action = 'sale_completed' then
    select count(*) into v_progress from purchases
     where seller_id = v_user and status = 'completed' and created_at >= c.starts_at;
  elsif c.target_action = 'five_star' then
    select count(*) into v_progress from ratings
     where rated_id = v_user and rating = 5 and created_at >= c.starts_at;
  else
    return jsonb_build_object('ok', false, 'reason', 'unknown_action');
  end if;

  if v_progress < c.target_value then
    return jsonb_build_object('ok', false, 'reason', 'incomplete', 'progress', v_progress);
  end if;

  insert into user_challenges (user_id, challenge_id, progress, completed, completed_at, claimed_at)
  values (v_user, p_challenge_id, v_progress, true, now(), now())
  on conflict (user_id, challenge_id) do nothing;
  if not found then return jsonb_build_object('ok', false, 'reason', 'already_claimed'); end if;

  if c.xp_reward > 0 then
    perform public.award_xp(v_user, c.xp_reward, 'challenge:' || c.title, c.id);
  end if;

  insert into notifications (user_id, type, title, message, link, is_read)
  values (v_user, 'gamification', 'Challenge geschafft',
          c.title || ': +' || c.xp_reward || ' Pollen', '/hive', false);

  return jsonb_build_object('ok', true, 'amount', c.xp_reward);
end $$;
```

- [ ] **Step 2: Transaktionaler Live-Test (rollt sich selbst zurück)**

MCP `execute_sql` — Zeggy `430fa5fd-9fc3-439a-b404-30fbda86948b` hat Inserate, taugt als Testnutzer nicht direkt (auth.uid() fehlt in SQL), darum Claim-Kern via direkter Simulation: `set local request.jwt.claims`:

```sql
do $$
declare n1 int; n2 int; r1 jsonb; r2 jsonb; v_ch uuid;
begin
  -- Rotation idempotent?
  perform public.ensure_weekly_challenges();
  select count(*) into n1 from challenges where not is_template and template_id is not null
    and starts_at >= date_trunc('week', now());
  perform public.ensure_weekly_challenges();
  select count(*) into n2 from challenges where not is_template and template_id is not null
    and starts_at >= date_trunc('week', now());

  -- Claim: als Zeggy ausgeben (SECURITY DEFINER liest auth.uid() aus den Claims)
  perform set_config('request.jwt.claims',
    '{"sub":"430fa5fd-9fc3-439a-b404-30fbda86948b","role":"authenticated"}', true);
  select id into v_ch from challenges where not is_template and active
    and target_action='listing_created' and starts_at >= date_trunc('week', now()) limit 1;
  r1 := public.claim_challenge(v_ch);
  r2 := public.claim_challenge(v_ch);

  raise exception 'CHAL-TEST: rotation %->% (gleich=idempotent) · claim1=% · claim2=%',
    n1, n2, r1, r2;
end $$;
```
Expected: `n1=n2` (=3), `claim1` = `{ok:true,...}` ODER `{ok:false,reason:incomplete,...}` (je nach Zeggys Wochen-Inseraten — beides beweist die Nachrechnung), `claim2` = bei ok in claim1: `already_claimed`, sonst wieder `incomplete`. Exception rollt alles zurück.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260816_challenges_rpcs.sql
git commit -m "feat(challenges): RPCs ensure_weekly_challenges (idempotente Rotation) + claim_challenge (serverseitige Auszahlung via award_xp)"
```

---

### Task C3: lib/gamification.js

**Files:**
- Modify: `src/lib/gamification.js` (Funktionen `getActiveChallenges` ~Z.211, `getChallengesWithProgress` ~Z.274)

- [ ] **Step 1: Vorlagen ausblenden + RPC-Wrapper + claimed-Flag**

`getActiveChallenges`: nach `.eq("active", true)` ergänzen: `.eq("is_template", false)`.

Neu (unter `getUserChallengeProgress` einfügen):
```js
// Wochen-Rotation anstossen (idempotent; der erste Aufrufer der Woche
// instanziert die Vorlagen). Fehler sind still: ohne Rotation zeigt der
// Hive schlimmstenfalls die alte Woche.
export async function ensureWeeklyChallenges() {
  const { error } = await supabase.rpc("ensure_weekly_challenges");
  if (error) console.error("ensure_weekly_challenges:", error);
}

// Challenge einloesen. Serverseitig verifiziert; Rueckgabe
// {ok, amount} oder {ok:false, reason: 'incomplete'|'already_claimed'|...}.
export async function claimChallenge(challengeId) {
  const { data, error } = await supabase.rpc("claim_challenge", { p_challenge_id: challengeId });
  if (error) { console.error("claim_challenge:", error); return { ok: false, reason: "error" }; }
  return data || { ok: false, reason: "empty" };
}
```

`getChallengesWithProgress`: vor der Schleife die Claims laden und im Ergebnis mitgeben:
```js
export async function getChallengesWithProgress(userId) {
  const challenges = await getActiveChallenges();
  const { data: claims } = await supabase.from("user_challenges")
    .select("challenge_id").eq("user_id", userId);
  const claimedSet = new Set((claims || []).map(r => r.challenge_id));
  const out = [];
  for (const c of challenges) {
    let progress = 0;
    // ... (bestehende drei if-Zweige unveraendert) ...
    out.push({ ...c, progress: Math.min(progress, c.target_value), done: progress >= c.target_value, claimed: claimedSet.has(c.id) });
  }
  return out;
}
```

- [ ] **Step 2: Testsuite läuft** — `npm test`, erwartet 55/55 (keine neuen Unit-Tests: alles RPC/Anzeige).

- [ ] **Step 3: Commit**

```bash
git add src/lib/gamification.js
git commit -m "feat(challenges): lib - Vorlagen-Filter, ensureWeeklyChallenges, claimChallenge, claimed-Flag"
```

---

### Task C4: Hive — Rotation + Auto-Claim + Erfolgs-UI

**Files:**
- Modify: `src/app/(public)/hive/page.jsx` (Imports ~Z.11, Laden ~Z.129, Challenges-Sektion Z.307–337)

- [ ] **Step 1: Laden umbauen**

Import ergänzen: `ensureWeeklyChallenges, claimChallenge` aus `@/lib/gamification`.
Im Lade-Effekt VOR `getChallengesWithProgress(user.id)`: `await ensureWeeklyChallenges();`
Nach dem Setzen von `chs`: fertige, nicht eingelöste automatisch einlösen:

```js
// Fertige Challenges automatisch einloesen; bei Erfolg Zustand aktualisieren,
// damit das "+X Pollen"-Haekchen sofort sichtbar ist.
const fresh = [];
for (const c of chs) {
  if (c.done && !c.claimed) {
    const res = await claimChallenge(c.id);
    if (res.ok) { fresh.push({ ...c, claimed: true, justClaimed: true }); continue; }
  }
  fresh.push(c);
}
setChallenges(fresh);
```
(den bisherigen direkten `setChallenges(chs)` ersetzen.)

- [ ] **Step 2: Render um claimed/justClaimed erweitern**

In der Challenge-Zeile (Z.323–325) die Pollen-Anzeige ersetzen:
```jsx
<span style={{ fontSize: 12, fontWeight: 800, color: c.done ? "#5B8C5A" : colors.teal, display: "inline-flex", alignItems: "center", gap: 3 }}>
  <Zap size={12} /> {c.claimed ? `+${c.xp_reward} Pollen gutgeschrieben` : `${c.xp_reward} Pollen`}
</span>
```

- [ ] **Step 3: Live prüfen (Preview als Zeggy, Login via mksession.cjs-Muster)**

`/hive` laden. Expected: Challenges-Sektion zeigt die drei Wochen-Challenges der laufenden Woche (nicht mehr "Aktuell keine aktiven Challenges"); DB-Query `select count(*) from challenges where not is_template and starts_at >= date_trunc('week', now())` = 3. Falls Zeggy eine erfüllt: Haken + "+n Pollen gutgeschrieben", `xp_log` hat den `challenge:`-Eintrag, Glocke hat "Challenge geschafft".

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/hive/page.jsx"
git commit -m "feat(challenges): Hive rotiert Wochen-Challenges und loest fertige automatisch ein"
```

---

### Task C5: Admin-Tab Challenges

**Files:**
- Create: `src/components/admin/tabs/ChallengesTab.jsx`
- Modify: `src/components/admin/useAdminData.jsx` (NAV ~Z.865, State/Loader, Handler)
- Modify: `src/components/admin/AdminShell.jsx` (Tab mounten, Muster CategoriesTab)
- Modify: `src/components/admin/tabs/AuditTab.jsx` (AUDIT_META)
- Modify: `src/lib/staff.js` (ROLE_TABS: `manager` bekommt `"challenges"`)

- [ ] **Step 1: useAdminData erweitern**

NAV-Eintrag nach `categories`: `{ key: "challenges", label: "Challenges", Icon: Target }` (`Target` aus lucide importieren). State + Loader + Handler (im Hook, Muster der anderen Tabs):

```js
const [challenges, setChallenges] = useState([]);
const loadChallenges = useCallback(async () => {
  const { data } = await supabase.from("challenges")
    .select("*").order("is_template", { ascending: false }).order("starts_at", { ascending: false });
  // Teilnehmerzahlen in einem Rutsch
  const ids = (data || []).filter(c => !c.is_template).map(c => c.id);
  let counts = {};
  if (ids.length) {
    const { data: uc } = await supabase.from("user_challenges").select("challenge_id").in("challenge_id", ids);
    (uc || []).forEach(r => { counts[r.challenge_id] = (counts[r.challenge_id] || 0) + 1; });
  }
  setChallenges((data || []).map(c => ({ ...c, participants: counts[c.id] || 0 })));
}, []);

const saveChallenge = async (form) => {
  // form: {title, description, target_action, target_value, xp_reward, is_template, starts_at, ends_at}
  const row = { ...form, type: form.is_template ? "weekly" : "special", active: true };
  const { error } = await supabase.from("challenges").insert(row);
  if (error) { alert(error.message); return false; }
  await logAdmin("challenge_created", null, { title: form.title });
  await loadChallenges();
  return true;
};

const toggleChallenge = async (c) => {
  const { error } = await supabase.from("challenges").update({ active: !c.active }).eq("id", c.id);
  if (error) { alert(error.message); return; }
  await logAdmin("challenge_toggled", c.id, { title: c.title, active: !c.active });
  await loadChallenges();
};

// Vorlagen bearbeiten (Spec: "bei Vorlagen zusätzlich Bearbeiten").
// Wirkt ab der NAECHSTEN Wochen-Instanz; laufende Instanzen bleiben unveraendert.
const updateChallenge = async (id, form) => {
  const { error } = await supabase.from("challenges").update({
    title: form.title, description: form.description,
    target_action: form.target_action, target_value: parseInt(form.target_value) || 1,
    xp_reward: parseInt(form.xp_reward) || 0,
  }).eq("id", id);
  if (error) { alert(error.message); return false; }
  await logAdmin("challenge_updated", id, { title: form.title });
  await loadChallenges();
  return true;
};
```
(`updateChallenge` ebenfalls im Rückgabeobjekt exportieren.)
`loadChallenges` beim Tab-Wechsel auf `challenges` ausführen (Muster der anderen Lazy-Loader im Hook) und `challenges, saveChallenge, toggleChallenge` im Rückgabeobjekt exportieren.

- [ ] **Step 2: ChallengesTab.jsx schreiben**

```jsx
"use client";
import { useState } from "react";
import { Plus, Power, Repeat } from "lucide-react";
import { colors, radius } from "@/lib/theme";
import { th, td, pill, bcFieldLabel, bcInput } from "@/components/admin/adminStyles";

const ACTIONS = [
  { value: "listing_created", label: "Inserate erstellen" },
  { value: "sale_completed", label: "Verkäufe abschliessen" },
  { value: "five_star", label: "5-Sterne-Bewertungen erhalten" },
];
const aLabel = (v) => ACTIONS.find(a => a.value === v)?.label || v;
const fmtD = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

export function ChallengesTab({ admin }) {
  const { challenges, saveChallenge, toggleChallenge, updateChallenge, modPill } = admin;
  const [filter, setFilter] = useState("aktiv");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);   // Vorlage im Formular bearbeiten
  const [f, setF] = useState({ title: "", description: "", target_action: "listing_created", target_value: 3, xp_reward: 50, is_template: true, starts_at: "", ends_at: "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const startEdit = (c) => {
    setEditId(c.id);
    setF({ title: c.title, description: c.description || "", target_action: c.target_action, target_value: c.target_value, xp_reward: c.xp_reward, is_template: true, starts_at: "", ends_at: "" });
    setShowForm(true);
  };

  const now = new Date();
  const rows = challenges.filter(c =>
    filter === "vorlagen" ? c.is_template
    : filter === "vergangene" ? (!c.is_template && new Date(c.ends_at) < now)
    : (!c.is_template && new Date(c.ends_at) >= now));

  const submit = async () => {
    if (!f.title.trim()) return alert("Titel fehlt");
    if (!editId && !f.is_template && (!f.starts_at || !f.ends_at)) return alert("Zeitraum fehlt (oder als Vorlage markieren)");
    const ok = editId
      ? await updateChallenge(editId, f)
      : await saveChallenge({
          title: f.title.trim(), description: f.description.trim(),
          target_action: f.target_action, target_value: parseInt(f.target_value) || 1,
          xp_reward: parseInt(f.xp_reward) || 0, is_template: f.is_template,
          starts_at: f.is_template ? new Date().toISOString() : new Date(f.starts_at).toISOString(),
          ends_at: f.is_template ? new Date().toISOString() : new Date(f.ends_at + "T23:59:59").toISOString(),
        });
    if (ok) { setShowForm(false); setEditId(null); setF({ title: "", description: "", target_action: "listing_created", target_value: 3, xp_reward: 50, is_template: true, starts_at: "", ends_at: "" }); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[["aktiv", "Aktuelle"], ["vorlagen", "Vorlagen (wöchentlich)"], ["vergangene", "Vergangene"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={modPill(filter === k)}>{l}</button>
        ))}
        <button onClick={() => setShowForm(s => !s)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={13} /> Neue Challenge
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><p style={bcFieldLabel}>Titel</p><input style={bcInput} value={f.title} onChange={e => set("title", e.target.value)} /></div>
          <div style={{ gridColumn: "1 / -1" }}><p style={bcFieldLabel}>Beschreibung</p><input style={bcInput} value={f.description} onChange={e => set("description", e.target.value)} /></div>
          <div><p style={bcFieldLabel}>Ziel-Aktion</p>
            <select style={bcInput} value={f.target_action} onChange={e => set("target_action", e.target.value)}>
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select></div>
          <div><p style={bcFieldLabel}>Zielwert</p><input style={bcInput} type="number" min="1" value={f.target_value} onChange={e => set("target_value", e.target.value)} /></div>
          <div><p style={bcFieldLabel}>Pollen</p><input style={bcInput} type="number" min="0" value={f.xp_reward} onChange={e => set("xp_reward", e.target.value)} /></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="chal-tpl" checked={f.is_template} onChange={e => set("is_template", e.target.checked)} />
            <label htmlFor="chal-tpl" style={{ fontSize: 13 }}>Wöchentliche Vorlage (rotiert automatisch jede Woche)</label>
          </div>
          {!f.is_template && (<>
            <div><p style={bcFieldLabel}>Von</p><input style={bcInput} type="date" value={f.starts_at} onChange={e => set("starts_at", e.target.value)} /></div>
            <div><p style={bcFieldLabel}>Bis</p><input style={bcInput} type="date" value={f.ends_at} onChange={e => set("ends_at", e.target.value)} /></div>
          </>)}
          <div style={{ gridColumn: "1 / -1" }}>
            <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Anlegen</button>
          </div>
        </div>
      )}

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Nichts gefunden.</div>
        ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <th style={th}>Titel</th><th style={th}>Aktion</th>
            <th style={{ ...th, textAlign: "right" }}>Ziel</th><th style={{ ...th, textAlign: "right" }}>Pollen</th>
            <th style={th}>Zeitraum</th><th style={{ ...th, textAlign: "right" }}>Teilnehmer</th>
            <th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, textAlign: "center" }}>Aktionen</th>
          </tr></thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                <td style={{ ...td, fontWeight: 600 }}>{c.title}
                  {c.description && <span style={{ display: "block", fontSize: 11, color: colors.muted, fontWeight: 400 }}>{c.description}</span>}
                </td>
                <td style={{ ...td, color: colors.muted }}>{aLabel(c.target_action)}</td>
                <td style={{ ...td, textAlign: "right" }}>{c.target_value}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{c.xp_reward}</td>
                <td style={{ ...td, color: colors.muted, whiteSpace: "nowrap" }}>
                  {c.is_template ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Repeat size={11} /> wöchentlich</span> : `${fmtD(c.starts_at)} bis ${fmtD(c.ends_at)}`}
                </td>
                <td style={{ ...td, textAlign: "right" }}>{c.is_template ? "" : c.participants}</td>
                <td style={{ ...td, textAlign: "center" }}>{c.active ? pill("#E8F5E9", "#2E7D32", "Aktiv") : pill("#f5f5f5", "#666", "Aus")}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {c.is_template && (
                      <button onClick={() => startEdit(c)} title="Vorlage bearbeiten (gilt ab nächster Woche)"
                        style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: "#E6F5F5", color: "#0A7170", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Bearbeiten
                      </button>
                    )}
                    <button onClick={() => toggleChallenge(c)} title={c.active ? "Deaktivieren" : "Aktivieren"}
                      style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: c.active ? "#FFF3E0" : "#E8F5E9", color: c.active ? "#E65100" : "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Power size={10} /> {c.active ? "Aus" : "An"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verdrahten**

`AdminShell.jsx`: Import + `{tab === "challenges" && <ChallengesTab admin={admin} />}` (Muster CategoriesTab). `AuditTab.jsx` AUDIT_META ergänzen:
```js
challenge_created: { label: "Challenge angelegt",     Icon: Target, color: "#0E9493", bg: "#E6F5F5" },
challenge_toggled: { label: "Challenge (de)aktiviert", Icon: Target, color: "#E65100", bg: "#FFF3E0" },
challenge_updated: { label: "Challenge-Vorlage geändert", Icon: Target, color: "#0E9493", bg: "#E6F5F5" },
```
(`Target` importieren.) `staff.js`: `manager`-Array um `"challenges"` erweitern.

- [ ] **Step 4: Live prüfen (Preview als Denis/Admin)**

Tab "Challenges": Vorlagen-Filter zeigt 3, Aktuelle zeigt die Instanzen der Woche. Neue Sonder-Challenge anlegen (Zeitraum morgen bis +7 Tage) → erscheint unter Aktuelle, Protokoll-Tab hat "Challenge angelegt". Deaktivieren → Status "Aus".

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/tabs/ChallengesTab.jsx src/components/admin/useAdminData.jsx src/components/admin/AdminShell.jsx src/components/admin/tabs/AuditTab.jsx src/lib/staff.js
git commit -m "feat(challenges): Admin-Tab - Liste, Anlegen (Vorlage/Sonderaktion), Deaktivieren, Audit + Rollen"
```

---

### Task C6: Beta-Checkliste + Abschluss

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Hive/Gamification-Sektion; falls keine existiert, in "Gebühren & Bee-Impact"-Nähe eine Sektion `gamification` suchen — es gibt eine Hive-Sektion, per Grep `hive` finden)

- [ ] **Step 1: Beta-Punkte**

```js
{ id: "chal_rotation", label: "Challenges: Hive zeigt jede Woche automatisch die Wochen-Challenges (nie mehr 'keine aktiven Challenges'); erster Besuch der Woche legt sie an" },
{ id: "chal_claim", label: "Challenge geschafft: Pollen werden automatisch einmalig gutgeschrieben, Glocke zeigt 'Challenge geschafft', Anzeige wechselt auf 'gutgeschrieben'" },
{ id: "chal_admin", label: "Admin → Challenges: Vorlagen und Sonder-Challenges anlegen, deaktivieren; Protokoll-Einträge vorhanden" },
```

- [ ] **Step 2: Gesamtprüfung**

`npm test` (55/55) · Preview: /hive als Zeggy (Rotation + ggf. Auto-Claim sichtbar) · Admin-Tab als Denis · DB-Gegenprobe `xp_log` mit `reason like 'challenge:%'` nach echtem Claim.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "test(beta): Challenge-Checkpunkte (Rotation, Auto-Auszahlung, Admin-Verwaltung)"
```
