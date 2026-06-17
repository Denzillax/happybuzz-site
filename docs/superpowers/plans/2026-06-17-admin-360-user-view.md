# 360°-Nutzer-Ansicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`). KEIN Unit-Test-Runner — Verifizierung LIVE über Browser-Preview (serverId `640a8f70-c285-4193-8e4f-9fd48fa12cdf`). NIEMALS `npm run build` neben dem Dev-Server. Commits ohne Co-Authored-By.

**Goal:** Read-only 360°-Profil-Ansicht pro Nutzer im Admin (Kennzahlen-Kopf, Risiko-Ampel, Admin-Notiz, Aktions-/Sperrhistorie + bestehende Sub-Daten), geöffnet per Zeilen-Klick statt Inline-Aufklappen.

**Architecture:** In-SPA Fokus-Ansicht: Hook hält `openProfile` (userId|null); `UsersTab` rendert die Liste oder die neue `tabs/UserProfile.jsx`. Das bisherige Inline-Aufklappen wird in `UserProfile` verschoben (keine Redundanz). Konto-Aktionen (Sperre/ID) + private Notiz (`user_notes`) bleiben; sonst read-only.

**Tech Stack:** Next.js 14, Supabase (`user_notes`, `admin_audit_log`), modularer Admin-Hook.

**Referenz-Spec:** `docs/superpowers/specs/2026-06-17-admin-360-user-view-design.md`

---

### Task U1: Hook — Profil-State, Laden, Notiz speichern

**Files:**
- Modify: `src/components/admin/useAdminData.jsx`

- [ ] **Step 1: State ergänzen** (bei den anderen `useState`, z.B. nach `userInvoices`):

```javascript
  const [openProfile, setOpenProfile] = useState(null);
  const [userNote, setUserNote] = useState("");
  const [profileAudit, setProfileAudit] = useState([]);
```

- [ ] **Step 2: Handler einfügen** (direkt nach `toggleUser`, ~Zeile 261):

```javascript
  const openUserProfile = async (userId) => {
    setOpenProfile(userId);
    setUserNote(""); setProfileAudit([]);
    if (!userListings[userId]) {
      const { data } = await supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      setUserListings(prev => ({ ...prev, [userId]: data || [] }));
    }
    if (!userFees[userId]) {
      const { data } = await supabase.from("fee_ledger").select("*").eq("seller_id", userId).order("created_at", { ascending: false });
      setUserFees(prev => ({ ...prev, [userId]: data || [] }));
    }
    if (!userInvoices[userId]) {
      const { data } = await supabase.from("fee_invoices").select("*").eq("seller_id", userId).order("created_at", { ascending: false });
      setUserInvoices(prev => ({ ...prev, [userId]: data || [] }));
    }
    if (!userTab[userId]) setUserTab(prev => ({ ...prev, [userId]: "inserate" }));
    const u = users.find(x => x.id === userId);
    const { data: note } = await supabase.from("user_notes").select("text").eq("noter_id", ADMIN_ID).eq("noted_id", userId).maybeSingle();
    setUserNote(note?.text || "");
    if (u?.display_name) {
      const { data: aud } = await supabase.from("admin_audit_log").select("*").eq("target_label", u.display_name).order("created_at", { ascending: false }).limit(50);
      setProfileAudit(aud || []);
    }
  };
  const closeProfile = () => setOpenProfile(null);
  const saveUserNote = async (userId, text) => {
    await supabase.from("user_notes").upsert({ noter_id: ADMIN_ID, noted_id: userId, text, updated_at: new Date().toISOString() }, { onConflict: "noter_id,noted_id" });
    setUserNote(text);
    flash("Notiz gespeichert");
  };
```

- [ ] **Step 3: Returns ergänzen** (in das `return {…}`-Objekt, bei der Users-Zeile):

```javascript
    openProfile, openUserProfile, closeProfile, userNote, saveUserNote, profileAudit,
```

- [ ] **Step 4: Live verifizieren** — `/admin` lädt fehlerfrei (navCount 10), Konsole nur HMR-Artefakte. (UI-Wirkung kommt mit U2/U3.)

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/useAdminData.jsx
git commit -m "feat(admin): Hook-State + Loader für 360-Profil (openUserProfile/saveUserNote) (U1)"
```

---

### Task U2: `UserProfile.jsx` — die volle Ansicht

**Files:**
- Modify: `src/components/admin/tabs/AuditTab.jsx` (AUDIT_META exportieren)
- Create: `src/components/admin/tabs/UserProfile.jsx`

- [ ] **Step 1: AUDIT_META exportierbar machen**

In `AuditTab.jsx` `const AUDIT_META = {` → `export const AUDIT_META = {`. (dayLabel bleibt lokal.)

- [ ] **Step 2: `UserProfile.jsx` anlegen — Gerüst + Kopf + Kennzahlen + Ampel + Notiz + Historie**

```jsx
"use client";
import { useState } from "react";
import { ArrowLeft, Shield, Flag, Clock } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";
import { AUDIT_META } from "@/components/admin/tabs/AuditTab";

export function UserProfile({ admin }) {
  const {
    users, openProfile, closeProfile, toggleBan, setUsers, flash, logAdmin,
    userNote, saveUserNote, profileAudit,
    userListings, userFees, userInvoices, userTab, setUserTab, openInvoice, setOpenInvoice,
    orders, reviews, emailLog, statusPill, toggleListingStatus, cancelOrder, deleteReview,
    sc, pill: _pill, dunningTimeline, mahnButton, confirmAndReactivate, emailCard,
  } = admin;
  const u = users.find(x => x.id === openProfile);
  const [note, setNote] = useState(userNote);
  if (!u) return null;

  const uLst = userListings[u.id] || [];
  const uFee = userFees[u.id] || [];
  const uInv = userInvoices[u.id] || [];
  const uOrders = orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id);
  const sales = uOrders.filter(o => o.seller_id === u.id && o.status !== "cancelled");
  const purchases = uOrders.filter(o => o.buyer_id === u.id && o.status !== "cancelled");
  const revenue = sales.reduce((s, o) => s + parseFloat(o.price || 0), 0);
  const openFees = uInv.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.total_fees || 0), 0);
  const viol = u.contact_violations || 0;
  const risk = (u.is_banned || viol >= 3 || openFees > 0) ? { c: "#EB5E55", l: "Hoch", why: u.is_banned ? "Konto gesperrt" : openFees > 0 ? "offene Gebühren" : "≥3 Verstösse" }
    : (viol >= 1 || uInv.some(i => i.status !== "paid")) ? { c: "#E5A100", l: "Mittel", why: viol >= 1 ? `${viol} Verstoss/Verstösse` : "unbezahlte Rechnung" }
    : { c: colors.green, l: "Niedrig", why: "keine Auffälligkeiten" };

  const KPI = (label, value, sub) => (
    <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", minWidth: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, marginTop: 4 }}>{value}{sub && <span style={{ fontSize: 11, fontWeight: 600, color: colors.muted }}> {sub}</span>}</div>
    </div>
  );

  return (
    <div>
      {/* Kopf */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button onClick={closeProfile} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: colors.cream, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, color: colors.dark }}><ArrowLeft size={15} /> Zurück</button>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.is_banned ? "#EDEDEA" : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: u.is_banned ? "#999" : colors.dark }}>{(u.display_name || "?")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head }}>{u.display_name || "—"} <span style={{ fontSize: 13, fontWeight: 400, color: colors.muted }}>@{u.username || "—"}</span></div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {u.is_banned ? pill("#EB5E55", "#fff", "Gesperrt") : pill("#E8F5E9", "#2E7D32", "Aktiv")}
            {u.id_verified ? pill("#E6F5F5", "#0A7170", "ID verifiziert") : u.id_document_url ? pill("#FFF8E1", "#E65100", "ID ausstehend") : null}
            {pill(colors.cream, colors.dark, u.account_type === "business" ? "Unternehmen" : "Privat")}
          </div>
        </div>
        <button onClick={() => toggleBan(u)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff", border: `1px solid ${u.is_banned ? "#aed8b0" : "#e6a6a6"}`, color: u.is_banned ? "#2E7D32" : "#c0392b" }}>{u.is_banned ? "Entsperren" : "Konto sperren"}</button>
      </div>

      {/* ID-Prüfung (falls Dokument + nicht verifiziert) */}
      {u.id_document_url && !u.id_verified && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FFF8E1", borderRadius: radius.lg, marginBottom: 14 }}>
          <Shield size={16} color="#F4A100" />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#E65100" }}>ID hochgeladen — Prüfung ausstehend</span>
          <a href={u.id_document_url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>Dokument ansehen</a>
          <button onClick={async () => { await supabase.from("profiles").update({ id_verified: true }).eq("id", u.id); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_verified: true } : x)); flash("ID verifiziert"); logAdmin("id_verify", "user", u.display_name); }} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Bestätigen</button>
          <button onClick={async () => { const { data: files } = await supabase.storage.from("id-documents").list(u.id); if (files?.length) await supabase.storage.from("id-documents").remove(files.map(f => `${u.id}/${f.name}`)); await supabase.from("profiles").update({ id_document_url: null, id_verified: false }).eq("id", u.id); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_document_url: null, id_verified: false } : x)); flash("ID abgelehnt"); logAdmin("id_reject", "user", u.display_name); }} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Ablehnen</button>
        </div>
      )}

      {/* Kennzahlen-Kopf */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {KPI("Mitglied seit", u.created_at ? fmtDate(u.created_at) : "—")}
        {KPI("Bee-Level", u.bee_level || "starter", `· ${(u.blueten || 0).toLocaleString("de-CH")} Blüten`)}
        {KPI("Käufe / Verkäufe", `${purchases.length} / ${sales.length}`)}
        {KPI("Umsatz", `CHF ${fmtCHF(revenue)}`)}
        {KPI("Offene Gebühren", `CHF ${fmtCHF(openFees)}`)}
        {KPI("Kontaktverstösse", viol)}
      </div>

      {/* Risiko-Ampel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#fff", border: `1px solid ${risk.c}55`, borderRadius: radius.lg, marginBottom: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: risk.c, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: risk.c }}>Risiko: {risk.l}</span>
        <span style={{ fontSize: 12, color: colors.muted }}>· {risk.why}</span>
      </div>

      {/* Admin-Notiz */}
      <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 6 }}>Admin-Notiz <span style={{ textTransform: "none", fontWeight: 400 }}>· nur für dich sichtbar</span></div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Interne Notiz zu diesem Nutzer…" style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: fonts.body, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        <button onClick={() => saveUserNote(u.id, note)} style={{ marginTop: 8, padding: "7px 16px", borderRadius: 999, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
      </div>

      {/* Aktions-/Sperrhistorie */}
      <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 8 }}>Aktions-/Sperrhistorie</div>
        {profileAudit.length === 0 ? <div style={{ fontSize: 12, color: colors.muted }}>Keine Aktionen protokolliert.</div> : profileAudit.map(a => {
          const meta = AUDIT_META[a.action] || { label: a.action, Icon: Clock, color: colors.muted, bg: colors.cream };
          const Icon = meta.Icon;
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={14} color={meta.color} /></span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: colors.muted }}>{a.created_at ? fmtDate(a.created_at) : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Sub-Tabs — aus dem bisherigen UsersTab-Aufklappen übernommen */}
      {/* SUBTABS_PLACEHOLDER */}
    </div>
  );
}
```

- [ ] **Step 3: Sub-Tabs einsetzen**

Ersetze `{/* SUBTABS_PLACEHOLDER */}` durch den Sub-Tab-Block aus dem bisherigen UsersTab-Aufklappen (die Tab-Leiste `[{key:"inserate",…}]` + die fünf `{(userTab[u.id]||"inserate")==="…" && (…)}`-Blöcke für Inserate/Rechnungen/Bestellungen/Bewertungen/E-Mails). Beim Verschieben unverändert lassen (gleiche Variablen `uLst/uFee/uInv/orders/reviews/emailLog/pill/sc/statusPill/toggleListingStatus/cancelOrder/deleteReview/dunningTimeline/mahnButton/confirmAndReactivate/openInvoice/setOpenInvoice/emailCard`). `pill` direkt aus adminStyles importieren statt aus admin destrukturieren.

- [ ] **Step 4: Live verifizieren** — nach U3 (UserProfile wird erst dort eingebunden).

- [ ] **Step 5: Commit** (zusammen mit U3, da UserProfile erst dort gerendert wird).

---

### Task U3: `UsersTab` — Liste oder Profil, Zeilen-Klick, Expand entfernen

**Files:**
- Modify: `src/components/admin/tabs/UsersTab.jsx`

- [ ] **Step 1: Import + Weiche**

`import { UserProfile } from "@/components/admin/tabs/UserProfile";` ergänzen. Destrukturierung um `openProfile, openUserProfile` erweitern. Direkt nach `export function UsersTab({ admin }) { const {…} = admin;` einfügen:

```javascript
  if (openProfile) return <UserProfile admin={admin} />;
```

- [ ] **Step 2: Zeilen-Klick umstellen**

Im `visibleUsers.map`: `onClick={() => toggleUser(u.id)}` → `onClick={() => openUserProfile(u.id)}`. Den Chevron (`isOpen ? <ChevronUp…>`) entfernen oder durch nichts ersetzen. Der „Sperren/Entsperren"-Button in der Zeile mit `e.stopPropagation()` bleibt.

- [ ] **Step 3: Inline-Detail entfernen**

Den gesamten `{isOpen && (…)}`-Block (ID-Bar + Moderations-Bar + Sub-Tabs) aus dem `visibleUsers.map` löschen — der Inhalt lebt jetzt in `UserProfile`. `openUser/toggleUser/isOpen`-Reste in UsersTab bereinigen.

- [ ] **Step 4: Live verifizieren** (Admin)

Benutzer-Tab → Nutzer klicken → Profil öffnet (Kopf/Kennzahlen/Ampel/Notiz/Historie/Sub-Tabs). „Zurück" → Liste. Notiz speichern → flash; nach `openUserProfile` erneut → Notiz noch da. Ampel: gesperrt = rot. `preview_console_logs` (error): nur HMR-Artefakte.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/tabs/UserProfile.jsx src/components/admin/tabs/UsersTab.jsx src/components/admin/tabs/AuditTab.jsx
git commit -m "feat(admin): 360-Profil-Ansicht (Kopf/Ampel/Notiz/Historie) ersetzt Inline-Aufklappen (U2+U3)"
```

---

### Task U4: Beta-Checkliste + Abschluss

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Im Admin-Abschnitt (nach `vk_inserat_in_pruefung`) ergänzen**

```jsx
      { id: "adm_profile_open", label: "Benutzer: Zeilen-Klick öffnet die 360°-Profil-Ansicht; 'Zurück' führt zur Liste" },
      { id: "adm_profile_header", label: "Profil: Kennzahlen-Kopf (Mitglied seit/Level/Käufe-Verkäufe/Umsatz/offene Gebühren/Verstösse) + Status-Badges + Risiko-Ampel stimmen" },
      { id: "adm_profile_note", label: "Profil: Admin-Notiz speichern, bleibt nach Reload + erneutem Öffnen" },
      { id: "adm_profile_history", label: "Profil: Aktions-/Sperrhistorie zeigt Audit-Einträge zu diesem Nutzer" },
      { id: "adm_profile_actions", label: "Profil: Sperren/Entsperren + ID-Prüfung funktionieren; Sub-Tabs zeigen die Per-Nutzer-Daten" },
```

- [ ] **Step 2: End-to-End live verifizieren** — alle Punkte aus der Spec-Verifizierung (öffnen, Notiz persistiert, Ampel-Farben, Sperre/ID, Sub-Tabs, Zurück, Konsole sauber).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "chore(beta): 360-Profil-Checkliste + Abschluss-Verifizierung (U4)"
```

---

## Self-Review (gegen die Spec)

- **Abdeckung:** Hook/Loader/Notiz (U1) ✓, Kopf+Kennzahlen+Ampel+Notiz+Historie+Sub-Tabs (U2) ✓, Liste↔Profil + Expand-Entfernung (U3) ✓, Beta+Verifizierung (U4) ✓.
- **Konsistenz:** `openProfile`/`openUserProfile`/`closeProfile`/`userNote`/`saveUserNote`/`profileAudit` durchgängig identisch in Hook, UsersTab und UserProfile. AUDIT_META wird in U2/Step1 exportiert, in UserProfile importiert.
- **Edge:** read-only (kein Acting-as); Sperre/ID/Notiz erlaubt; Audit-Bezug per `display_name` (unscharf, dokumentiert); `pill` aus adminStyles, nicht aus admin.
