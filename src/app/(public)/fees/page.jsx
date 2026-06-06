"use client";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Receipt, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Printer } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { Logo } from "@/components/shared/Logo";
import { colors, fonts, radius } from "@/lib/theme";

const th = { padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" };
const td = { padding: "10px 14px", fontSize: 12 };

export default function FeesPage() {
  const [user, setUser] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");
  const [openInvoice, setOpenInvoice] = useState(null);
  const [toast, setToast] = useState("");

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };
  const copy = (t) => { navigator.clipboard.writeText(t); flash("Kopiert"); };

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { window.location.href = "/login"; return; }
      setUser(u);

      const { data: fees } = await supabase.from("fee_ledger").select("*").eq("seller_id", u.id).order("created_at", { ascending: false });
      setLedger(fees || []);

      // Auto-Monatsrechnung für vergangene Monate
      const now = new Date();
      const months = [...new Set((fees || []).filter(f => f.status === "pending").map(f => {
        const d = new Date(f.created_at);
        return `${d.getFullYear()}-${d.getMonth() + 1}`;
      }))];
      for (const m of months) {
        const [y, mo] = m.split("-").map(Number);
        if (y < now.getFullYear() || (y === now.getFullYear() && mo < now.getMonth() + 1)) {
          await supabase.rpc("create_monthly_fee_invoice", { p_seller_id: u.id, p_month: mo, p_year: y });
        }
      }

      const { data: invs } = await supabase.from("fee_invoices").select("*").eq("seller_id", u.id).order("created_at", { ascending: false });
      setInvoices(invs || []);
      const { data: fees2 } = await supabase.from("fee_ledger").select("*").eq("seller_id", u.id).order("created_at", { ascending: false });
      setLedger(fees2 || []);
      setLoading(false);
    }
    load();
  }, []);

  const pendingFees = ledger.filter(f => f.status === "pending");
  const totalPending = pendingFees.reduce((s, f) => s + parseFloat(f.fee_amount), 0);
  const totalPendingImpact = pendingFees.reduce((s, f) => s + parseFloat(f.bee_impact), 0);
  const totalBeeImpact = ledger.reduce((s, f) => s + parseFloat(f.bee_impact), 0);

  const handleMarkPaid = async (invoiceId) => {
    await supabase.from("fee_invoices").update({ status: "pending_payment" }).eq("id", invoiceId);
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: "pending_payment" } : i));
  };

  const sc = { open: { icon: Clock, color: "#E65100", bg: "#FFF3E0", label: "Offen" }, pending_payment: { icon: AlertCircle, color: "#1565C0", bg: "#E3F2FD", label: "Gemeldet" }, paid: { icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9", label: "Bezahlt" }, overdue: { icon: AlertCircle, color: "#c62828", bg: "#FFEBEE", label: "Überfällig" } };
  const beedaroIban = "CH12 3456 7890 1234 5678 9";

  // Tabelle rendern (shared zwischen Tabs)
  const FeeTable = ({ fees, showStatus }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.body }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
          <th style={{ ...th, textAlign: "left" }}>Datum</th>
          <th style={{ ...th, textAlign: "left" }}>Artikel</th>
          <th style={{ ...th, textAlign: "right" }}>Verkaufspreis</th>
          <th style={{ ...th, textAlign: "center" }}>Gebühr %</th>
          <th style={{ ...th, textAlign: "right" }}>Gebühr</th>
          <th style={{ ...th, textAlign: "right" }}>Bee-Impact</th>
          {showStatus && <th style={{ ...th, textAlign: "center" }}>Status</th>}
        </tr>
      </thead>
      <tbody>
        {fees.map(f => {
          const st = f.status === "paid" ? { color: "#2E7D32", bg: "#E8F5E9", label: "Bezahlt" } : f.status === "invoiced" ? { color: "#E65100", bg: "#FFF3E0", label: "Rechnung" } : { color: colors.muted, bg: colors.warm, label: "Offen" };
          return (
            <tr key={f.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
              <td style={{ ...td }}>{fmtDate(f.created_at)}</td>
              <td style={{ ...td, fontWeight: 600 }}>{f.listing_title}</td>
              <td style={{ ...td, textAlign: "right" }}>CHF {fmtCHF(f.sale_price)}</td>
              <td style={{ ...td, textAlign: "center", color: colors.muted }}>{parseFloat(f.fee_percent)}%</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>CHF {fmtCHF(f.fee_amount)}</td>
              <td style={{ ...td, textAlign: "right", color: "#5B8C5A" }}>CHF {fmtCHF(f.bee_impact)}</td>
              {showStatus && <td style={{ ...td, textAlign: "center" }}><span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span></td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade...</div>;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: fonts.head, margin: "0 0 4px" }}>GEBÜHREN & BEITRÄGE</h1>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: colors.muted }}>Übersicht deiner Plattformgebühren und Bee-Impact Beiträge</p>

        {/* Warn-Banner für überfällige Rechnungen */}
        {invoices.some(i => i.status === "overdue" && i.reminder_level >= 3 && i.listings_paused) && (
          <div style={{ padding: "14px 20px", marginBottom: 16, borderRadius: radius.lg, background: "#FFF5F5", border: "1.5px solid #FFCDD2", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertCircle size={20} color="#c62828" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#c62828" }}>Inserate pausiert — offene Rechnung begleichen</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>Nach Zahlung werden deine Inserate automatisch reaktiviert.</p>
            </div>
          </div>
        )}
        {invoices.some(i => i.status === "overdue" && i.reminder_level === 2) && (
          <div style={{ padding: "14px 20px", marginBottom: 16, borderRadius: radius.lg, background: "#FFF8E1", border: "1.5px solid #FFE082", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertCircle size={20} color="#E65100" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#E65100" }}>Mahnung — Inserate werden bald pausiert</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>Bitte begleiche deine offene Gebührenrechnung.</p>
            </div>
          </div>
        )}
        {invoices.some(i => i.status === "overdue" && i.reminder_level === 1) && (
          <div style={{ padding: "14px 20px", marginBottom: 16, borderRadius: radius.lg, background: "#FFF3E0", border: "1.5px solid #FFCC80", display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={20} color="#E65100" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#E65100" }}>Erinnerung — Gebührenrechnung überfällig</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>Bitte überweise den offenen Betrag.</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: 10, color: colors.muted, fontWeight: 700, textTransform: "uppercase" }}>Offene Gebühren</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800 }}>CHF {fmtCHF(totalPending)}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{pendingFees.length} Verkäufe</p>
          </div>
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: 10, color: colors.muted, fontWeight: 700, textTransform: "uppercase" }}>Rechnungen</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800 }}>{invoices.length}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{invoices.filter(i => i.status === "open").length} offen</p>
          </div>
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#5B8C5A", fontWeight: 700, textTransform: "uppercase" }}>Bee-Impact Total</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#5B8C5A" }}>CHF {fmtCHF(totalBeeImpact)}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>für Schweizer Naturschutz</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden", width: "fit-content" }}>
          {[{ key: "open", label: `Offen (${pendingFees.length})` }, { key: "invoices", label: `Rechnungen (${invoices.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: fonts.body, background: tab === t.key ? colors.yellow : "transparent", color: colors.dark }}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Offene Gebühren */}
        {tab === "open" && (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {pendingFees.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <CheckCircle size={32} color={colors.green} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Keine offenen Gebühren</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}><FeeTable fees={pendingFees} showStatus={false} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: `2px solid ${colors.border}` }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Total: CHF {fmtCHF(totalPending)}</span>
                    <span style={{ fontSize: 11, color: "#5B8C5A", marginLeft: 12 }}>davon CHF {fmtCHF(totalPendingImpact)} Bee-Impact</span>
                  </div>
                </div>
                <p style={{ margin: 0, padding: "8px 14px 12px", fontSize: 11, color: colors.muted }}>
                  Sammelrechnung wird am 1. des nächsten Monats automatisch erstellt.
                </p>
              </>
            )}
          </div>
        )}

        {/* Tab: Rechnungen */}
        {tab === "invoices" && (
          <div>
            {invoices.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                <Receipt size={32} color={colors.mutedLt} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Noch keine Rechnungen</p>
              </div>
            ) : invoices.map(inv => {
              const s = sc[inv.status] || sc.open;
              const isOpen = openInvoice === inv.id;
              const invFees = ledger.filter(f => f.fee_invoice_id === inv.id);
              const monthName = new Date(inv.period_year, inv.period_month - 1).toLocaleString("de-CH", { month: "long", year: "numeric" });
              return (
                <div key={inv.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                  <div onClick={() => setOpenInvoice(isOpen ? null : inv.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                    <s.icon size={18} color={s.color} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{monthName}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{inv.invoice_ref} · {inv.item_count} Verkäufe · Fällig {fmtDate(inv.due_date)}</p>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>CHF {fmtCHF(inv.total_fees)}</p>
                    {isOpen ? <ChevronUp size={14} color={colors.muted} /> : <ChevronDown size={14} color={colors.muted} />}
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${colors.borderLt}` }}>
                      <div style={{ overflowX: "auto" }}><FeeTable fees={invFees} showStatus={false} /></div>

                      {/* Total */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderTop: `2px solid ${colors.border}`, fontWeight: 800, fontSize: 13 }}>
                        <span>Total</span>
                        <span>CHF {fmtCHF(inv.total_fees)}</span>
                      </div>

                      {/* Zahlungsinfos — Einzahlungsschein mit QR */}
                      <div style={{ padding: "14px 16px", background: colors.surface, borderTop: `1px solid ${colors.borderLt}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                          {/* Beige Box */}
                          <div style={{ background: colors.cream, borderRadius: 8, border: `1px solid ${colors.borderLt}`, overflow: "hidden" }}>
                            {[
                              { label: "Begünstigter / IBAN", value: beedaroIban, copyVal: beedaroIban },
                              { label: "Einzahlung für", value: "BEEDARO\nGemeindehausstrasse 11B\n6010 Kriens", copyVal: "BEEDARO, Gemeindehausstrasse 11B, 6010 Kriens" },
                              { label: "Betrag in CHF", value: `CHF ${fmtCHF(inv.total_fees)}`, copyVal: parseFloat(inv.total_fees).toFixed(2) },
                              { label: "Zahlungszweck", value: inv.invoice_ref, copyVal: inv.invoice_ref },
                            ].map((r, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 12px", borderBottom: i < 3 ? `1px solid ${colors.borderLt}` : "none" }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontSize: 9, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: fonts.body }}>{r.label}</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, fontFamily: fonts.body, whiteSpace: "pre-line", lineHeight: 1.5 }}>{r.value}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); copy(r.copyVal); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, padding: 4, marginTop: 10, flexShrink: 0 }}><Copy size={13} /></button>
                              </div>
                            ))}
                          </div>
                          {/* QR Code */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&data=${encodeURIComponent(["SPC","0200","1","CH1234567890123456789","K","BEEDARO","Gemeindehausstrasse 11B","6010 Kriens","","","CH","","","","","","","",parseFloat(inv.total_fees).toFixed(2),"CHF","K","","","","","","CH","NON","",`Gebuehren ${inv.invoice_ref}`,"EPD"].join("\r\n"))}`} alt="QR" style={{ width: "80%", maxWidth: 220, aspectRatio: "1", border: "1px solid #eee", borderRadius: 4 }} />
                            <p style={{ margin: "6px 0 0", fontSize: 10, color: colors.muted, fontFamily: fonts.body }}>Mit Banking-App scannen</p>
                          </div>
                        </div>

                        <p style={{ margin: "12px 0", fontSize: 11, color: "#5B8C5A", display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body }}>
                          <BeeIcon size={12} color="#5B8C5A" /> Davon CHF {fmtCHF(inv.total_bee_impact)} Bee-Impact für Schweizer Naturschutz
                        </p>

                        {/* Buttons — volle Breite, gestapelt */}
                        <Link href={`/fees/invoice/${inv.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 16px", borderRadius: 6, background: colors.yellow, color: colors.dark, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: fonts.body, marginBottom: 8 }}>
                          <Receipt size={14} /> QR-Rechnung anzeigen
                        </Link>
                        {inv.status === "open" && (
                          <button onClick={() => handleMarkPaid(inv.id)} style={{ width: "100%", padding: "11px 16px", borderRadius: 6, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.dark, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Ich habe bezahlt</button>
                        )}
                        {inv.status === "pending_payment" && <p style={{ margin: 0, fontSize: 12, color: "#1565C0", fontWeight: 600, textAlign: "center", padding: "8px 0" }}>Zahlung wird geprüft — danke!</p>}
                        {inv.status === "paid" && <p style={{ margin: 0, fontSize: 12, color: "#2E7D32", fontWeight: 600, textAlign: "center", padding: "8px 0" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Alle */}
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}
    </div>
  );
}
