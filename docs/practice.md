# Practice

Patterns and data structures built into this app. Click any link to jump straight to the code.

---

## Hash Map

**Where:** [useResumes.js line 16](../src/hooks/useResumes.js#L16)

**What it does:** Counts how many times each resume was used and how many responses it got.

**Why a Hash Map:** We have a list of applications and a list of resumes. The wrong way is to loop through every application once per resume to count matches. With 200 applications and 10 resumes that is 2,000 steps. Instead, one pass through the applications builds a map keyed by resume ID. Each key holds the running counts. Building it takes N steps. Reading any resume's count takes 1 step. Total: N + M steps instead of N x M.

**Why not an array:** An array has no key. You would have to scan the whole thing every time you looked something up.

---

## Set - dismissed events

**Where:** [EventsContext.jsx line 14](../src/context/EventsContext.jsx#L14)

**What it does:** Tracks which upcoming events the user has hidden from the panel.

**Why a Set:** Every time the panel renders it checks whether each event has been dismissed. A Set answers that question in 1 step no matter how many items are in it. An array would scan from the start every time, so the more events get dismissed the slower it gets.

**Why not an array:** Arrays are ordered lists. The only thing needed here is "is this in the collection or not." That is exactly what a Set is for.

---

## Set - URL pattern matching

**Where:** [AddApplicationModal.jsx line 10](../src/components/modals/AddApplicationModal.jsx#L10)

**What it does:** Figures out the real company name from a job posting URL by ignoring platform subdomains like "apply." or "jobs." and path words like "careers" or "positions."

**Why a Set:** The check runs on every keystroke as the user types a URL. A Set answers "is this word a generic platform word" in 1 step. Using an array with .includes() would scan the list on every keystroke.

**Why not an array:** Same reason as above. Membership check is the only operation. Sets exist for this exact purpose.

---

## Algorithm - arrayMove and immutable state

**Where:** [WidgetGrid.jsx line 72](../src/components/dashboard/WidgetGrid.jsx#L72)

**What it does:** Reorders the stats widgets when the user drags one to a new position.

**Why arrayMove with a new array:** React only re-renders when it sees a new value. If you move an item by mutating the existing array (splice), the array reference in memory stays the same. React sees no change and the screen does not update. arrayMove returns a brand new array so React sees the change and re-renders correctly.

**Why not splice on the original:** It would silently break the UI. The data would change but nothing would re-render to show it.

---

## Auth guard redirect

**Where:** [Landing.jsx line 14](../src/pages/Landing.jsx#L14)

**What it does:** Sends logged-in users straight to the app instead of showing them the landing page.

**Why return null while loading:** Supabase restores your session from local storage when the page loads, but it takes a moment. Without the null return, the landing page would flash briefly before the redirect. Returning null holds the screen blank until the session check is done.

**Why not a useEffect:** Reading the session in a useEffect runs after the first render, meaning the landing page would always paint once before redirecting. Checking at render time skips that flash entirely.

---

## Optimistic update

**Where:** [useResumes.js line 78](../src/hooks/useResumes.js#L78)

**What it does:** Updates the UI before the database call comes back. A renamed or deleted resume responds instantly.

**Why update state first:** Waiting for the database before updating the screen makes the app feel slow. On a slow connection that could be a second or more of nothing happening after a click.

**Why not wait for the database:** The database call almost always succeeds. Making the user wait for confirmation on every small action adds friction with almost no benefit.

---

## Signed URL with expiry

**Where:** [useResumes.js line 93](../src/hooks/useResumes.js#L93)

**What it does:** Generates a temporary link to a resume PDF that expires after 60 seconds.

**Why a signed URL and not a public URL:** Resume files contain personal information. A public URL means anyone with the link can access the file forever. A signed URL is tied to the request, expires fast, and cannot be shared or reused.

**Why 60 seconds:** Long enough to open or download the file. Short enough that a leaked URL is useless almost immediately.

---

## Algorithm - Fisher-Yates shuffle

**Where:** [HireHub.jsx line 22](../src/components/dashboard/HireHub.jsx#L22)

**What it does:** Picks 8 random jobs from the filtered pool each time the user hits the spin button.

**Why Fisher-Yates:** It walks the array backwards and swaps each item with a randomly chosen item at or before its position. Every possible ordering comes out with equal probability. It runs in O(N) time.

**Why not sort(() => Math.random() - 0.5):** The sort approach is O(N log N) and biased. The comparison function runs multiple times per pair, so items earlier in the array get more chances to move than items at the end. Fisher-Yates gives every item an equal shot and does it faster.

---

## Filter chain with Set lookup

**Where:** [HireHub.jsx line 78](../src/components/dashboard/HireHub.jsx#L78)

**What it does:** Filters 100 jobs down to remote Canadian tech roles only. Two conditions must both pass: workplaceType is "Remote" and at least one word in the job title is in TECH_KEYWORDS.

**Why split the title into words then check a Set:** Splitting gives individual words so "Software Engineer" becomes ["software", "engineer"] and each word gets one O(1) Set lookup. Checking the whole title string with .includes("developer") would miss "developers" or false-match "web developer community manager." Word-level lookup with a Set is both faster and more accurate.

---

## Scoped storage path

**Where:** [useResumes.js line 55](../src/hooks/useResumes.js#L55)

**What it does:** Stores every uploaded file at a path that starts with the user's own ID.

**Why prefix with the user ID:** Supabase storage security rules can check the first folder in the path against the logged-in user's ID. This means even if someone guesses another user's file ID they cannot access it because the path starts with the wrong user ID.

**Why not a flat folder with just the file ID:** A flat structure has no way to enforce ownership at the storage level. Every file would need to be checked individually in application code, which is easy to forget and easy to get wrong.
