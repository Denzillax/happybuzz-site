-- Chat-Filter erweitert (Feedback Denis 18.09.2026): "hast du mir deine Adresse und IBAN?"
-- wurde vor dem Kauf nicht erkannt. Der Filter kannte nur konkrete Kontaktdaten
-- (Nummer, E-Mail, Link, Messenger), nicht die Frage nach Zahlung oder Kontakt
-- ausserhalb der Plattform. Neu vor Kaufabschluss ebenfalls maskiert und gezaehlt:
--  * IBAN-Nummern
--  * Stichworte fuer Zahlung an der Plattform vorbei (IBAN, Kontonummer,
--    Bankverbindung, PayPal, Revolut, Western Union, Vorkasse)
--  * Fragen nach Telefonnummer oder Mailadresse
-- TWINT, Bank und bar bleiben erlaubt, das sind Zahlarten der Plattform.
-- Spiegel im Client: src/lib/contactFilter.js
CREATE OR REPLACE FUNCTION public.mask_message_contact()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE deal_exists boolean; orig text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.sender_id AND is_banned = true) THEN
    RAISE EXCEPTION 'Konto gesperrt';
  END IF;
  IF NEW.content IS NULL OR NEW.content = '' THEN RETURN NEW; END IF;
  IF NEW.message_type IN ('system','offer','image') THEN RETURN NEW; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.conversations c ON c.id = NEW.conversation_id
    WHERE p.listing_id = c.listing_id AND p.buyer_id = c.buyer_id AND p.status <> 'cancelled'
  ) INTO deal_exists;
  IF NOT deal_exists THEN
    orig := NEW.content;
    NEW.content := regexp_replace(NEW.content, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '•••', 'g');
    NEW.content := regexp_replace(NEW.content, '(https?://|www\.)[^\s]+', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '[A-Za-z0-9-]+\.(ch|com|net|org|de|io|me|info)(/[^\s]*)?', '•••', 'gi');
    -- IBAN-Nummer (vor der Telefonregel, sonst bleibt das Laenderkuerzel stehen)
    NEW.content := regexp_replace(NEW.content, '\m[A-Za-z]{2}\d{2}[ ]?([A-Za-z0-9]{4}[ ]?){2,7}[A-Za-z0-9]{1,4}\M', '•••', 'g');
    NEW.content := regexp_replace(NEW.content, '(\+?\d[\d ()./\-]{6,}\d)', '•••', 'g');
    NEW.content := regexp_replace(NEW.content, '(whats?app|wa\.me|telegram|t\.me|signal|snapchat|instagram)', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '@[A-Za-z0-9_.]{3,}', '•••', 'g');
    -- Zahlung oder Kontakt an der Plattform vorbei
    NEW.content := regexp_replace(NEW.content, '\m(iban|konto[ -]?(nummer|nr\.?)|bankverbindung|bankdaten|paypal|revolut|western[ -]?union|vorkasse)\M', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '\m((handy|telefon|natel|tel)[ .-]?(nummer|nr\.?)|(e-?)?mail[ -]?adresse)\M', '•••', 'gi');
    IF NEW.content <> orig THEN
      UPDATE public.profiles SET contact_violations = contact_violations + 1 WHERE id = NEW.sender_id;
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
