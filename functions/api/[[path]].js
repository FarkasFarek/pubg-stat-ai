export const onRequestGet = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  // GET /api/health
  if (url.pathname === '/api/health') {
    return json({ ok: true, ts: Date.now() });
  }

  // GET /api/players?name=&shard=
  if (url.pathname === '/api/players') {
    const name  = url.searchParams.get('name');
    const shard = url.searchParams.get('shard');
    if (!name || !shard)
      return json({ error: 'name es shard szukseges' }, 400);
    if (!env.PUBGKEY)
      return json({ error: 'PUBGKEY hianyzik az env-ben' }, 500);

    const pubgUrl =
      'https://api.pubg.com/shards/' +
      shard +
      '/players?filter[playerNames]=' +
      encodeURIComponent(name);

    const res = await fetch(pubgUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${env.PUBGKEY}`,
      },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/vnd.api+json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // GET /api/matches/:id?shard=
  if (url.pathname.startsWith('/api/matches/')) {
    const parts = url.pathname.split('/');
    const id    = parts[parts.length - 1];
    const shard = url.searchParams.get('shard');
    if (!id || !shard)
      return json({ error: 'id es shard szukseges' }, 400);
    if (!env.PUBGKEY)
      return json({ error: 'PUBGKEY hianyzik az env-ben' }, 500);

    const pubgUrl = 'https://api.pubg.com/shards/' + shard + '/matches/' + id;
    const res = await fetch(pubgUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${env.PUBGKEY}`,
      },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/vnd.api+json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // GET /api/telemetry?url=
  if (url.pathname === '/api/telemetry') {
    const tUrl = url.searchParams.get('url');
    if (!tUrl)
      return json({ error: 'url parameter szukseges' }, 400);

    const res  = await fetch(tUrl);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return json({ error: 'Not found', path: url.pathname }, 404);
};
