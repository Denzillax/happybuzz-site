# Mitarbeiter + Rollen (RBAC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`). KEIN Unit-Test-Runner — Verifizierung LIVE über Browser-Preview (serverId `640a8f70-c285-4193-8e4f-9fd48fa12cdf`) + RLS-Tests via `execute_sql` mit gesetztem `request.jwt.claims`. NIEMALS `npm run build` neben dem Dev-Server. Commits ohne Co-Authored-By. **Sicherheitskritisch** — nach R2 unbedingt Owner-Regression prüfen.

**Goal:** Owner weist Nutzern Admin-Rollen zu; Mitarbeiter erhalten Admin-Zugang mit nur den Tabs ihrer Rolle. Breiter Staff-Lesezugriff (RLS auf `is_staff`), Firma + Mitarbeiter bleiben Owner-only.

**Architecture:** `staff_roles`-Tabelle (owner-schreibbar) + `is_staff()`-Helfer; 11 admin-Policies erweitert auf `is_staff`; Gate/NAV in `useAdminData` rollenbasiert; owner-only `set_staff_role`-RPC + Mitarbeiter-Tab.

**Tech Stack:** Next.js 14, Supabase (RLS, SECURITY DEFINER), modularer Admin-Hook.

**Referenz-Spec:** `docs/superpowers/specs/2026-06-17-mitarbeiter-rollen-rbac-design.md`
**ADMIN_ID:** `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`

---

### Task R1: Migration — staff_roles + is_staff + set_staff_role

**Files:**
- Create: `supabase/migrations/20260617_staff_roles.sql`
- DB: MCP `apply_migration` (name `staff_roles`)

- [ ] **Step 1: Migration schreiben + apply**

```sql
create table if not exists public.staff_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint staff_roles_role_check check (role in ('support','finance','moderation','manager'))
);
alter table public.staff_roles enable row level security;

create or replace function public.is_staff(uid uuid)
returns boolean language sql security definer stable set search_path to 'public' as $$
  select uid = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid
      or exists (select 1 from public.staff_roles s where s.user_id = uid);
$$;

drop policy if exists staff_roles_read on public.staff_roles;
drop policy if exists staff_roles_owner_write on public.staff_roles;
create policy staff_roles_read on public.staff_roles for select
  using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy staff_roles_owner_write on public.staff_roles for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);

create or replace function public.set_staff_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_role is null or p_role = '' then
    delete from public.staff_roles where user_id = p_user_id;
  elsif p_role in ('support','finance','moderation','manager') then
    insert into public.staff_roles (user_id, role) values (p_user_id, p_role)
      on conflict (user_id) do update set role = excluded.role;
  else
    raise exception 'invalid role: %', p_role;
  end if;
end; $$;
```

- [ ] **Step 2: Verifizieren**

`execute_sql`:
```sql
select public.is_staff('48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0') as owner_true,
       public.is_staff('00000000-0000-0000-0000-000000000001') as marco_false,
       (select count(*) from pg_proc where proname in ('is_staff','set_staff_role')) as fns;
```
Erwartet: owner_true=true, marco_false=false, fns=2.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260617_staff_roles.sql
git commit -m "feat(rbac): staff_roles + is_staff + set_staff_role RPC (R1)"
```

---

### Task R2: Migration — 11 Policies auf is_staff erweitern

**Files:**
- Create: `supabase/migrations/20260617_admin_policies_is_staff.sql`
- DB: MCP `apply_migration` (name `admin_policies_is_staff`)

- [ ] **Step 1: Migration schreiben + apply** (Eigenzugriff erhalten, company_settings NICHT anfassen)

```sql
-- admin_audit_log
drop policy if exists admin_audit_insert on public.admin_audit_log;
create policy admin_audit_insert on public.admin_audit_log for insert with check (public.is_staff(auth.uid()));
drop policy if exists admin_audit_select on public.admin_audit_log;
create policy admin_audit_select on public.admin_audit_log for select using (public.is_staff(auth.uid()));
-- beta_feedback
drop policy if exists admin_all on public.beta_feedback;
create policy admin_all on public.beta_feedback for all using (public.is_staff(auth.uid()));
-- fee_invoices (Eigenzugriff Verkäufer erhalten)
drop policy if exists invoices_select on public.fee_invoices;
create policy invoices_select on public.fee_invoices for select using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists invoices_admin_update on public.fee_invoices;
create policy invoices_admin_update on public.fee_invoices for update using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
-- fee_ledger
drop policy if exists fees_select on public.fee_ledger;
create policy fees_select on public.fee_ledger for select using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists fees_admin_update on public.fee_ledger;
create policy fees_admin_update on public.fee_ledger for update using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
-- listings
drop policy if exists listings_admin_select on public.listings;
create policy listings_admin_select on public.listings for select using (public.is_staff(auth.uid()));
-- purchases (Käufer/Verkäufer erhalten)
drop policy if exists admin_purchases on public.purchases;
create policy admin_purchases on public.purchases for all using ((buyer_id = auth.uid()) or (seller_id = auth.uid()) or public.is_staff(auth.uid()));
-- reports
drop policy if exists admin_updates_reports on public.reports;
create policy admin_updates_reports on public.reports for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
-- site_announcement
drop policy if exists ann_update on public.site_announcement;
create policy ann_update on public.site_announcement for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
-- company_settings: ABSICHTLICH UNVERÄNDERT (Firma owner-only)
```

- [ ] **Step 2: Owner-Regression verifizieren (kritisch)**

Live als Owner: `/admin` neu laden → alle Tabs laden weiter Daten (Übersicht-Zahlen, Benutzer, Rechnungen, Inserate, Protokoll). `preview_console_logs` (error): nur HMR-Artefakte. Dann `execute_sql`-Gegenprobe als simulierter Nicht-Staff (Marco), dass admin-only Lesen scheitert:
```sql
do $$ declare n int; begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001"}', true);
  select count(*) into n from public.admin_audit_log; -- RLS: Marco kein Staff -> 0 sichtbar
  raise notice 'marco sees % audit rows (erwartet 0)', n;
end $$;
```

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260617_admin_policies_is_staff.sql
git commit -m "feat(rbac): 11 admin-Policies auf is_staff erweitert, Firma bleibt owner-only (R2)"
```

---

### Task R3: `lib/staff.js`

**Files:**
- Create: `src/lib/staff.js`

- [ ] **Step 1: Datei**

```javascript
import { supabase } from "@/lib/supabase/supabase";

export const ROLE_LABELS = { support: "Support", finance: "Buchhaltung", moderation: "Moderation", manager: "Manager" };
export const ROLE_TABS = {
  support: ["overview", "users", "orders", "reports", "emails"],
  finance: ["overview", "invoices", "dunning", "analytics"],
  moderation: ["overview", "listings", "reports", "users"],
  manager: ["overview", "analytics", "users", "orders", "invoices", "listings", "emails", "dunning", "audit", "reports"],
};

export async function getMyRole(userId) {
  const { data } = await supabase.from("staff_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role || null;
}
export async function getStaffRoles() {
  const { data } = await supabase.from("staff_roles").select("user_id, role");
  return Object.fromEntries((data || []).map(r => [r.user_id, r.role]));
}
export async function setStaffRole(userId, role) {
  const { error } = await supabase.rpc("set_staff_role", { p_user_id: userId, p_role: role || "" });
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/staff.js
git commit -m "feat(rbac): lib/staff.js (ROLE_TABS, getMyRole, getStaffRoles, setStaffRole) (R3)"
```

---

### Task R4: `useAdminData` — Gate, Rolle, NAV-Filter, Staff-State

**Files:**
- Modify: `src/components/admin/useAdminData.jsx`
- Modify: `src/components/admin/tabs/AuditTab.jsx`

- [ ] **Step 1: Imports**

`import { getMyRole, getStaffRoles, setStaffRole as setStaffRoleRpc, ROLE_TABS } from "@/lib/staff";`
Bei den lucide-Icons `Users2` ergänzen.

- [ ] **Step 2: State**

Bei den anderen `useState`: `const [myRole, setMyRole] = useState(null);` und `const [staffRoles, setStaffRoles] = useState({});`.

- [ ] **Step 3: Gate umbauen** (`useAdminData.jsx` ~Z.75-77)

Ersetze
```javascript
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u || u.id !== ADMIN_ID) { window.location.href = "/"; return; }
      setUser(u);
```
durch
```javascript
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { window.location.href = "/"; return; }
      let role = null;
      if (u.id !== ADMIN_ID) {
        role = await getMyRole(u.id);
        if (!role) { window.location.href = "/"; return; }
      }
      setUser(u);
      setMyRole(role);
      if (u.id === ADMIN_ID) getStaffRoles().then(setStaffRoles);
```

- [ ] **Step 4: setStaffRole-Handler** (bei den anderen Handlern)

```javascript
const setStaffRole = async (userId, role) => {
  await setStaffRoleRpc(userId, role);
  setStaffRoles(prev => { const n = { ...prev }; if (role) n[userId] = role; else delete n[userId]; return n; });
  const _u = users.find(x => x.id === userId);
  flash(role ? "Rolle gesetzt" : "Rolle entfernt");
  logAdmin("staff_role_set", "user", _u?.display_name || userId, { role: role || null });
};
```

- [ ] **Step 5: NAV-Eintrag + Filter**

`NAV` um `{ key: "mitarbeiter", label: "Mitarbeiter", Icon: Users2 }` (ans Ende) ergänzen.
Nach der `NAV`-Definition:
```javascript
const isOwner = user?.id === ADMIN_ID;
const allowedTabs = isOwner ? NAV.map(n => n.key) : (ROLE_TABS[myRole] || ["overview"]);
const visibleNav = NAV.filter(n => allowedTabs.includes(n.key));
```
`pageTitle` auf `NAV` lassen (find by tab). Im return statt `NAV` → `NAV: visibleNav` und zusätzlich `isOwner, myRole, staffRoles, setStaffRole, allowedTabs`.

- [ ] **Step 6: AUDIT_META** (`tabs/AuditTab.jsx`, `Users2` importieren)

```javascript
  staff_role_set:       { label: "Mitarbeiter-Rolle gesetzt", Icon: Users2, color: "#0E9493", bg: "#E6F5F5" },
```

- [ ] **Step 7: Live verifizieren** — als Owner: `/admin` lädt, NAV zeigt jetzt auch „Mitarbeiter". Konsole sauber. (Staff-Sicht folgt in R6.)

- [ ] **Step 8: Commit** (mit R5).

---

### Task R5: `StaffTab.jsx` + AdminShell-Mount

**Files:**
- Create: `src/components/admin/tabs/StaffTab.jsx`
- Modify: `src/components/admin/AdminShell.jsx`

- [ ] **Step 1: StaffTab schreiben**

```jsx
"use client";
import { useState } from "react";
import { colors, fonts, radius } from "@/lib/theme";
import { ROLE_LABELS } from "@/lib/staff";

export function StaffTab({ admin }) {
  const { users, staffRoles, setStaffRole, isOwner } = admin;
  const [q, setQ] = useState("");
  if (!isOwner) return null;
  const roleEntries = Object.keys(ROLE_LABELS);
  const ql = q.toLowerCase().trim();
  const list = users.filter(u => !ql || (u.display_name || "").toLowerCase().includes(ql) || (u.username || "").toLowerCase().includes(ql));
  return (
    <div>
      <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 14px" }}>Weise Nutzern eine Admin-Rolle zu. Sie sehen dann nur die Tabs ihrer Rolle. Firma und Mitarbeiter bleiben dir vorbehalten.</p>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nutzer suchen…" style={{ width: "100%", maxWidth: 360, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "9px 15px", fontSize: 13, fontFamily: fonts.body, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
        {list.slice(0, 50).map(u => {
          const role = staffRoles[u.id] || "";
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: role ? colors.yellowSoft : "#EDEDEA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: colors.dark }}>{(u.display_name || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span></div>
                {role && <div style={{ fontSize: 11, color: "#0A7170", fontWeight: 600 }}>{ROLE_LABELS[role]}</div>}
              </div>
              <select value={role} onChange={e => setStaffRole(u.id, e.target.value)} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: fonts.body, background: "#fff", cursor: "pointer" }}>
                <option value="">Keine Rolle</option>
                {roleEntries.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: AdminShell-Mount**

Import `import { StaffTab } from "@/components/admin/tabs/StaffTab";` + im Tab-Bereich:
```jsx
          {/* ═══ MITARBEITER ═══ */}
          {tab === "mitarbeiter" && <StaffTab admin={admin} />}
```

- [ ] **Step 3: Live verifizieren (Owner)** — Mitarbeiter-Tab: Liste + Rollen-Dropdown; Testnutzer „Support" zuweisen → flash; `execute_sql` zeigt staff_roles-Eintrag + Audit `staff_role_set`.

- [ ] **Step 4: Commit**
```bash
git add src/components/admin/useAdminData.jsx src/components/admin/tabs/AuditTab.jsx src/components/admin/tabs/StaffTab.jsx src/components/admin/AdminShell.jsx
git commit -m "feat(rbac): Gate/NAV-Filter + Mitarbeiter-Tab + Rollen-Zuweisung (R4+R5)"
```

---

### Task R6: Beta-Checkliste + Abschluss-Verifizierung

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Beta-Punkte** (im Admin-Abschnitt)
```jsx
      { id: "adm_staff_assign", label: "Mitarbeiter-Tab (nur Owner): Rolle zuweisen/ändern/entfernen, Audit-Eintrag" },
      { id: "adm_staff_nav", label: "Mitarbeiter sehen nur die Tabs ihrer Rolle; Firma + Mitarbeiter nie" },
      { id: "adm_staff_gate", label: "Nutzer ohne Rolle wird vom Admin weggeleitet; Rolle entziehen sperrt wieder aus" },
      { id: "adm_staff_no_escalation", label: "Nicht-Owner kann keine Rolle setzen (RPC verweigert)" },
```

- [ ] **Step 2: RLS-Sicherheits-Gegenproben (execute_sql)**

```sql
-- Self-Escalation als Marco muss scheitern:
do $$ begin
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001"}', true);
  begin perform public.set_staff_role('00000000-0000-0000-0000-000000000001','manager');
    raise exception 'FAIL: Marco konnte sich Rolle geben';
  exception when others then raise notice 'OK: set_staff_role verweigert für Nicht-Owner'; end;
end $$;
```

- [ ] **Step 3: End-to-End live**

Owner weist Zeggy „Support" zu. (Falls als Zeggy einloggbar:) `/admin` als Zeggy → nur Support-Tabs, kein Firma/Mitarbeiter; sonst NAV-Filter über `allowedTabs` für `ROLE_TABS.support` prüfen (preview_eval: simulieren bzw. Owner-NAV vs. erwartetes Set vergleichen). Rolle entfernen → Zeggy-Gate redirectet.

- [ ] **Step 4: Baseline** — alle Test-Rollen entfernen (`delete from staff_roles`), Test-Audit (`staff_role_set`) bereinigen.

- [ ] **Step 5: Commit**
```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "chore(beta): RBAC-Checkliste + Abschluss-Verifizierung (R6)"
```

---

## Self-Review (gegen die Spec)

- **Abdeckung:** staff_roles+is_staff+RPC (R1) ✓, 11 Policy-Rewrites + company_settings unverändert (R2) ✓, ROLE_TABS/lib (R3) ✓, Gate+NAV-Filter+Staff-State+Audit (R4) ✓, Mitarbeiter-Tab+Mount (R5) ✓, Beta+Sicherheits-Gegenproben (R6) ✓.
- **Konsistenz:** `is_staff`/`set_staff_role`/`ROLE_TABS`/`getMyRole`/`getStaffRoles`/`setStaffRole`/`staffRoles`/`isOwner`/`myRole`/`allowedTabs` durchgängig. Rollen-Keys (support/finance/moderation/manager) identisch in CHECK-Constraint, RPC, ROLE_TABS, ROLE_LABELS.
- **Sicherheit:** Eigenzugriff-Klauseln in R2 erhalten; company_settings owner-only; staff_roles owner-write; RPC Caller-Check; Eskalations-Gegenprobe in R6.
- **Edge:** `setStaffRole` (Hook) vs. `setStaffRoleRpc` (lib) Alias-Import, um Namenskollision zu vermeiden.
