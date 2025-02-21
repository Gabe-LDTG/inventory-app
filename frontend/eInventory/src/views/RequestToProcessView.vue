<template>
    <div class="card">
        <Toast />

        <!-- Sorting was messing with the cell saving function. Might implement later -->
        <!-- sortMode="single" sortField="priority" :sortOrder=1 -->
        <DataTable ref="dt" :value="R2Parray" v-model:selection="selectedCaseLines"
        showGridlines stripedRows :filters="filters"
        :loading="loading" :paginator="true" :rows="40" :rowStyle="requestRowStyle"
        scrollable scrollHeight="650px" removableSort
        editMode="cell" @cell-edit-complete="onRequestCellEdit"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h4 class="m-0">Request To Proccess List</h4>
                    <Button label="Pick List" v-tooltip.top="'Generate a new pick list'" @click="openPicklistAmountDialog" icon="pi pi-plus" severity="info" class="mr-2" :disabled="!selectedCaseLines || !selectedCaseLines.length" />
                    <span class="p-input-icon-right">
                        <!-- <i class="pi pi-search" /> -->
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </span>
                </div>
            </template>
            <template #empty>No cases in the request to process</template>
            <template #loading>Loading Requests</template>


            <template #footer>
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <div v-if="requestsUpdateArray.length === 1" class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h4 class="m-0">There is 1 request to update.</h4>
                    </div>
                    <div v-else class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">There are {{ requestsUpdateArray.length }} requests to update.</h4>
                    </div>

                    <Button label="Save" v-tooltip.top="'Save the edited requests'" @click="saveUpdatedRequests" severity="success" class="mr-2" :disabled="requestsUpdateArray.length < 1" />
                </div>
            </template>


            <Column selectionMode="multiple" frozen alignFrozen="left" headerStyle="width: 3rem"/>
            <Column field="notes" header="Comments">
                <template #body="{data}">
                    {{ data.notes }}
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
                    <Tag :style="priorityStyle(data.priority)">{{ data.priority }}</Tag>
                </template>
                <template #editor="{data}">
                    <div class="container">
                        <Dropdown v-model="data.priority"
                        placeholder="Select a priority" class="w-full md:w-14rem" editable
                        :options="priorities"/>
                        </div>
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
                <template #body="{data}">
                    {{ data.deadline }}
                </template>
                <template #editor="{data}">
                    <Calendar dateFormat="yy-mm-dd" v-model="data.deadline"/>
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
            <Column field="amount" header="Total QTY" class="font-bold"></Column>
            <!-- <Column field="location" header="WH Location" style="min-width: 200px"></Column> -->
            <Column field="purchase_order_name" header="Purchase Order #" style="min-width: 200px" class="font-bold"></Column>
            <Column field="product_name" header="Name" sortable style="min-width: 250px; min-height: 1000px;" frozen alignFrozen="right" class="font-bold"></Column>
            <Column field="fnsku" header="FNSKU" class="font-bold"></Column>
            <Column field="asin" header="ASIN" class="font-bold"></Column>
            <Column field="units_per_case" header="Units per Case" class="font-bold"></Column>
            <Column field="bag_size" header="Bags" class="font-bold"></Column>
            <Column field="box_type" header="Boxes" class="font-bold"></Column>
        </DataTable>


    </div>

    <Dialog v-model:visible="picklistAmountDialog" :style="{width: '800px'}" header="How many cases to create?" :modal="true">
        <DataTable ref="dt" :value="picklistCases" 
        showGridlines stripedRows 
        editMode="cell" @cell-edit-complete="onAmountCellEdit"
        >
            <Column field="name" header="Name" style="min-width: 250px;" class="font-bold"></Column>
            <Column field="amount" header="Total QTY" class="font-bold"></Column>
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
                <Column field="name" header=" Box Name" />
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
            <Button label="Save Picklist" icon="pi pi-check" text disabled @click="" />
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

            // REQUEST TO PROCESS VARIABLES
            requestToProcess: {} as {
                request_id: number; 
                case_id: number; 
                notes: string, 
                status: string,
                labels_printed: boolean; 
                ship_label: boolean; 
                priority: string; 
                ship_to_amz: number; 
                deadline: Date; 
                warehouse_qty: number;
            },
            R2Parray: [] as any[],
            requestsToProcess: [] as any[],
            requestsUpdateArray: [] as any[],

            // PICKLIST VARIABLES
            picklists: [] as any[],
            picklistCases: [] as any[],
            picklistBoxes: [] as any[],
            picklistAmountDialog: false,
            picklistDialog: false,
            pickListArray: [] as any[],
            
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
        window.addEventListener('beforeunload', function onBeforeUnload(event: any){
            console.log(event);
            return  window.confirm('Do you really want to leave? you have unsaved changes!');
        });
        if(this.requestsUpdateArray.length > 0){
            window.onbeforeunload = function() {
                return "Data will be lost if you leave the page, are you sure?";
            };
        }
        
    },
    mounted(){
        //this.initVariables();
    },
    beforeUnmount(){ 
        console.log("BEFORE UNMOUNTED") 

        if(this.requestsUpdateArray.length > 0){
            window.confirm('Do you really want to leave? you have unsaved changes!');
        };

    },
    unmounted(){ console.log("UNMOUNTED") },
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
                this.uBoxes = await action.getRequestedBoxes();
                this.pCases = await action.getRequestedCases();

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

        async getRequestsToProccess(){
            try {
                this.requestsToProcess = await action.getRequests();

                // let cases = helper.groupProducts(this.pCases);
                // console.log("cases", cases);

                const casesWithR2PsAndPOs = [] as any[];

                for(const c of this.pCases) {
                    // let location = this.locations.find(l => l.location_id  === c.location);
                    if (c.location)
                        continue;

                    let productKey = this.products.find(p => p.product_id === c.product_id);
                    let purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === c.purchase_order_id);
                    // console.log("purchase order", purchaseOrder);
                    let request = this.requestsToProcess.find(req => req.purchase_order_id === c.purchase_order_id && req.product_id === c.product_id);
                    // console.log("request", request);
                    // if(!location)
                    //     location = {};
                    if(!purchaseOrder)
                        purchaseOrder = {};
                    if(!request)
                        request = {
                            notes: null, 
                            status: '5 ON ORDER', 
                            labels_printed: false, 
                            ship_label: false, 
                            priority: '6 Prep For Later', 
                            ship_to_amz: 0, 
                            deadline: null, 
                            warehouse_qty: 0
                        };

                    casesWithR2PsAndPOs.push({ box: c, key: productKey, po: purchaseOrder, req: request });
                }

                // console.log("casesWithR2PsAndPOs",casesWithR2PsAndPOs);

                let returnArray = casesWithR2PsAndPOs.map(({ box, key, po, req }) => ({
                    ...box,
                    purchase_order_name: po.purchase_order_name,
                    ...req,
                    bag_size: key.bag_size,
                    box_type: key.box_type,
                    fnsku: key.fnsku,
                    asin: key.asin,
                    casesToPick: 0,
                }));
                console.log("returnArray", returnArray);

                const keyStringArray = ['product_id', 'purchase_order_name', 'request_id']

                console.log("returnArray grouped", helper.groupItemsByKey(returnArray, keyStringArray));

                this.R2Parray = helper.groupItemsByKey(returnArray, keyStringArray);
            } catch (error) {
                console.log(error);
            }
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
            }
        },

        priorityStyle(data: string){
            // console.log("DATA ",data);
             if(data === '0 MUST GO OUT TODAY'){
                return { font: 'bold', backgroundColor: '#4a148c', fontSize: '14px' };
            } else if (data === '1 ASAP'){
                return { font: 'bold', backgroundColor: '#5e35b1', fontSize: '14px' };
            } else if (data === '1 Prep to Make Space (Large Qty)'){
                return { font: 'bold', backgroundColor: '#5e35b1', fontSize: '14px' };
            } else if (data === '2 Could Go Out Today'){
                return { font: 'bold', backgroundColor: '#7e57c2', fontSize: '14px' };
            } else if (data === '2 Prep to Make Space'){
                return { font: 'bold', backgroundColor: '#7e57c2', fontSize: '14px' };
            } else if (data === '3 Could Go Out Tomorrow'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#d1c4e9', fontSize: '14px' };
            } else if (data === '3 Prep to Make Space'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#d1c4e9', fontSize: '14px' };
            } else if (data === '4 Could Go Out This Week'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#ede7f6', fontSize: '14px' };
            } else if (data === '5 Could Go Out This Month'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#f5f5f5', fontSize: '14px' };
            } else if (data === '6 Prep For Later'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#fafafa', fontSize: '14px' };
            }
        },

        onRequestCellEdit(event: any){
            console.log(event);

            let {data, index, newData} = event;

            if (data.notes === newData.notes && data.status === newData.status && data.labels_printed === newData.labels_printed && data.ship_label === newData.ship_label && data.priority === newData.priority && data.ship_to_amz === newData.ship_to_amz && data.deadline === newData.deadline && data.warehouse_qty === newData.warehouse_qty)
                console.log("EQUAL");
            else{
                console.log("EDITS");
                this.R2Parray[index] = newData;
                const request = this.requestsUpdateArray.find(req => req.case_id === newData.case_id && req.purchase_order_id === newData.purchase_order_id);

                if (!request)
                    this.requestsUpdateArray.push(newData);
            }
                
        },

        async saveUpdatedRequests(){
            try {
                console.log("UPDATED REQUEST ARRAY", this.requestsUpdateArray);
                let newRequests = [] as any[];
                let editedRequests = [] as any[];

                for(const request of this.requestsUpdateArray){
                    let requestMap = [] as any[];

                    if(request.request_id){
                        requestMap = [
                            request.request_id,
                            request.product_id, 
                            request.purchase_order_id,
                            request.notes, 
                            request.status, 
                            request.labels_printed, 
                            request.ship_label, 
                            request.priority, 
                            request.ship_to_amz, 
                            request.deadline, 
                            request.warehouse_qty
                        ];
                        editedRequests.push(requestMap);
                    }
                    else{
                        requestMap = [
                            request.product_id, 
                            request.purchase_order_id, 
                            request.notes, 
                            request.status, 
                            request.labels_printed, 
                            request.ship_label, 
                            request.priority, 
                            request.ship_to_amz, 
                            request.deadline, 
                            request.warehouse_qty
                        ];
                        newRequests.push(requestMap);
                    }
                        
                };

                console.log("New requests", newRequests, " and edited requests", editedRequests);

                if(newRequests.length > 0){
                    await action.batchInsertRequests(newRequests);
                    newRequests = [];
                }

                if(editedRequests.length > 0){
                    await action.batchUpdateRequests(editedRequests);
                    editedRequests = [];
                }
                
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Request(s) Updated', life: 3000});
                
                this.requestsUpdateArray = [];


            } catch (error) {
                console.log(error);
                this.$toast.add({severity:'error', summary: "Error", detail: error});
                
            }
        },

        onBeforeUnload(event: any){
            console.log(event);
            return  window.confirm('Do you really want to leave? you have unsaved changes!');
        },

        openPicklistAmountDialog(){
            this.picklistAmountDialog = true;

            this.picklistCases = this.selectedCaseLines;
            this.selectedCaseLines = [];

            console.log("Picklist Cases", this.picklistCases);
        },

        onAmountCellEdit(event: any){
            // console.log(event);

            let {data, index, newData} = event;

            this.picklistCases[index] = newData; 
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

            for(const pickCase of this.picklistCases){
                pickListOutputOBJ = pickCase;
                const recOutput = this.recipeElements.find(rec => rec.product_id === pickCase.product_id && rec.type === 'output');
                const recInputs = this.recipeElements.filter(rec => rec.recipe_id === recOutput.recipe_id && rec.type === 'input');

                console.log("recInputs", recInputs);
                let totalArray = [] as any[];
                // pickListInputArray = [];

                for(const box of this.uBoxes){
                    if (box.purchase_order_id !== pickCase.purchase_order_id)
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
                        box.procName = pickCase.name;
                        box.procAmount = pickCase.casesToPick;
                        box.procUnitsPerCase = pickCase.units_per_case;
                        box.notes = pickCase.notes;
                        console.log("BOX PROC NAME", box.procName);
                        console.log("BOX ID", box.case_id);
                        pickListInputArray.push(box);
                        // this.pickListArray.push(box);
                    } else {
                        // The total does not exist in the array. Add it.
                        const totalUnits = pickCase.casesToPick * pickCase.units_per_case * recInput.qty;
                        const product_id = box.product_id;
                        recipeTotalOBJ = { product_id: product_id, total: totalUnits, currAmount: 0 };
                        totalArray.push(recipeTotalOBJ);
                        console.log("totalArray", totalArray);
                        // Push the first box into the array
                        box.procName = pickCase.name;
                        box.procAmount = pickCase.casesToPick;
                        box.procUnitsPerCase = pickCase.units_per_case;
                        box.notes = pickCase.notes;
                        console.log("BOX PROC NAME", box.procName);
                        console.log("BOX ID", box.case_id);
                        pickListInputArray.push(box);
                    }

                    // console.log("Box", box);
                }
                console.log("INPUT ARRAY", pickListInputArray);
                // this.pickListArray.push({ caseName: pickCase.name, pickListInputArray});
            }
            const keyArray = ['product_id', 'units_per_case', 'location', 'procName'];
            this.pickListArray = helper.groupItemsByKey(pickListInputArray, keyArray);
            
            this.pickListArray.forEach(inputLine => {
                const locKey = this.locations.find(loc => loc.location_id === inputLine.location);
                
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
    },
}
</script>
<style lang="">
    
</style>