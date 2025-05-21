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

        <Dialog v-model:visible="picklistSetupDialog" header="Picklist Setup">
            <div>
                <DataTable v-model:selection="selectedRequests" :value="requests" stripedRows 
                selectionMode="multiple" :metaKeySelection="false" dataKey="request_id"
                :selectAll="false" removableSort
                v-model:filters="picklistFilters" filterDisplay="row"
                scrollable scrollHeight="800px" >
                    <template #header class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                            <Dropdown v-model="picklistType" :options="requestQtyType" placeholder="Select a picklist type"/>
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
                    <Column field="notes" header="Notes"></Column>
                    <Column field="purchase_order_name" header="PO #" sortable></Column>
                    <Column field="fnsku" header="FNSKU"></Column>
                    <Column field="asin" header="ASIN"></Column>
                </DataTable>
            </div>
            <div>

            </div>
            <template #footer>
                <Button class="flex flex-start" label="Cancel" icon="pi pi-times" @click="picklistSetupDialog = false"/>
                <Button class="flex flex-end" label="Create" @click="generatePicklist" />
            </template>
        </Dialog>

        <Dialog v-model:visible="picklistDialog" header="Picklist Info">
            <DataTable :value="picklist" stripedRows 
                removableSort
                scrollable scrollHeight="800px" 
                rowGroupMode="rowspan" groupRowsBy="product_name">
                <Column field="product_name" header="Product Name">
                    <template #body="{data}">
                        {{ data.product_name }} (x{{ data.caseAmount }})
                    </template>
                </Column>
                <Column field="rawProductName" header="Raw Product"></Column>
                <Column field="location_name" header="Location"></Column>
                <Column field="amount" header="Number of Boxes"></Column>
                <Column field="units_per_case" header="Units per Box"></Column>
                <Column field="totalUnits" header="Total Units"></Column>
            </DataTable>
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
const picklistSetupDialog = ref(false);
const picklistDialog = ref(false);
const picklists = ref();
const picklist = ref();
const picklistFilters = ref({
    product_name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    status: {value: null, matchMode: FilterMatchMode.IN}
});
const requestQtyType = ref(['All', 'Store Only', 'Ship Only'])
const picklistType = ref('All');

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

// RECIPE VARIABLES_____________________________________________________________________________________________________
const recipes = ref();
const recipe_elements = ref();


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
        await getRecipes();
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
        boxes.value = await action.getDeliveredBoxes();
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

// Grab all recipes
async function getRecipes(){
    try {
        recipes.value = await action.getRecipes();
        recipe_elements.value = await action.getRecipeElements();
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
    picklistSetupDialog.value = true;
};

/**
 * Generates pick list based on the user selected requests and the input ingredients linked to them.
 * 
 * Created By: Gabe de la Torre-Garcia On: 5-14-25
 * Last Edited: 5-21-25
 */
async function generatePicklist(){
    try {
        // let usedBoxes: [{req: typeof selectedRequests, box: typeof boxes}]; Need to figure out typescript
        const usedBoxes: any[] = [];
        const usedBoxIds: Number[] = [];
        const requestIds = [];
        for(const request of selectedRequests.value){
            console.log("Request: ",request);
            let amount = 0;

            // Set amount of cases worth to pick by the users selected picklist type
            if(picklistType.value === 'Ship Only')
                amount = request.ship_to_amz;
            else if(picklistType.value === 'Store Only')
                amount = request.warehouse_qty;
            else 
                amount = request.ship_to_amz + request.warehouse_qty;

            request.caseAmount = amount;
            const totalOutputUnits = amount*request.default_units_per_case;
            console.log("Total Units for Request: ", totalOutputUnits);

            // Grabs the input recipes and associated boxes 
            const inputAndBoxes = await action.generatePicklistElement(request.recipe_id);
            console.log("Input recipes and Boxes: ", inputAndBoxes);
            console.log("Input elements: ", inputAndBoxes.recipe_elements);

            // Loop through each input element
            for(const element of inputAndBoxes.recipe_elements){
                console.log("Input Product: ", element.products.name);
                // Calculate total input units needed
                const totalInputUnits = totalOutputUnits * element.qty;
                let currentInputUnits = 0;
                console.log('Total Input Units: ',totalInputUnits)
                // Using a for of loop because I need to break and continue
                for (const box of boxes.value) {
                    
                    // If enough units have been grabbed, end loop
                    if(currentInputUnits >= totalInputUnits)
                        break;

                    // If the current box is not the right product type or is already used in the picklist, skip.
                    if(box.product_id !== element.product_id || usedBoxIds.includes(box.case_id) === true)
                        continue;

                    console.log("Current Units: ", currentInputUnits, "Total Inputs: ", totalInputUnits);

                    // console.log("Box: ", box);
                    // If not enough units have been grabbed yet, get another box, linking it to the specific request.
                    if(currentInputUnits < totalInputUnits){
                        
                        usedBoxes.push({req: request, box: box});
                        usedBoxIds.push(box.case_id);
                        currentInputUnits = currentInputUnits + box.units_per_case;
                    }
                }
                console.log("AFTER LOOP: Current Units: ", currentInputUnits, "Total Inputs: ", totalInputUnits);
                console.log("__________________________________________________");
            }
        }
        console.log("All used boxes for Picklist: ", usedBoxes);

        // Group boxes together by qty and request to display on the picklist.
        let sorted = Object.values(usedBoxes.reduce((map, reqBox) => {
            const key = reqBox.req.request_id +':'+ reqBox.box.units_per_case +':'+ reqBox.box.location_id;

            if(map[key]){
                map[key].amount++;
                map[key].totalUnits = map[key].totalUnits + reqBox.box.units_per_case;
                map[key].casesUsed = [...map[key].casesUsed, reqBox.box.case_id];
                /* if(map[key].locations.includes(reqBox.box.location_id) === false)
                    map[key].locations = [...map[key].locations, reqBox.box.location_id]; */
            } else 
                map[key] = { ...reqBox.box, ...reqBox.req, amount: 1, totalUnits: reqBox.box.units_per_case, casesUsed: [reqBox.box.case_id], location_name: reqBox.box.location_name, rawProductName: reqBox.box.products.name};
            return map;
        }, {}));
        console.log("Sorted Picklist values: ", sorted);

        picklist.value = sorted;

        picklistDialog.value = true;
    } catch (error) {
        console.error(error);
    }
};

</script>
<style lang="">
    
</style>