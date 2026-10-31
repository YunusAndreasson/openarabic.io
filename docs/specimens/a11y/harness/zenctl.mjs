// Zen on the private X display with a throwaway profile, driven by WebDriver BiDi. Exposes GET /eval?e=... and /goto?u=... on 9445. Never touches the owner's Zen.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path';
const S=process.env.S, noJs=process.env.NOJS==='1'; const dir=fs.mkdtempSync(path.join(S,'zenp-'));
fs.writeFileSync(path.join(dir,'user.js'),['user_pref("browser.shell.checkDefaultBrowser",false);','user_pref("datareporting.policy.dataSubmissionEnabled",false);','user_pref("browser.aboutwelcome.enabled",false);','user_pref("zen.welcome-screen.seen",true);','user_pref("toolkit.telemetry.enabled",false);','user_pref("remote.prefs.recommended",true);','user_pref("network.proxy.type",0);','user_pref("accessibility.force_disabled",-1);',noJs?'user_pref("javascript.enabled",false);':''].join('\n'));
const proc=spawn('/usr/bin/zen-browser',['--no-remote','--profile',dir,'--remote-debugging-port=9444','--width','1200','--height','860','about:blank'],{stdio:'ignore',env:{...process.env,MOZ_ENABLE_WAYLAND:'0',GDK_BACKEND:'x11',WAYLAND_DISPLAY:'',GNOME_ACCESSIBILITY:'1'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let ws; for(let i=0;i<80;i++){await sleep(500);try{ws=new WebSocket('ws://127.0.0.1:9444/session');await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});break}catch{ws=null}} if(!ws){console.log('no bidi');process.exit(1)}
let id=0;const pend=new Map();ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const p=pend.get(d.id);pend.delete(d.id);d.type==='error'?p.rej(new Error(d.message)):p.res(d.result)}};
const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}))});
const sess=await send('session.new',{capabilities:{alwaysMatch:{}}});console.log(sess.capabilities.browserName,sess.capabilities.browserVersion);
const tree=await send('browsingContext.getTree',{});const ctx=tree.contexts[0].context;
http.createServer(async(q,s)=>{const u=new URL(q.url,'http://x');try{
 if(u.pathname==='/goto'){await send('browsingContext.activate',{context:ctx}).catch(()=>{});await send('browsingContext.navigate',{context:ctx,url:u.searchParams.get('u'),wait:'complete'});s.end('ok')}
 else if(u.pathname==='/eval'){const r=await send('script.evaluate',{expression:u.searchParams.get('e'),target:{context:ctx},awaitPromise:true});s.end(JSON.stringify(r.result?.value??r))}
 else if(u.pathname==='/quit'){s.end('bye');await send('session.end').catch(()=>{});proc.kill('SIGTERM');await sleep(800);fs.rmSync(dir,{recursive:true,force:true});process.exit(0)}
}catch(e){s.end('ERR '+e.message)}}).listen(9445,'127.0.0.1');
