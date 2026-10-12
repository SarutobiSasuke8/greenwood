"use client";
import { useState } from 'react';
export function CopyAction({ value, label }: { value?: string; label: string }) {
 const [status,setStatus]=useState('');
 async function copy() {
  try { await navigator.clipboard.writeText(value ?? location.href); setStatus('Copied'); }
  catch {setStatus('Copy unavailable. Select the address or browser URL.');}
 }
 return <span className="copy-control"><button className="btn btn-secondary" onClick={copy}>{label}</button><span role="status">{status}</span></span>;
}
