---
name: doc-to-blog
description: Convert a Google Docs URL into a published AltMaster blog post. Reads the doc via Google Drive, drafts SEO metadata for confirmation, then writes a single Jekyll post at _posts/<date>-<slug>.md. The blog index and sitemap update themselves. Use when the user pastes a Google Docs link and wants it turned into a blog post.
---

# Google Doc → AltMaster blog post (Jekyll)

Turn a Google Docs URL into a published AltMaster blog post. The site is a
**Jekyll** site (GitHub Pages builds it on push). A post is now a single
Markdown-with-frontmatter file — you do NOT hand-write the page chrome, the
blog index card, or the sitemap entry. Those are all generated:

- `_layouts/post.html` renders the full `<head>` (SEO/OG/Twitter/JSON-LD),
  nav, article shell, sidebar (TOC + author + quick facts), footer, and the
  analytics/gtag scripts — from your frontmatter.
- `blog/index.html` loops `site.posts`, so publishing a post lists it
  automatically (from `card_tag` / `card_title` / `card_excerpt` / `date` /
  `read_time`).
- `sitemap.xml` loops `site.posts`, so the URL is added automatically.

Run from the repo root (`/Users/harsh/Developer/Shopify Apps/AltMaster`).

## Canonical references — read these first, every run

- **`_layouts/post.html`** — the layout. Read it to see exactly which
  frontmatter keys it consumes and how (cascades, defaults, TOC auto-build,
  FAQ rendering, schema). Your frontmatter is the contract with this file.
- **`_posts/2026-05-30-why-your-products-dont-show-up-on-chatgpt.md`** — the
  no-image reference (uses the global og-image, so no `image:` key).
- **`_posts/2026-06-05-how-to-add-images-in-shopify.md`** — the with-images
  reference (cover + inline `step-N.webp` figures, and an `image:` key).

Reusable body classes (styled in `css/shared.css` and `_layouts/post.html`,
do not invent new ones): `key-fact`, `inline-cta`, `alt-example`, `spec-card`,
plus standard `figure`/`figcaption`/`code`. Page chrome classes belong to the
layout — never put them in a post body.

## Workflow

### 1. Read the Google Doc

Extract the doc ID from the URL — the segment after `/document/d/`:
`https://docs.google.com/document/d/<ID>/edit` → `<ID>`. Then call
`mcp__claude_ai_Google_Drive__read_file_content` with `{ fileId: "<ID>" }`.
If the ID can't be parsed or the file isn't found, fall back to
`mcp__claude_ai_Google_Drive__search_files` using keywords from the URL/title.
Google Drive access is already authorized — no login step.

### 2. Draft the metadata (then confirm — do NOT write the file yet)

From the doc, draft and present this block for approval. Use today's date
(from session context) for the post date.

- **slug** — kebab-case from the title (e.g. `how-to-add-alt-text-in-shopify`).
  The file will be `_posts/<today>-<slug>.md` and the live URL `/blog/<slug>/`.
- **title** — the main headline / H1 (this becomes `title:` and the default
  `og:title`; it's also the default for the index card and the schema headline).
- **seo_title** — the `<title>` tag text; append ` | AltMaster`.
- **tw_title** — a shorter Twitter-card variant (optional; defaults to `title`).
- **og_title** — only if it should differ from `title` (optional).
- **description** + **og_description** + **tw_description** (~150 chars each;
  og/tw optional, they default to `description`).
- **schema_description** — optional longer variant for JSON-LD (defaults to
  `description`).
- **keywords** — comma list.
- **category** — eyebrow above the H1 (e.g. `Guide · Shopify SEO`).
- **card_tag** — short tag for the index card (`Guide` / `Strategy` / …).
- **card_title** — ONLY if the index card should read differently from `title`
  (otherwise omit; the index falls back to `title`).
- **card_excerpt** — 1–2 sentences for the index card.
- **read_time** — estimate at ~200 wpm, round to whole minutes (e.g. `6 min read`).
- **summary** — the "Short answer:" lead paragraph, as a Markdown string
  (e.g. `"**Short answer:** …"`). Rendered via `markdownify`.
- **toc** — list of `{ num: "01", label: "...", anchor: "..." }` with concise
  sidebar labels; each `anchor` must match an `<h2 id="...">` in the body.
  (Optional — if omitted, the layout auto-builds the TOC from the body's
  `<h2 id>`s using their full text and appends a FAQs entry. Explicit `toc`
  gives shorter labels, so prefer it.)
- **quick_facts** — 3–4 items `{ text: "..." }`; add `href: "#anchor"` to make
  one a link.
- **faq** — 4–6 `{ q: "...", a: "..." }` pairs. These render as the visible
  FAQ section AND the JSON-LD `FAQPage` automatically — put them ONLY in
  frontmatter, never in the body. Answers are Markdown (use `` `backticks` ``
  for inline code).

Show this draft; incorporate edits before writing.

### 3. Ask about images

Ask which images the post needs:
- A hero **cover** (`cover.webp`)? Usually yes.
- Inline **figures** in the body? If so, how many and roughly where.

Assets live in **`blog/<slug>/`** (the same folder the live URL serves from),
so the body references them with a **relative `src`** (e.g. `src="cover.webp"`,
`src="step-1.webp"`). For each image, give the user a concrete
generation prompt and the exact path to drop the file
(`blog/<slug>/cover.webp`, `blog/<slug>/<name>.webp`). This skill does not
embed binaries — wire the `<figure>`/`<img>` markup (with `width`/`height`/
`alt`/`figcaption`) now and remind the user which files to add.

If the post has a cover, set `image:` in frontmatter to the absolute URL
`https://altmaster.io/blog/<slug>/cover.webp`. If there are NO images, OMIT
`image:` entirely — the layout falls back to the global `og-image.jpg`.

### 4. Write `_posts/<today>-<slug>.md`

Structure: YAML frontmatter, then the body as HTML. Rules:

- **Frontmatter**: the keys from step 2, double-quoted scalars, `layout: post`
  first and `date: <YYYY-MM-DD>` unquoted. Match the field style of the
  reference posts.
- **Body** = the article content ONLY: intro `<p>`s, `<h2 id="...">`/`<h3>`
  sections matching the TOC anchors, `<figure>` images, and where useful
  `key-fact` / `alt-example` / `spec-card` blocks and one `inline-cta`. Keep
  AltMaster CTAs pointing at `apps.shopify.com/alt-text-optimizer` with their
  `data-altmaster-placement` attributes and `utm_*` params (see references).
- **Do NOT include**: `<!doctype>`/`<html>`/`<head>`, nav, sidebar, footer,
  `<script>`s, any per-post `<style>` block, the `article-summary` wrapper
  (that's the `summary:` field), or the FAQ section (that's the `faq:` field —
  the layout adds `<h2 id="faqs">` and renders it).
- **Indentation**: write body tags starting at column 0 (top-level elements
  flush-left, nested children stepped by 2 spaces) so kramdown passes the HTML
  through cleanly. See the reference posts.
- **Quotes**: keep straight quotes/apostrophes (the site's kramdown config
  preserves them), matching the existing posts.

### 5. Verify and report

- Frontmatter is valid YAML; every `toc` anchor has a matching `<h2 id>` in the
  body; `faq` and `summary` live in frontmatter (not the body).
- Body contains no page chrome, no `<style>`, and no FAQ blocks.
- Any in-article images use relative `src` and the cover (if any) is reflected
  in `image:`.
- Report: the new file path, the resolved live URL (`/blog/<slug>/`), and the
  list of image files (with `blog/<slug>/…` paths) the user still needs to add.

## Notes

- No build/server step here — GitHub Pages builds Jekyll on push. The blog
  index and sitemap update themselves from the posts collection; do NOT edit
  `blog/index.html` or `sitemap.xml` by hand.
- Do not commit or push unless the user asks.
- Match the calm, direct voice of the existing posts; preserve the doc's actual
  content and headings rather than rewriting wholesale.
