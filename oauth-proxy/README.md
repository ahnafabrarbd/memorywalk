# memorywalk OAuth proxy

Cloudflare Worker that handles GitHub OAuth for Decap CMS.

## Setup

1. Create a GitHub OAuth App at https://github.com/settings/developers
   - Application name: memorywalk
   - Homepage URL: your site URL
   - Authorization callback URL: `https://<your-worker>.workers.dev/callback`

2. Install wrangler if needed:
   ```
   npm install -g wrangler
   ```

3. Deploy the worker:
   ```
   cd oauth-proxy
   npx wrangler deploy
   ```

4. Set secrets:
   ```
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

5. Update `public/admin/config.yml` to add your worker URL:
   ```yaml
   backend:
     name: github
     repo: ahnafabrarbd/memorywalk
     branch: main
     base_url: https://<your-worker>.workers.dev
     auth_endpoint: /auth
   ```

## Local development

For local testing without deploying the worker, use Decap's local backend:

```
npx decap-server
```

Then temporarily change `config.yml` backend to:

```yaml
backend:
  name: git-gateway
local_backend: true
```
