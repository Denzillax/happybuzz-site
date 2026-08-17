-- Rekonstruiert aus der Cloud-Session vom 17.08.2026 (bereits live angewendet).
-- Admin-Aktionen auf FREMDE Profile (Beta-Zugang erteilen, Konto sperren,
-- ID-Verifikation) trafen null Zeilen: die RLS erlaubte nur das eigene Profil,
-- und Supabase meldet ein 0-Zeilen-Update nicht als Fehler — stille Blockade.
create policy profiles_staff_update on profiles
  for update
  using (is_staff(auth.uid()))
  with check (is_staff(auth.uid()));
