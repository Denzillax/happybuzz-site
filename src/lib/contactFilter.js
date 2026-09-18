// Erkennt + maskiert Kontaktdaten (Telefon, E-Mail, URL, externe Messenger, IBAN)
// sowie Fragen nach Zahlung oder Kontakt an der Plattform vorbei zu "•••".
// Spiegelt den DB-Trigger `mask_message_contact` (server-seitig ist die Quelle der
// Wahrheit; hier nur für sofortiges UI-Feedback + den Hinweis).
export function maskContactInfo(text) {
  if (!text) return { masked: text || "", hadContact: false };
  const patterns = [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,                 // E-Mail
    /(https?:\/\/|www\.)\S+/gi,                                        // URL
    /[A-Za-z0-9-]+\.(ch|com|net|org|de|io|me|info)(\/\S*)?/gi,         // blanke Domain
    /\b[A-Za-z]{2}\d{2} ?(?:[A-Za-z0-9]{4} ?){2,7}[A-Za-z0-9]{1,4}\b/g,   // IBAN-Nummer (vor der Telefonregel)
    /\+?\d[\d ().\/-]{6,}\d/g,                                         // Telefon-artig (>= 8 Zeichen)
    /(whats?app|wa\.me|telegram|t\.me|signal|snapchat|instagram)/gi,   // externe Messenger
    /@[A-Za-z0-9_.]{3,}/g,                                             // @handles
    // Zahlung oder Kontakt an der Plattform vorbei (Denis 18.09.: "Adresse und IBAN?"
    // blieb unerkannt). TWINT, Bank und bar bleiben erlaubt, das sind Plattform-Zahlarten.
    /\b(iban|konto[ -]?(nummer|nr\.?)|bankverbindung|bankdaten|paypal|revolut|western[ -]?union|vorkasse)\b/gi,
    /\b((handy|telefon|natel|tel)[ .-]?(nummer|nr\.?)|(e-?)?mail[ -]?adresse)\b/gi,
  ];
  let s = text, hadContact = false;
  for (const re of patterns) {
    const before = s;
    s = s.replace(re, "•••");
    if (s !== before) hadContact = true;
  }
  return { masked: s, hadContact };
}
