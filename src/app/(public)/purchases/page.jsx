"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyPurchases } from "@/lib/listings";
import Link from "next/link";
import { ShoppingBag, Package, Clock, CreditCard, Truck, CheckCircle, Star, X, AlertTriangle, Loader2 } from "lucide-react";
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
  { key: "open", label: "Offen", match: s => ["confirmed","pending_payment","payment_pending","payment_marked"].includes(s) },
  { key: "paid", label: "Bezahlt", match: s => s === "paid" },
  { key: "shipping", label: "Unterwegs", match: s => ["shipped","picked_up"].includes(s) },
  { key: "done", label: "Abgeschlossen", match: s => ["delivered","completed"].includes(s) },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { window.location.href = "/login"; return; }
        setPurchases(await getMyPurchases(session.user.id));
      } catch (err) { console.error(err); toast.error("Käufe konnten nicht geladen werden."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  const filtered = purchases.filter((p) => {
    if (filter === "all") return true;
    const f = FILTERS.find(f => f.key === filter);
    return f?.match ? f.match(p.status) : true;
  });

  const openCount = purchases.filter(p => ["confirmed","pending_payment","payment_pending","payment_marked","paid","shipped","picked_up"].includes(p.status)).length;
  const totalBee = purchases.reduce((sum, p) => sum + (parseFloat(p.bee_impact) || 0), 0);

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: K.ink }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Erworbene Exponate · Katalog der zweiten Leben</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", fontFamily: HEAD, letterSpacing: "-0.01em" }}>Meine Käufe</h1>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: 0 }}>{purchases.length} gekauft{openCount > 0 ? ` · ${openCount} offen` : ""}</p>
          </div>
          <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 13, fontWeight: 700, fontFamily: fonts.body, textDecoration: "none" }}>
            Weiter stöbern
          </Link>
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
            <ShoppingBag size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Noch keine Käufe</p>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: "0 0 20px" }}>Finde Schätze auf dem Marktplatz.</p>
            <Link href="/search" style={{ display: "inline-flex", padding: "11px 24px", borderRadius: 0, background: K.honey, color: K.ink, fontSize: 13, fontWeight: 800, textDecoration: "none", border: `1px solid ${K.ink}` }}>Zum Marktplatz</Link>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={colHead}>Artikel</th>
                  <th style={colHead}>Gekauft von</th>
                  <th style={colHead}>Lieferung</th>
                  <th style={{ ...colHead, textAlign: "right" }}>Preis</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.confirmed;
                  const StIcon = st.icon;
                  const total = parseFloat(p.price) + parseFloat(p.shipping_cost || 0);
                  const ref = makeBeeRef(p.id);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = colors.cream}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 10px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 0, border: `1px solid ${K.ink}`, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.listingImage ? <img src={p.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
                        </div>
                        <div>
                          <Link href={`/order/${p.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", marginBottom: 2 }}>{p.listingTitle}</Link>
                          <div style={{ fontSize: 11, color: colors.muted }}>{p.listing?.listing_type === "rent" ? "Miete" : "Kauf"}: {ref}</div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600 }}>{p.sellerName}</div>
                        <div style={{ fontSize: 12, color: colors.muted }}>{fmtDate(p.created_at)}</div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        {p.shipping_method && <div>{p.shipping_method}</div>}
                        {parseFloat(p.shipping_cost) > 0 && <div style={{ fontSize: 12, color: colors.muted }}>CHF {fmtCHF(p.shipping_cost)}</div>}
                      </td>
                      <td style={{ padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: 700, fontSize: 15 }}>
                        {fmtCHF(total)}
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: st.color, fontSize: 12, fontWeight: 600 }}>
                          <StIcon size={14} /> {st.label}
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle", textAlign: "center" }}>
                        <Link href={`/order/${p.id}`} style={{ color: K.petrol, fontSize: 13, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>Details</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bee Impact */}
        {!loading && purchases.length > 0 && (
          <div style={{ marginTop: 20, background: "#EEF4EC", borderRadius: 0, border: `1px solid ${K.ink}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, letterSpacing: ".12em", textTransform: "uppercase", color: K.moss, fontWeight: 700 }}>Dein Bee-Impact</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: HEAD, color: K.moss }}>CHF {fmtCHF(totalBee)}</p>
            </div>
            <BeeIcon size={28} color={K.moss} />
          </div>
        )}
      </div>
    </div>
  );
}
