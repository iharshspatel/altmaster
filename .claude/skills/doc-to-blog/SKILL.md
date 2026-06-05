---
name: doc-to-blog
description: Convert a Google Docs URL into a published AltMaster blog post. Reads the doc via Google Drive, drafts SEO metadata for confirmation, then writes blog/<slug>/index.html, adds the card to the blog index, and updates sitemap.xml. Use when the user pastes a Google Docs link and wants it turned into a blog post.
---

# Google Doc → AltMaster blog post

Turn a Google Docs URL into a fully wired AltMaster blog post that matches the
existing posts under `blog/`. Run from the repo root
(`/Users/harsh/Developer/Shopify Apps/AltMaster`).

## Canonical templates — read these first, every run

The site has no build step; each post is a hand-authored static HTML file. Copy
the structure exactly from these two existing posts (do not invent markup or
classes — they live in `css/shared.css`):

- **`blog/why-your-products-dont-show-up-on-chatgpt/index.html`** — the no-image
  reference: full `<head>` SEO/OG/Twitter/JSON-LD, nav, `article-summary`,
  `article-body`, `key-fact`, `inline-cta`, FAQ blocks, sidebar (TOC + author +
  quick facts), footer, analytics + gtag scripts.
- **`blog/importance-of-alt-text-in-shopify/index.html`** — the with-images
  reference: shows `<figure><img src="cover.png" .../><figcaption>` markup and
  how `og:image` / `twitter:image` / JSON-LD `"image"` point at the per-post
  `cover.png` instead of the global `og-image.jpg`.

Reusable CSS classes already available: `page-article` (body), `article-category`,
`article-summary`, `article-body`, `key-fact`, `inline-cta`, `faq-block`,
`alt-example`, `sidebar`, `sidebar-card`, `toc-list`, `blog-card`, `blog-card-soon`.

## Workflow

### 1. Read the Google Doc

Extract the doc ID from the URL — it's the segment after `/document/d/`:
`https://docs.google.com/document/d/<ID>/edit` → `<ID>`. Then call
`mcp__claude_ai_Google_Drive__read_file_content` with `{ fileId: "<ID>" }`.
If the ID can't be parsed or the file isn't found, fall back to
`mcp__claude_ai_Google_Drive__search_files` using keywords from the URL/title.

Google Drive access is already authorized for this user — no login step needed.

### 2. Draft the metadata (then confirm — do NOT write files yet)

From the doc content, draft and present this block to the user for approval.
Today's date is available in the session context; use it for all dates.

- **slug** — kebab-case, derived from the title, e.g. `how-to-add-alt-text-in-shopify`. Folder will be `blog/<slug>/`.
- **H1 title** + **`<title>` tag** (append ` | AltMaster`) + **og:title** (can be the longer/punchier variant) + **twitter:title** (shorter).
- **meta description** (~150 chars) + **og:description** + **twitter:description**.
- **keywords** meta (comma list).
- **category eyebrow** (e.g. `Strategy · AI Search`, `Guide`) and **blog-card tag** (`Guide` / `Strategy` / `Playbook` …).
- **read time** (estimate ~200 wpm, round to whole minutes).
- **article-summary** — a "Short answer:" lead paragraph.
- **section list** with `id`s for the in-page TOC (the `<h2 id="...">` anchors and matching sidebar `toc-list`).
- **FAQ** — 4–6 Q&A pairs (these go in BOTH the visible `faq-block`s AND the JSON-LD `FAQPage`).
- **quick facts** — 3–4 one-liners for the sidebar.
- **card excerpt** — 1–2 sentences for the blog index card.

Show this draft; incorporate the user's edits before proceeding.

### 3. Ask about images

Ask the user which images the post should have:
- A hero **cover** image (`cover.png`)? Almost always yes.
- Any inline **figures** within the body? If yes, how many and roughly where.

For each requested image, produce a concrete **image-generation prompt** and the
exact **filename + path** it must be saved to (e.g.
`blog/<slug>/cover.png`, `blog/<slug>/<descriptive-name>.png`). The user
generates/pastes the actual image files into that folder — this skill does not
embed binary images. Wire the HTML to reference those filenames now (relative
`src`, with `width`/`height`/`alt`/`figcaption`), and remind the user at the end
which files to drop in.

If the post has a cover, point `og:image`, `twitter:image`, and the JSON-LD
`"image"` at `https://altmaster.io/blog/<slug>/cover.png`. If no images at all,
fall back to the global `https://altmaster.io/og-image.jpg`.

### 4. Write `blog/<slug>/index.html`

Copy the canonical post structure and fill in the drafted content. Checklist —
every item must be correct:

- Relative paths use `../../` depth (post is two levels deep): `../../favicon.svg`, `../../css/shared.css?v=20260527`, `../../js/analytics.js`.
- `<head>`: title, description, keywords, `author` = `Harsh Patel`, canonical = `https://altmaster.io/blog/<slug>/`.
- Open Graph (`og:type` = `article`, url, title, description, image, `article:published_time` = today, `article:author`).
- Twitter card (`summary_large_image`, title, description, image, `twitter:creator` = `@iharshspatel`).
- JSON-LD `@graph` with three nodes: `BlogPosting` (headline, description, datePublished/dateModified = today, url, image, author Harsh Patel → `https://harshspatel.com/`, publisher AltMaster), `BreadcrumbList` (Home → Blog → this post), `FAQPage` (mirrors the visible FAQ exactly).
- Body: nav with `Blog` link `is-active`; `<article>` with `article-category`, H1, `article-meta` (avatar `H`, `Harsh Patel`, date, read time), `article-summary`, `article-body` (figures if any, `h2 id` sections, `key-fact`/`alt-example` where useful, an `inline-cta`, FAQ `faq-block`s).
- Sidebar `aside.sidebar`: "In this article" `toc-list` matching the section ids, author card, quick-facts card.
- Footer + the two trailing `<script>` blocks (the `data-altmaster-placement` click tracker and the gtag `G-DEEZ0Q0H0X` loader) — copy verbatim.
- Keep AltMaster install CTAs with their `data-altmaster-placement` attributes and `apps.shopify.com/alt-text-optimizer` links (carry over the `utm_*` params used in the reference posts).

### 5. Add the card to `blog/index.html`

Insert a new `<a href="/blog/<slug>/" class="blog-card">` as the first card in
`.blog-grid` (newest first, before the `blog-card-soon` placeholders), using the
card tag, title, excerpt, date, and read time from step 2. Then update the
`blog-soon-banner` count text (e.g. "Three posts are live." → "Four posts are
live.") to match the new number of live posts.

### 6. Update `sitemap.xml`

Add a `<url>` entry alongside the other blog posts:

```xml
  <url>
    <loc>https://altmaster.io/blog/<slug>/</loc>
    <lastmod><TODAY></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
```

### 7. Verify and report

- Confirm the new HTML has no leftover template text from the reference post.
- Confirm relative-path depth (`../../`) is correct and JSON-LD is valid JSON.
- Confirm the index card link and sitemap loc both equal `/blog/<slug>/`.
- Report: the new file path, the index/sitemap edits, the banner count change,
  and the list of image files (with paths) the user still needs to paste in.

## Notes

- Do not run a build or start a server — it's a plain static site committed to git.
- Do not commit or push unless the user asks.
- Match the calm, direct voice of the existing posts; preserve the doc's actual
  content and headings rather than rewriting wholesale.
