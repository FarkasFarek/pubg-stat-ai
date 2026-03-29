const HTML = `<!DOCTYPE html>
<html lang="hu" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PUBG Live Overlay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{--font:'Inter',system-ui,sans-serif;--text:#f4f8fb;--muted:#a5b2bf;--card:rgba(255,255,255,.04);--border:rgba(255,255,255,.09)}
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
    .feed{padding:13px;display:flex;flex-direction:column;gap:8px;max-height:42vh;overflow:auto}
    .fevent{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;padding:10px;border-radius:13px;background:var(--card);border:1px solid var(--border)}
    .ficon{width:46px;height:46px;border-radius:12px;background:rgba(79,152,163,.18);display:grid;place-items:center;font-size:.75rem;font-weight:800;color:#ddfbff}
    .ftitle{font-size:.88rem;font-weight:700}.fmeta{font-size:.75rem;color:var(--muted)}
    .ftag{padding:.25rem .5rem;border-radius:999px;font-size:.65rem;font-weight:700;border:1px solid var(--border);background:rgba(255,255,255,.04)}
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
    .controls h1{margin:0 0 5px;font-size:1.1rem}.controls p{margin:0 0 13px;font-size:.8rem;color:var(--muted)}
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
      <div class="card"><div class="cl">Kills</div><div class="cv" id="kills">0</div><div class="cs">session</div></div>
      <div class="card"><div class="cl">K/D</div><div class="cv" id="kd">0.00</div><div class="cs">ratio</div></div>
      <div class="card"><div class="cl">Rang</div><div class="cv" id="rank">#--</div><div class="cs">helyezés</div></div>
      <div class="card"><div class="cl">Damage</div><div class="cv" id="damage">0</div><div class="cs">sebzés</div></div>
    </div>
    <div class="ph" style="border-top:1px solid var(--border)"><strong style="font-size:.82rem">Kill feed</strong><span class="badge" id="feedcount">0</span></div>
    <div class="feed" id="feed"></div>
  </aside>
  <main class="stage"><div class="tw"><div class="toast" id="toast"><div class="tico" id="tico">M4</div><div><div class="tbig" id="ttitle">Kill</div><div class="tsub" id="tsub">ellenség kiiktatva</div></div><div class="tcount" id="tcount">1</div></div></div></main>
  <aside class="panel right">
    <div class="ph"><strong>Match állapot</strong><span class="badge" id="phase">Phase 1</span></div>
    <div class="status">
      <div class="card"><div class="cl">Map</div><div class="cv" id="map" style="font-size:1.6rem">--</div></div>
      <div class="r2">
        <div class="card"><div class="cl">Survivors</div><div class="cv" id="survivors" style="font-size:1.7rem">--</div></div>
        <div class="card"><div class="cl">Assists</div><div class="cv" id="assists" style="font-size:1.7rem">0</div></div>
      </div>
      <div class="card"><div class="cl">Zone progress</div><div class="bar"><span id="pbar"></span></div><div class="cs" id="usub">Várakozás...</div></div>
    </div>
  </aside>
</div></div>
<section class="controls">
  <h1>PUBG Live Overlay</h1>
  <p>Official PUBG API. Stream előtt rejtsd el ezt a panelt <strong>H</strong> billentyűvel.</p>
  <div class="field"><label>PUBG játékosnév</label><input id="iname" placeholder="pl. FarkasFarek"></div>
  <div class="g2">
    <div class="field"><label>Platform</label><select id="iplat"><option value="steam">Steam (PC)</option><option value="xbox">Xbox</option><option value="psn">PlayStation</option><option value="kakao">Kakao</option></select></div>
    <div class="field"><label>Frissítés (mp)</label><input id="iint" type="number" min="10" value="15"></div>
  </div>
  <div class="field"><label>Layout</label><select id="ilay"><option value="full">Full</option><option value="compact">Compact</option><option value="minimal">Minimal toast</option></select></div>
  <div class="btns">
    <button class="btn p" id="bstart">▶ Live indítás</button>
    <button class="btn" id="bdemo">Demo</button>
    <button class="btn" id="bstop">Stop</button>
    <button class="btn" id="bhide">UI elrejtése</button>
  </div>
  <div class="hint">PUBG API kulcs a Cloudflare Worker env-ben van tárolva (PUBGKEY).</div>
</section>
<script>
  const WM={Item_Weapon_M416_C:{s:'M4',l:'M416'},Item_Weapon_HK416_C:{s:'416',l:'K416'},Item_Weapon_AK47_C:{s:'AKM',l:'AKM'},Item_Weapon_BerylM762_C:{s:'BRL',l:'Beryl'},Item_Weapon_Vector_C:{s:'VEC',l:'Vector'},Item_Weapon_AWM_C:{s:'AWM',l:'AWM'},Item_Weapon_M24_C:{s:'M24',l:'M24'},Item_Weapon_DP28_C:{s:'DP28',l:'DP-28'},Item_Weapon_Mini14_C:{s:'M14',l:'Mini14'},Item_Weapon_SKS_C:{s:'SKS',l:'SKS'},Grenade:{s:'Nade',l:'Grenade'},Damage_BlueZone:{s:'Zone',l:'Blue Zone'},Punch:{s:'Melee',l:'Melee'}};
  const MM={Baltic_Main:'Erangel',Erangel_Main:'Erangel',Desert_Main:'Miramar',Savage_Main:'Sanhok',DihorOtok_Main:'Vikendi',Heaven_Main:'Haven',Kiki_Main:'Deston',Tiger_Main:'Taego',Chimera_Main:'Paramo',Neon_Main:'Rondo'};
  const S={kills:0,kd:0,rank:'--',damage:0,assists:0,map:'--',survivors:'--',phase:1,feed:[],processedKills:new Set(),currentMatchId:null,deaths:0,loop:null,mode:'Idle'};
  const $=id=>document.getElementById(id);
  const E={mode:$('mode'),kills:$('kills'),kd:$('kd'),rank:$('rank'),damage:$('damage'),assists:$('assists'),map:$('map'),survivors:$('survivors'),phase:$('phase'),pbar:$('pbar'),feed:$('feed'),feedcount:$('feedcount'),usub:$('usub'),toast:$('toast'),tico:$('tico'),ttitle:$('ttitle'),tsub:$('tsub'),tcount:$('tcount')};
  function render(){E.mode.textContent=S.mode;E.kills.textContent=S.kills;E.kd.textContent=Number(S.kd).toFixed(2);E.rank.textContent=S.rank==='--'?'#--':'#'+S.rank;E.damage.textContent=Math.round(S.damage);E.assists.textContent=S.assists;E.map.textContent=S.map;E.survivors.textContent=S.survivors;E.phase.textContent='Phase '+S.phase;E.pbar.style.width=Math.min(100,S.phase*12.5)+'%';E.feedcount.textContent=S.feed.length;E.feed.innerHTML=S.feed.map(f=>'<div class="fevent"><div class="ficon">'+f.s+'</div><div><div class="ftitle">'+f.title+'</div><div class="fmeta">'+f.meta+'</div></div><span class="ftag">'+f.tag+'</span></div>').join('');E.usub.textContent='Frissítve: '+new Date().toLocaleTimeString('hu-HU');}
  function showToast(w,victim,total){E.tico.textContent=w.s;E.ttitle.textContent=w.l+' kill';E.tsub.textContent=victim+' kiiktatva';E.tcount.textContent=total;E.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>E.toast.classList.remove('show'),3400);}
  function getW(code){return WM[code]||{s:(code||'UNK').slice(0,4),l:code||'Unknown'};}
  function pushFeed(item){S.feed.unshift(item);S.feed=S.feed.slice(0,10);}
  async function tick(){
    const name=$('iname').value.trim();const plat=$('iplat').value;
    if(!name)throw new Error('Add meg a játékosnevedet.');
    S.mode='Live API';render();
    // 1. Legutobbi match ID
    const pr=await fetch('/api/players?name='+encodeURIComponent(name)+'&shard='+plat);
    if(!pr.ok){const e=await pr.json().catch(()=>({}));throw new Error(e.error||'Players API hiba '+pr.status);}
    const pd=await pr.json();
    const player=pd.data?.[0];
    if(!player)throw new Error('Játékos nem található: '+name);
    const matchId=player.relationships?.matches?.data?.[0]?.id;
    if(!matchId)throw new Error('Nincs elérhető match.');
    // 2. Ha uj match -> reset
    if(S.currentMatchId!==matchId){S.currentMatchId=matchId;S.processedKills.clear();S.feed=[];S.kills=0;S.deaths=0;S.assists=0;S.damage=0;S.rank='--';}
    // 3. Match + telemetry
    const mr=await fetch('/api/matches/'+matchId+'?shard='+plat);
    if(!mr.ok)throw new Error('Match API hiba '+mr.status);
    const md=await mr.json();
    const asset=(md.included||[]).find(x=>x.type==='asset');
    const tUrl=asset?.attributes?.URL;
    if(!tUrl)throw new Error('Telemetry URL hiányzik.');
    const tr=await fetch('/api/telemetry?url='+encodeURIComponent(tUrl));
    if(!tr.ok)throw new Error('Telemetry hiba '+tr.status);
    const tel=await tr.json();
    // 4. Parse
    const mapCode=md.data?.attributes?.mapName;
    S.map=MM[mapCode]||mapCode||S.map;
    let dmg=0,assists=0,survivors=S.survivors,phase=S.phase,rank=S.rank,deaths=S.deaths;
    for(const ev of tel){
      if(ev._T==='LogPlayerTakeDamage'&&ev.attacker?.name===name)dmg+=Number(ev.damage||0);
      if(ev._T==='LogPlayerKillV2'){
        const id=ev._D+'|'+ev.victim?.name;
        if(ev.killer?.name===name&&!S.processedKills.has(id)){S.processedKills.add(id);S.kills++;const w=getW(ev.damageCauserName);const hs=ev.damageReason==='HeadShot'||ev.isHeadshot;pushFeed({s:w.s,title:ev.victim?.name||'Unknown',meta:(hs?'headshot':'kill')+' · '+new Date(ev._D).toLocaleTimeString('hu-HU'),tag:hs?'HS':'Kill'});showToast(w,ev.victim?.name||'Unknown',S.kills);}
        if(ev.assistant?.name===name)assists++;
        if(ev.victim?.name===name){deaths++;rank=ev.common?.isGame||rank;}
      }
      if(ev._T==='LogMatchEnd'&&Array.isArray(ev.characters)){const me=ev.characters.find(c=>c.character?.name===name||c.name===name);if(me?.character?.ranking)rank=me.character.ranking;}
      if(ev._T==='LogPhaseChange')phase=Number(ev.phase||phase);
      if(typeof ev.alivePlayers==='number')survivors=ev.alivePlayers;
    }
    S.damage=Math.max(S.damage,dmg);S.assists=Math.max(S.assists,assists);S.survivors=survivors;S.phase=phase;S.rank=rank;S.deaths=deaths;
    S.kd=S.kills/Math.max(1,S.deaths);
    render();
  }
  function startLive(){stopLoop();const sec=Math.max(10,Number($('iint').value||15));tick().catch(handleErr);S.loop=setInterval(()=>tick().catch(handleErr),sec*1000);}
  function startDemo(){stopLoop();S.mode='Demo';S.kills=7;S.kd=3.5;S.rank=4;S.damage=1240;S.assists=2;S.map='Erangel';S.survivors=12;S.phase=5;S.feed=[];render();S.loop=setInterval(()=>{const ws=Object.values(WM);const w=ws[Math.floor(Math.random()*ws.length)];const victims=['Enemy1','Rusher','SnipeKing','ZoneDancer','CampLord'];const v=victims[Math.floor(Math.random()*victims.length)];S.kills++;S.damage+=Math.floor(50+Math.random()*200);S.survivors=Math.max(1,S.survivors-Math.floor(1+Math.random()*3));S.rank=Math.max(1,S.survivors);pushFeed({s:w.s,title:v,meta:'kill · '+new Date().toLocaleTimeString('hu-HU'),tag:'Kill'});showToast(w,v,S.kills);render();},2800);}
  function stopLoop(){clearInterval(S.loop);S.loop=null;S.mode='Idle';render();}
  function handleErr(e){S.mode='Hiba';E.mode.textContent='Hiba: '+String(e.message||e).slice(0,55);console.error(e);}
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

    // HTML overlay
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }

    // Health
    if (url.pathname === '/api/health') {
      return json({ ok: true, ts: Date.now() });
    }

    // /api/players?name=&shard=
    if (url.pathname === '/api/players') {
      const name  = url.searchParams.get('name');
      const shard = url.searchParams.get('shard');
      if (!name || !shard) return json({ error: 'name es shard kell' }, 400);
      if (!env.PUBGKEY)    return json({ error: 'PUBGKEY hianyzik' }, 500);
      const res = await fetch(
        `https://api.pubg.com/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,
        { headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${env.PUBGKEY}` } }
      );
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': 'application/vnd.api+json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // /api/matches/:id?shard=
    if (url.pathname.startsWith('/api/matches/')) {
      const id    = url.pathname.split('/').pop();
      const shard = url.searchParams.get('shard');
      if (!id || !shard) return json({ error: 'id es shard kell' }, 400);
      if (!env.PUBGKEY)   return json({ error: 'PUBGKEY hianyzik' }, 500);
      const res = await fetch(
        `https://api.pubg.com/shards/${shard}/matches/${id}`,
        { headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${env.PUBGKEY}` } }
      );
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': 'application/vnd.api+json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // /api/telemetry?url=
    if (url.pathname === '/api/telemetry') {
      const tUrl = url.searchParams.get('url');
      if (!tUrl) return json({ error: 'url kell' }, 400);
      const res = await fetch(tUrl);
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
