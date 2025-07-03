<template>
    <div>
    <Toast />
        <!-- Main Picklists DataTable (single-select) -->
        <DataTable :value="picklists" v-model:selection="selectedPicklist" 
        selectionMode="single" dataKey="picklist_id" showGridlines 
        stripedRows @rowSelect="onPicklistSelect">
            <template #header>
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h4 class="m-0">Picklists</h4>
                    <Button rounded @click="openPicklist">Add Picklist</Button>
                </div>
            </template>
            <template #loading>Loading picklists. Please wait.</template>
            <template #empty>No picklists found.</template>
            <Column field="label" header="Name" />
            <Column field="status" header="Status">
                <template #body="{ data }">
                    <Tag :style="helper.statusStyle(data.status)">{{ data.status }}</Tag>
                </template>
            </Column>
            <Column header="Total Boxes">
                <template #body="{ data }">
                    {{ getTotalBoxes(data) }}
                </template>
            </Column>
        </DataTable>
        <!-- End DataTable -->

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
        </Dialog>

        <Dialog v-model:visible="picklistDetailsDialog" header="Picklist Details" :modal="true" style="min-width: 60vw">
            <div class="request-list">
                <Button class="flex flex-start" label="Collapse All" icon="pi pi-times" @click="collapseRows"/>
                <Button class="flex flex-start" label="Expand All" icon="pi pi-times" @click="expandRows"/>
                <div v-for="request in safeRequestsToProcess" :key="request.request_id" class="request-card">
                    <div class="request-header">
                        <span class="product-name">{{ request.products.name }}</span>
                        <span class="case-count">Cases: {{ request.warehouse_qty + request.ship_to_amz }}</span>
                    </div>
                    <div class="ingredient-table">
                        <DataTable
                        :value="request.picklist_elements"
                        v-model:expandedRows="expandedElements"
                        dataKey="picklist_element_id"
                        editMode="cell"
                        @cell-edit-complete="onElementCellEditComplete"
                        stripedRows showGridlines scrollable scrollHeight="600px"
                        :rowStyle="getLaneLocationRowStyle"
                        >
                        <Column expander />
                        <Column header="Raw Ingredient">
                            <template #body="{ data: picklistElement }">
                            {{ getIngredientName(picklistElement) }}
                            </template>
                        </Column>
                        <Column field="locationGroup" header="Location(s)" >
                            <template #body="{ data: picklistElement }">
                                {{ getLocationsList(picklistElement) }}
                            </template>
                        </Column>
                        <Column header="Number of Boxes" >
                            <template #body="{ data: picklistElement }">
                            {{ picklistElement.cases.length }}
                            </template>
                        </Column>
                        <Column field="rawTotalUnits" header="Total Units" >
                            <template #body="{ data: picklistElement }">
                            {{ getTotalUnits(picklistElement.cases) }}
                            </template>
                        </Column>
                        <Column field="notes" header="Notes">
                            <template #body="{ data: picklistElement }">
                            {{ picklistElement.notes }}
                            </template>
                            <template #editor="{ data: picklistElement }">
                            <InputText v-model="picklistElement.notes" type="text" />
                            </template>
                        </Column>
                        <Column field="lane_location" header="Lane Location">
                            <template #body="{ data: picklistElement }">
                            <span :style="{ background: !picklistElement.lane_location ? '#fffbe6' : 'inherit', display: 'block', minHeight: '2rem' }">
                              {{ picklistElement.lane_location }}
                            </span>
                            </template>
                            <template #editor="{ data: picklistElement }">
                            <Dropdown v-model="picklistElement.lane_location" :options="laneLocations" placeholder="Select Lane Location"/>
                            </template>
                        </Column>
                        <template #expansion="{ data: picklistElement }">
                            <h4>Boxes for {{ getIngredientName(picklistElement) }}</h4>
                            <DataTable :value="helper.groupItemsByKey(picklistElement.cases, ['location_id', 'units_per_case'])" :responsiveLayout="'scroll'"
                            dataKey="case_id">
                                <Column field="units_per_case" header="Units/Box" />
                                <Column field="amount" header="# of Boxes" />
                                <Column field="location_id" header="Location" >
                                    <template #body="{ data: boxGroup }">
                                    {{ boxGroup.locations.name }}
                                    </template>
                                </Column>
                                <Column header="Picked">
                                    <template #body="{ data: boxGroup }">
                                        <Button :icon="getBoxGroupButtonIcon(boxGroup)" :severity="getBoxGroupButtonSeverity(boxGroup)" text @click="onBoxGroupSelectionChange(picklistElement, boxGroup)"/>
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                        </DataTable>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" @click="picklistDetailsDialog = false" />
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
import { ref, onMounted, computed, watch } from "vue";
import action from "@/components/utils/axiosUtils";
import helper from "@/components/utils/helperUtils";
import { FilterMatchMode } from "primevue/api";
import { useToast } from "primevue/usetoast";
import { debounce, pick } from 'lodash';

// PICKLIST VARIABLES___________________________________________________________________________________________________
const picklistSetupDialog = ref(false);
const picklistDialog = ref(false);
const picklistDetailsDialog = ref(false);
const picklists = ref();
const picklist = ref();
const picklistLabels = ref();
const picklist_id = ref();
const picklistFilters = ref({
    product_name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    status: {value: null, matchMode: FilterMatchMode.IN}
});
const requestQtyType = ref(['All', 'Store Only', 'Ship Only'])
const picklistType = ref('All');
const expandedPickRows = ref([]);
const expandedElements = ref<Record<number, boolean>>({});
const selectedPicklistElements = ref([]);
const laneLocations = ref([
    'FBA Prep Lane 1 A', 'FBA Prep Lane 1 B', 'FBA Prep Lane 1 C', 
    'FBA Prep Lane 2 A', 'FBA Prep Lane 2 B', 'FBA Prep Lane 2 C', 
    'FBA Prep Lane 3 A', 'FBA Prep Lane 3 B', 'FBA Prep Lane 3 C', 
    'FBA Prep Lane 4 A', 'FBA Prep Lane 4 B', 'FBA Prep Lane 4 C', 
    'FBA Prep Lane 5 A', 'FBA Prep Lane 5 B', 'FBA Prep Lane 5 C'
]);
interface PicklistType {
    requests_to_process?: any[];
    // add other properties as needed
}
const selectedPicklist = ref<PicklistType | null>(null);
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
const toast = useToast();
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
            let newRequest = splitRequestByType(request, picklistType.value);
            if(newRequest){
                await action.addRequest(newRequest);
            }

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

                    // console.log("Current Units: ", currentInputUnits, "Total Inputs: ", totalInputUnits);

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
                /** @TODO SET WHAT WILL GO TO THE DATABASE HERE */ 
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

        let picklistElements: {notes: string, request_id: number, lane_location: string, usedCaseIds: number[]}[] = [];
        for(const element of newPicklistArray){
            let totalCases: number[] = [];
            for(const group of element.boxGroups){
                totalCases = [...totalCases, ...group.boxesUsed];
            }
            picklistElements = [...picklistElements, {notes: '', request_id: element.request_id, lane_location: '', usedCaseIds: totalCases}];
        }

        let picklistData = {label: picklistLabel, picklistElements: picklistElements};

        await action.addPicklist(picklistData);

        console.log("picklistData", picklistData);

        toast.add({ severity: 'success', summary: 'Picklist Created', detail: 'Picklist '+ picklistLabel +' successfully added!', life: 3000 });

        picklistSetupDialog.value = false;
        picklistDialog.value = true;
    } catch (error) {
        console.error("Error creating picklist: ",error);
    }
};

function getTotalBoxes(picklist: any) {
    if (!picklist || !picklist.requests_to_process) return 0;
    return picklist.requests_to_process.reduce((total: any, request: { picklist_elements: any[]; }) => {
        if (!request.picklist_elements) return total;
        return total + request.picklist_elements.reduce((sum: any, element: { cases: string | any[]; }) => {
            return sum + (element.cases ? element.cases.length : 0);
        }, 0);
    }, 0);
}

function getLocationsList(picklistElement: any) {
    let locationList: string[] = [];
    for(const box of picklistElement.cases) {
        if (box.locations && !locationList.includes(box.locations.name)) {
            locationList.push(box.locations.name);
        }
    }
    return locationList.join(', ');
}

function getTotalUnits(boxArray: any[]) {
    if (!boxArray || boxArray.length === 0) return 0;
    return boxArray.reduce((total, box) => {
        return total + box.units_per_case;
    }, 0);
}

function onPicklistSelect() {
    console.log("Selected Picklist: ", selectedPicklist.value); 
    expandRows();

    picklistDetailsDialog.value = true;
}

function expandRows(){
    console.log("Selected Picklist: ", selectedPicklist.value); 
    expandedElements.value = {} as Record<number, boolean>;
    if (selectedPicklist.value && Array.isArray(selectedPicklist.value.requests_to_process)) {
        for(const request of selectedPicklist.value.requests_to_process) {
            if (request.picklist_elements && request.picklist_elements.length > 0) {
                for(const element of request.picklist_elements) {
                    expandedElements.value[element.picklist_element_id] = true;
                }
            }
        }
    }
    console.log("Expanded Elements: ", expandedElements.value);
}

function collapseRows() {
    // Collapse all rows by setting expandedElements to an empty object
    expandedElements.value = {};
}

// Active picklist computed property
const safeRequestsToProcess = computed(() => {
    if (selectedPicklist.value && Array.isArray(selectedPicklist.value.requests_to_process)) {
        return selectedPicklist.value.requests_to_process;
    }
    return [];
});

function getIngredientName(element: any) {
    return element.cases && element.cases.length > 0 && element.cases[0].products && element.cases[0].products.name
        ? element.cases[0].products.name
        : '';
}

async function onElementCellEditComplete(event: any) {
    try {
        console.log('Cell edit complete:', event.data, event.field, event.newValue);

        let { data, field, newValue } = event;
        data[field] = newValue; // Update the data object with the new value
        await action.editPicklistElement(field, newValue, data.picklist_element_id);
    } catch (error) {
        console.error("Error in onElementCellEditComplete:", error);
    }
}

// Handler for box group selection changes
async function onBoxGroupSelectionChange(picklistElement: any, boxGroup: any) {
    try {
        console.log('Box group selection changed:', boxGroup);
        console.log('Selected picklist element:', picklistElement);
        let pickedStatus = "";
        let selectedIds: number[] = [];
        if (Array.isArray(picklistElement.cases)) {
            for(const box of picklistElement.cases) {
                // Check if the box matches the group criteria
                if (box.location_id === boxGroup.location_id && box.units_per_case === boxGroup.units_per_case) {
                    // Toggle the picked status
                    box.status = box.status !== "Picked" ? "Picked" : "On Picklist";
                    selectedIds.push(box.case_id);
                }
            }

            pickedStatus = boxGroup.status !== "Picked" ? 'Picked' : 'On Picklist';
            console.log('Selected box IDs:', selectedIds, " Status: ", pickedStatus);

            await action.editPickedStatus(selectedIds, pickedStatus);
        }
    } catch (error) {
        console.error("Error in onBoxGroupSelectionChange:", error);
    }
}

function getBoxGroupButtonIcon(boxGroup: any) {
  return boxGroup.status === 'Picked' ? 'pi pi-check-circle' : 'pi pi-times-circle';
}

function getBoxGroupButtonSeverity(boxGroup: any) {
  return boxGroup.status === 'Picked' ? 'success' : 'danger';
}

interface LaneLocationColorMap {
    [key: string]: string;
}

interface LaneLocationRowData {
    lane_location: string;
    [key: string]: any;
}

function getLaneLocationRowStyle(rowData: LaneLocationRowData): { background: string } {
    const colorMap: LaneLocationColorMap = {
        'FBA Prep Lane 1 A': '#e3f2fd',
        'FBA Prep Lane 1 B': '#fce4ec',
        'FBA Prep Lane 1 C': '#fff9c4',
        'FBA Prep Lane 2 A': '#e8f5e9',
        'FBA Prep Lane 2 B': '#f3e5f5',
        'FBA Prep Lane 2 C': '#ffe0b2',
        'FBA Prep Lane 3 A': '#f9fbe7',
        'FBA Prep Lane 3 B': '#ede7f6',
        'FBA Prep Lane 3 C': '#ffecb3',
        'FBA Prep Lane 4 A': '#e0f2f1',
        'FBA Prep Lane 4 B': '#fbe9e7',
        'FBA Prep Lane 4 C': '#d7ccc8',
        'FBA Prep Lane 5 A': '#f1f8e9',
        'FBA Prep Lane 5 B': '#e1f5fe',
        'FBA Prep Lane 5 C': '#f8bbd0'
    };
    const lane: string = rowData.lane_location;
    return { background: colorMap[lane] || 'inherit' };
}

// Split request by type (shipping or storage)
function splitRequestByType(request: any, type: string) {
    // Clone the original request (shallow copy, adjust as needed for deep copy)
    const newRequest = { ...request };
    if (type === 'Ship Only') {
        // New request will track the stored cases, current will track shipped
        newRequest.ship_to_amz = 0;
        if (request.warehouse_qty > 0) {
            newRequest.warehouse_qty = request.warehouse_qty; // cases being stored
            request.warehouse_qty = 0; // zero out storage in current
            return newRequest;
        }
    } else if (type === 'Store Only') {
        // New request will track the shipped cases, current will track stored
        newRequest.warehouse_qty = 0;
        if (request.ship_to_amz > 0) {
            newRequest.ship_to_amz = request.ship_to_amz; // cases being shipped
            request.ship_to_amz = 0; // zero out shipping in current
            return newRequest;
        }
    }
    // If nothing to split, return null
    return null;
}
</script>
<style scoped>
.request-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 1rem;
}
.request-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    padding: 1.5rem 2rem;
    border: 1px solid #ececec;
}
.request-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}
.product-name {
    color: #2c3e50;
    font-size: 1.3rem;
    font-weight: 700;
}
.case-count {
    background: #f0f4fa;
    color: #1976d2;
    border-radius: 6px;
    padding: 0.3rem 0.8rem;
    font-size: 1.1rem;
    font-weight: 600;
}
.ingredient-table {
    margin-top: 0.5rem;
}
</style>