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

          <details class="sub-guide" open>
            <summary>General Details</summary>
            <ul class="general-list">
              <li
                v-for="(step, stepIndex) in item.generalDetails"
                :key="item.routeName + '-general-' + stepIndex"
              >
                <span>{{ getStepText(step) }}</span>
                <ul v-if="getSubsteps(step).length" class="substep-list">
                  <li
                    v-for="(substep, subIndex) in getSubsteps(step)"
                    :key="item.routeName + '-general-sub-' + stepIndex + '-' + subIndex"
                  >
                    {{ substep }}
                  </li>
                </ul>
              </li>
            </ul>
          </details>

          <details class="sub-guide">
            <summary>Create</summary>
            <ol>
              <li
                v-for="(step, stepIndex) in item.createSteps"
                :key="item.routeName + '-create-' + stepIndex"
              >
                <span>{{ getStepText(step) }}</span>
                <ul v-if="getSubsteps(step).length" class="substep-list">
                  <li
                    v-for="(substep, subIndex) in getSubsteps(step)"
                    :key="item.routeName + '-create-sub-' + stepIndex + '-' + subIndex"
                  >
                    {{ substep }}
                  </li>
                </ul>
              </li>
            </ol>
          </details>

          <details class="sub-guide">
            <summary>Edit</summary>
            <ol>
              <li
                v-for="(step, stepIndex) in item.editSteps"
                :key="item.routeName + '-edit-' + stepIndex"
              >
                <span>{{ getStepText(step) }}</span>
                <ul v-if="getSubsteps(step).length" class="substep-list">
                  <li
                    v-for="(substep, subIndex) in getSubsteps(step)"
                    :key="item.routeName + '-edit-sub-' + stepIndex + '-' + subIndex"
                  >
                    {{ substep }}
                  </li>
                </ul>
              </li>
            </ol>
          </details>

          <details v-if="item.receivingSteps && item.receivingSteps.length" class="sub-guide">
            <summary>Receiving</summary>
            <ol>
              <li
                v-for="(step, stepIndex) in item.receivingSteps"
                :key="item.routeName + '-receiving-' + stepIndex"
              >
                <span>{{ getStepText(step) }}</span>
                <ul v-if="getSubsteps(step).length" class="substep-list">
                  <li
                    v-for="(substep, subIndex) in getSubsteps(step)"
                    :key="item.routeName + '-receiving-sub-' + stepIndex + '-' + subIndex"
                  >
                    {{ substep }}
                  </li>
                </ul>
              </li>
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
  generalDetails: WalkthroughStep[];
  createSteps: WalkthroughStep[];
  editSteps: WalkthroughStep[];
  receivingSteps?: WalkthroughStep[];
}

type WalkthroughStep =
  | string
  | {
      text: string;
      substeps?: string[];
    };

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
    summary: 'All processed and unprocessed product keys, with info on pricing, unit counts, vendors, etc.',
    visualLabel: 'Catalog Setup Flow',
    generalDetails: [
      'By default, both processed and unprocessed products are displayed in the product key list, but users can filter by product type using the buttons in the top right corner of the page.',
      'A recipe dropdown exists for processed products that shows the raw product requirements for that processed product. If a product is raw, the dropdown will say "No recipe - item is raw".',
    ],
    createSteps: [
      'Click the "New" button in the top right corner of the table',
      {
        text: 'Add base product info (name, vendor, fnsku/item number).',
        substeps: [
          "Currently, the system tracks processed products with FNSKU and ASIN, any product missing these is considered unprocessed.",
          "A user is able to add FNSKU and ASIN at any time to convert an unprocessed product to a processed one.",
          "SOON: We will add a required field to designate product type as 'processed' vs 'unprocessed' to remove ambiguity and tracking issues around missing identifiers."
        ]
      },
      {
        text: 'Confirm units-per-case defaults and processing attributes.',
        substeps: [
          "Certain fields, such as 'Box Cost', autofill based on linked fields(e.g. 'Box Type').",
          "These autofilled fields can be overwritten, and are set up simply for convenience."
        ]
      },
      {
        text: 'For processed products, an additional window appears at the bottom of the form to create the processing recipe.',
        substeps: [
          "Each product needed box in the recipe list will ask for a raw product, and the quantiy of raw units needed for one processed unit.",
          "For multipacks, simply click 'Add another product' to add the additional raw product types. Users can click the red 'X' in the corneer of the product box to remove that product from the recipe.",
          "e.g. 1 unit of 'Blokus/Clue/Monopoly 3pk' requires 1 unit of 'Blokus' and 1 unit of 'Clue' and 1 unit of 'Monopoly'.",

        ]
      },
      
      'Click "Save" at the bottom of the form and the new product key will be added to the list.'
    ],
    editSteps: [
      'On the line for the product you want to edit, click the little green pencil icon. If confused, hovering over the icon will display a tooltip that says "Edit this product".',
      'Update whichever field(s) need changes.',
      'Click the save button at the bottom of the form to save changes.'
    ]
  },
  {
    title: 'Purchase Orders',
    routeName: 'PurchaseOrders',
    summary: 'Purchase orders, containing details on planned cases, inbound product, and pricing.',
    visualLabel: 'Planning Flow',
    generalDetails: [
      {
        text: 'On the main list, users can click the dropdown in the "Order Info" column to see products displayed either by planned cases or the raw product list.',
        substeps: [
          "The 'Processed' button displays planned cases, with an additional dropdown for the raw boxes specifically linked to said case(s). It also displays a separate list containing all raw products in the Purchase Order that are not linked to a specific plan.",
          "The 'Unprocessed' button displays a much simpler list of all raw products in the Purchase Order separated by product type, units per box, location, notes, and status. The products are highlighted by statues to make distinction easier (blue for not arrived, yellow for back ordered, red for canceled, green for ready)."
        ]
      },
        { 
          text: 'Users can change which phase the Purchase Order is in by clicking on of the phases in the "PO Phase" column.',
          substeps: [
            'NOTE: Soon, inbounding will be a more involved process that will create invoices linked to the Purchase Order.'
          ]
        }
    ], 
    createSteps: [
      'Click the "New PO" button in the top right corner of the table. This opens the vendor select form.',
      {
        text: 'Assign the vendor using the dropdown.',
        substeps: [
          "If the vendor does not have a nickname yet, a follow-up dialog appears so you can add the vendor's nickname before continuing.",
          "This nickname will be used as the vendor code for autonaming the PO (e.g. Aurora nickname is AU).",
          "The autofilled name can be edited if needed before saving the PO."
        ]
      },
      'Fill out any/all relevant fields, such as the current status, discounts, notes, etc.',
      {
        text: 'Add all cases planned to be created using this order. For each case, specify the product, quantity, and how many cases should be made.',
        substeps: [
          "When a processed product is selected, a table will open that shows the user the raw products required to complete the desired quantity of processed units.",
          "The table includes important details, like total units needed, total units ordered (in case needed units doesn't evenly divide into default box quantity), and total price of ordering all raw units."
        ]
      }, 
      {
        text: 'If raw products are needed that are not linked to a current plan, the user can add them at the bottom of the form by selecting how they would like to order said products: by box or by unit.',
        substeps: [
          "If ordering by box, the user can select product type, how many boxes to order, and add any notes to the boxes. The system will then display the total number of units ordered and the total price.",
          "If ordering by unit, the user selects the product type, how many units to order, and adds any notes. The system will then calculate how many boxes are needed to fulfill the unit order (rounding up to ensure based on default box quantities) and display that number of boxes along with the total price."
        ]
      },
      'Click "Save" at the bottom of the form and the new purchase order will be added to the list.'
    ],
    editSteps: [
      'On the line of the desired Purchase Order, click the "Edit" button.',
      {
        text: 'This opens a form where the user can edit all PO fields, with the exception of vendor',
        substeps: [
          'The edit form will autosave, so there is no need to click a save button. A small icon in the bottom right of the form will notify users that the edits have been saved.',
          'When a user edits raw boxes and lowers the unit quantity to an amount that makes the planned cases impossible (e.g. setting total raw Monopoly units to 120, even though there is a planned case for 144), the system will flag the planned case and notify the user to either update the planned unit amount or add more raw products to the order. ',
          'NOTE: This edit form, will soon undergo changes, including more streamlined/clean performance, and the ability to add new planned cases to Purchase Orders that have already been created.'
        ]
      },
      'Re-save and confirm updates are reflected in receiving workflows.'
    ], 
    receivingSteps: [
      'Currently, receiving products begins with selecting the "Delivered" button in the "PO Phase" column of the desired Purchase Order Line. This will trigger a dialog box to confirm the delivery.',
      {
        text: 'The form that opens will display the following list, separated by Product type: the requested number of products, the received products, and the products that are still being awaited.',
      },
      {
        text: 'On any awaited product, click the pencil icon at the end of the line. Hovering over it will display a tooltip that says "Inventory newly-received product". This will open another form for receiving boxes.',
      },
      {
        text: 'In this new form, the user can click into any of the cells to edit the total number of boxes and total number of units that have arrived, as well as where they have been stored.',
        substeps: [
          "When the user clicks into the location cell, a '+' button appears that allows users to add new locations if the location where the product is being stored has not yet been added to the inventory. Click it, fill in the form for the new name, and save the new location. Then it can be used for storing.",
          "NOTE: Currently, the system only reads one location to store per round of receiving product. The goal of this receiving form is to add the ability for users to store in multiple locations, should the need arise."
        ]
      },
      'Once the user clicks the save button, the selected quantity of raw product that has been received will change to the status "Newly Arrived"',
      {
        text: 'After all received product has properly been stored and noted, the user will click save, and the system will set all arrived product to ready, and all remaining product to backordered.',
        substeps: [
          "When any amount of raw product arrives that is linked to a planned case, a request to process is automatically generated."
        ] 
      }
    ],
  },
  {
    title: 'Unprocessed Product',
    routeName: 'UnprocessedCases',
    summary: 'Unprocessed product boxes, with details on location, status, and quantities.',
    visualLabel: 'Receiving Flow',
    generalDetails: [
      'The list on this page groups products together by product type and units per box. The "Location(s)" column groups together all pallets where this product is found. To see the boxes separated by location, click the dropdown button in the "Individual Boxes" column.'
    ],
    createSteps: [
      'Click the "New" button in the top right corner of the table.',
      { 
        text: 'Fill in product, quantity, location, and status details for the new box.',
        substeps: [
          "If the box is in a location is new, click the 'Add Location' button to create the new location without leaving the form.",
          "The 'How Many Received?' field determines how many boxes will be added to the inventory."
        ]
      },
      'Click "Save" in the bottom right corner of the form.'
    ],
    editSteps: [
      'Click the dropdown arrow in the "Individual Boxes" column.',
      'Click the green pencil icon on the line of the box you want to edit. For clarity, hovering over the icon will display a tooltip that says "Edit".',
      'Update the fields that need changes, such as quantity, location, or status.',
      'Set the total number of boxes edited with the "How Many to Edit?" field. The default will be all boxes on the line.',
      'Click "Save" in the bottom right corner of the form to apply changes.'
    ]
  },
  {
    title: 'Request To Process',
    routeName: 'RequestToProcess',
    summary: 'Requested cases that still need to be processed, used to track and manage processing requests.',
    visualLabel: 'Request Planning Flow',
    generalDetails: [
      'Until a "Processed Product Page" is created, the "Request to Process" page has a completed status and any request that is completed is hidden by default, but can be view by clicking the "Show Completed Requests" button.'
    ],
    createSteps: [
      'Click the "+ Request" button.',
      'Fill in the desired case product type, how many cases will be shipped to amazon, how many will store, and the unit quantity per case. The "Case QTY" field will auto populate with the default units of a selected product, but can be changed manually for partial boxes.',
      'Click the "Add Request" button to create the request.'
    ],
    editSteps: [
      'Requests can be edited directly from the list by clicking on non bolded cells.',
      'When the user clicks enter, or clicks out of the field they are editing, the request will automatically update and notify the user.'
    ]
  },
  {
    title: 'Picklists',
    routeName: 'Picklists',
    summary: 'Generate picklists of raw product to grab for processing.',
    visualLabel: 'Execution Flow',
    generalDetails: [
      'This page is in very early baby mode :3. Currently it is used to grab raw products needed for fulfilling requests. Eventually, the option to generate raw picklists directly will be added.'
    ],
    createSteps: [
      'Click the "Add Picklist" button.',
      { 
        text: 'Select the requests you would like product picked for.', 
        substeps: [
          "There is a dropdown in the top left corner of the form that allows the user to specify if they want to pick for all cases in the request, or only the cases either shipping or storing."
        ]
      },
      'Click the "Create Picklist " button. (Actually does not work rn alot has changed in the system so sorry will fix <3)'
    ],
    editSteps: [
      'Click directly on the line of the picklist you want to edit.',
      'A form will open with each raw product type, and a summary of total units and all locations, as well as the desired lane location.',
      'A button exists that allows users to expand all products to see each individual location, or collapse all products to only display the summary.',
      'To pick a product, click the "x" button located in the expanded table that separates boxes by location and unit amount. The system automatically updates to display the product as picked.'
    ]
  },
  {
    title: 'Processed Cases',
    routeName: 'ProcessedCases',
    summary: 'Processed cases, with details on status, location, and quantities.',
    visualLabel: 'Completion Flow',
    generalDetails: [
      'The list on this page groups products together by product type and units per box. The "Location(s)" column groups together all pallets where this product is found. To see the cases separated by location, click the dropdown button in the "Individual Cases" column.'
    ],
    createSteps: [
      'Click the "New" button in the top right corner of the table.',
      { 
        text: 'Fill in product, quantity, location, and status details for the new case.',
        substeps: [
          "If the case is in a location is new, click the 'Add Location' button to create the new location without leaving the form.",
          "The 'How Many Processed?' field determines how many cases will be added to the inventory."
        ]
      },
      'Click "Save" in the bottom right corner of the form.'
    ],
    editSteps: [
      'Click the dropdown arrow in the "Individual Cases" column.',
      'Click the green pencil icon on the line of the case you want to edit. For clarity, hovering over the icon will display a tooltip that says "Edit".',
      'Update the fields that need changes, such as quantity, location, or status.',
      'Set the total number of cases edited with the "How Many to Edit?" field. The default will be all cases on the line.',
      'Click "Save" in the bottom right corner of the form to apply changes.'
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

const getStepText = (step: WalkthroughStep): string =>
  typeof step === 'string' ? step : step.text;

const getSubsteps = (step: WalkthroughStep): string[] =>
  typeof step === 'string' ? [] : step.substeps || [];

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

.general-list {
  margin: 0;
  padding: 0 1.25rem 0.65rem;
  list-style: disc;
  display: grid;
  gap: 0.35rem;
}

.sub-guide li {
  color: #2b4a3d;
}

.substep-list {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
  list-style: disc;
}

.substep-list li {
  color: #36556f;
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