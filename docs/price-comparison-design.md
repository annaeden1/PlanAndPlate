# Price Comparison & Cart Push — Design (v2)

**Feature:** From the in-app grocery list (built from recipes), one click ("Check prices") compares the total basket cost across Israeli supermarket online stores (רמי לוי, שופרסל, יוחננוף, אושר עד, …) and shows a ranked result. Phase 2 (deferred): push the basket into the chosen chain's real online cart.

**Status:** Design approved. First chain: Rami Levy. No code yet.

---

## 1. Core decisions

| Decision | Choice | Why |
|---|---|---|
| Primary feature | Price compare, not cart push | User picks the cheapest chain first; push is a follow-up action |
| Target stores | Online stores only (rami-levy.co.il/online, shufersal online, …) | User decision; no physical-branch pricing |
| Price source | **Hybrid**: chain's own site catalog API = source of truth for price/stock/ids; חוק שקיפות transparency feed = legal bulk fallback + catalog for matching | Site price == cart price; feed covers gaps and is legally safe |
| Input | Free-text grocery list items from recipes ("חלב 3%", qty, unit) | Barcodes are not user data |
| Compare basis | **Same product at every chain** (basket parity) | Apples-to-apples totals; cheapest-per-chain compares different brands |
| Disambiguation | LLM best-match over search candidates, **cached** per normalized item text | Semantic problem; runs once per unique ingredient |
| Barcode role | Invisible join key only — canonical product → priced at each chain | Never user-facing |
| Automation style | Deterministic HTTP to chains' internal JSON APIs; **no browser agent** for lookups | Search+price is deterministic; agents are slow/costly/flaky |
| Promos | Base shelf price only in v1, with disclaimer | Club prices are v1.5 (see risks — this biases ranking) |
| Checkout | Always manual on the chain site (Phase 2 fills cart only) | Lower legal and trust risk |

## 2. Pipeline

```
1. RESOLVE  (once per unique item, cached)
   "חלב 3% 1ל"
     → exact/near string match against catalog first (skip LLM when clean)
     → else: search candidates → LLM picks best (name + size + qty)
     → canonical product { barcode, name, package_size, unit }
     → cache[normalized_text] = canonical (+ confidence)

2. QUANTIFY  (per item, per chain)                        ← new in v2
   recipe needs 600g; chain sells 500g packages → buy 2 packages
   price_line = package_price × packages_needed
   (Compare what the user PAYS at the register, not prorated recipe cost.)

3. PRICE  (per chain)
   canonical.barcode → site API (primary) → feed (fallback)
     → { price, inStock, chainItemId }
   absent at chain → mark missing

4. COMPARE
   Intersection mode: items missing at ANY chain are excluded from ALL
   chains' totals and listed separately ("not comparable: X, Y").
   total[chain] = Σ line prices  +  delivery fee (per chain rules,
   incl. free-over-threshold minimums)                    ← new in v2
   rank → רמי לוי 254 / שופרסל 268 / …
```

## 3. Components

- **Chain adapter** (interface; one impl per chain)
  - `search(term) → candidates[]`
  - `priceByBarcode(barcode) → { price, inStock, chainItemId }`
  - `deliveryRules → { fee, freeOverThreshold, minimumOrder }`
  - Phase 2: `addToCart(session, chainItemId, qty)`
- **Feed ingest** — scheduled download + parse of transparency feeds → catalog + `(chain, barcode) → price` table. Scope it small: online-store file per chain only, relevant categories only, or on-demand. Do not build a data platform.
- **Resolver** — list item → canonical product. String-match first, LLM fallback, cached. Invalidation: if cached barcode 404s at all chains, re-resolve (don't error).
- **Compare service** — orchestrates quantify + price + delivery + intersection ranking.

## 4. Data model (minimum)

```
product        (id, name, barcode?, unit, package_size)
chain          (id, name, online_store_id, delivery_rules)
chain_price    (chain_id, barcode, chain_item_id, price, in_stock, updated_at)
match_cache    (normalized_text, product_id, confidence, confirmed, resolved_at)
pantry_item    (user_id, product_id)          -- "already have", excluded from compare
```

## 5. Honesty rules (UI must enforce)

0. **Estimate disclaimer (everywhere)** — all compared prices are presented as an estimate (הערכה בלבד), not a guaranteed price. Shown on the compare screen itself, not buried in settings. Wording along the lines of: "המחירים הם הערכה בלבד ועשויים להשתנות באתר הרשת". This is the umbrella covering promo gaps, stale data, match errors, and delivery-zone variance — the specific rules below still apply.
1. **Delivery fees in totals** — show subtotal + delivery + total per chain. Fees can flip the ranking; hiding them is lying.
2. **Intersection compare** — never sum different baskets. Excluded items listed visibly per compare.
3. **Show resolved product names** in the compare detail — the user eyeballing "תנובה חלב 3% 1ל" at each chain is the error-correction loop for LLM mismatches.
4. **Pantry exclusion** — staples (מלח, שמן, פלפל) user already owns are excludable from the list with one tap.
5. **Timestamps** — "prices as of X" from `updated_at`.
6. **Promo disclaimer** — "club/promo prices not included"; acknowledge base-price ranking may favor non-club chains.
7. **Low-confidence matches flagged** for one-tap user confirmation.

## 6. Known risks

| Risk | Impact | Mitigation |
|---|---|---|
| Shufersal online prices vary by delivery address (fulfillment store) | "One online price" assumption breaks | Verify when building that adapter; likely need user city/address |
| Internal APIs are unofficial (ToS-grey), may change or get bot-protected | Adapter breakage | Feed fallback; daily canary lookup + alert; adapters are a maintenance contract |
| Club prices excluded in v1 | Ranking structurally biased against club-heavy chains (Shufersal) | Ship v1 with disclaimer; PromoFull parsing is v1.5, not "someday" |
| Loose produce (kg, no barcode) | Low-confidence matching | Name+PLU fuzzy match, flag to user |
| Hebrew unit normalization (ק"ג/גרם/יח'/ליטר) | Wrong quantify math | Dedicated normalization layer; budget real time |
| Feed price vs site price disagree | Which to show? | Site API wins (it's what the cart will charge); log divergence |
| LLM cost | Negligible: ~$0.0007/item uncached; string-match-first + cache → cents overall | Cache by normalized text |

## 7. Build order

1. **Rami Levy adapter** — probe real endpoints; `search` + `priceByBarcode`; confirm JSON shapes and bot-protection posture.
2. **Delivery-fee model** — per-chain rules in `chain.delivery_rules`; totals include delivery from day one.
3. **Package-quantity math** — recipe qty → packages-needed per chain (unit normalization included).
4. **Feed ingest (Rami Levy)** — fallback pricing + catalog for the resolver.
5. **Resolver** — string match → LLM fallback → cache.
6. **Compare service** — single chain end-to-end, intersection logic ready.
7. **"Check prices" UI** — ranked totals, resolved-name detail, excluded list, pantry toggle, timestamps.
8. **Shufersal adapter** — proves the abstraction; resolve the address/zone question here.
9. **יוחננוף, אושר עד adapters.**
10. **v1.5: PromoFull / club prices.**
11. **Phase 2: push-to-cart** on the chosen chain — decide auth model then (browser extension in user session preferred over server-side credentials).

## 8. Rami Levy adapter — probe findings (2026-07-13)

**Endpoint:** `POST https://www.rami-levy.co.il/api/catalog`
Body (JSON, **must be UTF-8**): `{"q": "<term or barcode>", "store": "331", "from": 0, "aggs": 1}`
No auth, no cookies, no bot block encountered (plain curl + browser UA → 200).

**Behavior verified:**
- `q` = Hebrew term → search. `"חלב"` → `total: 118`, ranked products.
- `q` = barcode → **exact single hit** (`total: 1`). One endpoint serves both `search()` and `priceByBarcode()`.
- `store` param does **not** change price (tested 331 / 82 / 1314 → identical) — Rami Levy national uniform pricing. No store/branch picker needed for this chain.
- `from` = pagination offset.

**Response shape (per product in `data[]`):**
```jsonc
{
  "id": 262503,                    // chainItemId (use for Phase 2 cart)
  "barcode": 7290000056845,        // join key — number, not string (mind precision in JS!)
  "name": "חלב תנובה 3% שומן 1.5 ל'",
  "price": { "price": 10.9 },
  "department": {...}, "group": {...}, "subGroup": {...},
  "available_in": [82, 179, ...],  // branch ids stocking it
  "gs": {                          // GS1 metadata — gold for QUANTIFY step
    "internal_product_description": "...",
    "Product_Dimensions": { "Price_Comparison_Content": [...] },
    "Search_Tags": [...]
  },
  "images": { "small": "/product/<barcode>/small.jpg", ... }
}
```

**Adapter notes:**
- `gs.Product_Dimensions` + unit fields feed package-size normalization directly.
- `barcode` arrives as a JSON number — 13-digit EANs exceed float-safe territory in some parsers; parse as string/BigInt.
- Hebrew in request body: send raw UTF-8 bytes; wrong encoding silently returns the full unfiltered catalog (`total: 7512`) instead of erroring — a correctness trap, assert `q` echoes back intact.
- Empty/soft failure mode: response echoes `q`; validate it matches what was sent.

## 8b. Other chains — probe findings (2026-07-13)

| Chain | Source | Search | Re-price | Notes |
|---|---|---|---|---|
| שופרסל | `GET /online/he/search/results?q=<term>:relevance` (Hybris, public JSON) | ✓ | search by internal code (`P_4131074` → q=`4131074`) | EAN search NOT indexed; `sku` is EAN only when 13 digits. Delivery 35.90 + 15 service fee (<750₪) |
| יוחננוף | `POST api.yochananof.co.il/graphql` (Magento 2, public) | `products(search:)` | `products(filter:{sku:{eq:}})` | `sku` = full EAN. Fee unpublished → 35.90 estimate |
| אושר עד | **No online store** (osherad-online.co.il DNS-dead; "אושר סמארט" = in-store app) | transparency feed → Mongo snapshot, regex search | Mongo lookup by ItemCode | publishedprices.co.il, user `osherad`, empty password; login **rotates** `cftpSID` cookie — replace, never append. ~6.6k items/store; delivery fee 0, "in-store prices" note |

**Gemini call budget (per uncached item):** resolved via **canonical-once + barcode reuse**:
1. Translate EN→HE (1 call, shared across chains, cached).
2. Resolve ONE canonical product at the reference chain (Rami Levy, whose product code = EAN) with a single LLM pick (1 call), cached under `chainId: '__canonical__'`.
3. Price every other chain by that barcode via `getByBarcode` — **0 LLM calls** (Yohananof/Osher Ad use the EAN directly; Rami Levy is the reference).
4. Only when a chain doesn't stock the barcode (mainly Shufersal, whose codes aren't EANs) fall back to a per-chain name search + LLM pick.

Result: **~2–3 LLM calls/item** (was ~5 — one pick per chain). Barcode reuse also strengthens basket-parity: chains matched by barcode are literally the same product. Depleted/throttled Gemini key still degrades every item to `missing` (translation fails first) — a funded key is required.

**Ranking rule:** fewest missing items first, then cheapest total — an incomplete basket's low total is not comparable to a full one.

## 9. Out of scope (for now)

- Automatic checkout (never — user always pays manually).
- Physical-branch price comparison.
- Multi-chain split baskets ("buy X here, Y there").
- Substitution suggestions for out-of-stock items.
