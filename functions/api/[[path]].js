// Server-side proxy to the OTA worker. The browser never sees the API key:
// it lives in the OTA_API_KEY Pages secret (set via `wrangler pages secret put`).
// Path allowlist = version list + stable firmware binaries only.

const UPSTREAM = "https://esp-ota.ryan-charles.workers.dev";
const ALLOWED = /^stable\/(versions$|[A-Za-z0-9._-]+\.bin$)/;

export async function onRequestGet(context) {
  const path = (context.params.path ?? []).join("/");
  if (!ALLOWED.test(path)) {
    return new Response("Not found", { status: 404 });
  }
  if (!context.env.OTA_API_KEY) {
    return new Response("Proxy not configured", { status: 503 });
  }
  const upstream = await fetch(`${UPSTREAM}/${path}`, {
    headers: { "X-API-Key": context.env.OTA_API_KEY },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "no-store",
    },
  });
}
