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
            <div >
                <DataTable v-model:selection="selectedRequests" :value="requests" selectionMode="multiple" dataKey="request_id" :metaKeySelection="false">
                    <Column field="request_id"></Column>
                </DataTable>
            </div>
            <div>

            </div>
            <template #footer>
                <Button class="flex flex-start" label="Cancel" icon="pi pi-times" @click="picklistDialog = false"/>
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

// PICKLIST VARIABLES___________________________________________________________________________________________________
const picklistDialog = ref(false);
const picklists = ref();

// REQUEST VARIABLES____________________________________________________________________________________________________
const requests = ref();
const selectedRequests = ref();
const request = ref();

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
    } catch (error) {
        console.error(error);
    }
};

// Grab all products
async function getProducts(){
    try {
        
    } catch (error) {
        console.error(error);
    }
};

// Grab all purchase orders
async function getPurchaseOrders(){
    try {
        
    } catch (error) {
        console.error(error);
    }
};

// Grab all locations
async function getLocations(){
    try {
        
    } catch (error) {
        console.error(error);
    }
};

// Grab all requests to process
async function getRequests(){
    try {
        requests.value = await action.getRequests('0 COMPLETED');
        console.log("Requests", requests.value);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Opens the picklist Dialog and initializes required variables. 
 * 
 * Created By: Gabe de la Torre-Garcia On: 5-13-25
 * Last Edited: 
 */
function openPicklist(){
    picklistDialog.value = true;
};

</script>
<style lang="">
    
</style>