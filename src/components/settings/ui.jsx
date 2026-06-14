// Wiederverwendbare, rein präsentationale UI-Helfer für die Settings-Seite.
// Ausgelagert aus settings/page.jsx (props-only, keine Seiten-State-Kopplung).
import { Check, Loader2 } from "lucide-react";
import { colors, radius } from "@/lib/theme";

const C = colors;

export function Badge({ verified, label, sublabel, icon: Icon, pending }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px", borderRadius: 10,
      background: verified ? C.greenSoft : pending ? C.yellowSoft : C.cream,
      border: `1px solid ${verified ? "#B8D8B8" : pending ? "#F0D68A" : C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: verified ? C.green : pending ? C.yellow : C.border,
        color: verified ? "#fff" : pending ? C.dark : C.muted,
        flexShrink: 0,
      }}>
        {verified ? <Check size={18} /> : <Icon size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{label}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sublabel}</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
        padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap",
        background: verified ? C.green : pending ? C.yellow : "transparent",
        color: verified ? "#fff" : pending ? C.dark : C.muted,
        border: !verified && !pending ? `1px solid ${C.border}` : "none",
      }}>
        {verified ? "Verifiziert" : pending ? "Ausstehend" : "Offen"}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", disabled, placeholder, suffix, maxLength }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700,
        color: C.muted, marginBottom: 6,
        textTransform: "uppercase", letterSpacing: ".5px",
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value ?? ""}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{
            width: "100%", padding: "12px 14px",
            paddingRight: suffix ? 44 : 14,
            borderRadius: 8, border: `1.5px solid ${C.border}`,
            background: disabled ? C.cream : "#fff",
            fontSize: 14, fontFamily: "'Manrope', sans-serif",
            color: C.dark, outline: "none", boxSizing: "border-box",
            transition: "border-color .2s",
          }}
          onFocus={e => { e.target.style.borderColor = C.yellow; }}
          onBlur={e => { e.target.style.borderColor = C.border; }}
        />
        {suffix && (
          <div style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)", color: C.muted,
          }}>{suffix}</div>
        )}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 0", borderBottom: `1px solid ${C.border}`,
        cursor: "pointer",
      }}
      onClick={() => onChange?.(!checked)}
    >
      <div style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginTop: 2,
        background: checked ? C.teal : C.border, transition: "background .25s",
        position: "relative",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3, left: checked ? 23 : 3,
          transition: "left .25s", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
        }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
}

export function Btn({ children, variant = "primary", onClick, style: s, small, disabled, loading }) {
  const base = {
    padding: small ? "10px 20px" : "14px 28px",
    borderRadius: radius.full, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Manrope', sans-serif", fontWeight: 700,
    fontSize: small ? 12 : 14, transition: "all .2s",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary:   { background: C.teal, color: "#fff", boxShadow: "0 6px 16px rgba(14,148,147,.28)" },
    secondary: { background: "transparent", color: C.dark, border: `1.5px solid ${C.border}` },
    danger:    { background: C.redSoft, color: C.red },
    ghost:     { background: "transparent", color: C.muted },
  };
  return (
    <button className="bd-btn" style={{ ...base, ...variants[variant], ...s }} onClick={onClick} disabled={disabled || loading}>
      {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

export function Section({ title, description, children, badge }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{
          fontFamily: "'General Sans', sans-serif", fontSize: 16, fontWeight: 700,
          letterSpacing: "0", color: C.dark, margin: 0,
        }}>{title}</h3>
        {badge}
      </div>
      {description && <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>{description}</p>}
      {children}
    </div>
  );
}

export function TrustMeter({ level }) {
  const segments = 4;
  const labels = ["Starter", "Basis", "Vertraut", "Vollständig"];
  return (
    <div style={{
      padding: 20, borderRadius: 12, color: "#fff",
      background: `linear-gradient(135deg, ${C.dark} 0%, #2a2520 100%)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase" }}>Trust Level</div>
        <div style={{ fontSize: 13, color: C.yellow, fontWeight: 700 }}>{labels[Math.min(level, segments) - 1] ?? "—"}</div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < level ? C.yellow : "rgba(255,255,255,.15)",
            transition: "all .4s", transitionDelay: `${i * .08}s`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
        {level === 4 ? "Alle Verifizierungen abgeschlossen!" : `${level}/4 verifiziert. Vervollständige dein Profil für mehr Vertrauen.`}
      </div>
    </div>
  );
}
