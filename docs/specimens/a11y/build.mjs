// Throwaway generator for the accessibility spike (plan task 2.0). Reads the existing snapshot only: no network.
// node docs/specimens/a11y/build.mjs
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import { createRequire } from 'node:module';
const SP='/home/yunus/Work/openarabic-spikes'; const here=path.dirname(new URL(import.meta.url).pathname);
const J=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const snap=J(SP+'/data/snapshot.json'), segments=J(SP+'/data/segments.json'), classes=J(SP+'/src/lib/classes.json');
const A=377, art=snap.articles.find(a=>a.id===A), author=snap.authors.find(a=>a.id===art.author_id);
const roots=new Map(snap.roots.map(r=>[r.id,r]));
const slugT=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const slug=r=>r?`${slugT(r.meaning)||'word'}-${r.id}`:'word';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MARK=/^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/u;
// Same two shaping rules as the word-tap spike's Reader.astro. They only move marks between colour spans; text order and code points are unchanged.
function segs(w){ const raw=segments[w.id]; if(!raw) return [{t:w.word_form,c:'arabicText'}]; const out=[];
  for(const s of raw){ if(MARK.test(s.t)&&out.length){ const prev=out[out.length-1], ch=[...prev.t]; let i=ch.length-1; while(i>0&&MARK.test(ch[i])) i--; const moved=ch.splice(i).join(''); prev.t=ch.join(''); if(!prev.t) out.pop(); out.push({t:moved+s.t,c:s.c}); } else out.push({...s}); }
  for(let i=0;i<out.length-1;i++) if(/^[يى]/u.test(out[i+1].t)){ const m=out[i].t.match(/[ِّ]+$/u); if(m&&m[0].length<out[i].t.length){ out[i].t=out[i].t.slice(0,-m[0].length); out[i+1].t=m[0]+out[i+1].t; } }
  return out; }
const inner=w=>segs(w).map(s=>{const k=classes[s.c];return k?`<span class=${k}>${esc(s.t)}</span>`:esc(s.t)}).join('');
const L=t=>[...t].filter(c=>/\p{L}/u.test(c)).join(''); // throwaway copy, letter comparison only (D6)
let idx=0; const gl=[]; let tappable=0, plain=0, words=0;
const sentences=snap.sentences.filter(s=>s.article_id===A).sort((a,b)=>a.position-b.position);
const body=sentences.map(s=>{ const ws=snap.words.filter(w=>w.sentence_id===s.id).sort((a,b)=>a.position-b.position); words+=ws.length;
  const match=ws.length&&L(s.arabic)===L(ws.map(w=>w.word_form).join(''));
  if(!match){ plain++; return `<p class=ar lang=ar dir=rtl>${esc(s.arabic)}</p><p class=en>${esc(s.english)}</p>`; }
  const html=ws.map(w=>{ const i=idx++; tappable++; gl.push([w.english,w.grammar_note,w.audio_url]); return `<a class=w href=/word/${slug(roots.get(w.root_id))} data-i=${i}>${inner(w)}</a>`; }).join(' ');
  return `<p class="ar t" lang=ar dir=rtl>${html}</p><p class=en>${esc(s.english)}</p>`; }).join('\n');
console.log({sentences:sentences.length,words,tappable,plainSentences:plain,tappableSentences:sentences.length-plain});
fs.mkdirSync(here+'/gl',{recursive:true}); fs.writeFileSync(here+`/gl/${A}.json`,JSON.stringify(gl));
const page=(v,title,script)=>`<!doctype html>
<html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name=robots content="noindex, nofollow"><link rel=stylesheet href=style.css></head>
<body><main>
<header class=top><h1>${esc(art.title)}</h1><p class=by>${esc(author.name)}</p></header>
<a class=skip href=#after>Skip past the text</a>
<div id=reader data-gl=gl/${A}.json>
<p id=hint class=vh hidden>Each Arabic line is a button. Press it to go through its words, then press a word for its meaning.</p>
${body}
</div>
<div id=sheet popover role=dialog aria-labelledby=se tabindex=-1 lang=en dir=ltr><p id=se tabindex=-1></p><p id=sn></p><button id=sa type=button hidden>Play</button><a id=sl>Full entry</a><button id=sc type=button popovertarget=sheet popovertargetaction=hide>Close</button></div>
<section><h2 id=after tabindex=-1>Get the app</h2><p>If you can sound out Arabic script, you can start reading classical texts.</p><p><a href=https://example.invalid/store>App Store</a></p></section>
</main><footer><a href=/privacy>Privacy</a></footer>
${script?`<script src=${script} defer></script>`:''}</body></html>
`;
const esbuild=createRequire(SP+'/package.json')('esbuild');
const AUDIO='https://kkmnzbeugdoajtzfjkxg.supabase.co/storage/v1/object/public/audio/'; // for the size measure only
const sizes={};
for(const v of ['a','b','c']){ const src=fs.readFileSync(here+`/src/tap-${v}.js`,'utf8');
  const real=esbuild.transformSync(src.replace('__AUDIO__',AUDIO),{minify:true,target:'es2020'}).code;
  sizes[v]={min:real.length,gzip:zlib.gzipSync(real,{level:9}).length,brotli:zlib.brotliCompressSync(real).length};
  // The served copy plays a local file instead: this spike makes no Supabase request.
  fs.writeFileSync(here+`/tap-${v}.js`,src.replace("'__AUDIO__'+a","'../design-test/material/line-7106-ar.mp3'"));
  fs.writeFileSync(here+`/reader-${v}.html`,page(v,`Reader ${v.toUpperCase()}`,`tap-${v}.js`)); }
fs.writeFileSync(here+'/reader-nojs.html',page('nojs','Reader, no script',''));
console.log(sizes); fs.writeFileSync(here+'/sizes.json',JSON.stringify(sizes,null,1));
// Story: screen 1's line and screen 8's reveal, copied as they are from the design test.
const dt=fs.readFileSync(here+'/../design-test/index.html','utf8');
const sec=id=>{const m=dt.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`));return m[0]};
fs.writeFileSync(here+'/story.html',`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Story reveal</title><meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="../design-test/style.css"></head>
<body><main>
${sec('screen-1')}
${sec('screen-8')}
</main></body></html>
`);
// Fix under test: one word, one announcement. The plain copy stays for assistive tech, and the coloured copy is hidden from it. No script.
fs.writeFileSync(here+'/story-fix.html',fs.readFileSync(here+'/story.html','utf8').replaceAll('class="w-seg"','class="w-seg" aria-hidden="true"').replaceAll('<p class="card-gloss">','<p class="card-gloss" tabindex="-1" autofocus>').replace('</head>','<style>@supports (field-sizing: content){.w-plain{display:inline!important;position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}}</style></head>'));
