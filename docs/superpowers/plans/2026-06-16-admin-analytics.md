# Admin Analytics-Cockpit (Welle 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eigener „Analytik"-Tab im Admin mit 4 selbstgebauten SVG-Diagrammen und 7/30/90-Tage-Umschalter.

**Architecture:** Reine Daten-Helfer in `src/lib/adminAnalytics.js`, eine SVG-Chart-Komponente `src/components/admin/TrendChart.jsx`, und die Verdrahtung im Admin (`src/app/(public)/admin/page.jsx`): Nav-Tab, State, lazy-Datenladen per useEffect, Render. Keine DB-Migration.

**Tech Stack:** Next.js 14 (Client Component), Supabase JS, Inline-SVG, `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-16-admin-analytics-design.md`.

---

## Umgebungs-/Verifizierungsregeln

- **Kein** `npm run build` / `npm run dev` neben dem laufenden Dev-Server. Verifizieren per Live-Preview (`/admin`, eingeloggt als `yam`).
- Implementer-Subagenten: nur Datei-Edits + Commit, keine Build-/Server-Befehle.
- Kein Unit-Test-Framework → „Verify" = Live-DOM-Checks.

## File Structure

- **Create** `src/lib/adminAnalytics.js` — `bucketDaily`, `countByType` (rein).
- **Create** `src/components/admin/TrendChart.jsx` — SVG area/line/bar.
- **Modify** `src/app/(public)/admin/page.jsx` — Imports, Chart-Style-Consts + `sumSeries`/`axisLabels`, State, Analytics-useEffect, NAV-Eintrag, Analytik-Render.
- **Modify** `src/app/(public)/beta/page.jsx` — Checkliste.

---

## Task 1: Daten-Helfer `src/lib/adminAnalytics.js`

**Files:**
- Create: `src/lib/adminAnalytics.js`

- [ ] **Step 1: Datei anlegen**

```js
// Reine Analytics-Helfer (keine UI, kein Supabase).

// Buendelt Zeilen mit created_at in Tages-Buckets ueber die letzten rangeDays Tage (inkl. heute).
// valueFn(row) -> Zahl (z.B. () => 1 fuer Zaehlung, oder ein Betrag). Fehlende Tage = 0.
export function bucketDaily(rows, rangeDays, valueFn) {
  const DAY = 86400000;
  const start = new Date(Date.now() - (rangeDays - 1) * DAY);
  const map = {};
  for (let i = 0; i < rangeDays; i++) {
    const key = new Date(start.getTime() + i * DAY).toISOString().slice(0, 10);
    map[key] = 0;
  }
  (rows || []).forEach(r => {
    if (!r.created_at) return;
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (key in map) map[key] += valueFn(r);
  });
  return Object.keys(map).sort().map(k => ({ date: k, value: map[k] }));
}

// Zaehlt Inserate je Typ in fester Reihenfolge.
export function countByType(rows) {
  const order = ["sell", "auction", "rent", "free", "service"];
  const c = { sell: 0, auction: 0, rent: 0, free: 0, service: 0 };
  (rows || []).forEach(r => { if (r.listing_type in c) c[r.listing_type] += 1; });
  return order.map(k => ({ type: k, count: c[k] }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/adminAnalytics.js
git commit -m "feat(analytics): Daten-Helfer bucketDaily + countByType"
```

(Korrektheit wird in Task 3 live über den Analytik-Tab geprüft — reines Modul ohne Abhängigkeiten.)

---

## Task 2: Chart-Komponente `src/components/admin/TrendChart.jsx`

**Files:**
- Create: `src/components/admin/TrendChart.jsx`

- [ ] **Step 1: Datei anlegen**

```jsx
// Selbstgebauter SVG-Trendchart fuer eine Tagesreihe data=[{date, value}]. type: area | line | bar.
export function TrendChart({ data = [], color = "#0E9493", type = "area", height = 70 }) {
  const W = 240, H = height, pad = 6;
  const n = data.length;
  const max = Math.max(1, ...data.map(d => d.value));
  const x = (i) => n <= 1 ? W / 2 : (i / (n - 1)) * W;
  const y = (v) => H - pad - (v / max) * (H - pad * 2);

  if (type === "bar") {
    const bw = n > 0 ? (W / n) * 0.7 : 0;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const bx = n <= 1 ? W / 2 - bw / 2 : (i / n) * W + ((W / n) - bw) / 2;
          const by = y(d.value);
          return (
            <rect key={i} x={bx} y={by} width={bw} height={Math.max(0, H - pad - by)} rx="1.5" fill={color}>
              <title>{d.date}: {Math.round(d.value)}</title>
            </rect>
          );
        })}
      </svg>
    );
  }

  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {type === "area" && <polygon points={`0,${H} ${pts} ${W},${H}`} fill={color} fillOpacity="0.16" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/TrendChart.jsx
git commit -m "feat(analytics): SVG-TrendChart (area/line/bar)"
```

---

## Task 3: Analytik-Tab im Admin verdrahten

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Imports**

In der lucide-react-Importzeile `LineChart` ergänzen. Danach (bei den anderen Top-Imports) ergänzen:
```js
import { TrendChart } from "@/components/admin/TrendChart";
import { bucketDaily, countByType } from "@/lib/adminAnalytics";
```

- [ ] **Step 2: Modul-Level Style-Consts + Helfer**

Bei den bestehenden Modul-Level-Consts (nahe `th`/`td`/`pill`, oberhalb von `export default function AdminPage`) ergänzen:
```js
const chartCard = { border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, background: "#fff" };
const chartHead = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const chartLabel = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted };
const chartBig = { fontSize: 22, fontWeight: 800, fontFamily: fonts.head, margin: "2px 0 8px" };
const chartSub = { fontSize: 11, fontWeight: 600, color: colors.muted };
const sumSeries = (s) => Math.round((s || []).reduce((a, d) => a + d.value, 0));
const axisLabels = (s) => s && s.length ? (
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: colors.muted }}>
    <span>{fmtDate(s[0].date)}</span><span>heute</span>
  </div>
) : null;
```
(`colors`, `fonts`, `fmtDate` sind oben bereits importiert.)

- [ ] **Step 3: State**

Bei den `useState`-Zeilen ergänzen:
```js
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
```

- [ ] **Step 4: Lazy-Load via useEffect**

Direkt NACH dem bestehenden `useEffect(() => { … load(); }, []);` (das auf `load()` endet) einen zweiten useEffect einfügen:
```js
  useEffect(() => {
    if (tab !== "analytics") return;
    let active = true;
    (async () => {
      setAnalyticsLoading(true);
      const start = new Date(Date.now() - analyticsRange * 86400000).toISOString();
      const [u, l, p, lt] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", start),
        supabase.from("listings").select("created_at").gte("created_at", start),
        supabase.from("purchases").select("created_at, price, shipping_cost, status").gte("created_at", start),
        supabase.from("listings").select("listing_type"),
      ]);
      if (!active) return;
      const paid = (p.data || []).filter(x => x.status !== "cancelled");
      setAnalytics({
        users: bucketDaily(u.data, analyticsRange, () => 1),
        listings: bucketDaily(l.data, analyticsRange, () => 1),
        gmv: bucketDaily(paid, analyticsRange, r => parseFloat(r.price || 0) + parseFloat(r.shipping_cost || 0)),
        sales: paid.length,
        byType: countByType(lt.data),
      });
      setAnalyticsLoading(false);
    })();
    return () => { active = false; };
  }, [tab, analyticsRange]);
```

- [ ] **Step 5: NAV-Eintrag**

Im `NAV`-Array direkt NACH dem `{ key: "overview", … }`-Eintrag ergänzen:
```js
    { key: "analytics", label: "Analytik", Icon: LineChart },
```

- [ ] **Step 6: Analytik-Render**

Direkt VOR `{/* ═══ INSERATE ═══ */}` einfügen:
```jsx
          {/* ═══ ANALYTIK ═══ */}
          {tab === "analytics" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
                  {[7, 30, 90].map(d => (
                    <button key={d} onClick={() => setAnalyticsRange(d)} style={{ fontSize: 11, fontWeight: analyticsRange === d ? 700 : 500, padding: "6px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: analyticsRange === d ? colors.dark : "transparent", color: analyticsRange === d ? "#fff" : colors.muted }}>{d} Tage</button>
                  ))}
                </div>
              </div>
              {(!analytics || analyticsLoading) ? (
                <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Analytik…</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Neue Nutzer</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.users)}</span></div>
                    <div style={chartBig}>{sumSeries(analytics.users)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
                    <TrendChart data={analytics.users} color="#0E9493" type="area" />
                    {axisLabels(analytics.users)}
                  </div>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Umsatz (GMV)</span><span style={{ fontSize: 11, color: colors.muted }}>{analytics.sales} Verkäufe</span></div>
                    <div style={chartBig}>CHF {fmtCHF(sumSeries(analytics.gmv))}</div>
                    <TrendChart data={analytics.gmv} color="#D9A005" type="bar" />
                    {axisLabels(analytics.gmv)}
                  </div>
                  <div style={chartCard}>
                    <div style={chartHead}><span style={chartLabel}>Neue Inserate</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.listings)}</span></div>
                    <div style={chartBig}>{sumSeries(analytics.listings)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
                    <TrendChart data={analytics.listings} color="#5B8C5A" type="line" />
                    {axisLabels(analytics.listings)}
                  </div>
                  <div style={chartCard}>
                    <span style={chartLabel}>Inserate nach Typ</span>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                      {(() => {
                        const maxT = Math.max(1, ...analytics.byType.map(t => t.count));
                        const lbl = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
                        const col = { sell: "#F4C03F", auction: "#94B9C9", rent: "#8B6DB0", free: "#5B8C5A", service: "#E67E22" };
                        return analytics.byType.map(t => (
                          <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                            <span style={{ width: 62, color: "#3a3a3a" }}>{lbl[t.type]}</span>
                            <div style={{ flex: 1, background: colors.cream, borderRadius: 999, height: 10 }}><div style={{ width: `${(t.count / maxT) * 100}%`, height: 10, borderRadius: 999, background: col[t.type] }} /></div>
                            <span style={{ color: colors.muted, width: 22, textAlign: "right" }}>{t.count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
```

- [ ] **Step 7: Verify (Controller, live)**

Admin neu laden, „Analytik"-Tab klicken. `preview_eval`:
```js
(()=>{const b=[...document.querySelectorAll('.admin-nav button')].find(x=>x.textContent.trim().startsWith('Analytik')); b.click(); return new Promise(r=>setTimeout(()=>r(JSON.stringify({
  err: document.body.innerText.includes('Cannot find module')||!!document.querySelector('nextjs-portal'),
  svgs: document.querySelectorAll('.admin-main svg polyline, .admin-main svg rect, .admin-main svg polygon').length,
  labels: ['Neue Nutzer','Umsatz (GMV)','Neue Inserate','Inserate nach Typ'].filter(t=>document.body.innerText.includes(t)).length,
  ranges: [...document.querySelectorAll('.admin-main button')].map(x=>x.textContent.trim()).filter(t=>/Tage$/.test(t))
})),1500));})()
```
Erwartet: `err:false`, `svgs > 0`, `labels:4`, `ranges:["7 Tage","30 Tage","90 Tage"]`. Dann „7 Tage" klicken und prüfen, dass neu geladen wird (kurz „Lade Analytik…" bzw. geänderte Werte). `preview_console_logs` level error → leer.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Analytik-Tab mit 4 SVG-Charts + Zeitraum-Umschalter"
```

---

## Task 4: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In der Sektion `id: "admin"` nach dem letzten Eintrag (`adm_user_emails`) ergänzen:
```js
      { id: "adm_analytics_tab", label: "Analytik-Tab zeigt 4 Diagramme (Neue Nutzer, GMV, Neue Inserate, Inserate nach Typ)" },
      { id: "adm_analytics_range", label: "Zeitraum 7/30/90 Tage umschalten lädt die Reihen neu" },
      { id: "adm_analytics_empty", label: "Leerer Zeitraum zeigt 0-Linien statt Fehler" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Analytik-Tab erweitert"
```

---

## Task 5: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1:** Voller Live-Durchlauf: Analytik-Tab (4 Charts, Range-Umschalter wechselt Daten), Übersicht + andere Tabs unverändert, keine Konsolenfehler.
- [ ] **Step 2:** Spot-Check der Bucket-Logik: im Analytik-Tab `preview_eval`, dass die Reihenlänge dem Zeitraum entspricht (z.B. nach „7 Tage" hat jede Serie 7 Punkte) — via `document.querySelectorAll('.admin-main svg rect').length` für den GMV-Balkenchart (= 7 bzw. 30/90).
- [ ] **Step 3:** Zeggy unverändert.
- [ ] **Step 4:** Finaler Code-Review-Subagent über `git diff <letzter-Welle-Mahnwesen-Commit>..HEAD` (Spec-Konformität, tote Symbole, Em-Dash/Emoji-Regel in neuem UI-Text, Helfer-Reinheit).

---

## Self-Review (Autor)

- **Spec-Abdeckung:** adminAnalytics.js → T1. TrendChart → T2. Nav-Tab + State + lazy-Load + 4 Charts + Range → T3. Beta → T4. Verifizierung/Review → T5. Alle Spec-Punkte abgedeckt.
- **Platzhalter:** keine — vollständiger Code je Schritt; Verify-Schritte mit konkreten Assertions.
- **Typ-/Namens-Konsistenz:** `bucketDaily(rows, rangeDays, valueFn)` + `countByType(rows)` in T1 definiert, in T3-useEffect genutzt. `TrendChart({data,color,type,height})` in T2 definiert, in T3 mit `type` area/bar/line genutzt. `analytics` Form `{users, listings, gmv, sales, byType}` konsistent zwischen useEffect und Render. `sumSeries`/`axisLabels`/`chartCard`/`chartHead`/`chartLabel`/`chartBig`/`chartSub` in T3 Step 2 definiert, im Render genutzt. `LineChart` aus lucide ergänzt. `fmtCHF`/`fmtDate`/`colors`/`fonts`/`modPill`/`supabase` bereits vorhanden.
```
