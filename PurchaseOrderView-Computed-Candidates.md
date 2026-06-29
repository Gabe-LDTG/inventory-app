# PurchaseOrderView.vue — Computed Property Candidates

Analysis of methods that would be more efficient as computed properties.

---

## Zero-Parameter Methods → Direct Computed Replacements

These have no parameters, depend only on reactive data, and are called in the template on every render cycle. They can be moved to `computed:` as-is.

| Method | Current Location | Why Move It |
|---|---|---|
| `isSearchBarDisabled()` | methods | One-liner: `return this.filterMenuField !== ''` |
| `isFilterBoxDisabled()` | methods | One-liner: `return this.searchText !== ''` |
| `setFilterIcon()` | methods | Returns a string derived solely from `filterField` |
| `hasEmptyPORecipeLines()` | methods | Scans `singlePoRecipes` — called twice in template as `:disabled` binding |
| `hasEmptyPORawLines()` | methods | Scans `poBoxes` — called twice in template as `:disabled` binding |
| `hasUnsavedRecords()` | methods | Scans both `singlePoRecipes` and `poBoxes` — called on every close attempt |
| `calculatePoUnitTotal()` | methods | No params, depends on `purchaseOrder` / `poBoxes` — called in edit dialog footer |
| `calculatePoCostTotal()` | methods | No params, depends on `purchaseOrder` / `poBoxes` — called in edit dialog footer |

> **Note on `calculatePoUnitTotal` / `calculatePoCostTotal`:** The `purchaseOrder` watcher triggers `lazySave` (debounced 250ms) on every deep change, which also re-renders the footer. Making these computed eliminates redundant recalculation on each autosave tick.

---

## Per-Row Methods Called Inside `v-for` → Computed Maps

These accept a `po` or `poId` parameter and are called **for every card/row** on each render. The fix is to pre-compute a `Map<number, result>` keyed by `purchase_order_id` so the template does a single `O(1)` lookup instead of a full iteration per row.

| Method | Calls per page render | Cost per call |
|---|---|---|
| `getPoRawLineProgress(po)` | **7× per card** (1 summary + 6 segment styles) | Iterates all `po_raw_lines` for the PO |
| `getPoProgressSummary(po)` | 1× per card + detail dialog | Calls `getPoRawLineProgress` internally |
| `getPoProgressSegmentStyle(po, segment)` | 6× per card + 6× in detail dialog | Calls `getPoRawLineProgress` internally |
| `getCreatedUnitTotal(poID)` | 1× per card + 1× in table column + 1× in detail footer | Filters `po_raw_products` |
| `getCreatedCostTotal(poID, poDiscount)` | 1× per card + 1× in table column + 1× in detail footer | Filters + maps `po_raw_products` |
| `getVendor(vendorId)` | 1× per card + 1× per table row + workspace panel | `.find()` on `vendors` array |

### Example refactor pattern

```ts
// Replaces getCreatedUnitTotal(poID) — computed once for all visible POs
unitTotalByPoId(): Map<number, number> {
    const map = new Map<number, number>();
    for (const po of this.purchaseOrders) {
        const lines = (this.po_raw_products || []).filter((l: any) =>
            l.purchase_order_id === po.purchase_order_id &&
            this.normalizeRawLineStatus(l.status) !== 'Cancelled'
        );
        map.set(po.purchase_order_id, lines.reduce((s: number, l: any) => s + Number(l.total_units || 0), 0));
    }
    return map;
},

// Template usage (replaces method call):
// {{ unitTotalByPoId.get(po.purchase_order_id) }}
```

---

## Priority Order

1. **`getPoRawLineProgress`** — highest impact. Called 7× per card; with 25 cards per page that's ~175 iterations per render cycle. A computed map brings this to 25 iterations total.
2. **`getCreatedUnitTotal` / `getCreatedCostTotal`** — both filter `po_raw_products` per card per render.
3. **`calculatePoUnitTotal` / `calculatePoCostTotal`** — footer rerenders on every autosave tick (250ms debounce while the edit dialog is open).
4. **`hasEmptyPORawLines` / `hasEmptyPORecipeLines`** — used as `:disabled` bindings, so they run on every input event inside the edit dialog.
5. **`isSearchBarDisabled` / `isFilterBoxDisabled` / `setFilterIcon`** — trivial one-liners; easiest wins.

---

## Already Computed (Reference)

The following are already correctly implemented as computed properties:

- `isPoReadOnly`
- `poReadOnlyMessage`
- `selectedWorkspacePo`
- `workspaceInvoiceList`
- `workspaceUninvoicedLines`
- `workspaceInvoicedUnits`
- `detailSelectedPoId`
- `detailInvoiceList`
- `detailPlannedCases`
- `detailRawLines`
- `detailArrivedBoxes`
- `detailInvoiceRows`
- `activeReceiveInvoices`
