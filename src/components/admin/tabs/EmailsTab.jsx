"use client";
import { colors, radius } from "@/lib/theme";

export function EmailsTab({ admin }) {
  const { filteredEmails, emailCard } = admin;
  return (
    <div>
      {filteredEmails.length === 0 && (
        <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine E-Mails protokolliert.</div>
      )}
      {filteredEmails.map(e => emailCard(e))}
    </div>
  );
}
