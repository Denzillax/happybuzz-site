"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { colors, fonts } from "@/lib/theme";

export default function AdminPage() {
  const admin = useAdminData();
  if (admin.loading) return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, fontFamily: fonts.body, background: "#fff" }}>
      <img src="/logo.svg" alt="Beedaro" style={{ width: 150, height: "auto" }} />
      {/* Waben-Animation: drei Honig-Sechsecke huepfen nacheinander */}
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 20, height: 23, background: "#F4C03F",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            animation: `adminHex 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8a8580" }}>Dashboard wird geladen</p>
      <style>{`
        @keyframes adminHex {
          0%, 100% { transform: translateY(0); opacity: .3 }
          50% { transform: translateY(-8px); opacity: 1 }
        }
      `}</style>
    </div>
  );
  if (!admin.user) return null;
  return <AdminShell admin={admin} />;
}
