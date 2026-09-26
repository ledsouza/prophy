// Cloud Run in southamerica-east1 has no domain mapping, and a plain proxied
// CNAME forwards the public Host, which Google's edge answers with a 404.
// Keep the keys in sync with the custom domains in wrangler.toml.
const ORIGINS = {
  "api.phystack.com.br": "prophy-backend-341810477176.southamerica-east1.run.app",
  "portal.phystack.com.br": "prophy-frontend-341810477176.southamerica-east1.run.app",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = ORIGINS[url.hostname];

    if (origin === undefined) {
      return new Response("Unknown host", { status: 404 });
    }

    // fetch() derives the outbound Host from the URL; it cannot be set as a header.
    url.hostname = origin;

    const proxied = new Request(url.toString(), request);
    proxied.headers.set("X-Forwarded-Host", request.headers.get("Host"));

    // Returned untouched: rebuilding headers can fold the access and refresh
    // Set-Cookie headers into one. no-store keeps authenticated responses
    // out of Cloudflare's cache.
    return fetch(proxied, { cache: "no-store" });
  },
};
