import Image from "next/image";
import Link from "next/link";
import { GameIndex } from "@/components/GameIndex";
import { getSnapshots } from "@/lib/data";
export const revalidate = 300;
export default async function IndexPage() {
  const snapshots=await getSnapshots();
  const checked=snapshots.filter(s=>s.record.playable===true).length;
  const linked=snapshots.filter(s=>s.record.tokenAddress).length;
  return <>
    <section className="forest-hero">
      <Image src="/images/greenwood-forest.png" alt="" fill priority sizes="100vw" className="forest-art"/>
      <div className="forest-shade"/>
      <div className="page-wrap forest-content"><p className="hero-kicker"><span/> INDEPENDENT GAME DISCOVERY · ROBINHOOD CHAIN</p><h1>Off the beaten chain.</h1><p className="forest-lead">A field guide to the games, tokens and rabbit holes of Robinhood Chain. Find something worth your time. Check the receipts.</p><div className="hero-actions"><a className="btn btn-primary" href="#catalogue">Explore the games <span aria-hidden="true">↗</span></a><Link className="hero-method" href="/method">How we check things →</Link></div><div className="hero-footnote"><span>4663 / ETHEREUM L2</span><span>DISCOVER HERE. PLAY THERE.</span></div></div>
      <span className="art-credit">GREENWOOD BRAND ART</span>
    </section>
    <div className="directory-stats"><div className="page-wrap"><p><strong>{snapshots.length.toString().padStart(2,'0')}</strong> games in the directory</p><p><strong>{checked.toString().padStart(2,'0')}</strong> manually checked builds</p><p><strong>{linked.toString().padStart(2,'0')}</strong> token-linked records</p><Link href="/about#listing">Building something? Get listed ↗</Link></div></div>
    <section className="page-wrap starting-point" aria-labelledby="starting-title"><div className="starting-art"><Image src="/images/games/kindra-banner.jpg" alt="Official Kindra promotional artwork showing its woodland game world" fill sizes="(max-width: 640px) 100vw, 45vw"/><span>STUDIO ARTWORK / KINDRA</span></div><div><p className="eyebrow">NEW TO THE ECOSYSTEM?</p><h2 id="starting-title">Start with a game you can explore.</h2><p>Kindra is a browser skilling MMO with a build recorded as playable. Its project describes free entry and an optional wallet. Check the dated evidence and current destination before jumping in.</p><Link className="btn btn-primary" href="/games/kindra">Explore Kindra ↗</Link><Link className="starting-source" href="/method">How we choose what to show</Link></div></section>
    <section className="page-wrap catalogue-section" id="catalogue"><GameIndex snapshots={snapshots} renderedAt={Date.now()}/></section>
    <section className="page-wrap field-guide"><div><p className="eyebrow">A LITTLE DUE DILIGENCE GOES A LONG WAY</p><h2>Degen taste.<br/>Receipts attached.</h2></div><div><p>A ticker is a starting point. The game, its contract and its market are separate things to check. Open a listing for dated evidence, source links and the gaps we still need to fill.</p><Link href="/method">Read the field guide ↗</Link></div></section>
  </>;
}
