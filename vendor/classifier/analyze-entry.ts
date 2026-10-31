import { analyzeArabicWord, formatWordAnalysis, normalizeArabic, shouldInjectBracket } from '@/utils/arabicWordAnalysis';
import fs from 'node:fs';
const snap = JSON.parse(fs.readFileSync(process.argv[2]||'data/snapshot.json','utf8'));
const seg: Record<string, {t:string,c:string}[]> = {};
const t0=Date.now(); let multi=0, single=0, failed=0, markOnly=0, roundtrip=0;
const MARK=/^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/u;
for(const w of snap.words){
  try{
    const norm=normalizeArabic(w.word_form);
    const en=shouldInjectBracket(norm,w.english,w.word_form)?`[the] ${w.english}`:w.english;
    const a=analyzeArabicWord(w.word_form,en);
    const f:any=a?.hasComponents?formatWordAnalysis(a):null;
    const s=f?.reconstructedArabic?.segments;
    if(s&&s.length>1){ multi++; seg[w.id]=s.map((x:any)=>({t:x.text,c:x.colorName}));
      if(s.map((x:any)=>x.text).join('')!==w.word_form) roundtrip++;
      if(s.some((x:any)=>MARK.test(x.text))) markOnly++;
    } else single++;
  }catch(e){failed++}
}
fs.writeFileSync('data/segments.json',JSON.stringify(seg));
console.log({ms:Date.now()-t0,multi,single,failed,markOnly,roundtripMismatch:roundtrip});
