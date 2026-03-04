### AI Refactoring Notes (2-27-2026)
#### High‑level areas to optimise
##### 1. 🔍 Huge monolithic component

- One file contains everything – data, 150+ methods, dialogs, tables, business logic and two different search/scroll implementations.
- Re‑rendering this entire component on almost any data change is expensive. Split into smaller child components (purchase‑order list, PO editor, box/case tables, etc.) and use props/events to avoid passing the entire state around.

##### 2. Repeated array scans / O(n²) loops

- Many methods call this.uBoxes.filter(...) or .find(...) inside another loop (e.g. calculatePoCostTotal, displayRawInfo, getPoolNew, getCreatedCostTotal, alocateBoxCalculation, …).

  - Build maps keyed by product_id/purchase_order_id once and reuse them.
  - Alternatively use .reduce to accumulate, avoid creating intermediate arrays.
- Example at line 1541 ff:

  → Filtering on every call can be cached when the PO is loaded.

##### 3. Unnecessary deep watchers and synchronous saves

- You already debounce lazySave in created() which is good, but the watcher

- still fires for every property change. Consider watching a small subset or using computed properties/watchEffect with a manual trigger.

##### 4. Search / filtering logic in the component

- searchRecipes, searchRecipesEdit, onRawProductAutoCompleteSelect, etc. all perform local array filtering and assign to filteredRecipes. These run on each keystroke without debounce.
- Move the filtering into a composable or use a debounced input (see previous answer).
##### 5. Massive console.log() usage

- There are hundreds of console.log calls, many inside loops. They slow down the UI and clutter the console. Remove or gate them behind a debug flag.
##### 6. Data loading strategy

- initVariables() fetches everything at mount – vendors, products, recipes, purchase orders, boxes, cases… irrespective of whether the user will need all of it.
- Consider lazy‑loading data when the user opens a dialog or switches tabs; load “on demand” and cache results.
##### 7. No use of computed properties

- Many derived values (totals, grouped arrays, vendor names) are recalculated manually in methods. Using computed with caching will avoid recomputation unless inputs change.
##### 8. Mixed responsibility and business logic

- Financial calculations, recipe math, allocation algorithms, cost summing, etc. are all inside the view. Move them out into service functions or Vuex/Pinia actions.
- This not only improves performance (pure functions are easier to memoize) but also makes unit testing easier.
##### 9. Pagination / virtualization missing

- The PO list is rendered fully, even if there are hundreds or thousands. Use PrimeVue’s lazy pagination or a virtual scroller like you already do in ProductList.vue.
#### 🚀 axiosUtils.ts – database layer suggestions
##### 1. Inefficient getProductsLazy

- You first pull all rows to figure out the count, then re‑query a buffered range.
- “SUPABASE COUNT QUERY NOT WORKING”

- Fix the count query by using .select('*', { count:'exact', head:true }) (as you do elsewhere) or maintain a materialized count in the DB.
- Remove the buffering hack – it defeats the purpose of lazy loading and downloads tens of thousands of records.
##### 1.Duplicated filter code

- Sorting and filtering logic (handled by filter_column & filter_data) is copy‑pasted in every get… function.
- Extract a helper that accepts a query and applies the clauses once.
##### 1.Console‑heavy RPC wrappers

Every RPC call logs the input and the entire result. Trim these or add a debug flag; serialising large arrays slows the network thread.
##### 1.Inefficient recipe/element array building

- In addProduct/editProduct you iterate recipe_elements twice to build element_array and then again to build recipe_2Darray.
- Build both in a single pass or move this preparation outside of the network layer.
##### 1.Missing error handling / retries

- Several methods swallow errors and return empty arrays. You may be fetching records repeatedly because the first call fails silently.
##### 1.Bulk operations could be batched

- When adding or editing purchase orders you likely perform a dozen separate RPCs. Consider designing batch endpoints that accept multiple records in one call.
#### ✅ Quick wins
##### 1. Debounce search inputs (you’ve already implemented for PO save).
##### 2. Cache filtered/ grouped results with computed and map lookups.
##### 3. Remove console logs before production.
##### 4. Split the giant component into focused sub‑components and move helper logic to separate utilities.
##### 5. Fix getProductsLazy and reuse getProductsPage/getProductsCount patterns.
##### 6. Replace repetitive filtering with pre‑computed maps or dictionary lookups.
#### ✨ Planning V2
##### 1. Data layer: keep all Supabase/RPC calls in axiosUtils (or better yet, a typed service).
##### 2. State management: use Pinia/Vuex for shared state (products, vendors, recipes).
##### 3. Composition API: turn large methods into reusable composables (usePurchaseOrders, useRecipes, etc.).
##### 4. TypeScript interfaces for all entities – eliminates casting to any and helps with performance when compiled.
This should give you a roadmap for incremental improvements now, and a solid foundation for the overhaul you clearly have in mind. Happy refactoring!