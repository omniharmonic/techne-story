import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { BEATS } from '../src/lib/immersive.ts';
const url=process.env.QA_URL||'http://127.0.0.1:4321/techne-story/';
const b=await chromium.launch();const results:{name:string;pass:boolean;detail?:unknown}[]=[];const errors:string[]=[];
const check=(name:string,pass:boolean,detail?:unknown)=>{results.push({name,pass,detail});console.log((pass?'PASS ':'FAIL ')+name+(pass?'':' '+JSON.stringify(detail)));};
mkdirSync('qa/immersive',{recursive:true});
for(const [w,h]of [[1440,900],[820,1180],[390,844],[320,740],[844,390]]){
 const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>Boolean((window as any).__film?.state().ready));await p.evaluate(()=>document.fonts.ready);
 let geometry=true;const details=[];
 for(let i=0;i<BEATS.length;i++){
  await p.evaluate(i=>(window as any).__film.go(i),i);await p.waitForTimeout(150);
  const geo=await p.evaluate(i=>{const c=document.querySelector('#world')!.getBoundingClientRect();const el=document.querySelectorAll('.copy')[i] as HTMLElement;const r=el.getBoundingClientRect();const text=[...el.querySelectorAll('h1,h2,.narration,.end-actions,.exchange,.act-label,.chapter-note-button')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());return {canvas:[c.x,c.y,c.width,c.height],copy:[r.left,r.top,r.right,r.bottom],textInside:text.every(t=>t.left>=0&&t.right<=innerWidth+1&&t.top>=60&&t.bottom<=innerHeight-55),overflow:document.documentElement.scrollWidth-innerWidth,state:(window as any).__film.state(),background:getComputedStyle(el).backgroundColor};},i);
  geometry&&=geo.canvas[0]===0&&geo.canvas[1]===0&&geo.canvas[2]===w&&geo.canvas[3]===h&&geo.textInside&&geo.overflow<=0&&geo.background==='rgba(0, 0, 0, 0)';details.push({i,...geo});
  if([0,11,17].includes(i)&&w!==844)await p.screenshot({path:'qa/immersive/release-'+w+'-'+({0:0,11:3,17:6}[i])+'.png'});
 }
 check(w+'×'+h+': full-bleed world, clear text, no panels or overflow at every beat',geometry,details);
 const a=await p.evaluate(()=>document.querySelectorAll('canvas').length);check(w+'×'+h+': one canvas throughout',a===1);
 await p.close();
}
const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>Boolean((window as any).__film?.state().ready));
check('one h1 and correctly labelled story sections',await p.evaluate(()=>document.querySelectorAll('h1').length===1&&[...document.querySelectorAll('section.beat')].every(s=>Boolean(document.getElementById(s.getAttribute('aria-labelledby')!)))));
for(const [i,outcome]of [[1,'A message crosses independent networks.'],[7,'The platform keeps the value.'],[14,'A direct connection. Something comes back.'],[17,'Shared onward. Returned in another form.']] as const){await p.evaluate(i=>(window as any).__film.go(i),i);await p.locator('[data-exchange="'+i+'"]').click();await p.waitForTimeout(3600);check('exchange outcome in '+BEATS[i].chapter,await p.locator('#'+BEATS[i].id+' .exchange-result').textContent()===outcome);}
await p.evaluate(()=>(window as any).__film.go(7));await p.locator('[data-exchange="7"]').click();await p.evaluate(()=>(window as any).__film.go(15));check('leaving an exchange resets it',await p.locator('[data-exchange="7"]').isEnabled());
await p.locator('#chapters-open').click();check('chapter menu traps keyboard focus in its modal',await p.evaluate(()=>document.activeElement?.id==='chapters-close'&&document.querySelector('dialog')!.open));await p.keyboard.press('Escape');check('Escape closes the menu and returns focus',await p.evaluate(()=>!document.querySelector('dialog')!.open&&document.activeElement?.id==='chapters-open'));
await p.locator('#chapters-open').click();await p.locator('#guide a[href="#living"]').click();check('chapter navigation reaches the selected landscape',await p.evaluate(()=>(window as any).__film.state().active===17));
for(let i=1;i<BEATS.length-1;i++){
 await p.evaluate(i=>(window as any).__film.go(i),i);await p.locator('[data-note="'+i+'"]').click();
 const note=await p.locator('#note-body').textContent();const title=await p.locator('#note-title').textContent();
 check('chapter note and evidence: '+BEATS[i].id,note===BEATS[i].note&&title===BEATS[i].chapter&&(await p.locator('#note-sources a').count())===BEATS[i].sources.length);
 await p.keyboard.press('Escape');
 check('note restores focus: '+BEATS[i].id,await p.locator('[data-note="'+i+'"]').evaluate(e=>e===document.activeElement));
}
await p.evaluate(()=>(window as any).__film.go(17));
await p.locator('#motion').click();check('quiet mode retains the world and settles animation',await p.evaluate(()=>(window as any).__film.state().quiet&&document.querySelector('#motion')!.getAttribute('aria-pressed')==='true'));
await p.locator('[data-exchange="17"]').click();check('quiet mode provides the exchange result immediately',await p.locator('#living .exchange-result').textContent()==='Shared onward. Returned in another form.');
await p.locator('#chapters-open').click();await p.locator('#read-mode').click();check('simple reading exposes all nineteen passages',await p.evaluate(()=>(window as any).__film.state().reading&&[...document.querySelectorAll('.beat')].every(s=>!s.hasAttribute('aria-hidden')&&!(s as HTMLElement).inert)));
await p.locator('#chapters-open').click();await p.locator('#read-mode').click();check('returning from reading restores the current chapter',await p.evaluate(()=>(window as any).__film.state().active===17&&!(window as any).__film.state().reading));
await p.locator('#motion').click();
const timing=await p.evaluate(async()=>{const delta:number[]=[];let prev=performance.now();for(let i=0;i<130;i++){await new Promise(requestAnimationFrame);const now=performance.now();if(i>10)delta.push(now-prev);prev=now;scrollTo(0,(i/130)* (document.documentElement.scrollHeight-innerHeight));}delta.sort((a,b)=>a-b);return {p95:delta[Math.floor(delta.length*.95)],over50:delta.filter(x=>x>50).length};});check('scroll frame timing stays below 34ms p95',timing.p95<34,timing);
await p.evaluate(()=>(window as any).__film.go(11));const prior=await p.evaluate(()=>(window as any).__film.state());await p.evaluate(()=>(window as any).__film.go(17));await p.evaluate(()=>(window as any).__film.go(11));check('reverse navigation restores state without accumulating elements',await p.evaluate(prior=>{const s=(window as any).__film.state();return s.progress===prior.progress&&s.people===prior.people&&s.edges===prior.edges&&document.querySelectorAll('canvas').length===1},prior));
const md=await(await p.request.get(url+'story.md')).text();check('download includes all and only the new nineteen passages',BEATS.every(b=>md.includes(b.body))&&(md.match(/^## /gm)||[]).length===BEATS.length);
await p.close();
for(const [name,options]of [['reduced',{reducedMotion:'reduce'}],['nojs',{javaScriptEnabled:false}],['reflow',{viewport:{width:320,height:256}}]] as const){const p=await b.newPage(options as any);await p.goto(url);if(name==='nojs'){check('without JavaScript all nineteen chapters are readable',await p.evaluate(()=>[...document.querySelectorAll('.copy')].every(e=>getComputedStyle(e).visibility==='visible'&&getComputedStyle(e).position!=='fixed')));}else{await p.waitForFunction(()=>Boolean((window as any).__film?.state().ready));check(name==='reduced'?'system reduced motion is respected on first paint':'400% reflow switches to readable natural flow',await p.evaluate(name=>name==='reduced'?(window as any).__film.state().quiet:(window as any).__film.state().reading&&document.documentElement.scrollWidth<=innerWidth,name));}await p.close();}
const deep=await b.newPage();await deep.goto(url+'#acceleration');await deep.waitForFunction(()=>Boolean((window as any).__film?.state().ready));check('deep links initialize the matching scene',await deep.evaluate(()=>(window as any).__film.state().active===11));await deep.close();
check('no browser exceptions',errors.length===0,errors);await b.close();
writeFileSync('qa/immersive/checks.json',JSON.stringify({date:new Date().toISOString(),url,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results},null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
