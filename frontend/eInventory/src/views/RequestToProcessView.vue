<template>
    <div>
        <div class="card">
            <Toast />

            <DataTable ref="dt" :value="R2Parray" v-model:selection="selectedCaseLines"
            showGridlines stripedRows :filters="filters"
            :loading="loading" :paginator="true" :rows="40"
            scrollable scrollHeight="650px" 
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Request To Proccess List</h4>
						<Button label="Pick List" v-tooltip.top="'Generate a new pick list'" icon="pi pi-plus" severity="success" class="mr-2" :disabled="!selectedCaseLines || !selectedCaseLines.length" />
                        <span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>
                <template #empty>No cases in the request to process</template>
                <template #loading>Loading Requests</template>

                <Column selectionMode="multiple" headerStyle="width: 3rem"/>
                <Column field="notes" header="Comments"></Column>
                <Column field="status" header="Status" style="min-width: 150px"></Column>
                <Column header="LABELS PRINTED" :bodyStyle="labelStyle">
                    <template #body="{data}" :bodyStyle="labelStyle">
                        {{ data.labels_printed ? "Yes" : "No" }}
                    </template>
                </Column>
                <Column header="SHIP LABEL" :style="labelStyle">
                    <template #body="{data}">
                        {{ data.ship_label ? "Yes" : "No" }}
                    </template>
                </Column>
                <Column field="priority" header="Priority" style="min-width: 200px"></Column>
                <Column field="ship_to_amz" header="Ship to Amz" style="min-width: 100px"></Column>
                <Column field="deadline" header="Deadline" />
                <Column field="warehouse_qty" header="Warehouse QTY"></Column>
                <Column field="amount" header="Total QTY"></Column>
                <!-- <Column field="location" header="WH Location" style="min-width: 200px"></Column> -->
                <Column field="purchase_order_name" header="Purchase Order #" style="min-width: 200px"></Column>
                <Column field="name" header="Name" style="min-width: 250px; min-height: 1000px;" frozen alignFrozen="right" class="font-bold"></Column>
                <Column field="fnsku" header="FNSKU"></Column>
                <Column field="asin" header="ASIN"></Column>
                <Column field="units_per_case" header="Units per Case"></Column>
                <Column field="bag_size" header="Bags"></Column>
                <Column field="box_type" header="Boxes"></Column>
            </DataTable>


        </div>
        
    </div>
</template>
<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils"
export default {
    data() {
        return {
            // PRODUCT VARIABLES
            products: [] as any[],
            unprocProducts: [] as any[],
            procProducts: [] as any[],
            product: {} as any,
            selectedProducts: [] as any[],

            // CASE VARIABLES
            selectedCaseLines: [] as any[],
            cases: [] as any[],
            uBoxes: [] as any[],
            pCases: [] as any[],
            poCases: [] as any[],
            poBoxes: [] as any[],
            reqPoBoxes: [] as any[],
            editedLine: {} as any,
            amount: 1,
            displayStatus: "",
            deliveredDataTableArray: [] as any[],

            // PURCHASE ORDER VARIABLES 
            purchaseOrders: [] as any[],
            purchaseOrder: {} as any,
            purchaseOrderDialog: false,
            selectedPurchaseOrder: [] as any[],
            cancelOrderDialog: false,
            rawOrderType: ['By Box', 'By Unit'],
            selectedOrderType: "",
            statusChangeDialog: false,
            receivedDialog: false,
            newStatus: "",

            // LOCATION VARIABLES
            locations: [] as any[],
            locationToCreate: {} as any,
            locationDialog: false,
            additionalLocationDialog: false,
            receivedLocationsArray: [] as any,

            // RECIPE VARIABLES
            recipes: [] as any[],
            recipeArray: [] as any[],
            recipeElements: [] as any[],
            detailedRecipes: [] as any[],
            poRecipes: [] as any[],

            // REQUEST TO PROCESS VARIABLES
            R2Parray: [] as any[],
            requestsToProcess: [] as any[],

            // MISC VARIABLES
            loading: false,
            today: "",
            statuses: [
                '1 WORKING',
                '1.25 PICKED',
				'1.5 PICKLIST',
                '2 READY',
                '3 AWAITING PLAN',
				'4 INBOUND',
                '5 ON ORDER',
                '6 ISSUE',
                '7 FLAGGED'
            ],
            priority: [
                '0 MUST GO OUT TODAY',
                '1 ASAP',
                '1 Prep to Make Space (Large Qty)',
                '2 Could Go Out Today',
                '2 Prep to Make Space',
                '3 Could Go Out Tomorrow',
                '3 Prep to Make Space',
				'4 Could Go Out This Week',
                '5 Could Go Out This Month',
                '6 Prep For Later'
            ],

            // DATATABLE VARIABLES
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },

            // DIALOG VARIABLES

        }
    },
    created(){
        this.initVariables();
    },
    mounted(){
        //this.initVariables();
    },
    methods: {
        async initVariables(){
            try {
                this.loading = true;
                await this.getPurchaseOrders();
                await this.getProducts();
                await this.getBoxes();
                await this.getRecipes();
                await this.getLocations();
                await this.getRequestsToProccess();
                this.getDate();
                this.loading = false;


            } catch (error) {
                console.log(error);
            }
        },

        getDate(){
            // const date = new Date();
            this.today = helper.getDate();
        },

        async getPurchaseOrders(){
            try {
                
                this.purchaseOrders = await action.getPurchaseOrders();
                this.poRecipes = await action.getPurchaseOrderRecipes();

                this.purchaseOrders.forEach(po => {
                    if(po.date_ordered)
                        po.date_ordered = po.date_ordered.split('T')[0];
                    if(po.date_received)
                        po.date_received = po.date_received.split('T')[0];
                });
                
                // console.log("PURCHASE ORDERS", this.purchaseOrders);
                // console.log("PO RECIPES ", this.poRecipes);
                
            } catch (err) {
                console.log(err);
            }
        },

        async getProducts(){
            try {
                //this.products = await action.getUnprocProducts();
                this.products = await action.getProducts();

                this.products.forEach(p => {
                    if (p.fnsku || p.asin)
                        this.procProducts.push(p);
                    else
                        this.unprocProducts.push(p);
                });
                //console.log("PROCESSED: ", this.procProducts);
                //console.log("UNPROCESSED: ", this.unprocProducts);
            } catch (err) {
                console.log(err);
            }
        },

        async getBoxes(){
            try {
                //this.cases = await action.getUnprocCases();
                //this.cases = await action.getCases();
                this.uBoxes = await action.getUnprocCases();
                this.pCases = await action.getProcCases();

                //console.log("CASES: ",this.cases);
                //console.log("BOXES: ", this.uBoxes);
                //console.log("CASES: ", this.pCases);
            } catch (error) {
                console.log(error);
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-25-2024
        async getRecipes(){
            try {
                this.recipes = await action.getRecipes();
                this.recipeElements = await action.getRecipeElements();

                //console.log(this.recipes);
                //console.log(this.recipeElements);
            } catch (error) {
                console.log(error);
            }
        },

        /**
         * Description: Grabs the locations from the database
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-22-2024
         * Date Last Edited: 7-22-2024
         */
        async getLocations(){
            try {
                this.locations = await action.getLocations();
            } catch (error) {
                console.log(error);
            }
        }, 

        async getRequestsToProccess(){
            try {
                // this.requestsToProcces = await action.getRequestsToProccess

                // let cases = helper.groupProducts(this.pCases);
                // console.log("cases", cases);

                const casesWithR2PsAndPOs = [] as any[];

                for(const c of this.pCases) {
                    let location = this.locations.find(l => l.location_id  === c.location);
                    if (location)
                        continue;

                    let productKey = this.products.find(p => p.product_id === c.product_id);
                    let purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === c.purchase_order_id);
                    let request = this.requestsToProcess.find(req => req.purchase_order_id === purchaseOrder.purchase_order_id && req.product_id === c.product_id);
                    // if(!location)
                    //     location = {};
                    if(!purchaseOrder)
                        purchaseOrder = {};
                    if(!request)
                        request = {notes: '', status: 'On Order', labels_printed: false, ship_label: false, priority: '6 Prep For Later', ship_to_amz: '', deadline: '', warehouse_qty: ''};

                    casesWithR2PsAndPOs.push({ box: c, key: productKey, po: purchaseOrder, req: request });
                }

                console.log("casesWithR2PsAndPOs",casesWithR2PsAndPOs);

                let returnArray = casesWithR2PsAndPOs.map(({ box, key, po, req }) => ({
                    ...box,
                    purchase_order_name: po.purchase_order_name,
                    ...req,
                    bag_size: key.bag_size,
                    box_type: key.box_type,
                    fnsku: key.fnsku,
                    asin: key.asin,

                }));
                console.log("returnArray", returnArray);

                const keyStringArray = ['product_id', 'purchase_order_name', 'request_id']

                console.log("returnArray grouped", helper.groupItemsByKey(returnArray, keyStringArray));

                this.R2Parray = helper.groupItemsByKey(returnArray, keyStringArray);
            } catch (error) {
                console.log(error);
            }
        },

        labelStyle(data: any){
            console.log(data);
            if (data.labels_printed === 'No') {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Gold' };
            } else if  (data.labels_printed === true) {
                return { font: 'bold', backgroundColor: '#bbffb5' };
            } 
        },
    },
}
</script>
<style lang="">
    
</style>