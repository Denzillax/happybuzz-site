"use client";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { Check, Circle } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

import { useState, useEffect } from "react";

const C = colors; // Alias for brevity in this file

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#191615", sand: "#F5F6F8", paper: "#FFFFFF", honey: "#F4C03F", petrol: "#0B5E5C" };
const MONO = "'Manrope', sans-serif";
const BODY = "Manrope, sans-serif";


// ─── UI-Komponenten ─────────────────────────────────────────────────────
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>;
const LockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const MailOpen = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="1.5"><path d="M22 10v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8"/><path d="M22 10l-10 5L2 10"/><path d="M2 10l4-5h12l4 5"/></svg>;
const EyeIcon = ({open}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{open ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>}</svg>;
const ArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const GoogleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const AppleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill={C.dark}><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>;

function Input({ label, type="text", value, onChange, placeholder, error, icon }) {
  const [f, setF] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, fontFamily:BODY, letterSpacing:".05em", textTransform:"uppercase", color:K.ink, marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:f?K.petrol:C.muted, transition:"color .2s", display:"flex" }}>{icon}</span>}
        <input type={isPw && show ? "text" : type} value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ width:"100%", padding:icon?"12px 46px 12px 40px":"12px 16px", borderRadius: 12, border:`1.5px solid ${error?C.red:f?"#F4C03F":"#E5E8EC"}`, background:"#fff", fontSize:15, fontFamily:BODY, color:K.ink, outline:"none", transition:"border-color .2s", boxShadow:"none", /* kein Schein nach aussen (Denis 18.09.): nur der Rand wird honiggelb, wie im Rest der Seite */ boxSizing:"border-box" }}/>
        {isPw && <button type="button" onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex", padding:4 }}><EyeIcon open={show}/></button>}
      </div>
      {error && <p style={{ color:C.red, fontSize:13, marginTop:3, fontWeight:500 }}>{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [{ l:"8+ Zeichen", ok:password.length>=8 }, { l:"Grossbuchstabe", ok:/[A-Z]/.test(password) }, { l:"Zahl", ok:/\d/.test(password) }];
  const score = checks.filter(c=>c.ok).length;
  const barColors = ["#ccc",C.red,C.yellow,C.green];
  if (!password) return null;
  return (
    <div style={{ marginTop:-10, marginBottom:16 }}>
      <div style={{ display:"flex", gap:4, marginBottom:5 }}>{[0,1,2].map(i=><div key={i} style={{ flex:1, height:3, borderRadius: 12, background:i<score?barColors[score]:C.border, transition:"background .3s" }}/>)}</div>
      <div style={{ display:"flex", gap:10 }}>{checks.map((c,i)=><span key={i} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:c.ok?C.green:C.muted, fontWeight:500 }}>{c.ok?<Check size={12}/>:<Circle size={12}/>} {c.l}</span>)}</div>
    </div>
  );
}

function SocialBtn({ icon, label, onClick, disabled }) {
  const [h, setH] = useState(false);
  // disabled: OAuth-Anbieter sind noch nicht konfiguriert — Buttons bleiben
  // sichtbar (Nutzer sehen, was kommt), aber ausgegraut und ohne Aktion.
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
      title={disabled ? `Anmeldung mit ${label} folgt in Kürze` : undefined}
      onMouseEnter={()=>!disabled&&setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"11px 16px", borderRadius: 999, border:`1px solid ${disabled?"rgba(20,17,13,0.15)":"#E5E8EC"}`, background:h?K.sand:"#fff", cursor:disabled?"not-allowed":"pointer", fontSize:14, fontWeight:700, color:K.ink, fontFamily:BODY, transition:"background .2s", opacity:disabled?0.45:1, filter:disabled?"grayscale(1)":"none" }}>
      {icon}{label}
    </button>
  );
}

function Btn({ children, onClick, loading, secondary, type="button" }) {
  return (
    <button type={type} onClick={onClick} disabled={loading} style={{
      width:"100%", padding:"13px", border:secondary?"1px solid #E5E8EC":"none", borderRadius: 999,
      background:secondary?"transparent":K.honey, color:K.ink, fontSize:14, fontWeight:800,
      fontFamily:BODY, letterSpacing:".02em", cursor:loading?"default":"pointer",
      boxShadow:loading?"none":"0 2px 8px rgba(25,22,21,.15)",
      transition:"all .15s", opacity:loading?.7:1,
    }}>
      {loading ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation:"spin .8s linear infinite" }}><circle cx="12" cy="12" r="10" stroke={C.dark} strokeWidth="2.5" fill="none" strokeDasharray="50" strokeLinecap="round" opacity=".4"/></svg>
        Einen Moment…
      </span> : children}
    </button>
  );
}


// ─── Auth Page ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [firstName, setFirstName] = useState("");
  const [displayName, setDisplayName] = useState(""); // Wunsch-Anzeigename, leer = Vorname
  const [lastName, setLastName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Check URL für Password-Reset-Token
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setView("reset");
    }
  }, []);

  const clearForm = () => { setEmail(""); setPassword(""); setConfirmPw(""); setFirstName(""); setLastName(""); setAgree(false); setError(""); setFieldErrors({}); };
  const switchView = (v) => { clearForm(); setView(v); };

  // ─── Validation ─────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "E-Mail ist erforderlich";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Ungültige E-Mail";
    if (view === "register" || view === "login" || view === "reset") {
      if (!password) e.password = "Passwort ist erforderlich";
      else if (view !== "login" && password.length < 8) e.password = "Mind. 8 Zeichen";
    }
    if (view === "register") {
      if (!firstName.trim()) e.firstName = "Vorname ist erforderlich";
      if (!lastName.trim()) e.lastName = "Nachname ist erforderlich";
      if (password && confirmPw && password !== confirmPw) e.confirmPw = "Passwörter stimmen nicht überein";
      if (!confirmPw) e.confirmPw = "Bitte bestätigen";
      if (!agree) e.agree = "Bitte akzeptiere die AGB";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Auth Handlers ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      // Redirect nach Login
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("redirect") || "/";
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "E-Mail oder Passwort ist falsch." : err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: displayName.trim() || firstName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login/callback`,
        },
      });
      if (err) throw err;
      if (data.user && !data.user.identities?.length) throw { message: "Diese E-Mail ist bereits registriert." };
      // E-Mail-Bestaetigung ist deaktiviert: signUp liefert direkt eine
      // Session, also sofort rein statt auf eine Mail zu verweisen, die
      // nie kommt. Faellt die Bestaetigung wieder an, greift der verify-View.
      if (data.session) { window.location.href = "/"; return; }
      setView("verify");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setFieldErrors({ email: "Bitte gib deine E-Mail ein" }); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (err) throw err;
      setView("forgot-sent");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 8) { setFieldErrors({ password: "Mind. 8 Zeichen" }); return; }
    if (password !== confirmPw) { setFieldErrors({ confirmPw: "Passwörter stimmen nicht überein" }); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      const params2 = new URLSearchParams(window.location.search); window.location.href = params2.get("redirect") || "/";
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider, options: { redirectTo: `${window.location.origin}/login/callback` },
      });
      if (err) throw err;
    } catch (err) { setError(err.message); }
  };

  // ─── Render Helpers ─────────────────────────────────────────────────
  const renderDivider = () => (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
      <div style={{ flex:1, height:1, background:C.border }}/><span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>oder</span><div style={{ flex:1, height:1, background:C.border }}/>
    </div>
  );

  const renderError = () => error && (
    <div style={{ padding:"10px 14px", borderRadius: 12, background:"#FEF2F2", border:"1px solid #FECACA", marginBottom:16, fontSize:14, color:C.red, fontWeight:500 }}>{error}</div>
  );

  const renderBack = (target, label) => (
    <button onClick={()=>switchView(target)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", padding:0, marginBottom:16, fontFamily:"'Manrope',sans-serif" }}>
      <ArrowLeft/> {label}
    </button>
  );

  // ─── Views ──────────────────────────────────────────────────────────
  const views = {
    login: () => <>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:22 }}>
        <button type="button" onClick={()=>switchView("login")} className="tab active">Anmelden</button>
        <button type="button" onClick={()=>switchView("register")} className="tab">Registrieren</button>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <SocialBtn icon={<GoogleIcon/>} label="Google" disabled onClick={()=>handleOAuth("google")}/>
        <SocialBtn icon={<AppleIcon/>} label="Apple" disabled onClick={()=>handleOAuth("apple")}/>
      </div>
      {renderDivider()}
      {renderError()}
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Input label="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Dein Passwort" icon={<LockIcon/>} error={fieldErrors.password}/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:-8, marginBottom:18 }}>
        <a onClick={()=>switchView("forgot")} className="link">Passwort vergessen?</a>
      </div>
      <Btn onClick={handleLogin} loading={loading} type="submit">Anmelden</Btn>
      <p style={{ textAlign:"center", fontSize:14, color:C.muted, marginTop:18, fontWeight:500 }}>Noch kein Konto? <a onClick={()=>switchView("register")} className="link" style={{ whiteSpace:"nowrap" }}>Jetzt registrieren</a></p>
    </>,

    register: () => <>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:22 }}>
        <button onClick={()=>switchView("login")} className="tab">Anmelden</button>
        <button onClick={()=>switchView("register")} className="tab active">Registrieren</button>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <SocialBtn icon={<GoogleIcon/>} label="Google" disabled onClick={()=>handleOAuth("google")}/>
        <SocialBtn icon={<AppleIcon/>} label="Apple" disabled onClick={()=>handleOAuth("apple")}/>
      </div>
      {renderDivider()}
      {renderError()}
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1 }}><Input label="Vorname" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Max" icon={<UserIcon/>} error={fieldErrors.firstName}/></div>
        <div style={{ flex:1 }}><Input label="Nachname" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Muster" error={fieldErrors.lastName}/></div>
      </div>
      <Input label="Anzeigename (optional)" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder={firstName.trim() ? `Standard: ${firstName.trim()}` : "So erscheinst du auf BEEDARO"} icon={<UserIcon/>}/>
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Input label="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mind. 8 Zeichen" icon={<LockIcon/>} error={fieldErrors.password}/>
      <PasswordStrength password={password}/>
      <Input label="Passwort bestätigen" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Passwort wiederholen" icon={<LockIcon/>} error={fieldErrors.confirmPw}/>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:20 }}>
        <div onClick={()=>setAgree(!agree)} style={{ width:18, height:18, borderRadius: 5, border:`1.5px solid ${fieldErrors.agree?C.red:agree?C.yellow:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", background:agree?C.yellow:"transparent", flexShrink:0, marginTop:1 }}>
          {agree && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke={C.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <span style={{ fontSize:14, color:fieldErrors.agree?C.red:C.muted, lineHeight:1.45 }}>Ich akzeptiere die <a href="/terms" target="_blank" rel="noopener" className="link">AGB</a> und <a href="/privacy" target="_blank" rel="noopener" className="link">Datenschutzerklärung</a></span>
      </div>
      <Btn onClick={handleRegister} loading={loading}>Account erstellen</Btn>
      {/* Willkommens-Los (Beta-Feedback Tacocat 08.09.): Anreiz direkt bei der Anmeldung */}
      <p style={{ textAlign:"center", fontSize:12.5, color:C.muted, marginTop:12, lineHeight:1.5 }}>Dein erstes Inserat zieht automatisch ein Willkommens-Los: bis zu 100 Pollen für dein Bee-Level.</p>
      <p style={{ textAlign:"center", fontSize:14, color:C.muted, marginTop:12, fontWeight:500 }}>Bereits registriert? <a onClick={()=>switchView("login")} className="link" style={{ whiteSpace:"nowrap" }}>Jetzt anmelden</a></p>
    </>,

    forgot: () => <>
      {renderBack("login", "Zurück zum Login")}
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginBottom:6 }}>Passwort vergessen?</h2>
      <p style={{ fontSize:14, color:C.muted, marginBottom:22, lineHeight:1.5 }}>Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.</p>
      {renderError()}
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Btn onClick={handleForgot} loading={loading}>Link senden</Btn>
    </>,

    "forgot-sent": () => <div style={{ textAlign:"center", padding:"16px 0" }}>
      <MailOpen/>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginTop:12, marginBottom:8 }}>E-Mail gesendet!</h2>
      <p style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>Wir haben einen Link an <strong style={{ color:C.dark }}>{email}</strong> gesendet. Prüfe dein Postfach.</p>
      <Btn onClick={()=>switchView("login")} secondary>Zurück zum Login</Btn>
      <p style={{ fontSize:13, color:C.muted, marginTop:16 }}>Keine E-Mail? Prüfe deinen Spam-Ordner.</p>
    </div>,

    verify: () => <div style={{ textAlign:"center", padding:"16px 0" }}>
      <MailOpen/>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginTop:12, marginBottom:8 }}>Bestätige deine E-Mail</h2>
      <p style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>Wir haben eine Bestätigung an <strong style={{ color:C.dark }}>{email}</strong> gesendet. Klicke auf den Link um deinen Account zu aktivieren.</p>
      <Btn onClick={()=>switchView("login")} secondary>Zurück zum Login</Btn>
    </div>,

    reset: () => <>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginBottom:6 }}>Neues Passwort wählen</h2>
      <p style={{ fontSize:14, color:C.muted, marginBottom:22, lineHeight:1.5 }}>Wähle ein neues Passwort.</p>
      {renderError()}
      <Input label="Neues Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mind. 8 Zeichen" icon={<LockIcon/>} error={fieldErrors.password}/>
      <PasswordStrength password={password}/>
      <Input label="Passwort bestätigen" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Passwort wiederholen" icon={<LockIcon/>} error={fieldErrors.confirmPw}/>
      <Btn onClick={handleResetPassword} loading={loading}>Passwort speichern</Btn>
    </>,
  };

  return (
    <>
      <div style={{ minHeight:"100vh", background:K.sand, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:BODY, padding:"24px 16px", position:"relative" }}>
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, opacity:mounted?1:0, transition:"opacity .4s" }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Logo width={190} /></div>
            <p style={{ fontSize:13, color:"rgba(25,22,21,.55)", fontWeight:600, fontFamily:BODY }}>
              {view==="login"?"Anmelden":view==="register"?"Konto anlegen":view==="forgot"||view==="forgot-sent"?"Passwort zurücksetzen":view==="verify"?"Fast geschafft":"Neues Passwort"}
            </p>
          </div>
          <div className="card-enter" key={view} style={{ background:K.paper, borderRadius: 12, padding:"0 clamp(16px, 5vw, 28px) clamp(20px, 5vw, 28px)", border:"1px solid #E5E8EC", boxShadow:"0 2px 12px rgba(25,22,21,.08)" }}>
            <div style={{ paddingTop:(view==="login"||view==="register")?0:24 }}>{views[view]?.()}</div>
          </div>
          <p style={{ textAlign:"center", fontSize:11.5, color:C.muted, marginTop:18, fontWeight:600, fontFamily:BODY }}>© 2026 beedaro.ch · Kaufen. Verkaufen. Gutes tun.</p>
        </div>
      </div>
    </>
  );
}
