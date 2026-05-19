# prompt changelog

## 2026-05-19 — Aesthetic pivot, single-author simplification, new features

Changed: §2 (architecture), §3 (visual registers — fully replaced), §4 (routes — minor), §5 (deferred signup — removed), §7 (walk structures — minor addition), §10 (map — pending Weather Journal input). New §20 (node-graph sketch tool). New §21 (front-page editor). §18 (phasing — revised).

Why: Phase 0 produced an unworkably small, muted layout. The Are.na structural reference is still correct — list-based IA, channels-and-blocks logic, walks-as-containers — but the skin needs to flip from minimal-dark to maximalist net-art. Concurrently, the multi-user auth layer is being deferred (overhead serving a future capability, not current need), which simplifies several systems. Three new requirements emerged: click-to-advance navigation; an editor on the front page; a node-graph sketch tool per walk.

Implications for in-flight work: Phase 0 needs to be redone against the new §3. Most scaffolding (Astro, content collections, file structure) can be kept; the visual layer needs to be rebuilt. Phases 2/3/7/9 (Decap, OAuth, curators, deferred signup) are removed. New phases 2 (editor), 4 (sketch tool), 6 (map from Weather Journal) added.
