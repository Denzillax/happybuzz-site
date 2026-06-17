"use client";
import Link from "next/link";
import { Shield, Flag, ChevronDown, ChevronUp, Star } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { TypeBadge } from "@/components/shared/Badge";
import { pill } from "@/components/admin/adminStyles";

export function UsersTab({ admin }) {
  const {
    filteredUsers, flaggedUsers, bannedUsers, userMod, setUserMod, visibleUsers,
    openUser, toggleUser, userListings, userFees, userTab, setUserTab, userInvoices,
    openInvoice, setOpenInvoice, setUsers, flash, toggleBan, toggleListingStatus,
    statusPill, modPill, sc, dunningTimeline, mahnButton, confirmAndReactivate,
    orders, cancelOrder, reviews, deleteReview, emailLog, emailCard, logAdmin,
  } = admin;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: `Alle (${filteredUsers.length})` }, { k: "flagged", l: `Geflaggt (${flaggedUsers.length})` }, { k: "banned", l: `Gesperrt (${bannedUsers.length})` }].map(f => (
          <button key={f.k} onClick={() => setUserMod(f.k)} style={modPill(userMod === f.k)}>{f.l}</button>
        ))}
      </div>

      {visibleUsers.length === 0 && (
        <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>
          {userMod === "flagged" ? "Keine geflaggten Konten." : userMod === "banned" ? "Keine gesperrten Konten." : "Keine Benutzer gefunden."}
        </div>
      )}

      {visibleUsers.map(u => {
        const isOpen = openUser === u.id;
        const uLst = userListings[u.id] || [];
        const uFee = userFees[u.id] || [];
        const totalUserFees = uFee.reduce((s, f) => s + parseFloat(f.fee_amount), 0);
        const totalUserImpact = uFee.reduce((s, f) => s + parseFloat(f.bee_impact), 0);
        const rowTint = u.is_banned ? "#FFF6F6" : ((u.contact_violations || 0) > 0 ? "#FFFBF4" : "transparent");
        return (
          <div key={u.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${u.is_banned ? "#f0c9c9" : colors.border}`, overflow: "hidden" }}>
            {/* User Row */}
            <div onClick={() => toggleUser(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: rowTint }}
              onMouseEnter={e => { if (rowTint === "transparent") e.currentTarget.style.background = "#FAFAF8"; }}
              onMouseLeave={e => { if (rowTint === "transparent") e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.is_banned ? "#EDEDEA" : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: u.is_banned ? "#999" : colors.dark }}>
                {(u.display_name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span>
                  {u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#E6F5F5", color: "#0A7170", fontWeight: 700 }}>ID</span>}
                  {u.id_document_url && !u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#FFF8E1", color: "#E65100", fontWeight: 700 }}>ID?</span>}
                  {u.is_banned && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#EB5E55", color: "#fff", fontWeight: 700 }}>GESPERRT</span>}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{u.city || "—"} · {u.created_at ? fmtDate(u.created_at) : ""}</p>
              </div>
              {(u.contact_violations || 0) > 0 && !u.is_banned && (
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#c0392b", background: "#FFEBEB", padding: "4px 10px", borderRadius: 999 }}>{u.contact_violations}× Kontakt</span>
              )}
              <span className="admin-hide-narrow" style={{ flexShrink: 0 }}>{pill(colors.yellowSoft, colors.dark, u.bee_level || "starter")}</span>
              <span className="admin-hide-narrow" style={{ fontSize: 11, color: "#5B8C5A", fontWeight: 600, minWidth: 64, textAlign: "right" }}>{(u.blueten || 0).toLocaleString("de-CH")}</span>
              <button onClick={(e) => { e.stopPropagation(); toggleBan(u); }} style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff",
                border: `1px solid ${u.is_banned ? "#aed8b0" : "#e6a6a6"}`, color: u.is_banned ? "#2E7D32" : "#c0392b",
              }}>{u.is_banned ? "Entsperren" : "Sperren"}</button>
              {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
            </div>

            {/* User Details — aufgeklappt */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${colors.borderLt}` }}>

                {/* ID-Verifizierung Bar */}
                {(u.id_document_url || u.id_verified) && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                    background: u.id_verified ? "#E8F5E9" : "#FFF8E1",
                    borderBottom: `1px solid ${colors.borderLt}`,
                  }}>
                    <Shield size={16} color={u.id_verified ? "#2E7D32" : "#F4A100"} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: u.id_verified ? "#2E7D32" : "#E65100" }}>
                      {u.id_verified ? "ID verifiziert" : "ID hochgeladen — Prüfung ausstehend"}
                    </span>
                    {u.id_document_url && (
                      <a href={u.id_document_url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "4px 11px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 700, color: colors.dark, textDecoration: "none", cursor: "pointer" }}>
                        Dokument ansehen
                      </a>
                    )}
                    {u.id_document_url && !u.id_verified && (
                      <>
                        <button onClick={async () => {
                          await supabase.from("profiles").update({ id_verified: true }).eq("id", u.id);
                          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_verified: true } : x));
                          flash("ID verifiziert");
                          logAdmin("id_verify", "user", u.display_name);
                        }} style={{ padding: "4px 11px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          Bestätigen
                        </button>
                        <button onClick={async () => {
                          // Datei aus Storage löschen
                          const path = `${u.id}/id-document`;
                          const { data: files } = await supabase.storage.from("id-documents").list(u.id);
                          if (files?.length) await supabase.storage.from("id-documents").remove(files.map(f => `${u.id}/${f.name}`));
                          // Profil zurücksetzen
                          await supabase.from("profiles").update({ id_document_url: null, id_verified: false }).eq("id", u.id);
                          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_document_url: null, id_verified: false } : x));
                          flash("ID abgelehnt — Dokument gelöscht");
                          logAdmin("id_reject", "user", u.display_name);
                        }} style={{ padding: "4px 11px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          Ablehnen
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Moderation: Kontaktverstösse + Sperre */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: u.is_banned ? "#FFF6F6" : "#FAFAF8", borderBottom: `1px solid ${colors.borderLt}` }}>
                  <Flag size={16} color={u.is_banned ? "#c62828" : ((u.contact_violations || 0) > 0 ? "#E65100" : colors.muted)} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: u.is_banned ? "#c62828" : colors.dark }}>
                    {u.is_banned ? "Konto gesperrt — kann nicht handeln oder schreiben" : `${u.contact_violations || 0} Kontaktversuch(e) ausserhalb BEEDARO`}
                  </span>
                  <button onClick={() => toggleBan(u)} style={{ padding: "5px 14px", borderRadius: 999, border: "none", background: u.is_banned ? "#E8F5E9" : "#FFEBEE", color: u.is_banned ? "#2E7D32" : "#c62828", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
                    {u.is_banned ? "Entsperren" : "Konto sperren"}
                  </button>
                </div>

                {/* Tabs: Inserate | Bestellungen | Rechnungen | Bewertungen */}
                <div style={{ display: "flex", borderBottom: `1px solid ${colors.borderLt}` }}>
                  {[{ key: "inserate", label: `Inserate (${uLst.length})` }, { key: "bestellungen", label: "Bestellungen" }, { key: "rechnungen", label: `Rechnungen (${(userInvoices[u.id] || []).length})` }, { key: "bewertungen", label: "Bewertungen" }, { key: "emails", label: "E-Mails" }].map(t => (
                    <button key={t.key} onClick={() => setUserTab(prev => ({ ...prev, [u.id]: t.key }))} style={{
                      flex: 1, padding: "9px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                      fontFamily: fonts.body, background: (userTab[u.id] || "inserate") === t.key ? colors.yellowSoft : "transparent",
                      color: colors.dark, borderBottom: (userTab[u.id] || "inserate") === t.key ? `2px solid ${colors.yellow}` : "2px solid transparent",
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Tab: Inserate */}
                {(userTab[u.id] || "inserate") === "inserate" && (
                  <div style={{ padding: "10px 16px" }}>
                    {uLst.length > 0 ? uLst.map(l => (
                      <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 80px 80px", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                        <Link href={`/listing/${l.id}`} style={{ fontSize: 12, fontWeight: 600, color: colors.dark, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</Link>
                        <div><TypeBadge type={l.listing_type} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right" }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</span>
                        <div style={{ textAlign: "center" }}>{statusPill(l.status)}</div>
                        <div style={{ textAlign: "center" }}>
                          {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Pause</button>}
                          {(l.status === "paused" || l.status === "draft" || l.status === "pending_pause") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Aktiv</button>}
                        </div>
                      </div>
                    )) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Inserate</p>}
                  </div>
                )}

                {/* Tab: Rechnungen */}
                {(userTab[u.id] || "inserate") === "rechnungen" && (
                  <div style={{ padding: "10px 16px" }}>
                    {/* Gebühren-Summary */}
                    {uFee.length > 0 && (
                      <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "8px 10px", background: colors.cream, borderRadius: 8, fontSize: 11 }}>
                        <span>Gebühren: <strong>CHF {fmtCHF(totalUserFees)}</strong></span>
                        <span style={{ color: "#5B8C5A" }}>Bee-Impact: <strong>CHF {fmtCHF(totalUserImpact)}</strong></span>
                        <span style={{ color: colors.muted }}>{uFee.length} Einträge</span>
                      </div>
                    )}

                    {/* Rechnungen als Dropdowns */}
                    {(userInvoices[u.id] || []).length > 0 ? (userInvoices[u.id] || []).map(inv => {
                      const s = sc[inv.status] || sc.open;
                      const rl = inv.reminder_level || 0;
                      const isInvOpen = openInvoice === inv.id;
                      const invFees = uFee.filter(f => f.fee_invoice_id === inv.id);
                      return (
                        <div key={inv.id} style={{ marginBottom: 6, borderRadius: 8, border: `1px solid ${rl >= 2 ? "#FFCDD2" : colors.borderLt}`, overflow: "hidden", background: rl >= 3 ? "#FFF5F5" : "transparent" }}>
                          {/* Invoice Header — klickbar */}
                          <div onClick={() => setOpenInvoice(isInvOpen ? null : inv.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{inv.invoice_ref}</span>
                            {pill(s.bg, s.color, s.label)}
                            {rl > 0 && pill(rl >= 3 ? "#FFEBEE" : "#FFF3E0", rl >= 3 ? "#c62828" : "#E65100", `Stufe ${rl}`)}
                            {inv.listings_paused && pill("#FFEBEE", "#c62828", "Pausiert")}
                            <span style={{ fontSize: 12, fontWeight: 800 }}>CHF {fmtCHF(inv.total_fees)}</span>
                            {isInvOpen ? <ChevronUp size={12} color={colors.muted} /> : <ChevronDown size={12} color={colors.muted} />}
                          </div>

                          {/* Invoice Detail — aufgeklappt */}
                          {isInvOpen && (
                            <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: "8px 10px" }}>
                              {/* Positionen */}
                              {invFees.map(f => (
                                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: `1px solid ${colors.borderLt}` }}>
                                  <span>{fmtDate(f.created_at)} · {f.listing_title}</span>
                                  <span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, color: "#5B8C5A" }}>
                                <span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span>
                              </div>

                              {/* Aktionen */}
                                {dunningTimeline(inv)}
                                {inv.status !== "paid" ? (
                                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                    {mahnButton({ ...inv, sellerName: u.display_name })}
                                    <button onClick={() => confirmAndReactivate(inv.id, u.id)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                                  </div>
                                ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                            </div>
                          )}
                        </div>
                      );
                    }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Rechnungen</p>}
                  </div>
                )}

                {/* Sub-Tab: Bestellungen */}
                {(userTab[u.id] || "inserate") === "bestellungen" && (
                  <div style={{ padding: "10px 16px" }}>
                    {orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id).length > 0 ? orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id).map(o => {
                      const ref = `BEE-${(o.id || "").substring(0, 8).toUpperCase()}`;
                      const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
                      const role = o.seller_id === u.id ? "Verkäufer" : "Käufer";
                      const other = o.seller_id === u.id ? o.buyerName : o.sellerName;
                      const st = o.status === "confirmed" ? pill("#E8F5E9", "#2E7D32", "Bestätigt") : o.status === "cancelled" ? pill("#FFEBEE", "#c62828", "Storniert") : pill("#f5f5f5", "#666", o.status || "—");
                      return (
                        <div key={o.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 80px 70px", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: `1px solid ${colors.borderLt}`, opacity: o.status === "cancelled" ? 0.5 : 1 }}>
                          <span style={{ fontSize: 10, color: colors.muted }}>{ref}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle} <span style={{ fontWeight: 400, color: colors.muted }}>({role} → {other})</span></span>
                          <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right" }}>CHF {fmtCHF(total)}</span>
                          <div style={{ textAlign: "center" }}>{st}</div>
                          <div style={{ textAlign: "center" }}>
                            {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Storno</button>}
                          </div>
                        </div>
                      );
                    }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bestellungen</p>}
                  </div>
                )}

                {/* Sub-Tab: Bewertungen */}
                {(userTab[u.id] || "inserate") === "bewertungen" && (
                  <div style={{ padding: "10px 16px" }}>
                    {reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).length > 0 ? reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id).map(r => {
                      const dir = r.rater_id === u.id ? `an ${r.revieweeName}` : `von ${r.reviewerName}`;
                      return (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                          <span style={{ display: "inline-flex", gap: 1, minWidth: 70 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} color="#F4C03F" fill={n <= (r.rating || 0) ? "#F4C03F" : "none"} />)}</span>
                          <span style={{ fontSize: 11, color: colors.muted, minWidth: 80 }}>{dir}</span>
                          <span style={{ flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment || r.text || "—"}</span>
                          <span style={{ fontSize: 10, color: colors.muted }}>{fmtDate(r.created_at)}</span>
                          <button onClick={() => { if (confirm("Bewertung löschen?")) deleteReview(r.id); }} style={{ padding: "3px 8px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Löschen</button>
                        </div>
                      );
                    }) : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine Bewertungen</p>}
                  </div>
                )}

                {/* Sub-Tab: E-Mails */}
                {(userTab[u.id] || "inserate") === "emails" && (
                  <div style={{ padding: "10px 16px" }}>
                    {emailLog.filter(e => e.recipient_id === u.id).length > 0
                      ? emailLog.filter(e => e.recipient_id === u.id).map(e => emailCard(e))
                      : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine E-Mails an diesen Nutzer</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
