# Firmeninfo / Platform-Creditor — Design Spec

**Datum:** 2026-06-17
**Teil 1 von 2** (Teil 2 = Mitarbeiter/Rollen-RBAC, separate Spec)

## Ziel
Ein Admin-Tab „Firma" für Firmenname, Adresse, IBAN (+ UID/MwSt, Kontakt). Diese Daten ersetzen die heute hartkodierten BEEDARO-Werte als Empfänger (Creditor) in den FEE-QR-Rechnungen.

## Entscheidungen (freigegeben)
- Felder: **Firmenname, Strasse, PLZ, Ort, Land (Default CH), IBAN** (Pflicht-Kern) + **UID/MwSt-Nr (CHE-…)** + **Kontakt (E-Mail, Telefon)**. Kein Logo, keine separate QR-IBAN (normale IBAN ohne Referenz wie heute).
- Eigener Admin-NAV-Tab „Firma".
- Betrifft nur die **FEE-Rechnungen** (Platform-Creditor). Bestell-Rechnungen (P2P) nutzen weiterhin das Verkäufer-Profil — unverändert.

## Verankerte Fakten (geprüft)
- Hartkodierter Creditor heute an zwei Stellen:
  - [swissQR.js:38-44](src/lib/swissQR.js:38) `feeQrPayload(invoice, seller)` → `iban: "CH1234567890123456789", name: "BEEDARO", street: "Gemeindehausstrasse 11B", plzCity: "6010 Kriens"`.
  - [fees/invoice/[id]/page.jsx](src/app/(public)/fees/invoice/[id]/page.jsx): `beedaroIban`/`beedaroIbanDisplay` (Z. 57-58), Empfänger-Header „BEEDARO" (Z. 92), „Konto / Zahlbar an" + „IBAN" (Z. 148-149), Fusszeile (Z. 172).
- `dunning.js` enthält **keine** IBAN/Adresse (verweist nur auf „die QR-Rechnung in deinem Konto") → kein Konsument, keine Änderung.
- Order-Invoice nutzt `payee.*` (Verkäufer-Profil) via `orderQrPayload` → nicht betroffen.
- Singleton-Muster existiert bereits: `site_announcement` (id=1, RLS select using(true), update admin-only `auth.uid() = '48fbdb7f-…'`). Wird gespiegelt.
- Admin-NAV in `useAdminData.jsx` (`const NAV = [{ key, label, Icon, badge? }]`), lucide-Icons dort importiert.

## Datenmodell
Migration `company_settings`:
```sql
create table if not exists public.company_settings (
  id int primary key default 1,
  name text not null default 'BEEDARO',
  street text not null default '',
  postal_code text not null default '',
  city text not null default '',
  country text not null default 'CH',
  iban text not null default '',
  uid text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);
alter table public.company_settings enable row level security;
create policy company_settings_read on public.company_settings for select using (true);
create policy company_settings_admin_write on public.company_settings for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);
-- Seed mit heutigen Werten, damit nichts bricht bis zur echten IBAN:
insert into public.company_settings (id, name, street, postal_code, city, iban)
  values (1, 'BEEDARO', 'Gemeindehausstrasse 11B', '6010', 'Kriens', 'CH1234567890123456789')
  on conflict (id) do nothing;
```

## Komponenten
- **`src/lib/company.js`** — `getCompanySettings()` liest den Singleton (`.eq("id",1).maybeSingle()`), liefert bei Fehlen ein Default-Objekt (gleiche Werte wie Seed), damit Rechnungen nie ohne Creditor sind.
- **`src/lib/swissQR.js`** — `feeQrPayload(invoice, seller, company)`: Creditor aus `company` (iban ohne Leerzeichen, name, street, `${company.postal_code} ${company.city}`) statt hartkodiert. Default-Parameter auf das Default-Objekt, falls `company` fehlt.
- **`src/app/(public)/fees/invoice/[id]/page.jsx`** — lädt `getCompanySettings()`, ersetzt die hartkodierten Zeilen (Header-Name, Konto/Zahlbar-an-Adresse, IBAN-Anzeige formatiert, Fuss) und übergibt `company` an `feeQrPayload`. UID/Kontakt zusätzlich im Rechnungsfuss anzeigen.
- **`src/components/admin/useAdminData.jsx`** — State `company`/`setCompany` (Lazy-Load bei tab==="company" oder beim Mount), `saveCompany()` (`upsert({ id:1, …, updated_at })`, RLS-Admin), `flash`, `logAdmin("company_update","company", company.name)`. Neue Bezeichner ins return. NAV-Eintrag `{ key:"company", label:"Firma", Icon: Building2 }` + Building2-Import. `AUDIT_META` (AuditTab) Eintrag `company_update`.
- **`src/components/admin/tabs/CompanyTab.jsx`** — Formular (alle Felder, gruppiert: Firma / Adresse / Zahlung / Kontakt), „Speichern". Leichte IBAN-Prüfung (Grossbuchstaben, Leerzeichen strippen, Start „CH"/„LI", Länge 21) als Hinweis, nicht blockierend.
- **`src/components/admin/AdminShell.jsx`** — `{tab === "company" && <CompanyTab admin={admin} />}` + Import.

## Edge-Cases & Non-Goals
- Order-/Miet-Rechnungen unverändert (Verkäufer-Creditor).
- Keine QR-IBAN/QR-Referenz (NON-Referenz wie heute).
- Kein Logo-Upload.
- Singleton: immer id=1; UI lädt/speichert nur diese Zeile.
- Fehlt die Zeile (sollte durch Seed nie passieren), greift das Default-Objekt → Rechnung bleibt funktional.

## Verifizierung (live als Admin, KEIN `npm run build`)
1. Firma-Tab öffnen → Felder vorbefüllt (Seed-Werte).
2. IBAN + Adresse ändern, speichern → flash; nach Reload noch da; `execute_sql` bestätigt die Zeile.
3. Eine FEE-Rechnung öffnen → „Konto / Zahlbar an", IBAN-Zeile und Fuss zeigen die neuen Werte; QR-Payload (Decode/Inspektion) enthält die neue IBAN/Name/Adresse.
4. UID + Kontakt erscheinen im Rechnungsfuss.
5. Baseline: Werte auf die Seed-/Demo-Werte zurücksetzen.

## Beta-Checkliste (erweitern)
- `adm_company_tab` — Firma-Tab: Felder bearbeiten + speichern, bleibt nach Reload.
- `adm_company_qr` — FEE-QR-Rechnung (QR + angezeigter Empfänger/IBAN/Fuss) nutzt die konfigurierten Firmendaten.
- `adm_company_invoice_extra` — UID/MwSt + Kontakt erscheinen auf der FEE-Rechnung.
