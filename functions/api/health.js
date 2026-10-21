export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: "ok",
    platform: "Cloudflare Pages Edge Runtime",
    cogs: "$0.00",
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
}
