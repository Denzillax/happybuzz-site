# Firmeninfo / Platform-Creditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`). KEIN Unit-Test-Runner — Verifizierung LIVE über Browser-Preview (serverId `640a8f70-c285-4193-8e4f-9fd48fa12cdf`). NIEMALS `npm run build` neben dem Dev-Server. Commits ohne Co-Authored-By.

**Goal:** Admin-Tab „Firma" (Name/Adresse/IBAN/UID/Kontakt) als Singleton; ersetzt die hartkodierten BEEDARO-Werte als Empfänger der FEE-QR-Rechnungen.

**Architecture:** Singleton-Tabelle `company_settings` (id=1, RLS: alle lesen, nur Admin schreiben), `lib/company.js` als Leser, `feeQrPayload` + FEE-Rechnungsseite nehmen den Creditor aus der Config, Admin-Tab editiert sie.

**Tech Stack:** Next.js 14, Supabase (Singleton + RLS), modularer Admin-Hook.

**Referenz-Spec:** `docs/superpowers/specs/2026-06-17-firmeninfo-creditor-design.md`

**ADMIN_ID:** `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`

---

### Task C1: Migration `company_settings`

**Files:**
- Create: `supabase/migrations/20260617_company_settings.sql`
- DB: MCP `apply_migration` (name `company_settings`)

- [ ] **Step 1: Migrationsdatei + apply**

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
drop policy if exists company_settings_read on public.company_settings;
drop policy if exists company_settings_admin_write on public.company_settings;
create policy company_settings_read on public.company_settings for select using (true);
create policy company_settings_admin_write on public.company_settings for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);
insert into public.company_settings (id, name, street, postal_code, city, iban)
  values (1, 'BEEDARO', 'Gemeindehausstrasse 11B', '6010', 'Kriens', 'CH1234567890123456789')
  on conflict (id) do nothing;
```

- [ ] **Step 2: Verifizieren** — `execute_sql`: `select name, street, postal_code, city, iban from public.company_settings where id=1;` → die Seed-Zeile.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260617_company_settings.sql
git commit -m "feat(company): company_settings Singleton + RLS + Seed (C1)"
```

---

### Task C2: `lib/company.js`

**Files:**
- Create: `src/lib/company.js`

- [ ] **Step 1: Datei schreiben**

```javascript
import { supabase } from "@/lib/supabase/supabase";

export const DEFAULT_COMPANY = {
  name: "BEEDARO", street: "Gemeindehausstrasse 11B", postal_code: "6010", city: "Kriens",
  country: "CH", iban: "CH1234567890123456789", uid: "", contact_email: "", contact_phone: "",
};

export async function getCompanySettings() {
  const { data } = await supabase.from("company_settings").select("*").eq("id", 1).maybeSingle();
  return data || DEFAULT_COMPANY;
}

// IBAN gruppiert in 4er-Blöcken für die Anzeige (CH12 3456 …). Leer -> "".
export function formatIban(iban) {
  return (iban || "").replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/company.js
git commit -m "feat(company): getCompanySettings + formatIban Helfer (C2)"
```

---

### Task C3: `swissQR.js` — `feeQrPayload` nimmt `company`

**Files:**
- Modify: `src/lib/swissQR.js:37-47`

- [ ] **Step 1: feeQrPayload umbauen**

Ersetze die Funktion (Z. 37-47) durch:
```javascript
// Gebühren-Rechnung: Verkäufer -> Firma (company_settings). `company` = Creditor.
export function feeQrPayload(invoice, seller, company = {}) {
  const total = parseFloat(invoice.total_fees || 0);
  const ref = invoice.invoice_ref;
  const iban = (company.iban || "CH1234567890123456789").replace(/\s/g, "");
  const plzCity = `${company.postal_code || ""} ${company.city || ""}`.trim();
  return buildSwissQR({
    iban, name: company.name || "BEEDARO", street: company.street || "", plzCity,
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(seller), dStreet: seller?.street || "", dPlzCity: `${seller?.postal_code || ""} ${seller?.city || ""}`.trim(),
    message: `Gebuehren ${ref}`,
  });
}
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/swissQR.js
git commit -m "feat(company): feeQrPayload Creditor aus company statt hartkodiert (C3)"
```

---

### Task C4: FEE-Rechnungsseite nutzt die Config

**Files:**
- Modify: `src/app/(public)/fees/invoice/[id]/page.jsx`

- [ ] **Step 1: Import + State + Laden**

Import ergänzen: `import { getCompanySettings, formatIban } from "@/lib/company";`
State ergänzen (bei den anderen `useState`): `const [company, setCompany] = useState(null);`
Im `load()` (nach `setSeller(prof);`, vor dem `catch`): `setCompany(await getCompanySettings());`

- [ ] **Step 2: Hartkodierte Werte ersetzen**

- Z. 57-59 (`beedaroIban`/`beedaroIbanDisplay`) ersetzen durch:
```javascript
  const co = company || {};
  const beedaroIbanDisplay = formatIban(co.iban);
  const coAddr = [co.name, co.street, `${co.postal_code || ""} ${co.city || ""}`.trim()].filter(Boolean);
```
- Z. 62 QR: `const qrPayload = feeQrPayload(invoice, seller, company);`
- Empfänger-Header (Z. ~92) `BEEDARO` → `{co.name}`.
- „Konto / Zahlbar an"-Zeile (Z. ~148): `v: "BEEDARO\n…"` → `v: coAddr.join("\n")`.
- „IBAN"-Zeile (Z. ~149): bleibt `v: beedaroIbanDisplay` (jetzt aus Config).
- Fusszeile (Z. ~172) `BEEDARO · Gemeindehausstrasse 11B · 6010 Kriens` → `{coAddr.join(" · ")}{co.uid ? ` · ${co.uid}` : ""}` und eine zweite Fusszeile mit Kontakt falls vorhanden: `{(co.contact_email || co.contact_phone) && <p style={{ margin: 0 }}>{[co.contact_email, co.contact_phone].filter(Boolean).join(" · ")}</p>}`.

(Wichtig: solange `company === null` lädt, ist `co = {}` → Anzeige leer; da `load()` company mitlädt, ist sie vor dem Render gesetzt. Optional `if (!company) ...` im Loading-Guard mit abdecken: den bestehenden `loading`-Guard nutzt die Seite bereits.)

- [ ] **Step 3: Live verifizieren** — eine FEE-Rechnung öffnen (`/fees/invoice/<id>`): Empfänger/Adresse/IBAN/Fuss zeigen die Seed-Werte; QR lädt. Konsole fehlerfrei.

- [ ] **Step 4: Commit**
```bash
git add "src/app/(public)/fees/invoice/[id]/page.jsx"
git commit -m "feat(company): FEE-Rechnung nutzt company_settings (Empfaenger/IBAN/Fuss/QR) (C4)"
```

---

### Task C5: Admin-Hook — company-State, save, NAV, Audit

**Files:**
- Modify: `src/components/admin/useAdminData.jsx`
- Modify: `src/components/admin/tabs/AuditTab.jsx`

- [ ] **Step 1: Imports**

`import { getCompanySettings, DEFAULT_COMPANY } from "@/lib/company";`
Bei den lucide-Icons `Building2` ergänzen.

- [ ] **Step 2: State + Laden + Save**

State: `const [company, setCompany] = useState(DEFAULT_COMPANY);`
Im initialen Lade-Effekt (wo stats/users geladen werden) ergänzen: `getCompanySettings().then(c => { if (active) setCompany(c); });` (oder im bestehenden async-load `setCompany(await getCompanySettings())`).
Handler (bei den anderen Handlern):
```javascript
const saveCompany = async (next) => {
  const { error } = await supabase.from("company_settings").upsert({ id: 1, ...next, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) { flash("Fehler beim Speichern"); return; }
  setCompany(next);
  flash("Firmendaten gespeichert");
  logAdmin("company_update", "company", next.name);
};
```

- [ ] **Step 3: NAV + return**

`NAV` um einen Eintrag ergänzen (ans Ende): `{ key: "company", label: "Firma", Icon: Building2 }`.
Ins return-Objekt: `company, setCompany, saveCompany,`.

- [ ] **Step 4: AUDIT_META**

In `tabs/AuditTab.jsx` Eintrag ergänzen (Icon `Building2` dort importieren):
```javascript
  company_update:       { label: "Firmendaten geändert",  Icon: Building2,   color: "#0E9493", bg: "#E6F5F5" },
```

- [ ] **Step 5: Commit** (zusammen mit C6).

---

### Task C6: `CompanyTab.jsx` + AdminShell-Mount

**Files:**
- Create: `src/components/admin/tabs/CompanyTab.jsx`
- Modify: `src/components/admin/AdminShell.jsx`

- [ ] **Step 1: CompanyTab schreiben**

```jsx
"use client";
import { useState } from "react";
import { colors, fonts, radius } from "@/lib/theme";

const FIELDS = [
  { group: "Firma", items: [["name", "Firmenname"], ["uid", "UID / MwSt-Nr (CHE-…)"]] },
  { group: "Adresse", items: [["street", "Strasse + Nr."], ["postal_code", "PLZ"], ["city", "Ort"], ["country", "Land"]] },
  { group: "Zahlung", items: [["iban", "IBAN"]] },
  { group: "Kontakt", items: [["contact_email", "E-Mail"], ["contact_phone", "Telefon"]] },
];

export function CompanyTab({ admin }) {
  const { company, saveCompany } = admin;
  const [form, setForm] = useState(company);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const ibanClean = (form.iban || "").replace(/\s/g, "").toUpperCase();
  const ibanOk = ibanClean === "" || (/^(CH|LI)[0-9A-Z]{19}$/.test(ibanClean));
  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 18px" }}>Diese Angaben erscheinen als Empfänger auf den Gebühren-QR-Rechnungen (FEE).</p>
      {FIELDS.map(g => (
        <div key={g.group} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 10 }}>{g.group}</div>
          <div style={{ display: "grid", gridTemplateColumns: g.items.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
            {g.items.map(([k, label]) => (
              <label key={k} style={{ fontSize: 12, fontWeight: 600, color: colors.dark }}>
                {label}
                <input value={form[k] || ""} onChange={e => set(k, e.target.value)} style={{ width: "100%", marginTop: 4, border: `1px solid ${k === "iban" && !ibanOk ? "#EB5E55" : colors.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                {k === "iban" && !ibanOk && <span style={{ fontSize: 11, color: "#EB5E55" }}>IBAN sollte mit CH/LI beginnen (21 Zeichen).</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => saveCompany({ ...form, iban: ibanClean })} style={{ padding: "10px 22px", borderRadius: 999, border: "none", background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
    </div>
  );
}
```

- [ ] **Step 2: AdminShell-Mount**

Import `import { CompanyTab } from "@/components/admin/tabs/CompanyTab";` + im Tab-Bereich:
```jsx
          {/* ═══ FIRMA ═══ */}
          {tab === "company" && <CompanyTab admin={admin} />}
```

- [ ] **Step 3: Live verifizieren** (Admin)

`/admin` → NAV „Firma" → Formular vorbefüllt (Seed). IBAN + Adresse ändern → Speichern → flash; nach Reload noch da (`execute_sql`). Dann FEE-Rechnung öffnen → neue Werte im Empfänger/IBAN/Fuss + QR. `preview_console_logs` (error): nur HMR-Artefakte.

- [ ] **Step 4: Commit**
```bash
git add src/components/admin/useAdminData.jsx src/components/admin/tabs/AuditTab.jsx src/components/admin/tabs/CompanyTab.jsx src/components/admin/AdminShell.jsx
git commit -m "feat(admin): Firma-Tab (company_settings bearbeiten) + Nav + Audit (C5+C6)"
```

---

### Task C7: Beta-Checkliste + Abschluss

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Im Admin-Abschnitt ergänzen**
```jsx
      { id: "adm_company_tab", label: "Firma-Tab: Firmendaten (Name/Adresse/IBAN/UID/Kontakt) bearbeiten + speichern, bleibt nach Reload" },
      { id: "adm_company_qr", label: "FEE-QR-Rechnung: Empfänger/IBAN/Fuss + QR-Code nutzen die konfigurierten Firmendaten" },
      { id: "adm_company_invoice_extra", label: "FEE-Rechnung: UID/MwSt + Kontakt erscheinen im Rechnungsfuss" },
```

- [ ] **Step 2: End-to-End live** — Firma ändern → FEE-Rechnung spiegelt alles (Anzeige + QR-Payload), UID/Kontakt im Fuss. Baseline: Werte auf Seed/Demo zurück.

- [ ] **Step 3: Commit**
```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "chore(beta): Firma-Checkliste + Abschluss-Verifizierung (C7)"
```

---

## Self-Review (gegen die Spec)

- **Abdeckung:** Migration+Seed+RLS (C1) ✓, lib (C2) ✓, feeQrPayload (C3) ✓, FEE-Seite Anzeige+QR+UID/Kontakt (C4) ✓, Hook/Save/NAV/Audit (C5) ✓, Tab+Mount (C6) ✓, Beta+Verifizierung (C7) ✓.
- **Konsistenz:** `getCompanySettings`/`DEFAULT_COMPANY`/`formatIban`/`feeQrPayload(invoice, seller, company)`/`saveCompany`/`company` durchgängig; Feldnamen = Tabellenspalten.
- **Edge:** Default-Fallback wenn Zeile fehlt; Bestell-Rechnung unberührt; normale IBAN (NON-Referenz) wie heute; Singleton id=1.
