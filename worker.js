// PUBG Stat AI – Cloudflare Worker + D1
// Routes:
//   GET  /                           -> main overlay HTML
//   GET  /alerts?name=&shard=        -> StreamLabs alert overlay HTML
//   GET  /api/health
//   GET  /api/players?name=&shard=   -> PUBG players proxy
//   GET  /api/matches/:id?shard=     -> PUBG match proxy
//   GET  /api/telemetry?url=         -> telemetry proxy
//   GET  /api/sync?name=&shard=      -> D1 sync + lifetime stats
//   POST /api/event                  -> queue kill/knock/win alert
//   GET  /api/events/next?name=      -> consume next alert event

// ============================================================
// ALERT OVERLAY HTML
// ============================================================
const ALERTS_HTML = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PUBG Alerts</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;background:transparent;width:1920px;height:1080px;overflow:hidden;font-family:'Inter',system-ui,sans-serif;}
.wrap{position:fixed;bottom:160px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:0;pointer-events:none;}
.alert{display:none;flex-direction:column;align-items:center;gap:0;}
.alert.show{display:flex;animation:alertIn .5s cubic-bezier(.17,.67,.35,1.4) forwards;}
.alert.hide{animation:alertOut .4s ease-in forwards;}
/* KILL */
.kill .bg{background:linear-gradient(135deg,rgba(180,30,30,.97),rgba(230,60,20,.97));}
.kill .icon{color:#ff9988;}
/* KNOCK */
.knock .bg{background:linear-gradient(135deg,rgba(180,110,10,.97),rgba(220,160,20,.97));}
.knock .icon{color:#ffe080;}
/* WIN */
.win .bg{background:linear-gradient(135deg,rgba(160,110,0,.97),rgba(255,210,30,.97));animation:winpulse 1s ease-in-out infinite alternate;}
.win .icon{color:#fff8c0;}
.bg{min-width:580px;max-width:760px;padding:22px 36px 22px 22px;border-radius:22px;display:flex;align-items:center;gap:20px;box-shadow:0 20px 80px rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.18);}
.icon{font-size:3.2rem;line-height:1;min-width:64px;text-align:center;filter:drop-shadow(0 2px 8px rgba(0,0,0,.4));}
.text{display:flex;flex-direction:column;gap:2px;}
.evtype{font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);}
.main{font-size:2.1rem;font-weight:900;color:#fff;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,.4);}
.sub{font-size:1rem;font-weight:700;color:rgba(255,255,255,.8);margin-top:2px;}
.killcount{position:absolute;right:-18px;top:-18px;width:54px;height:54px;border-radius:50%;background:#ff2222;border:3px solid #fff;display:grid;place-items:center;font-size:1.4rem;font-weight:900;color:#fff;box-shadow:0 4px 20px rgba(255,0,0,.5);}
.ainner{position:relative;display:inline-flex;}
/* WIN extras */
.confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.c{position:absolute;width:10px;height:10px;border-radius:2px;animation:fall linear infinite;}
@keyframes fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(1100px) rotate(720deg);opacity:0}}
@keyframes alertIn{from{opacity:0;transform:scale(.6) translateY(60px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes alertOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(.8) translateY(30px)}}
@keyframes winpulse{from{box-shadow:0 20px 80px rgba(255,180,0,.5)}to{box-shadow:0 20px 120px rgba(255,220,0,.9)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="alert" id="alert">
    <div class="ainner">
      <div class="bg">
        <div class="icon" id="aicon">&#x1F480;</div>
        <div class="text">
          <div class="evtype" id="atype">KILL</div>
          <div class="main" id="amain">Enemy Down</div>
          <div class="sub" id="asub">M416 &#x2022; fejl\u00f6v\u00e9s</div>
        </div>
      </div>
      <div class="killcount" id="akillcount" style="display:none">1</div>
    </div>
  </div>
</div>
<div class="confetti" id="confetti"></div>

<script>
const params=new URLSearchParams(location.search);
const playerName=params.get('name')||'';
const shard=params.get('shard')||'steam';
const Q=[];
let busy=false;

const $=id=>document.getElementById(id);
const EL={alert:$('alert'),icon:$('aicon'),type:$('atype'),main:$('amain'),sub:$('asub'),kc:$('akillcount'),conf:$('confetti')};

const CFG={
  kill:  {icon:'\u{1F480}',type:'KILL',cls:'kill',dur:3200},
  knock: {icon:'\u{1F4A5}',type:'KNOCK',cls:'knock',dur:2800},
  win:   {icon:'\u{1F357}',type:'CHICKEN DINNER',cls:'win',dur:6000},
};

async function poll(){
  if(!playerName)return;
  try{
    const r=await fetch('/api/events/next?name='+encodeURIComponent(playerName)+'&shard='+shard);
    if(r.ok){
      const d=await r.json();
      if(d.event)Q.push(d.event);
    }
  }catch(_){}
  if(!busy&&Q.length)showNext();
}

function showNext(){
  if(!Q.length){busy=false;return;}
  busy=true;
  const ev=Q.shift();
  const cfg=CFG[ev.event_type]||CFG.kill;
  const payload=JSON.parse(ev.payload||'{}');

  EL.alert.className='alert '+cfg.cls;
  EL.icon.textContent=cfg.icon;
  EL.type.textContent=cfg.type;

  if(ev.event_type==='kill'){
    EL.main.textContent=payload.victim||'Enemy';
    EL.sub.textContent=(payload.weapon||'')+(payload.headshot?' \u2022 headshot':'');
    EL.kc.textContent=payload.kills||'';
    EL.kc.style.display=payload.kills?'grid':'none';
  }else if(ev.event_type==='knock'){
    EL.main.textContent=payload.victim||'Enemy';
    EL.sub.textContent=(payload.weapon||'KNOCK')+' \u2022 knocked down';
    EL.kc.style.display='none';
  }else if(ev.event_type==='win'){
    EL.main.textContent='VICTORY ROYALE';
    EL.sub.textContent='#1 \u2022 '+payload.kills+' kill \u2022 '+payload.damage+' dmg';
    EL.kc.style.display='none';
    launchConfetti();
  }

  EL.alert.classList.add('show');
  setTimeout(()=>{
    EL.alert.classList.add('hide');
    setTimeout(()=>{
      EL.alert.className='alert';
      EL.conf.innerHTML='';
      busy=false;
      if(Q.length)showNext();
    },400);
  },cfg.dur);
}

function launchConfetti(){
  EL.conf.innerHTML='';
  const colors=['#ff4444','#ffcc00','#44ff88','#4499ff','#ff44cc','#ffffff'];
  for(let i=0;i<80;i++){
    const c=document.createElement('div');
    c.className='c';
    c.style.cssText='left:'+Math.random()*100+'%;background:'+colors[i%colors.length]+';animation-duration:'+(2+Math.random()*3)+'s;animation-delay:'+Math.random()*2+'s;width:'+(6+Math.random()*10)+'px;height:'+(6+Math.random()*10)+'px';
    EL.conf.appendChild(c);
  }
  setTimeout(()=>EL.conf.innerHTML='',7000);
}

if(playerName)setInterval(poll,1500);
else document.body.insertAdjacentHTML('afterbegin','<div style="color:#fff;font-family:sans-serif;padding:20px;font-size:1rem">Add meg a nevet az URL-ben: <code>?name=FarkasFarek&shard=steam</code></div>');
</script>
</body>
</html>`;

// ============================================================
// MAIN OVERLAY HTML
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
.overlay{position:fixed;inset:0;padding:14px;pointer-events:none}
.shell{display:grid;grid-template-columns:300px 1fr 310px;gap:12px;height:100%}
.panel{background:linear-gradient(180deg,rgba(13,17,21,.93),rgba(13,17,21,.76));border:1px solid var(--border);border-radius:18px;backdrop-filter:blur(18px);box-shadow:0 18px 60px rgba(0,0,0,.3);overflow:hidden;pointer-events:auto}
.ph{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:8px;font-size:.74rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.logo{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#4f98a3,#83dce8);color:#071116}
.badge{padding:.24rem .52rem;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--border);font-size:.67rem;color:var(--muted)}
.sg{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:11px}
.card{padding:11px;border-radius:13px;background:var(--card);border:1px solid var(--border)}
.cl{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.cv{font-size:clamp(1.3rem,.9rem+1.3vw,2.1rem);font-weight:800;line-height:1.05;margin-top:4px}
.cs{font-size:.74rem;color:var(--muted);margin-top:2px}
.feed{padding:9px;display:flex;flex-direction:column;gap:6px;max-height:36vh;overflow:auto}
.fev{display:grid;grid-template-columns:40px 1fr auto;gap:8px;align-items:center;padding:8px;border-radius:11px;background:var(--card);border:1px solid var(--border)}
.fi{width:40px;height:40px;border-radius:10px;background:rgba(79,152,163,.18);display:grid;place-items:center;font-size:.7rem;font-weight:800;color:#ddfbff}
.ft{font-size:.83rem;font-weight:700}.fm{font-size:.7rem;color:var(--muted)}
.ftag{padding:.2rem .44rem;border-radius:999px;font-size:.6rem;font-weight:700;border:1px solid var(--border);background:rgba(255,255,255,.04)}
.stage{display:flex;align-items:flex-end;justify-content:center}
.tw{width:min(720px,100%);padding-bottom:14px;display:flex;justify-content:center}
.toast{display:none;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;min-width:320px;max-width:720px;padding:15px 19px;border-radius:20px;background:linear-gradient(135deg,rgba(10,14,18,.96),rgba(13,20,25,.93));border:1px solid rgba(255,255,255,.13);box-shadow:0 20px 60px rgba(0,0,0,.35);pointer-events:auto}
.toast.show{display:grid;animation:enter .3s ease}
.tbig{font-size:clamp(1.3rem,.8rem+1.1vw,2.2rem);font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.tsub{font-size:.76rem;color:var(--muted);margin-top:2px}
.tcount{font-size:clamp(1.5rem,.8rem+1.4vw,2.6rem);font-weight:900;color:#dbfaff}
.tico{width:48px;height:48px;border-radius:12px;background:rgba(79,152,163,.2);display:grid;place-items:center;font-size:.74rem;font-weight:800;color:#ddfbff}
.tabs{display:flex;gap:3px;padding:9px 11px 0}
.tab{flex:1;padding:6px 3px;border-radius:9px;border:1px solid transparent;background:transparent;color:var(--muted);font-size:.7rem;font-weight:700;cursor:pointer;text-align:center;transition:.15s}
.tab.active{background:rgba(79,152,163,.18);border-color:rgba(79,152,163,.4);color:#83dce8}
.tabcontent{display:none;padding:9px 11px 11px}
.tabcontent.active{display:flex;flex-direction:column;gap:8px}
.srow{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.scard{padding:10px 11px;border-radius:12px;background:var(--card);border:1px solid var(--border)}
.scl{font-size:.61rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.scv{font-size:1.25rem;font-weight:800;margin-top:3px}
.scs{font-size:.7rem;color:var(--muted);margin-top:2px}
.srow3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.scard3{padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid var(--border)}
.sl3{font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.sv3{font-size:1rem;font-weight:800;margin-top:3px}
.syncbar{padding:0 11px 11px;display:flex;flex-direction:column;gap:5px}
.syncbtn{width:100%;padding:8px;border-radius:10px;border:1px solid rgba(79,152,163,.4);background:rgba(79,152,163,.1);color:#83dce8;font-weight:700;font-size:.76rem;cursor:pointer}
.syncing{opacity:.5;pointer-events:none}
.lastsync{font-size:.63rem;color:var(--muted);text-align:center;margin-top:4px}
.controls{position:fixed;right:13px;bottom:13px;width:min(410px,calc(100vw - 26px));max-height:86vh;overflow:auto;padding:13px;border-radius:18px;background:rgba(10,14,17,.97);border:1px solid var(--border);box-shadow:0 24px 70px rgba(0,0,0,.4);pointer-events:auto}
.controls h1{margin:0 0 4px;font-size:1rem}.controls p{margin:0 0 11px;font-size:.77rem;color:var(--muted)}
.field{display:grid;gap:4px;margin-bottom:8px}.field label{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.field input,.field select{width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)}
.alerturl{background:rgba(79,152,163,.08);border:1px solid rgba(79,152,163,.3);border-radius:10px;padding:9px 11px;margin-top:8px}
.alerturl .alabel{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:#83dce8;margin-bottom:5px}
.alerturl input{width:100%;background:transparent;border:none;color:#aee8ef;font-size:.78rem;font-family:monospace;outline:none;cursor:text}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btns{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px}
.btn{padding:9px 11px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text);font-weight:700;cursor:pointer;transition:transform .15s}
.btn.p{background:linear-gradient(135deg,#4f98a3,#82d9e4);color:#081115;border-color:transparent}
.btn:hover{transform:translateY(-1px)}
.hint{margin-top:7px;font-size:10.5px;line-height:1.5;color:var(--muted)}
.hide-ui .controls{display:none}
.minimal .left,.minimal .right{display:none!important}
.minimal .shell{grid-template-columns:1fr}
.minimal .stage{justify-content:flex-start;align-items:flex-start}
.minimal .tw{justify-content:flex-start;padding-top:20px;padding-left:20px}
@keyframes enter{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
@media(max-width:800px){.shell{grid-template-columns:1fr}.left,.right{display:none}.stage{align-items:flex-start}.tw{padding-top:10px;justify-content:stretch}}
</style>
</head>
<body>
<div class="overlay"><div class="shell">
  <aside class="panel left">
    <div class="ph"><div class="brand"><div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M4 8h16v8H4z"/><path d="M8 4v4M16 4v4"/></svg></div><span>PUBG Live</span></div><span class="badge" id="mode">Idle</span></div>
    <div class="sg">
      <div class="card"><div class="cl">Kills</div><div class="cv" id="kills">0</div><div class="cs">session</div></div>
      <div class="card"><div class="cl">K/D</div><div class="cv" id="kd">0.00</div><div class="cs">ratio</div></div>
      <div class="card"><div class="cl">Rang</div><div class="cv" id="rank">#--</div><div class="cs">helyez\u00e9s</div></div>
      <div class="card"><div class="cl">Damage</div><div class="cv" id="damage">0</div><div class="cs">sebz\u00e9s</div></div>
    </div>
    <div class="ph" style="border-top:1px solid var(--border)"><strong style="font-size:.78rem">Kill feed</strong><span class="badge" id="feedcount">0</span></div>
    <div class="feed" id="feed"></div>
  </aside>
  <main class="stage"><div class="tw"><div class="toast" id="toast">
    <div class="tico" id="tico">M4</div>
    <div><div class="tbig" id="ttitle">Kill</div><div class="tsub" id="tsub">ellens\u00e9g kiiktatva</div></div>
    <div class="tcount" id="tcount">1</div>
  </div></div></main>
  <aside class="panel right">
    <div class="ph"><strong>Statisztika</strong><span class="badge" id="statsbadge">--</span></div>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('today')">Mai nap</button>
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
        <div class="scard3"><div class="sl3">Dmg</div><div class="sv3" id="t-d">--</div></div>
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
        <div class="scard3"><div class="sl3">Dmg</div><div class="sv3" id="w-d">--</div></div>
      </div>
    </div>
    <div id="tab-alltime" class="tabcontent">
      <div class="srow">
        <div class="scard"><div class="scl">Kills</div><div class="scv" id="a-kills">--</div><div class="scs">lifetime</div></div>
        <div class="scard"><div class="scl">K/D</div><div class="scv" id="a-kd">--</div><div class="scs">ratio</div></div>
      </div>
      <div class="srow">
        <div class="scard"><div class="scl">Meccsek</div><div class="scv" id="a-m">--</div><div class="scs">j\u00e1tszott</div></div>
        <div class="scard"><div class="scl">Gy\u0151zelmek</div><div class="scv" id="a-w">--</div><div class="scs">top1</div></div>
      </div>
      <div class="srow3">
        <div class="scard3"><div class="sl3">Top10</div><div class="sv3" id="a-t10">--</div></div>
        <div class="scard3"><div class="sl3">Headshot</div><div class="sv3" id="a-hs">--</div></div>
        <div class="scard3"><div class="sl3">Dmg/meccs</div><div class="sv3" id="a-dpg">--</div></div>
      </div>
    </div>
    <div class="syncbar">
      <button class="syncbtn" id="syncBtn" onclick="doSync()">\u21bb Szinkroniz\u00e1l\u00e1s</button>
      <div class="lastsync" id="lastsync">M\u00e9g nem szinkroniz\u00e1lt</div>
    </div>
  </aside>
</div></div>
<section class="controls">
  <h1>PUBG Live Overlay</h1>
  <p>Live kill feed + t\u00f6rt\u00e9nelmi statisztika + StreamLabs alertek. <strong>H</strong> = panel elrejt\u00e9se.</p>
  <div class="field"><label>PUBG j\u00e1t\u00e9kosn\u00e9v</label><input id="iname" placeholder="pl. FarkasFarek"></div>
  <div class="g2">
    <div class="field"><label>Platform</label><select id="iplat"><option value="steam">Steam (PC)</option><option value="xbox">Xbox</option><option value="psn">PlayStation</option><option value="kakao">Kakao</option></select></div>
    <div class="field"><label>Friss\u00edt\u00e9s (mp)</label><input id="iint" type="number" min="10" value="15"></div>
  </div>
  <div class="field"><label>Layout</label><select id="ilay"><option value="full">Full (3 panel)</option><option value="minimal">Minimal (csak toast)</option></select></div>
  <div class="btns">
    <button class="btn p" id="bstart">\u25b6 Live ind\u00edt\u00e1s</button>
    <button class="btn" id="bdemo">Demo</button>
    <button class="btn" id="bstop">Stop</button>
    <button class="btn" id="bhide">UI elrejt\u00e9se</button>
  </div>
  <div class="alerturl">
    <div class="alabel">\u{1F514} StreamLabs Alert URL – add hozz\u00e1 Browser Source-k\u00e9nt</div>
    <input id="alertUrlInput" readonly onclick="this.select()" value="" placeholder="Add meg a nevet a Live ind\u00edt\u00e1s el\u0151tt...">
  </div>
  <div class="hint">Kill / Knock / Win alert automatikusan jelenik meg a stream-en. Alert URL m\u00e1sol\u00e1s ut\u00e1n add hozz\u00e1 StreamLabs OBS-ben: Sources \u2192 + \u2192 Browser Source.</div>
</section>
<script>
const WM={Item_Weapon_M416_C:{s:'M4',l:'M416'},Item_Weapon_HK416_C:{s:'416',l:'K416'},Item_Weapon_AK47_C:{s:'AKM',l:'AKM'},Item_Weapon_BerylM762_C:{s:'BRL',l:'Beryl'},Item_Weapon_Vector_C:{s:'VEC',l:'Vector'},Item_Weapon_AWM_C:{s:'AWM',l:'AWM'},Item_Weapon_M24_C:{s:'M24',l:'M24'},Item_Weapon_DP28_C:{s:'DP',l:'DP-28'},Item_Weapon_Mini14_C:{s:'M14',l:'Mini14'},Item_Weapon_SKS_C:{s:'SKS',l:'SKS'},Grenade:{s:'Nade',l:'Grenade'},Damage_BlueZone:{s:'Zone',l:'Blue Zone'},Punch:{s:'Fist',l:'Melee'}};
const S={kills:0,kd:0,rank:'--',damage:0,feed:[],processedKills:new Set(),processedKnocks:new Set(),wonMatches:new Set(),currentMatchId:null,deaths:0,loop:null,mode:'Idle'};
const $=id=>document.getElementById(id);
const fmt=n=>n==null||n==='--'?'--':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
const E={mode:$('mode'),kills:$('kills'),kd:$('kd'),rank:$('rank'),damage:$('damage'),feed:$('feed'),feedcount:$('feedcount'),toast:$('toast'),tico:$('tico'),ttitle:$('ttitle'),tsub:$('tsub'),tcount:$('tcount'),statsbadge:$('statsbadge'),lastsync:$('lastsync'),alertUrl:$('alertUrlInput')};

function updateAlertUrl(){
  const name=$('iname').value.trim();const plat=$('iplat').value;
  if(name)E.alertUrl.value=location.origin+'/alerts?name='+encodeURIComponent(name)+'&shard='+plat;
}
$('iname').addEventListener('input',updateAlertUrl);
$('iplat').addEventListener('change',updateAlertUrl);

function renderLive(){E.mode.textContent=S.mode;E.kills.textContent=S.kills;E.kd.textContent=Number(S.kd).toFixed(2);E.rank.textContent=S.rank==='--'?'#--':'#'+S.rank;E.damage.textContent=Math.round(S.damage);E.feedcount.textContent=S.feed.length;E.feed.innerHTML=S.feed.map(f=>'<div class="fev"><div class="fi">'+f.s+'</div><div><div class="ft">'+f.title+'</div><div class="fm">'+f.meta+'</div></div><span class="ftag">'+f.tag+'</span></div>').join('');}
function renderPeriod(pre,d){$(pre+'-kills').textContent=fmt(d.kills);$(pre+'-kd').textContent=Number(d.kd||0).toFixed(2);$(pre+'-m').textContent=fmt(d.matches);$(pre+'-w').textContent=fmt(d.wins);$(pre+'-d').textContent=fmt(d.damage);}
function renderAlltime(d){$('a-kills').textContent=fmt(d.kills);$('a-kd').textContent=Number(d.kd||0).toFixed(2);$('a-m').textContent=fmt(d.matches);$('a-w').textContent=fmt(d.wins);$('a-t10').textContent=fmt(d.top10s);$('a-hs').textContent=fmt(d.headshots);$('a-dpg').textContent=d.matches>0?fmt(Math.round(d.damage/d.matches)):'--';E.statsbadge.textContent=new Date().toLocaleTimeString('hu-HU');E.lastsync.textContent='Szinkroniz\u00e1lva: '+new Date().toLocaleTimeString('hu-HU');}
function switchTab(t){document.querySelectorAll('.tab').forEach((b,i)=>b.classList.toggle('active',['today','week','alltime'][i]===t));document.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));$('tab-'+t).classList.add('active');}
function showToast(w,victim,total){E.tico.textContent=w.s;E.ttitle.textContent=w.l+' kill';E.tsub.textContent=victim+' kiiktatva';E.tcount.textContent=total;E.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>E.toast.classList.remove('show'),3400);}
function getW(code){return WM[code]||{s:(code||'UNK').slice(0,4),l:code||'Unknown'};}
function pushFeed(item){S.feed.unshift(item);S.feed=S.feed.slice(0,10);}

function postEvent(type,payload){
  const name=$('iname').value.trim();const plat=$('iplat').value;
  if(!name)return;
  fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({player_name:name,shard:plat,event_type:type,payload})}).catch(()=>{});
}

async function doSync(){
  const name=$('iname').value.trim();const plat=$('iplat').value;if(!name)return;
  const btn=$('syncBtn');btn.textContent='Folyamatban...';btn.classList.add('syncing');
  try{
    const r=await fetch('/api/sync?name='+encodeURIComponent(name)+'&shard='+plat);
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Sync hiba '+r.status);}
    const d=await r.json();
    if(d.today)renderPeriod('t',d.today);if(d.week)renderPeriod('w',d.week);if(d.alltime)renderAlltime(d.alltime);
  }catch(e){E.lastsync.textContent='Hiba: '+String(e.message).slice(0,45);}
  finally{btn.textContent='\u21bb Szinkroniz\u00e1l\u00e1s';btn.classList.remove('syncing');}
}

async function tick(){
  const name=$('iname').value.trim();const plat=$('iplat').value;
  if(!name)throw new Error('Add meg a j\u00e1t\u00e9kosnevedet.');
  S.mode='Live';renderLive();
  const pr=await fetch('/api/players?name='+encodeURIComponent(name)+'&shard='+plat);
  if(!pr.ok){const e=await pr.json().catch(()=>({}));throw new Error(e.error||'Players hiba '+pr.status);}
  const pd=await pr.json();const player=pd.data?.[0];
  if(!player)throw new Error('J\u00e1t\u00e9kos nem tal\u00e1lhat\u00f3: '+name);
  const matchId=player.relationships?.matches?.data?.[0]?.id;
  if(!matchId)throw new Error('Nincs el\u00e9rhet\u0151 match.');
  if(S.currentMatchId!==matchId){S.currentMatchId=matchId;S.processedKills.clear();S.processedKnocks.clear();S.feed=[];S.kills=0;S.deaths=0;S.damage=0;S.rank='--';}
  const mr=await fetch('/api/matches/'+matchId+'?shard='+plat);
  if(!mr.ok)throw new Error('Match hiba '+mr.status);
  const md=await mr.json();
  const asset=(md.included||[]).find(x=>x.type==='asset');
  if(!asset?.attributes?.URL)throw new Error('Telemetry URL hi\u00e1nyzik.');
  const tr=await fetch('/api/telemetry?url='+encodeURIComponent(asset.attributes.URL));
  if(!tr.ok)throw new Error('Telemetry hiba '+tr.status);
  const tel=await tr.json();
  let dmg=0,deaths=S.deaths,rank=S.rank;
  for(const ev of tel){
    if(ev._T==='LogPlayerTakeDamage'&&ev.attacker?.name===name)dmg+=Number(ev.damage||0);
    // KILL
    if(ev._T==='LogPlayerKillV2'){
      const kid=ev._D+'|'+ev.victim?.name;
      if(ev.killer?.name===name&&!S.processedKills.has(kid)){
        S.processedKills.add(kid);S.kills++;
        const w=getW(ev.damageCauserName);const hs=ev.damageReason==='HeadShot'||ev.isHeadshot;
        pushFeed({s:w.s,title:ev.victim?.name||'?',meta:(hs?'HS':'kill')+'\u00b7'+new Date(ev._D).toLocaleTimeString('hu-HU'),tag:hs?'HS':'Kill'});
        showToast(w,ev.victim?.name||'?',S.kills);
        postEvent('kill',{victim:ev.victim?.name||'?',weapon:w.l,headshot:hs,kills:S.kills});
      }
      if(ev.victim?.name===name)deaths++;
    }
    // KNOCK (groggify)
    if(ev._T==='LogPlayerMakeGroggy'){
      const nid=ev._D+'|'+ev.victim?.name;
      if(ev.attacker?.name===name&&!S.processedKnocks.has(nid)){
        S.processedKnocks.add(nid);
        const w=getW(ev.damageCauserName);
        pushFeed({s:'\u{1F4A5}',title:ev.victim?.name||'?',meta:'knock\u00b7'+new Date(ev._D).toLocaleTimeString('hu-HU'),tag:'Knock'});
        postEvent('knock',{victim:ev.victim?.name||'?',weapon:w.l});
      }
    }
    // WIN
    if(ev._T==='LogMatchEnd'&&Array.isArray(ev.characters)){
      const me=ev.characters.find(c=>c.character?.name===name||c.name===name);
      if(me?.character?.ranking)rank=me.character.ranking;
      if(me?.character?.ranking===1&&!S.wonMatches.has(matchId)){
        S.wonMatches.add(matchId);
        postEvent('win',{kills:S.kills,damage:Math.round(S.damage)});
      }
    }
  }
  S.damage=Math.max(S.damage,dmg);S.rank=rank;S.deaths=deaths;S.kd=S.kills/Math.max(1,S.deaths);
  renderLive();
}

function startLive(){
  stopLoop();updateAlertUrl();doSync();
  const sec=Math.max(10,Number($('iint').value||15));
  tick().catch(handleErr);
  S.loop=setInterval(()=>tick().catch(handleErr),sec*1000);
}
function startDemo(){
  stopLoop();S.mode='Demo';S.kills=7;S.kd=3.5;S.rank=4;S.damage=1240;S.feed=[];renderLive();
  renderPeriod('t',{kills:12,kd:2.4,matches:5,wins:1,damage:8400});
  renderPeriod('w',{kills:89,kd:3.1,matches:32,wins:6,damage:62000});
  renderAlltime({kills:1240,kd:3.4,matches:520,wins:87,top10s:195,headshots:380,damage:312000});
  S.loop=setInterval(()=>{
    const ws=Object.values(WM);const w=ws[Math.floor(Math.random()*ws.length)];
    const v=['Enemy1','Rusher','SnipeKing','ZoneDancer','CampLord'][Math.floor(Math.random()*5)];
    S.kills++;S.damage+=Math.floor(50+Math.random()*200);
    pushFeed({s:w.s,title:v,meta:'kill\u00b7'+new Date().toLocaleTimeString('hu-HU'),tag:'Kill'});
    showToast(w,v,S.kills);renderLive();
  },2800);
}
function stopLoop(){clearInterval(S.loop);S.loop=null;S.mode='Idle';renderLive();}
function handleErr(e){S.mode='Hiba';E.mode.textContent='Hiba: '+String(e.message||e).slice(0,50);console.error(e);}
$('bstart').addEventListener('click',startLive);$('bdemo').addEventListener('click',startDemo);$('bstop').addEventListener('click',stopLoop);$('bhide').addEventListener('click',()=>document.body.classList.toggle('hide-ui'));$('ilay').addEventListener('change',e=>{document.body.classList.remove('minimal');if(e.target.value==='minimal')document.body.classList.add('minimal');});document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h')document.body.classList.toggle('hide-ui');if(e.key.toLowerCase()==='d')startDemo();});renderLive();
</script>
</body></html>`;

// ============================================================
// HELPERS
// ============================================================
function jsonR(body, status = 200) {
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
function aggD1(rows) {
  const kills  = rows.reduce((s,r)=>s+(r.kills||0),0);
  const deaths = rows.reduce((s,r)=>s+(r.deaths||0),0);
  return { matches:rows.length, kills, deaths,
    wins:rows.reduce((s,r)=>s+(r.won||0),0),
    damage:Math.round(rows.reduce((s,r)=>s+(r.damage||0),0)),
    kd: kills/Math.max(1,deaths) };
}
function aggLifetime(gms) {
  let kills=0,deaths=0,wins=0,damage=0,top10s=0,headshots=0,matches=0;
  for(const m of Object.values(gms||{})){kills+=m.kills||0;deaths+=m.losses||0;wins+=m.wins||0;damage+=m.damageDealt||0;top10s+=m.top10s||0;headshots+=m.headshotKills||0;matches+=m.roundsPlayed||0;}
  return {kills,deaths,wins,damage:Math.round(damage),top10s,headshots,matches,kd:kills/Math.max(1,deaths)};
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p   = url.pathname;
    const m   = request.method;

    if (p === '/' || p === '/index.html')
      return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8' } });

    // Alert overlay for StreamLabs Browser Source
    if (p === '/alerts')
      return new Response(ALERTS_HTML, { headers: { 'content-type': 'text/html;charset=UTF-8' } });

    if (p === '/api/health') return jsonR({ ok: true, ts: Date.now() });

    // Players proxy
    if (p === '/api/players') {
      const name=url.searchParams.get('name'), shard=url.searchParams.get('shard');
      if(!name||!shard) return jsonR({error:'name es shard kell'},400);
      if(!env.PUBGKEY)  return jsonR({error:'PUBGKEY hianyzik'},500);
      const res=await pubgFetch(`/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,env.PUBGKEY);
      return new Response(await res.text(),{status:res.status,headers:{'content-type':'application/vnd.api+json','Access-Control-Allow-Origin':'*'}});
    }

    // Match proxy
    if (p.startsWith('/api/matches/')) {
      const id=p.split('/').pop(), shard=url.searchParams.get('shard');
      if(!id||!shard)  return jsonR({error:'id es shard kell'},400);
      if(!env.PUBGKEY) return jsonR({error:'PUBGKEY hianyzik'},500);
      const res=await pubgFetch(`/shards/${shard}/matches/${id}`,env.PUBGKEY);
      return new Response(await res.text(),{status:res.status,headers:{'content-type':'application/vnd.api+json','Access-Control-Allow-Origin':'*'}});
    }

    // Telemetry proxy
    if (p === '/api/telemetry') {
      const tUrl=url.searchParams.get('url');
      if(!tUrl) return jsonR({error:'url kell'},400);
      const res=await fetch(tUrl);
      return new Response(await res.text(),{status:res.status,headers:{'content-type':'application/json','Access-Control-Allow-Origin':'*'}});
    }

    // POST /api/event  – queue a kill/knock/win alert
    if (p === '/api/event' && m === 'POST') {
      if(!env.DB) return jsonR({error:'D1 nincs kotve'},500);
      let body;
      try{ body=await request.json(); }catch{ return jsonR({error:'invalid JSON'},400); }
      const {player_name,shard,event_type,payload}=body;
      if(!player_name||!event_type) return jsonR({error:'player_name es event_type kell'},400);
      await env.DB.prepare(
        `INSERT INTO events (player_name,event_type,payload,created_at) VALUES (?,?,?,?)`
      ).bind(player_name, event_type, JSON.stringify(payload||{}), new Date().toISOString()).run();
      return jsonR({ok:true});
    }

    // GET /api/events/next?name=  – consume next pending alert
    if (p === '/api/events/next') {
      if(!env.DB) return jsonR({error:'D1 nincs kotve'},500);
      const name=url.searchParams.get('name');
      if(!name) return jsonR({error:'name kell'},400);
      // Clean up events older than 10 minutes to avoid backlog
      await env.DB.prepare(
        `DELETE FROM events WHERE player_name=? AND created_at < ?`
      ).bind(name, new Date(Date.now()-600000).toISOString()).run();
      // Get oldest unconsumed event
      const row=await env.DB.prepare(
        `SELECT * FROM events WHERE player_name=? AND consumed=0 ORDER BY created_at ASC LIMIT 1`
      ).bind(name).first();
      if(!row) return jsonR({event:null});
      await env.DB.prepare(`UPDATE events SET consumed=1 WHERE id=?`).bind(row.id).run();
      return jsonR({event:row});
    }

    // GET /api/sync  – D1 match sync + PUBG lifetime stats
    if (p === '/api/sync') {
      const name=url.searchParams.get('name'), shard=url.searchParams.get('shard');
      if(!name||!shard) return jsonR({error:'name es shard kell'},400);
      if(!env.PUBGKEY)  return jsonR({error:'PUBGKEY hianyzik'},500);
      if(!env.DB)       return jsonR({error:'D1 DB nincs kotve'},500);
      const pr=await pubgFetch(`/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,env.PUBGKEY);
      if(!pr.ok) return jsonR({error:'Players API hiba '+pr.status},pr.status);
      const pd=await pr.json();
      const player=pd.data?.[0];
      if(!player) return jsonR({error:'Jatekos nem talalhato: '+name},404);
      const accountId=player.id;
      const matchIds=(player.relationships?.matches?.data||[]).map(m=>m.id).slice(0,8);
      // Lifetime stats
      let alltime=null;
      try{
        const lr=await pubgFetch(`/shards/${shard}/players/${accountId}/seasons/lifetime`,env.PUBGKEY);
        if(lr.ok){const ld=await lr.json();alltime=aggLifetime(ld?.data?.attributes?.gameModeStats);}
      }catch(_){}
      // D1 sync
      const placeholders=matchIds.length?matchIds.map(()=>'?').join(','):null;
      const existing=placeholders
        ?(await env.DB.prepare(`SELECT match_id FROM matches WHERE match_id IN (${placeholders})`).bind(...matchIds).all()).results.map(r=>r.match_id)
        :[];
      const newIds=matchIds.filter(id=>!existing.includes(id));
      let synced=0;
      for(const matchId of newIds){
        try{
          const mr=await pubgFetch(`/shards/${shard}/matches/${matchId}`,env.PUBGKEY);
          if(!mr.ok)continue;
          const md=await mr.json();
          const partRef=(md.included||[]).find(i=>i.type==='participant'&&(
            i.attributes?.stats?.playerId===accountId||
            i.attributes?.stats?.name?.toLowerCase()===name.toLowerCase()));
          if(!partRef)continue;
          const st=partRef.attributes.stats;
          const playedAt=md.data?.attributes?.createdAt||new Date().toISOString();
          await env.DB.prepare(
            `INSERT OR IGNORE INTO matches (match_id,player_name,shard,played_at,kills,deaths,assists,damage,rank,headshots,map_name,won)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(matchId,name,shard,playedAt,st.kills||0,st.deathType!=='alive'?1:0,st.assists||0,
            st.damageDealt||0,st.winPlace||0,st.headshotKills||0,
            md.data?.attributes?.mapName||'',st.winPlace===1?1:0).run();
          synced++;
        }catch(_){}
      }
      const now=new Date();
      const todayStr=now.toISOString().slice(0,10)+'T00:00:00Z';
      const weekStr=new Date(now-7*864e5).toISOString();
      const [tR,wR]=await Promise.all([
        env.DB.prepare(`SELECT * FROM matches WHERE player_name=? AND shard=? AND played_at>=?`).bind(name,shard,todayStr).all(),
        env.DB.prepare(`SELECT * FROM matches WHERE player_name=? AND shard=? AND played_at>=?`).bind(name,shard,weekStr).all(),
      ]);
      return jsonR({ok:true,synced,today:aggD1(tR.results),week:aggD1(wR.results),
        alltime:alltime||{kills:0,kd:0,matches:0,wins:0,top10s:0,headshots:0,damage:0}});
    }

    return jsonR({error:'Not found'},404);
  },
};
