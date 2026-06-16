# Admin-Modularisierung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/app/(public)/admin/page.jsx` (~1.387 Zeilen) verhaltenserhaltend in Hook + Shell + Tab-/Modal-Module aufteilen.

**Architecture:** `useAdminData()` hält allen State/Effects/Handler und gibt ein `admin`-Objekt zurück; `AdminShell` + Tab-Komponenten + Modals bekommen `admin` als einziges Prop. Reiner Umzug von Code, keine Verhaltens-/UI-Änderung.

**Tech Stack:** Next.js 14 Client Components, Inline-Styles, `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-16-admin-modularization-design.md`.

---

## EISERNE REGELN (für jeden Task)

- **Verhaltenserhaltend:** Kein Feature, kein Text, kein Style ändert sich. Nur Code wird verschoben.
- **Kein** `npm run build`/`npm run dev` neben dem laufenden Dev-Server. Verifiziert wird per **Live-Preview** (`/admin`, eingeloggt als `yam`).
- **Nach JEDEM Task** (Controller): den betroffenen Tab/Modal live durchklicken — lädt, Filter/Aufklappen/Buttons wie vorher, **keine** Konsolenfehler (`nextjs-portal`/`Cannot find module`). Erst dann der nächste Task.
- Implementer-Subagenten: nur Datei-Edits + Commit; keine Build-/Server-Befehle. Beim Verschieben großer Blöcke: **wörtlich** übernehmen (nicht „verbessern"/umformatieren).

## Zielstruktur

```
src/components/admin/
  adminStyles.js            # statische Consts + reine Helfer
  useAdminData.js           # State + Effects + Handler -> gibt `admin` zurück
  AdminShell.jsx            # Sidebar + Top-Bar + Tab-Umschaltung + Modals
  tabs/OverviewTab.jsx AnalyticsTab.jsx UsersTab.jsx OrdersTab.jsx
       InvoicesTab.jsx ListingsTab.jsx EmailsTab.jsx DunningTab.jsx ReportsTab.jsx
  modals/MahnPreviewModal.jsx BroadcastComposer.jsx
src/app/(public)/admin/page.jsx   # schlanke Hülle
```

---

## Task 1: `adminStyles.js` — statische Bausteine auslagern

**Files:** Create `src/components/admin/adminStyles.js`; Modify `src/app/(public)/admin/page.jsx`.

- [ ] **Step 1:** In `page.jsx` die MODUL-LEVEL-Consts (oberhalb von `export default function AdminPage`) identifizieren, die KEINEN State brauchen: `th`, `td`, `pill`, `chartCard`, `chartHead`, `chartLabel`, `chartBig`, `chartSub`, `bcFieldLabel`, `bcInput` sowie die reinen Helfer `sumSeries`, `axisLabels`. Diese nach `src/components/admin/adminStyles.js` verschieben. Datei-Kopf:
```js
import { colors, fonts } from "@/lib/theme";
import { fmtDate } from "@/lib/formatters";
```
Dann die verschobenen Consts/Funktionen als `export const …` / `export function …`. (`axisLabels` nutzt `fmtDate`+`colors`; `sumSeries` ist rein.)

- [ ] **Step 2:** In `page.jsx` die verschobenen Definitionen entfernen und stattdessen importieren:
```js
import { th, td, pill, chartCard, chartHead, chartLabel, chartBig, chartSub, bcFieldLabel, bcInput, sumSeries, axisLabels } from "@/components/admin/adminStyles";
```
(`modPill`, `statusPill`, `orderStatusPill`, `dunningTimeline`, `mahnButton`, `emailCard`, `sc`, `STAGE_LABELS` bleiben vorerst, da teils state-abhängig.)

- [ ] **Step 3: Verify (Controller):** `/admin` neu laden, jeden Tab kurz öffnen — unverändert, keine Fehler.

- [ ] **Step 4: Commit:** `git add -A && git commit -m "refactor(admin): statische Style-Consts nach adminStyles.js"`

---

## Task 2: `useAdminData.js` — Komponenten-Body in einen Hook

**Files:** Create `src/components/admin/useAdminData.js`; Modify `src/app/(public)/admin/page.jsx`.

- [ ] **Step 1:** Neue Datei `useAdminData.js`. Kopfzeile `"use client";` + ALLE Imports, die der Body braucht (aus page.jsx übernehmen: react `useState/useEffect`, `supabase`, `@/lib/formatters` (fmtCHF, fmtDate), `@/lib/fees` (makeBeeRef), `@/lib/swissQR`, `@/lib/dunning`, `@/lib/adminAnalytics`, `@/lib/csv`, `@/lib/theme` (colors, fonts, radius), `@/components/admin/adminStyles`, lucide-Icons NUR falls in Render-Helfern genutzt — `CheckCircle` (dunningTimeline), ggf. weitere).

- [ ] **Step 2:** Den **gesamten Inhalt** von `export default function AdminPage() {` bis unmittelbar VOR dem `return (` (also: alle `useState`, beide `useEffect`, alle Handler/Funktionen, abgeleiteten Listen, Render-Helfer `dunningTimeline`/`mahnButton`/`emailCard`/`statusPill`/`orderStatusPill`/`modPill`, `NAV`, `pageTitle`, `STAT_CARDS`, `ATTENTION`, `sc`, `STAGE_LABELS`, `ADMIN_ID`-Nutzung) in `export function useAdminData() {` verschieben — **wörtlich**. Die `if (loading) return …` / `if (!user) return null` NICHT mitnehmen (bleiben in page.jsx).

- [ ] **Step 3:** Am Ende von `useAdminData` ein `return { … }` mit ALLEN im Hook definierten Bezeichnern. Mindestens (Implementer ergänzt fehlende, falls ein Consumer sie braucht):
```js
  return {
    user, loading, toast, flash, tab, setTab, search, setSearch,
    stats, users, setUsers, listings, reports, setReports, orders, feeInvoices, reviews, setReviews, emailLog, setEmailLog,
    filteredUsers, visibleUsers, filteredListings, filteredOrders, filteredEmails, invoiceRows, beeInvoiceRows, feeInvoiceRows,
    overdueInvoices, overdueSum, openReports, flaggedUsers, bannedUsers, openFeeInvoices,
    openUser, toggleUser, userTab, setUserTab, userListings, userFees, userInvoices, userMod, setUserMod,
    openOrder, toggleOrder, orderDetail, orderStatusFilter, setOrderStatusFilter, orderDeposit, setOrderDeposit, orderStatusGroup, orderStatusPill, beeRefIncludes,
    invoiceType, setInvoiceType, openInvoiceKey, toggleInvoiceRow, openInvoice, setOpenInvoice, feeLedger, feeSeller,
    mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton,
    broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, bcTargets, sendBroadcast,
    analyticsRange, setAnalyticsRange, analytics, analyticsLoading,
    toggleBan, toggleListingStatus, cancelOrder, deleteReview, resolveReport, pauseReportedListing, statusPill, modPill, emailCard,
    NAV, pageTitle, STAT_CARDS, ATTENTION, sc,
  };
```

- [ ] **Step 4:** `page.jsx` umbauen, sodass das BESTEHENDE JSX unverändert weiterläuft:
```jsx
"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { colors, fonts, radius } from "@/lib/theme";
import Link from "next/link";
import BeeIcon from "@/components/shared/BeeIcon";
import { TypeBadge } from "@/components/shared/Badge";
import { /* alle im JSX genutzten lucide-Icons */ } from "lucide-react";
import { TrendChart } from "@/components/admin/TrendChart";
import { th, td, pill, chartCard, chartHead, chartLabel, chartBig, chartSub, bcFieldLabel, bcInput, sumSeries, axisLabels } from "@/components/admin/adminStyles";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";
import { orderQrPayload, feeQrPayload, qrImageUrl } from "@/lib/swissQR";
export default function AdminPage() {
  const admin = useAdminData();
  const {
    /* GENAU dieselbe Bezeichner-Liste wie im Hook-return */
  } = admin;
  if (loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade Admin...</div>;
  if (!user) return null;
  return ( /* das bisherige, unveränderte JSX */ );
}
```
Hinweis: Die Destrukturierungs-Liste MUSS der `return`-Liste aus Step 3 entsprechen (so bleibt das JSX 1:1 lauffähig). Importe in page.jsx auf das reduzieren, was das JSX wirklich referenziert (lucide-Icons, Link, BeeIcon, TypeBadge, TrendChart, fmt*, makeBeeRef, swissQR, styles).

- [ ] **Step 5: Verify (Controller):** `/admin` neu laden. **Jeden** der 9 Tabs öffnen + Mahn-Vorschau + Broadcast-Composer öffnen. Alles wie vorher, keine Fehler. (Wenn ein Bezeichner fehlt → „X is not defined" in Konsole → im Hook-`return` UND in der page.jsx-Destrukturierung ergänzen.)

- [ ] **Step 6: Commit:** `git add -A && git commit -m "refactor(admin): Komponenten-Body in useAdminData()-Hook"`

---

## Task 3: `AdminShell.jsx` — Sidebar/Top-Bar/Umschaltung; page.jsx wird Hülle

**Files:** Create `src/components/admin/AdminShell.jsx`; Modify `src/app/(public)/admin/page.jsx`.

- [ ] **Step 1:** `AdminShell.jsx` (`"use client"`) mit `export function AdminShell({ admin }) { const { … } = admin; return ( … ); }`. Das gesamte JSX aus page.jsx (der `return (...)`-Inhalt: `<div className="admin-shell">…</div>` inkl. Sidebar, Top-Bar, alle `{tab === … && (…)}`-Blöcke, beide Modals, Toast) **wörtlich** hierher verschieben. Destrukturierungs-Liste = wie in page.jsx. Importe (lucide, Link, BeeIcon, TypeBadge, TrendChart, styles, fmt*, makeBeeRef, swissQR) aus page.jsx hierher übernehmen.

- [ ] **Step 2:** `page.jsx` auf die schlanke Hülle reduzieren:
```jsx
"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { colors, fonts } from "@/lib/theme";
export default function AdminPage() {
  const admin = useAdminData();
  if (admin.loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade Admin...</div>;
  if (!admin.user) return null;
  return <AdminShell admin={admin} />;
}
```

- [ ] **Step 3: Verify (Controller):** wie Task 2 Step 5 — alle Tabs + beide Modals, unverändert, keine Fehler.

- [ ] **Step 4: Commit:** `git add -A && git commit -m "refactor(admin): AdminShell + schlanke page.jsx-Huelle"`

---

## Tasks 4–12: Tabs einzeln auslagern (je Task ein Tab)

Gleiches Muster für jeden Tab. **Pro Task genau EIN Tab**, danach Live-Check + Commit.

Muster (Beispiel Users):
- [ ] **Step 1:** `src/components/admin/tabs/UsersTab.jsx` anlegen:
```jsx
"use client";
import { /* nur die im Block genutzten lucide-Icons */ } from "lucide-react";
import Link from "next/link";
import { TypeBadge } from "@/components/shared/Badge";
import { pill, td, th } from "@/components/admin/adminStyles";
import { colors, fonts, radius } from "@/lib/theme";
import { fmtCHF, fmtDate } from "@/lib/formatters";
export function UsersTab({ admin }) {
  const { /* genau die im Block referenzierten Werte/Funktionen aus admin */ } = admin;
  return ( /* der INNERE Inhalt des bisherigen {tab === "users" && ( … )}-Blocks, woertlich */ );
}
```
- [ ] **Step 2:** In `AdminShell.jsx` den Block `{tab === "users" && ( … )}` ersetzen durch `{tab === "users" && <UsersTab admin={admin} />}` und `import { UsersTab } from "@/components/admin/tabs/UsersTab";` ergänzen.
- [ ] **Step 3: Verify (Controller):** den Tab live öffnen + die wichtigsten Interaktionen prüfen (Liste, Filter, Aufklappen, Buttons) — unverändert, keine Fehler.
- [ ] **Step 4: Commit:** `git add -A && git commit -m "refactor(admin): <Tab> in eigenes Modul"`

Reihenfolge (von einfach → komplex, damit das Muster früh sitzt):
- **Task 4 — ReportsTab** (`tab === "reports"`; nutzt u.a. `openReports`-Render, `resolveReport`, `pauseReportedListing`, `pill`, `fmtDate`, `Flag`, `CheckCircle`, Link).
- **Task 5 — ListingsTab** (`listings`; `filteredListings`, `toggleListingStatus`, `statusPill`, `TypeBadge`, `Eye/Play/Pause`, Link, fmtCHF).
- **Task 6 — EmailsTab** (`emails`; `filteredEmails`, `emailCard`).
- **Task 7 — AnalyticsTab** (`analytics`; `analyticsRange/setAnalyticsRange`, `analytics`, `analyticsLoading`, `sumSeries`, `axisLabels`, `TrendChart`, `fmtCHF`, chart-Consts, `modPill`-Stil bzw. inline).
- **Task 8 — DunningTab** (`dunning`; `overdueInvoices`, `overdueSum`, `daysOverdue`, `mahnButton`, `dunningTimeline`, `confirmAndReactivate`, `fmtCHF`, `colors/radius`).
- **Task 9 — OverviewTab** (`overview`; `STAT_CARDS`, `ATTENTION`, Broadcast-Button (`setBroadcastOpen`), Mini-Analytik (`gmv`-Block nutzt `analytics`? nein — Overview nutzt orders-abgeleitete `nonCancelledOrders/gmv/...`; diese Bezeichner mit auslagern bzw. aus admin beziehen), `BeeIcon`, Icons).
- **Task 10 — OrdersTab** (`orders`; `filteredOrders`, `orderStatusFilter`, `toggleOrder`, `orderDetail`, `orderDeposit`, `orderStatusPill`, `makeBeeRef`, `orderQrPayload`, `qrImageUrl`, `cancelOrder`, `modPill`).
- **Task 11 — InvoicesTab** (`invoices`; `invoiceRows`, `invoiceType/setInvoiceType`, `toggleInvoiceRow`, `feeLedger`, `feeSeller`, `dunningTimeline`, `mahnButton`, `confirmAndReactivate`, `feeQrPayload`/`orderQrPayload`/`qrImageUrl`, `makeBeeRef`, `pill`, `sc`).
- **Task 12 — UsersTab** (`users`; der größte Block: `visibleUsers`, `userMod/setUserMod`, `toggleUser`, `userTab/setUserTab`, `userListings`, `userFees`, `userInvoices`, `toggleBan`, ID-Verify-Buttons, Sub-Tabs inkl. `dunningTimeline`/`mahnButton`/`emailCard`/`cancelOrder`/`deleteReview`, `pill`, `statusPill`, `TypeBadge`, fmt*, Icons).

Hinweis je Tab: die in `admin` als Funktionen vorliegenden Render-Helfer (`dunningTimeline(inv)`, `mahnButton(inv)`, `emailCard(e)`, `orderStatusPill(s)`, `statusPill(s)`) als `admin.dunningTimeline(...)` o.ä. aufrufen ODER beim Destrukturieren entnehmen und direkt nutzen. Reine Consts (`pill`, `th`, `td`, `chart*`) aus `adminStyles` importieren.

---

## Task 13: Modals auslagern

**Files:** Create `src/components/admin/modals/MahnPreviewModal.jsx`, `BroadcastComposer.jsx`; Modify `AdminShell.jsx`.

- [ ] **Step 1:** `MahnPreviewModal.jsx`: `export function MahnPreviewModal({ admin }) { const { mahnModal, setMahnModal, confirmMahn } = admin; if (!mahnModal) return null; return ( /* der bisherige {mahnModal && ( … )}-Block, woertlich, ohne die `{mahnModal && (`-Bedingung */ ); }`.
- [ ] **Step 2:** `BroadcastComposer.jsx`: `export function BroadcastComposer({ admin }) { const { broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTargets, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, sendBroadcast, users } = admin; if (!broadcastOpen) return null; return ( /* der bisherige {broadcastOpen && ( … )}-Block, woertlich */ ); }` (Icons `Megaphone`, `CheckCircle`, styles `bcFieldLabel`/`bcInput`, `colors`/`fonts` importieren).
- [ ] **Step 3:** In `AdminShell.jsx` die beiden Inline-Modal-Blöcke ersetzen durch `<MahnPreviewModal admin={admin} />` und `<BroadcastComposer admin={admin} />` (+ Imports).
- [ ] **Step 4: Verify (Controller):** Mahn-Vorschau (Rechnungen-FEE-Detail → „… senden" → Modal, Abbrechen) + Broadcast (Übersicht → Ankündigung senden → Segmente/Einzelne, Abbrechen) — unverändert, keine Fehler.
- [ ] **Step 5: Commit:** `git add -A && git commit -m "refactor(admin): Mahn-Vorschau + Broadcast-Composer als Module"`

---

## Task 14: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1:** `/admin` frisch laden, **alle 9 Tabs** durchklicken (Übersicht, Analytik, Benutzer, Bestellungen, Rechnungen, Inserate, E-Mails, Mahnungen, Meldungen) — jeweils Kern-Interaktion (Filter/Suche/Aufklappen) prüfen. Beide Modals öffnen/schließen. `preview_console_logs` (error) leer; kein `nextjs-portal`.
- [ ] **Step 2:** Ein zuvor verifizierter Flow gegenprobe: Rechnungen → FEE-Filter → Detail (QR + Timeline + „Volle Rechnung öffnen") unverändert; Analytik 7/30/90 wechselt; Benutzer Sperren/Entsperren am Testkonto Zeggy und danach wieder Baseline.
- [ ] **Step 3:** `git diff <Commit-vor-Refactor>..HEAD --stat` sichten: erwartet viele neue Files + stark geschrumpfte `page.jsx`; inhaltlich reine Verschiebung.
- [ ] **Step 4:** Finaler Code-Review-Subagent: prüft, dass kein Verhalten geändert wurde (nur Move), keine toten/doppelten Bezeichner, alle Tab-/Modal-Imports vorhanden, `page.jsx` schlank.

---

## Self-Review (Autor)

- **Spec-Abdeckung:** adminStyles → T1. useAdminData-Hook + `admin`-Vertrag → T2. AdminShell + schlanke page.jsx → T3. 9 Tabs als Module → T4–T12. Modals → T13. Abschluss-Verifizierung → T14. Mechanismus (Hook + `admin`-Prop) durchgehend. Verhaltenserhaltend + Live-Check je Schritt (User-Vorgabe) in jedem Task verankert.
- **Platzhalter:** Bewusst „Move"-Rezepte statt reproduziertem 1.387-Zeilen-Code (reiner Umzug; Originalblöcke werden wörtlich verschoben, Grenzen über die `{tab === "…"}`-Anker eindeutig). Neue Struktur-Codeteile (page.jsx-Hülle, Komponentensignaturen, Hook-`return`) sind ausformuliert.
- **Konsistenz:** Hook-`return`-Liste == page.jsx/Shell-Destrukturierung; Render-Helfer als `admin.xyz()`; reine Consts aus `adminStyles`. Live-Verify fängt fehlende Bezeichner ab (Task 2/3 Step „Verify").
