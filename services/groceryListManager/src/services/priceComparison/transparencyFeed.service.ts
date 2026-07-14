import axios from 'axios';
import { gunzipSync } from 'zlib';
import { ChainCatalogItem } from '../../models/chainCatalogItem.model';

const PORTAL = 'https://url.publishedprices.co.il';
const REQUEST_TIMEOUT_MS = 60_000;
const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;

interface ParsedItem {
  code: string;
  name: string;
  price: number;
}

export const parsePriceFullXml = (xml: string): ParsedItem[] => {
  const items: ParsedItem[] = [];
  const itemBlocks = xml.match(/<Item>[\s\S]*?<\/Item>/g) ?? [];

  for (const block of itemBlocks) {
    const code = block.match(/<ItemCode>(.*?)<\/ItemCode>/)?.[1]?.trim();
    const name = block.match(/<ItemName>(.*?)<\/ItemName>/)?.[1]?.trim();
    const priceStr = block.match(/<ItemPrice>(.*?)<\/ItemPrice>/)?.[1]?.trim();
    const price = priceStr ? Number(priceStr) : NaN;

    if (code && name && Number.isFinite(price) && price > 0) {
      items.push({ code, name, price });
    }
  }

  return items;
};

const extractCsrf = (html: string): string | null =>
  html.match(/name="csrftoken" content="([^"]+)"/)?.[1] ?? null;

const mergeCookies = (
  current: string,
  setCookie: string[] | undefined,
): string => {
  const jar = new Map<string, string>();
  const add = (pair: string) => {
    const [name, ...rest] = pair.split('=');
    if (name) jar.set(name.trim(), rest.join('='));
  };
  current.split(';').filter((p) => p.includes('=')).forEach(add);
  (setCookie ?? []).forEach((c) => add(c.split(';')[0]));
  return Array.from(jar.entries())
    .map(([n, v]) => `${n}=${v}`)
    .join('; ');
};

const login = async (username: string): Promise<string> => {
  const loginPage = await axios.get(`${PORTAL}/login`, {
    timeout: REQUEST_TIMEOUT_MS,
  });
  const csrf = extractCsrf(loginPage.data);
  if (!csrf) throw new Error('transparency portal: csrf token not found');
  let cookies = mergeCookies('', loginPage.headers['set-cookie']);

  const res = await axios.post(
    `${PORTAL}/login/user`,
    new URLSearchParams({ username, password: '', csrftoken: csrf }),
    {
      headers: { Cookie: cookies },
      maxRedirects: 0,
      validateStatus: (s) => s === 302 || s === 200,
      timeout: REQUEST_TIMEOUT_MS,
    },
  );
  cookies = mergeCookies(cookies, res.headers['set-cookie']);
  return cookies;
};

const findLatestPriceFull = async (cookies: string): Promise<string> => {
  const filePage = await axios.get(`${PORTAL}/file`, {
    headers: { Cookie: cookies },
    timeout: REQUEST_TIMEOUT_MS,
  });
  const csrf = extractCsrf(filePage.data);
  if (!csrf) throw new Error('transparency portal: file-page csrf not found');

  const res = await axios.post<{ aaData?: Array<{ fname: string }> }>(
    `${PORTAL}/file/json/dir`,
    new URLSearchParams({ iDisplayLength: '100000', csrftoken: csrf }),
    { headers: { Cookie: cookies }, timeout: REQUEST_TIMEOUT_MS },
  );

  const names = (res.data.aaData ?? [])
    .map((f) => f.fname)
    .filter((n) => n.startsWith('PriceFull'));
  if (names.length === 0) throw new Error('transparency portal: no PriceFull files');

  return names.sort((a, b) =>
    (a.split('-').slice(-2).join('-')).localeCompare(b.split('-').slice(-2).join('-')),
  )[names.length - 1];
};

const downloadXml = async (cookies: string, fname: string): Promise<string> => {
  const res = await axios.get(`${PORTAL}/file/d/${fname}`, {
    headers: { Cookie: cookies },
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT_MS,
  });
  const xml = gunzipSync(Buffer.from(res.data)).toString('utf-8');
  return xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml;
};

export const refreshChainCatalog = async (
  chainId: string,
  portalUsername: string,
): Promise<number> => {
  const cookies = await login(portalUsername);
  const fname = await findLatestPriceFull(cookies);
  const xml = await downloadXml(cookies, fname);
  const items = parsePriceFullXml(xml);
  if (items.length === 0) throw new Error(`transparency feed: empty snapshot ${fname}`);

  const byCode = new Map<string, ParsedItem>();
  for (const item of items) byCode.set(item.code, item);
  const unique = [...byCode.values()];

  const now = new Date();
  await ChainCatalogItem.deleteMany({ chainId });
  await ChainCatalogItem.insertMany(
    unique.map((i) => ({ ...i, chainId, updatedAt: now })),
    { ordered: false },
  );
  return unique.length;
};

const refreshInFlight = new Map<string, Promise<number>>();

export const ensureFreshCatalog = async (
  chainId: string,
  portalUsername: string,
): Promise<void> => {
  const newest = await ChainCatalogItem.findOne({ chainId })
    .sort({ updatedAt: -1 })
    .select({ updatedAt: 1 });

  const stale = !newest || Date.now() - newest.updatedAt.getTime() > SNAPSHOT_TTL_MS;
  if (!stale) return;

  let inFlight = refreshInFlight.get(chainId);
  if (!inFlight) {
    inFlight = refreshChainCatalog(chainId, portalUsername).finally(() => {
      refreshInFlight.delete(chainId);
    });
    refreshInFlight.set(chainId, inFlight);
  }
  await inFlight;
};
