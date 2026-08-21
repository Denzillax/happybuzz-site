-- 21.08.2026 HOTFIX (live via MCP "create_purchase_alte_overloads_weg")
-- Die Varianten-Migration vom 19.08. legte create_purchase mit p_variant als
-- NEUE Funktionen an (neuer Parameter = neue Signatur) statt die alten zu
-- ersetzen. Ein Kauf OHNE p_variant passte danach auf beide Versionen ->
-- PostgREST "Could not choose the best candidate function" -> JEDER normale
-- Sofortkauf schlug fehl (gemeldet von Denis, Beta-Feedback 21.08. 15:31).
-- Fix: alte Versionen ohne p_variant entfernen; die Versionen mit
-- p_variant default null decken alle Aufruf-Formen ab (verifiziert:
-- ohne p_variant, mit p_variant, mit p_price).
-- Lehre: Beim Erweitern von RPC-Signaturen die alte Signatur IMMER droppen.
drop function if exists public.create_purchase(uuid, uuid);
drop function if exists public.create_purchase(uuid, uuid, numeric);
drop function if exists public.create_purchase(uuid, uuid, numeric, numeric);
