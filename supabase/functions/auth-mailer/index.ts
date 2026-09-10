// BEEDARO Auth-Mailer: Supabase Send-Email-Hook -> Klar-Design via Resend.
// WICHTIG: verify_jwt MUSS false sein - Auth ruft ohne JWT auf. Absicherung
// ist die Standard-Webhooks-Signatur (Vault-Secret auth_hook_secret via RPC
// worker_secret, nur service_role). 200 erst NACH erfolgreichem Resend-Versand,
// damit Auth einen Fehler meldet statt still nichts zu senden.
// Rollback: Hook im Dashboard deaktivieren -> alter SMTP-Weg laeuft sofort wieder.
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://beedaro.ch";

type Vorlage = { subject: string; title: string; body: string; button: string | null };

const MAILS: Record<string, Vorlage> = {
  signup: {
    subject: "Bestätige deine E-Mail-Adresse",
    title: "Willkommen bei Beedaro",
    body: "Schön, dass du dabei bist. Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.",
    button: "E-Mail bestätigen",
  },
  recovery: {
    subject: "Neues Passwort festlegen",
    title: "Passwort zurücksetzen",
    body: "Du hast ein neues Passwort angefordert. Über den Button legst du es fest.\nDein Passwort bleibt unverändert, bis du den Link nutzt.",
    button: "Passwort zurücksetzen",
  },
  magiclink: {
    subject: "Dein Anmelde-Link",
    title: "Anmelden ohne Passwort",
    body: "Mit einem Klick bist du angemeldet.",
    button: "Jetzt anmelden",
  },
  email_change: {
    subject: "Neue E-Mail-Adresse bestätigen",
    title: "E-Mail-Adresse ändern",
    body: "Bestätige die Änderung deiner E-Mail-Adresse über den Button.",
    button: "Adresse bestätigen",
  },
  invite: {
    subject: "Du bist eingeladen",
    title: "Deine Einladung zu Beedaro",
    body: "Du wurdest zu Beedaro eingeladen. Erstelle dein Konto über den Button.",
    button: "Konto erstellen",
  },
  reauthentication: {
    subject: "Dein Bestätigungscode",
    title: "Bestätigungscode",
    body: "Gib diesen Code ein, um fortzufahren:",
    button: null,
  },
  fallback: {
    subject: "Bestätigung nötig",
    title: "Bestätige die Aktion",
    body: "Bestätige die Aktion über den Button.",
    button: "Weiter",
  },
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Klar-Minimal wie notify-worker: heller Grund, weisse Karte mit Hairline,
// Honey-Button. Kicker hier "Konto". code ersetzt den Button (Re-Auth).
function renderAuthMail(v: Vorlage, link: string | null, code: string | null, action: string): string {
  const button = v.button && link
    ? `<table cellpadding="0" cellspacing="0"><tr><td style="background:#F4C03F;border-radius:999px;"><a href="${link}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#191615;text-decoration:none;border-radius:999px;">${escapeHtml(v.button)}</a></td></tr></table>`
    : "";
  const codeBlock = code
    ? `<p style="margin:0 0 24px;font-size:28px;font-weight:800;letter-spacing:6px;color:#191615;background:#F4F4F2;border-radius:12px;padding:16px 20px;text-align:center;">${escapeHtml(code)}</p>`
    : "";
  const hint = code ? "Der Code ist nur kurze Zeit gültig." : "Der Link ist nur begrenzte Zeit gültig.";
  const sicherheit = action === "invite" ? "" : " Falls du das nicht warst, kannst du diese Mail ignorieren.";
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F2;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E0D8;border-radius:14px;"><tr><td style="padding:32px 36px 28px;"><img src="${SITE}/logo-email.png" alt="Beedaro" width="140" style="display:block;width:140px;height:auto;margin:0 0 14px;"><p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:.5px;color:#8a8580;text-transform:uppercase;">Konto</p><h1 style="margin:0 0 12px;font-size:21px;font-weight:700;color:#191615;">${escapeHtml(v.title)}</h1><p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#3d3a36;white-space:pre-line;">${escapeHtml(v.body)}</p>${codeBlock}${button}<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8a8580;">${hint}${sicherheit}</p></td></tr><tr><td style="border-top:1px solid #E4E0D8;padding:14px 36px;"><p style="margin:0;font-size:11px;color:#8a8580;">Kaufen. Verkaufen. Gutes tun. &nbsp;&middot;&nbsp; beedaro.ch</p></td></tr></table></td></tr></table></body></html>`;
}

// Standard-Webhooks: HMAC-SHA256 (base64) ueber "id.timestamp.body" mit dem
// base64-dekodierten Secret (Prefixe "v1," und "whsec_" abstreifen).
async function validSignature(req: Request, body: string, secret: string): Promise<boolean> {
  const id = req.headers.get("webhook-id") ?? "";
  const ts = req.headers.get("webhook-timestamp") ?? "";
  const sig = req.headers.get("webhook-signature") ?? "";
  if (!id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const raw = secret.trim().replace(/^v1,/, "").replace(/^whsec_/, "");
  const key = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sig.split(" ").some((teil) => teil.split(",")[1] === expected);
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const body = await req.text();

  const { data: hookSecret } = await supabase.rpc("worker_secret", { p_name: "auth_hook_secret" });
  if (!hookSecret) {
    return new Response(JSON.stringify({ error: "auth_hook_secret fehlt im Vault" }), { status: 503 });
  }
  if (!(await validSignature(req, body, String(hookSecret)))) {
    return new Response(JSON.stringify({ error: "ungueltige Signatur" }), { status: 401 });
  }

  const payload = JSON.parse(body);
  const user = payload.user ?? {};
  const ed = payload.email_data ?? {};
  const action = String(ed.email_action_type ?? "");

  const vorlage = MAILS[action] ?? (action.startsWith("email_change") ? MAILS.email_change : MAILS.fallback);
  // E-Mail-Aenderung: die Bestaetigung fuer die NEUE Adresse geht an new_email
  // (Typen "email_change" bzw. "email_change_new"); "email_change_current" an die alte.
  const to = action.startsWith("email_change") && action !== "email_change_current" && user.new_email
    ? user.new_email
    : user.email;
  const tokenHash = action === "email_change_new" && ed.token_hash_new ? ed.token_hash_new : ed.token_hash;
  const verifyType = action.startsWith("email_change") ? "email_change" : action;
  const code = action === "reauthentication" ? String(ed.token ?? "") : null;
  const link = code
    ? null
    : `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${tokenHash}&type=${verifyType}&redirect_to=${encodeURIComponent(String(ed.redirect_to ?? "") || SITE)}`;

  if (!to) return new Response(JSON.stringify({ error: "kein Empfaenger im Payload" }), { status: 500 });

  const { data: resendKey } = await supabase.rpc("worker_secret", { p_name: "resend_api_key" });
  if (!resendKey) return new Response(JSON.stringify({ error: "resend_api_key fehlt im Vault" }), { status: 503 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Beedaro Info <noreply@beedaro.ch>",
      to,
      subject: vorlage.subject,
      html: renderAuthMail(vorlage, link, code, action),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("auth-mailer resend-fehler", res.status, detail.slice(0, 300));
    return new Response(JSON.stringify({ error: `resend ${res.status}` }), { status: 500 });
  }
  return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
});
