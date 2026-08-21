# PurchaseOrderView.vue Component Separation Plan

## Purpose

`frontend/eInventory/src/views/PurchaseOrderView.vue` has grown into a complete purchase-order feature area rather than a single screen component. It currently combines presentation, dialog workflows, persistence, calculations, realtime subscriptions, edit locking, and legacy-data compatibility.

This document is a reference plan for separating those responsibilities incrementally. The goal is not to make every file arbitrarily small. The goal is to give each meaningful workflow a clear owner while keeping the purchase-order page understandable and testable.

## Guiding Principles

- Split by user workflow or domain responsibility, not by arbitrary line count.
- Keep PrimeVue components inside components that own the related UI behavior.
- Keep page-level coordination in `PurchaseOrderView.vue`.
- Keep database calls behind the existing `action` utility or a later purchase-order service.
- Prefer explicit props and emitted events over child components reaching into parent state.
- Extract one working slice at a time and run the frontend type check after each slice.
- Preserve current behavior before attempting broader rewrites or a migration from Options API to Composition API.
- Treat existing raw-line and legacy-box behavior as compatibility requirements until verified otherwise.

## Recommended End State

A reasonable feature structure would be:

```text
frontend/eInventory/src/
  views/
    PurchaseOrderView.vue

  components/purchase-orders/
    PurchaseOrderCardGrid.vue
    PurchaseOrderTable.vue
    PurchaseOrderWorkspace.vue
    PurchaseOrderDetailDialog.vue
    PurchaseOrderEditDialog.vue
    PurchaseOrderRecipeTable.vue
    PurchaseOrderRawLineTable.vue
    InboundInvoiceDialog.vue
    PlanInvoiceDialog.vue
    ReceiveInvoiceDialog.vue
    InvoiceEditDialog.vue
    VendorSelectDialog.vue
    RawProductCancelDialog.vue
    PurchaseOrderConfirmDialogs.vue

  composables/purchase-orders/
    usePurchaseOrderPage.ts
    usePurchaseOrderEditing.ts
    usePurchaseOrderInvoices.ts
    usePurchaseOrderReceiving.ts
    usePurchaseOrderLocks.ts
    usePurchaseOrderRealtime.ts
    usePurchaseOrderCalculations.ts

  utils/purchase-orders/
    purchaseOrderCalculations.ts
    purchaseOrderLineUtils.ts
```

This is a destination, not a requirement to create every file immediately. Some related pieces can remain together if they are still cohesive.

## Responsibility Map

### `PurchaseOrderView.vue`

The page should eventually coordinate the feature rather than implement every detail.

Keep here:

- Which layout is active: cards or table.
- Current page, page size, search, filters, and sort state.
- Selected purchase order.
- Which top-level workflow is open.
- Page-level loading and error states.
- Coordination between child components.
- Passing shared reference data such as vendors, products, recipes, and locations.
- Refreshing the current page after a child reports a successful mutation.

The page should eventually stop owning the markup for every dialog and table.

### Optional `PurchaseOrderToolbar.vue`

Do not extract this merely because it is called a toolbar. A small wrapper containing a search field, filter button, and one action button is usually better left in the page component.

Extract it only if the toolbar becomes a real coordination unit with several related behaviors, such as search, filters, layout switching, bulk invoice receiving, and create-PO actions. In that case it can own:

- Search input.
- Filter button.
- Receive-active-invoices button.
- Layout-specific toolbar actions.
- Toolbar-level disabled and loading states.

Possible events:

```text
update:searchText
open-filter
receive-active-invoices
create-po
```

For the current implementation, keep this markup in `PurchaseOrderView.vue` during the first extraction pass.

### `PurchaseOrderCardGrid.vue`

Owns:

- Purchase-order cards.
- Card progress display.
- Card metrics.
- Card action popover.
- Card pagination display if pagination is intentionally part of the card layout.

It should receive already-prepared totals and progress data instead of repeatedly scanning raw arrays itself.

Suggested events:

```text
open-detail(po)
create-invoice(po)
receive-invoices(po)
edit-po(po)
delete-po(po)
```

### `PurchaseOrderTable.vue`

Owns:

- PrimeVue `DataTable` for the main table.
- Columns, sorting, expansion, and table-specific rendering.
- Table row selection.
- Table pagination events.
- The existing expanded-row views can initially remain here, but should later be separated if they continue to grow.

Suggested events:

```text
update:selection
page(event)
sort(event)
open-inbound(po)
edit-po(po)
open-detail(po)
```

### `PurchaseOrderWorkspace.vue`

Owns the right-hand selected-PO workspace currently rendered beside the table:

- Selected PO header.
- Invoice count and line metrics.
- Invoice summary table.
- Uninvoiced product-line table.
- Create-invoice and edit-PO actions.

The parent should provide the selected PO, invoice rows, and uninvoiced rows.

### `PurchaseOrderDetailDialog.vue`

Owns the read-oriented purchase-order detail dialog:

- PO summary.
- Progress display.
- Planned cases section.
- Raw products section.
- Invoices and linked product lines section.
- Arrived boxes section.
- Detail-dialog footer totals and actions.

This is a high-value extraction because it is already a self-contained user workflow with its own loading state and derived collections.

Suggested events:

```text
create-invoice(po)
receive-invoices(po)
edit-po(po)
edit-invoice(invoice)
plan-invoice(invoice)
receive-invoice(invoice)
close
```

### `PurchaseOrderEditDialog.vue`

Owns the edit purchase-order dialog shell:

- PO header fields.
- Read-only lock message.
- Save/loading overlay.
- Edit dialog footer.
- Composition of recipe and raw-line editing tables.
- Unsaved-change close behavior at the dialog boundary.

The first extraction can keep the current editing methods in the parent and pass callbacks. A later pass should move edit-specific state and persistence into `usePurchaseOrderEditing.ts`.

Suggested props:

```text
purchaseOrder
vendors
recipes
products
rawProducts
readOnly
saving
loading
```

Suggested events:

```text
close
force-close
save-header
save-recipe-line
save-raw-line
add-recipe-line
add-raw-line
cancel-raw-line
```

### `PurchaseOrderRecipeTable.vue`

Owns:

- Planned processed-case `DataTable`.
- Recipe autocomplete.
- Recipe input preview table.
- Amount and quantity editing.
- Add-row control.
- Recipe-row validation display.

This component should not know how the parent reloads the PO. It should emit a saved row or a domain-level error.

### `PurchaseOrderRawLineTable.vue`

Owns:

- Raw-box/raw-line `DataTable`.
- Product autocomplete.
- Amount, total, FBM, store, and notes editing.
- Add-row control.
- Cancel-product action.
- Unsaved-row removal.

The persistence implementation can initially remain in the parent. Once the component boundary is stable, move it into `usePurchaseOrderEditing.ts`.

### `InboundInvoiceDialog.vue`

Owns the create-invoice workflow:

- Invoice name.
- Eligible raw-line allocation table.
- Shipped, back-ordered, and remaining quantities.
- Unaccounted-unit confirmation.
- Create-invoice loading and validation states.

Likely composable partner: `usePurchaseOrderInvoices.ts`.

Suggested events:

```text
close
invoice-created(result)
```

### `PlanInvoiceDialog.vue`

Owns:

- FBA Prep, FBM, and Store allocation table.
- Remaining-unit calculation display.
- Planning autosave indicator.
- Unsaved-plan confirmation.

Likely composable partner: `usePurchaseOrderInvoices.ts` or a smaller `useInvoicePlanning.ts` if this workflow continues to grow.

### `ReceiveInvoiceDialog.vue`

Owns:

- Invoice-grouped receiving table.
- Actual units per box.
- Received boxes by destination.
- Location splits and location autocomplete.
- Receiving validation.
- Receiving autosave indicator.
- Unsaved-receiving confirmation.

Likely composable partner: `usePurchaseOrderReceiving.ts`.

### `InvoiceEditDialog.vue`

Owns the small invoice metadata form:

- Invoice name.
- Shipped, due, and paid dates.
- Notes.
- Filed checkbox.
- Save and validation state.

This is a good early extraction because it has a narrow interface and low risk.

### `VendorSelectDialog.vue`

Owns:

- Vendor autocomplete.
- Vendor validation.
- Missing vendor company-code/nickname follow-up.

The missing nickname dialog can initially remain alongside it. If vendor creation becomes a reusable workflow, extract a separate `VendorNicknameDialog.vue` later.

### `RawProductCancelDialog.vue`

Owns:

- Cancel by box or unit choice.
- Amount validation.
- Cancellation preview.
- Confirm-cancel action.

The parent can continue to provide the selected raw line and receive a `confirmed` event until cancellation persistence is moved into the editing composable.

### `PurchaseOrderConfirmDialogs.vue`

Can contain the small, low-complexity confirmation dialogs:

- Unsaved edit changes.
- Cancel PO.
- Delete PO.
- Status change.
- Location creation, if it is not reused elsewhere.

Do not force this extraction early if it makes event wiring harder than the current code. It is a cleanup step after the larger workflows have moved out.

## Composable Boundaries

### `usePurchaseOrderCalculations.ts`

Move reactive derived values and calculation helpers here:

- Unit totals by PO.
- Cost totals by PO.
- PO progress by PO.
- Vendor lookup maps.
- Product lookup maps.
- Invoice linked-line helpers.
- Unprocessed/no-plan aggregation.

Pure calculations such as progress aggregation and line normalization can live in `utils/purchase-orders/` and be unit tested without Vue.

### `usePurchaseOrderEditing.ts`

Move edit workflow state and behavior here:

- `poBoxes`.
- `singlePoRecipes`.
- `singlePoRawProducts`.
- Editing-row state.
- Add-row helpers.
- Recipe-row save.
- Raw-line save.
- Unsaved-record detection.
- Edit-dialog close and lock coordination.

This is likely the largest composable. It is acceptable for it to be several hundred lines if it represents one coherent editing workflow.

### `usePurchaseOrderInvoices.ts`

Move invoice creation and planning behavior here:

- Inbound line allocations.
- Invoice creation validation.
- Unaccounted-unit handling.
- Invoice-linked-line preparation.
- Planning allocations and autosave.
- Invoice metadata editing if the workflow remains small.

### `usePurchaseOrderReceiving.ts`

Move receiving behavior here:

- Invoice rows to receive.
- Receiving-line preparation.
- Box and partial-box calculations.
- Location splits.
- Receiving validation.
- Persisting received boxes and updating raw-line statuses.

### `usePurchaseOrderLocks.ts`

Move all edit-lock infrastructure here:

- Active lock state.
- Current editor identity.
- Acquire, refresh, and release operations.
- Heartbeat timer.
- Realtime lock subscription.
- Read-only message.

The view or edit dialog should consume `isReadOnly` and `readOnlyMessage`, not implement lock mechanics.

### `usePurchaseOrderRealtime.ts`

Move page-scoped subscriptions here:

- Purchase-order changes.
- Case changes.
- Recipe changes.
- Raw-line changes.
- Subscription cleanup.
- Refresh callback behavior.

Keep the important existing rule: realtime callbacks should refresh data without rebuilding subscriptions recursively.

### `usePurchaseOrderPage.ts`

This can eventually own:

- `loadPage`.
- Search debounce.
- Filter application.
- Pagination.
- Sort state.
- Page-level loading state.
- Refreshing the current page.

Do this after the more obvious UI extractions. Moving page loading too early creates a large prop/context migration while the component boundaries are still changing.

## Recommended Extraction Order

### Phase 0: Baseline

Before changing structure:

- Run `npm run type-check` from `frontend/eInventory`.
- Run `npm run build` if the current branch builds successfully.
- Manually verify the major flows:
  - Load and paginate POs.
  - Open card detail.
  - Open table workspace.
  - Create an invoice.
  - Plan an invoice.
  - Receive invoice boxes.
  - Edit a recipe line.
  - Edit and cancel a raw line.
  - Verify read-only behavior with an active lock.
- Record any pre-existing failures separately from refactoring failures.

### Phase 1: Extract the smallest dialogs

Start with:

1. `InvoiceEditDialog.vue`
2. `VendorSelectDialog.vue`
3. `RawProductCancelDialog.vue`

These have narrow inputs and outputs. The goal is to establish the project’s prop and event conventions.

Checkpoint: the page builds, and each dialog still opens, validates, saves, and closes correctly.

### Phase 2: Extract the detail and workspace surfaces

Extract:

1. `PurchaseOrderWorkspace.vue`
2. `PurchaseOrderDetailDialog.vue`

Keep their data preparation in the parent initially. This reduces the risk of mixing UI movement with business-logic changes.

Checkpoint: selected PO behavior, invoice expansion, detail actions, and totals remain unchanged.

### Phase 3: Extract the main list views

Extract:

1. `PurchaseOrderCardGrid.vue`
2. `PurchaseOrderTable.vue`

Keep pagination, filtering, sorting, and loading orchestration in the parent at first. The child components should emit events rather than call `loadPage` directly.

Keep the toolbar in the page unless it has grown enough to own multiple toolbar workflows. It is an optional later extraction, not a required component boundary.

Checkpoint: cards and table both work, selection remains correct, and switching layouts does not lose state.

### Phase 4: Extract the edit dialog

Extract:

1. `PurchaseOrderEditDialog.vue`
2. `PurchaseOrderRecipeTable.vue`
3. `PurchaseOrderRawLineTable.vue`

Start with presentation extraction. Then move editing state and persistence into `usePurchaseOrderEditing.ts` after the template is stable.

Checkpoint: recipe additions/edits, raw-line additions/edits, cancel behavior, unsaved-change protection, autosave, and edit locks all work.

### Phase 5: Extract invoice workflows

Extract:

1. `InboundInvoiceDialog.vue`
2. `PlanInvoiceDialog.vue`
3. `ReceiveInvoiceDialog.vue`

Then move their state and persistence into:

- `usePurchaseOrderInvoices.ts`
- `usePurchaseOrderReceiving.ts`

Checkpoint: invoice creation, unaccounted-unit handling, planning autosave, receiving location splits, partial boxes, and status updates all work.

### Phase 6: Extract infrastructure and calculations

After UI boundaries are stable, extract:

1. `usePurchaseOrderLocks.ts`
2. `usePurchaseOrderRealtime.ts`
3. `usePurchaseOrderCalculations.ts`
4. Pure line/progress calculation utilities.
5. `usePurchaseOrderPage.ts` for paging and filtering.

Checkpoint: the page component is mostly orchestration and contains very little domain calculation or persistence logic.

## State Ownership Rules

Use this rule when deciding where a variable belongs:

| State | Suggested owner |
|---|---|
| Current page, search, filter, sort | Page/composable |
| Selected PO | Page |
| Card/table layout mode | Page |
| Dialog visible state | Page initially; dialog composable later |
| Current edit draft | Edit dialog/composable |
| Recipe editing rows | Recipe table/edit composable |
| Raw-line editing rows | Raw-line table/edit composable |
| Invoice allocation rows | Invoice dialog/composable |
| Receive allocation rows | Receive dialog/composable |
| Vendor/product/location catalogs | Page or shared store/cache |
| PO totals and progress | Calculations composable |
| Lock and heartbeat | Lock composable |
| Realtime channels | Realtime composable |
| Supabase/RPC calls | `action` utility or service layer |

Avoid passing the entire page object into every child if a smaller prop is sufficient. For example, pass `rawLines`, `products`, and `purchaseOrderId` rather than the entire component instance or all page state.

## Event and Refresh Conventions

Use domain-level events where possible:

```text
saved
created
cancelled
deleted
close
request-refresh
```

A child should report what happened. The page decides whether to reload the current page, patch a row, or refresh a dialog.

Prefer:

```vue
<ReceiveInvoiceDialog
    :purchase-order="selectedPurchaseOrder"
    @saved="handleReceivingSaved"
/>
```

Over:

```vue
<ReceiveInvoiceDialog
    :on-load-page="loadPage"
    :on-edit-raw-line="onPORawLineEditSave"
    :on-refresh="purchaseOrderRefresh"
    :on-toast="addToast"
/>
```

If a child requires many callbacks, that is a signal to move the related behavior into a composable or service.

## PrimeVue-Specific Notes

- `DataTable` columns and slots can live safely inside child components.
- Use `v-model:selection`, `v-model:editingRows`, and other model bindings at the component boundary when the parent needs the state.
- PrimeVue template refs such as the table ref should stay in the component that owns the table unless the parent genuinely needs them.
- Keep `:deep(...)` styles close to the component that renders the PrimeVue widget.
- Do not extract every `Column` into its own component. A table with its columns is one cohesive UI unit.
- Keep `DataTable` `dataKey` values stable when rows move into child components.
- Be cautious with `Teleport`-based dialogs and popovers. Test z-index, overlay behavior, and ref cleanup after extraction.

## Verification Checklist Per Extraction

After each substantive extraction:

- Run `npm run type-check`.
- Open the affected workflow in the browser.
- Verify loading and empty states.
- Verify validation and disabled states.
- Verify success and error toasts.
- Verify the parent refreshes after mutations.
- Verify dialog close and reopen behavior.
- Verify realtime refresh does not duplicate subscriptions.
- Verify edit locks still release on close and unmount.
- Inspect the diff for accidental changes to API payloads or status strings.

For invoice and receiving work, specifically verify:

- Invoice lines remain linked to the correct PO.
- Unaccounted units still produce the expected confirmation.
- Planned allocations do not exceed shipped units.
- Received locations are preserved.
- Full and partial boxes produce the expected records.
- Raw-line statuses remain consistent after receiving.

## Things Not To Do During the First Pass

- Do not rewrite the entire file into `<script setup>` at the same time.
- Do not rename all existing state variables while moving markup.
- Do not replace `action` with a new API layer before component boundaries are stable.
- Do not change raw-line status semantics during extraction.
- Do not remove legacy box compatibility until old POs have been verified.
- Do not introduce a global store for every piece of dialog state.
- Do not split files solely to satisfy a line-count target.

## Definition Of Done

The separation is successful when:

- `PurchaseOrderView.vue` mostly coordinates the page and selected workflow.
- Each major dialog can be read without scrolling through unrelated workflows.
- Invoice receiving and editing logic can be tested without rendering the entire page.
- Calculations are reusable and unit-testable.
- Realtime and lock behavior have clear ownership and cleanup.
- Child components communicate through props and domain events.
- A developer can modify one workflow without searching through the entire purchase-order feature.
- The application still preserves current purchase-order, invoice, receiving, and legacy-data behavior.
