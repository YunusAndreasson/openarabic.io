// usage: node cdp.mjs PORT 'expr'  evaluates in first page target
const [,,port,expr]=process.argv; const t=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
ws.onmessage=m=>{const d=JSON.parse(m.data); if(d.id===1){console.log(JSON.stringify(d.result.result.value??d.result));ws.close();process.exit(0)}};
ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:expr,returnByValue:true,awaitPromise:true}}));
