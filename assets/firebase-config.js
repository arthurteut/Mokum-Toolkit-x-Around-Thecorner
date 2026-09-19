/*
 * Configurarea conturilor de cafenea (Firebase).
 *
 * Cât timp valoarea de mai jos este `null`, aplicația funcționează în modul
 * local (fără conturi) — exact ca până acum. Ca să activezi conturile:
 *
 *   1. Urmează pașii din SETUP-CONTURI.md (crearea proiectului Firebase).
 *   2. Înlocuiește `null` cu obiectul de configurare primit de la Firebase,
 *      de forma:
 *
 *      window.ATC_FIREBASE_CONFIG = {
 *        apiKey: "AIza...",
 *        authDomain: "proiectul-tau.firebaseapp.com",
 *        projectId: "proiectul-tau",
 *        storageBucket: "proiectul-tau.appspot.com",
 *        messagingSenderId: "...",
 *        appId: "..."
 *      };
 *
 * Cheia apiKey a unui proiect Firebase web este publică prin design —
 * accesul la date este protejat de regulile din firestore.rules, nu de ea.
 */
window.ATC_FIREBASE_CONFIG = null;
