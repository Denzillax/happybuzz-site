-- Verwaiste RPC entfernen: get_community_bee_impact() gab nur SUM(bee_impact)
-- als Skalar zurück und wurde von /impact falsch ausgelesen (data.total_impact
-- existierte nie -> Zähler zeigte CHF 0.00 / 0 Transaktionen).
--
-- Einzige Quelle der Wahrheit für alle Bee-Impact-Zähler (Homepage-Section +
-- /impact-Seite) ist jetzt get_community_impact_stats(), das
--   { impact: SUM(bee_impact), articles: COUNT(*) }
-- über fee_ledger WHERE status != 'cancelled' liefert (bezahlt + pending).

drop function if exists public.get_community_bee_impact();
