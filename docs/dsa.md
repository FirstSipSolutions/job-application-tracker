# DSA in Practice

Real data structure decisions made in this codebase and why they were made.

---

## Hash Map

**File:** `src/hooks/useResumes.js`

Each resume card needs to know how many applications used it and how many got a response. The naive approach loops through every application once per resume card: O(N * M). With 200 applications and 10 resumes that is 2,000 iterations on every render.

Instead, one pass over the applications array builds a hash map keyed by `resume_id`. Each key holds running counts. Inserting and reading from a hash map is O(1) average case (JavaScript objects use a hash table internally), so the full build is O(N) and each card lookup is O(1). Total: O(N + M) instead of O(N * M).

```js
const statMap = {};
for (const app of stats ?? []) {
  if (!statMap[app.resume_id]) statMap[app.resume_id] = { count: 0, responses: 0 };
  statMap[app.resume_id].count++;
  if (["Interview", "Offer"].includes(app.status)) statMap[app.resume_id].responses++;
}
```

---

## Set (dismissed events)

**File:** `src/context/EventsContext.jsx`

Dismissed events are stored in a `Set`. The upcoming panel calls `dismissed.has(key)` on every event during filtering. A Set gives O(1) lookup vs O(N) for an array scan. The key is a composite string `"date::label"` which makes each event uniquely identifiable without needing a database ID.

```js
const [dismissed, setDismissed] = useState(loadDismissed); // Set
// ...
dismissed.has(`${event.date}::${event.label}`) // O(1)
```

---

## Set (URL pattern matching)

**File:** `src/components/modals/AddApplicationModal.jsx`

When a user pastes a job URL, the app extracts the company name automatically. Different job boards embed the company in different parts of the URL. Two Sets drive the decision:

`GENERIC_SUBDOMAINS` holds subdomain prefixes that belong to the job board, not the company (`jobs`, `apply`, `boards`, `careers`). When the subdomain matches, we look at the URL path instead.

`GENERIC_PATHS` holds path segments that are structural, not company slugs (`careers`, `apply`, `positions`). These are skipped when scanning the path.

Both sets use `Set.has()` for O(1) lookup on every URL the user types or pastes. An array would be O(N) per check.

```js
const GENERIC_SUBDOMAINS = new Set(["jobs", "apply", "boards", "careers", "work", "hire", "job"]);
const GENERIC_PATHS      = new Set(["jobs", "careers", "apply", "job", "positions", "openings", "j"]);

// O(1) checks
if (GENERIC_SUBDOMAINS.has(subdomain)) { ... }
if (!GENERIC_PATHS.has(seg))           { ... }
```

This correctly handles `apply.workable.com/stripe/j/abc` returning "Stripe" instead of "Apply".
