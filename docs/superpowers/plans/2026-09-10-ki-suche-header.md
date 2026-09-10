# KI-Suche im Header-Suchfeld — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sparkles-Knopf im Header-Suchfeld öffnet /search mit offenem KI-Panel, übernimmt getippten Text und startet die KI-Suche automatisch (einmalig).

**Architecture:** Header reicht nur weiter (`/search?ki=1&q=...`), keinerlei KI-Logik dort. Die Suchseite erkennt `ki=1`, leitet den `q`-Parameter ins KI-Feld um (statt in die Stichwortsuche) und startet `kiSuchen()` einmal, sobald die Kategorien geladen sind (Ref-Guard gegen StrictMode-Doppelauslösung).

**Tech Stack:** Next.js 14 App Router, bestehende KI-Suche (/api/ai-search), Lucide `Sparkles`.

**Spec:** `docs/superpowers/specs/2026-09-10-ki-suche-header-design.md`

**Projektregeln:** KEIN `npm run build` (Dev-Server läuft), Verifizierung live im Preview (Port 57636, preview_start name "beedaro"). Login für den KI-Aufruf via `scratchpad/mksession.cjs` + localStorage-Token, Token-Dateien danach löschen.

---

### Task 1: Header — Sparkles-Knopf im Suchfeld

**Files:**
- Modify: `src/components/layout/Header.tsx` (Lucide-Import; Suchfeld ~Zeile 220-231, vor dem Suchen-Knopf)

- [ ] **Step 1: `Sparkles` zum bestehenden lucide-react-Import ergänzen** (Importzeile am Dateianfang, exakten Bestand beim Editieren lesen).

- [ ] **Step 2: Knopf einfügen** — im Desktop-Suchfeld direkt VOR dem gelben Suchen-Button (`onClick={() => { handleSearch(); ... }}`, ~Zeile 230):

```tsx
{/* KI-Suche: reicht den getippten Text an das KI-Panel auf /search weiter */}
<button
  onClick={() => {
    router.push('/search?ki=1' + (searchQuery.trim() ? '&q=' + encodeURIComponent(searchQuery.trim()) : ''))
    setShowSuggestions(false)
  }}
  title="KI-Suche: beschreib einfach, was du suchst"
  aria-label="KI-Suche"
  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
>
  <Sparkles size={16} color="#0B5E5C" />
</button>
```

- [ ] **Step 3: Kompilierprüfung** — `curl -s -o /dev/null -w "%{http_code}" http://localhost:57636/` → 200.

### Task 2: Suchseite — ki=1 erkennen, q umleiten, Auto-Start

**Files:**
- Modify: `src/app/(public)/search/page.jsx` (State-Initialisierung ~Zeile 133-135, Sync-Effect ~Zeile 167-177, KI-State-Block)

- [ ] **Step 1: Einstiegs-Flag + umgeleitete Initialisierung** — direkt bei den States:

```jsx
// KI-Einstieg aus dem Header: /search?ki=1&q=... - der q-Text gehoert dann
// dem KI-Feld, NICHT der Stichwortsuche (sonst feuern beide).
const kiEntry = searchParams.get("ki") === "1";
const [query, setQuery] = useState(kiEntry ? "" : (searchParams.get("q") || ""));
const [draft, setDraft] = useState(kiEntry ? "" : (searchParams.get("q") || ""));
```

und beim KI-State:

```jsx
const [kiOffen, setKiOffen] = useState(kiEntry);
const [kiText, setKiText] = useState(kiEntry ? (searchParams.get("q") || "") : "");
```

- [ ] **Step 2: Sync-Effect schützen** — in dem Effect, der `searchParams` auf `query` spiegelt (~Zeile 167): `if (q !== query) { ... }` wird zu `if (q !== query && !kiEntry) { ... }`.

- [ ] **Step 3: Auto-Start mit Ref-Guard** — nach der Definition von `kiSuchen()`:

```jsx
// Auto-Start beim Header-Einstieg: einmalig, erst wenn die Kategorien
// geladen sind (die KI bekommt sie als Auswahlliste mit).
const kiAutoRef = useRef(false);
useEffect(() => {
  if (kiEntry && kiText.trim() && mainCats.length > 0 && !kiAutoRef.current) {
    kiAutoRef.current = true;
    kiSuchen();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [categories]);
```

(`useRef` ist in der Datei bereits importiert.)

- [ ] **Step 4: Kompilierprüfung** — `curl -s -o /dev/null -w "%{http_code}" "http://localhost:57636/search?ki=1&q=test"` → 200.

### Task 3: Live-Verifizierung im Preview

- [ ] **Step 1:** Browser eingeloggt (mksession-Muster), `/` öffnen, im Header-Suchfeld "etwas zum spielen aus den 90er" tippen, Sparkles klicken. Erwartet: /search, KI-Panel offen, Text übernommen, genau EIN /api/ai-search-Aufruf (Netzwerk-Log), danach Suchbegriff "Game Boy" gesetzt und Treffer sichtbar.
- [ ] **Step 2:** Sparkles mit leerem Feld: Panel offen, kein API-Aufruf.
- [ ] **Step 3:** Enter im Header-Feld mit "Gitarre": normale Stichwortsuche unverändert (`/search?q=Gitarre`, kein KI-Panel).
- [ ] **Step 4:** Token-Dateien im Scratchpad löschen.

### Task 4: Nachführen + Push

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Suche-Sektion, nach `sr_ki`)
- Modify: `src/lib/replog.js` (Block "10. September 2026")

- [ ] **Step 1: Checklisten-Eintrag** nach `sr_ki`:

```js
      { id: "sr_ki_header", label: "Sparkles-Symbol im Header-Suchfeld öffnet die KI-Suche auf der Suchseite und nimmt den getippten Text mit; Enter bleibt normale Suche" },
```

- [ ] **Step 2: Rep-Log-Punkt** im 10.09.-Block:

```js
      { typ: "neu", bereich: "Suche", text: "KI-Suche direkt aus dem Suchfeld oben: Sparkles-Symbol antippen, der getippte Text wird übernommen und die KI legt los", melder: "Denis" },
```

- [ ] **Step 3: Commit + Push**

```bash
git add src/components/layout/Header.tsx "src/app/(public)/search/page.jsx" "src/app/(public)/beta/page.jsx" src/lib/replog.js docs/superpowers/plans/2026-09-10-ki-suche-header.md
git commit -m "feat(ki-suche): Sparkles-Einstieg im Header-Suchfeld"
git push origin master:main
```
