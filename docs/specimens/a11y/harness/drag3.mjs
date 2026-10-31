import {execSync as x} from 'node:child_process'; const S=process.env.S; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ev=e=>JSON.parse(x(`node ${S}/cdp.mjs 9355 ${JSON.stringify(e).replace(/\$/g,'\\$')}`).toString());
const R=q=>JSON.parse(ev(`(function(){var r=document.querySelectorAll('.w')[${q}].getBoundingClientRect();return JSON.stringify([Math.round(screenX+(outerWidth-innerWidth)/2+r.x+r.width/2),Math.round(screenY+outerHeight-innerHeight+r.y+r.height/2)])})()`));
const drag=async()=>{const [ax,ay]=R(0),[bx,by]=R(4);x(`DISPLAY=:88 xdotool mousemove ${ax} ${ay}`);await sleep(100);x(`DISPLAY=:88 xdotool mousedown 1`);await sleep(150);for(let i=1;i<=6;i++){x(`DISPLAY=:88 xdotool mousemove ${Math.round(ax+(bx-ax)*i/6)} ${ay}`);await sleep(60)}await sleep(100);x(`DISPLAY=:88 xdotool mouseup 1`);await sleep(500);return ev('String(getSelection()).length')+'/open='+ev(`!!document.querySelector('#sheet:popover-open')`)+'/ae='+ev('document.activeElement.tagName')};
for(const [f,m] of [['reader-c',''],['reader-c',''],['reader-c',''],['reader-c','click'],['reader-c','click'],['reader-c','click'],['reader-a',''],['reader-a','']]){
 ev(`location.href='http://127.0.0.1:4390/a11y/${f}.html?${Date.now()}';1`); await sleep(2500);
 const W=x(`DISPLAY=:88 xdotool search --onlyvisible --name Chromium | tail -1`).toString().trim(); x(`DISPLAY=:88 xdotool windowactivate --sync ${W}`); await sleep(500);
 if(m){const [a,b]=R(2);x(`DISPLAY=:88 xdotool mousemove ${a} ${b} click 1`);await sleep(800);x('DISPLAY=:88 xdotool key Escape');await sleep(500)}
 console.log(f,m||'fresh',await drag());
}
process.exit(0)
