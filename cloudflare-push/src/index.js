import webpush from "web-push";

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
});

async function subscriptionKey(endpoint) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type"
      }});
    }

    const url = new URL(request.url);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    if (url.pathname === "/subscribe") {
      const subscription = await request.json();
      if (!subscription?.endpoint) return json({ error: "Invalid subscription" }, 400);
      await env.PUSH_SUBSCRIPTIONS.put(await subscriptionKey(subscription.endpoint), JSON.stringify(subscription));
      return json({ ok: true });
    }

    if (url.pathname === "/notify") {
      const payload = await request.json();
      const title = payload.title || "Sales Dashboard";
      const body = payload.body || "มีข้อมูลใหม่";
      webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
      const subscriptions = await env.PUSH_SUBSCRIPTIONS.list();
      const results = await Promise.all(subscriptions.keys.map(async key => {
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key.name);
        if (!raw) return false;
        try {
          await webpush.sendNotification(JSON.parse(raw), JSON.stringify({ title, body }));
          return true;
        } catch (error) {
          if ([404, 410].includes(error.statusCode)) await env.PUSH_SUBSCRIPTIONS.delete(key.name);
          return false;
        }
      }));
      return json({ ok: true, delivered: results.filter(Boolean).length });
    }

    return json({ error: "Not found" }, 404);
  }
};
