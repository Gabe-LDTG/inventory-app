<template>
<div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <!-- <template #start>
                    <Button label="New PO" icon="pi pi-plus" severity="success" class="mr-2" @click="vendorSelect()" />
                 </template> -->

            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" 
                dataKey="purchase_order_id"
                :paginator="true" 
                :rows="rowsPerPage" 
                :totalRecords="totalRecords"
                :lazy="true"
                selectionMode="single"
                :selectAll="false"
                removableSort
                style="min-width: 1000px"
                showGridlines
                stripedRows
                scrollable 
                scrollHeight="800px"
                :style="{ fontSize: (15 * tableZoom) + 'px', zoom: tableZoom, width: '100%'}"
                :loading="loading"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Purchase Orders</h4>
                        <ZoomDropdown v-model="tableZoom" />
                        <span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="searchText" placeholder="Search..." />
                        </span>
                    </div>
                </template>

                <template #loading> Loading purchase orders. Please wait. </template>

                <template #empty> No purchase orders found. </template>

                <Column expander header="Order Info" style="width: 5rem" />

                <Column field="purchase_order_name" header="Purchase Order" sortable></Column>

                <!-- <Column field="status" header="Status" sortable>
                    <template #body="slotProps">
                        <div class="card flex flex-wrap  gap-2">
                            <Tag :value="slotProps.data.status" :severity="getPOSeverity(slotProps.data)" :icon="getPOIcon(slotProps.data)" iconPos="right"/>
                        </div>
                    </template>
                </Column> -->

                <!-- <Column header="Vendor" sortable>
                    <template #body={data}>
                        {{ getVendor(data.vendor_id) }}
                    </template>
                </Column> -->

                <Column field="notes" header="Notes" sortable />

                <Column field="date_ordered" header="Date Ordered" sortable />

                <Column field="date_received" header="Date Received" sortable />

                <!-- <Column header="Total Units">
                    <template #body="{data}">
                        {{ getCreatedUnitTotal(data.purchase_order_id) }}
                    </template>
                </Column> -->

                <!-- <Column header="Total Cost">
                    <template #body="{data}">
                        {{ formatCurrency(getCreatedCostTotal(data.purchase_order_id, data.discount)) }}
                    </template>
                </Column> -->

                <!-- <Column header="Edit PO" :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" v-tooltip.top="'Edit PO'" :disabled="slotProps.data.status === ''" rounded class="mr-2" @click="editPurchaseOrder(slotProps.data)" />
                    </template>
                </Column> -->

            </DataTable>
        </div>
</template>

<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils";
import importAction from "../components/utils/importUtils";
import {ref, reactive, onMounted, nextTick } from 'vue'

import InputNumber from 'primevue/inputnumber';
import { debounce, keys } from 'lodash';

import ZoomDropdown from '@/components/ZoomDropdown.vue';
import ProductAutoComplete from '@/components/ProductAutoComplete.vue';
import { table } from 'console';

// VARIABLES
// PURCHASE ORDER
const purchaseOrders = ref([] as any[]);
const purchaseOrder = ref({} as any);
const selectedPurchaseOrder = ref([] as any[]);
const editingRows = ref([] as any[]);
const rawEditingRows = ref([] as any[]);
const recipeEditingRows = ref([] as any[]);
const rawOrderType = ref(['By Box', 'By Unit']);
const selectedOrderType = ref("");
const newStatus = ref("");
const headerData = ref({ name: '', vendor_id: 0, status: '', notes: '', discount: 0, date_ordered: null, date_received: null});

// PRODUCTS
const products = ref([] as any[]);
const unprocProducts = ref([] as any[]);
const procProducts = ref([] as any[]);
const product = ref({} as any);
const selectedProducts = ref([] as any[]);
const totalErrorMSG = ref("");
const filteredProducts = ref([] as any[]);

// VENDORS
const vendors = ref([] as any[]);
const vendorDialog = ref(false);
const vendorSubmitted = ref(false);

// CASES
const cases = ref([] as any[]);
const uBoxes = ref([] as any[]);
const pCases = ref([] as any[]);
const poCases = ref([] as any[]);
const poCasesEdit = ref({} as any);
const poBoxes = ref([] as any[]);
const reqPoBoxes = ref([] as any[]);
const editedLine = ref({} as any);
const amount = ref(1);
const displayStatus = ref("");
const delivered = ref([] as any[]);
const boxesToDelete = ref([] as any[]);
const inboundBoxes = ref([] as any[]);

// LOCATIONS
const locations = ref([] as any[]);
const locationToCreate = ref({} as any);
const locationDialog = ref(false);
const additionalLocationDialog = ref(false);
const receivedLocationsArray = ref([] as any);
const specificProductReceivedLocArray = ref([] as any[]);

// RECIPES
const recipes = ref([] as any[]);
const displayRecipes = ref([] as any[]);
const recipeArray = ref([] as any[]);
const recipeArrayEdit = ref({} as any);
const recipeElements = ref([] as any[]);
const displayRecipeElements = ref([] as any[]);
const detailedRecipes = ref([] as any[]);
const poRecipes = ref([] as any[]);
const singlePoRecipes = ref([] as any[]);
const filteredRecipes = ref([] as any[]);
const filteredRecipesEdit = ref([] as any[]);
const newPORecipe = ref({} as any);

// MISC
const tableZoom = ref(1);
const today = ref("");
const loading = ref(false);
const statuses = ref([
    'Draft',
    'Submitted',
    'Ordered',
    'Inbound',
    'Partially Delivered',
    'Delivered',
]);
const searchText = ref('');
const currentPage = ref(1);
const rowsPerPage = ref(25);
const totalRecords = ref(0);
const dt = ref<HTMLElement | null>(null);

// MISSING DEFAULT UNITS DIALOG
const missingDefaultUnitsDialog = ref(false);
const missingDefaults = ref([] as Array<{ product_id: number; name: string; item_num: string; default_units_per_case: number | null }>);
const missingDefaultsRecipeIndex = ref(null as number | null);


// DIALOGS
const purchaseOrderDialog = ref(false);
const cancelOrderDialog = ref(false);
const editPurchaseOrderDialog = ref(false);
const newPurchaseOrderProductDialog = ref(false);
const statusChangeDialog = ref(false);
const inboundPurchaseOrderDialog = ref(false);
const receivedDialog = ref(false);

onMounted(async () => {
    await loadPage(1);  
});

async function loadPage(page: number) {
    try {
        loading.value = true;

        // Get total count (for paginator) and current page rows in parallel
        const [total, rows] = await Promise.all([
            action.getPurchaseOrdersCount(searchText.value || ''),
            action.getPurchaseOrdersPage(
                page,
                rowsPerPage.value,
                searchText.value || ''
            )
        ]);

        const test = await action.getPurchaseOrdersPageV2(
            page,
            rowsPerPage.value,
            searchText.value || ''
        );

        console.log("TESTING PAGINATION V2: ", test);

        totalRecords.value = total;

        /**@TODO Potentially optimize this by only loading vendors relevant to the current page. Was deemed not yet necessary as of 3/5/2026 */
        // Attach vendor_name etc. the same way you do in getProducts()
        rows.forEach(p => {
            const vendor = vendors.value.find(v => p['vendor_id'] == v['vendor_id']);
            if (vendor) p['vendor_name'] = vendor['vendor_name'];
        });

        purchaseOrders.value = rows;
        currentPage.value = page;
        

        purchaseOrders.value.forEach(po => {
            if(po.date_ordered)
                po.date_ordered = po.date_ordered.split('T')[0];
            if(po.date_received)
                po.date_received = po.date_received.split('T')[0];
        });
        
        const poIds: number[] = purchaseOrders.value.map(po => po.purchase_order_id);
        
        const pageRecipes = await action.getRecipesAndElementsForPOs(poIds);
        displayRecipes.value = pageRecipes.recipes;
        displayRecipeElements.value = pageRecipes.elements;
        poRecipes.value = await action.getPurchaseOrderRecipesForPOPage(poIds);
        uBoxes.value = await action.getUnprocCasesForPOPage(poIds);
        pCases.value = await action.getProcrocCasesForPOPage(poIds);
        // await action.getRecipesAndElementsForPOs(poIds);

        console.log("BOXES: ", uBoxes.value);
        console.log("CASES: ", pCases.value);

        // Reset scroll position to top after new page data loads
        /* nextTick(() => {
            const dtElement = dt.value;
            console.log("DataTable element: ", dtElement);
            
            // Find the scrollable table, then scroll its parent wrapper
            if(dtElement) {
                const scrollableTable = dtElement.value?.querySelector('.p-datatable-scrollable-table');

                if (scrollableTable) {
                    // The wrapper is usually 2-3 parents up
                    let scrollableWrapper = scrollableTable.parentElement;
                    if (scrollableWrapper && scrollableWrapper.scrollHeight > scrollableWrapper.clientHeight) {
                        scrollableWrapper.scrollTop = 0;
                    }
                }
            }
            
            
        }); */
    } catch (e) {
        console.error(e);
    }
    finally {
        loading.value = false;
    }
};

function onPage(event: any) {
    // PrimeVue gives 0-based page index
    const newPage = event.page + 1;
    rowsPerPage.value = event.rows;
    loadPage(newPage);
};


</script>

<style>

</style>

