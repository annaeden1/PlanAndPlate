import { parsePriceFullXml } from '../../services/priceComparison/transparencyFeed.service';

const xmlWith = (items: string) => `<?xml version="1.0"?><Root><Items>${items}</Items></Root>`;

const milkItem = `
<Item>
  <ItemCode>7290004131074</ItemCode>
  <ItemName>חלב תנובה 3% קרטון</ItemName>
  <ItemPrice>7.35</ItemPrice>
</Item>`;

describe('parsePriceFullXml', () => {
  it('extracts code, name and price from Item blocks', () => {
    const items = parsePriceFullXml(xmlWith(milkItem));
    expect(items).toEqual([
      { code: '7290004131074', name: 'חלב תנובה 3% קרטון', price: 7.35 },
    ]);
  });

  it('skips items with missing or invalid price', () => {
    const bad = `
<Item>
  <ItemCode>111</ItemCode>
  <ItemName>שבור</ItemName>
  <ItemPrice>not-a-number</ItemPrice>
</Item>
<Item>
  <ItemCode>222</ItemCode>
  <ItemName>חינם</ItemName>
  <ItemPrice>0</ItemPrice>
</Item>`;
    expect(parsePriceFullXml(xmlWith(bad))).toEqual([]);
  });

  it('parses multiple items', () => {
    const items = parsePriceFullXml(xmlWith(milkItem + milkItem.replace('7290004131074', '111')));
    expect(items).toHaveLength(2);
  });

  it('returns [] for xml without items', () => {
    expect(parsePriceFullXml(xmlWith(''))).toEqual([]);
  });
});
