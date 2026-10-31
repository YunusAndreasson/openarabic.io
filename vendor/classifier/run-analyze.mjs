import esbuild from 'esbuild'; import path from 'node:path'; import fs from 'node:fs';
const A='/home/yunus/Work/open-arabic';
fs.writeFileSync('data/sentry-stub.js','export const addBreadcrumb=()=>{};export const captureException=()=>{};export const captureMessage=()=>{};');
await esbuild.build({entryPoints:[process.argv[2]||'scripts/analyze-entry.ts'],bundle:true,platform:'node',format:'esm',outfile:process.argv[3]||'data/analyze.mjs',logLevel:'error',
  plugins:[{name:'a',setup(b){
    b.onResolve({filter:/^@sentry\/react-native$/},()=>({path:path.resolve('data/sentry-stub.js')}));
    b.onResolve({filter:/^react-native$/},()=>({path:path.resolve('data/sentry-stub.js')}));
    b.onResolve({filter:/^@\//},async a=>{const r=await b.resolve('./'+a.path.slice(2),{resolveDir:A,kind:a.kind});return r;});
  }}]});
