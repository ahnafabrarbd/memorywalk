/**
 * Cloudflare Worker — GitHub OAuth proxy for Decap CMS.
 *
 * Environment variables (set via wrangler secret):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 *
 * Deploy: cd oauth-proxy && npx wrangler deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const authUrl = new URL("https://github.com/login/oauth/authorize");
      authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set("scope", "repo,user");
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code parameter", { status: 400 });
      }

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`OAuth error: ${tokenData.error_description}`, { status: 400 });
      }

      const body = `
        <script>
          (function() {
            function receiveMessage(e) {
              console.log("receiveMessage %o", e);
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({ token: tokenData.access_token, provider: "github" })}',
                e.origin
              );
              window.removeEventListener("message", receiveMessage, false);
            }
            window.addEventListener("message", receiveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })();
        </script>
      `;

      return new Response(body, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
