export const onRequestGet = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  // ── /api/health ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/health') {
    return json({ ok: true, ts: Date.now() });
  }

  // ── /api/players?name=&shard= ─────────────────────────────────────────────
  if (url.pathname === '/api/players') {
    const name = url.searchParams.get('name');
    const shard = url.searchParams.get('shard');
    if (!name || !shard)
      return json({ error: 'name és shard szükséges' }, 400);
    if (!env.PUBG_API_KEY)
      return json({ error: 'PUBG_API_KEY hiányzik az env-ben' }, 500);

    const pubgUrl =
      'https://api.pubg.com/shards/' +
      shard +
      '/players?filter[playerNames]=' +
      encodeURIComponent(name);

    const res = await fetch(pubgUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${env.PUBG_API_KEY}`,
      },
    });
    return new Response(res.body, {
      status: res.status,
      headers: { 'content-type': 'application/vnd.api+json' },
    });
  }

  // ── /api/matches/:id?shard= ───────────────────────────────────────────────
  if (url.pathname.startsWith('/api/matches/')) {
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];
    const shard = url.searchParams.get('shard');
    if (!id || !shard)
      return json({ error: 'id és shard szükséges' }, 400);
    if (!env.PUBG_API_KEY)
      return json({ error: 'PUBG_API_KEY hiányzik az env-ben' }, 500);

    const pubgUrl =
      'https://api.pubg.com/shards/' + shard + '/matches/' + id;

    const res = await fetch(pubgUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${env.PUBG_API_KEY}`,
      },
    });
    return new Response(res.body, {
      status: res.status,
      headers: { 'content-type': 'application/vnd.api+json' },
    });
  }

  // ── /api/telemetry?url= ───────────────────────────────────────────────────
  if (url.pathname === '/api/telemetry') {
    const tUrl = url.searchParams.get('url');
    if (!tUrl) return json({ error: 'url paraméter szükséges' }, 400);

    const res = await fetch(tUrl);
    return new Response(res.body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return json({ error: 'Not found' }, 404);
};
