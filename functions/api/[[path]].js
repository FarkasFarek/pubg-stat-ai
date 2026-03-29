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

  // GET /api/stats?name=PlayerName&platform=steam
  if (url.pathname === '/api/stats') {
    const name     = url.searchParams.get('name');
    const platform = url.searchParams.get('platform') || 'steam';

    if (!name)
      return json({ error: 'name parameter szukseges' }, 400);
    if (!env.TRNKEY)
      return json({ error: 'TRNKEY hianyzik az env-ben' }, 500);

    const trnUrl =
      `https://public-api.tracker.gg/v2/pubg/standard/profile/${platform}/${encodeURIComponent(name)}`;

    const res = await fetch(trnUrl, {
      headers: {
        'TRN-Api-Key': env.TRNKEY,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: `Tracker API hiba ${res.status}`, detail: err }, res.status);
    }

    const data = await res.json();

    // Overview segment kiemelese
    const overview = (data?.data?.segments || []).find(s => s.type === 'overview');
    const s = overview?.stats || {};

    const parsed = {
      name:         data?.data?.platformInfo?.platformUserHandle || name,
      kills:        s.kills?.value         ?? 0,
      kdRatio:      s.kdRatio?.value       ?? 0,
      damageDealt:  s.damageDealt?.value   ?? 0,
      headshotKills:s.headshotKills?.value ?? 0,
      assists:      s.assists?.value       ?? 0,
      wins:         s.wins?.value          ?? 0,
      top10s:       s.top10s?.value        ?? 0,
      matches:      s.matches?.value       ?? 0,
      winRatio:     s.wins?.value && s.matches?.value
                      ? ((s.wins.value / s.matches.value) * 100).toFixed(1)
                      : '0.0',
    };

    return json({ ok: true, stats: parsed });
  }

  return json({ error: 'Not found', path: url.pathname }, 404);
};
