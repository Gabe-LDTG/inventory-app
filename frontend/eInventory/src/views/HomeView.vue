<template>
  <main class="home-hub">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">eChapps Operations Hub</p>
        <h1>Run The Floor With Clarity</h1>
        <p>
          This page is your command deck: KPI snapshots, workflow visuals, and guided walkthroughs
          for every major process in the app.
        </p>
      </div>
      <div class="mascot-card" aria-label="Company mascot placeholder">
        <div class="mascot-badge">EC</div>
        <h3>eChap</h3>
        <p>
          A polished gentleman of operations: sharp hat, sharper logistics instincts. eChap can host
          rotating tips, status callouts, and quick links to key workflows.
        </p>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Quick metrics">
      <article class="kpi-card">
        <p>Total Purchase Orders</p>
        <h2>{{ purchaseOrders.length }}</h2>
      </article>
      <article class="kpi-card">
        <p>Raw Boxes in Storage</p>
        <h2>{{ productLegend.rawCount }}</h2>
      </article>
      <article class="kpi-card">
        <p>Processed Cases in Storage</p>
        <h2>{{ productLegend.processedCount }}</h2>
      </article>
      <article class="kpi-card">
        <p>Tracked PO Statuses</p>
        <h2>{{ poStatusLegend.length }}</h2>
      </article>
    </section>

    <section class="visual-grid">
      <article class="panel">
        <h3>Raw Boxes vs Processed Cases</h3>
        <div class="pie-wrap">
          <div class="pie" aria-hidden="true" :style="{ background: pieStyle }"></div>
          <ul>
            <li>
              <span class="swatch" style="background: #3b82f6"></span>
              Raw Boxes: {{ productLegend.rawPercent }}% ({{ productLegend.rawCount }})
            </li>
            <li>
              <span class="swatch" style="background: #22c55e"></span>
              Processed Cases: {{ productLegend.processedPercent }}% ({{ productLegend.processedCount }})
            </li>
          </ul>
        </div>
        <p class="panel-note">Use this ratio to monitor conversion pressure and floor balance.</p>
      </article>

      <article class="panel">
        <h3>Purchase Orders By Status</h3>
        <div class="donut-wrap">
          <div class="donut" aria-hidden="true" :style="{ background: donutStyle }"></div>
          <ul>
            <li v-for="status in poStatusLegend" :key="status.key">
              <span class="swatch" :style="{ background: status.color }"></span>
              {{ status.label }}: {{ status.percent }}% ({{ status.count }})
            </li>
          </ul>
        </div>
      </article>
    </section>

    <section class="playbook" aria-label="Process walkthroughs">
      <div class="playbook-heading">
        <h2>Process Walkthroughs</h2>
        <p>Open any process card for a visual guide and step-by-step action plan.</p>
      </div>

      <details v-for="item in walkthroughs" :key="item.routeName" class="playbook-item">
        <summary>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
          </div>
          <span class="caret">View Guide</span>
        </summary>

        <div class="guide-body">
          <!-- <div class="mini-visual" :aria-label="item.visualLabel">
            <span class="node">Plan</span>
            <span class="arrow">→</span>
            <span class="node">Execute</span>
            <span class="arrow">→</span>
            <span class="node">Verify</span>
          </div> -->

          <details class="sub-guide">
            <summary>Create</summary>
            <ol>
              <li v-for="step in item.createSteps" :key="item.routeName + '-create-' + step">{{ step }}</li>
            </ol>
          </details>

          <details class="sub-guide">
            <summary>Edit</summary>
            <ol>
              <li v-for="step in item.editSteps" :key="item.routeName + '-edit-' + step">{{ step }}</li>
            </ol>
          </details>

          <RouterLink class="open-link" :to="{ name: item.routeName }">Open {{ item.title }}</RouterLink>
        </div>
      </details>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { supabase } from '@/clients/supabase';

interface WalkthroughItem {
  title: string;
  routeName: string;
  summary: string;
  visualLabel: string;
  createSteps: string[];
  editSteps: string[];
}

interface StatusConfig {
  key: string;
  label: string;
  color: string;
  aliases: string[];
}

const walkthroughs: WalkthroughItem[] = [
  {
    title: 'Product Keys',
    routeName: 'ProductList',
    summary: 'Create and maintain your catalog so every downstream workflow has clean product data.',
    visualLabel: 'Catalog Setup Flow',
    createSteps: [
      'Add base product info (name, vendor, fnsku/item number).',
      'Confirm units-per-case defaults and processing attributes.',
      'Validate searchability so PO and case pages can resolve the product fast.'
    ],
    editSteps: [
      'Search for the product key by name, fnsku, or item number.',
      'Update pricing, defaults, or vendor mapping fields.',
      'Save and verify downstream pages resolve the updated key correctly.'
    ]
  },
  {
    title: 'Purchase Orders',
    routeName: 'PurchaseOrders',
    summary: 'Plan inbound inventory by vendor and attach line-item recipes for production accuracy.',
    visualLabel: 'Planning Flow',
    createSteps: [
      'Create a purchase order and assign the vendor.',
      'Add line items, quantities, and recipe bindings.',
      'Mark statuses as they move from drafted to received.'
    ],
    editSteps: [
      'Open the purchase order and review current status/line items.',
      'Adjust quantities, notes, or recipe assignments.',
      'Re-save and confirm updates are reflected in receiving workflows.'
    ]
  },
  {
    title: 'Unprocessed Product',
    routeName: 'UnprocessedCases',
    summary: 'Track inbound boxes before conversion so request planning has reliable source stock.',
    visualLabel: 'Receiving Flow',
    createSteps: [
      'Receive boxes against product and purchase order.',
      'Set location and status for floor visibility.',
      'Correct quantity/location in bulk when warehouse data changes.'
    ],
    editSteps: [
      'Open the grouped row to inspect individual boxes.',
      'Select a record and adjust quantity, status, or location.',
      'Save changes and verify grouped totals recalculate correctly.'
    ]
  },
  {
    title: 'Request To Process',
    routeName: 'RequestToProcess',
    summary: 'Convert demand into executable work by matching requests with available unprocessed boxes.',
    visualLabel: 'Request Planning Flow',
    createSteps: [
      'Create a processing request by product and quantity.',
      'Match available source inventory and reserve boxes.',
      'Send approved requests to picklist generation.'
    ],
    editSteps: [
      'Find the request by request ID or product filter.',
      'Adjust quantity, assignment, or reservation linkage.',
      'Save and validate picklist readiness state.'
    ]
  },
  {
    title: 'Picklists',
    routeName: 'Picklists',
    summary: 'Generate actionable floor instructions so work moves consistently from plan to output.',
    visualLabel: 'Execution Flow',
    createSteps: [
      'Group approved requests into a picklist batch.',
      'Assign lanes or staging areas to reduce travel time.',
      'Complete picks and verify used case IDs for traceability.'
    ],
    editSteps: [
      'Open an existing picklist and inspect element assignments.',
      'Update lane/location and line notes as floor conditions change.',
      'Save and confirm all linked requests remain valid.'
    ]
  },
  {
    title: 'Processed Cases',
    routeName: 'ProcessedCases',
    summary: 'Review completed output and status so outbound readiness is always visible.',
    visualLabel: 'Completion Flow',
    createSteps: [
      'Inspect grouped processed cases by product and status.',
      'Edit quantities/locations in controlled batches when needed.',
      'Confirm ready-to-ship totals for fulfillment handoff.'
    ],
    editSteps: [
      'Expand grouped lines to target specific processed cases.',
      'Edit status, location, or quantity corrections as needed.',
      'Save and re-check shipment readiness totals.'
    ]
  }
  /* {
    title: 'Import',
    routeName: 'Import',
    summary: 'Accelerate setup and maintenance with structured imports when data volume is high.',
    visualLabel: 'Data Intake Flow',
    createSteps: [
      'Prepare the template with required column names.',
      'Import into the correct workflow mode (processed vs unprocessed).',
      'Review success/error outputs and rerun only failed records.'
    ],
    editSteps: [
      'Export and adjust records needing correction.',
      'Re-import only corrected rows with matching keys.',
      'Confirm no duplicate or stale rows remain after patch import.'
    ]
  } */
];

const purchaseOrders = ref<Array<{ status: string | null }>>([]);
const rawBoxCount = ref(0);
const processedCaseCount = ref(0);

let poChannel: any = null;
let productChannel: any = null;
let casesChannel: any = null;

const poStatuses: StatusConfig[] = [
  { key: 'draft', label: 'Draft', color: '#94a3b8', aliases: ['draft'] },
  { key: 'submitted', label: 'Submitted', color: '#3b82f6', aliases: ['submitted'] },
  { key: 'ordered', label: 'Ordered', color: '#14b8a6', aliases: ['ordered', 'on order'] },
  { key: 'inbound', label: 'Inbound', color: '#f4c65b', aliases: ['inbound'] },
  {
    key: 'partially-delivered',
    label: 'Partially Delivered',
    color: '#fb923c',
    aliases: ['partially delivered', 'partial delivered']
  },
  { key: 'delivered', label: 'Delivered', color: '#22c55e', aliases: ['delivered', 'received'] }
];

const normalize = (value: string | null | undefined): string => (value || '').trim().toLowerCase();

const poStatusLegend = computed(() => {
  const counts = poStatuses.map((status) => ({ ...status, count: 0 }));

  purchaseOrders.value.forEach((po) => {
    const statusValue = normalize(po.status);
    const match = counts.find((status) => status.aliases.some((alias) => alias === statusValue));
    if (match) {
      match.count += 1;
    }
  });

  const total = counts.reduce((sum, status) => sum + status.count, 0);
  return counts.map((status) => ({
    ...status,
    percent: total > 0 ? Math.round((status.count / total) * 100) : 0
  }));
});

const donutStyle = computed(() => {
  const segments = poStatusLegend.value;
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  if (total === 0) {
    return 'conic-gradient(#cbd5e1 0 100%)';
  }

  let cursor = 0;
  const gradientParts = segments
    .filter((segment) => segment.percent > 0)
    .map((segment) => {
      const start = cursor;
      const end = cursor + segment.percent;
      cursor = end;
      return `${segment.color} ${start}% ${end}%`;
    });

  if (cursor < 100) {
    gradientParts.push(`#22c55e ${cursor}% 100%`);
  }

  return `conic-gradient(${gradientParts.join(', ')})`;
});

const productLegend = computed(() => {
  const rawCount = rawBoxCount.value;
  const processedCount = processedCaseCount.value;
  const total = rawCount + processedCount;

  return {
    rawCount,
    processedCount,
    rawPercent: total > 0 ? Math.round((rawCount / total) * 100) : 0,
    processedPercent: total > 0 ? Math.round((processedCount / total) * 100) : 0,
    total
  };
});

const pieStyle = computed(() => {
  const { rawPercent, total } = productLegend.value;
  if (total === 0) {
    return 'conic-gradient(#cbd5e1 0 100%)';
  }
  return `conic-gradient(#3b82f6 0 ${rawPercent}%, #22c55e ${rawPercent}% 100%)`;
});

const fetchPurchaseOrders = async () => {
  const { data, error } = await supabase.from('purchase_orders').select('status');
  if (error) {
    console.error('Error loading purchase order statuses:', error);
    return;
  }
  purchaseOrders.value = data || [];
};

const fetchCaseMix = async () => {
  const [rawResult, processedResult] = await Promise.all([
    supabase.rpc('get_cases_by_type', { processed: false }),
    supabase.rpc('get_cases_by_type', { processed: true })
  ]);

  if (rawResult.error) {
    console.error('Error loading raw boxes for home chart:', rawResult.error);
  }
  if (processedResult.error) {
    console.error('Error loading processed cases for home chart:', processedResult.error);
  }

  rawBoxCount.value = (rawResult.data || []).length;
  processedCaseCount.value = (processedResult.data || []).length;
};

const refreshDashboardData = async () => {
  await Promise.all([fetchPurchaseOrders(), fetchCaseMix()]);
};

onMounted(async () => {
  await refreshDashboardData();

  poChannel = supabase
    .channel('home-po-status-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
      void fetchPurchaseOrders();
    })
    .subscribe();

  productChannel = supabase
    .channel('home-products-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      void fetchCaseMix();
    })
    .subscribe();

  casesChannel = supabase
    .channel('home-cases-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
      void fetchCaseMix();
    })
    .subscribe();
});

onUnmounted(() => {
  if (poChannel) {
    void supabase.removeChannel(poChannel);
  }
  if (productChannel) {
    void supabase.removeChannel(productChannel);
  }
  if (casesChannel) {
    void supabase.removeChannel(casesChannel);
  }
});
</script>

<style scoped>
.home-hub {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem;
  color: #163247;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.hero-copy,
.mascot-card,
.kpi-card,
.panel,
.playbook-item {
  border: 1px solid #d5e3ef;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%);
}

.hero-copy {
  padding: 1.1rem 1.2rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #366281;
  font-weight: 700;
}

.hero-copy h1 {
  margin: 0.35rem 0 0.55rem;
  font-size: 2rem;
  color: #12324b;
}

.hero-copy p {
  margin: 0;
  line-height: 1.45;
}

.mascot-card {
  padding: 1rem;
  background: linear-gradient(145deg, #e9fff3 0%, #f4fffb 55%, #e6f4ff 100%);
}

.mascot-badge {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #0f5130;
  font-weight: 800;
  background: linear-gradient(160deg, #98e2b8 0%, #60c58f 100%);
  box-shadow: 0 8px 18px rgba(24, 124, 73, 0.22);
}

.mascot-card h3 {
  margin: 0.6rem 0 0.3rem;
}

.mascot-card p {
  margin: 0;
  line-height: 1.4;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-card {
  padding: 0.85rem 0.95rem;
}

.kpi-card p {
  margin: 0;
  font-size: 0.84rem;
  color: #36556f;
}

.kpi-card h2 {
  margin: 0.35rem 0 0;
  font-size: 1.7rem;
}

.visual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.panel {
  padding: 0.95rem;
}

.panel h3 {
  margin: 0 0 0.55rem;
}

.pie-wrap,
.donut-wrap {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.pie {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}

.panel-note {
  margin: 0.55rem 0 0;
  color: #36556f;
}

.donut {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  position: relative;
}

.donut::after {
  content: '';
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: #ffffff;
}

.donut-wrap ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 0.35rem;
}

.playbook {
  display: grid;
  gap: 0.65rem;
}

.playbook-heading h2 {
  margin: 0;
  color: #69c595;
}

.playbook-heading p {
  margin: 0.2rem 0 0;
  color: #7bcfa1;
}

.playbook-item {
  overflow: hidden;
}

.playbook-item summary {
  cursor: pointer;
  list-style: none;
  padding: 0.85rem 0.95rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  background: linear-gradient(180deg, #f5fff9 0%, #ecf9f1 100%);
}

.playbook-item summary::-webkit-details-marker {
  display: none;
}

.playbook-item h3 {
  margin: 0;
  color: #69c595;
}

.playbook-item p {
  margin: 0.2rem 0 0;
  color: #2f5144;
}

.caret {
  font-size: 0.84rem;
  font-weight: 700;
  color: #1e6a42;
}

.guide-body {
  border-top: 1px solid #d7e5f1;
  padding: 0.85rem 0.95rem 1rem;
  background: #fbfffd;
  color: #29463b;
}

.mini-visual {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.node {
  background: linear-gradient(180deg, #e8f7ee 0%, #d6efdf 100%);
  border: 1px solid #afd7be;
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.arrow {
  color: #2f5572;
}

.guide-body ol {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
}

.sub-guide {
  border: 1px solid #d8e6f1;
  border-radius: 10px;
  margin-bottom: 0.55rem;
  background: #f6fdf9;
}

.sub-guide summary {
  cursor: pointer;
  padding: 0.5rem 0.65rem;
  font-weight: 700;
  color: #2b5a47;
}

.sub-guide ol {
  padding: 0 1.25rem 0.65rem;
}

.sub-guide li {
  color: #2b4a3d;
}

.open-link {
  display: inline-block;
  margin-top: 0.7rem;
  text-decoration: none;
  font-weight: 700;
  color: #18653d;
}

.open-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .hero,
  .kpi-grid,
  .visual-grid {
    grid-template-columns: 1fr;
  }
}
</style>