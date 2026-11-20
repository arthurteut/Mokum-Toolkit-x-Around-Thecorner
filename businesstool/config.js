/*
 * Conectarea planului la Supabase (proiectul „atc-toolkit”).
 * Cheia anon e publică prin design; datele sunt protejate de regulile din
 * supabase-plan.sql (doar emailurile din plan_members au acces).
 * Dacă planul se mută în alt proiect Supabase: rulează supabase-plan.sql acolo,
 * apoi înlocuiește url și anonKey cu cele din Project Settings → API.
 */
window.HEAT_SUPABASE = {
  url: "https://tckcmfdolaickwtxglvt.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja2NtZmRvbGFpY2t3dHhnbHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTExMjUsImV4cCI6MjEwNzUyNzEyNX0.J2C0-t-dUE_STppv3D2MOs5G7egZLKuBQv_2yMTz46k"
};
