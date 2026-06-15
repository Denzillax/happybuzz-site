-- Unread-Zähler: Self-Conversations (buyer_id = seller_id) nicht mitzählen.
--
-- Hintergrund: Der Nachrichten-Badge blieb auf manchen Accounts dauerhaft hängen
-- (z.B. yam: Badge = 2), weil ungelesene Nachrichten in einer Self-Conversation
-- (eigenes Inserat, buyer_id = seller_id) lagen. Solche Conversations sind über die
-- normale UI nicht als gelesen markierbar -> is_read blieb false -> Badge hängt.
-- Self-Conversations sind ohnehin ungültig und dürfen nicht in den Zähler.
CREATE OR REPLACE FUNCTION public.get_unread_count_for_user(p_user_id uuid)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.buyer_id = p_user_id OR c.seller_id = p_user_id)
      AND c.buyer_id <> c.seller_id
      AND m.sender_id <> p_user_id
      AND m.is_read = false
  );
END;
$function$;
