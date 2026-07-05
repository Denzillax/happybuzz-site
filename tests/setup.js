// Dummy-Umgebung für Module, die den Supabase-Client beim Import erstellen.
// Unit-Tests rufen keine echten Netzwerk-Funktionen auf.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
