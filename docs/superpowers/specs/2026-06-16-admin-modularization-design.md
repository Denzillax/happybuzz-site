# Admin-Modularisierung (Refactor)

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Review

## Ziel

Die monolithische Admin-Seite `src/app/(public)/admin/page.jsx` (~1.387 Zeilen, 9 Tab-Blöcke + 2 Modals
+ alle Handler/State) in fokussierte Module aufteilen — **ohne jede Verhaltensänderung**. Danach lassen
sich künftige Features (z.B. das schon spezifizierte Audit-Log) als eigene Module sauber andocken.

## Festgelegte Entscheidungen (Brainstorming)

1. **Erst modularisieren**, dann Audit-Log in die neue Struktur.
2. **Mechanismus:** ein `useAdminData()`-Hook hält allen State + Effects + Handler und gibt ein
   `admin`-Objekt zurück; Shell/Tabs/Modals erhalten **ein einziges `admin`-Prop** (kein Prop-Drilling, kein Context).
3. **Verhaltenserhaltend:** reiner Umbau, keine neuen Features, keine UI-Änderung. Audit-Log = separate Folge-Welle.

## Ziel-Dateistruktur

- `src/components/admin/useAdminData.js` — **der gesamte bisherige Komponenten-Body** (alle `useState`, der Lade-`useEffect`,
  der Analytics-`useEffect`, alle Handler, abgeleitete Listen, Render-Helfer) — MINUS dem JSX-`return`. Endet mit
  `return { …alle Bezeichner… }`. Macht den Auth-Gate + Datenladen wie bisher.
- `src/components/admin/adminStyles.js` — reine, state-freie Bausteine: `th`, `td`, `pill`, `modPill`,
  `chartCard/chartHead/chartLabel/chartBig/chartSub`, `bcFieldLabel`, `bcInput` (importieren `colors`/`fonts`).
- `src/components/admin/AdminShell.jsx` — Sidebar (Nav inkl. Badges) + Top-Leiste (Titel + Suche + CSV/Ankündigung-Button)
  + Tab-Umschaltung; rendert `<XxxTab admin={admin} />` je nach `admin.tab`. Rendert auch die Modals.
- `src/components/admin/tabs/OverviewTab.jsx`, `AnalyticsTab.jsx`, `UsersTab.jsx`, `OrdersTab.jsx`, `InvoicesTab.jsx`,
  `ListingsTab.jsx`, `EmailsTab.jsx`, `DunningTab.jsx`, `ReportsTab.jsx` — je ein Tab; Signatur `function XxxTab({ admin })`,
  destrukturiert benötigte Werte aus `admin`.
- `src/components/admin/modals/MahnPreviewModal.jsx`, `BroadcastComposer.jsx` — Signatur `({ admin })`.
- `src/app/(public)/admin/page.jsx` — **schlank**:
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

## `admin`-Vertrag (was der Hook zurückgibt)

Der Hook gibt ALLE bisherigen lokalen Bezeichner gebündelt zurück (nichts wird gestrichen). Gruppen:
- **Kern:** `user, loading, tab, setTab, search, setSearch, flash, toast`.
- **Daten:** `stats, users, listings, reports, orders, feeInvoices, reviews, emailLog`.
- **Abgeleitet:** `filteredUsers, visibleUsers, filteredListings, filteredOrders, filteredEmails, invoiceRows,
  beeInvoiceRows, feeInvoiceRows, overdueInvoices, overdueSum, openReports, flaggedUsers, bannedUsers, openFeeInvoices, analytics`.
- **Benutzer-Detail:** `openUser, toggleUser, userTab, setUserTab, userListings, userFees, userInvoices, userMod, setUserMod`.
- **Bestellungen:** `openOrder, toggleOrder, orderDetail, orderStatusFilter, setOrderStatusFilter, orderDeposit, setOrderDeposit, orderStatusPill, beeRefIncludes, orderStatusGroup`.
- **Rechnungen:** `invoiceType, setInvoiceType, openInvoiceKey, toggleInvoiceRow, feeLedger, feeSeller`.
- **Mahnwesen:** `mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton`.
- **Broadcast:** `broadcastOpen, setBroadcastOpen, bcSegment, setBcSegment, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcSending, bcUserIds, setBcUserIds, bcUserQuery, setBcUserQuery, bcTargets, sendBroadcast`.
- **Analytik:** `analyticsRange, setAnalyticsRange, analyticsLoading, sumSeries, axisLabels` (+ `analytics` oben).
- **Weitere Handler:** `toggleBan, toggleListingStatus, cancelOrder, deleteReview, resolveReport, pauseReportedListing, emailCard, statusPill`.
- **Nav-Daten:** `NAV` (oder in der Shell aus den Zählern gebaut), `pageTitle`.

Render-Helfer, die JSX zurückgeben (`dunningTimeline(inv)`, `mahnButton(inv)`, `emailCard(e)`, `orderStatusPill(s)`, `statusPill(s)`, `pill(...)`, `axisLabels(s)`), bleiben Funktionen im Hook bzw. in `adminStyles` und werden als `admin.xyz(...)` aufgerufen. `pill`/`modPill`/`th`/`td`/`chart*` sind state-frei → `adminStyles.js`.

## Migrations-Vorgehen (inkrementell, subagent-getrieben, verhaltenserhaltend)

1. **adminStyles.js** anlegen (Consts verschieben, in page.jsx vorerst importieren) — Smoke-Test, commit.
2. **useAdminData.js** anlegen: gesamten Body aus `AdminPage` hineinverschieben, `return { … }` ergänzen. `page.jsx` ruft den Hook und rendert das bisherige JSX weiter (noch inline, mit `admin.`-Zugriffen) ODER zunächst destrukturiert `const { … } = admin;` am Anfang, sodass das bestehende JSX unverändert bleibt. Smoke-Test (alle Tabs laden), commit.
3. **AdminShell.jsx** anlegen: Sidebar + Top-Bar + die `{tab === … && (…)}`-Umschaltung; page.jsx → schlanke Hülle. Tabs zunächst inline in der Shell. Live-Check alle Tabs, commit.
4. **Tabs einzeln auslagern**: pro Task einen Tab-Block in `tabs/XxxTab.jsx` ziehen (`function XxxTab({ admin }) { const { … } = admin; return (…); }`), in der Shell durch `<XxxTab admin={admin} />` ersetzen. **Jeder Tab live verifiziert**, eigener Commit.
5. **Modals auslagern** (`MahnPreviewModal`, `BroadcastComposer`) analog.
6. Abschluss: page.jsx schlank, alle Tabs/Modals als Module; finaler Durchlauf.

Invariante bei JEDEM Schritt: Webpack „Compiled successfully", Tab rendert wie zuvor, keine Konsolenfehler.

## Dateien

- **Create:** `useAdminData.js`, `adminStyles.js`, `AdminShell.jsx`, `tabs/*.jsx` (9), `modals/*.jsx` (2).
- **Modify:** `src/app/(public)/admin/page.jsx` (auf Hülle reduziert).
- Keine DB-Migration. Keine Beta-Checklisten-Änderung (kein neues Feature) — bestehende Admin-Items gelten unverändert.

## Out of Scope (bewusst)

- Jegliche Feature-/UI-Änderung (reiner Umbau).
- Audit-Log (separate Folge-Welle, danach als eigenes Tab-Modul + Hook-Erweiterung).
- Umstieg auf React Context (bewusst verworfen zugunsten `admin`-Prop).
- Aufteilen der bereits modularen Files (swissQR/dunning/adminAnalytics/csv/TrendChart) — bleiben.

## Verifizierung

- Nach jedem Schritt live als Admin (`/admin`): der betroffene Tab/Modal verhält sich exakt wie vorher
  (Liste lädt, Filter, Aufklappen, Modals, Senden). KEIN `npm run build` neben dem Dev-Server.
- Abschluss-Smoke-Test: alle 9 Tabs durchklicken (kein Fehler), Mahn-Vorschau + Broadcast-Composer öffnen,
  ein bereits getesteter Flow (z.B. Rechnungen-FEE-Detail Timeline) unverändert.
- `git diff` zeigt reine Verschiebung (kein verändertes Verhalten); Zeggy-Baseline unverändert.
