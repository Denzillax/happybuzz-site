// Erkennt + maskiert Kontaktdaten (Telefon, E-Mail, URL, externe Messenger) zu "•••".
// Spiegelt den DB-Trigger `mask_message_contact` (server-seitig ist die Quelle der
// Wahrheit; hier nur für sofortiges UI-Feedback + den Hinweis).
export function maskContactInfo(text) {
  if (!text) return { masked: text || "", hadContact: false };
  const patterns = [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,                 // E-Mail
    /(https?:\/\/|www\.)\S+/gi,                                        // URL
    /[A-Za-z0-9-]+\.(ch|com|net|org|de|io|me|info)(\/\S*)?/gi,         // blanke Domain
    /\+?\d[\d ().\/-]{6,}\d/g,                                         // Telefon-artig (>= 8 Zeichen)
    /(whats?app|wa\.me|telegram|t\.me|signal|snapchat|instagram)/gi,   // externe Messenger
    /@[A-Za-z0-9_.]{3,}/g,                                             // @handles
  ];
  let s = text, hadContact = false;
  for (const re of patterns) {
    const before = s;
    s = s.replace(re, "•••");
    if (s !== before) hadContact = true;
  }
  return { masked: s, hadContact };
}
