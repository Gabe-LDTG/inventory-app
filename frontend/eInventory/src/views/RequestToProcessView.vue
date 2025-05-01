<template>
    <div class="card">
        <Toast />

        <!-- Sorting was messing with the cell saving function. Might implement later -->
        <!-- sortMode="single" sortField="priority" :sortOrder=1 -->
        <DataTable ref="dt" :value="R2Parray" v-model:selection="selectedRecipeLines"
        showGridlines stripedRows :filters="filters"
        :loading="loading" :paginator="true" :rows="40" :rowStyle="requestRowStyle"
        scrollable scrollHeight="1100px" removableSort
        editMode="cell" @cell-edit-complete="onRequestCellEdit"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h4 class="m-0">Request To Proccess List</h4>
                    <Button label="Request" v-tooltip.top="'Add a new request to process'" @click="addRequestSetup" icon="pi pi-plus" severity="success" class="mr-2"/>  
                    <!-- <Button label="Pick List" v-tooltip.top="'Generate a new pick list'" @click="openPicklistAmountDialog" icon="pi pi-plus" severity="info" class="mr-2" :disabled="!selectedRecipeLines || !selectedRecipeLines.length" /> -->
                    <Button @click="toggleStatus" :severity="statusFilterSeverity(statusFilter)">
                        <div v-if="statusFilter === '0 COMPLETED'">
                            <span>Show Completed Requests</span>
                        </div>
                        <div v-else>
                            <span>Hide Completed Requests</span>
                        </div>
                    </Button>
                    <span class="p-input-icon-right">
                        <!-- <i class="pi pi-search" /> -->
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </span>
                </div>
            </template>
            <template #empty>No cases in the request to process</template>
            <template #loading>Loading Requests</template>

            <!-- <Column selectionMode="multiple" frozen alignFrozen="left" headerStyle="width: 3rem"/> -->
            <Column field="notes" header="Comments">
                <template #body="{data}">
                    <div v-show="data.notes">
                        {{ data.notes }}
                    </div> 
                </template>
                <template #editor="{data}">
                    <InputText type="text" v-model="data.notes"/>
                </template>
            </Column>
            <Column field="status" header="Status" sortable style="min-width: 160px">
                <template #body="{data}" class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <!-- {{ data.status }} -->
                    <Tag :style="statusStyle(data.status)">{{ data.status }}</Tag>
                </template>
                <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.status"
                        placeholder="Select a status" class="w-full md:w-14rem" editable
                        :options="statuses"/>
                        </div>
                </template>
            </Column>
            <Column header="LABELS PRINTED" :style="labelStyle">
                <template #body="{data}" :bodyStyle="labelStyle">
                    <!-- {{ data.labels_printed ? "Yes" : "No" }} -->
                    <div :style="labelStyle(data.label_printed)">
                        <Tag :style="labelStyle(data.labels_printed)">{{ data.labels_printed ? "Yes" : "No" }}</Tag>
                    </div>
                    
                </template>
                <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.labels_printed"
                        placeholder="Item labels printed?" class="w-full md:w-14rem" editable
                        :options="labelOptions"
                        optionLabel="header"
                        optionValue="value" />
                    </div>
                </template>
            </Column>
            <Column header="SHIP LABEL" :style="labelStyle">
                <template #body="{data}">
                    <Tag :style="labelStyle(data.ship_label)">{{ data.ship_label ? "Yes" : "No" }}</Tag>
                </template>
                <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.ship_label"
                        placeholder="Shipping labels printed?" class="w-full md:w-14rem" editable
                        :options="labelOptions"
                        optionLabel="header"
                        optionValue="value" />
                    </div>
                </template>
            </Column>
            <Column field="priority" header="Priority" sortable style="min-width: 200px">
                <template #body="{data}">
                    <!-- {{ data.priority }} -->
                    <Tag :style="priorityStyle(getRequestPriority(data.deadline))">{{ getRequestPriority(data.deadline) }}</Tag>
                </template>
            </Column>
            <Column field="ship_to_amz" header="Ship to Amz" style="min-width: 100px">
                <template #body="{data}">
                    {{ data.ship_to_amz }}
                </template>
                <template #editor="{data}">
                    <InputNumber v-model="data.ship_to_amz" />
                </template>
            </Column>
            <Column field="deadline" header="Deadline" >
                <!-- NOTE: FIX THE 'NaN' thing -->
                 <!-- v-show="data.deadline !== NaN" -->
                <template  #body="{data}">
                    <!-- {{ data.deadline }} -->
                    {{ formatDate(data.deadline) }}
                </template>
                <template #editor="{data}">
                    <Calendar dateFormat="mm/dd/yy" v-model="data.deadline"/>
                </template>
            </Column>
            <Column field="warehouse_qty" header="Warehouse QTY">
                <template #body="{data}">
                    {{ data.warehouse_qty }}
                </template>
                <template #editor="{data}">
                    <InputNumber v-model="data.warehouse_qty" />
                </template>
            </Column>
            <Column header="Total QTY" class="font-bold">
                <template #body="{data}">
                    {{ data.warehouse_qty + data.ship_to_amz }}
                </template>
            </Column>
            <Column field="purchase_order_name" header="Purchase Order #" style="min-width: 200px" class="font-bold">
                <template #body="{data}">
                    {{ data.purchase_order_name }}
                </template>
                <!-- <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.priority"
                        placeholder="Select a priority" class="w-full md:w-14rem" editable
                        :options="priorities"/>
                        </div>
                </template> -->
            </Column>
            <Column field="product_id" header="Name" sortable style="min-width: 250px; min-height: 1000px;" frozen alignFrozen="right" class="font-bold">
                <template #body="{data}">
                    {{ data.product_name }}
                </template>
<!--                 <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.product_id"
                        placeholder="Select a priority" class="w-full md:w-14rem" editable
                        :options="procProducts"
                        optionLabel="name"
                        optionValue="product_id"
                        />
                        </div>
                </template> -->
            </Column>
            <Column field="fnsku" header="FNSKU" class="font-bold"></Column>
            <Column field="asin" header="ASIN" class="font-bold"></Column>
            <Column field="units_per_case" header="Units per Case" class="font-bold"></Column>
            <Column field="bag_size" header="Bags" class="font-bold"></Column>
            <Column field="box_type" header="Boxes" class="font-bold"></Column>
        </DataTable>


    </div>

    <Dialog v-model:visible="picklistAmountDialog" :style="{width: '800px'}" header="How many cases to create?" :modal="true">
        <DataTable ref="dt" :value="picklistRecipes" 
        showGridlines stripedRows 
        editMode="cell" @cell-edit-complete="onAmountCellEdit"
        >
            <Column field="product_name" header="Name" style="min-width: 250px;" class="font-bold"></Column>
            <Column field="amount" header="Total QTY" class="font-bold">
                <template #body="{data}">
                    {{ data.qty/data.units_per_case }}
                </template>
            </Column>
            <Column header="Cases to Pick">
                <template #body="{data}">
                    {{ data.casesToPick }}
                </template>
                <template #editor="{data}">
                    <InputNumber v-model="data.casesToPick" />
                </template>
            </Column>
            <Column header="Notes">
                <template #body="{data}">
                    {{ data.notes }}
                </template>
                <template #editor="{data}">
                    <InputText v-model="data.notes" />
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="picklistAmountDialog = false"/>
            <Button label="Select" icon="pi pi-check" text @click="openPicklistDialog" />
        </template>
    </Dialog>
        
    <Dialog v-model:visible="picklistDialog" :style="{width: '1000px'}" header="Generated Picklist" :modal="true">
        <div id="element-to-convert">
            <DataTable ref="dt" :value="pickListArray" 
            showGridlines stripedRows 
            rowGroupMode="rowspan" groupRowsBy="procName" sortMode="single" sortField="procName"
            editMode="cell" @cell-edit-complete="onPicklistCellEdit"
            >
                <Column field="procName" header="Case Name" class="font-bold">
                    <template #body="{data}">
                    {{ data.procUnitsPerCase }} {{ data.procName }} (x{{ data.procAmount }})
                    </template>
                </Column>
                <Column field="product_name" header=" Box Name" />
                <Column field="units_per_case" header="Units per Box" />
                <Column field="locationName" header="Location" />
                <Column field="amount" header="# of Boxes" />
                <Column header="Total Units" >
                    <template #body="{data}">
                        {{ data.amount * data.units_per_case }}
                    </template>
                </Column>
                <Column header="Notes">
                    <template #body="{data}">
                        {{ data.notes }}
                    </template>
                    <template #editor="{data}">
                        <InputText v-model="data.notes" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <template #footer>
            <Button label="PDF" icon="pi pi-upload" text @click="exportToPDF" />
            <Button label="Cancel" icon="pi pi-times" text @click="picklistDialog = false"/>
            <!-- <Button label="Save Picklist" icon="pi pi-check" text disabled @click="" /> -->
        </template>
    </Dialog>

    <Dialog v-model:visible="newRequestDialog" :style="{width: '1000px'}" header="Add a new request" :modal="true">

        <Dropdown v-model="requestToProcess.product_id" required="true" 
            placeholder="Select a Product" class="md:w-14rem" editable
            :options="getUsableProducts()"
            optionLabel="name"
            optionValue="product_id"
            filter
            @change=""
            :virtualScrollerOptions="{ itemSize: 38 }"
            />

        <!-- <Dropdown v-model="requestToProcess.purchase_order_id" required="true" 
            placeholder="Select a Purchase Order" class="md:w-14rem" editable
            :options="getUsablePO()"
            optionLabel="purchase_order_name"
            optionValue="purchase_order_id"
            filter
            @change=""
            :virtualScrollerOptions="{ itemSize: 38 }"
            /> -->

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="newRequestDialog = false"/>
            <Button label="Add Request" icon="pi pi-check" text @click="onNewRequestSave" />
        </template>
    </Dialog>
    
</template>
<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils";

/** @TODO Try to fix module later */
// @ts-ignore
import html2pdf from "html2pdf.js";

// https://pspdfkit.com/blog/2022/how-to-generate-a-pdf-with-vuejs/

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
            selectedRecipeLines: [] as any[],
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
            cancelOrderDialog: false as boolean,
            rawOrderType: ['By Box', 'By Unit'] as string[],
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
            reqRecipes: [] as any[],

            // REQUEST TO PROCESS VARIABLES
            requestToProcess: {} as {
                request_id: number | null; 
                product_id: number | null; 
                purchase_order_id: number | null;
                notes: string | null;
                status: string;
                labels_printed: boolean; 
                ship_label: boolean; 
                priority: string; 
                ship_to_amz: number; 
                deadline: Date | null; 
                warehouse_qty: number;
            },
            R2Parray: [] as any[],
            requestsToProcess: [] as any[],
            requestsUpdateArray: [] as any[],
            newRequestDialog: false,
            statusFilter: "0 COMPLETED",


            // PICKLIST VARIABLES
            picklists: [] as any[],
            picklistRecipes: [] as any[],
            picklistBoxes: [] as any[],
            picklistAmountDialog: false,
            picklistDialog: false,
            pickListArray: [] as any[],
            
            // MISC VARIABLES
            loading: false,
            today: "",
            statuses: [
                '0 COMPLETED',
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
            priorities: [
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
            labelOptions: [
                {value: true, header: 'Yes'},
                {value: false, header: 'No'}
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
                // console.log("PROCESSED: ", this.procProducts);
                //console.log("UNPROCESSED: ", this.unprocProducts);
            } catch (err) {
                console.log(err);
            }
        },

        async getBoxes(){
            try {
                //this.cases = await action.getUnprocCases();
                //this.cases = await action.getCases();
                this.uBoxes = await action.getRequestedBoxes();
                this.pCases = await action.getRequestedCases();
                this.reqRecipes = await action.getRequestedRecipes();

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
                // this.recipes = await action.getRecipes();
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

        /**
         * Grabs all requests to process, and parses an array of cases or recipes in the RTP to display
         * 
         * Created By: Gabe de la Torre-Garcia
         * Date Created: ???
         * Date Last Edited: 3-19-2025
         */
        async getRequestsToProccess(){
            try {
                this.requestsToProcess = await action.getRequests(this.statusFilter);

                // let cases = helper.groupProducts(this.pCases);
                // console.log("cases", cases);

                const casesWithR2PsAndPOs = [] as any[];

                // console.log("casesWithR2PsAndPOs",casesWithR2PsAndPOs);

                for(const request of this.requestsToProcess){
                    let productKey = this.products.find(p => p.product_id === request.product_id);
                    let purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === request.purchase_order_id);

                    let requestedRecipe = {units_per_case: productKey.default_units_per_case, qty: 0}; 

                    if(!purchaseOrder)
                        purchaseOrder = {purchase_order_name: 'No linked PO'};
                    else 
                        requestedRecipe = this.reqRecipes.find(recipe => recipe.purchase_order_id === purchaseOrder.purchase_order_id && recipe.product_id === request.product_id);

                    console.log(requestedRecipe);

                    if (requestedRecipe.qty === 0)
                        requestedRecipe.qty = requestedRecipe.units_per_case*(request.warehouse_qty + request.ship_to_amz);

                    casesWithR2PsAndPOs.push({ req: request, key: productKey, po: purchaseOrder, recipe: requestedRecipe });
                }

                let returnArray = casesWithR2PsAndPOs.map(({ req, key, po, recipe }) => ({
                    ...req,
                    ...recipe,
                    purchase_order_name: po.purchase_order_name,
                    product_name: key.name,
                    bag_size: key.bag_size,
                    box_type: key.box_type,
                    fnsku: key.fnsku,
                    asin: key.asin,
                    casesToPick: req.ship_to_amz + req.warehouse_qty,
                }));
                console.log("returnArray", returnArray);

                const keyStringArray = ['product_id', 'request_id']

                console.log("returnArray grouped", helper.groupItemsByKey(returnArray, keyStringArray));

                // this.R2Parray = helper.groupItemsByKey(returnArray, keyStringArray);
                this.R2Parray = returnArray;
            } catch (error) {
                console.log(error);
            }
        },

        addNewRequest(){
            let request = {
                            notes: null, 
                            status: '5 ON ORDER', 
                            labels_printed: false, 
                            ship_label: false, 
                            priority: '6 Prep For Later', 
                            ship_to_amz: 0, 
                            deadline: null, 
                            warehouse_qty: 0,
                            product_id: null,
                            purchase_order_id: null
                        };
            this.R2Parray = [request, ...this.R2Parray];
        },

        requestRowStyle(data: any){
            if (data.status === '3 AWAITING PLAN'){
                return { font: 'bold', color: '#d4ac0d', backgroundColor: '#fcf3cf' };
            } else if(data.status === '6 ISSUE'){
                return { font: 'bold', color: '#943126', backgroundColor: '#f5b7b1' };
            } else if (data.status === '7 FLAGGED'){
                return { font: 'bold', color: '#fdedec', backgroundColor: '#cb4335'};
            }
        },

        labelStyle(data: boolean | number){
            // console.log("STYLE ",data);
            if (data === 0 || data === false) {
                return { font: 'bold', color: '#2874a6', backgroundColor: '#90caf9', fontSize: '14px' };
            } else if  (data === 1 || data === true) {
                return { font: 'bold', color: '#1e8449', backgroundColor: '#a5d6a7', fontSize: '14px' };
            }
        },

        statusStyle(data: string){
            // console.log("DATA ",data);
            if(data === '1 WORKING'){
                return { font: 'bold', backgroundColor: '#2e7d32', fontSize: '14px' };
            } else if (data === '1.25 PICKED'){
                return { font: 'bold', backgroundColor: '#43a047', fontSize: '14px' };
            } else if (data === '1.5 PICKLIST'){
                return { font: 'bold', color: '#145a32', backgroundColor: '#81c784', fontSize: '14px' };
            } else if (data === '2 READY'){
                return { font: 'bold', color: '#145a32', backgroundColor: '#c8e6c9', fontSize: '14px' };
            } else if (data === '3 AWAITING PLAN'){
                return { font: 'bold', color: '#d4ac0d', backgroundColor: '#fcf3cf', fontSize: '14px' };
            } else if (data === '4 INBOUND'){
                return { font: 'bold', color: '#21618c ', backgroundColor: '#aed6f1', fontSize: '14px' };
            } else if (data === '5 ON ORDER'){
                return { font: 'bold', backgroundColor: '#1976d2', fontSize: '14px' };
            } else if (data === '6 ISSUE'){
                return { font: 'bold', color: '#943126', backgroundColor: '#f5b7b1', fontSize: '14px' };
            } else if (data === '7 FLAGGED'){
                return { font: 'bold', color: '#fdedec', backgroundColor: '#cb4335', fontSize: '14px' };
            } else if (data === '0 COMPLETED') {
                return { font: 'bold', color: '#fdedec', backgroundColor: '#b90dc4', fontSize: '14px' };
            }
        },

        priorityStyle(data: string){
            // console.log("DATA ",data);
            if(data === '0 MUST GO OUT TODAY'){
                return { font: 'bold', backgroundColor: '#4a148c', fontSize: '14px' };
            } else if (data === '1 This Week'){
                return { font: 'bold', backgroundColor: '#5e35b1', fontSize: '14px' };
            } else if (data === '2 Weeks'){
                return { font: 'bold', backgroundColor: '#7e57c2', fontSize: '14px' };
            } else if (data === '3 Weeks'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#d1c4e9', fontSize: '14px' };
            } else if (data === '4 This Month'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#ede7f6', fontSize: '14px' };
            } else if (data === '5 Next Month'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#f5f5f5', fontSize: '14px' };
            } else if (data === '6 Several Months'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#fafafa', fontSize: '14px' };
            } else if (data === '-1 LATE'){
                return { font: 'bold', backgroundColor: '#cb4335', fontSize: '14px' };
            } else {
                return { font: 'bold', color: '#311b92', backgroundColor: '#fafafa', fontSize: '14px' };
            }
        },

        /**
         * Runs every time a request cell is edited and autosaves new data
         * @param event The request field cell being edited
         * 
         * Created By: Gabe de la Torre-Garcia On: ???
         * 
         * Last Edited: 3-18-2025
         */
        async onRequestCellEdit(event: any){
            console.log(event);

            const {index, newData, newValue, value, field} = event;

            if (value === newValue)
                console.log("EQUAL");
            else{
                console.log("EDITS");
                this.R2Parray[index][field] = newValue;
                this.R2Parray[index].casesToPick = this.R2Parray[index].ship_to_amz + this.R2Parray[index].warehouse_qty;
                this.R2Parray[index].qty = this.R2Parray[index].units_per_case*(this.R2Parray[index].ship_to_amz + this.R2Parray[index].warehouse_qty);
                await this.saveUpdatedRequests(newData);
            }
        },

        /**
         * Save edits for a request to process
         * 
         * @param request_data Fields for a request to process record
         * 
         * Created By: Gabe de la Torre-Garcia
         * 
         * Last Edited: 4-10-25
         */
        async saveUpdatedRequests(request_data: {
                        product_id: number | null; 
                        purchase_order_id: number | null;
                        notes: string | null, 
                        status: string,
                        labels_printed: boolean; 
                        ship_label: boolean; 
                        priority: string; 
                        ship_to_amz: number; 
                        deadline: Date | null; 
                        warehouse_qty: number;
                        request_id: number| null;}){
            try {
                console.log("Request data: ", request_data);
                let errorMSG = '';
                let editedRequests = [] as any[];

                //Typescript request a default minutes part
                // request_data.deadline += ':00';
                
                let deadline = request_data.deadline !== null ? request_data.deadline : null;
                let notes = request_data.notes !== null ? request_data.notes : null;
                let purchase_order_id = request_data.purchase_order_id !== null ? request_data.purchase_order_id : null;

                if(request_data.request_id){
                    console.log("Request exists", request_data);

                    let editedRequest: {
                        product_id: number; 
                        purchase_order_id: number | null;
                        notes: string | null, 
                        status: string,
                        labels_printed: boolean; 
                        ship_label: boolean; 
                        priority: string; 
                        ship_to_amz: number; 
                        deadline: Date | null; 
                        warehouse_qty: number;
                        request_id: number;
                    } = {
                            request_id: Number(request_data.request_id),
                            product_id: Number(request_data.product_id), 
                            purchase_order_id: purchase_order_id,
                            notes: notes, 
                            status: String(request_data.status), 
                            labels_printed: Boolean(request_data.labels_printed), 
                            ship_label: Boolean(request_data.ship_label), 
                            priority: String(request_data.priority), 
                            ship_to_amz: Number(request_data.ship_to_amz), 
                            deadline: deadline,  
                            warehouse_qty: Number(request_data.warehouse_qty)
                        };

                    console.log("Request to edit: ", editedRequest);

                    await action.editRequest(editedRequest)
                }
                else{
                    let createdRequest: {
                        product_id: number; 
                        purchase_order_id: number | null;
                        notes: string | null, 
                        status: string,
                        labels_printed: boolean; 
                        ship_label: boolean; 
                        priority: string; 
                        ship_to_amz: number; 
                        deadline: Date | null; 
                        warehouse_qty: number;
                    } = {
                        product_id: Number(request_data.product_id), 
                        purchase_order_id: purchase_order_id,
                        notes: notes, 
                        status: String(request_data.status), 
                        labels_printed: Boolean(request_data.labels_printed), 
                        ship_label: Boolean(request_data.ship_label), 
                        priority: String(request_data.priority), 
                        ship_to_amz: Number(request_data.ship_to_amz), 
                        deadline: deadline, 
                        warehouse_qty: Number(request_data.warehouse_qty)
                    };

                    console.log("Request to create: ", createdRequest);

                    await action.addRequest(createdRequest);

                }


                console.log("Edited requests", editedRequests);

                if(editedRequests.length > 0){
                    // await action.batchUpdateRequests(editedRequests);
                    editedRequests = [];
                }
                
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Request Updated', life: 10000});
                
                this.getRequestsToProccess();

                this.requestsUpdateArray = [];

            } catch (error) {
                console.log(error);
                
                this.$toast.add({severity:'error', summary: "Error", detail: error});
                
            }
        },

        getAllowedProducts(){

        },

        onBeforeUnload(event: any){
            console.log(event);
            return  window.confirm('Do you really want to leave? you have unsaved changes!');
        },

        openPicklistAmountDialog(){
            this.picklistAmountDialog = true;

            this.picklistRecipes = this.selectedRecipeLines;
            this.selectedRecipeLines = [];

            console.log("Picklist Recipe", this.picklistRecipes);
        },

        onAmountCellEdit(event: any){
            // console.log(event);

            let {data, index, newData} = event;

            this.picklistRecipes[index] = newData; 
        },

        onPicklistCellEdit(event: any){
            // console.log(event);

            let {data, index, newData} = event;

            this.pickListArray[index] = newData; 
        },

        openPicklistDialog(){
            this.picklistAmountDialog = false;
            this.picklistDialog = true;
            let pickListOutputOBJ = {} as any;
            let pickListInputArray = [] as any[];
            this.pickListArray = [];

            console.log("uBoxes", this.uBoxes);
            console.log("Picklist recipes", this.picklistRecipes);

            // Loop through the selected picklist recipes
            for(const pickRecipe of this.picklistRecipes){
                pickListOutputOBJ = pickRecipe;

                // Grab the output recipe element
                let recOutput = this.recipeElements.find(rec => rec.recipe_id === pickRecipe.recipe_id && rec.type === 'output');
                
                let recInputs = [] as any[];

                // If there is a linked recipe output, grab the recipe inputs
                if(recOutput)
                    recInputs = this.recipeElements.filter(rec => rec.recipe_id === recOutput.recipe_id && rec.type === 'input');
                else{
                    recOutput = this.recipeElements.find(rec => rec.product_id === pickRecipe.product_id && rec.type === 'output');
                    recInputs = this.recipeElements.filter(rec => rec.recipe_id === recOutput.recipe_id && rec.type === 'input');
                }

                console.log("Recipe output", recOutput);
                console.log("recInputs", recInputs);
                let totalArray = [] as any[];
                // pickListInputArray = [];

                if(pickRecipe.purchase_order_id){
                    /* console.log("Recipe linked to a purchase order");
                    console.log(pickRecipe);
                    console.log("Picklist Recipe: ", JSON.stringify(pickRecipe)) */
                    this.uBoxes.forEach(box => {
                        // console.log("Box", JSON.stringify(box));
                        // console.log("Box", box);
                        // if (box.purchase_order_id)
                            // console.log(box.purchase_order_id);

                        if(box.purchase_order_id === 24)
                            console.log(JSON.stringify(box));

                        if (box.purchase_order_id !== pickRecipe.purchase_order_id)
                            return;
                        
                        let recipeTotalOBJ = {} as { product_id: number; total: number; currAmount: number; }
                        let recInput = recInputs.find(rec => rec.product_id === box.product_id);
                        if (recInput === undefined)
                        return;

                        let boxInArray = pickListInputArray.find(boxLine => boxLine.case_id === box.case_id);
                        // Box already being used
                        if(boxInArray)
                        return;

                        // Checks if the 
                        let recIdx = totalArray.findIndex(recLine => recLine.product_id === box.product_id);
                        // console.log("recIdx", recIdx);
                        if(recIdx >= 0){
                            console.log("REC INPUT TOTAL", totalArray[recIdx].total," AND REC INPUT CURR AMOUNT", totalArray[recIdx].currAmount);
                            
                            // The total already exists in the array. Subract the box amount by the total amount until
                            // the total reaches zero
                            if(totalArray[recIdx].currAmount >= totalArray[recIdx].total)
                                return;

                            totalArray[recIdx].currAmount += box.units_per_case;
                            box.procName = pickRecipe.product_name;
                            box.procAmount = pickRecipe.casesToPick;
                            box.procUnitsPerCase = pickRecipe.units_per_case;
                            box.notes = pickRecipe.notes;
                            console.log("BOX PROC NAME", box.procName);
                            console.log("BOX ID", box.case_id);
                            pickListInputArray.push(box);
                            // this.pickListArray.push(box);
                        } else {
                            // The total does not exist in the array. Add it.
                            const totalUnits = pickRecipe.casesToPick * pickRecipe.units_per_case * recInput.qty;
                            const product_id = box.product_id;
                            recipeTotalOBJ = { product_id: product_id, total: totalUnits, currAmount: box.units_per_case };
                            totalArray.push(recipeTotalOBJ);
                            console.log("totalArray", totalArray);
                            // Push the first box into the array
                            box.procName = pickRecipe.product_name;
                            box.procAmount = pickRecipe.casesToPick;
                            box.procUnitsPerCase = pickRecipe.units_per_case;
                            box.notes = pickRecipe.notes;
                            console.log("BOX PROC NAME", box.procName);
                            console.log("BOX ID", box.case_id);
                            pickListInputArray.push(box);
                        }
                    });
                } else {
                    console.log("Recipe not linked to a purchase order")
                    for(const box of this.uBoxes){
                        if (box.purchase_order_id)
                            continue;

                        // console.log("Box", box);
                        let recipeTotalOBJ = {} as { product_id: number; total: number; currAmount: number; }
                        let recInput = recInputs.find(rec => rec.product_id === box.product_id);
                        if (recInput === undefined)
                        continue;

                        let boxInArray = pickListInputArray.find(boxLine => boxLine.case_id === box.case_id);
                        // Box already being used
                        if(boxInArray)
                        continue;

                        // Checks if the 
                        let recIdx = totalArray.findIndex(recLine => recLine.product_id === box.product_id);
                        // console.log("recIdx", recIdx);
                        if(recIdx >= 0){
                            console.log("REC INPUT TOTAL", totalArray[recIdx].total," AND REC INPUT CURR AMOUNT", totalArray[recIdx].currAmount);
                            
                            // The total already exists in the array. Subract the box amount by the total amount until
                            // the total reaches zero
                            if(totalArray[recIdx].currAmount >= totalArray[recIdx].total)
                                continue;

                            totalArray[recIdx].currAmount += box.units_per_case;
                            box.procName = pickRecipe.product_name;
                            box.procAmount = pickRecipe.casesToPick;
                            box.procUnitsPerCase = pickRecipe.units_per_case;
                            box.notes = pickRecipe.notes;
                            console.log("BOX PROC NAME", box.procName);
                            console.log("BOX ID", box.case_id);
                            pickListInputArray.push(box);
                            // this.pickListArray.push(box);
                        } else {
                            // The total does not exist in the array. Add it.
                            const totalUnits = pickRecipe.casesToPick * pickRecipe.units_per_case * recInput.qty;
                            const product_id = box.product_id;
                            recipeTotalOBJ = { product_id: product_id, total: totalUnits, currAmount: box.units_per_case };
                            totalArray.push(recipeTotalOBJ);
                            console.log("totalArray", totalArray);
                            // Push the first box into the array
                            box.procName = pickRecipe.product_name;
                            box.procAmount = pickRecipe.casesToPick;
                            box.procUnitsPerCase = pickRecipe.units_per_case;
                            box.notes = pickRecipe.notes;
                            console.log("BOX PROC NAME", box.procName);
                            console.log("BOX ID", box.case_id);
                            pickListInputArray.push(box);
                        }

                        // console.log("Box", box);
                    }
                }
                console.log("INPUT ARRAY", pickListInputArray);
                // this.pickListArray.push({ caseName: pickRecipe.product_name, pickListInputArray});
            }
            const keyArray = ['product_id', 'units_per_case', 'location', 'procName'];
            this.pickListArray = helper.groupItemsByKey(pickListInputArray, keyArray);
            
            this.pickListArray.forEach(inputLine => {
                const locKey = this.locations.find(loc => loc.location_id === inputLine.location_id);
                
                if(locKey)
                inputLine.locationName = locKey.name;
            })
            console.log("PICK LIST ARRAY", this.pickListArray);
        },

        exportToPDF(){
            html2pdf(document.getElementById("element-to-convert"), {
                margin: 1,
                filename: "picklist.pdf",
                jsPDF: { orientation: 'landscape' },
            });
        },

        addRequestSetup(){
            this.newRequestDialog = true;

            this.requestToProcess = {
                            notes: '', 
                            status: '5 ON ORDER', 
                            labels_printed: false, 
                            ship_label: false, 
                            priority: '6 Prep For Later', 
                            ship_to_amz: 0, 
                            deadline: null, 
                            warehouse_qty: 0,
                            product_id: null,
                            purchase_order_id: null,
                            request_id: null,
                        };
        },

        async onNewRequestSave(){
            console.log("Request on save: ", this.requestToProcess)
            /* let request: {
                    product_id: number; 
                    purchase_order_id: number | null;
                    notes: string, 
                    status: string,
                    labels_printed: boolean; 
                    ship_label: boolean; 
                    priority: string; 
                    ship_to_amz: number; 
                    deadline: Date | null; 
                    warehouse_qty: number;
                    request_id: number;
                };
            if(this.requestToProcess.deadline){
                request = {
                    request_id: Number(this.requestToProcess.request_id),
                    product_id: Number(this.requestToProcess.product_id), 
                    purchase_order_id: Number(this.requestToProcess.purchase_order_id),
                    notes: String(this.requestToProcess.notes), 
                    status: String(this.requestToProcess.status), 
                    labels_printed: Boolean(this.requestToProcess.labels_printed), 
                    ship_label: Boolean(this.requestToProcess.ship_label), 
                    priority: String(this.requestToProcess.priority), 
                    ship_to_amz: Number(this.requestToProcess.ship_to_amz), 
                    deadline: new Date(this.requestToProcess.deadline.getDate()), 
                    warehouse_qty: Number(this.requestToProcess.warehouse_qty)
                };
            } else {
                request = {
                    request_id: Number(this.requestToProcess.request_id),
                    product_id: Number(this.requestToProcess.product_id), 
                    purchase_order_id: Number(this.requestToProcess.purchase_order_id),
                    notes: String(this.requestToProcess.notes), 
                    status: String(this.requestToProcess.status), 
                    labels_printed: Boolean(this.requestToProcess.labels_printed), 
                    ship_label: Boolean(this.requestToProcess.ship_label), 
                    priority: String(this.requestToProcess.priority), 
                    ship_to_amz: Number(this.requestToProcess.ship_to_amz), 
                    deadline: null, 
                    warehouse_qty: Number(this.requestToProcess.warehouse_qty)
                }; 
            } */
            await this.saveUpdatedRequests(this.requestToProcess);
            
            this.requestToProcess = {
                            notes: '', 
                            status: '5 ON ORDER', 
                            labels_printed: false, 
                            ship_label: false, 
                            priority: '6 Prep For Later', 
                            ship_to_amz: 0, 
                            deadline: null, 
                            warehouse_qty: 0,
                            product_id: null,
                            purchase_order_id: null,
                            request_id: null,
                        };
            this.newRequestDialog = false;
        },

        getRequestPriority(reqDeadline: Date | null){
            
            let today = new Date();
            let compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if(reqDeadline){
                // console.log("Deadline: ", new Date(reqDeadline).getMonth() + 1, new Date(reqDeadline).getDate(), new Date(reqDeadline).getFullYear());
                // console.log("Compare Date: ", compareDate.getMonth() + 1, compareDate.getDate(), compareDate.getFullYear());
                // console.log("Tomorrow: ", compareDate.getMonth() + 1, compareDate.getDate() + 1 , compareDate.getFullYear());
                // console.log("Deadline Date: ", new Date(reqDeadline));
                // console.log("Tomorrow Date: ", new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()));
                // console.log("Tomorrow Date: ", new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 1));
                // console.log("Deadline < Compare Date: ", new Date(reqDeadline).valueOf() < compareDate.valueOf()); 
                // console.log("Deadline > Compare Date: ", new Date(reqDeadline).valueOf() > compareDate.valueOf());
                // console.log("Deadline <= Compare Date: ", new Date(reqDeadline).valueOf() <= compareDate.valueOf()); 
                // console.log("Deadline >= Compare Date: ", new Date(reqDeadline).valueOf() >= compareDate.valueOf()); 
                // console.log("Deadline == Compare Date: ", new Date(reqDeadline).valueOf() == new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()).valueOf()); 

                if (compareDate.valueOf() === new Date(reqDeadline).valueOf()) {
                    return '0 MUST GO OUT TODAY';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 1).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 5).valueOf()){
                    return '1 This Week';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 6).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 14).valueOf()){
                    return '2 Weeks';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 15).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 21).valueOf()){
                    return '3 Weeks';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 22).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 31).valueOf()){
                    return '4 This Month';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 32).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 60).valueOf()){
                    return '5 Next Month';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 61).valueOf() <= new Date(reqDeadline).valueOf()){
                    return '6 Several Months';
                } else if (compareDate.valueOf() > new Date(reqDeadline).valueOf()) {
                    return '-1 LATE';
                } else {
                    return 'TBD';
                }
            } else {
                return 'TBD';
            }
        },

        formatDate(rawDate: Date | null) {
            //momentDate = this.eCase.date_received;
            //console.log("TESTING DATES: ", date);
            // console.log("Raw Date: ", rawDate);
            if(rawDate){
                const displayDate = new Date(rawDate);
                // console.log('Formatted Date: ', rawDate.getFullYear()+'-'+(rawDate.getMonth()+1)+'-'+rawDate.getDate());

                return (displayDate.getMonth()+1) + '/' + displayDate.getDate() + '/' + displayDate.getFullYear();
            }
        },

        /**
         * If the user has selected a product key, for a new request, only show purchase orders for the correct vendor that 
         * contain the correct raw products with no plan
         * @param productId The Id of the product key that the user wishes to create a request for
         * 
         * Created by Gabe de la Torre-Garcia
         * 
         * Edited On: 4-17-25
         */
        getUsablePO(){
            console.log("Get Usable PO");
            console.log(JSON.stringify(this.requestToProcess));
            console.log("Request Product Id: ",this.requestToProcess['product_id']);
            if(this.requestToProcess.product_id !== null){
                console.log('Product Id chosen')
                const productKey = this.procProducts.find(product => product.product_id === this.requestToProcess.product_id);
                return this.purchaseOrders.filter(po => po.vendor_id === productKey.vendor_id && this.uBoxes.filter(box => box.purchase_order_id === po.purchase_order_id && box.request_id === null).length > 0);
            } else {
                console.log('Product Id NOT chosen')
                return this.purchaseOrders;
            }
                
        },

        /**
         * If the user has selected a purchase order, grab only products with raw products assigned to that purchase order
         * @param poId The user selected purchase order Id for a new request
         * 
         * Created By Gabe de la Torre-Garcia
         * 
         * Edited On: 4-17-25
         */
        getUsableProducts(){
            console.log("Get Usable Product");
            console.log(JSON.stringify(this.requestToProcess));
            console.log("Request PO Id: ",this.requestToProcess.purchase_order_id);
            if(this.requestToProcess.purchase_order_id !== null){
                console.log('PO Id chosen')
                const purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === this.requestToProcess.purchase_order_id)
                console.log(this.uBoxes.filter(box => box.purchase_order_id === this.requestToProcess.purchase_order_id && box.request_id === null));
                return this.procProducts.filter(product => product.vendor_id === purchaseOrder.vendor_id && this.uBoxes.filter(box => box.purchase_order_id === this.requestToProcess.purchase_order_id && box.request_id === null).length > 0);
            } else{
                console.log('PO Id NOT chosen')
                return this.procProducts;
            }
                
        },

        getTotalCases(poId: number | null, productId: number){
            
        },

        async toggleStatus(){
            if(this.statusFilter === '0 COMPLETED')
                this.statusFilter = ''
            else 
                this.statusFilter = '0 COMPLETED'

            await this.getRequestsToProccess();
        },

        statusFilterSeverity(status: string){
            // console.log(JSON.stringify(status));
            if(status === '0 COMPLETED')
                return 'success';
            else 
                return 'info';
        }

    },
}
</script>
<style lang="">
    
</style>