// ============================================================
// PUBG Stat AI – Cloudflare Worker
// Routes:
//   GET  /                          -> overlay HTML
//   GET  /api/health                -> health check
//   GET  /api/players?name=&shard=  -> PUBG players proxy
//   GET  /api/matches/:id?shard=    -> PUBG match proxy
//   GET  /api/telemetry?url=        -> telemetry proxy
//   GET  /api/sync?name=&shard=     -> sync last 8 matches to D1
//   GET  /api/stats?name=&shard=&period=today|week|alltime
// ============================================================

const HTML = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PUBG Live Overlay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--font:'Inter',system-ui,sans-serif;--text:#f4f8fb;--muted:#a5b2bf;--card:rgba(255,255,255,.04);--border:rgba(255,255,255,.09);--accent:#4f98a3}
*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;font-family:var(--font);background:transparent;color:var(--text);min-height:100vh;overflow:hidden}button,input,select{font:inherit}
.overlay{position:fixed;inset:0;padding:16px;pointer-events:none}
.shell{display:grid;grid-template-columns:330px 1fr 340px;gap:14px;height:100%}
.panel{background:linear-gradient(180deg,rgba(13,17,21,.93),rgba(13,17,21,.76));border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(18px);box-shadow:0 18px 60px rgba(0,0,0,.3);overflow:hidden;pointer-events:auto}
.ph{display:flex;justify-content:space-between;align-items:center;padding:12px 15px;border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:9px;font-size:.76rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.logo{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#4f98a3,#83dce8);color:#071116}
.badge{padding:.26rem .56rem;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--border);font-size:.68rem;color:var(--muted)}
.sg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:12px}
.card{padding:12px;border-radius:14px;background:var(--card);border:1px solid var(--border)}
.cl{font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.cv{font-size:clamp(1.4rem,1rem+1.4vw,2.2rem);font-weight:800;line-height:1.05;margin-top:4px}
.cs{font-size:.76rem;color:var(--muted);margin-top:3px}
.feed{padding:10px;display:flex;flex-direction:column;gap:7px;max-height:38vh;overflow:auto}
.fev{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center;padding:9px;border-radius:12px;background:var(--card);border:1px solid var(--border)}
.fi{width:42px;height:42px;border-radius:11px;background:rgba(79,152,163,.18);display:grid;place-items:center;font-size:.72rem;font-weight:800;color:#ddfbff}
.ft{font-size:.85rem;font-weight:700}.fm{font-size:.72rem;color:var(--muted)}
.ftag{padding:.22rem .46rem;border-radius:999px;font-size:.62rem;font-weight:700;border:1px solid var(--border);background:rgba(255,255,255,.04)}
.stage{display:flex;align-items:flex-end;justify-content:center}
.tw{width:min(760px,100%);padding-bottom:14px;display:flex;justify-content:center}
.toast{display:none;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;min-width:340px;max-width:760px;padding:16px 20px;border-radius:22px;background:linear-gradient(135deg,rgba(10,14,18,.95),rgba(13,20,25,.92));border:1px solid rgba(255,255,255,.13);box-shadow:0 20px 60px rgba(0,0,0,.35);pointer-events:auto}
.toast.show{display:grid;animation:enter .3s ease}
.tbig{font-size:clamp(1.4rem,.9rem+1.1vw,2.3rem);font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.tsub{font-size:.78rem;color:var(--muted);margin-top:2px}.tcount{font-size:clamp(1.6rem,.9rem+1.4vw,2.7rem);font-weight:900;color:#dbfaff}
.tico{width:50px;height:50px;border-radius:13px;background:rgba(79,152,163,.2);display:grid;place-items:center;font-size:.76rem;font-weight:800;color:#ddfbff}
/* RIGHT PANEL - STATS TABS */
.tabs{display:flex;gap:4px;padding:10px 12px 0}
.tab{flex:1;padding:7px 4px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--muted);font-size:.72rem;font-weight:700;cursor:pointer;text-align:center;transition:.15s}
.tab.active{background:rgba(79,152,163,.18);border-color:rgba(79,152,163,.4);color:#83dce8}
.tabcontent{display:none;padding:10px 12px 12px}
.tabcontent.active{display:block}
.srow{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px}
.scard{padding:10px 12px;border-radius:13px;background:var(--card);border:1px solid var(--border)}
.scl{font-size:.62rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.scv{font-size:1.3rem;font-weight:800;margin-top:3px}
.scs{font-size:.72rem;color:var(--muted);margin-top:2px}
.srow3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.scard3{padding:8px 10px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--border)}
.sl3{font-size:.6rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.sv3{font-size:1.05rem;font-weight:800;margin-top:3px}
.syncbtn{width:100%;margin-top:8px;padding:9px;border-radius:11px;border:1px solid rgba(79,152,163,.4);background:rgba(79,152,163,.1);color:#83dce8;font-weight:700;font-size:.78rem;cursor:pointer}
.syncing{opacity:.5;pointer-events:none}
.lastsync{font-size:.66rem;color:var(--muted);text-align:center;margin-top:6px}
/* CONTROLS */
.controls{position:fixed;right:14px;bottom:14px;width:min(410px,calc(100vw - 28px));max-height:84vh;overflow:auto;padding:14px;border-radius:20px;background:rgba(10,14,17,.97);border:1px solid var(--border);box-shadow:0 24px 70px rgba(0,0,0,.4);pointer-events:auto}
.controls h1{margin:0 0 4px;font-size:1.05rem}.controls p{margin:0 0 12px;font-size:.78rem;color:var(--muted)}
.field{display:grid;gap:4px;margin-bottom:9px}.field label{font-size:.64rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.field input,.field select{width:100%;padding:10px 12px;border-radius:11px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.btn{padding:9px 12px;border-radius:11px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text);font-weight:700;cursor:pointer;transition:transform .15s}
.btn.p{background:linear-gradient(135deg,#4f98a3,#82d9e4);color:#081115;border-color:transparent}
.btn:hover{transform:translateY(-1px)}
.hint{margin-top:8px;font-size:11px;line-height:1.5;color:var(--muted)}
.hide-ui .controls{display:none}
.compact .shell{grid-template-columns:290px 1fr 300px}
.minimal .left,.minimal .right{display:none}
.minimal .shell{grid-template-columns:1fr}
.minimal .stage{justify-content:flex-start;align-items:flex-start}
.minimal .tw{justify-content:flex-start;padding-top:22px;padding-left:22px}
@keyframes enter{from{opacity:0;transform:translateY(13px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:1200px){.shell{grid-template-columns:310px 1fr}.right{display:none}}
@media(max-width:860px){.shell{grid-template-columns:1fr}.left,.right{display:none}.toast{min-width:0;width:100%}.stage{align-items:flex-start}.tw{padding-top:10px;justify-content:stretch}}
</style>
</head>
<body>
<div class="overlay"><div class="shell">
  <!-- LEFT: LIVE -->
  <aside class="panel left">
    <div class="ph"><div class="brand"><div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><path d="M4 8h16v8H4z"/><path d="M8 4v4M16 4v4"/></svg></div><span>PUBG Live</span></div><span class="badge" id="mode">Idle</span></div>
    <div class="sg">
      <div class="card"><div class="cl">Kills</div><div class="cv" id="kills">0</div><div class="cs">session</div></div>
      <div class="card"><div class="cl">K/D</div><div class="cv" id="kd">0.00</div><div class="cs">ratio</div></div>
      <div class="card"><div class="cl">Rang</div><div class="cv" id="rank">#--</div><div class="cs">helyez\u00e9s</div></div>
      <div class="card"><div class="cl">Damage</div><div class="cv" id="damage">0</div><div class="cs">sebz\u00e9s</div></div>
    </div>
    <div class="ph" style="border-top:1px solid var(--border)"><strong style="font-size:.8rem">Kill feed</strong><span class="badge" id="feedcount">0</span></div>
    <div class="feed" id="feed"></div>
  </aside>
  <!-- CENTER: TOAST -->
  <main class="stage"><div class="tw"><div class="toast" id="toast"><div class="tico" id="tico">M4</div><div><div class="tbig" id="ttitle">Kill</div><div class="tsub" id="tsub">ellens\u00e9g kiiktatva</div></div><div class="tcount" id="tcount">1</div></div></div></main>
  <!-- RIGHT: STATS HISTORY -->
  <aside class="panel right">
    <div class="ph"><strong>Statisztika</strong><span class="badge" id="statsbadge">--</span></div>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('today')">Mai</button>
      <button class="tab" onclick="switchTab('week')">7 nap</button>
      <button class="tab" onclick="switchTab('alltime')">All-time</button>
    </div>
    <div id="tab-today" class="tabcontent active">
      <div class="srow">
        <div class="scard"><div class="scl">Kills</div><div class="scv" id="t-kills">--</div><div class="scs">ma</div></div>
        <div class="scard"><div class="scl">K/D</div><div class="scv" id="t-kd">--</div><div class="scs">ratio</div></div>
      </div>
      <div class="srow3">
        <div class="scard3"><div class="sl3">Meccs</div><div class="sv3" id="t-m">--</div></div>
        <div class="scard3"><div class="sl3">Gy\u0151z</div><div class="sv3" id="t-w">--</div></div>
        <div class="scard3"><div class="sl3">Damage</div><div class="sv3" id="t-d">--</div></div>
      </div>
    </div>
    <div id="tab-week" class="tabcontent">
      <div class="srow">
        <div class="scard"><div class="scl">Kills</div><div class="scv" id="w-kills">--</div><div class="scs">7 nap</div></div>
        <div class="scard"><div class="scl">K/D</div><div class="scv" id="w-kd">--</div><div class="scs">ratio</div></div>
      </div>
      <div class="srow3">
        <div class="scard3"><div class="sl3">Meccs</div><div class="sv3" id="w-m">--</div></div>
        <div class="scard3"><div class="sl3">Gy\u0151z</div><div class="sv3" id="w-w">--</div></div>
        <div class="scard3"><div class="sl3">Damage</div><div class="sv3" id="w-d">--</div></div>
      </div>
    </div>
    <div id="tab-alltime" class="tabcontent">
      <div class="srow">
        <div class="scard"><div class="scl">Kills</div><div class="scv" id="a-kills">--</div><div class="scs">\u00f6sszes</div></div>
        <div class="scard"><div class="scl">K/D</div><div class="scv" id="a-kd">--</div><div class="scs">ratio</div></div>
      </div>
      <div class="srow3">
        <div class="scard3"><div class="sl3">Meccs</div><div class="sv3" id="a-m">--</div></div>
        <div class="scard3"><div class="sl3">Gy\u0151z</div><div class="sv3" id="a-w">--</div></div>
        <div class="scard3"><div class="sl3">Damage</div><div class="sv3" id="a-d">--</div></div>
      </div>
    </div>
    <div style="padding:0 12px 12px">
      <button class="syncbtn" id="syncBtn" onclick="doSync()">\u21bb Meccsek szinkroniz\u00e1l\u00e1sa</button>
      <div class="lastsync" id="lastsync">M\u00e9g nem szinkroniz\u00e1lt</div>
    </div>
  </aside>
</div></div>
<!-- CONTROLS -->
<section class="controls">
  <h1>PUBG Live Overlay</h1>
  <p>Live kill feed + statisztika n\u00e9zettel. <strong>H</strong> billenty\u0171 elrejti a panelt.</p>
  <div class="field"><label>PUBG j\u00e1t\u00e9kosn\u00e9v</label><input id="iname" placeholder="pl. FarkasFarek"></div>
  <div class="g2">
    <div class="field"><label>Platform</label><select id="iplat"><option value="steam">Steam (PC)</option><option value="xbox">Xbox</option><option value="psn">PlayStation</option><option value="kakao">Kakao</option></select></div>
    <div class="field"><label>Friss\u00edt\u00e9s (mp)</label><input id="iint" type="number" min="10" value="15"></div>
  </div>
  <div class="field"><label>Layout</label><select id="ilay"><option value="full">Full</option><option value="compact">Compact</option><option value="minimal">Minimal toast</option></select></div>
  <div class="btns">
    <button class="btn p" id="bstart">\u25b6 Live ind\u00edt\u00e1s</button>
    <button class="btn" id="bdemo">Demo</button>
    <button class="btn" id="bstop">Stop</button>
    <button class="btn" id="bhide">UI elrejt\u00e9se</button>
  </div>
  <div class="hint">Adatok t\u00e1rol\u00e1sa: Cloudflare D1 adatb\u00e1zis. Minden szinkroniz\u00e1l\u00e1skor az utols\u00f3 8 meccs ker\u00fcl mentes\u00edt\u00e9sre.</div>
</section>
<script>
const WM={Item_Weapon_M416_C:{s:'M4',l:'M416'},Item_Weapon_HK416_C:{s:'416',l:'K416'},Item_Weapon_AK47_C:{s:'AKM',l:'AKM'},Item_Weapon_BerylM762_C:{s:'BRL',l:'Beryl'},Item_Weapon_Vector_C:{s:'VEC',l:'Vector'},Item_Weapon_AWM_C:{s:'AWM',l:'AWM'},Item_Weapon_M24_C:{s:'M24',l:'M24'},Item_Weapon_DP28_C:{s:'DP28',l:'DP-28'},Item_Weapon_Mini14_C:{s:'M14',l:'Mini14'},Item_Weapon_SKS_C:{s:'SKS',l:'SKS'},Grenade:{s:'Nade',l:'Grenade'},Damage_BlueZone:{s:'Zone',l:'Blue Zone'},Punch:{s:'Melee',l:'Melee'}};
const MM={Baltic_Main:'Erangel',Erangel_Main:'Erangel',Desert_Main:'Miramar',Savage_Main:'Sanhok',DihorOtok_Main:'Vikendi',Heaven_Main:'Haven',Kiki_Main:'Deston',Tiger_Main:'Taego',Chimera_Main:'Paramo',Neon_Main:'Rondo'};
const S={kills:0,kd:0,rank:'--',damage:0,assists:0,feed:[],processedKills:new Set(),currentMatchId:null,deaths:0,loop:null,mode:'Idle'};
const $=id=>document.getElementById(id);
const E={mode:$('mode'),kills:$('kills'),kd:$('kd'),rank:$('rank'),damage:$('damage'),feed:$('feed'),feedcount:$('feedcount'),toast:$('toast'),tico:$('tico'),ttitle:$('ttitle'),tsub:$('tsub'),tcount:$('tcount'),statsbadge:$('statsbadge'),lastsync:$('lastsync')};
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
function renderLive(){E.mode.textContent=S.mode;E.kills.textContent=S.kills;E.kd.textContent=Number(S.kd).toFixed(2);E.rank.textContent=S.rank==='--'?'#--':'#'+S.rank;E.damage.textContent=Math.round(S.damage);E.feedcount.textContent=S.feed.length;E.feed.innerHTML=S.feed.map(f=>'<div class="fev"><div class="fi">'+f.s+'</div><div><div class="ft">'+f.title+'</div><div class="fm">'+f.meta+'</div></div><span class="ftag">'+f.tag+'</span></div>').join('');}
function renderStats(period,d){const p=period[0];$(''+p+'-kills').textContent=fmt(d.kills);$(''+p+'-kd').textContent=Number(d.kd).toFixed(2);$(''+p+'-m').textContent=fmt(d.matches);$(''+p+'-w').textContent=fmt(d.wins);$(''+p+'-d').textContent=fmt(d.damage);E.statsbadge.textContent=new Date().toLocaleTimeString('hu-HU');E.lastsync.textContent='Szinkroniz\u00e1lva: '+new Date().toLocaleTimeString('hu-HU');}
function switchTab(t){document.querySelectorAll('.tab').forEach((b,i)=>{b.classList.toggle('active',['today','week','alltime'][i]===t)});document.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));$('tab-'+t).classList.add('active');}
function showToast(w,victim,total){E.tico.textContent=w.s;E.ttitle.textContent=w.l+' kill';E.tsub.textContent=victim+' kiiktatva';E.tcount.textContent=total;E.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>E.toast.classList.remove('show'),3400);}
function getW(code){return WM[code]||{s:(code||'UNK').slice(0,4),l:code||'Unknown'};}
function pushFeed(item){S.feed.unshift(item);S.feed=S.feed.slice(0,10);}
async function doSync(){const name=$('iname').value.trim();const plat=$('iplat').value;if(!name)return;const btn=$('syncBtn');btn.textContent='Szinkroniz\u00e1l\u00e1s...';btn.classList.add('syncing');try{const r=await fetch('/api/sync?name='+encodeURIComponent(name)+'&shard='+plat);const d=await r.json();if(d.today)renderStats('today',d.today);if(d.week)renderStats('week',d.week);if(d.alltime)renderStats('alltime',d.alltime);}catch(e){E.lastsync.textContent='Hiba: '+String(e.message).slice(0,40);}finally{btn.textContent='\u21bb Meccsek szinkroniz\u00e1l\u00e1sa';btn.classList.remove('syncing');}}
async function tick(){const name=$('iname').value.trim();const plat=$('iplat').value;if(!name)throw new Error('Add meg a j\u00e1t\u00e9kosnevedet.');S.mode='Live API';renderLive();
  const pr=await fetch('/api/players?name='+encodeURIComponent(name)+'&shard='+plat);
  if(!pr.ok){const e=await pr.json().catch(()=>({}));throw new Error(e.error||'Players API hiba '+pr.status);}
  const pd=await pr.json();const player=pd.data?.[0];
  if(!player)throw new Error('J\u00e1t\u00e9kos nem tal\u00e1lhat\u00f3: '+name);
  const matchId=player.relationships?.matches?.data?.[0]?.id;
  if(!matchId)throw new Error('Nincs el\u00e9rhet\u0151 match.');
  if(S.currentMatchId!==matchId){S.currentMatchId=matchId;S.processedKills.clear();S.feed=[];S.kills=0;S.deaths=0;S.assists=0;S.damage=0;S.rank='--';}
  const mr=await fetch('/api/matches/'+matchId+'?shard='+plat);
  if(!mr.ok)throw new Error('Match API hiba '+mr.status);
  const md=await mr.json();
  const asset=(md.included||[]).find(x=>x.type==='asset');
  const tUrl=asset?.attributes?.URL;if(!tUrl)throw new Error('Telemetry URL hi\u00e1nyzik.');
  const tr=await fetch('/api/telemetry?url='+encodeURIComponent(tUrl));
  if(!tr.ok)throw new Error('Telemetry hiba '+tr.status);
  const tel=await tr.json();
  const mapCode=md.data?.attributes?.mapName;
  let dmg=0,assists=0,phase=1,rank=S.rank,deaths=S.deaths;
  for(const ev of tel){
    if(ev._T==='LogPlayerTakeDamage'&&ev.attacker?.name===name)dmg+=Number(ev.damage||0);
    if(ev._T==='LogPlayerKillV2'){const id=ev._D+'|'+ev.victim?.name;
      if(ev.killer?.name===name&&!S.processedKills.has(id)){S.processedKills.add(id);S.kills++;const w=getW(ev.damageCauserName);const hs=ev.damageReason==='HeadShot'||ev.isHeadshot;pushFeed({s:w.s,title:ev.victim?.name||'Unknown',meta:(hs?'headshot':'kill')+'\u00b7'+new Date(ev._D).toLocaleTimeString('hu-HU'),tag:hs?'HS':'Kill'});showToast(w,ev.victim?.name||'Unknown',S.kills);}
      if(ev.assistant?.name===name)assists++;
      if(ev.victim?.name===name){deaths++;rank=ev.common?.isGame||rank;}}
    if(ev._T==='LogMatchEnd'&&Array.isArray(ev.characters)){const me=ev.characters.find(c=>c.character?.name===name||c.name===name);if(me?.character?.ranking)rank=me.character.ranking;}
    if(ev._T==='LogPhaseChange')phase=Number(ev.phase||phase);
  }
  S.damage=Math.max(S.damage,dmg);S.assists=Math.max(S.assists,assists);S.rank=rank;S.deaths=deaths;S.kd=S.kills/Math.max(1,S.deaths);
  renderLive();
}
function startLive(){stopLoop();doSync();const sec=Math.max(10,Number($('iint').value||15));tick().catch(handleErr);S.loop=setInterval(()=>tick().catch(handleErr),sec*1000);}
function startDemo(){stopLoop();S.mode='Demo';S.kills=7;S.kd=3.5;S.rank=4;S.damage=1240;S.assists=2;S.feed=[];renderLive();
  renderStats('today',{kills:12,kd:2.4,matches:5,wins:1,damage:8400});
  renderStats('week',{kills:89,kd:3.1,matches:32,wins:6,damage:62000});
  renderStats('alltime',{kills:1240,kd:3.4,matches:520,wins:87,damage:312000});
  S.loop=setInterval(()=>{const ws=Object.values(WM);const w=ws[Math.floor(Math.random()*ws.length)];const victims=['Enemy1','Rusher','SnipeKing','ZoneDancer','CampLord'];const v=victims[Math.floor(Math.random()*victims.length)];S.kills++;S.damage+=Math.floor(50+Math.random()*200);pushFeed({s:w.s,title:v,meta:'kill\u00b7'+new Date().toLocaleTimeString('hu-HU'),tag:'Kill'});showToast(w,v,S.kills);renderLive();},2800);}
function stopLoop(){clearInterval(S.loop);S.loop=null;S.mode='Idle';renderLive();}
function handleErr(e){S.mode='Hiba';E.mode.textContent='Hiba: '+String(e.message||e).slice(0,55);console.error(e);}
$('bstart').addEventListener('click',startLive);$('bdemo').addEventListener('click',startDemo);$('bstop').addEventListener('click',stopLoop);$('bhide').addEventListener('click',()=>document.body.classList.toggle('hide-ui'));$('ilay').addEventListener('change',e=>{document.body.classList.remove('compact','minimal');if(e.target.value==='compact')document.body.classList.add('compact');if(e.target.value==='minimal')document.body.classList.add('minimal');});document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h')document.body.classList.toggle('hide-ui');if(e.key.toLowerCase()==='d')startDemo();});renderLive();
</script>
</body>
</html>`;

// ── helpers ─────────────────────────────────────────────────
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function pubgFetch(path, key) {
  return fetch('https://api.pubg.com' + path, {
    headers: { Accept: 'application/vnd.api+json', Authorization: 'Bearer ' + key },
  });
}

function aggStats(rows) {
  const kills = rows.reduce((s, r) => s + (r.kills || 0), 0);
  const deaths = rows.reduce((s, r) => s + (r.deaths || 0), 0);
  const wins = rows.reduce((s, r) => s + (r.won || 0), 0);
  const damage = rows.reduce((s, r) => s + (r.damage || 0), 0);
  return {
    matches: rows.length,
    kills,
    deaths,
    wins,
    damage: Math.round(damage),
    kd: kills / Math.max(1, deaths),
  };
}

// ── main handler ────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    // HTML overlay
    if (p === '/' || p === '/index.html') {
      return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }

    // Health
    if (p === '/api/health') return json({ ok: true, ts: Date.now() });

    // Players proxy
    if (p === '/api/players') {
      const name = url.searchParams.get('name');
      const shard = url.searchParams.get('shard');
      if (!name || !shard) return json({ error: 'name es shard kell' }, 400);
      if (!env.PUBGKEY) return json({ error: 'PUBGKEY hianyzik' }, 500);
      const res = await pubgFetch(`/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`, env.PUBGKEY);
      return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/vnd.api+json', 'Access-Control-Allow-Origin': '*' } });
    }

    // Match proxy
    if (p.startsWith('/api/matches/')) {
      const id = p.split('/').pop();
      const shard = url.searchParams.get('shard');
      if (!id || !shard) return json({ error: 'id es shard kell' }, 400);
      if (!env.PUBGKEY) return json({ error: 'PUBGKEY hianyzik' }, 500);
      const res = await pubgFetch(`/shards/${shard}/matches/${id}`, env.PUBGKEY);
      return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/vnd.api+json', 'Access-Control-Allow-Origin': '*' } });
    }

    // Telemetry proxy
    if (p === '/api/telemetry') {
      const tUrl = url.searchParams.get('url');
      if (!tUrl) return json({ error: 'url kell' }, 400);
      const res = await fetch(tUrl);
      return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // ── SYNC: fetch last 8 matches, store new ones in D1 ────
    if (p === '/api/sync') {
      const name = url.searchParams.get('name');
      const shard = url.searchParams.get('shard');
      if (!name || !shard) return json({ error: 'name es shard kell' }, 400);
      if (!env.PUBGKEY) return json({ error: 'PUBGKEY hianyzik' }, 500);
      if (!env.DB) return json({ error: 'D1 DB nincs kotve, lasd README' }, 500);

      // 1. Get player + match IDs
      const pr = await pubgFetch(`/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`, env.PUBGKEY);
      if (!pr.ok) return json({ error: 'Players API hiba ' + pr.status }, pr.status);
      const pd = await pr.json();
      const player = pd.data?.[0];
      if (!player) return json({ error: 'Jatekos nem talalhato' }, 404);

      const accountId = player.id;
      const matchIds = (player.relationships?.matches?.data || []).map(m => m.id).slice(0, 8);

      // 2. Which match IDs are already in DB?
      const placeholders = matchIds.map(() => '?').join(',');
      const existing = matchIds.length
        ? (await env.DB.prepare(`SELECT match_id FROM matches WHERE match_id IN (${placeholders})`).bind(...matchIds).all()).results.map(r => r.match_id)
        : [];
      const newIds = matchIds.filter(id => !existing.includes(id));

      // 3. Fetch and store new matches
      for (const matchId of newIds) {
        try {
          const mr = await pubgFetch(`/shards/${shard}/matches/${matchId}`, env.PUBGKEY);
          if (!mr.ok) continue;
          const md = await mr.json();

          // Find participant for this player
          const roster = (md.included || []).find(x =>
            x.type === 'roster' &&
            (x.relationships?.participants?.data || []).some(pp => {
              const part = (md.included || []).find(i => i.id === pp.id && i.type === 'participant');
              return part?.attributes?.stats?.playerId === accountId;
            })
          );

          const partRef = (md.included || []).find(i =>
            i.type === 'participant' && i.attributes?.stats?.playerId === accountId
          );
          if (!partRef) continue;

          const stats = partRef.attributes.stats;
          const playedAt = md.data?.attributes?.createdAt || new Date().toISOString();
          const mapName = md.data?.attributes?.mapName || '';

          await env.DB.prepare(
            `INSERT OR IGNORE INTO matches
             (match_id, player_name, shard, played_at, kills, deaths, assists, damage, rank, headshots, map_name, won)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            matchId, name, shard, playedAt,
            stats.kills || 0,
            stats.deathType === 'alive' ? 0 : 1,
            stats.assists || 0,
            stats.damageDealt || 0,
            stats.winPlace || 0,
            stats.headshotKills || 0,
            mapName,
            stats.winPlace === 1 ? 1 : 0
          ).run();
        } catch (_) { /* skip failed match */ }
      }

      // 4. Aggregate stats
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const weekStr = new Date(now - 7 * 864e5).toISOString();

      const [todayRows, weekRows, allRows] = await Promise.all([
        env.DB.prepare(`SELECT * FROM matches WHERE player_name=? AND shard=? AND played_at >= ?`).bind(name, shard, todayStr + 'T00:00:00Z').all(),
        env.DB.prepare(`SELECT * FROM matches WHERE player_name=? AND shard=? AND played_at >= ?`).bind(name, shard, weekStr).all(),
        env.DB.prepare(`SELECT * FROM matches WHERE player_name=? AND shard=?`).bind(name, shard).all(),
      ]);

      return json({
        ok: true,
        synced: newIds.length,
        today: aggStats(todayRows.results),
        week: aggStats(weekRows.results),
        alltime: aggStats(allRows.results),
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
