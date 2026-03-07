1. Document your architectural decisions before you write code
   Create an DECISIONS.md in the repo root. Every major technical choice gets a short entry — what you chose, what you rejected, and why. Example: "Used raw pg over an ORM to maintain explicit control over queries and keep the dependency footprint minimal for an MVP." This is the artifact you reference in interviews when they ask you to defend your tradeoffs.

2. Write your API contract before either dev touches a file
   Before Developer A and B branch off, create a single API_CONTRACT.md that defines every endpoint — the route, expected request body, and response shape. Pin it to your GitHub Project board. This is your asynchronous handoff document so frontend and backend never block each other.

3. Set up GitHub Actions on day one, not at the end
   Create a basic CI workflow that runs on every PR to dev. Start with just a lint check — it doesn't need to be complex. The habit of "nothing merges without passing CI" is the discipline that matters, and you can layer in tests as you go. This is the DevOps story you tell in interviews.

4. Manage your environment variables properly from the start
   Never commit a .env file. Set up a .env.example with all the keys but no values and commit that instead. Use Doppler or just GitHub Secrets for CI. One leaked credential in your git history follows you — doing this right from day one is a green flag to any hiring manager reading your repo.

5. Add one feature that goes beyond basic CRUD
   Pick one thing from the "depth" list — full-text search across company name and notes is the fastest win and uses nothing beyond PostgreSQL itself. It gives you a concrete answer when an interviewer asks "what makes this more than a tutorial project?" You don't need pgvector or AI features — one well-implemented non-trivial feature beats five half-baked ones.
