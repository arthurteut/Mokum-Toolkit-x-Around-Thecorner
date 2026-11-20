/*
 * Conectarea jurnalului la Supabase-ul Heat.
 *
 * Cât timp valoarea de mai jos e `null`, pagina merge în mod local (datele
 * rămân pe dispozitiv). Ca s-o legi de Supabase:
 *   Supabase → Project Settings → API → copiază „Project URL" și cheia
 *   „anon public" (NU cheia service_role) și înlocuiește `null` cu:
 *
 *   window.HEAT_SUPABASE = {
 *     url: "https://abcdefghijklmnop.supabase.co",
 *     anonKey: "eyJhbGciOi..."
 *   };
 *
 * Cheia anon e publică prin design; datele sunt protejate de regulile din
 * supabase-setup.sql (doar emailurile din echipă au acces).
 */
window.HEAT_SUPABASE = null;
