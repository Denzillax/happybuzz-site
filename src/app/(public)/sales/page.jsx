"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMySales } from "@/lib/listings";
import Link from "next/link";
import { Package, Truck, CheckCircle, Clock, CreditCard, Star, X, AlertTriangle, Loader2 } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { colors, fonts, radius } from "@/lib/theme";
import { fmtCHF } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";

import { PURCHASE_STATUS as STATUS_CONFIG } from "@/lib/orderStatus";

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#ECE3D2", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Space Mono', monospace";
const HEAD = "'General Sans','Manrope',sans-serif";

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "open", label: "Offen", match: s => ["confirmed","pending_payment","payment_pending","payment_marked","paid"].includes(s) },
  { key: "shipping", label: "Versendet", match: s => ["shipped","picked_up"].includes(s) },
  { key: "done", label: "Abgeschlossen", match: s => ["delivered","completed"].includes(s) },
];

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { window.location.href = "/login"; return; }
        setSales(await getMySales(session.user.id));
      } catch (err) { console.error(err); toast.error("Verkäufe konnten nicht geladen werden."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  const filtered = sales.filter((s) => {
    if (filter === "all") return true;
    const f = FILTERS.find(f => f.key === filter);
    return f?.match ? f.match(s.status) : true;
  });

  const openCount = sales.filter(s => ["confirmed","pending_payment","payment_pending","payment_marked","paid"].includes(s.status)).length;
  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.price) - parseFloat(s.fee_amount || 0), 0);
  const totalBee = sales.reduce((sum, s) => sum + (parseFloat(s.bee_impact) || 0), 0);

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: K.ink }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Abgegebene Exponate · Katalog der zweiten Leben</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", fontFamily: HEAD, letterSpacing: "-0.01em" }}>Meine Verkäufe</h1>
          <p style={{ fontSize: 13, color: colors.mutedLt, margin: 0 }}>{sales.length} verkauft{openCount > 0 ? ` · ${openCount} offen` : ""}</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "7px 14px", borderRadius: 0, fontSize: 12, fontWeight: filter === f.key ? 800 : 600,
              cursor: "pointer", fontFamily: fonts.body, border: `1px solid ${K.ink}`,
              background: filter === f.key ? K.honey : "#fff", color: K.ink,
            }}>{f.label}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}` }}>
            <Package size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Noch keine Verkäufe</p>
            <p style={{ fontSize: 14, color: colors.muted, margin: "0 0 18px" }}>Stell dein erstes Inserat ein. Gebühr ab 3%, ein Teil geht in den Naturschutz.</p>
            <Link href="/listings/new" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 0, background: K.honey, color: K.ink, fontSize: 14, fontWeight: 800, textDecoration: "none", border: `1px solid ${K.ink}` }}>
              Erstes Inserat erstellen
            </Link>
          </div>
        )}

        {/* Tabelle (Desktop) */}
        {!loading && filtered.length > 0 && (
          <div className="po-table" style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={colHead}>Artikel</th>
                  <th style={colHead}>Verkauft an</th>
                  <th style={colHead}>Lieferung</th>
                  <th style={{ ...colHead, textAlign: "right" }}>Preis</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.confirmed;
                  const StIcon = st.icon;
                  const ref = makeBeeRef(s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = colors.cream}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 10px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 0, border: `1px solid ${K.ink}`, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {s.listingImage ? <img src={s.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
                        </div>
                        <div>
                          <Link href={`/order/${s.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", marginBottom: 2 }}>{s.listingTitle}</Link>
                          <div style={{ fontSize: 11, color: colors.muted }}>{s.listing?.listing_type === "rent" ? "Vermietung" : "Verkauf"}: {ref}</div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600 }}>{s.buyerName}</div>
                        <div style={{ fontSize: 12, color: colors.muted }}>{fmtDate(s.created_at)}</div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        {s.shipping_method && <div>{s.shipping_method}</div>}
                        {parseFloat(s.shipping_cost) > 0 && <div style={{ fontSize: 12, color: colors.muted }}>CHF {fmtCHF(s.shipping_cost)}</div>}
                      </td>
                      <td style={{ padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: 700, fontSize: 15 }}>
                        {fmtCHF(s.price)}
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: st.color, fontSize: 12, fontWeight: 600 }}>
                          <StIcon size={14} /> {st.label}
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle", textAlign: "center" }}>
                        <Link href={`/order/${s.id}`} style={{ color: K.petrol, fontSize: 13, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>Details</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Karten (Mobil): gleiche Daten, untereinander statt breiter Tabelle */}
        {!loading && filtered.length > 0 && (
          <div className="po-cards" style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}` }}>
            {filtered.map(s => {
              const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.confirmed;
              const StIcon = st.icon;
              const ref = makeBeeRef(s.id);
              return (
                <Link key={s.id} href={`/order/${s.id}`} style={{ display: "block", padding: "12px 14px", borderBottom: `1px solid ${colors.borderLt}`, textDecoration: "none", color: colors.dark }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 0, border: `1px solid ${K.ink}`, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.listingImage ? <img src={s.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color={colors.mutedLt} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.listingTitle}</p>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: colors.muted }}>{s.listing?.listing_type === "rent" ? "Vermietung" : "Verkauf"}: {ref} · {fmtDate(s.created_at)}</p>
                      <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>an {s.buyerName}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>CHF {fmtCHF(s.price)}</p>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: st.color, fontSize: 11, fontWeight: 700 }}><StIcon size={12} /> {st.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && sales.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: "16px 20px" }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, letterSpacing: ".12em", textTransform: "uppercase", color: colors.muted, fontWeight: 700 }}>Umsatz (nach Gebühren)</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: HEAD, color: K.ink }}>CHF {fmtCHF(totalRevenue)}</p>
            </div>
            <div style={{ flex: 1, minWidth: 200, background: "#EEF4EC", borderRadius: 0, border: `1px solid ${K.ink}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, letterSpacing: ".12em", textTransform: "uppercase", color: K.moss, fontWeight: 700 }}>Bee-Impact</p>
                <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: HEAD, color: K.moss }}>CHF {fmtCHF(totalBee)}</p>
              </div>
              <BeeIcon size={28} color={K.moss} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
