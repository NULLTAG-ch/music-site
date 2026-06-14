// NULLTAG · Lichtjahr Vol.2 — Physik-Video (timeline scenes for animations.jsx)
// Loaded after React, Babel and animations.jsx. Mounts itself into #root.
/* global React, ReactDOM */
const { Stage, Sprite, useTime, useSprite, Easing, interpolate, animate, clamp } = window;

const C = {
  void: '#0a0a0a', deep: '#050505', bone: '#e8e3da', dim: '#c9c4bc', muted: '#8a8580',
  red: '#ff2a55', cosmic: '#e879c4', glut: '#ff6a2a', blue: '#5fc8e0', amber: '#ffd9a0', good: '#7ad08a',
};
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISP = "'Bebas Neue', 'Oswald', sans-serif";
const GROT = "'Space Grotesk', system-ui, sans-serif";
const BRUT = "'Inter Tight', system-ui, sans-serif";
const W = 1280, H = 720, CX = 640, CY = 296;

// deterministic rng
function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ── shared overlays ──────────────────────────────────────────────
function Starfield({ n = 90, seed = 7, opacity = 0.75 }) {
  const T = useTime();
  const stars = React.useMemo(() => {
    const r = mulberry(seed); const a = [];
    for (let i=0;i<n;i++) a.push({ x:r()*W, y:r()*H, s:r()*1.6+0.4, ph:r()*6.28, sp:r()*1.5+0.5, c: r()>0.85 ? C.cosmic : C.bone });
    return a;
  }, [n, seed]);
  return (<div style={{position:'absolute',inset:0}}>
    {stars.map((st,i)=>{ const tw = 0.5+0.5*Math.sin(T*st.sp+st.ph);
      return <div key={i} style={{position:'absolute',left:st.x,top:st.y,width:st.s,height:st.s,borderRadius:'50%',background:st.c,opacity:opacity*(0.3+0.7*tw)}}/>; })}
  </div>);
}
function Vignette(){ return <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 46%, transparent 42%, rgba(5,5,5,0.55) 82%, rgba(0,0,0,0.92) 100%)'}}/>; }
function Grain(){ const T=useTime(); const o=(Math.floor(T*10)%4)*9; return <div style={{position:'absolute',inset:-30,pointerEvents:'none',opacity:0.05,mixBlendMode:'overlay',transform:`translate(${o}px,${(o%18)}px)`,backgroundImage:"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"}}/>; }
function GlobalBg(){ return <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 42% 32% at 20% 26%, rgba(95,140,200,0.11), transparent 60%), radial-gradient(ellipse 38% 28% at 82% 72%, rgba(232,121,196,0.09), transparent 60%), radial-gradient(ellipse 30% 40% at 60% 50%, rgba(255,106,42,0.05), transparent 55%), radial-gradient(ellipse at 50% 45%, #0d0a14 0%, ${C.void} 58%, ${C.deep} 100%)`}}/>; }
function Stamp(){ return (<>
  <div style={{position:'absolute',top:34,left:40,fontFamily:MONO,fontSize:14,fontWeight:500,letterSpacing:'0.4em',color:C.bone,opacity:0.85}}>NULLTAG</div>
  <div style={{position:'absolute',top:36,right:40,fontFamily:MONO,fontSize:11,letterSpacing:'0.22em',color:C.muted}}>LICHTJAHR VOL.2</div>
  <div style={{position:'absolute',bottom:34,right:40,fontFamily:MONO,fontSize:11,letterSpacing:'0.18em',color:C.muted,opacity:0.8}}>music.nulltag.ch</div>
</>); }

// camera shell: slow ken-burns + crossfade at scene edges
function SceneShell({ children, zoomFrom = 1, zoomTo = 1.12, origin = '50% 50%', ease = Easing.easeInOutSine }) {
  const { progress, localTime, duration } = useSprite();
  const scale = zoomFrom + (zoomTo - zoomFrom) * ease(progress);
  const op = Math.min(clamp(localTime/0.55,0,1), clamp((duration-localTime)/0.6,0,1));
  return <div style={{position:'absolute',inset:0,transform:`scale(${scale})`,transformOrigin:origin,opacity:op,willChange:'transform,opacity'}}>{children}</div>;
}

// caption block (cat eyebrow / huge title / one line / chip) with staggered reveal
function Caption({ cat, status, statusTone, title, line, chip }) {
  const { localTime, duration } = useSprite();
  const rev = (d) => { const t = Easing.easeOutCubic(clamp((localTime-d)/0.55,0,1)); return { opacity:t, transform:`translateY(${(1-t)*22}px)` }; };
  const fade = clamp((duration-localTime)/0.55,0,1);
  const stTone = statusTone==='live'?C.good:statusTone==='soon'?C.red:C.cosmic;
  return (<div style={{position:'absolute',left:0,right:0,bottom:0,paddingBottom:60,textAlign:'center',opacity:fade,willChange:'opacity',background:'linear-gradient(0deg, rgba(5,5,5,0.92) 24%, rgba(5,5,5,0.45) 56%, transparent)'}}>
    <div style={{...rev(0.05),fontFamily:MONO,fontSize:16,letterSpacing:'0.24em',color:C.cosmic,marginBottom:14,display:'flex',gap:16,justifyContent:'center',alignItems:'center'}}>
      <span>{cat}</span>{status && <span style={{color:stTone}}>{status}</span>}
    </div>
    <div style={{...rev(0.18),fontFamily:DISP,fontSize:title.length>12?112:132,lineHeight:0.84,letterSpacing:'-0.01em',textTransform:'uppercase',color:C.bone,textShadow:'0 6px 50px rgba(0,0,0,0.7)',marginBottom:18}}>{title}</div>
    <div style={{...rev(0.34),fontFamily:GROT,fontSize:25,lineHeight:1.45,color:C.bone,maxWidth:760,margin:'0 auto 16px'}} dangerouslySetInnerHTML={{__html:line}}/>
    {chip && <div style={{...rev(0.5),display:'inline-block',fontFamily:MONO,fontSize:14,letterSpacing:'0.16em',textTransform:'uppercase',color:C.bone,border:`1px solid ${C.red}`,background:'rgba(255,42,85,0.12)',padding:'9px 16px'}}>{chip}</div>}
  </div>);
}

// glow helper
const glow = (color, blur, size) => `0 0 ${blur}px ${size}px ${color}`;

// ── 1 · INTRO ────────────────────────────────────────────────────
function IntroScene(){
  const { localTime, duration, progress } = useSprite();
  const T = useTime();
  const titleT = Easing.easeOutExpo(clamp(localTime/0.9,0,1));
  const subT = Easing.easeOutCubic(clamp((localTime-0.7)/0.6,0,1));
  const pulse = 0.9 + 0.25*Math.sin(T*1.6);
  const fade = clamp((duration-localTime)/0.6,0,1);
  return (<div style={{position:'absolute',inset:0,opacity:fade}}>
    <SceneShell zoomFrom={1.18} zoomTo={1} ease={Easing.easeOutCubic}><Starfield n={120} seed={3}/></SceneShell>
    <div style={{position:'absolute',left:CX,top:CY-30,transform:'translate(-50%,-50%)',width:240,height:240,borderRadius:'50%',background:`radial-gradient(circle, ${C.cosmic} 0%, transparent 62%)`,opacity:0.5*pulse,filter:'blur(8px)'}}/>
    <div style={{position:'absolute',left:0,right:0,top:CY-70,textAlign:'center'}}>
      <div style={{opacity:subT,fontFamily:MONO,fontSize:16,letterSpacing:'0.3em',color:C.muted,marginBottom:18}}>6 TRACKS · 6 ECHTE PHÄNOMENE</div>
      <div style={{opacity:titleT,transform:`scale(${0.92+0.08*titleT})`,fontFamily:DISP,fontSize:150,lineHeight:0.82,textTransform:'uppercase',letterSpacing:'-0.01em',color:C.bone}}>Lichtjahr<br/>Vol.2</div>
      <div style={{width:interpolate([0,1],[0,200])(subT),height:4,background:C.red,margin:'10px auto 0'}}/>
      <div style={{opacity:subT,fontFamily:GROT,fontSize:23,color:C.dim,marginTop:26}}>Echte Astrophysik als Musik. <b style={{color:C.bone}}>Zum Anschauen.</b></div>
    </div>
  </div>);
}

// ── 2 · TRAPPIST — orbital resonance ────────────────────────────
function TrappistViz(){
  const T = useTime();
  const orbits = [70,108,150,196,244,294,340];
  const speeds = [0.62,0.44,0.33,0.255,0.205,0.165,0.135]; // 8:5:3:2-ish ratios
  const hab = {2:1,3:1,4:1};
  return (<div style={{position:'absolute',inset:0}}>
    <div style={{position:'absolute',left:CX,top:CY,width:44,height:44,margin:'-22px',borderRadius:'50%',background:`radial-gradient(circle, #fff, ${C.amber} 45%, ${C.glut} 75%, transparent)`,boxShadow:glow('rgba(232,112,58,0.6)',40,12)}}/>
    {orbits.map((r,i)=>{ const a=T*speeds[i]+i*1.1; const x=CX+r*Math.cos(a), y=CY+r*Math.sin(a); const isH=hab[i];
      return (<React.Fragment key={i}>
        <div style={{position:'absolute',left:CX-r,top:CY-r,width:r*2,height:r*2,borderRadius:'50%',border:`1px solid rgba(232,227,218,${isH?0.16:0.09})`}}/>
        <div style={{position:'absolute',left:x,top:y,width:isH?13:9,height:isH?13:9,margin:isH?'-6.5px':'-4.5px',borderRadius:'50%',background:isH?C.cosmic:C.bone,boxShadow:isH?glow(C.cosmic,12,1):'none'}}/>
      </React.Fragment>); })}
  </div>);
}
function TrappistScene(){ return (<><SceneShell zoomFrom={1.0} zoomTo={1.16}><Starfield seed={11}/><TrappistViz/></SceneShell>
  <Caption cat="LJ-07 · 195 BPM" status="● LIVE" statusTone="live" title="Trappist Loop" line="<b style='color:#e879c4'>7 Planeten</b> umkreisen einen Zwergstern — perfekt im Takt (8:5:3:2)." chip="40 Lichtjahre · 7-Beat-Phrasen"/></>); }

// ── 3 · EVENT HORIZON — black hole + time dilation ──────────────
function BlackHoleViz(){
  const T = useTime();
  const disk = (T*42)%360;
  // infalling particle: spirals in on a 3.4s loop, stretches near horizon
  const per = 3.4; const u = (T%per)/per; const ang = u*Math.PI*5; const rad = interpolate([0,0.82,1],[230,60,52])(u);
  const px = CX+rad*Math.cos(ang), py = CY+rad*Math.sin(ang); const stretch = interpolate([0,0.7,1],[1,2.6,6])(u); const pOp = interpolate([0,0.7,1],[1,0.9,0])(u);
  return (<div style={{position:'absolute',inset:0}}>
    <div style={{position:'absolute',left:CX,top:CY,width:300,height:300,margin:'-150px',borderRadius:'50%',transform:`rotate(${disk}deg)`,background:`conic-gradient(from 0deg, transparent, ${C.glut} 18%, ${C.amber} 30%, ${C.glut} 42%, transparent 60%, #a83818 78%, transparent)`,WebkitMaskImage:'radial-gradient(circle, transparent 36%, #000 39%, #000 50%, transparent 53%)',maskImage:'radial-gradient(circle, transparent 36%, #000 39%, #000 50%, transparent 53%)'}}/>
    <div style={{position:'absolute',left:CX,top:CY,width:150,height:150,margin:'-75px',borderRadius:'50%',boxShadow:glow('rgba(255,217,160,0.5)',22,3)}}/>
    <div style={{position:'absolute',left:CX,top:CY,width:138,height:138,margin:'-69px',borderRadius:'50%',boxShadow:'inset 0 0 0 1.5px rgba(255,238,210,0.88), 0 0 26px 4px rgba(255,205,150,0.45)'}}/>
    <div style={{position:'absolute',left:CX,top:CY,width:128,height:128,margin:'-64px',borderRadius:'50%',background:'#000',boxShadow:`0 0 0 2px rgba(255,106,42,0.4), inset 0 0 30px #000`}}/>
    <div style={{position:'absolute',left:px,top:py,width:6,height:6*stretch,margin:'-3px',borderRadius:'50%',background:C.bone,opacity:pOp,transform:`rotate(${ang*57.3+90}deg)`,boxShadow:glow('rgba(232,227,218,0.7)',8,0)}}/>
  </div>);
}
function EventHorizonScene(){ return (<><SceneShell zoomFrom={1.04} zoomTo={1.18}><Starfield seed={5}/><BlackHoleViz/></SceneShell>
  <Caption cat="LJ-08 · 200 BPM" status="● LIVE" statusTone="live" title="Event Horizon" line="Am Rand eines <b style='color:#e879c4'>Schwarzen Lochs</b> friert die Zeit ein. Licht kommt nicht zurück." chip="Outro: 200 → 140 BPM"/></>); }

// ── 4 · ANDROMEDA — galaxy collision ────────────────────────────
function Galaxy({ cx, cy, rot, scale=1 }){
  return (<div style={{position:'absolute',left:cx,top:cy,width:240,height:240,margin:'-120px',transform:`rotate(${rot}deg) scale(${scale})`}}>
    <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`radial-gradient(circle at 50% 50%, #fff 0%, ${C.amber} 6%, rgba(232,121,196,0.5) 22%, rgba(95,140,200,0.28) 46%, transparent 70%)`}}/>
    <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(from 0deg, transparent 0 12%, rgba(232,227,218,0.2) 16%, transparent 24% 62%, rgba(232,121,196,0.22) 68%, transparent 78%)`,WebkitMaskImage:'radial-gradient(circle, transparent 6%, #000 10%, transparent 72%)',maskImage:'radial-gradient(circle, transparent 6%, #000 10%, transparent 72%)'}}/>
  </div>);
}
function AndromedaViz(){
  const T = useTime(); const { progress } = useSprite();
  const gap = interpolate([0,1],[280,70],Easing.easeInCubic)(progress);
  const flash = progress>0.86 ? Easing.easeOutExpo(clamp((progress-0.86)/0.14,0,1)) : 0;
  return (<div style={{position:'absolute',inset:0}}>
    <Galaxy cx={CX-gap} cy={CY} rot={T*9} scale={1}/>
    <Galaxy cx={CX+gap} cy={CY+10} rot={-T*11} scale={0.84}/>
    <div style={{position:'absolute',left:CX,top:CY+5,width:120,height:120,margin:'-60px',borderRadius:'50%',background:`radial-gradient(circle, #fff, ${C.cosmic} 50%, transparent 72%)`,opacity:flash*0.9,transform:`scale(${0.6+flash*1.6})`}}/>
  </div>);
}
function AndromedaScene(){ return (<><SceneShell zoomFrom={1.1} zoomTo={1.02} ease={Easing.easeInOutSine}><Starfield seed={21}/><AndromedaViz/></SceneShell>
  <Caption cat="LJ-09 · 190 BPM" status="● LIVE" statusTone="live" title="Andromeda" line="Zwei Galaxien auf <b style='color:#e879c4'>Kollisionskurs</b> — sie verschmelzen in 4 Mrd. Jahren." chip="~110 km/s"/></>); }

// ── 5 · SUPERNOVA — core collapse + shockwave (the action beat) ──
function SupernovaViz(){
  const { progress, localTime } = useSprite();
  const T = useTime();
  // phases over the 8s: breathe -> collapse -> flash -> shock + debris
  const breathe = 1 + 0.12*Math.sin(T*3);
  let coreScale = breathe;
  if (progress>0.40 && progress<0.5) coreScale = interpolate([0.40,0.5],[breathe,0.25])(progress);
  else if (progress>=0.5) coreScale = interpolate([0.5,0.56,1],[0.25,2.0,0.7])(progress);
  const flash = progress>=0.5 ? Easing.easeOutExpo(clamp(1-(progress-0.5)/0.10,0,1)) : 0;
  const shockP = clamp((progress-0.5)/0.5,0,1);
  const shock = interpolate([0,1],[0,11])(Easing.easeOutQuart(shockP));
  const shockOp = interpolate([0,0.1,1],[0,0.9,0])(shockP);
  const debris = React.useMemo(()=>{ const r=mulberry(99); const a=[]; for(let i=0;i<26;i++) a.push({ang:r()*6.28,sp:0.6+r()*0.8,sz:2+r()*3,c:r()>0.5?C.glut:C.amber}); return a; },[]);
  return (<div style={{position:'absolute',inset:0}}>
    {/* shockwave ring */}
    <div style={{position:'absolute',left:CX,top:CY,width:60,height:60,margin:'-30px',borderRadius:'50%',border:`2px solid ${C.glut}`,transform:`scale(${shock})`,opacity:shockOp}}/>
    <div style={{position:'absolute',left:CX,top:CY,width:60,height:60,margin:'-30px',borderRadius:'50%',border:`2px solid ${C.red}`,transform:`scale(${shock*0.82})`,opacity:shockOp*0.7}}/>
    {/* debris */}
    {shockP>0 && debris.map((d,i)=>{ const dist=shockP*340*d.sp; const x=CX+dist*Math.cos(d.ang), y=CY+dist*Math.sin(d.ang);
      return <div key={i} style={{position:'absolute',left:x,top:y,width:d.sz,height:d.sz,margin:`-${d.sz/2}px`,borderRadius:'50%',background:d.c,opacity:interpolate([0,0.2,1],[0,1,0])(shockP),boxShadow:glow('rgba(255,106,42,0.6)',6,0)}}/>; })}
    {/* remnant nebula */}
    <div style={{position:'absolute',left:CX,top:CY,width:380,height:380,margin:'-190px',borderRadius:'50%',background:`radial-gradient(circle, rgba(255,106,42,0.18), transparent 60%)`,opacity:shockP}}/>
    {/* core */}
    <div style={{position:'absolute',left:CX,top:CY,width:54,height:54,margin:'-27px',borderRadius:'50%',background:`radial-gradient(circle, #fff, ${C.amber} 50%, ${C.glut} 82%, transparent)`,transform:`scale(${coreScale})`,boxShadow:glow('rgba(255,106,42,0.7)',40,14)}}/>
    {/* full-screen flash */}
    <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 41%, #fff, rgba(255,240,220,0.6) 40%, transparent 70%)',opacity:flash,pointerEvents:'none'}}/>
  </div>);
}
function SupernovaScene(){ return (<><SceneShell zoomFrom={1.12} zoomTo={1.0} ease={Easing.easeOutCubic}><Starfield seed={33}/><SupernovaViz/></SceneShell>
  <Caption cat="LJ-10 · 200 BPM" status="● LIVE" statusTone="live" title="Supernova" line="Ein Stern stirbt — und leuchtet kurz <b style='color:#e879c4'>heller als eine Galaxie</b>." chip="Hier entsteht Gold & Eisen"/></>); }

// ── 6 · MICROWAVE — pull back to the whole universe ─────────────
function MicrowaveViz(){
  const T = useTime();
  const speck = React.useMemo(()=>{ const r=mulberry(64); const a=[]; for(let i=0;i<70;i++){const ang=r()*6.28,rad=r()*150;a.push({x:CX+rad*Math.cos(ang),y:CY+rad*Math.sin(ang),s:1+r()*2,c:r()>0.6?C.blue:r()>0.3?C.glut:C.bone});} return a; },[]);
  const rings=[0,2,4];
  return (<div style={{position:'absolute',inset:0}}>
    {rings.map((d,i)=>{ const u=((T+d)%6)/6; return <div key={i} style={{position:'absolute',left:CX,top:CY,width:40,height:40,margin:'-20px',borderRadius:'50%',border:`1px solid ${C.blue}`,transform:`scale(${u*12})`,opacity:(1-u)*0.5}}/>; })}
    <div style={{position:'absolute',left:CX,top:CY,width:320,height:320,margin:'-160px',borderRadius:'50%',background:`radial-gradient(circle at 38% 32%, rgba(95,200,224,0.22), transparent 42%), radial-gradient(circle at 70% 66%, rgba(255,106,42,0.18), transparent 40%), radial-gradient(circle at 50% 50%, rgba(232,227,218,0.10), rgba(10,10,10,0.5) 72%)`,boxShadow:'inset 0 0 60px rgba(0,0,0,0.6)'}}/>
    {speck.map((s,i)=><div key={i} style={{position:'absolute',left:s.x,top:s.y,width:s.s,height:s.s,borderRadius:'50%',background:s.c,opacity:0.5}}/>)}
  </div>);
}
function MicrowaveScene(){ return (<><SceneShell zoomFrom={2.4} zoomTo={1.0} ease={Easing.easeOutCubic}><Starfield seed={48}/><MicrowaveViz/></SceneShell>
  <Caption cat="LJ-11 · 190 BPM" status="◷ FR 20.06" statusTone="soon" title="Microwave" line="Das <b style='color:#5fc8e0'>älteste Licht</b> im All — du kannst es hören (Rauschen zwischen TV-Sendern)." chip="2,7 Kelvin · 13,8 Mrd. Jahre"/></>); }

// ── 7 · LAST LIGHT — the final fading star ──────────────────────
function LastLightViz(){
  const T = useTime(); const { progress } = useSprite();
  const bright = interpolate([0,0.55,0.84,0.92,1],[1,0.7,0.05,0.18,0.04],Easing.easeInOutSine)(progress);
  const flick = 0.85+0.15*Math.sin(T*7);
  const sf = React.useMemo(()=>{ const r=mulberry(77); const a=[]; for(let i=0;i<60;i++) a.push({x:r()*W,y:r()*H,s:r()*1.4+0.4,out:0.3+r()*0.6}); return a; },[]);
  return (<div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 50%, #0a0808 0%, #050505 70%, #000 100%)`}}>
    {sf.map((s,i)=><div key={i} style={{position:'absolute',left:s.x,top:s.y,width:s.s,height:s.s,borderRadius:'50%',background:C.bone,opacity:clamp(s.out-progress*0.9,0,1)*0.6}}/>)}
    <div style={{position:'absolute',left:CX,top:CY,width:24,height:24,margin:'-12px',borderRadius:'50%',background:`radial-gradient(circle, #ffdede, ${C.red} 55%, transparent 75%)`,opacity:bright*flick,transform:`scale(${0.6+bright*0.7})`,boxShadow:glow('rgba(255,42,85,0.55)',28*bright,6*bright)}}/>
  </div>);
}
function LastLightScene(){ return (<><SceneShell zoomFrom={1.0} zoomTo={1.2} ease={Easing.easeInQuad}><LastLightViz/></SceneShell>
  <Caption cat="LJ-12 · 185 BPM" status="◷ 02.07" statusTone="soon" title="Last Light" line="Der <b style='color:#e879c4'>allerletzte Stern</b> sendet sein letztes Photon. Danach: Dunkelheit." chip="Ende der Zeit"/></>); }

// ── 8 · OUTRO ────────────────────────────────────────────────────
function OutroScene(){
  const { localTime, duration } = useSprite(); const T = useTime();
  const a = Easing.easeOutExpo(clamp(localTime/0.8,0,1));
  const b = Easing.easeOutCubic(clamp((localTime-0.6)/0.6,0,1));
  const c = Easing.easeOutCubic(clamp((localTime-1.1)/0.6,0,1));
  const fade = clamp((duration-localTime)/0.6,0,1);
  const pulse=0.9+0.2*Math.sin(T*1.5);
  return (<div style={{position:'absolute',inset:0,opacity:fade}}>
    <Starfield n={90} seed={9}/>
    <div style={{position:'absolute',left:CX,top:CY-20,transform:'translate(-50%,-50%)',width:300,height:300,borderRadius:'50%',background:`radial-gradient(circle, ${C.red} 0%, transparent 60%)`,opacity:0.32*pulse,filter:'blur(6px)'}}/>
    <div style={{position:'absolute',left:0,right:0,top:CY-90,textAlign:'center'}}>
      <div style={{opacity:a,fontFamily:MONO,fontSize:15,letterSpacing:'0.3em',color:C.muted,marginBottom:20}}>LICHTJAHR VOL.2 · NULLTAG</div>
      <div style={{opacity:a,transform:`scale(${0.94+0.06*a})`,fontFamily:DISP,fontSize:128,lineHeight:0.84,textTransform:'uppercase',color:C.bone}}>Hör die Physik</div>
      <div style={{width:b*180,height:4,background:C.red,margin:'14px auto 0'}}/>
      <div style={{opacity:b,fontFamily:GROT,fontSize:23,color:C.dim,marginTop:26}}>Auf allen gängigen Streaming-Diensten</div>
      <div style={{opacity:c,fontFamily:MONO,fontSize:18,letterSpacing:'0.2em',color:C.bone,marginTop:18}}>26. JUNI 2026</div>
      <div style={{opacity:c,fontFamily:MONO,fontSize:13,letterSpacing:'0.18em',color:C.muted,marginTop:14}}>SPOTIFY · APPLE MUSIC · SOUNDCLOUD · DEEZER · YOUTUBE</div>
    </div>
  </div>);
}

// ── TIME LABEL (for commenting) ──────────────────────────────────
function TimeLabel(){ const T=useTime(); React.useEffect(()=>{ const r=document.getElementById('video-root'); if(r) r.dataset.screenLabel = 't='+Math.floor(T)+'s'; },[Math.floor(T)]); return null; }

// ── ROOT ─────────────────────────────────────────────────────────
function PhysicsVideo(){
  return (
    <Stage width={W} height={H} duration={60} background={C.deep} persistKey="nulltag-physics-video">
      <GlobalBg/>
      <TimeLabel/>
      <Sprite start={0}    end={5.25}><IntroScene/></Sprite>
      <Sprite start={5}    end={13.25}><TrappistScene/></Sprite>
      <Sprite start={13}   end={21.25}><EventHorizonScene/></Sprite>
      <Sprite start={21}   end={29.25}><AndromedaScene/></Sprite>
      <Sprite start={29}   end={37.25}><SupernovaScene/></Sprite>
      <Sprite start={37}   end={45.25}><MicrowaveScene/></Sprite>
      <Sprite start={45}   end={53.25}><LastLightScene/></Sprite>
      <Sprite start={53}   end={60}><OutroScene/></Sprite>
      <Vignette/>
      <Grain/>
      <Stamp/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PhysicsVideo/>);
