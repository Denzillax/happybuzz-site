# Admin Audit-Log Implementation Plan (modulare Struktur)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede Admin-Aktion protokollieren und in einem „Protokoll"-Tab als tages-gruppierte Timeline zeigen.

**Architecture:** Logik in `src/components/admin/useAdminData.jsx` (State `auditLog`, Helfer `logAdmin`, Lazy-Load, Verdrahtung in alle Handler, NAV-Eintrag, return), Ansicht in `src/components/admin/AdminShell.jsx` (`AUDIT_META`, Protokoll-Render, Suche), neue DB-Tabelle `admin_audit_log`. Spec: `docs/superpowers/specs/2026-06-16-admin-audit-log-design.md`.

**Tech Stack:** Next.js 14, Supabase, Lucide, Inline-Styles.

---

## Regeln

- **Kein** `npm run build`/`npm run dev` neben dem Dev-Server. Live verifizieren (`/admin`, `yam`). Implementer: nur Edits + Commit.
- Migration: Controller via Supabase-MCP `apply_migration`.

---

## Task 1: Migration `admin_audit_log`

**Files:** Create `supabase/migrations/20260616_admin_audit_log.sql`.

- [ ] **Step 1:** Datei mit exakt diesem Inhalt:
```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text,
  target_label text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit_insert ON public.admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE POLICY admin_audit_select ON public.admin_audit_log
  FOR SELECT USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit_log (created_at DESC);
```
- [ ] **Step 2: Commit:** `git add supabase/migrations/20260616_admin_audit_log.sql && git commit -m "feat(admin): admin_audit_log Tabelle (Migration)"`
- [ ] **Step 3: Controller** wendet via `apply_migration` an + prüft Tabelle/Policies per `execute_sql`.

---

## Task 2: `useAdminData.jsx` — State, logAdmin, Effekt, Verdrahtung, NAV, return

**Files:** Modify `src/components/admin/useAdminData.jsx`.

- [ ] **Step 1: Import** — in der lucide-Importzeile `ScrollText` ergänzen.

- [ ] **Step 2: State** — nach `const [emailLog, setEmailLog] = useState([]);` ergänzen:
```js
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
```

- [ ] **Step 3: `logAdmin`-Helfer** — direkt VOR `const toggleBan` einfügen:
```js
  const logAdmin = async (action, targetType, targetLabel, detail = null) => {
    const row = { admin_id: user?.id || null, action, target_type: targetType, target_label: targetLabel, detail };
    const { data } = await supabase.from("admin_audit_log").insert(row).select().maybeSingle();
    setAuditLog(prev => [data || { ...row, id: `tmp-${Date.now()}`, created_at: new Date().toISOString() }, ...prev]);
  };
```

- [ ] **Step 4: Lazy-Load** — direkt NACH dem Analytics-`useEffect` (das mit `if (tab !== "analytics") return;`) einfügen:
```js
  useEffect(() => {
    if (tab !== "audit") return;
    let active = true;
    (async () => {
      setAuditLoading(true);
      const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (active) { setAuditLog(data || []); setAuditLoading(false); }
    })();
    return () => { active = false; };
  }, [tab]);
```

- [ ] **Step 5: Verdrahtung** — in jedem Handler EINE `logAdmin`-Zeile ergänzen (nichts anderes ändern):
  - `toggleBan`: nach dem `setUsers(...)`-Update ergänzen `logAdmin(next ? "ban" : "unban", "user", u.display_name || u.username);` (`next` ist der neue is_banned-Wert, der dort bereits berechnet wird).
  - `sendReminder(inv, level, subject, body)`: am Ende `logAdmin("reminder", "invoice", inv.invoice_ref, { level, seller: inv.sellerName });`
  - `confirmAndReactivate(invId, sellerId)`: am Ende `const _i = feeInvoices.find(x => x.id === invId); logAdmin("fee_paid", "invoice", _i?.invoice_ref || invId);`
  - `cancelOrder(orderId, listingId)`: am Ende `logAdmin("order_cancel", "order", makeBeeRef(orderId));`
  - `toggleListingStatus(listingId, newStatus)`: am Ende `const _l = listings.find(x => x.id === listingId); logAdmin(newStatus === "paused" ? "listing_pause" : "listing_activate", "listing", _l?.title || listingId);`
  - `deleteReview(reviewId)`: am Ende `const _rv = reviews.find(x => x.id === reviewId); logAdmin("review_delete", "review", _rv ? `${_rv.reviewerName} → ${_rv.revieweeName}` : reviewId);`
  - `resolveReport(reportId)`: am Ende `const _r = reports.find(x => x.id === reportId); logAdmin("report_resolve", "report", _r?.listingTitle || _r?.reason || reportId);`
  - `pauseReportedListing(reportId, listingId)`: am Ende `const _r = reports.find(x => x.id === reportId); logAdmin("report_pause_listing", "listing", _r?.listingTitle || listingId);`
  - `sendBroadcast()`: NACH erfolgreichem Insert (nach `flash(\`Ankündigung an ${rows.length} Nutzer gesendet\`);`) ergänzen `logAdmin("broadcast", "broadcast", bcTitle.trim(), { count: rows.length, segment: bcSegment });` (vor dem State-Reset, solange `bcTitle`/`bcSegment` noch gesetzt sind — oder Werte vorher in Variablen sichern).
  - ID-Verify/Reject: diese Inline-Handler liegen NICHT hier, sondern als Inline-`onClick` im JSX in `AdminShell.jsx` (siehe Task 3 Step 5).

- [ ] **Step 6: NAV** — im `NAV`-Array (vor `reports`) ergänzen: `{ key: "audit", label: "Protokoll", Icon: ScrollText },`

- [ ] **Step 7: return** — im `return { … }`-Objekt die neuen Felder ergänzen: `auditLog, auditLoading, logAdmin,`.

- [ ] **Step 8: Commit:** `git add src/components/admin/useAdminData.jsx && git commit -m "feat(admin): logAdmin + Audit-State/Effekt + Verdrahtung in Handler"`

---

## Task 3: `AdminShell.jsx` — AUDIT_META, Suche, Protokoll-Render

**Files:** Modify `src/components/admin/AdminShell.jsx`.

- [ ] **Step 1: AUDIT_META + dayLabel** (Modul-Level, oberhalb `export function AdminShell`):
```js
const AUDIT_META = {
  ban:                  { label: "Konto gesperrt",        Icon: Ban,         color: "#EB5E55", bg: "#FFEBEB" },
  unban:                { label: "Konto entsperrt",       Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_resolve:       { label: "Meldung erledigt",      Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_pause_listing: { label: "Inserat pausiert (Meldung)", Icon: Pause,  color: "#E65100", bg: "#FFF3E0" },
  listing_pause:        { label: "Inserat pausiert",      Icon: Pause,       color: "#E65100", bg: "#FFF3E0" },
  listing_activate:     { label: "Inserat aktiviert",     Icon: Play,        color: "#2E7D32", bg: "#E8F5E9" },
  reminder:             { label: "Mahnung gesendet",      Icon: BellRing,    color: "#E65100", bg: "#FFF3E0" },
  fee_paid:             { label: "Bezahlt + reaktiviert", Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  order_cancel:         { label: "Bestellung storniert",  Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  id_verify:            { label: "ID verifiziert",        Icon: ShieldCheck, color: "#0A7170", bg: "#E6F5F5" },
  id_reject:            { label: "ID abgelehnt",          Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  review_delete:        { label: "Bewertung gelöscht",    Icon: Star,        color: "#c62828", bg: "#FFEBEE" },
  broadcast:            { label: "Ankündigung gesendet",  Icon: Megaphone,   color: "#0E9493", bg: "#E6F5F5" },
};
const dayLabel = (ds) => {
  const d = new Date(ds), now = new Date(), DAY = 86400000;
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === t0) return "Heute";
  if (t === t0 - DAY) return "Gestern";
  return d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long" });
};
```
(Alle Icons sind in AdminShell bereits importiert: Ban, CheckCircle, Pause, Play, BellRing, XCircle, ShieldCheck, Star, Megaphone, Clock.)

- [ ] **Step 2: Destrukturierung** — in `const { … } = admin;` die neuen Felder ergänzen: `auditLog, auditLoading`. (`users`, `search`, `colors`/`radius` etc. sind schon da.)

- [ ] **Step 3: Suche** — die Bedingung `{(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices" || tab === "emails") && (` um `|| tab === "audit"` erweitern; im `placeholder` einen Zweig `tab === "audit" ? "Aktion oder Ziel suchen..." :` vor dem letzten Fallback ergänzen.

- [ ] **Step 4: Render** — direkt NACH dem `{tab === "reports" && ( … )}`-Block einfügen:
```jsx
          {/* ═══ PROTOKOLL ═══ */}
          {tab === "audit" && (
            <div>
              {(() => {
                const filtered = auditLog.filter(a => !search || (a.target_label || "").toLowerCase().includes(search.toLowerCase()) || ((AUDIT_META[a.action]?.label) || a.action).toLowerCase().includes(search.toLowerCase()));
                if (auditLoading && filtered.length === 0) return <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Protokoll…</div>;
                if (filtered.length === 0) return <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Noch keine protokollierten Aktionen.</div>;
                return filtered.map((a, i) => {
                  const meta = AUDIT_META[a.action] || { label: a.action, Icon: Clock, color: colors.muted, bg: colors.cream };
                  const Icon = meta.Icon;
                  const day = dayLabel(a.created_at);
                  const showHeader = i === 0 || day !== dayLabel(filtered[i - 1].created_at);
                  const adminName = users.find(u => u.id === a.admin_id)?.display_name || "Admin";
                  const time = a.created_at ? new Date(a.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={a.id}>
                      {showHeader && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", color: "#9E9E9E", textTransform: "uppercase", padding: "14px 0 4px" }}>{day}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} color={meta.color} /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{meta.label}{a.action === "reminder" && a.detail?.level ? <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "1px 7px", borderRadius: 999, marginLeft: 6 }}>Stufe {a.detail.level}</span> : null}</div>
                          <div style={{ fontSize: 11.5, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.target_label || "—"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 11, color: colors.muted }}>{time}</div><div style={{ fontSize: 10, color: "#bbb" }}>{adminName}</div></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
```

- [ ] **Step 5: ID-Verify/Reject loggen** — im Benutzer-Detail (ID-Bar) gibt es zwei Inline-`onClick`-Handler: „Bestätigen" (setzt `id_verified: true`, `flash("ID verifiziert")`) und „Ablehnen" (löscht Doc, `flash("ID abgelehnt …")`). In beiden nach dem `flash(...)` je eine Zeile ergänzen: `admin.logAdmin("id_verify", "user", u.display_name);` bzw. `admin.logAdmin("id_reject", "user", u.display_name);` (`logAdmin` ist im `admin`-Objekt; in AdminShell destrukturieren ODER `admin.logAdmin` nutzen — falls nicht destrukturiert, `admin.logAdmin` verwenden).

- [ ] **Step 6: Verify (Controller, live):** s. Task 5.

- [ ] **Step 7: Commit:** `git add src/components/admin/AdminShell.jsx && git commit -m "feat(admin): Protokoll-Tab (Audit-Log) Ansicht + AUDIT_META"`

---

## Task 4: Beta-Checkliste

**Files:** Modify `src/app/(public)/beta/page.jsx`.

- [ ] **Step 1:** In Sektion `id: "admin"` nach dem letzten Eintrag (`adm_broadcast_single`) ergänzen:
```js
      { id: "adm_audit_tab", label: "Protokoll-Tab zeigt Admin-Aktionen als tages-gruppierte Timeline (Icon, Ziel, Zeit, Admin)" },
      { id: "adm_audit_logging", label: "Jede Admin-Aktion (Sperren/Meldung/Mahnung/Storno/Ankündigung/…) erzeugt einen Protokoll-Eintrag" },
      { id: "adm_audit_search", label: "Protokoll-Suche filtert nach Aktion/Ziel" },
```
- [ ] **Step 2: Commit:** `git add "src/app/(public)/beta/page.jsx" && git commit -m "docs(beta): Checkliste um Protokoll/Audit-Log erweitert"`

---

## Task 5: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1:** Migration bestätigt (Tabelle + Policies da).
- [ ] **Step 2:** Live als Admin: Benutzer → Testkonto **Zeggy sperren, dann entsperren** (reversibel). Protokoll-Tab öffnen → zwei Einträge oben („Konto entsperrt", „Konto gesperrt") mit Icon, Ziel (Zeggy), Zeit, Admin; Tages-Header „Heute". Per `execute_sql` gegenprüfen (2 Zeilen für action ban/unban). Sicherstellen, dass Zeggy am Ende **entsperrt** (Baseline) ist.
- [ ] **Step 3:** Suche im Protokoll nach „gesperrt" filtert; leeres/kein-Treffer-Verhalten ok. Keine Konsolenfehler; übrige Tabs unverändert.
- [ ] **Step 4:** Finaler Code-Review-Subagent über `git diff <letzter-Refactor-Commit>..HEAD` (Spec-Konformität, korrekte Spalten, alle Handler verdrahtet, kein Verhalten der Handler verändert ausser Logging, Em-Dash/Emoji-Regel).

---

## Self-Review (Autor)

- **Spec-Abdeckung:** Migration → T1. logAdmin + State + Effekt + Verdrahtung aller Handler + NAV → T2 (in useAdminData.jsx). AUDIT_META + Protokoll-Render + Suche + ID-Verify-Logging → T3 (in AdminShell.jsx). Beta → T4. Verifizierung (Zeggy) + Review → T5.
- **Platzhalter:** keine — vollständiger Code; Verify mit konkreten Schritten.
- **Konsistenz:** `logAdmin` in useAdminData definiert + in `return` → in AdminShell als `admin.logAdmin` für ID-Verify nutzbar. AUDIT_META-`action`-Keys == die in den Handlern geloggten Aktionen (ban/unban/report_resolve/report_pause_listing/listing_pause/listing_activate/reminder/fee_paid/order_cancel/id_verify/id_reject/review_delete/broadcast). `auditLog`/`auditLoading` im return + in AdminShell destrukturiert. `ScrollText` in useAdminData importiert (NAV-Icon). AUDIT_META-Icons in AdminShell bereits importiert.
