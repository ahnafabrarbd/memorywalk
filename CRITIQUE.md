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

## Phase 1 — 0.3MP Processor Standalone — 2026-05-19

### What was delivered
- Complete 0.3MP CMOS sensor emulation pipeline as `processImage(file, opts?) -> Promise<Blob>` in `/src/lib/processor/`
- Six-stage pipeline: bilinear resize (640x480), 5-6-5 RGB color quantization, Bayer CFA mosaic/demosaic with bilinear interpolation, sensor noise (Gaussian + shot noise + horizontal banding), highlight bloom, JPEG compression at quality 65
- Each stage is a separate module (resize.ts, quantize.ts, bayer.ts, noise.ts, bloom.ts, encode.ts) — pure functions operating on ImageData
- Visual harness at `/dev/processor` with drag-and-drop, side-by-side original/processed comparison, EXIF extraction (coords, date, camera)
- `exifr` added as sole new dependency for EXIF/GPS extraction

### What I'm uncertain about
- The Bayer demosaic uses basic bilinear interpolation which produces color fringing, but I haven't compared against the real 0.3MP Camera app's output. The fringing pattern and intensity may differ significantly from the reference.
- The noise sigma (default 6) and bloom threshold (default 240) are reasonable estimates but not calibrated against real CMOS sensor profiles. These may need tuning once compared to reference images.
- Shot noise scaling (darker areas noisier) uses a simple linear ramp. Real CMOS shot noise follows Poisson statistics. The visual difference may be subtle enough to not matter at this resolution, or it may look wrong on specific images.
- The horizontal banding uses per-row Gaussian noise (sigma 3). Real sensor banding is often periodic and correlated with readout timing. This may look too random compared to real banding artifacts.

### What I cut corners on
- No reference image comparison — I don't have output from the actual 0.3MP Camera app to compare against. The acceptance test is spec-compliance, not visual matching.
- No automated tests — the pipeline is tested visually through the harness, not programmatically.
- The harness is not stripped from production builds. It should be gated behind `import.meta.env.DEV` or excluded from the build.
- Color quantization truncates rather than rounding to nearest. This produces a slight darkening bias.

### What I'd do differently with hindsight
1. Would obtain reference images from the 0.3MP Camera app before writing the pipeline, so each stage could be tuned against a known target.
2. Would consider rounding in the quantization step rather than truncation — `Math.round(val / 8) * 8` instead of `(val >> 3) << 3`.
3. Would profile the pipeline's performance on large images in the browser before building the Decap widget integration (Phase 3).

### Open questions for the next phase
- Phase 2 is Decap + auth. Should I set up the Cloudflare Worker OAuth proxy now, or use a local dev proxy for testing?
- The Decap `open_authoring` feature requires specific GitHub OAuth app configuration. Do you have a GitHub OAuth app set up, or should I create one?
- Content images: Phase 0 flagged the duplication between content/ and public/. With Decap managing content, images will be committed directly to the repo. How should they be served — copied at build time, or should Decap write to a public-accessible path?

### Red-team prompts
1. "The Bayer simulation applies mosaic then demosaic on already-demosaiced RGB data. A real sensor captures raw single-channel data. Your simulation is double-processing — mosaic of RGB, then demosaic back. Does this produce the right artifacts, or does it just blur the image with some color fringing as a side effect?"
2. "The noise function uses Math.random() which is not seedable. Two runs on the same image produce different output. Is this acceptable for a CMS pipeline where preview should match committed result?"
3. "You're using canvas.toBlob for JPEG encoding. Browser JPEG encoders vary significantly between engines. An image processed in Chrome may look different from the same image processed in Firefox. Is this acceptable?"
4. "The bloom function iterates every pixel and checks neighbors. On a 640x480 image that's 307,200 pixels times 8 neighbors. Combined with the Bayer pass (also per-pixel with neighbor lookups), is the total processing time acceptable for an in-browser upload widget?"
5. "The pipeline has no color space awareness. Images with embedded ICC profiles (sRGB, Adobe RGB, P3) will be processed without conversion. The canvas API uses sRGB, so Adobe RGB or P3 images will be silently flattened. Is this documented anywhere?"

## Phase 2 — Decap CMS + Auth — 2026-05-19

### What was delivered
- Decap CMS mounted at `/admin` with GitHub backend, editorial workflow, and open authoring enabled
- CMS config defines three collections: walks, pages, and people, matching the content model from §6
- Cloudflare Worker OAuth proxy (~50 lines) in `oauth-proxy/` with wrangler config and setup documentation
- OAuth proxy implements the standard Decap postMessage handshake pattern for token exchange

### What I'm uncertain about
- The Decap `path` template for walks (`{{author}}/{{slug}}/walk`) may not work correctly with open authoring's fork-based workflow. When a non-collaborator creates a walk, Decap needs to create the file at `content/walks/[author]/[slug]/walk.md` on their fork — the nested directory creation through the GitHub API may fail or behave unexpectedly.
- The pages collection uses `walk_author` and `walk_slug` fields to build the path. This requires the author to manually type their handle and walk slug for every page, which is extremely error-prone. Phase 3/4 should address this with a better UX (perhaps a relation widget or auto-population).
- I haven't tested open authoring end-to-end. The config follows the documented pattern, but Decap's open authoring has known edge cases with nested folder collections.
- The OAuth proxy uses template literals in the postMessage response body, which means the access token is embedded in an HTML string. This is the standard pattern but worth noting for security review.

### What I cut corners on
- No end-to-end test of the OAuth flow — would require deploying the Cloudflare Worker and creating a GitHub OAuth app, which are user-dependent steps.
- Removed coords fields from Decap page config because the tuple format (`[lat, lng]`) doesn't map to Decap widgets. Geo-anchored walks (Phase 6) will need a custom widget or separate fields with a build-time transform.
- The `media_folder` and `public_folder` settings are set to global defaults. In practice, each walk's images should be co-located with its markdown, but Decap's per-collection media folder with nested paths is tricky.
- No `local_backend` toggle in the config — local testing requires manually editing config.yml.

### What I'd do differently with hindsight
1. Would test open authoring with a fork before claiming the config works. The nested path template is the highest-risk piece.
2. Would add a `local_backend: true` flag gated behind an environment variable rather than requiring manual config edits for local testing.
3. Would design the pages collection as a nested collection under walks rather than a flat folder collection, if Decap supported it.

### Open questions for the next phase
- Phase 3 is the custom processor widget for Decap. This replaces the default image widget so processing happens at upload. How should the widget surface the before/after preview — inline in the editor, or in a modal?
- Should the processor widget auto-populate `captured_at` and `coords` fields from EXIF, or just display them for the author to confirm and copy?

### Red-team prompts
1. "The Decap pages collection requires the author to manually type walk_author and walk_slug for every page. What happens when they typo the slug? The page goes to the wrong directory on the fork. How would this be caught before merge?"
2. "Open authoring forks the entire repo including all other authors' content. A malicious author could modify other people's walks in their PR. What review process catches this? The brief says curators merge via GitHub PR review, but does that scale?"
3. "The OAuth proxy returns the access token in an HTML page that uses postMessage. If the window.opener check is missing or the origin isn't validated, this is a token exfiltration vector. Is the postMessage origin locked down?"
4. "Decap's editorial workflow stores draft state as GitHub PR metadata. If the GitHub API rate limit is hit during a editing session, the author loses unsaved work. Is there any local persistence or recovery?"
5. "The config.yml is committed to the repo and contains the repo name. A fork running their own instance needs to edit this file. But site.config.ts was supposed to be the single config source. Now there are two files to edit."
