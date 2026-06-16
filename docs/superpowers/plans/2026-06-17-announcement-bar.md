# Ankündigungsbalken Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein vom Admin steuerbarer Balken über dem Header (Text, an/aus, Farbe), vom Besucher per X wegklickbar.

**Architecture:** Singleton-Tabelle `site_announcement` (öffentlich lesbar, Admin schreibt) als Quelle; eine Client-Komponente über dem Header; ein Admin-Modal-Editor.

**Tech Stack:** Supabase (RLS), Next.js 14 Client Components, Lucide Icons.

**Verifizierung:** Live-Preview (kein Unit-Test-Runner). **NIE `npm run build`** neben dem Dev-Server. Banner-Testdaten am Ende auf „aus".

---

## Task 1: Migration `site_announcement`

**Files:**
- Create: `supabase/migrations/20260617_site_announcement.sql`
- Apply: via MCP `apply_migration` (name `site_announcement`)

- [ ] **Step 1: SQL schreiben + anwenden**

```sql
CREATE TABLE IF NOT EXISTS public.site_announcement (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#0E9493',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_announcement (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.site_announcement ENABLE ROW LEVEL SECURITY;
CREATE POLICY ann_select ON public.site_announcement FOR SELECT USING (true);
CREATE POLICY ann_update ON public.site_announcement FOR UPDATE
  USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0')
  WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
```

- [ ] **Step 2: Verifizieren (SQL)**

```sql
select * from site_announcement;
```
Erwartet: 1 Zeile, id=1, enabled=false, bg `#0E9493`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617_site_announcement.sql
git commit -m "feat(banner): Tabelle site_announcement (Singleton, RLS)"
```

---

## Task 2: `src/lib/announcement.js`

**Files:**
- Create: `src/lib/announcement.js`

- [ ] **Step 1: Datei anlegen**

```js
import { supabase } from "@/lib/supabase/supabase";

// Brand-Presets (Hintergrund + lesbare Textfarbe).
export const ANNOUNCEMENT_PRESETS = [
  { name: "Teal", bg: "#0E9493", text: "#FFFFFF" },
  { name: "Gelb", bg: "#F4C03F", text: "#191615" },
  { name: "Grün", bg: "#5B8C5A", text: "#FFFFFF" },
  { name: "Dark", bg: "#191615", text: "#FFFFFF" },
  { name: "Rot",  bg: "#EB5E55", text: "#FFFFFF" },
];

export async function getAnnouncement() {
  const { data } = await supabase.from("site_announcement").select("*").eq("id", 1).maybeSingle();
  return data || null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/announcement.js
git commit -m "feat(banner): announcement-Helfer + Presets"
```

---

## Task 3: `src/components/layout/AnnouncementBar.jsx`

**Files:**
- Create: `src/components/layout/AnnouncementBar.jsx`

- [ ] **Step 1: Komponente schreiben**

```jsx
"use client";
import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { getAnnouncement } from "@/lib/announcement";

export function AnnouncementBar() {
  const [a, setA] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let active = true;
    getAnnouncement().then((row) => {
      if (!active || !row) return;
      const dismissed = typeof window !== "undefined" ? localStorage.getItem("beedaro_ann_dismissed") : null;
      setA(row);
      setShow(!!row.enabled && !!(row.message || "").trim() && dismissed !== row.updated_at);
    });
    return () => { active = false; };
  }, []);

  if (!show || !a) return null;
  const dismiss = () => { try { localStorage.setItem("beedaro_ann_dismissed", a.updated_at); } catch {} setShow(false); };

  return (
    <div style={{ background: a.bg_color, color: a.text_color, fontSize: 13, fontWeight: 600, padding: "9px 40px 9px 14px", textAlign: "center", position: "relative", fontFamily: "'Manrope', sans-serif", lineHeight: 1.4 }}>
      <Megaphone size={15} style={{ verticalAlign: "-3px", marginRight: 6, opacity: 0.9 }} />
      {a.message}
      <button onClick={dismiss} aria-label="Schliessen" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: a.text_color, cursor: "pointer", opacity: 0.85, display: "inline-flex", padding: 4 }}>
        <X size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/AnnouncementBar.jsx
git commit -m "feat(banner): AnnouncementBar-Komponente (dismissbar)"
```

---

## Task 4: Einhängen in `(public)/layout.tsx`

**Files:**
- Modify: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Import + Render vor Header**

Import ergänzen (nach Zeile 1):
```tsx
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
```
Und die Header-Zeile (14) so erweitern:
```tsx
      <div className="no-print"><AnnouncementBar /></div>
      <div className="no-print"><Header /></div>
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/layout.tsx"
git commit -m "feat(banner): AnnouncementBar ueber dem Header einhaengen"
```

---

## Task 5: Admin-State + Save (`useAdminData.jsx`)

**Files:**
- Modify: `src/components/admin/useAdminData.jsx` (Import; State; Handler; return)

- [ ] **Step 1: Import**

Bei den Imports ergänzen:
```js
import { getAnnouncement } from "@/lib/announcement";
```

- [ ] **Step 2: State** (bei den übrigen `useState`, z.B. nach `broadcastOpen`-State)

```js
  const [annOpen, setAnnOpen] = useState(false);
  const [ann, setAnn] = useState({ enabled: false, message: "", bg_color: "#0E9493", text_color: "#FFFFFF" });
```

- [ ] **Step 3: Öffnen + Speichern** (nach `sendBroadcast`)

```js
  const openAnnouncement = async () => {
    const row = await getAnnouncement();
    if (row) setAnn({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#0E9493", text_color: row.text_color || "#FFFFFF" });
    setAnnOpen(true);
  };
  const saveAnnouncement = async () => {
    const { error } = await supabase.from("site_announcement").update({
      enabled: ann.enabled, message: ann.message.trim(), bg_color: ann.bg_color, text_color: ann.text_color,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) { flash("Fehler beim Speichern"); return; }
    flash(ann.enabled ? "Banner gespeichert + aktiv" : "Banner gespeichert (aus)");
    logAdmin("announcement_bar", "banner", ann.enabled ? "an" : "aus", { message: ann.message.trim() });
    setAnnOpen(false);
  };
```

- [ ] **Step 4: return** — die neuen Bezeichner ergänzen (bei den Broadcast-Feldern):
```js
    broadcastOpen, setBroadcastOpen, /* … bestehende … */ sendBroadcast,
    annOpen, setAnnOpen, ann, setAnn, openAnnouncement, saveAnnouncement,
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/useAdminData.jsx
git commit -m "feat(banner): Admin-State + saveAnnouncement"
```

---

## Task 6: Admin-Button + Modal (`AdminShell.jsx`)

**Files:**
- Modify: `src/components/admin/AdminShell.jsx` (Import; Destrukturierung Z.54; Button Z.130-134; AUDIT_META; Modal)

- [ ] **Step 1: Import Presets**

```js
import { ANNOUNCEMENT_PRESETS } from "@/lib/announcement";
```

- [ ] **Step 2: Destrukturierung** — bei der Broadcast-Zeile (54) ergänzen:
```js
    annOpen, setAnnOpen, ann, setAnn, openAnnouncement, saveAnnouncement,
```

- [ ] **Step 3: „Banner"-Button neben „Ankündigung senden"**

Den Button-Container (Z.130-134) ersetzen durch:
```jsx
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
                <button onClick={openAnnouncement} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                  <Megaphone size={15} /> Banner
                </button>
                <button onClick={() => setBroadcastOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.dark, color: "#fff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                  <Megaphone size={15} /> Ankündigung senden
                </button>
              </div>
```

- [ ] **Step 4: AUDIT_META ergänzen**

Im `AUDIT_META`-Objekt einen Eintrag hinzufügen:
```js
  announcement_bar: { label: "Banner geändert", Icon: Megaphone, color: "#0E9493", bg: "#E6F5F5" },
```

- [ ] **Step 5: Banner-Modal**

Nach dem `{broadcastOpen && ( … )}`-Block einfügen:
```jsx
      {annOpen && (
        <div onClick={() => setAnnOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
              <Megaphone size={17} color={colors.yellow} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigungsbalken</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: colors.dark }}>
                <input type="checkbox" checked={ann.enabled} onChange={e => setAnn({ ...ann, enabled: e.target.checked })} /> Balken aktiv
              </label>
              <input value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder="Text des Balkens…" style={{ ...bcInput }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Farbe</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ANNOUNCEMENT_PRESETS.map(p => (
                    <button key={p.name} onClick={() => setAnn({ ...ann, bg_color: p.bg, text_color: p.text })} style={{ background: p.bg, color: p.text, border: `2px solid ${ann.bg_color === p.bg ? colors.dark : "transparent"}`, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{p.name}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>BG <input value={ann.bg_color} onChange={e => setAnn({ ...ann, bg_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
                  <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>Text <input value={ann.text_color} onChange={e => setAnn({ ...ann, text_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Vorschau</div>
                <div style={{ background: ann.bg_color, color: ann.text_color, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 8, textAlign: "center" }}>
                  <Megaphone size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{ann.message || "Vorschau-Text"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              <button onClick={() => setAnnOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={saveAnnouncement} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
            </div>
          </div>
        </div>
      )}
```
(`bcInput` ist in AdminShell aus `adminStyles` importiert; `Megaphone`, `colors`, `fonts` vorhanden.)

- [ ] **Step 6: Live verifizieren (Admin)**

Admin → Übersicht → „Banner": Modal öffnet; Text eingeben, Preset wählen (Vorschau ändert sich), „Balken aktiv" an, Speichern → Toast. Kein Fehler.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AdminShell.jsx
git commit -m "feat(banner): Admin Banner-Button + Editor-Modal + Audit-Meta"
```

---

## Task 7: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Sektion „Navigation & Header", id "nav")

- [ ] **Step 1: Items ergänzen** (in der `nav`-Sektion):
```jsx
      { id: "ann_bar_admin", label: "Admin 'Banner': Text/Farbe (Presets+Hex)/An-Aus mit Live-Vorschau, Speichern wirkt" },
      { id: "ann_bar_public", label: "Balken über dem Header sichtbar (auch ausgeloggt); X blendet aus + bleibt nach Reload; neuer Text bringt ihn zurück" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Ankuendigungsbalken erweitert"
```

---

## Task 8: Abschluss-Verifizierung + Baseline

- [ ] **Step 1: Voller Flow (live)**

Admin Banner setzen (Text + Teal + aktiv) → Startseite `/`: Balken über Header, Teal, Text korrekt. Eine Unterseite (z.B. `/search`): auch da. **X** klicken → weg; Reload → bleibt weg. Admin Text ändern + speichern → Reload Startseite: Balken erscheint wieder (neues `updated_at`).

- [ ] **Step 2: Ausgeloggt**

In einem ausgeloggten Zustand (oder via SQL bestätigen: `select` als anon möglich, RLS select using(true)) — Balken lädt auch ohne Login.

- [ ] **Step 3: Baseline**

Banner wieder auf **aus** setzen (Admin oder `update site_announcement set enabled=false where id=1`). Keine Test-Pollution.

---

## Self-Review (Plan gegen Spec)

- **Tabelle + RLS (öffentlich lesbar, Admin schreibt):** Task 1. ✓
- **Helfer + Presets:** Task 2. ✓
- **Bar dismissbar (X, localStorage by updated_at):** Task 3. ✓
- **Über Header eingehängt:** Task 4. ✓
- **Admin State/Save (+ logAdmin):** Task 5. ✓
- **Admin Button + Modal (Toggle/Text/Presets+Hex/Vorschau) + AUDIT_META:** Task 6. ✓
- **Beta:** Task 7. ✓
- **Verifizierung inkl. ausgeloggt + Baseline:** Task 8. ✓
- **Typkonsistenz:** `ann` ({enabled,message,bg_color,text_color}) durchgängig; `getAnnouncement` liefert die Zeile (inkl. updated_at) wie in Bar + Editor genutzt; `announcement_bar` in AUDIT_META + logAdmin-Aufruf identisch. ✓
