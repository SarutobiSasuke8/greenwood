import type { GameRecord } from '@greenwood/core';
import { CopyAction } from './CopyAction';
export function TokenContract({record}:{record:GameRecord}) {
 return record.tokenAddress ? <div className="token-contract"><span className="contract-label">Token contract · Robinhood Chain 4663</span><code>{record.tokenAddress}</code><CopyAction value={record.tokenAddress} label={`Copy ${record.ticker ?? record.name} contract`}/></div> : <p className="entry-note">No confirmed token contract.</p>;
}
