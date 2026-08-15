// GET /api/import-image?url=...
// Bild-Proxy für den Inserat-Import: der Browser kann Fremd-CDN-Bilder wegen
// CORS nicht selbst zu File-Objekten machen. Nur die Bild-CDNs der
// Import-Plattformen sind erlaubt (SSRF-Whitelist), max. 8 MB.
import { isAllowedImageHost } from "@/lib/importListing";

// Gleicher Wert wie MAX_IMG_BYTES im Formular: was hier durchkommt,
// akzeptiert auch die Upload-Pipeline (sonst verwirrende "übersprungen"-Meldung).
const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(req) {
  const url = new URL(req.url).searchParams.get("url") || "";
  let target;
  try { target = new URL(url); } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedImageHost(target.hostname)) {
    return new Response("host not allowed", { status: 400 });
  }

  let res;
  try {
    res = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }

  // Auch nach Redirect nur Whitelist-Hosts akzeptieren.
  try {
    if (!isAllowedImageHost(new URL(res.url).hostname)) {
      return new Response("redirected off-whitelist", { status: 502 });
    }
  } catch { /* res.url leer: original galt */ }

  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) {
    return new Response("not an image", { status: 502 });
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new Response("too large", { status: 413 });
  }

  return new Response(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=300",
    },
  });
}
