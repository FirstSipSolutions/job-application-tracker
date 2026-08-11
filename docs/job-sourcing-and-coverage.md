# Job Sourcing and Coverage

Notes on how the job feed finds listings, why it misses some, and the realistic
ways to close the gap. This is the core design constraint of the project.

## How the feed works today

The feed pulls from ~16 sources. They fall into two kinds:

1. **Per-company ATS boards** (Greenhouse, Ashby, Lever, Workday). Each of these
   only answers "what jobs does company X have," so the app queries a
   **hardcoded list of ~130 companies**. Anything not on that list is invisible.
2. **Aggregators / boards** (Adzuna, Jobicy, Himalayas, Remotive, WeWorkRemotely,
   Hacker News "Who is Hiring", Job Bank, Tech NL, Digital Nova Scotia, Silicon
   Harbour). These return many companies but each has limited Canadian-remote
   yield after filtering.

Every listing then runs through the same pipeline:
`normalize -> filter (remote + tech title + fresh + Canada) -> AI classify -> rank`.

## The core problem: fixed list vs. indexed web

The app can only see companies someone explicitly added to a list. LinkedIn,
Indeed, and Google for Jobs index **every** company's career page. That is the
entire coverage gap.

### Case study: Meow

A real "Software Engineer | Canada | Remote" role at Meow was found on LinkedIn
but not in the app. Investigation:

- Meow hosts its board on Ashby (`jobs.ashbyhq.com/meow`), which the app *can*
  reach - the posting passed every filter (remote, tech, Canada, fresh).
- It was missed only because "meow" was not in the hardcoded Ashby company list.
- The posting is public: it is on Ashby, on Meow's careers page, and indexed by
  Google. It is not a LinkedIn exclusive.

Adding Meow by hand fixed that one role but proved the pattern: the next missing
job will be another company that is also not on the list. Hardcoding companies is
whack-a-mole.

### Why there is no easy free fix

The per-company APIs (Greenhouse/Ashby/Lever) have **no "search all boards"
endpoint**. To find a posting without already knowing the company, you need
something that already crawled every career site and lets you search it. That
crawler is a search engine - Google for Jobs indexes those same Ashby/Greenhouse
pages. Free per-company APIs cannot do a global search; only a search-engine-
backed API can.

## The three realistic paths

1. **Watchlist model (free).** Keep discovering roles on LinkedIn/Google; when
   one is found, add that company's board to the feed so the app tracks it for
   new roles automatically. Turns the app into a personal company tracker. Honest
   about the model; good portfolio story. Could be built self-serve (paste an
   Ashby/Greenhouse URL, it gets added).

2. **Google-for-Jobs search API (real coverage).** This is the only thing that
   finds "whatever is publicly posted" without pre-listing companies, because
   Google already crawled it.
   - **SerpApi** - paid (~$50/mo), reliable Google Jobs results, Canada + remote
     filterable.
   - **JSearch (RapidAPI)** - free tier, request-capped, same idea. Endpoint and
     integration were verified to be correct; it only needs a key. Prove it
     locally first: put the key in `.env.local`, run a live search, confirm
     Meow-type roles come back before deploying.

3. **Accept it as a tracker.** Discover on LinkedIn/Google, log and track
   applications here.

## Recommendation

If the goal is for the app itself to stop missing public postings, option 2
(a Google-for-Jobs search API) is the only thing that closes the gap. Nothing
free and per-company can. Option 1 is a good free middle ground for a known set
of target companies.
