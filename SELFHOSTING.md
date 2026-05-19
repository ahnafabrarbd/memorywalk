# self-hosting memorywalk

this guide walks through running your own instance of memorywalk.

## prerequisites

- a GitHub account
- node.js >= 22
- a Cloudflare account (free tier, for the OAuth proxy)
- a static hosting provider (Vercel, Cloudflare Pages, Netlify, or any static host)
- (optional) a Pinata account for IPFS pinning

## 1. fork the repository

fork `github.com/ahnafabrarbd/memorywalk` to your own GitHub account.

```bash
git clone https://github.com/YOUR_USERNAME/memorywalk.git
cd memorywalk
npm install
```

## 2. configure your instance

edit `site.config.ts` — this is the single file that defines your instance:

```ts
export const siteConfig = {
  name: "your-instance-name",
  tagline: "your tagline",
  epigraph: "your epigraph text",
  url: "https://your-domain.com",
  repoUrl: "https://github.com/YOUR_USERNAME/memorywalk",
  ipfs: {
    enabled: false,
    gateway: "https://gateway.pinata.cloud/ipfs",
  },
  curatorsFile: "./curators.json",
};
```

## 3. update Decap CMS config

edit `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/memorywalk   # <-- your fork
  branch: main
  base_url: https://YOUR_WORKER.workers.dev   # <-- your OAuth proxy (step 4)
  auth_endpoint: /auth
  open_authoring: true
```

## 4. set up GitHub OAuth app

1. go to https://github.com/settings/developers
2. click "New OAuth App"
3. fill in:
   - application name: your instance name
   - homepage URL: your site URL
   - authorization callback URL: `https://YOUR_WORKER.workers.dev/callback`
4. save the Client ID and Client Secret

## 5. deploy the OAuth proxy

```bash
cd oauth-proxy
npm install -g wrangler   # if not already installed
npx wrangler login
npx wrangler deploy
```

set the secrets:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
# paste your Client ID

npx wrangler secret put GITHUB_CLIENT_SECRET
# paste your Client Secret
```

note the worker URL (e.g., `https://memorywalk-oauth.YOUR_ACCOUNT.workers.dev`) and update `config.yml` (step 3).

## 6. configure curators

edit `curators.json` at the project root. add the GitHub handles of users who should be able to curate walks:

```json
["your-github-handle", "other-curator"]
```

copy it to `public/`:

```bash
cp curators.json public/curators.json
```

curators also need write access to your GitHub repository (Settings > Collaborators).

## 7. deploy the site

### vercel

```bash
npm install -g vercel
vercel
```

### cloudflare pages

connect your repo in the Cloudflare dashboard. build command: `npm run build`. output directory: `dist`.

### any static host

```bash
npm run build
# upload the contents of dist/
```

## 8. remove test content

delete the test walks and author:

```bash
rm -rf content/walks/test-author
rm content/people/test-author.md
rm -rf public/content-images/test-author
```

## 9. (optional) enable IPFS pinning

1. create a free account at https://www.pinata.cloud
2. get your API Key and Secret Key
3. in your GitHub repo settings, add repository variables and secrets:
   - variable: `IPFS_ENABLED` = `true`
   - secret: `PINATA_API_KEY` = your key
   - secret: `PINATA_SECRET_KEY` = your secret
4. in `site.config.ts`, set `ipfs.enabled: true`

images will be pinned to IPFS automatically when pushed to main.

to disable: set `IPFS_ENABLED` variable to `false` (or remove it), set `ipfs.enabled: false` in `site.config.ts`, and optionally delete `.github/workflows/ipfs-pin.yml`.

## 10. verify

```bash
npm run dev
```

visit `http://localhost:4321` — you should see your instance name and empty walk lists. visit `/admin` to test the login flow.

## what lives where

| file | purpose |
|---|---|
| `site.config.ts` | instance name, URLs, feature flags |
| `public/admin/config.yml` | Decap CMS backend config (repo, OAuth URL) |
| `curators.json` | curator GitHub handles |
| `oauth-proxy/` | Cloudflare Worker for GitHub OAuth |
| `content/` | all walks, pages, and author profiles |

## troubleshooting

**OAuth login fails**: check that the callback URL in your GitHub OAuth App matches your worker URL exactly (`https://WORKER.workers.dev/callback`).

**images not showing**: run `npm run build` — the prebuild script copies images from `content/` to `public/content-images/`. during development, you may need to copy manually or restart the build.

**Decap can't find the repo**: verify the `repo` field in `config.yml` matches your fork (`USERNAME/memorywalk`).
