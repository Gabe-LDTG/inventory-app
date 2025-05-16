<template>
    <div>
        <DataTable :value="picklists" showGridlines stripedRows>
            <template #header>
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h4 class="m-0">Picklists</h4>
                    <Button rounded @click="openPicklist">Add Picklist</Button>
                </div>
            </template>
            <template #loading>Loading picklists. Please wait.</template>
            <template #empty>No picklists found.</template>

        </DataTable>

        <Dialog v-model:visible="picklistDialog" header="Picklist Info">
            <div>
                <DataTable v-model:selection="selectedRequests" :value="requests" stripedRows 
                selectionMode="multiple" :metaKeySelection="false" dataKey="request_id"
                :selectAll="false" removableSort
                v-model:filters="picklistFilters" filterDisplay="row"
                scrollable scrollHeight="800px" >
                    <template #header class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                            <Dropdown v-model="requestType" :options="requestQtyType" placeholder="Select a picklist type"/>
                        </div>
                    </template>
                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="product_name" header="Bundle Name" sortable>
                        <template #body="{data}">
                            {{ data.product_name }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Search by name"/>
                        </template>
                    </Column>
                    <Column field="ship_to_amz" header="Ship to Amz"></Column>
                    <Column field="warehouse_qty" header="Warehouse"></Column>
                    <Column header="Total Cases">
                        <template #body="{ data }">
                            {{ data.ship_to_amz + data.warehouse_qty }}
                        </template>
                    </Column>
                    <Column field="default_units_per_case" header="Units per Case"></Column>
                    <Column field="notes" header="Notes"></Column>
                    <Column field="status" header="Status" :showFilterMenu="false" sortable>
                        <template #body="{ data }">
                            <Tag :style="helper.statusStyle(data.status)">{{ data.status }}</Tag>
                        </template>
                        <template #filter="{ filterModel, filterCallback}">
                            <MultiSelect v-model="filterModel.value" @change="filterCallback()" :options="requestStatuses" 
                            placeholder="Filter Status" :maxSelectedLabels="1"/>
                        </template>
                    </Column>
                    <Column field="reqPriority" header="Priority" sortable>
                        <template #body="{data}">
                        <Tag :style="helper.priorityStyle(data.reqPriority)">{{ data.reqPriority }}</Tag>
                    </template>
                    </Column>
                    <Column field="deadline" header="Deadline" sortable>
                        <template #body="{data}">
                            <!-- {{ data.deadline }} -->
                            {{ helper.formatDateTS(data.deadline) }}
                        </template>
                    </Column>
                    <Column field="purchase_order_name" header="PO #" sortable></Column>
                    <Column field="fnsku" header="FNSKU"></Column>
                    <Column field="asin" header="ASIN"></Column>
                </DataTable>
            </div>
            <div>

            </div>
            <template #footer>
                <Button class="flex flex-start" label="Cancel" icon="pi pi-times" @click="picklistDialog = false"/>
                <Button class="flex flex-end" label="Create" @click="generatePicklist" />
            </template>
        </Dialog>
    </div>
</template>
<script setup lang="ts">
/**
 * This page exists so that users may create picklists based on user selected requests to process. This picklists
 * will show the viewer where the raw products are that must be picked, organized by processed product, and where
 * in FBA prep to place the pallets. When creating a picklist based on request, the user can choose to pick only 
 * cases being shipped, only cases being stored, or both. 
 * 
 *  
 * _____________________________________________________________________________________________________________________
 * Improvements: 
 * - Allow the user to select three different ways to pick raw product: linked to a PO, unlinked/pool, mixed.
 * - Consistent naming convention: [5-13-25-01]
 * 
 * _____________________________________________________________________________________________________________________
 * Found Issues: 
 * 
 * _____________________________________________________________________________________________________________________
 */
import { ref, onMounted } from "vue";
import action from "@/components/utils/axiosUtils";
import helper from "@/components/utils/helperUtils";
import { FilterMatchMode } from "primevue/api";
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";

// PICKLIST VARIABLES___________________________________________________________________________________________________
const picklistDialog = ref(false);
const picklists = ref();
const picklist = ref();
const picklistFilters = ref({
    product_name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    status: {value: null, matchMode: FilterMatchMode.IN}
});
const requestQtyType = ref(['All', 'Store Only', 'Ship Only'])
const requestType = ref('All');

// REQUEST VARIABLES____________________________________________________________________________________________________
const requests = ref();
const selectedRequests = ref();
const request = ref();
const requestStatuses = ref(['1 WORKING', '1.25 PICKED', '1.5 PICKLIST',
                            '2 READY', '3 AWAITING PLAN', '4 INBOUND', '5 ON ORDER',
                            '6 ISSUE', '7 FLAGGED']);

// PRODUCT VARIABLES____________________________________________________________________________________________________
const products = ref();

// BOX VARIABLES________________________________________________________________________________________________________
const boxes = ref();

// LOCATION VARIABLES___________________________________________________________________________________________________
const locations = ref();

// PURCHASE ORDER VARIABLES_____________________________________________________________________________________________
const purchaseOrders = ref();


//______________________________________________________________________________________________________________________

onMounted(() => {
    initVariables();
});

/**
 * Initializes all required variables for the page
 * 
 * Created By: Gabe de la Torre-Garcia On: 5-13-25
 * Last Edited: 
 */
async function initVariables(){
    try {
        await getRequests();
        await getBoxes();
    } catch (error) {
        console.error(error);
    }
};

// Grab all products
async function getProducts(){
    try {
        products.value = await action.getProducts();
    } catch (error) {
        console.error(error);
    }
};

// Grab all boxes
async function getBoxes(){
    try {
        boxes.value = await action.getRequestedBoxes();
    } catch (error) {
        console.error(error);
    }
};

// Grab all purchase orders
async function getPurchaseOrders(){
    try {
        purchaseOrders.value = await action.getPurchaseOrders();
    } catch (error) {
        console.error(error);
    }
};

// Grab all purchase order recipes
async function getPORecipes(){
    try {
        
    } catch (error) {
        console.error(error);
    }
};

// Grab all locations
async function getLocations(){
    try {
        locations.value = await action.getLocations();
    } catch (error) {
        console.error(error);
    }
};

// Grab all requests to process
async function getRequests(){
    try {
        requests.value = await action.getRequestsForPick();
        console.log("Requests", requests.value);
    } catch (error) {
        console.error(error);
    }
};

/**
 * Opens the picklist Dialog and initializes required variables. 
 * 
 * Created By: Gabe de la Torre-Garcia On: 5-13-25
 * Last Edited: 
 */
function openPicklist(){
    picklistDialog.value = true;
};

function generatePicklist(){
    selectedRequests.value.forEach((request: any) => {
        console.log(request);
        let amount = 0;

        if(requestType.value === 'Ship Only')
            amount = request.ship_to_amz;
        else if(requestType.value === 'Store Only')
            amount = request.warehouse_qty;
        else 
            amount = request.ship_to_amz + request.warehouse_qty;

        
    })
};

</script>
<style lang="">
    
</style>