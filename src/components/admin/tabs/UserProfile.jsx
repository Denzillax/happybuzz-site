"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, ChevronDown, ChevronUp, Star, Clock } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";
import { TypeBadge } from "@/components/shared/Badge";
import { AUDIT_META } from "@/components/admin/tabs/AuditTab";

export function UserProfile({ admin }) {
  const {
    users, openProfile, closeProfile, toggleBan, setUsers, flash, logAdmin,
    userNote, saveUserNote, profileAudit,
    userListings, userFees, userInvoices, userTab, setUserTab, openInvoice, setOpenInvoice,
    orders, reviews, emailLog, statusPill, orderStatusPill, toggleListingStatus, cancelOrder, deleteReview,
    sc, dunningTimeline, mahnButton, confirmAndReactivate, emailCard,
    setBetaAccess,
  } = admin;
  const u = users.find(x => x.id === openProfile);
  const [note, setNote] = useState(userNote);
  if (!u) return null;

  const uLst = userListings[u.id] || [];
  const uFee = userFees[u.id] || [];
  const totalUserFees = uFee.reduce((s, f) => s + parseFloat(f.fee_amount), 0);
  const totalUserImpact = uFee.reduce((s, f) => s + parseFloat(f.bee_impact), 0);
  const uOrders = orders.filter(o => o.buyer_id === u.id || o.seller_id === u.id);
  const uReviews = reviews.filter(r => r.rater_id === u.id || r.rated_id === u.id);
  const uEmails = emailLog.filter(e => e.recipient_id === u.id);
  const sales = uOrders.filter(o => o.seller_id === u.id && o.status !== "cancelled");
  const purchases = uOrders.filter(o => o.buyer_id === u.id && o.status !== "cancelled");
  const revenue = sales.reduce((s, o) => s + parseFloat(o.price || 0), 0);
  const openFees = (userInvoices[u.id] || []).filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.total_fees || 0), 0);
  const viol = u.contact_violations || 0;
  const hasUnpaid = (userInvoices[u.id] || []).some(i => i.status !== "paid");
  const risk = (u.is_banned || viol >= 3 || openFees > 0)
    ? { c: "#EB5E55", l: "Hoch", why: u.is_banned ? "Konto gesperrt" : openFees > 0 ? "offene Gebühren" : "≥3 Verstösse" }
    : (viol >= 1 || hasUnpaid)
    ? { c: "#E5A100", l: "Mittel", why: viol >= 1 ? `${viol} Verstoss/Verstösse` : "unbezahlte Rechnung" }
    : { c: colors.green, l: "Niedrig", why: "keine Auffälligkeiten" };

  const KPI = (label, value, sub) => (
    <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", minWidth: 130, flex: "1 1 130px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, marginTop: 4 }}>{value}{sub && <span style={{ fontSize: 11, fontWeight: 600, color: colors.muted }}> {sub}</span>}</div>
    </div>
  );

  return (
    <div>
      {/* Kopf */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button onClick={closeProfile} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: colors.cream, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, color: colors.dark }}><ArrowLeft size={15} /> Zurück</button>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.is_banned ? "#EDEDEA" : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: u.is_banned ? "#999" : colors.dark }}>{(u.display_name || "?")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head }}>{u.display_name || "—"} <span style={{ fontSize: 13, fontWeight: 400, color: colors.muted }}>@{u.username || "—"}</span></div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {u.is_banned ? pill("#EB5E55", "#fff", "Gesperrt") : pill("#E8F5E9", "#2E7D32", "Aktiv")}
            {u.beta_access ? pill("#FBF1D2", "#C8860A", "Beta-Zugang") : null}
            {u.id_verified ? pill("#E6F5F5", "#0A7170", "ID verifiziert") : u.id_document_url ? pill("#FFF8E1", "#E65100", "ID ausstehend") : null}
            {pill(colors.cream, colors.dark, u.account_type === "business" ? "Unternehmen" : "Privat")}
          </div>
        </div>
        {/* Beta-Freigabe: steuert den Zutritt im SiteGate-Modus 'beta' */}
        <button onClick={() => setBetaAccess(u.id, u.display_name || u.username || "Konto", !u.beta_access)}
          style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff", border: `1px solid ${u.beta_access ? "#E5C868" : "#C8860A55"}`, color: "#C8860A" }}>
          {u.beta_access ? "Beta-Zugang entziehen" : "Beta-Zugang erteilen"}
        </button>
        <button onClick={() => toggleBan(u)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff", border: `1px solid ${u.is_banned ? "#aed8b0" : "#e6a6a6"}`, color: u.is_banned ? "#2E7D32" : "#c0392b" }}>{u.is_banned ? "Entsperren" : "Konto sperren"}</button>
      </div>

      {/* ID-Prüfung (falls Dokument + nicht verifiziert) */}
      {u.id_document_url && !u.id_verified && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FFF8E1", borderRadius: radius.lg, marginBottom: 14, flexWrap: "wrap" }}>
          <Shield size={16} color="#F4A100" />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#E65100" }}>ID hochgeladen — Prüfung ausstehend</span>
          <a href={u.id_document_url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>Dokument ansehen</a>
          <button onClick={async () => {
            await supabase.from("profiles").update({ id_verified: true }).eq("id", u.id);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_verified: true } : x));
            flash("ID verifiziert");
            logAdmin("id_verify", "user", u.display_name);
          }} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Bestätigen</button>
          <button onClick={async () => {
            const { data: files } = await supabase.storage.from("id-documents").list(u.id);
            if (files?.length) await supabase.storage.from("id-documents").remove(files.map(f => `${u.id}/${f.name}`));
            await supabase.from("profiles").update({ id_document_url: null, id_verified: false }).eq("id", u.id);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, id_document_url: null, id_verified: false } : x));
            flash("ID abgelehnt — Dokument gelöscht");
            logAdmin("id_reject", "user", u.display_name);
          }} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Ablehnen</button>
        </div>
      )}

      {/* Kennzahlen-Kopf */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {KPI("Mitglied seit", u.created_at ? fmtDate(u.created_at) : "—")}
        {KPI("Bee-Level", u.bee_level || "starter", `· ${(u.blueten || 0).toLocaleString("de-CH")} Blüten`)}
        {KPI("Käufe / Verkäufe", `${purchases.length} / ${sales.length}`)}
        {KPI("Umsatz", `CHF ${fmtCHF(revenue)}`)}
        {KPI("Offene Gebühren", `CHF ${fmtCHF(openFees)}`)}
        {KPI("Kontaktverstösse", viol)}
      </div>

      {/* Risiko-Ampel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#fff", border: `1px solid ${risk.c}55`, borderRadius: radius.lg, marginBottom: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: risk.c, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: risk.c }}>Risiko: {risk.l}</span>
        <span style={{ fontSize: 12, color: colors.muted }}>· {risk.why}</span>
      </div>

      {/* Admin-Notiz */}
      <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 6 }}>Admin-Notiz <span style={{ textTransform: "none", fontWeight: 400 }}>· nur für dich sichtbar</span></div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Interne Notiz zu diesem Nutzer…" style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: 0, padding: "8px 10px", fontSize: 13, fontFamily: fonts.body, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        <button onClick={() => saveUserNote(u.id, note)} style={{ marginTop: 8, padding: "7px 16px", borderRadius: 999, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
      </div>

      {/* Aktions-/Sperrhistorie */}
      <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 8 }}>Aktions-/Sperrhistorie</div>
        {profileAudit.length === 0 ? <div style={{ fontSize: 12, color: colors.muted }}>Keine Aktionen protokolliert.</div> : profileAudit.map(a => {
          const meta = AUDIT_META[a.action] || { label: a.action, Icon: Clock, color: colors.muted, bg: colors.cream };
          const Icon = meta.Icon;
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
              <span style={{ width: 28, height: 28, borderRadius: 0, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={14} color={meta.color} /></span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: colors.muted }}>{a.created_at ? fmtDate(a.created_at) : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Sub-Daten */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {/* Sub-Tabs mit Zählern auf allen Reitern */}
        <div style={{ display: "flex", borderBottom: `1px solid ${colors.borderLt}`, background: "#FCFBF9" }}>
          {[
            { key: "inserate", label: "Inserate", n: uLst.length },
            { key: "bestellungen", label: "Bestellungen", n: uOrders.length },
            { key: "rechnungen", label: "Rechnungen", n: (userInvoices[u.id] || []).length },
            { key: "bewertungen", label: "Bewertungen", n: uReviews.length },
            { key: "emails", label: "E-Mails", n: uEmails.length },
          ].map(t => {
            const on = (userTab[u.id] || "inserate") === t.key;
            return (
              <button key={t.key} onClick={() => setUserTab(prev => ({ ...prev, [u.id]: t.key }))} style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "13px 8px", fontSize: 12.5, fontWeight: on ? 700 : 600, border: "none", cursor: "pointer",
                fontFamily: fonts.body, background: on ? "#fff" : "transparent", color: on ? colors.dark : colors.muted,
                borderBottom: on ? `2.5px solid ${colors.yellow}` : "2.5px solid transparent", transition: "color .12s, background .12s",
              }}>
                {t.label}
                {t.n > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1, padding: "2px 7px", borderRadius: 999, background: on ? colors.yellowSoft : "#ECE9E3", color: on ? "#8a6d00" : colors.muted }}>{t.n}</span>}
              </button>
            );
          })}
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
            {uFee.length > 0 && (
              <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "8px 10px", background: colors.cream, borderRadius: 0, fontSize: 11 }}>
                <span>Gebühren: <strong>CHF {fmtCHF(totalUserFees)}</strong></span>
                <span style={{ color: "#5B8C5A" }}>Bee-Impact: <strong>CHF {fmtCHF(totalUserImpact)}</strong></span>
                <span style={{ color: colors.muted }}>{uFee.length} Einträge</span>
              </div>
            )}
            {(userInvoices[u.id] || []).length > 0 ? (userInvoices[u.id] || []).map(inv => {
              const s = sc[inv.status] || sc.open;
              const rl = inv.reminder_level || 0;
              const isInvOpen = openInvoice === inv.id;
              const invFees = uFee.filter(f => f.fee_invoice_id === inv.id);
              return (
                <div key={inv.id} style={{ marginBottom: 6, borderRadius: 0, border: `1px solid ${rl >= 2 ? "#FFCDD2" : colors.borderLt}`, overflow: "hidden", background: rl >= 3 ? "#FFF5F5" : "transparent" }}>
                  <div onClick={() => setOpenInvoice(isInvOpen ? null : inv.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{inv.invoice_ref}</span>
                    {pill(s.bg, s.color, s.label)}
                    {rl > 0 && pill(rl >= 3 ? "#FFEBEE" : "#FFF3E0", rl >= 3 ? "#c62828" : "#E65100", `Stufe ${rl}`)}
                    {inv.listings_paused && pill("#FFEBEE", "#c62828", "Pausiert")}
                    <span style={{ fontSize: 12, fontWeight: 800 }}>CHF {fmtCHF(inv.total_fees)}</span>
                    {isInvOpen ? <ChevronUp size={12} color={colors.muted} /> : <ChevronDown size={12} color={colors.muted} />}
                  </div>
                  {isInvOpen && (
                    <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: "8px 10px" }}>
                      {invFees.map(f => (
                        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: `1px solid ${colors.borderLt}` }}>
                          <span>{fmtDate(f.created_at)} · {f.listing_title}</span>
                          <span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, color: "#5B8C5A" }}>
                        <span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span>
                      </div>
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
            {uOrders.length > 0 ? uOrders.map(o => {
              const ref = `BEE-${(o.id || "").substring(0, 8).toUpperCase()}`;
              const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
              const role = o.seller_id === u.id ? "Verkäufer" : "Käufer";
              const other = o.seller_id === u.id ? o.buyerName : o.sellerName;
              // Gleiche Status-Uebersetzung wie der Bestellungen-Tab — nie rohe DB-Werte
              const st = orderStatusPill(o.status);
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
            {uReviews.length > 0 ? uReviews.map(r => {
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
            {uEmails.length > 0
              ? uEmails.map(e => emailCard(e))
              : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine E-Mails an diesen Nutzer</p>}
          </div>
        )}
      </div>
    </div>
  );
}
