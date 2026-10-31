const [,,port,expr]=process.argv; const L=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const t=L.find(x=>x.type==='page'&&x.url.includes('10.0.2.2'))||L[0];
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
ws.onmessage=m=>{const d=JSON.parse(m.data); if(d.id===1){console.log(JSON.stringify(d.result.result.value??d.result));process.exit(0)}};
ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:expr,returnByValue:true,awaitPromise:true}}));
