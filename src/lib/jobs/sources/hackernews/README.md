# Hacker News "Who is Hiring?" source

A self-contained job source that reads the monthly Hacker News hiring thread and
turns it into structured, filterable listings.

## Why it exists

The rest of the feed pulls from a fixed list of company career boards
(Greenhouse, Ashby, Lever). That is reliable but repetitive - the same large
employers show up every time. The Hacker News hiring thread is the opposite:
hundreds of small and mid-size companies post remote developer roles directly,
so it adds the variety the fixed boards cannot.

## How it works

1. **Find the thread.** Every month a bot account (`whoishiring`) posts an
   "Ask HN: Who is hiring?" thread. `index.js` asks the public HN Algolia search
   for that bot's newest threads and picks the hiring one.
2. **Fetch the comments.** One Algolia call returns the whole thread with every
   reply nested underneath it.
3. **Parse each post.** `parseHiringPost.js` reads the informal
   `Company | Role | Location | REMOTE` header that posters follow, extracts the
   company, role, apply link, and posting date, and flags the Canada status.

## Design decisions

- **No API key.** The HN Algolia API is free and public, so this source works in
  every environment with nothing to configure.
- **Strict Canada handling.** Posts that say US-only or EU-only are marked
  not-Canada and dropped. Posts that say Canada or worldwide are kept. Plain
  "remote" posts are left undecided for the AI classifier to judge from the
  description, so the strict Canadian constraint is never loosened here.
- **Real posting dates.** Each job uses its comment timestamp, so the shared
  freshness filter treats it like any other listing. In practice that means this
  source is busiest in the first weeks of each month, right after the thread goes
  up - which is exactly when the roles are fresh.

## Files

- `index.js` - finds the thread and returns parsed jobs
- `parseHiringPost.js` - turns one comment into one job object
