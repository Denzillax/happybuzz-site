# Admin-Übersicht: Gebühren-Karte mit Bezahlt/Offen/Gesamt-Switch

**Datum:** 2026-06-16
**Status:** Design freigegeben, Umsetzung

## Ziel

Die „Gebühren"-Stat-Karte auf der Admin-Übersicht eindeutig machen. Bisher zeigt sie `max(Σ fee_ledger, Σ fee_invoices)` **ohne Status-Filter** (bezahlt + offen vermischt) und daneben eine separate „Bee-Impact"-Karte — was suggeriert, Impact sei additiv (er ist aber 20% *der* Gebühr). Neu: **eine** Karte mit 3-Segment-Switch `Bezahlt · Offen · Gesamt`; Bee-Impact als Unterzeile.

## Festgelegte Entscheidungen (Brainstorming)

1. **Switch** mit drei Stufen `Bezahlt / Offen / Gesamt`, Default **Bezahlt**.
2. Hauptzahl, Label und „davon Bee-Impact"-Unterzeile **folgen der Auswahl**.
3. Separate Bee-Impact-Karte **entfällt** (→ 5 statt 6 Karten).
4. Quelle: **`fee_invoices` nach Status**; `cancelled` ausgeschlossen. Die `max(ledger,invoices)`-Heuristik + die `fee_ledger`-Stats-Abfrage fallen weg.
5. Switch-Zustand lokal auf der Übersicht (kein Reload).

## Ist-Zustand (verifiziert)

- `useAdminData.jsx:77–86`: `feeData` (fee_ledger, alle), `invData` (fee_invoices, alle), `totalFees = Math.max(ledgerFees, invoiceFees)`, `totalImpact = Math.max(ledgerImpact, invoiceImpact)`; `setStats({ …, totalFees, totalImpact, … })`. Kein Status-Filter.
- `STAT_CARDS` (`useAdminData.jsx:668–675`): Eintrag „Gebühren" (`stats.totalFees`) + Eintrag „Bee-Impact" (`stats.totalImpact`).
- Karten-Render (`AdminShell.jsx:134–142`): generisches `STAT_CARDS.map` — Icon, grosser `s.value` (+ optionales inline `s.sub`), darunter `s.label`. `stats` ist in AdminShell destrukturiert.
- Bee-Impact = 20% der Gebühr (CLAUDE.md), in `fee_invoices.total_bee_impact` gespeichert.
- „offen" deckt sich mit `openFeeInvoices` (unbezahlte FEE-Rechnungen) + Mahnungen-Cockpit.

## Umsetzung

### 1. Stat-Summen (`useAdminData.jsx`, Block 77–86)

`invData` um `status` erweitern, vier Summen statt `totalFees/totalImpact`, `fee_ledger`-Abfrage entfernen:

```js
      const { data: invData } = await supabase.from("fee_invoices").select("total_fees, total_bee_impact, status");
      const sumWhere = (pred, field) => (invData || []).filter(pred).reduce((s, f) => s + parseFloat(f[field] || 0), 0);
      const isPaid = (f) => f.status === "paid";
      const isOpen = (f) => f.status !== "paid" && f.status !== "cancelled";
      const feesPaid   = sumWhere(isPaid, "total_fees");
      const feesOpen   = sumWhere(isOpen, "total_fees");
      const impactPaid = sumWhere(isPaid, "total_bee_impact");
      const impactOpen = sumWhere(isOpen, "total_bee_impact");
```
`setStats({ … })` bekommt `feesPaid, feesOpen, impactPaid, impactOpen` statt `totalFees, totalImpact`. Die Zeilen `feeData`/`ledgerFees`/`ledgerImpact`/`invoiceFees`/`invoiceImpact`/`totalFees`/`totalImpact` entfallen.

### 2. STAT_CARDS (`useAdminData.jsx:668–675`)

Die zwei Einträge „Gebühren" + „Bee-Impact" durch **einen** ersetzen (an der bisherigen Gebühren-Position):
```js
    { feeToggle: true, label: "Gebühren", Icon: Receipt, tint: "#D9A005" },
```
(Übrige Karten unverändert: Benutzer, Aktive Inserate, Verkäufe, [feeToggle], Meldungen.)

### 3. Switch-Render (`AdminShell.jsx`, im `STAT_CARDS.map`)

Lokaler State oben in AdminShell: `const [feeView, setFeeView] = useState("paid");`

Im `.map` die feeToggle-Karte gesondert rendern (gleicher Karten-Rahmen):
```jsx
{STAT_CARDS.map((s, i) => {
  if (s.feeToggle) {
    const FEE = { paid: ["Gebühren bezahlt", stats.feesPaid, stats.impactPaid],
                  open: ["Gebühren offen", stats.feesOpen, stats.impactOpen],
                  total: ["Gebühren gesamt", (stats.feesPaid||0)+(stats.feesOpen||0), (stats.impactPaid||0)+(stats.impactOpen||0)] };
    const [feeLabel, feeVal, feeImp] = FEE[feeView];
    return (
      <div key={i} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: s.tint + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Receipt size={17} color={s.tint} /></span>
          <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
            {[["paid","Bezahlt"],["open","Offen"],["total","Gesamt"]].map(([k, lbl]) => (
              <button key={k} onClick={() => setFeeView(k)} style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 999, border: "none", cursor: "pointer", background: feeView === k ? "#fff" : "transparent", color: feeView === k ? colors.dark : colors.muted }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 27, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1.05, marginTop: 13, color: colors.dark }}>CHF {fmtCHF(feeVal || 0)}</div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginTop: 6 }}>{feeLabel}</div>
        <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 8, borderTop: `1px solid ${colors.borderLt}`, paddingTop: 7 }}>davon Bee-Impact CHF {fmtCHF(feeImp || 0)}</div>
      </div>
    );
  }
  return ( /* bestehender generischer Karten-Block, unverändert */ );
})}
```
(`Receipt`, `fmtCHF`, `colors`, `fonts`, `radius` sind in AdminShell vorhanden.)

## Dateien

- **Modify:** `src/components/admin/useAdminData.jsx` (Stat-Summen + STAT_CARDS).
- **Modify:** `src/components/admin/AdminShell.jsx` (`feeView`-State + feeToggle-Karten-Render).
- **Modify:** `src/app/(public)/beta/page.jsx` (Checkliste).
- **Keine DB-Migration.**

## Verifizierung (live als Admin, KEIN `npm run build`)

- Übersicht: eine Gebühren-Karte mit Switch `Bezahlt/Offen/Gesamt`; keine separate Bee-Impact-Karte mehr.
- Switch klicken: Hauptzahl, Label und „davon Bee-Impact" wechseln; „Gesamt" = Bezahlt + Offen.
- Zahlen plausibel gegen `fee_invoices` (bezahlt vs. offen) und konsistent mit „Offene Rechnungen".
- Keine Konsolen-/Overlay-Fehler.

## Beta-Checkliste

- `adm_fee_switch`: Übersicht-Gebühren-Karte hat Bezahlt/Offen/Gesamt-Switch; Hauptzahl + Bee-Impact folgen der Auswahl; keine separate Bee-Impact-Karte.

## Out of Scope

- Noch nicht fakturierte laufende Gebühren (fee_ledger ohne Rechnung) — zählen erst, sobald in einer Monatsrechnung; bewusst (sonst „in Rechnung gestellt" ≠ „aufgelaufen").
- Zeitraum-Filterung der Gebühren (dafür gibt es die Analytik).
