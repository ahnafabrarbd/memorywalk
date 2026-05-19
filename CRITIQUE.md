# critique

## Phase 0 — Scaffold — 2026-05-19

### What was delivered
- Astro 6 project with TypeScript, content collections (walks, pages, people) using the Content Layer API with glob loaders
- Register A layout (Reader.astro): black background, centered image, body text at 52ch, monospace page navigation (01 / 03 — prev · next)
- Register B layout (List.astro): top utility bar with all routes, dense list views, hairline rules, correct palette
- One hand-written 3-page linear walk ("the peripheral route" by test-author) rendering at /walk/test-author/test-walk with working prev/next navigation
- Landing page with recent/curated columns, all stub pages (walks, curated, nexus, people, about, contribute, colophon) rendering in Register B
- site.config.ts as single source for instance-specific values (name, tagline, epigraph, URLs, feature flags)
- README, CONTRIBUTING, CODE_OF_CONDUCT, SELFHOSTING, LICENSE (MIT), LICENSE-CONTENT (CC BY-NC-SA 4.0) all present

### What I'm uncertain about
- The glob loader assigns walk IDs as `author/slug/walk` (3 parts), which required a more defensive lookup pattern. This may cause friction when other code assumes a 2-part ID.
- Content images currently live in both `content/walks/` (canonical) and `public/content-images/` (served). This duplication needs a proper build-time copy strategy before Phase 2.
- The placeholder JPEG files are minimal 1x1 black pixels, not actual 640x480 frames. They validate the pipeline but don't test real image rendering.
- I haven't tested the redirect from `/walk/[author]/[slug]` to `/walk/[author]/[slug]/page/page-001` — Astro's `Astro.redirect()` in static mode may emit a meta-refresh rather than a true redirect.

### What I cut corners on
- Placeholder images are 1x1 JPEGs, not 640x480. A real test walk would show how the reader handles actual image dimensions.
- No build-time image copy script — images are manually duplicated to `public/content-images/`.
- The Astro config is the default empty config. No explicit `site` URL, no output format specified.
- No favicon or meta tags beyond the basics.

### What I'd do differently with hindsight
1. Would investigate the glob loader ID format before writing all the page templates, rather than debugging after build failure.
2. Would set up a proper content-image pipeline from the start (even a simple prebuild script) instead of manual duplication.
3. Would create more realistic placeholder images to validate the reader layout at actual dimensions.

### Open questions for the next phase
- Phase 1 is the 0.3MP processor. Should the visual harness at `/dev/processor` accept drag-and-drop of any image, or should it also include a set of reference test images committed to the repo?
- What reference images should I compare against for the 0.3MP processor acceptance test? Do you have sample output from the actual 0.3MP Camera app (com.dwsh.o3mp)?
- The brief says "custom canvas2D pipeline" — should the processor also work in Node.js (for potential build-time use), or is browser-only acceptable for MVP?

### Red-team prompts
1. "The content-image duplication between content/ and public/ will silently drift. What happens when an author updates an image in content/ but the stale version persists in public/? How does Phase 2 (Decap) handle this?"
2. "You're using Astro's static redirect for the walk entry point. Does this actually work in production on static hosts like Cloudflare Pages or Vercel, or does it emit a meta-refresh that breaks the reading experience?"
3. "The walk ID from the glob loader includes the filename stem ('walk'). Every piece of code that parses walk IDs needs to know this. How many places will break when someone renames the file or changes the glob pattern?"
4. "The Register A layout has no way to return to the walk listing or the site. Is this intentional per the brief, or an oversight? The adaweb reference has no chrome, but it also has a known URL structure readers can navigate manually."
5. "You haven't validated the body word count constraint (<=400 words) at build time. The schema validates frontmatter but not content length. When does this enforcement actually happen?"
