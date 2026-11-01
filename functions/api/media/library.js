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
export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!env.MHT_MEDIA_DB) return json({ error: "D1 binding MHT_MEDIA_DB is not configured." }, 503);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const allowed = ["approved", "rejected"];
  const result = status && allowed.includes(status)
    ? await env.MHT_MEDIA_DB.prepare("SELECT * FROM media_assets WHERE status=? ORDER BY updated_at DESC LIMIT 250").bind(status).all()
    : await env.MHT_MEDIA_DB.prepare("SELECT * FROM media_assets ORDER BY updated_at DESC LIMIT 250").all();
  return json({ results: result.results || [] });
}
