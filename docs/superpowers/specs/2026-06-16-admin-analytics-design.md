# Admin Analytics-Cockpit (Welle 2)

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Review

## Ziel

Ein eigener „Analytik"-Tab im Admin mit echten Zeitreihen-Diagrammen (Trends), zusätzlich zur
operativen Übersicht. Selbstgebaute SVG-Charts (keine Library), Zeitraum-Umschalter, Daten beim
Öffnen des Tabs gezielt nachgeladen und client-seitig pro Tag gebündelt. Kein DB-Umbau.

## Festgelegte Entscheidungen (Brainstorming, „nimm das Empfohlene")

1. **Charts selbst gebaut (SVG)**, keine Library.
2. **Eigener Nav-Tab „Analytik"** (Übersicht bleibt operativ + Mini-Analytik wie gehabt).
3. **Zeitraum-Umschalter 7 / 30 / 90 Tage**, Default 30.
4. **Daten lazy** beim Tab-Öffnen + bei Zeitraumwechsel, client-seitige Tages-Bündelung.
5. **Vier Diagramme:** Neue Nutzer/Tag (Fläche), Umsatz GMV/Tag (Balken), Neue Inserate/Tag (Linie),
   Inserate nach Typ (horizontale Balken, ganzer Bestand).

## Kontext (verifiziert)

- Kein Chart-Lib in `package.json`; kein bestehendes Chart-Muster.
- `profiles.created_at`, `listings.created_at`/`listing_type`, `purchases.created_at`/`price`/`shipping_cost`/`status` vorhanden.
- Admin (`src/app/(public)/admin/page.jsx`): `tab`-State steuert die Tabs; Nav-Array `NAV`; Mini-Analytik (GMV/Ø/Top-5) liegt auf der Übersicht und bleibt.
- `new Date()`/`Date.now()` sind im Client-Component erlaubt.

## Feature 1 — Daten-Helfer `src/lib/adminAnalytics.js` (rein, testbar)

```js
// Bündelt Zeilen mit created_at in Tages-Buckets über die letzten rangeDays Tage (inkl. heute).
// valueFn(row) -> Zahl (z.B. () => 1 für Zählung, oder Betrag). Fehlende Tage = 0.
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

// Zählt Inserate je Typ in fester Reihenfolge.
export function countByType(rows) {
  const order = ["sell", "auction", "rent", "free", "service"];
  const c = { sell: 0, auction: 0, rent: 0, free: 0, service: 0 };
  (rows || []).forEach(r => { if (r.listing_type in c) c[r.listing_type] += 1; });
  return order.map(k => ({ type: k, count: c[k] }));
}
```

## Feature 2 — Chart-Komponente `src/components/admin/TrendChart.jsx`

Reine SVG-Darstellung einer Tagesreihe (`data` = `[{date, value}]`). `type`: `area` | `line` | `bar`.
Native Hover-Werte via `<title>`. BEEDARO-Farben werden per `color`-Prop gesetzt.

```jsx
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
          return <rect key={i} x={bx} y={by} width={bw} height={Math.max(0, H - pad - by)} rx="1.5" fill={color}><title>{d.date}: {Math.round(d.value)}</title></rect>;
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

(Hinweis: `preserveAspectRatio="none"` lässt den Chart die Kartenbreite füllen; akzeptiert leichte X-Streckung — für Trends ok.)

## Feature 3 — „Analytik"-Tab im Admin

- **Nav:** neuer Eintrag `{ key: "analytics", label: "Analytik", Icon: LineChart }` (aus lucide-react). Platzierung nach „Übersicht" oder vor „Meldungen" — Wahl bei Umsetzung, sinnvoll früh.
- **State:** `analyticsRange` (Default 30), `analytics` (`{ users, listings, gmv, sales, byType }` | null), `analyticsLoading`.
- **Lazy-Load:** `useEffect(() => { if (tab === "analytics") loadAnalytics(); }, [tab, analyticsRange])`.
  ```js
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const start = new Date(Date.now() - analyticsRange * 86400000).toISOString();
    const [u, l, p, lt] = await Promise.all([
      supabase.from("profiles").select("created_at").gte("created_at", start),
      supabase.from("listings").select("created_at").gte("created_at", start),
      supabase.from("purchases").select("created_at, price, shipping_cost, status").gte("created_at", start),
      supabase.from("listings").select("listing_type"),
    ]);
    const paid = (p.data || []).filter(x => x.status !== "cancelled");
    setAnalytics({
      users: bucketDaily(u.data, analyticsRange, () => 1),
      listings: bucketDaily(l.data, analyticsRange, () => 1),
      gmv: bucketDaily(paid, analyticsRange, r => parseFloat(r.price || 0) + parseFloat(r.shipping_cost || 0)),
      sales: paid.length,
      byType: countByType(lt.data),
    });
    setAnalyticsLoading(false);
  };
  ```
- **Render:** Kopf mit Titel + Zeitraum-Umschalter (Pills 7/30/90, aktive = `modPill(true)`). Darunter 2x2-Grid mit vier Karten:
  - **Neue Nutzer** — `TrendChart type="area" color="#0E9493"`, Summe = Σ `users.value`, Delta-Badge `+Summe`.
  - **Umsatz (GMV)** — `TrendChart type="bar" color="#D9A005"`, Kopf `CHF {fmtCHF(Σ gmv.value)}` + `{sales} Verkäufe`.
  - **Neue Inserate** — `TrendChart type="line" color="#5B8C5A"`, Summe = Σ `listings.value`.
  - **Inserate nach Typ** — horizontale Balken (divs wie im Mockup), Farben sell `#F4C03F` / auction `#94B9C9` / rent `#8B6DB0` / free `#5B8C5A` / service `#E67E22`, Labels Festpreis/Auktion/Miete/Gratis/Service, Breite relativ zum Max.
  - Während `analyticsLoading` bzw. `analytics === null`: kompakter „Lade Analytik…"-Platzhalter.
- Unter den Linien-/Balkencharts eine dezente X-Achsen-Beschriftung: linker Wert = Startdatum (gekürzt), rechter = „heute".

## Dateien

- **Create:** `src/lib/adminAnalytics.js`, `src/components/admin/TrendChart.jsx`.
- **Modify:** `src/app/(public)/admin/page.jsx` (Import, State, loadAnalytics, Nav, Analytik-Render), `src/app/(public)/beta/page.jsx` (Checkliste).
- Keine DB-Migration.

## Out of Scope (bewusst)

- Conversion-Funnel (Besucher→Kauf): erfordert Tracking, das es nicht gibt — später.
- Server-seitige Aggregation (RPC): bei wachsender Datenmenge nachrüsten; für Beta reicht der client-seitige Range-Fetch.
- Export der Charts, Vergleichszeiträume, Drilldown.

## Verifizierung

- Live als Admin (`/admin`, Dev-Server läuft; KEIN `npm run build`).
- Analytik-Tab öffnet, vier Charts rendern (SVG vorhanden), Summen plausibel.
- Zeitraum 7/30/90 umschalten lädt neu und ändert die Reihen.
- `bucketDaily`/`countByType` rein und korrekt (z.B. per kurzem `preview_eval`-Aufruf der importierten Funktion gegen erwartete Buckets).
- Keine Konsolenfehler; Übersicht/andere Tabs unverändert. Zeggy unverändert.

## Beta-Checkliste (Sektion „Admin-Bereich")

- `adm_analytics_tab`: Analytik-Tab zeigt 4 Diagramme (Neue Nutzer, GMV, Neue Inserate, Inserate nach Typ).
- `adm_analytics_range`: Zeitraum 7/30/90 Tage umschalten lädt die Reihen neu.
- `adm_analytics_empty`: leerer Zeitraum zeigt 0-Linien statt Fehler.
