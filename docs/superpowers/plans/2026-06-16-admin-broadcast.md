# Admin Broadcast / Ankündigung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Admin kann eine Ankündigung als In-App-Benachrichtigung an alle oder ein Segment (Privat/Unternehmen) der Nutzer senden.

**Architecture:** Reine Frontend-Erweiterung: ein Composer-Modal im Admin (`src/app/(public)/admin/page.jsx`), das je Zielnutzer eine `notifications`-Zeile (Typ `announcement`) batch-inserted; die NotificationBell bekommt ein Megafon-Icon für diesen Typ. Keine DB-Migration (INSERT-Policy auf notifications ist `true`).

**Tech Stack:** Next.js 14 (Client Component), Supabase JS, Lucide, Inline-Styles + `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-16-admin-broadcast-design.md`.

---

## Umgebungs-/Verifizierungsregeln

- **Kein** `npm run build` / `npm run dev` neben dem laufenden Dev-Server. Verifizieren per Live-Preview (`/admin`, eingeloggt als `yam`) + Supabase-MCP.
- Implementer-Subagenten: nur Datei-Edits + Commit, keine Build-/Server-Befehle.
- Test-Notifications nach der Prüfung per SQL löschen (Controller).

## File Structure

- **Modify** `src/components/shared/NotificationBell.jsx` — Megafon-Icon für Typ `announcement`.
- **Modify** `src/app/(public)/admin/page.jsx` — State, `bcTargets`, `sendBroadcast`, Übersicht-Button, Composer-Modal, `Megaphone`-Import, Style-Consts.
- **Modify** `src/app/(public)/beta/page.jsx` — Checkliste.
- Keine DB-Migration.

---

## Task 1: NotificationBell — Icon für `announcement`

**Files:**
- Modify: `src/components/shared/NotificationBell.jsx`

- [ ] **Step 1: Import + Icon-Map**

In `src/components/shared/NotificationBell.jsx` die lucide-Import-Zeile
```js
import { Bell, Check, CheckCheck, X, Gavel, ShoppingBag, MessageCircle, Star, CalendarDays, Trash2 } from "lucide-react";
```
um `Megaphone` ergänzen:
```js
import { Bell, Check, CheckCheck, X, Gavel, ShoppingBag, MessageCircle, Star, CalendarDays, Trash2, Megaphone } from "lucide-react";
```
In der `ICONS`-Map (endet mit `rental: CalendarDays,` + `};`) einen Eintrag ergänzen:
```js
  announcement: Megaphone,
```

- [ ] **Step 2: Verify (Controller, live)**

`preview_eval` (egal welche Seite, Komponente kompiliert beim nächsten Render): keine Konsolenfehler; der eigentliche Sicht-Test erfolgt in Task 2 (gesendete Ankündigung mit Megafon-Icon).

- [ ] **Step 3: Commit**

```bash
git add "src/components/shared/NotificationBell.jsx"
git commit -m "feat(notifications): Megafon-Icon fuer Ankuendigungen"
```

---

## Task 2: Broadcast-Composer im Admin

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Import + Style-Consts**

In der lucide-react-Importzeile `Megaphone` ergänzen. Bei den Modul-Level-Consts (nahe `th`/`td`/`pill`, oberhalb `export default function AdminPage`) ergänzen:
```js
const bcFieldLabel = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 4 };
const bcInput = { width: "100%", boxSizing: "border-box", border: "1px solid #E2E2E2", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: fonts.body, color: "#191615", outline: "none" };
```

- [ ] **Step 2: State**

Bei den `useState`-Zeilen ergänzen:
```js
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcSegment, setBcSegment] = useState("all");
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcLink, setBcLink] = useState("");
  const [bcSending, setBcSending] = useState(false);
```

- [ ] **Step 3: Zielliste + Sende-Handler**

Bei den Helfern vor `return` (z.B. nach `toggleBan`) ergänzen:
```js
  const bcTargets = users.filter(u =>
    bcSegment === "all" ? true :
    bcSegment === "business" ? u.account_type === "business" :
    u.account_type !== "business");
  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) return;
    setBcSending(true);
    const rows = bcTargets.map(u => ({
      user_id: u.id, type: "announcement",
      title: bcTitle.trim(), message: bcMessage.trim(),
      link: bcLink.trim() || null, is_read: false,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    setBcSending(false);
    if (error) { flash("Fehler beim Senden"); return; }
    flash(`Ankündigung an ${rows.length} Nutzer gesendet`);
    setBroadcastOpen(false); setBcTitle(""); setBcMessage(""); setBcLink(""); setBcSegment("all");
  };
```

- [ ] **Step 4: Button auf der Übersicht**

Im `{tab === "overview" && (` -Block: direkt nach dem öffnenden `<div>` (also VOR dem Stat-Karten-Grid `<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", … }}>`) einfügen:
```jsx
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button onClick={() => setBroadcastOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.dark, color: "#fff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                  <Megaphone size={15} /> Ankündigung senden
                </button>
              </div>
```

- [ ] **Step 5: Composer-Modal**

Direkt VOR dem `{toast && …}` am Ende der Komponente einfügen:
```jsx
      {broadcastOpen && (
        <div onClick={() => setBroadcastOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
              <Megaphone size={17} color={colors.yellow} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigung senden</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              <div>
                <div style={bcFieldLabel}>Zielgruppe</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
                    {[["all", "Alle"], ["private", "Privat"], ["business", "Unternehmen"]].map(([k, l]) => (
                      <button key={k} onClick={() => setBcSegment(k)} style={{ fontSize: 11, fontWeight: bcSegment === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: bcSegment === k ? colors.dark : "transparent", color: bcSegment === k ? "#fff" : colors.muted }}>{l}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#0A7170", fontWeight: 600 }}>geht an {bcTargets.length} Nutzer</span>
                </div>
              </div>
              <div>
                <div style={bcFieldLabel}>Titel</div>
                <input value={bcTitle} onChange={e => setBcTitle(e.target.value)} placeholder="z.B. Neue Funktion" style={bcInput} />
              </div>
              <div>
                <div style={bcFieldLabel}>Nachricht</div>
                <textarea value={bcMessage} onChange={e => setBcMessage(e.target.value)} rows={3} placeholder="Deine Ankündigung…" style={{ ...bcInput, resize: "vertical", lineHeight: 1.5 }} />
              </div>
              <div>
                <div style={bcFieldLabel}>Link (optional)</div>
                <input value={bcLink} onChange={e => setBcLink(e.target.value)} placeholder="/listings/new" style={bcInput} />
              </div>
              <div style={{ border: "1px dashed #cfd8d8", borderRadius: 10, padding: "11px 12px", background: "#F7FBFB" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#0A7170", marginBottom: 7 }}>Vorschau in der Glocke</div>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Megaphone size={15} color={colors.dark} /></div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.dark }}>{bcTitle || "Titel der Ankündigung"}</div>
                    <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.45 }}>{bcMessage || "Text der Ankündigung…"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "13px 18px", borderTop: `1px solid ${colors.borderLt}` }}>
              <button onClick={() => setBroadcastOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={sendBroadcast} disabled={!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) ? "default" : "pointer", fontFamily: fonts.body, opacity: (!bcTitle.trim() || !bcMessage.trim() || bcTargets.length === 0 || bcSending) ? 0.5 : 1 }}>{bcSending ? "Sende…" : `An ${bcTargets.length} senden`}</button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 6: Verify (Controller, live)**

Admin → Übersicht. `preview_eval`: Button „Ankündigung senden" vorhanden; Klick öffnet Modal (`Zielgruppe`/`Vorschau in der Glocke` im DOM). Segment „Unternehmen" klicken → „geht an N Nutzer" ändert sich. In Titel + Nachricht tippen (React-controlled über native setter + input-Event) → Vorschau aktualisiert; Senden-Button wird aktiv (nicht disabled).
**Test-Senden:** Segment „Alle", Titel `__TESTBROADCAST__`, Nachricht „Test", Senden klicken. Dann per Supabase-MCP prüfen: `select count(*) from notifications where type='announcement' and title='__TESTBROADCAST__'` = Anzahl Nutzer; Toast „… gesendet".
**Aufräumen (Controller):** `delete from notifications where type='announcement' and title='__TESTBROADCAST__';`

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Ankuendigungs-Composer (Broadcast an Nutzer-Segmente)"
```

---

## Task 3: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In der Sektion `id: "admin"` nach dem letzten Eintrag (`adm_analytics_empty`) ergänzen:
```js
      { id: "adm_broadcast_open", label: "'Ankündigung senden'-Button auf der Übersicht öffnet den Composer" },
      { id: "adm_broadcast_segment", label: "Zielgruppe Alle/Privat/Unternehmen ändert die Live-Empfängerzahl" },
      { id: "adm_broadcast_send", label: "Senden legt In-App-Notifications an; Empfänger sehen sie in der Glocke (Megafon-Icon)" },
      { id: "adm_broadcast_validate", label: "Leeres Titel-/Nachricht-Feld lässt sich nicht senden" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Ankuendigungs-Composer erweitert"
```

---

## Task 4: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1:** Voller Live-Durchlauf: Composer öffnen/schließen, Segmentwechsel ändert Zahl, Validierung (leer → disabled), ein Test-Broadcast an ein kleines Segment → Rows entstehen (SQL) → wieder gelöscht. Keine Konsolenfehler.
- [ ] **Step 2:** Empfänger-Sicht stichprobenartig: eine (nicht gelöschte) Test-Notification kurz in der DB belassen, NotificationBell eines Empfängers prüfen — oder Icon-Mapping per Code bestätigt + Bell rendert `message`/`title`. Danach Test-Rows löschen.
- [ ] **Step 3:** Keine ungewollten `announcement`-Notifications in der DB übrig (`select count(*) from notifications where type='announcement'` = 0, sofern keine echte Ankündigung gewollt). Zeggy-Baseline unverändert.
- [ ] **Step 4:** Finaler Code-Review-Subagent über `git diff <letzter-Analytics-Commit>..HEAD` (Spec-Konformität, tote Symbole, Em-Dash/Emoji-Regel in neuem UI-Text, korrekte notifications-Spalten message/is_read).

---

## Self-Review (Autor)

- **Spec-Abdeckung:** Megafon-Icon → T1. State/Zielliste/Sender/Button/Modal → T2. Beta → T3. Verifizierung/Cleanup/Review → T4. Alle Spec-Punkte abgedeckt. Kein DB-Umbau (INSERT-Policy `true`).
- **Platzhalter:** keine — vollständiger Code je Schritt; Verify mit konkreten Assertions + SQL-Cleanup.
- **Typ-/Namens-Konsistenz:** State `broadcastOpen/bcSegment/bcTitle/bcMessage/bcLink/bcSending` durchgehend gleich; `bcTargets`/`sendBroadcast` genutzt in Button/Modal; Insert nutzt korrekte Spalten `user_id,type,title,message,link,is_read`; `Megaphone` in beiden Dateien importiert; `bcFieldLabel`/`bcInput` modul-level definiert + im Modal genutzt; `colors`/`fonts`/`flash`/`supabase`/`users` vorhanden.
```
