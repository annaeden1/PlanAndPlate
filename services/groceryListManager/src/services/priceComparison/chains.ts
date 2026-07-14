import { ChainAdapter } from '../../types/priceComparison.types';
import { ramiLevyAdapter } from './ramiLevy.adapter';
import { shufersalAdapter } from './shufersal.adapter';
import { yohananofAdapter } from './yohananof.adapter';
import { osherAdAdapter } from './osherAd.adapter';

/** All supported supermarket chains, in no particular order. */
export const CHAIN_ADAPTERS: ChainAdapter[] = [
  ramiLevyAdapter,
  shufersalAdapter,
  yohananofAdapter,
  osherAdAdapter,
];
