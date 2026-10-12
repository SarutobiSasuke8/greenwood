"use client";
import { useEffect,useState } from "react";
import type { ChainStatus } from "@greenwood/core";
export function ChainPulse({initial}:{initial:ChainStatus|null}) {
 const [chain,setChain]=useState(initial); const [ready,setReady]=useState(false); const [now,setNow]=useState(0);
 useEffect(()=>{
  let alive=true; let busy=false; let controller:AbortController|undefined;
  async function tick(){setNow(Date.now());setReady(true);if(busy)return;busy=true;controller=new AbortController();const t=setTimeout(()=>controller?.abort(),10_000);
   try{const res=await fetch('/api/v1/chain',{cache:'no-store',signal:controller.signal});if(!res.ok)throw Error();const data=await res.json();if(data.chainId!==4663)throw Error();if(alive)setChain(data);}
   catch{if(alive)setChain(null);}finally{clearTimeout(t);busy=false;}}
  void tick();const t=setInterval(()=>{if(!document.hidden)void tick();},60_000);const age=setInterval(()=>setNow(Date.now()),15_000);
  return()=>{alive=false;controller?.abort();clearInterval(t);clearInterval(age);};
 },[]);
 const age=chain?now-Date.parse(chain.fetchedAt):Infinity;
 const fresh=ready && age>=-60_000 && age<120_000 && chain?.rpc.state==='ok';
 return <a className="pulse" data-state={fresh?'ok':'skipped'} href="/api/v1/chain" title="Latest RPC observation; does not indicate market-data freshness"><span className="pulse-dot" aria-hidden="true"/><span>4663 · {fresh&&chain?.blockNumber?`#${chain.blockNumber.toLocaleString('en-GB')}`:ready?'check unavailable':'checking'}</span></a>;
}
