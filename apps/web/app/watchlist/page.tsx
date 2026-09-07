import { GameIndex } from '@/components/GameIndex';
import { getSnapshots } from '@/lib/data';
export const metadata={title:'Watchlist',description:'Your saved Greenwood games, stored only in this browser.'};
export default async function WatchlistPage(){const snapshots=await getSnapshots();return <section className="page-wrap catalogue-section"><p className="eyebrow">YOUR WATCHLIST</p><h1>Keep your next obsession close.</h1><p className="watchlist-intro">Saved on this browser. No account or wallet required. Clearing browser storage removes your list.</p><GameIndex snapshots={snapshots} renderedAt={Date.now()} defaultFilter="saved"/></section>;}
