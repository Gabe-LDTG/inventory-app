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
            <DataTable v-model:expandedRows="expandedPickRows" :value="picklist" 
                stripedRows removableSort showGridlines
                scrollable scrollHeight="800px" 
                rowGroupMode="subheader" groupRowsBy="product_name">                
                 <template #groupheader="{data}">
                    <span class="flex align-items-center gap-2">{{ data.default_units_per_case }} {{ data.product_name }} (x{{ data.caseAmount }})</span>
                 </template>
                <!-- <Column field="product_name" header="Product Name">
                    <template #body="{data}">
                        {{ data.product_name }} (x{{ data.caseAmount }})
                    </template>
                </Column> -->
                <Column expander />
                <Column field="rawProductName" header="Raw Product"></Column>
                <Column field="locationGroup" header="Location(s)"></Column>
                <Column field="rawTotalBoxes" header="Number of Boxes"></Column>
                <Column field="units_per_case" header="Units per Box"></Column>
                <Column field="rawTotalUnits" header="Total Units"></Column>
                <Column header="Where to place">
                    <template #body="{data}">
                        {{ data.whereToPlace }}
                    </template>
                    <template #editor>
                        <Dropdown v-model="picklist.whereToPlace" :options="laneLocations"/>
                    </template>
                </Column>
                <Column field="" header="Notes">
                    <template #body="{data}">
                        {{ data.whereToPlace }}
                    </template>
                    <template #editor>
                        <InputText v-model="picklist.whereToPlace" type="text"/>
                    </template>
                </Column>
                <template #expansion="{data}">
                    <h3>Boxes for {{ data.rawProductName }}</h3>
                    <DataTable :value="data.boxGroups"
                    v-model:selection="selectedPicklistElements" selectionMode="multiple">
                        <Column selectionMode="multiple" headerStyle="width: 3rem" />
                        <Column field="locationName" header="Location" />
                        <Column field="units_per_case" header="Units per Box"></Column>
                        <Column field="amount" header="Total Boxes" />
                        <Column field="totalUnits" header="Total Units" />
                        <Column header="Boxes left on Pallet">
                    
                        </Column>
                    </DataTable>
                </template>
            </DataTable>

            <template #footer>
                <Button label="Save" @click=""/>
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
import InputText from "primevue/inputtext";

// PICKLIST VARIABLES___________________________________________________________________________________________________
const picklistSetupDialog = ref(false);
const picklistDialog = ref(false);
const picklists = ref();
const picklist = ref();
const picklistLabels = ref();
const picklistFilters = ref({
    product_name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    status: {value: null, matchMode: FilterMatchMode.IN}
});
const requestQtyType = ref(['All', 'Store Only', 'Ship Only'])
const picklistType = ref('All');
const expandedPickRows = ref([]);
const selectedPicklistElements = ref([]);
const laneLocations = ref([
    'FBA Prep Lane 1 A', 'FBA Prep Lane 1 B', 'FBA Prep Lane 1 C', 
    'FBA Prep Lane 2 A', 'FBA Prep Lane 2 B', 'FBA Prep Lane 2 C', 
    'FBA Prep Lane 3 A', 'FBA Prep Lane 3 B', 'FBA Prep Lane 3 C', 
    'FBA Prep Lane 4 A', 'FBA Prep Lane 4 B', 'FBA Prep Lane 4 C', 
    'FBA Prep Lane 5 A', 'FBA Prep Lane 5 B', 'FBA Prep Lane 5 C'
]);

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

// MIST VARIABLES_______________________________________________________________________________________________________
const today = ref();


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
        today.value = helper.getDate();
        await getPicklists();
        await getRequests();
        await getBoxes();
        await getRecipes();
    } catch (error) {
        console.error(error);
    }
};

// Grab all picklists 
async function getPicklists(){
    try {
        picklists.value = await action.getPicklists();
        picklistLabels.value = await action.getPicklistLabels();
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
    selectedRequests.value = [];
};

/**
 * Generates pick list based on the user selected requests and the input ingredients linked to them.
 * 
 * Created By: Gabe de la Torre-Garcia On: 5-14-25
 * Last Edited: 5-29-25
 */
async function generatePicklist(){
    try {
        // let usedBoxes: [{req: typeof selectedRequests, box: typeof boxes}]; Need to figure out typescript
        const usedBoxes: any[] = [];
        const usedBoxIds: Number[] = [];
        let newPicklistArray: any[] = [];
        const requestIds = [];
        // Loop through each request
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
                let reqMap = {...request, boxes: [] as any[]};
                console.log("Input Product: ", element.products.name);
                // Calculate total input units needed
                const totalInputUnits = totalOutputUnits * element.qty;
                let currentInputUnits = 0;
                console.log('Total Input Units: ',totalInputUnits)
                // Using a for of loop because I need to break and continue
                for (const box of element.products.cases) {
                    
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
                        box.name = element.products.name;
                        box.locationName = box.locations.name;

                        /* console.log(newPicklistArray);
                        console.log(newPicklistArray[0].request_id);
                        const boxIdx = newPicklistArray.findIndex((req) => {console.log(JSON.stringify(req.request_id),request.request_id); req.request_id === request.request_id});
                        console.log("Box Idx: ", boxIdx);

                        if(boxIdx === -1)
                            newPicklistArray.push({req: request, boxes: [box]});
                        else {
                            newPicklistArray[boxIdx].boxes.push(box);
                        } */
                        
                        // WHY IS THIS TURNING MY ARRAY INTO AN OBJECT. ITS A PUSH COMMAND
                        reqMap.boxes.push(box);
                        usedBoxes.push({req: request, box: box});
                        usedBoxIds.push(box.case_id);
                        currentInputUnits = currentInputUnits + box.units_per_case;
                    }
                }
                console.log("Req Map", reqMap);
                let groups: (typeof reqMap)[number] & { amount: number } = Object.values(reqMap.boxes.reduce((map: any, box: any) => {
                    // Use the inner key to group by product type
                    const key = box.units_per_case +':'+ box.location_id;

                    if(map[key]){
                        map[key].amount++;
                        map[key].totalUnits = map[key].totalUnits + box.units_per_case;
                        map[key].boxesUsed = [...map[key].boxesUsed, box.case_id];

                        /* if(map[key].locations.includes(reqBox.box.location_id) === false)
                            map[key].locations = [...map[key].locations, reqBox.box.location_id]; */
                    } else {
                        map[key] = { ...box, amount: 1, totalUnits: box.units_per_case, boxesUsed: [box.case_id], locationName: box.locationName, rawProductName: box.name};
                    }
                        return map;
                }, {}));
                let locationGroup = '';
                let rawTotalUnits = 0;
                let rawTotalBoxes = 0;
                let rawProductName = groups[0].rawProductName;
                groups.forEach((group: any) => {
                    locationGroup = (locationGroup === '') ? group.locationName : locationGroup + ', ' + group.locationName;
                    rawTotalUnits += group.totalUnits;
                    rawTotalBoxes += group.amount;
                })
                newPicklistArray.push({...request, locationGroup: locationGroup, rawProductName: rawProductName, rawTotalUnits: rawTotalUnits, rawTotalBoxes: rawTotalBoxes, boxGroups: groups});
                console.log("AFTER LOOP: Current Units: ", currentInputUnits, "Total Inputs: ", totalInputUnits);
                console.log("__________________________________________________");
            }
        }
        console.log("All used boxes for Picklist: ", usedBoxes);
        console.log("New Picklist Array: ", newPicklistArray);
        picklist.value = newPicklistArray;

        let picklistIdx = 1;
        // console.log("Picklist object", picklist.value);
        const d = new Date(today.value);
        // console.log("Alt Picklist Name: ", d.getFullYear()+''+(d.getMonth()+1)+''+d.getDate()+"-"+picklistIdx);

        for(const label of picklistLabels.value){
            const stringArray = label.value.split('-');
            const labelNoIdx = stringArray[0];
            const labelDate = new Date(labelNoIdx);
            if(labelDate.getFullYear() === d.getFullYear() && labelDate.getMonth() === d.getMonth() && labelDate.getDate() === d.getDate())
                picklistIdx++;
        }

        let picklistLabel = d.getFullYear()+''+(d.getMonth()+1)+''+d.getDate()+"-"+picklistIdx;

        picklistSetupDialog.value = false;
        picklistDialog.value = true;
    } catch (error) {
        console.error(error);
    }
};

</script>
<style lang="">
    
</style>