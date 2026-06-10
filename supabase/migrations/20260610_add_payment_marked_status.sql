-- Service-/Kauf-Flow: Status 'payment_marked' erlauben.
-- Käufer markiert "bezahlt" → payment_marked (wartet auf Bestätigung des Verkäufers).
-- Der Code (markAsPaid) und die Order-UI nutzen diesen Status; die Check-Constraint
-- kannte ihn bisher nicht, daher wich markAsPaid fälschlich auf payment_pending aus.

alter table public.purchases drop constraint if exists purchases_status_check;
alter table public.purchases add constraint purchases_status_check
  check (status = any (array[
    'confirmed', 'payment_pending', 'payment_marked', 'paid', 'shipped', 'picked_up',
    'delivered', 'completed', 'cancelled', 'disputed', 'return_pending', 'returned', 'damage_reported'
  ]));
