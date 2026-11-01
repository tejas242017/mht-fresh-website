const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
function authorized(request, env) {
  const expected = env.MHT_MEDIA_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization") || "";
  if (!expected || !supplied.startsWith("Bearer ")) return false;
  const token = supplied.slice(7);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!env.UNSPLASH_ACCESS_KEY) return json({ error: "Unsplash Access Key is not configured on the server." }, 503);
  const url = new URL(request.url);
  const query = (url.searchParams.get("query") || "").trim().slice(0, 120);
  const page = Math.max(1, Math.min(20, Number(url.searchParams.get("page") || 1)));
  if (!query) return json({ error: "Enter a search keyword." }, 400);
  const upstream = new URL("https://api.unsplash.com/search/photos");
  upstream.searchParams.set("query", query);
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("per_page", "24");
  upstream.searchParams.set("content_filter", "high");
  const response = await fetch(upstream, {
    headers: { Authorization: "Client-ID " + env.UNSPLASH_ACCESS_KEY, "Accept-Version": "v1" }
  });
  if (!response.ok) {
    const body = await response.text();
    return json({ error: "Unsplash API request failed.", upstreamStatus: response.status, detail: body.slice(0, 500) }, response.status === 429 ? 429 : 502);
  }
  const payload = await response.json();
  const results = (payload.results || []).map(photo => ({
    id: photo.id,
    description: photo.alt_description || photo.description || "",
    width: photo.width, height: photo.height,
    color: photo.color,
    urls: { thumb: photo.urls?.small, preview: photo.urls?.regular, full: photo.urls?.full },
    photographer: photo.user?.name || photo.user?.username || "Unknown photographer",
    photographerUsername: photo.user?.username || "",
    photographerUrl: photo.user?.links?.html || "",
    photoUrl: photo.links?.html || "",
    downloadLocation: photo.links?.download_location || ""
  }));
  return json({ total: payload.total || 0, totalPages: payload.total_pages || 0, page, results });
}
