# Grocery List — Have Stepper + Auto-Check + Per-Item Done

**Date:** 2026-05-18  
**Branch:** have-items  
**Owner:** Li-am Hemo

---

## Summary

Add +/− stepper buttons to the "Have" column on each `GroceryItemCard`. When `have >= need`, the card auto-checks (green border, strikethrough name, checkbox checked) and a per-item **"Done"** button appears. Clicking "Done" removes that item from the list and persists the deletion to the DB. No backend changes required.

---

## User Flow

1. User opens Grocery List — cards show static Need/Have today.
2. After this feature: "Have" shows `[−] 0 piece [+]` stepper.
3. User taps `+` to increment what they already have at home.
4. When `have >= need` → card auto-checks, "Done" button appears.
5. User taps "Done" → item disappears from list, deleted from DB.
6. Alternatively, user can tap global "Finish Shopping" FAB to batch-remove all in-stock items at once.

---

## Card States

### Not in stock (`have < need`)
```
[☐] Eggs                              [×]
    Need: 6    Have: [−] 0 piece [+]  Buy 6 piece
```

### In stock (`have >= need`)
```
[☑] ~~Eggs~~  [In Stock]              [×]
    Need: 6    Have: [−] 6 piece [+]  [Done]
```

---

## Component Changes

### `GroceryItemCard.tsx`

- Add `onUpdateInventory: (name: string, quantity: number) => void` prop (already existed but unused).
- Add `onDone: (name: string) => void` prop.
- Replace static "Have: X unit" text with stepper:
  - `[−]` button: calls `onUpdateInventory(item.name, item.inventoryQuantity - 1)`, disabled when `inventoryQuantity === 0`.
  - `[+]` button: calls `onUpdateInventory(item.name, item.inventoryQuantity + 1)`.
  - Step size: 1.
- Checkbox `checked` prop = `isInStock` (derived: `inventoryQuantity >= quantity`). Read-only — `onChange` is no-op.
- "Done" button: renders only when `isInStock`. Small success-colored outlined button. Calls `onDone(item.name)`.
- "Buy X" chip: unchanged — already disappears when `buyAmount === 0`.

### `GroceryList.tsx`

- Pass `onUpdateInventory={updateInventoryQuantity}` to each `GroceryItemCard`.
- Pass `onDone={(name) => removeBoughtItems([name])}` to each `GroceryItemCard`.
- Change FAB trigger from `hasCheckedItems` (based on `item.checked`) to `hasInStockItems`:
  ```ts
  const hasInStockItems = useMemo(
    () => groups.some((g) => g.items.some((item) => item.inventoryQuantity >= item.quantity)),
    [groups]
  );
  ```
- FAB `onClick` stays `removeBoughtItems` — now removes all in-stock items.

### `GroceryListContext.tsx`

- `removeBoughtItems`: change filter from `item.checked` to `item.inventoryQuantity >= item.quantity`:
  ```ts
  const inStockNames = groups
    .flatMap((g) => g.items)
    .filter((item) => item.inventoryQuantity >= item.quantity)
    .map((item) => item.name);
  ```

---

## Data Flow

```
User taps [+]
  → onUpdateInventory(name, newQty)
  → context: setGroups optimistic update
  → debounced PATCH /inventory (400ms)
  → server returns updated groups

isInStock = inventoryQuantity >= quantity  (derived, frontend only)
  → checkbox checked = isInStock  (read-only)
  → "Done" button visible = isInStock

User taps [Done]
  → onDone(name)
  → context: removeBoughtItems([name])
  → DELETE /products/bought { names: [name] }
  → server returns updated groups (item removed)
  → card disappears
```

---

## Source of Truth

`inventoryQuantity` is already persisted to DB on every stepper change (debounced). It IS the truth. `item.checked` is no longer used for this flow — the checkbox is a read-only visual derived from `isInStock`. No extra toggle API calls needed.

---

## Edge Cases

| Case | Behavior |
|---|---|
| User over-increments (have > need) | Still in-stock, Done available |
| User decrements back below need | Card un-checks, Done disappears |
| Done API fails | Optimistic update reverts via `refresh()` |
| Item has decimal need (e.g. 2.5 cups) | Step=1, user reaches ≥2.5 at have=3 — fine |
| Global FAB clicked with multiple in-stock items | Batch removes all in one API call |

---

## Backend

No changes. All endpoints already exist:
- `PATCH /users/{userId}/products/{name}/inventory` — update inventoryQuantity
- `DELETE /users/{userId}/products/bought` — remove by names array
