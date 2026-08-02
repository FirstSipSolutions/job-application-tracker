/*
 * Turns one "Who is Hiring?" comment into a job object.
 *
 * Companies post one comment per open role, and almost everyone follows the
 * same informal header on the first line:
 *
 *     Company | Role | Location | REMOTE | Full-time | ...the rest is a blurb...
 *
 * So the company and role come from splitting that first line, and the location
 * and remote signals come from scanning the whole comment. Posts that clearly
 * say US-only or EU-only are marked as not-Canada so the shared filter drops
 * them; posts that mention Canada or worldwide are marked Canada-open; anything
 * that just says "remote" is left undecided so the AI classifier can judge it
 * later from the description.
 */

// Anything that pins the role to a country other than Canada. When one of these
// matches we know the role is not open to a Canadian, so it gets dropped.
const FOREIGN_ONLY = /\b(us|u\.s\.|usa|united states)[ -]?only\b|\bus[ -]based\b|must be (?:based )?in the (?:us|united states)|\bus (?:work )?authoriz|\b(eu|uk|europe|india|emea|apac|germany|australia)[ -]?only\b|based in (?:the )?(?:uk|eu|europe|india)|\(remote us\)/i;

// A positive signal that a Canadian can take the role.
const CANADA_SIGNAL = /canada|worldwide|anywhere|north america|\bglobal\b/i;

// Not every top-level comment is a job post - some are replies, corrections, or
// meta chatter. Real posts lead with "Company | Role", so a first field that
// reads like a sentence (question words, edit notes, a trailing colon) is a
// tell that this is not a listing.
const NOT_A_COMPANY = /\b(can you|could you|please|thanks|thank you|edit|update|correction|following|note|hello|hi there)\b|:$/i;

// Hacker News returns comment bodies as HTML with escaped entities. This turns
// that into plain, single-spaced text so the patterns above have something
// clean to match against.
function toPlainText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseHiringPost(comment) {
  // Skip empty, deleted, or flagged comments - they have no usable text.
  if (!comment || !comment.text || comment.deleted) return null;

  const text = toPlainText(comment.text);

  // The header fields are separated by pipes or em dashes. The first field is
  // the company, the second is usually the role.
  const header  = text.split(/\s\|\s|\s—\s/).map(part => part.trim());
  const company = (header[0] ?? "").slice(0, 60);
  const title   = (header[1] ?? "").slice(0, 80);

  // Without a company and a role there is nothing worth showing, and a company
  // that reads like a sentence means this comment is not a job post.
  if (!company || !title) return null;
  if (NOT_A_COMPANY.test(company)) return null;

  const remote  = /remote/i.test(text);
  const foreign = FOREIGN_ONLY.test(text);
  const canada  = CANADA_SIGNAL.test(text);

  // Prefer the first real link in the post as the apply URL, and fall back to
  // the comment's permalink on Hacker News so every card is still clickable.
  const link = (comment.text.match(/https?:\/\/[^\s"<)]+/) ?? [])[0]
    ?? `https://news.ycombinator.com/item?id=${comment.id}`;

  return {
    id:                 `hn-${comment.id}`,
    title,
    company,
    location:           canada ? "Remote, Canada/Worldwide" : "Remote",
    workplaceType:      remote ? "Remote" : "",
    salary:             null,
    // The comment timestamp is the real posting date, so the freshness filter
    // treats these exactly like any other dated listing.
    postedAt:           comment.created_at ? new Date(comment.created_at).toISOString() : null,
    url:                link,
    source:             "Hacker News",
    category:           "remote",
    canadaOpen:         foreign ? false : (canada ? true : undefined),
    _canadaSource:      canada && !foreign ? "source" : undefined,
    descriptionSnippet: text.slice(0, 300),
  };
}
