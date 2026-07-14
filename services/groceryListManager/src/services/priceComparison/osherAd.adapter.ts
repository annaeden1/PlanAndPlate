import { ChainCatalogItem } from '../../models/chainCatalogItem.model';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';
import { ensureFreshCatalog } from './transparencyFeed.service';

const CHAIN_ID = 'osher-ad';
const PORTAL_USERNAME = 'osherad';
const MAX_RESULTS = 20;

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toChainProduct = (doc: {
  code: string;
  name: string;
  price: number;
}): ChainProduct => ({
  code: doc.code,
  barcode: /^\d{12,13}$/.test(doc.code) ? doc.code : null,
  name: doc.name,
  price: doc.price,
});

export const osherAdAdapter: ChainAdapter = {
  id: CHAIN_ID,
  displayName: 'אושר עד',
  delivery: { fee: 0, note: 'מחירי חנות — אין משלוח אונליין' },

  search: async (term: string): Promise<ChainProduct[]> => {
    await ensureFreshCatalog(CHAIN_ID, PORTAL_USERNAME);
    const clauses = term
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ name: { $regex: escapeRegex(word) } }));
    if (clauses.length === 0) return [];

    const docs = await ChainCatalogItem.find({ chainId: CHAIN_ID, $and: clauses })
      .limit(MAX_RESULTS)
      .lean();
    return docs.map(toChainProduct);
  },

  getByCode: async (code: string): Promise<ChainProduct | null> => {
    await ensureFreshCatalog(CHAIN_ID, PORTAL_USERNAME);
    const doc = await ChainCatalogItem.findOne({ chainId: CHAIN_ID, code }).lean();
    return doc ? toChainProduct(doc) : null;
  },

  getByBarcode: async (barcode: string): Promise<ChainProduct | null> => {
    await ensureFreshCatalog(CHAIN_ID, PORTAL_USERNAME);
    const doc = await ChainCatalogItem.findOne({
      chainId: CHAIN_ID,
      code: barcode,
    }).lean();
    return doc ? toChainProduct(doc) : null;
  },
};
