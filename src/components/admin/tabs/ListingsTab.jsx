"use client";
import { useState } from "react";
import Link from "next/link";
import { Play, Pause, Eye, CheckCircle, XCircle } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, radius, fonts } from "@/lib/theme";
import { makeArtRef } from "@/lib/fees";
import { TypeBadge } from "@/components/shared/Badge";
import { th, td, useSort, SortTh, listingPriceText, listingPriceValue } from "@/components/admin/adminStyles";

// Status-Aktionsknoepfe (Freigeben/Ablehnen/Pause/Aktiv) — Tabelle + Karten
// Ergebnis der KI-Vorpruefung (Denis 17.09.): kompakter Chip neben der
// Artikelnummer, Details erst beim Hover/Klick als Kaertchen (sonst sprengt
// der Text die Zeile).
function KiBegruendung({ l }) {
  // Die Titelzelle hat overflow:hidden (Ellipsis), darum liegt das Kaertchen
  // als position:fixed am Chip statt im Zellenfluss, sonst wird es abgeschnitten.
  const [offen, setOffen] = useState(null); // {left, top} oder null
  const oeffnen = (e) => { const r = e.currentTarget.getBoundingClientRect(); setOffen({ left: Math.min(r.left, window.innerWidth - 360), top: r.bottom + 4 }); };
  const ai = l.review_ai;
  const blocker = Array.isArray(ai?.blocker) ? ai.blocker : [];
  const hinweise = Array.isArray(ai?.hinweise) ? ai.hinweise : [];
  const art = !ai ? "ausstehend" : blocker.length ? "blocker" : hinweise.length ? "hinweis" : "ok";
  const chip = {
    ausstehend: { text: "KI ausstehend", bg: "#F2EEE7", fg: "#8A8580" },
    blocker: { text: `KI · ${blocker.length} Blocker`, bg: "#FFEBEE", fg: "#c62828" },
    hinweis: { text: `KI · ${hinweise.length} ${hinweise.length === 1 ? "Hinweis" : "Hinweise"}`, bg: "#F2EEE7", fg: "#5F5A55" },
    ok: { text: "KI ✓ unauffällig", bg: "#E8F5E9", fg: "#2E7D32" },
  }[art];
  const hatDetails = !!ai;
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6, verticalAlign: "middle" }}
      onMouseEnter={(e) => hatDetails && oeffnen(e)} onMouseLeave={() => setOffen(null)}>
      <button type="button" onClick={(e) => { if (!hatDetails) return; offen ? setOffen(null) : oeffnen(e); }}
        style={{ padding: "1px 8px", borderRadius: 999, border: "none", background: chip.bg, color: chip.fg, fontSize: 9.5, fontWeight: 800, fontFamily: "inherit", cursor: hatDetails ? "pointer" : "default", letterSpacing: ".02em", whiteSpace: "nowrap" }}>
        {chip.text}
      </button>
      {offen && hatDetails && (
        <span style={{ position: "fixed", left: offen.left, top: offen.top, zIndex: 1000, minWidth: 260, maxWidth: 340, background: "#fff", border: "1px solid #E4E0D8", borderRadius: 12, boxShadow: "0 6px 20px rgba(25,22,21,.14)", padding: "10px 12px", fontSize: 11.5, lineHeight: 1.4, whiteSpace: "normal", fontWeight: 500, textAlign: "left" }}>
          <span style={{ display: "block", fontWeight: 800, color: "#666", marginBottom: 4 }}>
            {ai.vertrauen === "bewaehrt" ? "Bewährter Verkäufer" : "Neues Konto"}{ai.bilder_geprueft === false ? " · Bilder nicht geprüft" : ""}{ai.geprueft_am ? ` · ${new Date(ai.geprueft_am).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
          {blocker.map((b, i) => <span key={"b" + i} style={{ display: "block", color: "#c62828", fontWeight: 700 }}>Blocker: {b.grund || b.code}</span>)}
          {hinweise.map((h, i) => <span key={"h" + i} style={{ display: "block", color: "#5F5A55" }}>Hinweis: {h.tipp || h.code}{h.vorschlag ? ` (${h.vorschlag})` : ""}</span>)}
          {blocker.length === 0 && hinweise.length === 0 && <span style={{ display: "block", color: "#2E7D32" }}>Keine Auffälligkeiten.</span>}
          {l.review_hold_reason && l.status === "pending_review" && <span style={{ display: "block", color: "#8a6d00", fontWeight: 700, marginTop: 4 }}>Wartet: {l.review_hold_reason}</span>}
        </span>
      )}
    </span>
  );
}

function StatusActions({ l, approveListing, rejectListing, toggleListingStatus }) {
  return (
    <>
      {l.status === "pending_review" && (
        <>
          <button onClick={() => approveListing(l.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><CheckCircle size={10} /> Freigeben</button>
          <button onClick={() => { const r = window.prompt("Ablehngrund (wird dem Verkäufer angezeigt):"); if (r && r.trim()) rejectListing(l.id, r.trim()); }} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><XCircle size={10} /> Ablehnen</button>
        </>
      )}
      {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Pause size={10} /> Pause</button>}
      {(l.status === "paused" || l.status === "draft") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Play size={10} /> Aktiv</button>}
    </>
  );
}

export function ListingsTab({ admin }) {
  const { visibleListings, listingMod, setListingMod, pendingListings, autoListings = [], approveListing, rejectListing, statusPill, toggleListingStatus, modPill } = admin;
  const rows = listingMod === "pending" ? pendingListings
    : listingMod === "auto" ? autoListings
    : listingMod === "all" ? visibleListings
    : visibleListings.filter(l => l.status === listingMod);

  // Sortierung: Standard = Originalreihenfolge (neuste zuerst)
  const sort = useSort(rows, (l, key) => {
    if (key === "title") return l.title || "";
    if (key === "seller") return l.sellerName || "";
    if (key === "type") return l.listing_type || "";
    if (key === "price") return listingPriceValue(l);
    if (key === "status") return l.status || "";
    if (key === "date") return l.created_at || "";
    return null;
  });

  const actionProps = { approveListing, rejectListing, toggleListingStatus };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { k: "all", l: `Alle (${visibleListings.length})` },
          { k: "pending", l: `Wartet auf Freigabe (${pendingListings.length})` },
          { k: "auto", l: `Automatisch freigegeben, 7 Tage (${autoListings.length})` },
          { k: "scheduled", l: `Geplant (${visibleListings.filter(l => l.status === "scheduled").length})` },
          { k: "active", l: "Aktiv" },
          { k: "paused", l: "Pausiert" },
        ].map(f => (
          <button key={f.k} onClick={() => setListingMod(f.k)} style={modPill(listingMod === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {sort.sorted.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>
            {listingMod === "pending" ? "Keine Inserate warten auf Freigabe." : "Keine Inserate gefunden."}
          </div>
        ) : (
        <>
        {/* Desktop: sortierbare Tabelle */}
        <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <SortTh label="Titel" k="title" sort={sort} />
            <SortTh label="Verkäufer" k="seller" sort={sort} />
            <SortTh label="Typ" k="type" sort={sort} />
            <SortTh label="Preis" k="price" sort={sort} align="right" />
            <SortTh label="Datum" k="date" sort={sort} />
            <SortTh label="Status" k="status" sort={sort} align="center" />
            <th style={{ ...th, textAlign: "center" }}>Aktionen</th>
          </tr></thead>
          <tbody>
            {sort.sorted.map(l => (
              <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                <td style={{ ...td, fontWeight: 600, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                  <span style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: colors.muted, fontWeight: 500 }}>{makeArtRef(l.id)}{l.status === "pending_review" && l.submitted_at ? ` · seit ${new Date(l.submitted_at).toLocaleDateString("de-CH")}` : ""}{(l.status === "pending_review" || l.review_source === "auto") && <KiBegruendung l={l} />}</span>
                  {l.publish_at && ["pending_review", "scheduled"].includes(l.status) && (
                    <span style={{ display: "block", fontSize: 10, color: "#0B5E5C", fontWeight: 700 }}>
                      Geplant für {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </span>
                  )}
                </td>
                <td style={{ ...td, color: colors.muted }}>{l.sellerName}</td>
                <td style={td}><TypeBadge type={l.listing_type} /></td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{listingPriceText(l)}</td>
                <td style={{ ...td, color: colors.muted, whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                <td style={{ ...td, textAlign: "center" }}>{statusPill(l.status)}</td>
                {/* Feste Flucht: Statusknoepfe links, Auge IMMER ganz rechts */}
                <td style={{ ...td }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 34px", alignItems: "center", gap: 4, minWidth: 170 }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <StatusActions l={l} {...actionProps} />
                    </div>
                    <Link href={`/listing/${l.id}`} style={{ padding: "4px 0", borderRadius: 999, background: colors.warm, color: colors.muted, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobil: Karten */}
        <div className="po-cards">
          {sort.sorted.map(l => (
            <div key={l.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${colors.borderLt}`, fontFamily: fonts.body }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/listing/${l.id}`} style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</Link>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: colors.muted }}>{makeArtRef(l.id)} · {fmtDate(l.created_at)}</span>
                  {l.publish_at && ["pending_review", "scheduled"].includes(l.status) && (
                    <span style={{ display: "block", fontSize: 10, color: "#0B5E5C", fontWeight: 700 }}>
                      Geplant für {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </span>
                  )}
                </div>
                {statusPill(l.status)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <TypeBadge type={l.listing_type} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{listingPriceText(l)}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{l.sellerName}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                <StatusActions l={l} {...actionProps} />
                <Link href={`/listing/${l.id}`} style={{ padding: "4px 10px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><Eye size={10} /> Ansehen</Link>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
