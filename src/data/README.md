# `data/` — fake demo data

Hardcoded data used everywhere until Supabase is wired up. Components don't know they're in demo mode — they just receive whatever data they're given.

When you add `demoData.js` here, export shapes that match what `useRoles()` and `useJobs()` will eventually return from Supabase.
