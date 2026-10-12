import Link from 'next/link';
import { listRecords } from '@greenwood/core';
import { GameLogo } from '@/components/GameLogo';
import { GameLinks } from '@/components/GameLinks';
import { TokenContract } from '@/components/TokenContract';
export const metadata={title:'Token contracts',description:'Source-checked game token addresses on Robinhood Chain, with explorer and DexScreener links.'};
export default function ContractsPage(){
 const records=listRecords(), confirmed=records.filter(r=>r.tokenAddress), pending=records.filter(r=>!r.tokenAddress);
 return <section className="page-wrap catalogue-section"><p className="eyebrow">THE CONTRACT REGISTER</p><h1>Right game. Right address.</h1><p className="watchlist-intro">{confirmed.length} confirmed token addresses on Robinhood Chain (4663). Each has project-published evidence and an independent source. Identity checks do not establish contract safety. DexScreener links may show no indexed pool.</p><div className="contract-grid">{confirmed.map(r=><article className="game-card" key={r.id}><div className="game-card-title"><GameLogo record={r}/><h2><Link href={`/games/${r.id}`}>{r.name}</Link></h2></div><TokenContract record={r}/><GameLinks record={r}/><Link className="text-button" href={`/games/${r.id}#evidence`}>Read dated evidence ↗</Link></article>)}</div><h2 className="pending-title">Still unconfirmed</h2><p>Candidate addresses stay out of the confirmed register and market links until their identity is established.</p><ul className="pending-contracts">{pending.map(r=><li key={r.id}><Link href={`/games/${r.id}`}>{r.name}</Link><span>{r.unattestedContracts.length ? `${r.unattestedContracts.length} candidate address(es) recorded` : 'No address recorded'}</span></li>)}</ul></section>;
}
