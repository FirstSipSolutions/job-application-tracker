/*
 * Title and stack patterns for the job filter.
 * Kept separate so the filter logic stays short and these lists stay
 * easy to scan and extend.
 */

// Titles that are not dev roles. Checked first - any match drops the job.
export const NON_DEV = [
  /\bproduct\s+(manager|designer|owner)\b/i,
  /\b(ux|ui|graphic|visual|brand|motion)\s+designer\b/i,
  /\bdesigner\b/i,                          // lone "Designer" title
  /\bdata\s+(analyst|scientist)\b/i,
  /\b(business|systems|financial)\s+analyst\b/i,
  /\b(technical|sales|talent)\s+(recruiter|sourcer)\b/i,
  /\brecruiter\b/i,
  /\bscrum\s+master\b/i,
  /\bproject\s+manager\b/i,
  /\bprogram\s+manager\b/i,
  /\bmarketing\b/i,
  /\bcopywriter\b/i,
  /\bcontent\s+(strategist|writer|manager|creator)\b/i,
  /\bsocial\s+media\b/i,
  /\bsales\s+(manager|representative|executive|director)\b/i,
  /\boperations\s+manager\b/i,
  /\bfinance\s+manager\b/i,
  /\baccountant\b/i,
  /\blegal\s+counsel\b/i,
  /\bhuman\s+resources\b/i,
  // Management / non-IC
  /\bengineering\s+manager\b/i,
  /\btechnical\s+writer\b/i,
  /\bdeveloper\s+(relations|advocate|evangelist)\b/i,
  /\bcustomer\s+success\b/i,
  /\baccount\s+(executive|manager)\b/i,
  // Non-software engineering disciplines
  /\bcontrol\s+(?:&|and)\s+automation\b/i,
  /\belectrical\s+engineer\b/i,
  /\bmechanical\s+engineer\b/i,
  /\bcivil\s+engineer\b/i,
  /\bchemical\s+engineer\b/i,
  /\bindustrial\s+engineer\b/i,
  /\bprocess\s+engineer\b/i,
  /\bmanufacturing\s+engineer\b/i,
  /\bstructural\s+engineer\b/i,
  /\benvironmental\s+engineer\b/i,
  /\bfield\s+engineer\b/i,
  /\bin\s+training\b/i,
];

// Dev-role titles. A job must match at least one of these to pass.
export const DEV_ROLE = [
  // Core engineer / developer titles
  /\b(software|web|application|app)\s+(engineer|developer)\b/i,
  // Specialisations
  /\bfull[- ]?stack\b/i,
  /\bfront[- ]?end\s*(engineer|developer|dev)?\b/i,
  /\bback[- ]?end\s*(engineer|developer|dev)?\b/i,
  // Framework / language (must pair with engineer or developer to avoid
  // matching company names like "React Ventures" or "Python Capital")
  /\b(react|vue|angular|next\.?js|nuxt|svelte)\s+(engineer|developer)\b/i,
  /\b(node(\.js)?|express|django|rails|laravel|spring|fastapi)\s+(engineer|developer)\b/i,
  /\b(python|typescript|javascript|golang|go|rust|java|kotlin|swift|php|ruby|elixir|scala)\s+(engineer|developer)\b/i,
  // QA / Testing - "automation" alone is too broad (matches industrial/control automation)
  /\b(qa|quality\s+assurance)\s+engineer\b/i,
  /\btest\s+(automation\s+)?engineer\b/i,
  /\bqa\s+automation\b/i,
  /\bsdet\b/i,
  // DevOps / Infra
  /\bdevops\s+engineer\b/i,
  /\bsite\s+reliability\b/i,
  /\bsre\b/i,
  /\bplatform\s+engineer\b/i,
  /\bcloud\s+engineer\b/i,
  /\binfrastructure\s+engineer\b/i,
  // Architect
  /\b(software|solutions|technical|cloud|enterprise)\s+architect\b/i,
  // Mobile
  /\b(ios|android|mobile)\s+(engineer|developer)\b/i,
  /\breact\s+native\s+(engineer|developer)\b/i,
  /\bflutter\s+(engineer|developer)\b/i,
  // Seniority prefixes - safe to allow without a specialisation qualifier
  /\b(staff|principal|distinguished)\s+(engineer|developer|software)\b/i,
  // Adjacent engineering roles
  /\b(embedded|firmware)\s+engineer\b/i,
  /\bsecurity\s+engineer\b/i,
  /\bapplication\s+security\b/i,
  /\bdata\s+engineer\b/i,
  /\b(ml|machine\s+learning|ai)\s+engineer\b/i,
  // Startup / modern titles
  /\bfounding\s+(engineer|developer)\b/i,
  /\bproduct\s+engineer\b/i,
  /\btech(nical)?\s+lead\b/i,
  /\bgrowth\s+engineer\b/i,
  /\bintegration\s+(engineer|developer)\b/i,
  // Implementation / solutions roles that are hands-on technical
  /\bsolutions\s+engineer\b/i,
  /\bsoftware\s+systems\s+engineer\b/i,
  // Blockchain / web3
  /\b(blockchain|web3|smart\s+contract|solidity)\s+(engineer|developer)\b/i,
  // Broader "engineer" when paired with a tech domain word
  /\b(api|backend|distributed\s+systems|identity|iam)\s+engineer\b/i,
];

// Primary stack buckets used for the filter dropdown. First match wins.
export const TECH_STACKS = {
  React:    /\breact\b|\bjsx\b|\bnext\.?js\b/i,
  Vue:      /\bvue\b|\bnuxt\b/i,
  Angular:  /\bangular\b/i,
  Python:   /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i,
  Node:     /\bnode\b|\bnest\.?js\b|\bexpress\b/i,
  TypeScript: /\btypescript\b|\bts\b/i,
  Go:       /\bgolang\b|\bgo\s+(developer|engineer|programmer)/i,
  Rust:     /\brust\b/i,
  Java:     /\bjava\b|\bspring\b|\bkotlin\b/i,
  Mobile:   /\bios\b|\bandroid\b|\bswift\b|\bflutter\b|\breact\s+native\b/i,
  DevOps:   /\bdevops\b|\bsre\b|\bkubernetes\b|\baws\b|\bgcp\b|\bazure\b|\bplatform\b|\binfrastructure\b/i,
  Data:     /\bdata\s+engineer\b|\bml\s+engineer\b|\bmachine\s+learning\b|\bai\s+engineer\b/i,
};

// Broader display tags for the specific tools TECH_STACKS lumps together.
export const TAG_PATTERNS = [
  ["React",       /\breact\b(?!\s+native)/i],
  ["Next.js",     /\bnext\.?js\b/i],
  ["Vue",         /\bvue\b|\bnuxt\b/i],
  ["Angular",     /\bangular\b/i],
  ["TypeScript",  /\btypescript\b/i],
  ["JavaScript",  /\bjavascript\b|\bjs\b/i],
  ["Node",        /\bnode(\.js)?\b|\bexpress\b|\bnest\.?js\b/i],
  ["Python",      /\bpython\b|\bdjango\b|\bfastapi\b|\bflask\b/i],
  ["Go",          /\bgolang\b|\bgo\b/i],
  ["Rust",        /\brust\b/i],
  ["Java",        /\bjava\b(?!script)/i],
  ["Kotlin",      /\bkotlin\b/i],
  ["Swift",       /\bswift\b/i],
  ["React Native",/\breact\s+native\b/i],
  ["Flutter",     /\bflutter\b/i],
  ["AWS",         /\baws\b|\bamazon\s+web\s+services\b/i],
  ["GCP",         /\bgcp\b|\bgoogle\s+cloud\b/i],
  ["Azure",       /\bazure\b/i],
  ["Docker",      /\bdocker\b/i],
  ["Kubernetes",  /\bkubernetes\b|\bk8s\b/i],
  ["GraphQL",     /\bgraphql\b/i],
  ["PostgreSQL",  /\bpostgres(ql)?\b/i],
  ["MongoDB",     /\bmongo(db)?\b/i],
  ["Redis",       /\bredis\b/i],
];
