import assert from 'node:assert/strict';
const base=process.env.GREENWOOD_SMOKE_URL ?? 'http://localhost:3210';
let ready=false;
for(let i=0;i<30;i++) {try {const r=await fetch(base,{signal:AbortSignal.timeout(3000)});if(r.ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,1000));}
assert.ok(ready,'Preview did not become ready');
for(const path of ['/', '/watchlist', '/games/kindra', '/method', '/about']) {
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path);
 const html=await r.text();assert.ok(html.includes('Greenwood'),path+' missing app shell');
 if(path==='/games/kindra'){assert.ok(html.includes('Copy contract'));assert.ok(html.includes('What we could check'));}
}
const response=await fetch(base+'/api/v1/games',{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200);
const data=await response.json();assert.equal(data.chainId,4663);assert.ok(data.games.length>0);
for(const game of data.games){assert.ok(game.screen.coverage);if(game.partial || game.screen.criteria.some(c=>c.score===null)) assert.equal(game.screen.total,null);}
const disabled=await fetch(base+'/api/v1/games/kindra/economy',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(disabled.status,503);
console.log('Discovery pages, API coverage and disabled ingestion smoke checks passed.');
