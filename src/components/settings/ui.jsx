// Wiederverwendbare, rein präsentationale UI-Helfer für die Settings-Seite.
// Ausgelagert aus settings/page.jsx (props-only, keine Seiten-State-Kopplung).
import { Check, Loader2 } from "lucide-react";
import { colors, radius } from "@/lib/theme";

const C = colors;

// Katalog-Tokens (wie öffentliche Seiten): quadratische Ecken, Ink-Rahmen,
// Mono-Labels, Petrol/Honey-Akzente statt Teal-Glow.
const K = { ink: "#14110D", sand: "#ECE3D2", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Space Mono', monospace";
const monoLabel = {
  display: "block", fontSize: 10, fontWeight: 700, fontFamily: MONO,
  letterSpacing: ".12em", textTransform: "uppercase", color: K.ink, marginBottom: 6,
};

export function Badge({ verified, label, sublabel, icon: Icon, pending }) {
  const accent = verified ? K.moss : pending ? K.honey : "#fff";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px", borderRadius: 0,
      background: verified ? "#EEF4EC" : pending ? "#FBF1D2" : "#fff",
      border: `1.5px solid ${K.ink}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 0, border: `1.5px solid ${K.ink}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: accent,
        color: verified ? "#fff" : K.ink,
        flexShrink: 0,
      }}>
        {verified ? <Check size={18} /> : <Icon size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: K.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sublabel}</div>
      </div>
      <div style={{
        fontSize: 9.5, fontWeight: 700, fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".1em",
        padding: "4px 9px", borderRadius: 0, whiteSpace: "nowrap",
        background: verified ? K.moss : pending ? K.honey : "transparent",
        color: verified ? "#fff" : K.ink,
        border: `1.5px solid ${verified ? K.moss : pending ? K.ink : C.border}`,
      }}>
        {verified ? "Verifiziert" : pending ? "Ausstehend" : "Offen"}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", disabled, placeholder, suffix, maxLength }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={monoLabel}>{label}</label>
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
            borderRadius: 0, border: `1.5px solid ${K.ink}`,
            background: disabled ? K.sand : "#fff",
            fontSize: 14, fontFamily: "'Manrope', sans-serif",
            color: K.ink, outline: "none", boxSizing: "border-box",
            transition: "border-color .2s, box-shadow .2s",
          }}
          onFocus={e => { e.target.style.borderColor = K.petrol; e.target.style.boxShadow = `3px 3px 0 ${K.honey}`; }}
          onBlur={e => { e.target.style.borderColor = K.ink; e.target.style.boxShadow = "none"; }}
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
        width: 44, height: 24, borderRadius: 0, flexShrink: 0, marginTop: 2,
        background: checked ? K.petrol : "#fff", border: `1.5px solid ${K.ink}`,
        transition: "background .25s", position: "relative",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: 0, background: "#fff", border: `1.5px solid ${K.ink}`,
          position: "absolute", top: 2, left: checked ? 23 : 2,
          transition: "left .25s",
        }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: K.ink }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
}

export function Btn({ children, variant = "primary", onClick, style: s, small, disabled, loading }) {
  const base = {
    padding: small ? "10px 20px" : "13px 26px",
    borderRadius: 0, border: `1.5px solid ${K.ink}`, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Manrope', sans-serif", fontWeight: 800,
    fontSize: small ? 12 : 14, transition: "all .15s",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary:   { background: K.honey, color: K.ink, boxShadow: disabled ? "none" : `3px 3px 0 ${K.ink}` },
    secondary: { background: "transparent", color: K.ink },
    danger:    { background: "#fff", color: C.red, borderColor: C.red },
    ghost:     { background: "transparent", color: C.muted, border: "none" },
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
          fontFamily: "'General Sans', sans-serif", fontSize: 17, fontWeight: 700,
          letterSpacing: "-0.01em", color: K.ink, margin: 0,
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
      padding: 20, borderRadius: 0, color: "#fff",
      background: K.ink, border: `1.5px solid ${K.ink}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>Trust Level</div>
        <div style={{ fontSize: 13, color: K.honey, fontWeight: 700 }}>{labels[Math.min(level, segments) - 1] ?? "—"}</div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 8, borderRadius: 0,
            background: i < level ? K.honey : "rgba(255,255,255,.15)",
            transition: "all .4s", transitionDelay: `${i * .08}s`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
        {level === 4 ? "Alle Verifizierungen abgeschlossen." : `${level}/4 verifiziert. Vervollständige dein Profil für mehr Vertrauen.`}
      </div>
    </div>
  );
}
