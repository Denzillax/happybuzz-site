"use client";
import { Mail } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, fonts } from "@/lib/theme";

export function MahnPreviewModal({ admin }) {
  const { mahnModal, setMahnModal, confirmMahn } = admin;
  if (!mahnModal) return null;
  return (
    <div onClick={() => setMahnModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ background: "#F3FAFA", padding: "13px 18px", borderBottom: "1px solid #E6F0F0", display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={16} color="#0A7170" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A7170" }}>{mahnModal.mode === "view" ? `Gesendet${mahnModal.sentAt ? ` am ${fmtDate(mahnModal.sentAt)}` : ""} an ${mahnModal.inv.sellerName || "Verkäufer"}` : `Vorschau · wird gesendet an ${mahnModal.inv.sellerName || "Verkäufer"}`}</span>
        </div>
        <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Betreff</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "3px 0 12px" }}>{mahnModal.subject}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Text</div>
          <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{mahnModal.body}</div>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
          {mahnModal.mode === "view" ? (
            <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Schliessen</button>
          ) : (
            <>
              <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={confirmMahn} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Senden</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
