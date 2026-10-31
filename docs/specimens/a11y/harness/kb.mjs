// Keyboard alone, real X key events by xdotool, focus read from the page. usage: node kb.mjs chromium|zen
import {execSync as x} from 'node:child_process'; import {fileURLToPath} from 'node:url';
const B=process.argv[2]; const S=process.env.S; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const key=k=>x(`DISPLAY=:88 xdotool key ${k}`);
async function ev(e){ if(B==='zen'){return (await (await fetch('http://127.0.0.1:9445/eval?e='+encodeURIComponent(e))).text()).replace(/^"|"$/g,'')} return JSON.parse(x(`node ${S}/cdp.mjs 9355 ${JSON.stringify(e).replace(/\$/g,'\\$')}`).toString())}
const goto=async(p)=>{const u=`http://127.0.0.1:4390/a11y/${p}?${Date.now()}`; if(B==='zen'){await fetch('http://127.0.0.1:9445/goto?u='+encodeURIComponent(u))}else{await ev(`location.href=${JSON.stringify(u)};1`)} await sleep(2500); const W=x(`DISPLAY=:88 xdotool search --onlyvisible --name '${B==='zen'?'Zen':'Chromium'}' | tail -1`).toString().trim(); x(`DISPLAY=:88 xdotool windowactivate --sync ${W}`); await sleep(300); if(B==='zen'){x(`DISPLAY=:88 xdotool mousemove --window ${W} 900 60 click 1`); await sleep(300)} };
const A=`(function(){var e=document.activeElement;return (e.tagName+(e.id?'#'+e.id:''))+'|'+(e.getAttribute('role')||'')+'|'+(e.textContent||'').trim().slice(0,20)})()`;
const st=()=>ev(A); const open=()=>ev(`!!document.querySelector('#sheet:popover-open')`);
const press=async(k,w=180)=>{key(k);await sleep(w)};
const log=(...a)=>console.log(...a);
// tab stops from top of page to the section after the text
for(const v of (process.env.V||'nojs,a,b,c').split(',')){ await goto(`reader-${v}.html`); let n=0,seen=[];
  for(;n<420;){ await press('Tab',60); n++; const s=await st(); if(/App Store/.test(s)) break; }
  log(`stops ${v}: Tabs from page top to the store link after the text = ${n}`); }
// skip link
await goto('reader-c.html'); await press('Tab'); log('skip:',await st()); await press('Return',500); log(' after Enter:',await st(),'y',await ev('Math.round(scrollY)')); await press('Tab'); log(' next Tab:',await st());
// C full
await goto('reader-c.html'); await press('Tab'); await press('Tab'); log('C sentence:',await st());
await press('Return'); log(' Enter ->',await st()); await press('Tab'); const w=await st(); log(' Tab ->',w);
await press('space',700); log(' Space opens:',await open(),await st(),'|',await ev(`document.getElementById('se').textContent`));
await press('Escape',300); log(' Esc ->',await st(),'open',await open(),'same word',(await st())===w);
await press('Return',700); log(' Enter opens:',await open()); await press('Tab');await press('Tab');await press('Tab'); log(' Tabs ->',await st()); await press('Return',300); log(' Close ->',await st(),'same',(await st())===w,'open',await open());
await press('Return',700); await press('Tab');await press('Tab');await press('Tab');await press('Tab',300); log(' Tab off Close ->',await st(),'same',(await st())===w,'open',await open(),'y',await ev('Math.round(scrollY)'));
await press('Return',700); await press('shift+Tab',300); log(' Shift+Tab off card ->',await st(),'open',await open());
await press('Escape',300); log(' Esc ->',await st()); await press('Tab'); log(' Tab ->',await st());await press('shift+Tab'); log(' Shift+Tab ->',await st());
// B
await goto('reader-b.html'); await press('Tab'); await press('Tab'); log('B first:',await st()); await press('Left'); log(' Left ->',await st()); await press('Down'); log(' Down ->',await st()); await press('Return',700); log(' Enter open',await open()); await press('Escape',300); log(' Esc ->',await st());
// no JS page
await goto('reader-nojs.html'); await press('Tab');await press('Tab');log('nojs word:',await st()); await press('Return',800); log(' Enter ->',await ev('location.pathname'));
// Story
await goto('story-fix.html'); await press('Tab'); log('story word:',await st()); await press('Return',300); log(' Enter ->',await st()); await press('Escape',200); log(' Esc ->',await st()); await press('Return',200); await press('Tab'); log(' Tab ->',await st()); await press('Return',200); log(' Close ->',await st());
await ev(`document.querySelector('#screen-8 h2').setAttribute('tabindex','-1');document.querySelector('#screen-8 h2').focus();1`); await press('Tab'); log('reveal:',await st(), await ev(`getComputedStyle(document.querySelector('.lift-control')).outlineStyle+' '+getComputedStyle(document.querySelector('.lift-control')).outlineWidth`));
await press('space',800); log(' Space checked',await ev(`document.getElementById('lift').checked`),'English',await ev(`getComputedStyle(document.querySelector('.sentence')).visibility`),'label bring',await ev(`getComputedStyle(document.querySelector('.bring')).visibility`));
await press('space',800); log(' Space checked',await ev(`document.getElementById('lift').checked`),'English',await ev(`getComputedStyle(document.querySelector('.sentence')).visibility`));

// Mouse: a click opens, a drag selects, on variant C with href removed at load
await goto('reader-c.html');
const R=async(q)=>JSON.parse(await ev(`(function(){var r=document.querySelectorAll('.w')[${q}].getBoundingClientRect();var X=(window.mozInnerScreenX!==undefined?mozInnerScreenX:screenX+(outerWidth-innerWidth)/2),Y=(window.mozInnerScreenY!==undefined?mozInnerScreenY:screenY+outerHeight-innerHeight);return JSON.stringify([Math.round(X+r.x+r.width/2),Math.round(Y+r.y+r.height/2)])})()`));
const [cx,cy]=await R(2); x(`DISPLAY=:88 xdotool mousemove ${cx} ${cy} click 1`); await sleep(800); log('mouse click word: open',await open(),'gloss',await ev(`document.getElementById('se').textContent`)); await press('Escape',300); log(' Esc ->',await st());
const [ax,ay]=await R(0), [bx,by]=await R(4); x(`DISPLAY=:88 xdotool mousemove ${ax} ${ay} mousedown 1`); await sleep(100); x(`DISPLAY=:88 xdotool mousemove ${Math.round((ax+bx)/2)} ${ay}`); await sleep(100); x(`DISPLAY=:88 xdotool mousemove ${bx} ${by}`); await sleep(100); x(`DISPLAY=:88 xdotool mouseup 1`); await sleep(400); log('mouse drag: selected chars',await ev('String(getSelection()).length'),'open',await open());
process.exit(0);
