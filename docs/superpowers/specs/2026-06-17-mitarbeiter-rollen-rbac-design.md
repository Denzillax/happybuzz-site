# Mitarbeiter + Rollen (RBAC) — Design Spec

**Datum:** 2026-06-17
**Teil 2 von 2** (Teil 1 = Firmeninfo, abgeschlossen)

## Ziel
Der Owner kann Nutzern eine Admin-Rolle zuweisen. Mitarbeiter erhalten Zugang zum Admin, sehen aber nur die ihrer Rolle zugeordneten Tabs. Sicherheitsmodell: Mitarbeiter sind vertrauenswürdig (breiter DB-Lesezugriff), die Rolle filtert die Tabs (UI). Die Rollen-Zuweisung bleibt dem Owner vorbehalten.

## Entscheidungen (freigegeben)
- **Sicherheitsmodell A:** Die admin-gegateten RLS-Policies erweitern auf „Admin ODER Mitarbeiter" (`is_staff`). Keine fein-granulare Daten-Trennung zwischen Rollen — die Rolle wirkt UI-seitig (NAV-Filter).
- **Feste Rollen (Presets)** mit fixem Tab-Set, im Code (`ROLE_TABS`).
- **Firma + Mitarbeiter sind Owner-only** Tabs (nie an Rollen vergeben).
- Rollen-Zuweisung nur durch den Owner (`ADMIN_ID`).

## Verankerte Fakten (geprüft)
- Admin-Gate: `src/components/admin/useAdminData.jsx` ~Z.72 `if (!u || u.id !== ADMIN_ID) { window.location.href = "/"; return; }`. `ADMIN_ID = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'`.
- 12 Policies an der Admin-ID (genaue Defs geprüft); mehrere mit zusätzlichem Eigenzugriff:
  - `((seller_id = auth.uid()) OR <admin>)`: fee_invoices (invoices_select, invoices_admin_update), fee_ledger (fees_select, fees_admin_update).
  - `((buyer_id = auth.uid()) OR (seller_id = auth.uid()) OR <admin>)`: purchases (admin_purchases, ALL).
  - nur `<admin>`: admin_audit_log (insert check, select), beta_feedback (ALL), listings_admin_select (select), reports (admin_updates_reports, update using+check), site_announcement (ann_update, update using+check), company_settings (company_settings_admin_write, ALL).
- `company_settings_read` ist `using(true)` (öffentlich lesbar) — bleibt.
- NAV in useAdminData: Array `{ key, label, Icon, badge }`. Tabs: overview, analytics, users, orders, invoices, listings, emails, dunning, audit, reports, company (+ neu: mitarbeiter).

## Datenmodell
Migration `staff_roles` (eigene Tabelle — NICHT Spalte auf profiles, sonst könnte sich jeder über die profiles-Self-Update-Policy selbst hochstufen):
```sql
create table if not exists public.staff_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint staff_roles_role_check check (role in ('support','finance','moderation','manager'))
);
alter table public.staff_roles enable row level security;
-- lesen: Staff + Eigeneintrag (fürs Gate); schreiben: nur Owner
create policy staff_roles_read on public.staff_roles for select
  using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy staff_roles_owner_write on public.staff_roles for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);
```
Helfer (SECURITY DEFINER, umgeht RLS → keine Rekursion):
```sql
create or replace function public.is_staff(uid uuid)
returns boolean language sql security definer stable set search_path to 'public' as $$
  select uid = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid
      or exists (select 1 from public.staff_roles s where s.user_id = uid);
$$;
```
Owner-RPC (Selbst-Hochstufung ausgeschlossen, da Caller-Check):
```sql
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

## RLS-Umschreibung (11 von 12 Policies)
Jede Policy droppen + neu anlegen, dabei `(auth.uid() = '48fb…'::uuid)` durch `public.is_staff(auth.uid())` ersetzen, Eigenzugriff-Klauseln erhalten:
- admin_audit_log: insert WITH CHECK `is_staff`, select USING `is_staff`.
- beta_feedback admin_all: USING `is_staff`.
- fee_invoices invoices_select / invoices_admin_update: USING `((seller_id = auth.uid()) OR public.is_staff(auth.uid()))`.
- fee_ledger fees_select / fees_admin_update: USING `((seller_id = auth.uid()) OR public.is_staff(auth.uid()))`.
- listings_admin_select: USING `is_staff`.
- purchases admin_purchases: USING `((buyer_id = auth.uid()) OR (seller_id = auth.uid()) OR public.is_staff(auth.uid()))`.
- reports admin_updates_reports: USING + WITH CHECK `is_staff`.
- site_announcement ann_update: USING + WITH CHECK `is_staff`.
- **company_settings_admin_write: UNVERÄNDERT (bleibt nur Owner)** — Firma ist owner-only.

## Zugang + NAV (`useAdminData.jsx`)
- Beim Laden: `myRole` ermitteln — `user.id === ADMIN_ID` → Owner (alle Tabs); sonst `staff_roles`-Eintrag lesen. Kein Eintrag und kein Owner → Redirect `/` (wie heute).
- `ROLE_TABS` (Code): Mapping Rolle → erlaubte Tab-Keys (siehe unten). Owner = alle. NAV wird auf `allowedTabs` gefiltert; `setTab` clampt auf erlaubte (Default = erster erlaubter).
- Der „mitarbeiter"- und „company"-Tab sind nur für den Owner in der NAV.

## ROLE_TABS (Presets)
- **support:** overview, users, orders, reports, emails
- **finance:** overview, invoices, dunning, analytics
- **moderation:** overview, listings, reports, users
- **manager:** overview, analytics, users, orders, invoices, listings, emails, dunning, audit, reports (alle ausser company + mitarbeiter)
- **owner (ADMIN_ID):** alle inkl. company + mitarbeiter

## Mitarbeiter-Tab (Owner-only) — `tabs/StaffTab.jsx`
- Nutzer-Suche/Liste (wie Benutzer-Liste, reuse `users`); pro Nutzer ein Rollen-Dropdown: Keine / Support / Buchhaltung / Moderation / Manager.
- Auswahl ruft Hook-Handler `setStaffRole(userId, role)` → `supabase.rpc('set_staff_role', …)`, aktualisiert lokalen `staffRoles`-State, `flash`, `logAdmin("staff_role_set", "user", name, { role })`.
- AUDIT_META-Eintrag `staff_role_set`. NAV-Eintrag `{ key:"mitarbeiter", label:"Mitarbeiter", Icon: Users2 }` (nur Owner).

## Sicherheit / Edge-Cases
- **Keine Selbst-Hochstufung:** staff_roles nur Owner-schreibbar; `set_staff_role` prüft Caller = Owner.
- **Firma + Mitarbeiter owner-only** (UI-Filter + company_settings-Write bleibt Owner-RLS).
- Staff-Aktionen werden mit ihrer ID protokolliert (logAdmin nutzt user.id).
- Modell A bewusst: ein Mitarbeiter kann technisch alle (nicht-company) Admin-Daten per API lesen/ändern — Rolle ist UI-Scope, kein DB-Schutz zwischen Rollen. Dokumentiert.
- Client-Gating + breite RLS heisst: das NAV-Filter ist Komfort, die DB-Grenze ist „Staff vs. Öffentlichkeit".

## Verifizierung (live, KEIN `npm run build`)
1. Als Owner: Mitarbeiter-Tab → Testnutzer (Zeggy) Rolle „Support" zuweisen → `execute_sql` zeigt staff_roles-Eintrag + Audit.
2. Gate/NAV: simulieren, dass `is_staff(zeggy)` true ist; prüfen (SQL) dass eine Support-RLS-Leseabfrage als Zeggy klappt (z.B. admin_audit_log select) und company_settings-Write als Zeggy scheitert.
3. Als Owner bleibt alles sichtbar inkl. Mitarbeiter/Firma.
4. Rolle entziehen (Keine) → staff_roles-Eintrag weg → `is_staff(zeggy)` false.
5. Baseline: Testrolle entfernen.

## Beta-Checkliste (erweitern)
- `adm_staff_assign` — Owner kann im Mitarbeiter-Tab Rollen zuweisen/ändern/entfernen (nur Owner sieht den Tab).
- `adm_staff_nav` — Mitarbeiter sehen nur die Tabs ihrer Rolle; Firma + Mitarbeiter nie.
- `adm_staff_gate` — Nutzer ohne Rolle werden vom Admin weggeleitet; Rolle entziehen sperrt wieder aus.
- `adm_staff_no_escalation` — Ein Nicht-Owner kann keine Rollen setzen (RPC verweigert).
