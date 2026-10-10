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
    const publicHostname = url.hostname;
    const origin = ORIGINS[publicHostname];

    if (origin === undefined) {
      return new Response("Unknown host", { status: 404 });
    }

    // fetch() derives the outbound Host from the URL; it cannot be set as a header.
    url.hostname = origin;

    // The parsed hostname rather than the raw Host header: it is lowercase
    // and has no port, which the exact matches in Django's ALLOWED_HOSTS and
    // the frontend's canonical-host redirect depend on.
    const proxied = new Request(url.toString(), request);
    proxied.headers.set("X-Forwarded-Host", publicHostname);

    // Returned untouched: rebuilding headers can fold the access and refresh
    // Set-Cookie headers into one. no-store keeps authenticated responses
    // out of Cloudflare's cache.
    return fetch(proxied, { cache: "no-store" });
  },
};
