import { landscapeCamera } from '../lib/camera';
import { PHI, HUBS, BRANCHES, FEDERATION_LINKS } from '../lib/federation';
import { SOURCES } from '../lib/chapters';
import { BEATS, LAST, sceneAt, chapterIndex, PEOPLE, RELATIONS, filmState, clamp, mix, smooth, route, type Point } from '../lib/immersive';

const root = document.documentElement;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const base = canvas.dataset.base!;
const sections = [...document.querySelectorAll<HTMLElement>('.beat')];
const copies = sections.map(s => s.querySelector<HTMLElement>('.copy')!);
const guide = document.querySelector<HTMLDialogElement>('#guide')!;
const noteDialog = document.querySelector<HTMLDialogElement>('#chapter-note')!;
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
const exchangeOutcome=(id:string)=>({packets:'A message crosses independent networks.',extraction:'The platform keeps the value.',living:'Shared onward. Returned in another form.',remix:'A local variation. The same shared language.',federation:'More communities. Shared reach. Local control.'}[id]||'A direct connection. Something comes back.');
const mint = [181, 245, 210], gold = [246, 181, 98];
const color = (c: number[], a: number) => 'rgba(' + c.map(Math.round).join(',') + ',' + clamp(a) + ')';
let camera=landscapeCamera(innerWidth,innerHeight,0);
const isMobile = () => width <= 700;

function load(name: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image(); img.decoding = 'async'; img.src = base + 'art/immersive/' + name + '.webp';
    img.onload = () => { assets[name] = img; resolve(); };
    img.onerror = reject;
  });
}
function project(p: {x:number;y:number}): Point {
  return isMobile()?camera.point(.49+p.x*.20,.34+p.y*.26):camera.point(.30+p.x*.66,.53+p.y*.40);
}
function towers(state: ReturnType<typeof filmState>) {
  const defs=isMobile()?[[.51,.50,.28],[.67,.51,.32],[.595,.60,.48]]:[[.59,.74,.43],[.86,.79,.48],[.745,.89,.73]];
  const size=Math.min(1,height*(isMobile()?.50:.78)/(camera.h*(isMobile()?.48:.73)*1.08));
  return defs.map(([x,y,h],i)=>({...camera.point(x,y),h:camera.h*h*size*mix(.69,1.08,state.growth)*state.rise,i}));
}
function backdrop(img: HTMLImageElement) {ctx.drawImage(img,camera.x,camera.y,camera.w,camera.h);}
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
/** Detailed, reversible illustrations inhabit the same ground plane. */
function drawMechanisms(n:number,points:Point[],ts:ReturnType<typeof towers>,state:ReturnType<typeof filmState>) {
  const at=(id:string,spread=.95)=>{const index=chapterIndex(id);if(index<0)return 0;const d=Math.abs(n-index);return 1-smooth(.25,spread,d);};
  const origins=smooth(.05,.2,state.t)*(1-smooth(.5,1.4,state.t));

  const scale=isMobile()?.72:1;
  const stroke=(a:Point,b:Point,c:number[],opacity:number,bend=40)=>{
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,Math.min(a.y,b.y)-bend,b.x,b.y);ctx.strokeStyle=color(c,opacity);ctx.lineWidth=1;ctx.stroke();
  };
  ctx.save();
  // Small inhabited relay pavilions, with copper roofs and glass interiors.
  if(origins>0){
    const alpha=origins;
    for(let i=0;i<points.length;i+=3){
      const p=points[i],r=(12+PEOPLE[i].depth*11)*scale;
      ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;
      const wall=ctx.createLinearGradient(-r,-r*2,r,0);wall.addColorStop(0,'#b5f5d27a');wall.addColorStop(.5,'#163c40e6');wall.addColorStop(1,'#071d25');
      ctx.fillStyle=wall;ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(-r,-r*1.35);ctx.quadraticCurveTo(0,-r*2.5,r,-r*1.35);ctx.lineTo(r,0);ctx.closePath();ctx.fill();
      ctx.strokeStyle=color(mint,.65);ctx.lineWidth=.8;ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,-r*1.4,r*1.18,r*.35,0,Math.PI,Math.PI*2);ctx.strokeStyle=color(gold,.65);ctx.stroke();
      for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(k*r*.52,-r*1.3);ctx.lineTo(k*r*.52,-r*.12);ctx.strokeStyle=color(mint,.4);ctx.stroke();}
      ctx.fillStyle=color(mint,.85);ctx.fillRect(-r*.22,-r*.7,r*.44,r*.5);
      ctx.beginPath();ctx.ellipse(0,2,r*1.5,r*.32,0,0,Math.PI*2);ctx.strokeStyle=color(mint,.24);ctx.stroke();
      glow(0,-r*.4,r*2,mint,.22);ctx.restore();
      // Slow expanding ripples show a station joining the shared network.
      const u=quiet?.45:(phase*.16+i*.17)%1;
      ctx.beginPath();ctx.ellipse(p.x,p.y,r*(1.4+u*3),r*(.35+u*.7),0,0,Math.PI*2);ctx.strokeStyle=color(mint,alpha*(1-u)*.35);ctx.lineWidth=.8;ctx.stroke();
    }
  }
  ctx.globalCompositeOperation='screen';
  // Hyperlinked pages rise from the pavilions, never enclosing their neighbors.
  const web=at('packets',1.2);
  if(web>0){for(let i=0;i<9;i++){
    const p=points[i*3],r=13*scale,y=p.y-48*scale;
    ctx.save();ctx.translate(p.x,y);ctx.transform(1,-.15,.12,1,0,0);
    ctx.fillStyle=color(mint,.045*web);ctx.strokeStyle=color(mint,.7*web);ctx.lineWidth=.9;
    ctx.beginPath();ctx.roundRect(-r,-r*1.35,r*2,r*2.5,2);ctx.fill();ctx.stroke();
    for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-r*.6,-r*.65+j*r*.5);ctx.lineTo(r*(j===2?.12:.65),-r*.65+j*r*.5);ctx.strokeStyle=color(j===2?gold:mint,web*.6);ctx.stroke();}ctx.restore();
    stroke({x:p.x,y},points[(i*3+6)%27],mint,web*.28,25);
  }}
  // Walled platforms grow around relationships that still use open roads.
  const walls=smooth(.8,1.4,state.t)*(1-smooth(1.7,2.1,state.t));
  if(walls>0){ts.forEach((tower,j)=>{
    const rx=(isMobile()?width*.15:width*.095),ry=rx*.28;
    for(let layer=0;layer<3;layer++){
      const y=tower.y-8-layer*13*walls;
      ctx.beginPath();ctx.ellipse(tower.x,y,rx,ry,0,0,Math.PI*2);ctx.strokeStyle=color(gold,walls*(.45-layer*.09));ctx.lineWidth=1;ctx.stroke();
    }
    for(let k=0;k<18;k++){const a=k/18*Math.PI*2;const x=tower.x+Math.cos(a)*rx,y=tower.y+Math.sin(a)*ry-8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-26*walls);ctx.strokeStyle=color(gold,walls*.3);ctx.stroke();}
  });}
  // The rooms and vehicles belong to participants; the gateway encloses access.
  const sharing=at('sharing',1.1);
  if(sharing>0){for(let i=0;i<9;i++){
    const p=points[i*3],r=(isMobile()?10:17);ctx.save();ctx.translate(p.x,p.y-r);
    ctx.strokeStyle=color(mint,sharing*.85);ctx.lineWidth=1.1;
    if(i%2===0){ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(r,r);ctx.lineTo(-r,r);ctx.closePath();ctx.stroke();ctx.strokeRect(-r*.2,r*.3,r*.4,r*.7);}
    else {ctx.beginPath();ctx.roundRect(-r,-r*.2,r*2,r*.8,3);ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.65,-r*.2);ctx.lineTo(-r*.3,-r*.75);ctx.lineTo(r*.4,-r*.75);ctx.lineTo(r*.75,-r*.2);ctx.stroke();for(const x of [-r*.6,r*.6]){ctx.beginPath();ctx.arc(x,r*.65,r*.18,0,Math.PI*2);ctx.stroke();}}
    ctx.restore();const gate=ts[i%3];stroke(p,{x:gate.x,y:gate.y},gold,sharing*.42,30);
    const u=quiet?.5:(phase*.16+i*.19)%1;glow(mix(p.x,gate.x,u),mix(p.y,gate.y,u),6,gold,sharing*.65);
  }}
  const capital=at('growth',1.1);
  if(capital>0){ts.forEach((tower,j)=>{for(let k=0;k<7;k++){
    const a=points[(j*7+k)%27],b={x:tower.x,y:tower.y-tower.h*.7};const u=quiet?.5:(phase*.2+k*.12)%1;
    stroke(a,b,gold,capital*.27,35);const q={x:mix(a.x,b.x,u),y:mix(a.y,b.y,u)-Math.sin(u*Math.PI)*35};glow(q.x,q.y,7,gold,capital*.7);
  }});}
  // The person's own rhythm and the repeated call to return are distinct.
  const attention=Math.max(at('extraction'),at('psyche'));
  if(attention>0){
    const p=points[12],r=(isMobile()?39:68);
    for(let k=0;k<12;k++){
      const a=k/12*Math.PI*2+(quiet?0:phase*.10),rx=r*(1+Math.sin(k*2)*.18),x=p.x+Math.cos(a)*rx,y=p.y-r+Math.sin(a)*rx*.65;
      ctx.save();ctx.translate(x,y);ctx.rotate(a*.3);ctx.strokeStyle=color(gold,attention*.65);ctx.fillStyle=color(gold,attention*.09);ctx.lineWidth=.8;ctx.beginPath();ctx.roundRect(-6,-4,12,8,2);ctx.fill();ctx.stroke();ctx.restore();
      stroke({x,y},p,gold,attention*.12,12);
    }
    const pulse=quiet?.5:(Math.sin(phase*1.6)+1)/2;glow(p.x,p.y,r*.45,mint,attention*.5);ctx.beginPath();ctx.ellipse(p.x,p.y,r*(.4+pulse*.3),r*(.15+pulse*.12),0,0,Math.PI*2);ctx.strokeStyle=color(mint,attention*.6);ctx.stroke();
  }
  const toll=at('livelihoods');
  if(toll>0){for(let i=0;i<12;i++){
    const a=points[i*2],tower=ts[i%3],gate={x:tower.x,y:tower.y-12};stroke(a,gate,gold,toll*.4,25);
    const u=quiet?.6:(phase*.18+i*.17)%1;const p={x:mix(a.x,gate.x,u),y:mix(a.y,gate.y,u)-Math.sin(u*Math.PI)*25};glow(p.x,p.y,7,gold,toll*.6);
    ctx.beginPath();ctx.arc(a.x,a.y,6,0,Math.PI*2);ctx.strokeStyle=color(mint,toll*.5);ctx.stroke();
  }}
  const publicSquare=at('democracy',1.05);
  if(publicSquare>0){for(let i=0;i<3;i++){
    const cx=width*(isMobile()?.2+i*.3:.58+i*.15),cy=height*(isMobile()?.27:.38),rx=width*(isMobile()?.14:.065),c=i===1?gold:mint;
    ctx.beginPath();ctx.ellipse(cx,cy,rx,rx*.63,0,0,Math.PI*2);ctx.fillStyle=color(c,publicSquare*.025);ctx.fill();ctx.strokeStyle=color(c,publicSquare*.5);ctx.stroke();
    for(let j=0;j<9;j++){const a=j/9*Math.PI*2;glow(cx+Math.cos(a)*rx*.72,cy+Math.sin(a)*rx*.43,3,c,publicSquare*.8);}
    stroke({x:cx,y:cy+rx*.6},{x:ts[i].x,y:ts[i].y},c,publicSquare*.25,0);
  }}
  // AI multiplies reaching paths and draws small satellites into the center.
  const reach=smooth(2.5,3.2,state.t)*(1-smooth(3.7,4.5,state.t));
  if(reach>0){
    const crown={x:ts[2].x,y:ts[2].y-ts[2].h*.82};
    for(let i=0;i<points.length;i++){
      const a=points[i],bend=height*(.08+(i%4)*.035),u=quiet?.5:(phase*(.22+(i%3)*.03)+i*.173)%1;
      stroke(a,crown,gold,reach*(i%3===0?.4:.14),bend);
      const q={x:mix(a.x,crown.x,u),y:mix(a.y,crown.y,u)-Math.sin(u*Math.PI)*bend};glow(q.x,q.y,isMobile()?3:5,gold,reach*.7);
      if(i%3===0){ctx.beginPath();ctx.ellipse(a.x,a.y,18*reach,5*reach,0,0,Math.PI*2);ctx.strokeStyle=color(gold,reach*.65);ctx.stroke();}
    }
  }
  ctx.restore();
}

function drawFederation(n:number,now:number) {
  const start=chapterIndex('sdk')-.9,strength=smooth(start-.4,start+1.1,n);
  if(strength<=0)return;
  const mature=smooth(chapterIndex('sdk'),chapterIndex('federation')+.5,n);
  const map=(p:Point):Point=>isMobile()?camera.point(.50+p.x*.19,.25+p.y*.30):camera.point(.40+p.x*.58,.48+p.y*.45);
  const hubs=HUBS.map(map),r=(isMobile()?19:34),demoId=demo?BEATS[demo.chapter].id:'';
  const demoProgress=demo&&(demoId==='remix'||demoId==='federation')?(quiet?1:clamp((now-demo.start)/3400)):0;
  const line=(a:Point,b:Point,alpha:number,weight=1)=>{
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(mix(a.x,b.x,.38),a.y-Math.abs(a.x-b.x)*.13,mix(a.x,b.x,.7),b.y-Math.abs(a.x-b.x)*.1,b.x,b.y);ctx.strokeStyle=color(mint,alpha*strength);ctx.lineWidth=weight;ctx.stroke();
  };
  ctx.save();ctx.globalCompositeOperation='screen';
  // Every hub connects to several peers; no central distribution tower.
  FEDERATION_LINKS.forEach(([a,b],i)=>{
    const alpha=(.20+mature*.28);line(hubs[a],hubs[b],alpha,isMobile()?.85:1.3);
    if(!quiet||demoProgress){for(let side=0;side<2;side++){
      let u=quiet?demoProgress:(phase*.075+i*.137+side*.48)%1;if(side)u=1-u;
      const p={x:mix(hubs[a].x,hubs[b].x,u),y:mix(hubs[a].y,hubs[b].y,u)-Math.sin(u*Math.PI)*Math.abs(hubs[a].x-hubs[b].x)*.10};
      glow(p.x,p.y,isMobile()?5:8,side?gold:mint,strength*.65);
    }}
  });
  // Branches divide by the golden ratio. They grow into local exchange loops.
  BRANCHES.forEach(({hub,branch,leaves},i)=>{
    const emergence=smooth(start+.1+(i%3)*.18,chapterIndex('federation')+(i%3)*.12,n);
    const b=map(branch),a=hubs[hub];line(a,{x:mix(a.x,b.x,emergence),y:mix(a.y,b.y,emergence)},.42,1.1);
    if(emergence>.05){
      leaves.forEach((leaf,j)=>{
        const e=map(leaf),u=clamp(emergence*1.6-j*.12);const end={x:mix(b.x,e.x,u),y:mix(b.y,e.y,u)};
        line(b,end,.31*u,.65);glow(end.x,end.y,(isMobile()?3:5),mint,u*strength*.48);
        ctx.beginPath();ctx.ellipse(end.x,end.y,2.7*u,1.6*u,-.45,0,Math.PI*2);ctx.fillStyle=color(mint,strength*u*.65);ctx.fill();
        if(j>0)line(map(leaves[j-1]),end,.1*u,.55);
      });
      glow(b.x,b.y,r*.32,mint,.45*strength*emergence);
    }
  });
  hubs.forEach((p,i)=>{
    const size=r*(.83+(i%3)*.10),bloom=smooth(start-.3+i*.12,start+1.3+i*.1,n);
    // Translucent nested petals echo greenhouses and living seed heads.
    for(let j=0;j<5;j++){
      const angle=j*2.3999632297+i*.4,rr=size/PHI**(j*.38)*(quiet?1:1+Math.sin(phase*.5+i+j*.8)*.015);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.scale(1,.55);
      ctx.beginPath();ctx.ellipse(rr*.26,0,rr,rr/PHI,0,0,Math.PI*2);
      ctx.fillStyle=color(mint,.028*bloom*strength);ctx.fill();ctx.strokeStyle=color(j%2?gold:mint,(.37-j*.035)*bloom*strength);ctx.lineWidth=.85;ctx.stroke();ctx.restore();
    }
    glow(p.x,p.y,size*.8,mint,.30*strength);ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=color([244,240,223],strength);ctx.fill();
    // App leaves retain a shared base but acquire distinct local forms.
    const apps=smooth(chapterIndex('sdk')-.5,chapterIndex('remix'),n);
    if(apps>0){for(let k=0;k<3;k++){
      const angle=k*2*Math.PI/3+i*.3,x=p.x+Math.cos(angle)*size*1.4,y=p.y+Math.sin(angle)*size*.7;
      const adapt=demoId==='remix'?demoProgress:smooth(chapterIndex('remix')-.3,chapterIndex('remix')+.5,n);
      const radius=4+(k+i)%3*adapt*2;ctx.beginPath();ctx.ellipse(x,y,radius,radius/PHI,angle+adapt*i*.5,0,Math.PI*2);ctx.strokeStyle=color(k===1?gold:mint,apps*strength*.8);ctx.lineWidth=1;ctx.stroke();line(p,{x,y},apps*.3,.65);
    }}
    if(demoProgress){const u=clamp(demoProgress*1.8-i*.14);ctx.beginPath();ctx.ellipse(p.x,p.y,size*(1+u*2),size*(.5+u),0,0,Math.PI*2);ctx.strokeStyle=color(mint,(1-u*.65)*strength*.75);ctx.lineWidth=1.3;ctx.stroke();}
  });
  // Communities nest into regional collaboration, still with open boundaries.
  if(mature>0){for(let k=0;k<2;k++){
    const a=hubs[k?2:0],b=hubs[k?3:1],cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,rx=Math.abs(a.x-b.x)*.7+r*1.7;
    ctx.beginPath();ctx.ellipse(cx,cy,rx,rx/PHI*.54,-.12,0.12,Math.PI*1.86);ctx.strokeStyle=color(mint,mature*.22*strength);ctx.lineWidth=.8;ctx.stroke();
  }}
  ctx.restore();
}

// A reusable soft texture keeps drifting mist inexpensive, even on wide screens.
const mistTexture=document.createElement('canvas');mistTexture.width=512;mistTexture.height=128;
const mistContext=mistTexture.getContext('2d')!;
for(let i=0;i<22;i++){
  const x=30+i*21,y=64+Math.sin(i*1.8)*17,r=25+Math.sin(i*.7)*9;
  const g=mistContext.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(201,225,215,.22)');g.addColorStop(1,'rgba(201,225,215,0)');mistContext.fillStyle=g;mistContext.fillRect(x-r,y-r,r*2,r*2);
}
function drawMist(t:number,foreground=false){
  const layer=foreground?1:0;
  ctx.save();
  for(let i=0;i<5;i++){
    const drift=quiet?0:Math.sin(phase*.022+i*1.7)*.045;
    const p=camera.point(.12+i*.20+drift,.30+layer*.35+(i%3)*.075);
    const w=camera.w*(.25+i*.025),h=w*(foreground?.09:.13);
    ctx.globalAlpha=(foreground?.11:.20)*(1-filmState(t).darkness*.35);
    ctx.drawImage(mistTexture,p.x-w/2,p.y-h/2,w,h);
  }
  ctx.restore();
}
function drawRiverLight(t:number){
  const calm=1-filmState(t).darkness*.75;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<16;i++){
    const y=.50+i*.014,x=.68-Math.sin(i*.25)*.035;
    const p=camera.point(x,y),wave=quiet?.5:(Math.sin(phase*.55+i*1.7)+1)/2;
    ctx.strokeStyle=color(gold,calm*(.035+wave*.055));ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(p.x-camera.w*.006*(1+wave),p.y);ctx.lineTo(p.x+camera.w*.006*(1+wave),p.y);ctx.stroke();
  }ctx.restore();
}

function draw(narrative:number,now:number) {
  const t=sceneAt(narrative);
  camera=landscapeCamera(width,height,t);
  if(!ready)return;
  const state=filmState(t), mobile=isMobile(), points=PEOPLE.map(project), ts=towers(state);
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#061e24';ctx.fillRect(0,0,width,height);
  ctx.save();
  backdrop(assets.valley);
  if(state.life>0){ctx.globalAlpha=state.life;backdrop(assets.commons);ctx.globalAlpha=1;}
  // Continuous color-grade, shared by the scenery and composite architecture.
  ctx.fillStyle='rgba(2,20,28,'+( .26 + state.darkness*.46 - state.life*.12)+')';ctx.fillRect(0,0,width,height);
  const atmosphere=ctx.createLinearGradient(0,0,0,height);atmosphere.addColorStop(0,'rgba(2,21,29,'+(.22+state.darkness*.3)+')');atmosphere.addColorStop(.6,'rgba(3,36,37,0)');atmosphere.addColorStop(1,'rgba(1,20,22,.12)');ctx.fillStyle=atmosphere;ctx.fillRect(0,0,width,height);
  drawMist(t);drawRiverLight(t);
  const netOpacity=state.network*(1-state.life*.9);
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

  drawMechanisms(narrative, points, ts, state);

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
  drawMist(t,true);
  drawFederation(narrative,now);
  if(demo)drawExchange(points,ts,state,now);
  ctx.restore();
}
function drawExchange(points:Point[],ts:ReturnType<typeof towers>,state:ReturnType<typeof filmState>,now:number) {
  if(!demo)return;
  const p=quiet?1:clamp((now-demo.start)/3400);
  const captured=BEATS[demo.chapter].id==='extraction';
  const packet=BEATS[demo.chapter].id==='packets';
  const c=captured?gold:mint;
  ctx.save();ctx.globalCompositeOperation='screen';
  if(['remix','federation'].includes(BEATS[demo.chapter].id)){
    // The shared federation layer animates these demonstrations.
  } else if(packet){
    const sequence=[0,4,8,12];const leg=Math.min(2,Math.floor(p*3)),u=Math.min(1,p*3-leg);
    for(let j=0;j<=leg;j++){const a=points[sequence[j]],b=points[sequence[j+1]];const q=route(a,b,a,0,j===leg?u:1);ctx.strokeStyle=color(mint,.9);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(q.x,q.y);ctx.stroke();glow(q.x,q.y,17,mint,.8);}
  } else if(captured){
    const end={x:ts[0].x,y:ts[0].y-ts[0].h*.38};const a=points[0];
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mix(a.x,end.x,.5),a.y-height*.08,mix(a.x,end.x,Math.min(1,p*1.5)),mix(a.y,end.y,Math.min(1,p*1.5)));ctx.strokeStyle=color(gold,.9*(1-p*.4));ctx.lineWidth=1.8;ctx.stroke();
    glow(mix(a.x,end.x,Math.min(1,p*1.5)),mix(a.y,end.y,Math.min(1,p*1.5)),18,gold,1-p*.35);
  } else {
    const indices=BEATS[demo.chapter].id==='living'?[0,4,8,12,16,20]:[0,4,8];
    indices.forEach((edge,j)=>{const local=clamp(p*2.1-j*.18);trace(edge,0,points,ts,local);ctx.strokeStyle=color(c,.85*(1-p*.3));ctx.lineWidth=1.8;ctx.stroke();const point=pointOn(edge,local,0,points,ts);glow(point.x,point.y,13,c,.85);});
    if(p>.65){const a=points[0];glow(a.x,a.y,18+(p-.65)*80,c,(1-p)*2.4);}
  }
  ctx.restore();
  if(p>=1&&!demo.done){demo.done=true;demo.button.disabled=false;const status=demo.button.parentElement!.querySelector<HTMLElement>('.exchange-result')!;status.textContent=exchangeOutcome(BEATS[demo.chapter].id);}
}
function updateCopy(t:number) {
  if(reading)return;
  const nearest=Math.round(t);
  copies.forEach((copy,i)=>{
    const d=t-i;
    const opacity=i===0 ? 1-smooth(.12,.50,t) : i===LAST ? smooth(-.5,-.16,d) : smooth(-.5,-.19,d)*(1-smooth(.19,.50,d));
    copy.style.opacity=String(opacity);
    copy.style.visibility=opacity>.005?'visible':'hidden';
    copy.style.transform=(i===0?'translateX(-50%) ':'')+'translateY('+(-d*(isMobile()?36:65))+'px)';
    sections[i].inert=opacity<.1;
    sections[i].setAttribute('aria-hidden',String(opacity<.1));
  });
  root.style.setProperty('--read-shade',String(mix(.35,.98,smooth(.3,.8,t))));
  root.style.setProperty('--hero-shade',String(1-smooth(.12,.65,t)));
  progressFill.style.transform='scaleX('+clamp(t/LAST)+')';
  if(nearest!==active){
    active=nearest;chapterLabel.textContent=BEATS[active].chapter;
    continueLink.href='#'+BEATS[Math.min(LAST,active+1)].id;
    continueLink.querySelector('span')!.textContent=active===0?'Scroll to discover':active===LAST?'Back to the beginning':'Keep exploring';
    if(active===LAST)continueLink.href='#connection';
    if(demo&&demo.chapter!==active){demo.button.disabled=false;demo.button.parentElement!.querySelector('.exchange-result')!.textContent='';demo=null;}
  }
}
function tick(now:number) {
  raf=0;
  if(document.hidden||reading||guide.open||noteDialog.open){last=0;return;}
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
  // Bound the painted world on ultrawide displays; HTML type stays full resolution.
  width=innerWidth;height=innerHeight;ratio=Math.min(devicePixelRatio||1,1.7,Math.sqrt(2_000_000/(width*height)));
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  if(height < 430 && width < 600 && !reading) { autoReading=true; setReading(true); return; }
  if((height >= 430 || width >= 600) && autoReading) { autoReading=false; setReading(false); return; }
  span=sections[1].getBoundingClientRect().top-sections[0].getBoundingClientRect().top;
  target=clamp(scrollY/Math.max(1,span),0,LAST);
  if(quiet)progress=target;
  request();
}
function go(index:number) {
  guide.close();
  const top=sections[index].getBoundingClientRect().top+scrollY;
  scrollTo({top,behavior:'auto'});
  target=index;progress=index;updateCopy(index);draw(index,performance.now());request();
}
function openGuide(source:HTMLElement) {opener=source;guide.showModal();document.querySelector<HTMLElement>('#chapters-close')!.focus();}
document.querySelector<HTMLElement>('#chapters-open')!.addEventListener('click',e=>openGuide(e.currentTarget as HTMLElement));
chapterLabel.addEventListener('click',()=>openGuide(chapterLabel));
document.querySelector('#chapters-close')!.addEventListener('click',()=>guide.close());
guide.addEventListener('close',()=>{opener?.focus({preventScroll:true});request();});
noteDialog.addEventListener('close',()=>{opener?.focus({preventScroll:true});request();});
document.querySelector('#note-close')!.addEventListener('click',()=>noteDialog.close());
document.querySelectorAll<HTMLButtonElement>('[data-note]').forEach(button=>button.addEventListener('click',()=>{
  const beat=BEATS[Number(button.dataset.note)];opener=button;
  document.querySelector('#note-act')!.textContent=beat.act;
  document.querySelector('#note-title')!.textContent=beat.chapter;
  document.querySelector('#note-mechanism')!.textContent=beat.mechanism;
  document.querySelector('#note-body')!.textContent=beat.note;
  const list=document.querySelector('#note-sources')!;list.replaceChildren();
  beat.sources.forEach(key=>{const li=document.createElement('li'),a=document.createElement('a');a.href=SOURCES[key].url;a.textContent=SOURCES[key].title;li.append(a);list.append(li);});
  noteDialog.showModal();document.querySelector<HTMLElement>('#note-close')!.focus();
}));
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
  button.parentElement!.querySelector('.exchange-result')!.textContent=BEATS[chapter].id==='extraction'?'Follow the light into the middle…':'Watch the connection travel…';
  if(reading||quiet){button.parentElement!.querySelector('.exchange-result')!.textContent=exchangeOutcome(BEATS[chapter].id);demo.done=true;button.disabled=false;}
  request();
}));
addEventListener('scroll',()=>{if(!reading)target=clamp(scrollY/Math.max(1,span),0,LAST);request();},{passive:true});
addEventListener('resize',measure);document.addEventListener('visibilitychange',request);
addEventListener('hashchange',()=>{const i=BEATS.findIndex(b=>'#'+b.id===location.hash);if(i>=0)go(i);});
setQuiet(quiet);measure();
Promise.all(['valley','commons','citadel'].map(load)).then(()=>{ready=true;canvas.parentElement!.classList.add('ready');const legacy: Record<string,string>={'open-web':'packets',capture:'sharing',enclosure:'sharing',psyche:'extraction',livelihoods:'extraction',democracy:'extraction',moloch:'acceleration',choice:'reconnect',belong:'sdk',stewardship:'federation',fund:'future',credit:'sharing',open:'connection',peers:'connection',captured:'sharing',flow:'extraction',freed:'reconnect',homes:'sdk',groups:'sdk',alive:'living',place:'living',unfinished:'future',techne:'future'};const hash=location.hash.slice(1);const index=BEATS.findIndex(b=>b.id===(legacy[hash]||hash));if(index>=0&&!reading)go(index);request();}).catch(()=>{setReading(true);});
document.fonts.ready.then(measure);
(window as any).__film={state:()=>({progress,target,active,quiet,reading,ready,camera:{x:camera.x,y:camera.y,w:camera.w,h:camera.h},scene:sceneAt(progress),chapters:BEATS.length,people:PEOPLE.length,edges:RELATIONS.length,width,height}),go,freeze:()=>setQuiet(true)};
