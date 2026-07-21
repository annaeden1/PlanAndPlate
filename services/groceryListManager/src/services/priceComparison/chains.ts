import { ChainAdapter } from '../../types/priceComparison.types';
import { ramiLevyAdapter } from './ramiLevy.adapter';
import { shufersalAdapter } from './shufersal.adapter';
import { yohananofAdapter } from './yohananof.adapter';
import { osherAdAdapter } from './osherAd.adapter';

export const CHAIN_ADAPTERS: ChainAdapter[] = [
  ramiLevyAdapter,
  shufersalAdapter,
  yohananofAdapter,
  osherAdAdapter,
];
