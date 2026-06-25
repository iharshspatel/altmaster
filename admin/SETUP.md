# Blog CMS — one-time setup

The web CMS lives at **https://altmaster.io/admin/**. A blogger logs in with
GitHub, writes a post, clicks Publish, and it goes live in ~1 minute. No code,
no terminal, founder not involved.

Two pieces need your accounts to wire up the "Sign in with GitHub" handshake
(GitHub Pages can't do it alone). You do this **once**.

---

## 1. Create a GitHub OAuth App  (~3 min)

1. Go to **https://github.com/settings/developers** → **OAuth Apps** → **New OAuth App**.
2. Fill in:
   - **Application name:** `AltMaster Blog CMS`
   - **Homepage URL:** `https://altmaster.io`
   - **Authorization callback URL:** `https://altmaster-cms-auth.YOURNAME.workers.dev/callback`
     (you'll get the real worker subdomain in step 2 — come back and fix this if needed)
3. Click **Register application**.
4. Copy the **Client ID**. Click **Generate a new client secret** and copy the **secret**.
   Keep both for step 2.

---

## 2. Deploy the auth worker on Cloudflare  (~5 min, free)

This is the tiny official `sveltia-cms-auth` service. Easiest path is the
1-click deploy:

1. Open **https://github.com/sveltia/sveltia-cms-auth** and click the
   **"Deploy to Cloudflare Workers"** button (creates a free Cloudflare account
   if you don't have one).
2. After it deploys, open the worker in the Cloudflare dashboard →
   **Settings → Variables** and add these (mark them **Encrypt**):
   - `GITHUB_CLIENT_ID` = the Client ID from step 1
   - `GITHUB_CLIENT_SECRET` = the secret from step 1
   - `ALLOWED_DOMAINS` = `altmaster.io`
3. Note the worker URL, e.g. `https://sveltia-cms-auth.YOURNAME.workers.dev`.
4. Go back to the GitHub OAuth App (step 1) and make sure the **callback URL** is
   exactly `<that worker URL>/callback`.

---

## 3. Point the CMS at the worker  (1 line)

In **`admin/config.yml`**, set:

```yaml
backend:
  base_url: https://sveltia-cms-auth.YOURNAME.workers.dev
```

(use your real worker URL, no trailing slash). Commit + push.

---

## 4. Give the blogger access  (~1 min)

1. The blogger creates a free GitHub account if they don't have one.
2. Repo **Settings → Collaborators → Add people** → invite them with **Write** access.
3. They accept the email invite. Done.

---

## That's it

Send the blogger to **https://altmaster.io/admin/**. They click
**"Sign in with GitHub"** once, then just use the form. Every post they publish
commits to `_posts/` and appears on the blog automatically — the index and
sitemap update themselves.

### Notes
- Uploaded images go to `blog/uploads/`. Existing posts keep their own images.
- The form omits a "table of contents" field on purpose — the page builds the
  TOC from the Heading 2s in the body automatically.
- To change which fields the blogger sees, edit `admin/config.yml`.
