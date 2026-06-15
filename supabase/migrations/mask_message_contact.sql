-- Anti-Disintermediation: Kontaktdaten in Chat-Nachrichten maskieren, solange
-- für das Gespräch (Inserat + Käufer) noch kein Kauf existiert. Verhindert, dass
-- Telefon/E-Mail/Messenger/Links ausgetauscht werden, um den Deal off-platform
-- (ohne Bee-Rate/Käuferschutz) abzuschliessen. Server-seitig (BEFORE INSERT) =
-- auch per API nicht umgehbar. Nach Kaufbestätigung erlaubt (Abholung koordinieren).
CREATE OR REPLACE FUNCTION public.mask_message_contact()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE deal_exists boolean;
BEGIN
  IF NEW.content IS NULL OR NEW.content = '' THEN RETURN NEW; END IF;
  IF NEW.message_type IN ('system','offer','image') THEN RETURN NEW; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.conversations c ON c.id = NEW.conversation_id
    WHERE p.listing_id = c.listing_id AND p.buyer_id = c.buyer_id AND p.status <> 'cancelled'
  ) INTO deal_exists;
  IF NOT deal_exists THEN
    NEW.content := regexp_replace(NEW.content, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '•••', 'g');
    NEW.content := regexp_replace(NEW.content, '(https?://|www\.)[^\s]+', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '[A-Za-z0-9-]+\.(ch|com|net|org|de|io|me|info)(/[^\s]*)?', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '(\+?\d[\d ()./\-]{6,}\d)', '•••', 'g');
    NEW.content := regexp_replace(NEW.content, '(whats?app|wa\.me|telegram|t\.me|signal|snapchat|instagram)', '•••', 'gi');
    NEW.content := regexp_replace(NEW.content, '@[A-Za-z0-9_.]{3,}', '•••', 'g');
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_mask_message_contact ON public.messages;
CREATE TRIGGER trg_mask_message_contact BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.mask_message_contact();
