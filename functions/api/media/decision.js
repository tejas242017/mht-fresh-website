const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
function authorized(request, env) {
  const expected = env.MHT_MEDIA_ADMIN_TOKEN, supplied = request.headers.get("authorization") || "";
  if (!expected || !supplied.startsWith("Bearer ")) return false;
  const token = supplied.slice(7);
  if (token.length !== expected.length) return false;
  let diff = 0; for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!env.MHT_MEDIA_DB) return json({ error: "D1 binding MHT_MEDIA_DB is not configured." }, 503);
  const body = await request.json().catch(() => null);
  if (!body || !["approved", "rejected"].includes(body.status)) return json({ error: "Invalid decision." }, 400);
  const p = body.photo || {};
  const required = ["id", "photographer", "photographerUrl", "photoUrl", "downloadLocation"];
  if (required.some(k => typeof p[k] !== "string" || !p[k].trim())) return json({ error: "Photo metadata is incomplete." }, 400);
  if (!/^https:\/\/images\.unsplash\.com\//.test(p.previewUrl || "") ||
      !/^https:\/\/api\.unsplash\.com\//.test(p.downloadLocation) ||
      !/^https:\/\/unsplash\.com\//.test(p.photoUrl) ||
      !/^https:\/\/unsplash\.com\//.test(p.photographerUrl)) return json({ error: "Photo URLs failed validation." }, 400);
  const usage = String(body.usage || "Unassigned").slice(0, 80);
  // A selection for use on the site is a download-like event under Unsplash API guidelines.
  // Repeated approval is idempotent; a rejected image can later be approved.
  const existing = await env.MHT_MEDIA_DB.prepare(
    "SELECT status FROM media_assets WHERE provider='unsplash' AND source_id=?"
  ).bind(p.id).first();
  if (body.status === "approved" && (!existing || existing.status !== "approved")) {
    if (!env.UNSPLASH_ACCESS_KEY) return json({ error: "Unsplash Access Key is not configured." }, 503);
    const track = await fetch(p.downloadLocation, {
      headers: { Authorization: "Client-ID " + env.UNSPLASH_ACCESS_KEY, "Accept-Version": "v1" }
    });
    if (!track.ok) return json({ error: "Unsplash download tracking failed; approval was not saved.", upstreamStatus: track.status }, 502);
  }
  await env.MHT_MEDIA_DB.prepare(`
    INSERT INTO media_assets
      (provider, source_id, status, description, image_url, preview_url, full_url,
       photographer, photographer_username, photographer_url, source_page_url,
       download_location, usage_location, approved_at, updated_at)
    VALUES ('unsplash', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(provider, source_id) DO UPDATE SET
      status=excluded.status, description=excluded.description, image_url=excluded.image_url,
      preview_url=excluded.preview_url, full_url=excluded.full_url, photographer=excluded.photographer,
      photographer_username=excluded.photographer_username, photographer_url=excluded.photographer_url,
      source_page_url=excluded.source_page_url, download_location=excluded.download_location,
      usage_location=excluded.usage_location, approved_at=excluded.approved_at, updated_at=CURRENT_TIMESTAMP
  `).bind(
    p.id, body.status, String(p.description || "").slice(0, 500),
    p.previewUrl, p.previewUrl, p.fullUrl || p.previewUrl,
    p.photographer, String(p.photographerUsername || ""), p.photographerUrl,
    p.photoUrl, p.downloadLocation, usage,
    body.status === "approved" ? new Date().toISOString() : null
  ).run();
  return json({ ok: true, id: p.id, status: body.status });
}
