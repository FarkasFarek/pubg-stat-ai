const HTML = `<!DOCTYPE html>
<html lang="hu" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PUBG Live Overlay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{--font:'Inter',system-ui,sans-serif;--text:#f4f8fb;--muted:#a5b2bf;--card:rgba(255,255,255,.04);--border:rgba(255,255,255,.09);--primary:#4f98a3}
    *,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;font-family:var(--font);background:transparent;color:var(--text);min-height:100vh;overflow:hidden}
    button,input,select{font:inherit}
    .overlay{position:fixed;inset:0;padding:16px;pointer-events:none}
    .shell{display:grid;grid-template-columns:340px 1fr 310px;gap:16px;height:100%}
    .panel{background:linear-gradient(180deg,rgba(13,17,21,.92),rgba(13,17,21,.74));border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(18px);box-shadow:0 18px 60px rgba(0,0,0,.3);overflow:hidden;pointer-events:auto}
    .ph{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;border-bottom:1px solid var(--border)}
    .brand{display:flex;align-items:center;gap:10px;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .logo{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#4f98a3,#83dce8);color:#071116}
    .badge{padding:.28rem .58rem;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--border);font-size:.7rem;color:var(--muted)}
    .sg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:13px}
    .card{padding:13px;border-radius:15px;background:var(--card);border:1px solid var(--border)}
    .cl{font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .cv{font-size:clamp(1.5rem,1rem+1.5vw,2.3rem);font-weight:800;line-height:1.05;margin-top:5px}
    .cs{font-size:.78rem;color:var(--muted);margin-top:3px}
    .eg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 13px 13px}
    .mc{padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
    .ml{font-size:.63rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
    .mv{font-size:1.15rem;font-weight:800;margin-top:3px}
    .stage{display:flex;align-items:flex-end;justify-content:center}
    .tw{width:min(760px,100%);padding-bottom:16px;display:flex;justify-content:center}
    .toast{display:none;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;min-width:360px;max-width:760px;padding:17px 22px;border-radius:22px;background:linear-gradient(135deg,rgba(10,14,18,.95),rgba(13,20,25,.92));border:1px solid rgba(255,255,255,.13);box-shadow:0 20px 60px rgba(0,0,0,.35);pointer-events:auto}
    .toast.show{display:grid;animation:enter .3s ease}
    .tbig{font-size:clamp(1.5rem,1rem+1.1vw,2.4rem);font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    .tsub{font-size:.8rem;color:var(--muted);margin-top:2px}
    .tcount{font-size:clamp(1.7rem,1rem+1.4vw,2.8rem);font-weight:900;color:#dbfaff}
    .tico{width:52px;height:52px;border-radius:13px;background:rgba(79,152,163,.2);display:grid;place-items:center;font-size:.8rem;font-weight:800;color:#ddfbff}
    .status{padding:13px;display:flex;flex-direction:column;gap:9px}
    .r2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .bar{height:8px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-top:7px}
    .bar>span{display:block;height:100%;width:0;background:linear-gradient(90deg,#4f98a3,#86e2ef);transition:width .6s ease}
    .controls{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100vw - 32px));max-height:84vh;overflow:auto;padding:15px;border-radius:20px;background:rgba(10,14,17,.97);border:1px solid var(--border);box-shadow:0 24px 70px rgba(0,0,0,.4);pointer-events:auto}
    .controls h1{margin:0 0 5px;font-size:1.1rem}
    .controls p{margin:0 0 13px;font-size:.8rem;color:var(--muted)}
    .field{display:grid;gap:5px;margin-bottom:10px}
    .field label{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
    .field input,.field select{width:100%;padding:11px 13px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btns{display:flex;flex-wrap:wrap;gap:9px;margin-top:4px}
    .btn{padding:10px 13px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text);font-weight:700;cursor:pointer;transition:transform .15s}
    .btn.p{background:linear-gradient(135deg,#4f98a3,#82d9e4);color:#081115;border-color:transparent}
    .btn:hover{transform:translateY(-1px)}
    .hint{margin-top:9px;font-size:11px;line-height:1.5;color:var(--muted)}
    .hide-ui .controls{display:none}
    .compact .shell{grid-template-columns:300px 1fr 270px}
    .minimal .left,.minimal .right{display:none}
    .minimal .shell{grid-template-columns:1fr}
    .minimal .stage{justify-content:flex-start;align-items:flex-start}
    .minimal .tw{justify-content:flex-start;padding-top:24px;padding-left:24px}
    @keyframes enter{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media(max-width:1200px){.shell{grid-template-columns:320px 1fr}.right{display:none}}
    @media(max-width:860px){.shell{grid-template-columns:1fr}.left,.right{display:none}.toast{min-width:0;width:100%}.stage{align-items:flex-start}.tw{padding-top:12px;justify-content:stretch}}
  </style>
</head>
<body>
<div class="overlay"><div class="shell">
  <aside class="panel left">
    <div class="ph"><div class="brand"><div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 8h16v8H4z"/><path d="M8 4v4M16 4v4"/></svg></div><span>PUBG Live</span></div><span class="badge" id="mode">Idle</span></div>
    <div class="sg">
      <div class="card"><div class="cl">Kills</div><div class="cv" id="kills">0</div><div class="cs">lifetime</div></div>
      <div class="card"><div class="cl">K/D</div><div class="cv" id="kd">0.00</div><div class="cs">ratio</div></div>
      <div class="card"><div class="cl">Wins</div><div class="cv" id="wins">0</div><div class="cs">gy\u0151zelem</div></div>
      <div class="card"><div class="cl">Damage</div><div class="cv" id="damage">0</div><div class="cs">\u00f6sszes</div></div>
    </div>
    <div class="eg">
      <div class="mc"><div class="ml">Headshot</div><div class="mv" id="hs">0</div></div>
      <div class="mc"><div class="ml">Assists</div><div class="mv" id="assists">0</div></div>
      <div class="mc"><div class="ml">Matches</div><div class="mv" id="matches">0</div></div>
    </div>
  </aside>
  <main class="stage"><div class="tw"><div class="toast" id="toast"><div class="tico" id="tico">+1</div><div><div class="tbig" id="ttitle">Kill</div><div class="tsub" id="tsub">friss\u00edtve</div></div><div class="tcount" id="tcount">1</div></div></div></main>
  <aside class="panel right">
    <div class="ph"><strong>Statisztika</strong><span class="badge" id="ubadge">--</span></div>
    <div class="status">
      <div class="card"><div class="cl">J\u00e1t\u00e9kos</div><div class="cv" id="pname" style="font-size:1.5rem">--</div></div>
      <div class="r2">
        <div class="card"><div class="cl">Top 10</div><div class="cv" id="top10" style="font-size:1.6rem">0</div></div>
        <div class="card"><div class="cl">Win %</div><div class="cv" id="winpct" style="font-size:1.6rem">0%</div></div>
      </div>
      <div class="card"><div class="cl">\u00d6sszes meccs</div><div class="cv" id="mright" style="font-size:1.6rem">0</div><div class="bar"><span id="wbar"></span></div><div class="cs" id="usub">V\u00e1rakoz\u00e1s...</div></div>
    </div>
  </aside>
</div></div>
<section class="controls">
  <h1>PUBG Live Overlay</h1>
  <p>Tracker.gg API alapu\u00e9 stat overlay. Stream el\u0151tt rejtsd el a <strong>H</strong> billenty\u0171vel.</p>
  <div class="field"><label>PUBG j\u00e1t\u00e9kosn\u00e9v</label><input id="iname" placeholder="pl. FarkasFarek"></div>
  <div class="g2">
    <div class="field"><label>Platform</label><select id="iplat"><option value="steam">Steam (PC)</option><option value="xbox">Xbox</option><option value="psn">PlayStation</option><option value="kakao">Kakao</option></select></div>
    <div class="field"><label>Friss\u00edt\u00e9s (mp)</label><input id="iint" type="number" min="10" value="30"></div>
  </div>
  <div class="field"><label>Layout</label><select id="ilay"><option value="full">Full</option><option value="compact">Compact</option><option value="minimal">Minimal toast</option></select></div>
  <div class="btns">
    <button class="btn p" id="bstart">&#9654; Live ind\u00edt\u00e1s</button>
    <button class="btn" id="bdemo">Demo</button>
    <button class="btn" id="bstop">Stop</button>
    <button class="btn" id="bhide">UI elrejt\u00e9se</button>
  </div>
  <div class="hint">A TRNKEY Cloudflare Worker env-ben van t\u00e1rolva \u2014 nem ker\u00fcl a b\u00f6ng\u00e9sz\u0151be.</div>
</section>
<script>
  const S={kills:0,kd:0,wins:0,damage:0,hs:0,assists:0,matches:0,top10s:0,winRatio:'0.0',pname:'--',loop:null,mode:'Idle',prevKills:0};
  const $=id=>document.getElementById(id);
  const E={mode:$('mode'),kills:$('kills'),kd:$('kd'),wins:$('wins'),damage:$('damage'),hs:$('hs'),assists:$('assists'),matches:$('matches'),top10:$('top10'),winpct:$('winpct'),mright:$('mright'),wbar:$('wbar'),pname:$('pname'),ubadge:$('ubadge'),usub:$('usub'),toast:$('toast'),tico:$('tico'),ttitle:$('ttitle'),tsub:$('tsub'),tcount:$('tcount')};
  const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
  function render(){E.mode.textContent=S.mode;E.kills.textContent=fmt(S.kills);E.kd.textContent=Number(S.kd).toFixed(2);E.wins.textContent=fmt(S.wins);E.damage.textContent=fmt(S.damage);E.hs.textContent=fmt(S.hs);E.assists.textContent=fmt(S.assists);E.matches.textContent=fmt(S.matches);E.top10.textContent=fmt(S.top10s);E.winpct.textContent=S.winRatio+'%';E.mright.textContent=fmt(S.matches);E.pname.textContent=S.pname;E.wbar.style.width=Math.min(100,parseFloat(S.winRatio))+'%';const t=new Date().toLocaleTimeString('hu-HU');E.ubadge.textContent=t;E.usub.textContent='Friss\u00edtve: '+t;}
  function toast(diff,total){E.tico.textContent='+'+diff;E.ttitle.textContent=diff===1?'\u00daj kill!':diff+' \u00faj kill!';E.tsub.textContent='stat friss\u00edtve \u00b7 '+new Date().toLocaleTimeString('hu-HU');E.tcount.textContent=total;E.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>E.toast.classList.remove('show'),3400);}
  async function tick(){S.mode='Live';render();const name=$('iname').value.trim();const plat=$('iplat').value;if(!name)throw new Error('Add meg a j\u00e1t\u00e9kosnevedet.');const r=await fetch('/api/stats?name='+encodeURIComponent(name)+'&platform='+plat);if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'API hiba '+r.status);}const d=await r.json();const s=d.stats;const pk=S.kills;S.pname=s.name;S.kills=s.kills;S.kd=s.kdRatio;S.wins=s.wins;S.damage=s.damageDealt;S.hs=s.headshotKills;S.assists=s.assists;S.matches=s.matches;S.top10s=s.top10s;S.winRatio=s.winRatio;if(pk>0&&s.kills>pk)toast(s.kills-pk,s.kills);S.prevKills=s.kills;render();}
  function startLive(){stopLoop();const sec=Math.max(10,Number($('iint').value||30));tick().catch(err);S.loop=setInterval(()=>tick().catch(err),sec*1000);}
  function startDemo(){stopLoop();S.pname=$('iname').value.trim()||'DemoPlayer';S.kills=1240;S.kd=3.42;S.wins=87;S.damage=312500;S.hs=380;S.assists=210;S.matches=520;S.top10s=195;S.winRatio='16.7';S.mode='Demo';render();S.loop=setInterval(()=>{S.kills+=Math.floor(Math.random()*3);S.damage+=Math.floor(Math.random()*400);if(Math.random()>.7)S.wins++;S.matches++;S.kd=(S.kills/Math.max(1,S.matches*.6)).toFixed(2);S.winRatio=((S.wins/S.matches)*100).toFixed(1);const d=Math.floor(Math.random()*3);if(d>0){S.prevKills=S.kills-d;toast(d,S.kills);}render();},3000);}
  function stopLoop(){clearInterval(S.loop);S.loop=null;S.mode='Idle';render();}
  function err(e){S.mode='Hiba';E.mode.textContent='Hiba: '+String(e.message||e).slice(0,55);console.error(e);}
  $('bstart').addEventListener('click',startLive);$('bdemo').addEventListener('click',startDemo);$('bstop').addEventListener('click',stopLoop);$('bhide').addEventListener('click',()=>document.body.classList.toggle('hide-ui'));$('ilay').addEventListener('change',e=>{document.body.classList.remove('compact','minimal');if(e.target.value==='compact')document.body.classList.add('compact');if(e.target.value==='minimal')document.body.classList.add('minimal');});document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h')document.body.classList.toggle('hide-ui');if(e.key.toLowerCase()==='d')startDemo();});render();
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });

    // Serve overlay HTML
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return json({ ok: true, ts: Date.now() });
    }

    // /api/stats?name=&platform=
    if (url.pathname === '/api/stats') {
      const name     = url.searchParams.get('name');
      const platform = url.searchParams.get('platform') || 'steam';

      if (!name) return json({ error: 'name parameter szukseges' }, 400);
      if (!env.TRNKEY) return json({ error: 'TRNKEY hianyzik az env-ben' }, 500);

      const trnUrl = `https://public-api.tracker.gg/v2/pubg/standard/profile/${platform}/${encodeURIComponent(name)}`;

      const res = await fetch(trnUrl, {
        headers: {
          'TRN-Api-Key': env.TRNKEY,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        return json({ error: `Tracker API hiba ${res.status}`, detail: errText }, res.status);
      }

      const data = await res.json();
      const overview = (data?.data?.segments || []).find(s => s.type === 'overview');
      const s = overview?.stats || {};

      return json({
        ok: true,
        stats: {
          name:          data?.data?.platformInfo?.platformUserHandle || name,
          kills:         s.kills?.value          ?? 0,
          kdRatio:       s.kdRatio?.value        ?? 0,
          damageDealt:   s.damageDealt?.value    ?? 0,
          headshotKills: s.headshotKills?.value  ?? 0,
          assists:       s.assists?.value        ?? 0,
          wins:          s.wins?.value           ?? 0,
          top10s:        s.top10s?.value         ?? 0,
          matches:       s.matches?.value        ?? 0,
          winRatio:      s.wins?.value && s.matches?.value
            ? ((s.wins.value / s.matches.value) * 100).toFixed(1)
            : '0.0',
        },
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
