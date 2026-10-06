import { BEATS, PEOPLE, RELATIONS, filmState, clamp, mix, smooth, route, type Point } from '../lib/immersive';

const root = document.documentElement;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const base = canvas.dataset.base!;
const sections = [...document.querySelectorAll<HTMLElement>('.beat')];
const copies = sections.map(s => s.querySelector<HTMLElement>('.copy')!);
const guide = document.querySelector<HTMLDialogElement>('#guide')!;
const motionButton = document.querySelector<HTMLButtonElement>('#motion')!;
const chapterLabel = document.querySelector<HTMLButtonElement>('#chapter-label')!;
const continueLink = document.querySelector<HTMLAnchorElement>('#continue')!;
const progressFill = document.querySelector<HTMLElement>('#progress-fill')!;
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
let quiet = reduceQuery.matches;
let autoReading = false;
let reading = false;
let width = innerWidth, height = innerHeight, ratio = 1;
let span = 1, target = 0, progress = 0, active = -1, raf = 0, last = 0, phase = 0;
let ready = false;
let opener: HTMLElement | null = null;
let demo: { chapter: number; start: number; done: boolean; button: HTMLButtonElement } | null = null;
const assets: Record<string, HTMLImageElement> = {};
const mint = [181, 245, 210], gold = [246, 181, 98];
const color = (c: number[], a: number) => 'rgba(' + c.map(Math.round).join(',') + ',' + clamp(a) + ')';
const isMobile = () => width <= 700;

function load(name: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image(); img.decoding = 'async'; img.src = base + 'art/immersive/' + name + '.webp';
    img.onload = () => { assets[name] = img; resolve(); };
    img.onerror = reject;
  });
}
function project(p: {x:number;y:number}): Point {
  return isMobile()
    ? { x: width * (.04 + p.x * .92), y: height * (.33 + p.y * .27) }
    : { x: width * (.30 + p.x * .66), y: height * (.53 + p.y * .40) };
}
function towers(state: ReturnType<typeof filmState>) {
  const defs = isMobile()
    ? [[.20,.49,.28], [.83,.50,.32], [.54,.59,.48]]
    : [[.59,.74,.43], [.86,.79,.48], [.745,.89,.73]];
  return defs.map(([x,y,h], i) => ({ x: x * width, y: y * height, h: h * height * mix(.69,1.08,state.growth) * state.rise, i }));
}
function backdrop(img: HTMLImageElement, zoom: number, px: number, py: number) {
  const scale = Math.max(width / img.width, height / img.height) * zoom;
  const iw = img.width * scale, ih = img.height * scale;
  // Center the river and garden rather than cropping to the left edge on phones.
  const focal = isMobile() ? .60 : .50;
  ctx.drawImage(img, (width - iw) * focal + px, (height - ih) * .5 + py, iw, ih);
}
function glow(x: number,y: number,r: number,c: number[],a: number) {
  const g = ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color(c,a)); g.addColorStop(.18,color(c,a*.65)); g.addColorStop(1,color(c,0));
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function pointOn(edge: number, u: number, capture: number, points: Point[], ts: ReturnType<typeof towers>) {
  const [a,b]=RELATIONS[edge]; const gate=ts[edge%3];
  return route(points[a],points[b],{x:gate.x,y:gate.y-9},capture,u);
}
function trace(edge: number, capture: number, points: Point[], ts: ReturnType<typeof towers>, end=1) {
  ctx.beginPath();
  for(let k=0;k<=32;k++) { const p=pointOn(edge,k/32*end,capture,points,ts); if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y); }
}
function corporateMark(x:number,y:number,size:number,kind:number,alpha:number) {
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle=color(gold,alpha);ctx.lineWidth=.075;ctx.lineCap='round';ctx.beginPath();
  if(kind===0){ctx.arc(-.28,0,.4,.4,5.8);ctx.moveTo(.68,0);ctx.arc(.28,0,.4,-2.7,2.7);}
  else if(kind===1){ctx.moveTo(-.45,-.55);ctx.lineTo(.55,0);ctx.lineTo(-.45,.55);ctx.closePath();ctx.moveTo(-.15,-.3);ctx.lineTo(.42,0);}
  else {ctx.moveTo(-.48,-.15);ctx.bezierCurveTo(-.05,-.8,.72,-.35,.4,.15);ctx.bezierCurveTo(.1,.72,-.62,.5,-.45,-.1);ctx.moveTo(.38,.28);ctx.lineTo(.65,.54);}
  ctx.stroke();ctx.restore();
}
function eye(x:number,y:number,r:number,intensity:number,time:number) {
  ctx.save();ctx.globalCompositeOperation='screen';
  glow(x,y,r*1.5,gold,intensity*.18);
  // An optical machine, rather than a literal character or brand mark.
  for(let i=0;i<4;i++) {
    ctx.beginPath();ctx.ellipse(x,y,r*(1+i*.18),r*(.20+i*.025),Math.sin(time*.12+i)*.10,0,Math.PI*2);
    ctx.strokeStyle=color(i%2 ? [181,169,221]:gold,intensity*(.7-i*.14));ctx.lineWidth=i===0?1.7:.6;ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(x-r,y);ctx.bezierCurveTo(x-r*.3,y-r*.56,x+r*.35,y-r*.56,x+r,y);ctx.bezierCurveTo(x+r*.3,y+r*.45,x-r*.35,y+r*.45,x-r,y);
  ctx.fillStyle=color(gold,intensity*.09);ctx.fill();ctx.strokeStyle=color(gold,intensity*.95);ctx.lineWidth=1.2;ctx.stroke();
  glow(x,y,r*.4,gold,intensity*.75);
  ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.ellipse(x,y,r*.045,r*.31,0,0,Math.PI*2);ctx.fillStyle=color([7,22,25],intensity);ctx.fill();ctx.globalCompositeOperation='screen';
  // Fine radial ticks make the iris read as an intelligence / attention lens.
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2+time*.13;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25);ctx.lineTo(x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32);ctx.strokeStyle=color(gold,intensity*.6);ctx.lineWidth=.6;ctx.stroke();}
  ctx.restore();
}
function draw(t:number,now:number) {
  if(!ready)return;
  const state=filmState(t), mobile=isMobile(), points=PEOPLE.map(project), ts=towers(state);
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#061e24';ctx.fillRect(0,0,width,height);
  ctx.save();
  const zoom=1.035+.065*(1-smooth(0,1.2,t))+.035*smooth(2,3.2,t)*(1-smooth(4,5.4,t));
  backdrop(assets.valley,zoom,Math.sin(t*.6)*width*.006,-state.growth*height*.008);
  if(state.life>0){ctx.globalAlpha=state.life;backdrop(assets.commons,zoom,Math.sin(t*.6)*width*.006,-state.growth*height*.008);ctx.globalAlpha=1;}
  // Continuous color-grade, shared by the scenery and composite architecture.
  ctx.fillStyle='rgba(2,20,28,'+( .26 + state.darkness*.46 - state.life*.12)+')';ctx.fillRect(0,0,width,height);
  const atmosphere=ctx.createLinearGradient(0,0,0,height);atmosphere.addColorStop(0,'rgba(2,21,29,'+(.22+state.darkness*.3)+')');atmosphere.addColorStop(.6,'rgba(3,36,37,0)');atmosphere.addColorStop(1,'rgba(1,20,22,.12)');ctx.fillStyle=atmosphere;ctx.fillRect(0,0,width,height);
  const netOpacity=state.network*(1-state.life*.47);
  const ink=mint.map((v,i)=>mix(v,gold[i],state.capture));
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
  RELATIONS.forEach((_,i)=>{
    const reveal=smooth(-.15+i*.009,.18+i*.009,t+.17);
    trace(i,state.capture,points,ts,reveal);
    ctx.strokeStyle=color(ink,netOpacity*(i%3===0?.40:.20));ctx.lineWidth=mobile?.7:1;ctx.stroke();
    if(!quiet){
      const u=(phase*(state.capture>.5?.10:.055)+i*.173)%1;
      const p=pointOn(i,u,state.capture,points,ts);
      if(i%3===0){glow(p.x,p.y,mobile?5:7,ink,.54);ctx.beginPath();ctx.arc(p.x,p.y,mobile?.8:1.05,0,Math.PI*2);ctx.fillStyle=color([242,255,232],.92);ctx.fill();}
    }
  });
  points.forEach((p,i)=>{const r=mobile?1.25:1.75;glow(p.x,p.y,r*7,ink,.32*netOpacity);ctx.fillStyle=color([239,255,228],.83*netOpacity);ctx.beginPath();ctx.arc(p.x,p.y,r*(.65+PEOPLE[i].depth*.45),0,Math.PI*2);ctx.fill();});
  ctx.restore();

  // Citadels share the grade and the ground plane. Their foundations spread
  // and their height falls as their functions return to the commons.
  ts.forEach(tower=>{
    if(tower.h<1)return;
    const fall=smooth(4.35,5.4,t);
    const img=assets.citadel;
    const tw=tower.h*img.width/img.height*(1+fall*1.4);
    const shade=ctx.createRadialGradient(tower.x,tower.y,0,tower.x,tower.y,tw*.64);
    shade.addColorStop(0,'rgba(0,8,13,'+(.6*state.rise)+')');shade.addColorStop(1,'rgba(0,8,13,0)');ctx.save();ctx.translate(0,tower.y*.77);ctx.scale(1,.23);ctx.fillStyle=shade;ctx.fillRect(tower.x-tw,tower.y-tw,tw*2,tw*2);ctx.restore();
    ctx.globalAlpha=clamp(state.rise*2)*(1-fall*.8);
    ctx.drawImage(img,tower.x-tw/2,tower.y-tower.h,tw,tower.h);
    ctx.globalAlpha=1;
    corporateMark(tower.x,tower.y-tower.h*.42,mobile?10:18,tower.i,state.capture*.8);
    // Gold moves up the facade: value is accumulated, not exchanged back.
    if(state.capture>.02){
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let j=0;j<3;j++){
        const x=tower.x+(j-1)*tw*.06;
        ctx.strokeStyle=color(gold,.15*state.capture);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,tower.y-tower.h*.12);ctx.quadraticCurveTo(x+tw*.04,tower.y-tower.h*.5,tower.x,tower.y-tower.h*.84);ctx.stroke();
        const u=(phase*(.16+.24*state.growth)+j*.31+tower.i*.16)%1;
        if(!quiet)glow(mix(x,tower.x,u),tower.y-tower.h*(.12+.72*u),mobile?5:9,gold,.8*state.capture);
      }ctx.restore();
    }
  });
  const main=ts[2];
  if(state.eye>0){
    const ex=main.x,ey=main.y-main.h*.82,r=mobile?width*.12:height*.105;
    ctx.save();ctx.globalCompositeOperation='screen';const beam=ctx.createLinearGradient(ex,ey,ex,height*.83);beam.addColorStop(0,color(gold,state.eye*.07));beam.addColorStop(1,color(gold,0));ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-width*.35,height*.95);ctx.lineTo(ex+width*.3,height*.95);ctx.closePath();ctx.fill();ctx.restore();
    eye(ex,ey,r,state.eye,phase);
  }
  // The first bypass blossoms into tendrils: architecture is reclaimed,
  // connections resume, and the same valley becomes inhabited.
  const bloom=smooth(3.65,4.25,t)*(1-smooth(5.1,5.8,t));
  if(bloom>0){ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<9;i++){const end=points[(i*3+2)%points.length];const origin={x:ts[i%3].x,y:ts[i%3].y};const p=smooth(3.7+i*.065,4.65+i*.06,t);ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.bezierCurveTo(origin.x+Math.sin(i*2)*width*.12,origin.y-height*.2*p,end.x,end.y-height*.20*p,end.x,end.y);ctx.strokeStyle=color(mint,bloom*.28);ctx.lineWidth=1.1;ctx.stroke();glow(end.x,end.y,18,mint,bloom*.28);}ctx.restore();}
  // Floating motes integrate the digital light into the atmosphere.
  if(!quiet){ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<24;i++){const x=((i*.381966+Math.sin(phase*.035+i)*.025)%1)*width;const y=height*(.39+((i*.273+phase*.006)% .60));glow(x,y,1.3+(i%3),state.darkness>.7?gold:mint,.18);}ctx.restore();}
  if(demo)drawExchange(points,ts,state,now);
  ctx.restore();
}
function drawExchange(points:Point[],ts:ReturnType<typeof towers>,state:ReturnType<typeof filmState>,now:number) {
  if(!demo)return;
  const p=quiet?1:clamp((now-demo.start)/3400);
  const captured=demo.chapter===2;
  const c=captured?gold:mint;
  ctx.save();ctx.globalCompositeOperation='screen';
  if(captured){
    const end={x:ts[0].x,y:ts[0].y-ts[0].h*.38};const a=points[0];
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mix(a.x,end.x,.5),a.y-height*.08,mix(a.x,end.x,Math.min(1,p*1.5)),mix(a.y,end.y,Math.min(1,p*1.5)));ctx.strokeStyle=color(gold,.9*(1-p*.4));ctx.lineWidth=1.8;ctx.stroke();
    glow(mix(a.x,end.x,Math.min(1,p*1.5)),mix(a.y,end.y,Math.min(1,p*1.5)),18,gold,1-p*.35);
  } else {
    const indices=demo.chapter===6?[0,4,8,12,16,20]:[0,4,8];
    indices.forEach((edge,j)=>{const local=clamp(p*2.1-j*.18);trace(edge,0,points,ts,local);ctx.strokeStyle=color(c,.85*(1-p*.3));ctx.lineWidth=1.8;ctx.stroke();const point=pointOn(edge,local,0,points,ts);glow(point.x,point.y,13,c,.85);});
    if(p>.65){const a=points[0];glow(a.x,a.y,18+(p-.65)*80,c,(1-p)*2.4);}
  }
  ctx.restore();
  if(p>=1&&!demo.done){demo.done=true;demo.button.disabled=false;const status=demo.button.parentElement!.querySelector<HTMLElement>('.exchange-result')!;status.textContent=captured?'The platform keeps the value.':demo.chapter===6?'Shared onward. Returned in another form.':'A direct connection. Something comes back.';}
}
function updateCopy(t:number) {
  if(reading)return;
  const nearest=Math.round(t);
  copies.forEach((copy,i)=>{
    const d=t-i;
    const opacity=i===0 ? 1-smooth(.12,.50,t) : i===7 ? smooth(-.5,-.16,d) : smooth(-.5,-.19,d)*(1-smooth(.19,.50,d));
    copy.style.opacity=String(opacity);
    copy.style.visibility=opacity>.005?'visible':'hidden';
    copy.style.transform=(i===0?'translateX(-50%) ':'')+'translateY('+(-d*(isMobile()?36:65))+'px)';
    sections[i].inert=opacity<.1;
    sections[i].setAttribute('aria-hidden',String(opacity<.1));
  });
  root.style.setProperty('--read-shade',String(mix(.35,.98,smooth(.3,.8,t))));
  progressFill.style.transform='scaleX('+clamp(t/7)+')';
  if(nearest!==active){
    active=nearest;chapterLabel.textContent=BEATS[active].chapter;
    continueLink.href='#'+BEATS[Math.min(7,active+1)].id;
    continueLink.querySelector('span')!.textContent=active===0?'Scroll to discover':active===7?'Back to the beginning':'Keep exploring';
    if(active===7)continueLink.href='#connection';
    if(demo&&demo.chapter!==active){demo.button.disabled=false;demo.button.parentElement!.querySelector('.exchange-result')!.textContent='';demo=null;}
  }
}
function tick(now:number) {
  raf=0;
  if(document.hidden||reading||guide.open){last=0;return;}
  const dt=Math.min(64,now-(last||now));last=now;
  progress=quiet?target:mix(progress,target,1-Math.exp(-Math.max(dt,16)/110));
  if(Math.abs(progress-target)<.0003)progress=target;
  if(!quiet)phase+=dt/1000;
  updateCopy(progress);
  draw(quiet?Math.round(progress):progress,now);
  if(!quiet||progress!==target||(demo&&!demo.done))raf=requestAnimationFrame(tick);
}
function request(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
function measure(){
  width=innerWidth;height=innerHeight;ratio=Math.min(devicePixelRatio||1,1.7);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  if(height < 430 && width < 600 && !reading) { autoReading=true; setReading(true); return; }
  if((height >= 430 || width >= 600) && autoReading) { autoReading=false; setReading(false); return; }
  span=sections[1].offsetTop-sections[0].offsetTop;
  target=clamp(scrollY/Math.max(1,span),0,7);
  if(quiet)progress=target;
  request();
}
function go(index:number) {
  guide.close();
  const top=sections[index].offsetTop;
  scrollTo({top,behavior:'auto'});
  target=index;progress=index;updateCopy(index);draw(index,performance.now());request();
}
function openGuide(source:HTMLElement) {opener=source;guide.showModal();document.querySelector<HTMLElement>('#chapters-close')!.focus();}
document.querySelector<HTMLElement>('#chapters-open')!.addEventListener('click',e=>openGuide(e.currentTarget as HTMLElement));
chapterLabel.addEventListener('click',()=>openGuide(chapterLabel));
document.querySelector('#chapters-close')!.addEventListener('click',()=>guide.close());
guide.addEventListener('close',()=>{opener?.focus({preventScroll:true});request();});
guide.addEventListener('click',e=>{if(e.target===guide){const r=guide.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)guide.close();}});
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href')!.slice(1),i=BEATS.findIndex(b=>b.id===id);
  if(i<0)return;
  e.preventDefault();
  if(a.classList.contains('skip-link')){setReading(true);sections[0].querySelector<HTMLElement>('h1')!.setAttribute('tabindex','-1');sections[0].querySelector<HTMLElement>('h1')!.focus();return;}
  history.replaceState(null,'','#'+id);go(i);
}));
function setQuiet(on:boolean){quiet=on;motionButton.setAttribute('aria-pressed',String(on));motionButton.setAttribute('aria-label',on?'Enable ambient motion':'Reduce motion');motionButton.querySelector('span')!.textContent=on?'Motion is quiet':'Quiet motion';progress=target;request();}
motionButton.addEventListener('click',()=>setQuiet(!quiet));reduceQuery.addEventListener('change',()=>setQuiet(reduceQuery.matches));
function setReading(on:boolean){
  const index=Math.max(0,active);reading=on;root.classList.toggle('reading',on);
  document.querySelector('#read-mode')!.textContent=on?'Return to the immersive story':'Read as a simple story';
  sections.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden');});guide.close();
  requestAnimationFrame(()=>{measure();if(on)sections[index].scrollIntoView({block:'start'});else go(index);});
}
document.querySelector('#read-mode')!.addEventListener('click',()=>setReading(!reading));
document.querySelectorAll<HTMLButtonElement>('[data-exchange]').forEach(button=>button.addEventListener('click',()=>{
  if(demo&&!demo.done)return;
  const chapter=Number(button.dataset.exchange);demo={chapter,start:performance.now(),done:false,button};button.disabled=!quiet;
  button.parentElement!.querySelector('.exchange-result')!.textContent=chapter===2?'Follow the light into the middle…':'Watch the connection travel…';
  if(reading||quiet){button.parentElement!.querySelector('.exchange-result')!.textContent=chapter===2?'The platform keeps the value.':chapter===6?'Shared onward. Returned in another form.':'A direct connection. Something comes back.';demo.done=true;button.disabled=false;}
  request();
}));
addEventListener('scroll',()=>{if(!reading)target=clamp(scrollY/Math.max(1,span),0,7);request();},{passive:true});
addEventListener('resize',measure);document.addEventListener('visibilitychange',request);
addEventListener('hashchange',()=>{const i=BEATS.findIndex(b=>'#'+b.id===location.hash);if(i>=0)go(i);});
setQuiet(quiet);measure();
Promise.all(['valley','commons','citadel'].map(load)).then(()=>{ready=true;canvas.parentElement!.classList.add('ready');const legacy: Record<string,string>={open:'connection',peers:'connection',captured:'capture',flow:'extraction',freed:'reconnect',homes:'belong',groups:'belong',alive:'living',place:'living',unfinished:'future',techne:'future'};const hash=location.hash.slice(1);const index=BEATS.findIndex(b=>b.id===(legacy[hash]||hash));if(index>=0&&!reading)go(index);request();}).catch(()=>{setReading(true);});
document.fonts.ready.then(measure);
(window as any).__film={state:()=>({progress,target,active,quiet,reading,ready,people:PEOPLE.length,edges:RELATIONS.length,width,height}),go,freeze:()=>setQuiet(true)};
