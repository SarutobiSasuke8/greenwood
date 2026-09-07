import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fetchJson } from './http.js';
import { marketByTokens } from './providers/dexscreener.js';
import { snapshotAll } from './snapshot.js';
import { getRecord } from './registry.js';
import { appendEconomyReport, listEconomyReports } from './economy.js';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('provider deadline includes a stalled JSON body', async()=>{
 const server=createServer((_req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.write('{');});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address(); assert.ok(address && typeof address!=='string');
 const start=Date.now();
 try { await assert.rejects(fetchJson(`http://127.0.0.1:${address.port}`,{timeoutMs:150})); assert.ok(Date.now()-start<2000); }
 finally { server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
});
test('provider body size is bounded',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('0123456789', {headers:{'content-type':'application/json'}});
 try {await assert.rejects(fetchJson('https://fixture.invalid',{maxBytes:5}),/size limit/);}
 finally {globalThis.fetch=original;}
});
test('market identity and malformed numbers cannot leak into quotes',async()=>{
 const original=globalThis.fetch;
 const address=getRecord('kindra')!.tokenAddress!;
 const pair={chainId:'robinhood',pairAddress:'0x'+'1'.repeat(40),baseToken:{address},quoteToken:{symbol:'ETH'},priceUsd:'Infinity',liquidity:{usd:-1},volume:{h24:NaN}};
 try {
  globalThis.fetch=async()=>Response.json([pair]);
  const market=(await marketByTokens([address])).get(address.toLowerCase());
  assert.equal(market?.priceUsd,null);assert.equal(market?.liquidityUsd,null);
  globalThis.fetch=async()=>Response.json([{...pair,chainId:'ethereum'}]);
  await assert.rejects(marketByTokens([address]),/identity mismatch/);
  globalThis.fetch=async()=>Response.json({pairs:[]});
  await assert.rejects(marketByTokens([address]),/Malformed/);
  globalThis.fetch=async()=>Response.json([{...pair,baseToken:{address:'0x'+'2'.repeat(40)}}]);
  assert.equal((await marketByTokens([address])).size,0);
 } finally {globalThis.fetch=original;}
});
test('holder and site failures reach snapshot provenance and coverage',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(input)=>{
  const url=String(input);
  if(url.includes('dexscreener')) return Response.json([]);
  if(url.endsWith('/holders')) return new Response('failure',{status:500});
  if(url.includes('/api/v2/tokens/')) return Response.json({name:'Fixture',symbol:'T',decimals:'18',total_supply:'1000',holders_count:'500'});
  return new Response('blocked',{status:403});
 };
 try {
  const full=(await snapshotAll()).find(s=>s.record.id==='kindra')!;
  assert.equal(full.sources.holders?.state,'error'); assert.equal(full.sources.blockscout.state,'ok');
  assert.equal(full.sources.liveness.state,'error');assert.equal(full.liveness?.ok,null);
  assert.equal(full.partial,true);assert.equal(full.screen.total,null);
  const fast=(await snapshotAll({skipHolders:true,skipLiveness:true})).find(s=>s.record.id==='kindra')!;
  assert.equal(fast.sources.holders?.state,'skipped');assert.equal(fast.sources.liveness.state,'skipped');
  assert.equal(fast.partial,true);assert.equal(fast.screen.total,null);
 } finally {globalThis.fetch=original;}
});
test('corrupt report history is preserved and ingestion cannot overwrite it',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'greenwood-test-'));const previous=process.env.GREENWOOD_DATA_DIR;
 process.env.GREENWOOD_DATA_DIR=dir;
 try {
  assert.deepEqual(await listEconomyReports('kindra'),[]);
  await mkdir(join(dir,'economy'));const path=join(dir,'economy','kindra.json');await writeFile(path,'{broken');
  await assert.rejects(listEconomyReports('kindra'));
  await assert.rejects(appendEconomyReport('kindra',{}),/disabled/);
  assert.equal(await readFile(path,'utf8'),'{broken');
 } finally { if(previous===undefined) delete process.env.GREENWOOD_DATA_DIR; else process.env.GREENWOOD_DATA_DIR=previous; await rm(dir,{recursive:true,force:true}); }
});

 test('v4 pool IDs coexist with address pools without weakening token identity',async()=>{
 const original=globalThis.fetch, address=getRecord('kindra')!.tokenAddress!;
 const pair={chainId:'robinhood',dexId:'uniswap',labels:['v4'],pairAddress:'0x'+'a'.repeat(64),baseToken:{address},quoteToken:{symbol:'ETH'},priceUsd:'0.25',liquidity:{usd:10000}};
 try {
  globalThis.fetch=async()=>Response.json([{...pair,pairAddress:'0x'+'b'.repeat(40),labels:['v2'],liquidity:{usd:100}},pair]);
  assert.equal((await marketByTokens([address])).get(address.toLowerCase())?.pairAddress,pair.pairAddress);
  for(const invalid of [{...pair,labels:['v2']},{...pair,baseToken:{address:pair.pairAddress}},{...pair,chainId:'ethereum'}]){
   globalThis.fetch=async()=>Response.json([invalid]);
   await assert.rejects(marketByTokens([address]),/identity mismatch/);
  }
 } finally {globalThis.fetch=original;}
 });
