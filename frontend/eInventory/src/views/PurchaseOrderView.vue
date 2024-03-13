<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts" />
                </template>

                <template #end>
                    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @uploader="onUpload"/>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>
            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" dataKey="purchase_order_id"
                :paginator="true" :rows="10" :filters="filters"
                :selectAll="false"
                removableSort
                showGridlines
                stripedRows
                :loading="loading"
                :expandedRows="expandedRows" @rowExpand="onRowExpand"
                :virtualScrollerOptions="{ itemSize: 46 }"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Purchase Orders</h4>
						<span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>

                <template #loading> Loading purchase orders. Please wait. </template>

                <template #empty> No purchase orders found. </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

                <Column expander style="width: 5rem" />

                <Column field="purchase_order_name" header="Purchase Order" sortable></Column>

                <Column field="vendor" header="Vendor" sortable></Column>

                <Column field="status" header="Status" sortable></Column>

                <Column field="notes" header="Notes" sortable></Column>

                <Column field="date_ordered" header="Date Ordered" sortable></Column>

                <Column field="date_received" header="Date Received" sortable></Column>

                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editPurchaseOrder(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>

                <template #expansion="slotProps">
                    <div class="p-3">
                        <h5>Products in Purchase Order {{ slotProps.data.purchase_order_name }}</h5>
                        <DataTable :value="slotProps.data.orders" >
                        
                        </DataTable>
                    </div>
                </template>

            </DataTable>
        </div>

        <Dialog v-model:visible="purchaseOrderDialog" :style="{width: '1000px'}" header="Purchase Order Details" :modal="true" class="p-fluid">

            <div class="field">
                <label for="purchase_order_name">Purchase Order</label>
                <InputText id="name" v-model.trim="purchaseOrder.purchase_order_name" required="true" autofocus :class="{'p-invalid': submitted && !purchaseOrder.purchase_order_name}" />
                <small class="p-error" v-if="submitted && !purchaseOrder.purchase_order_name">Name is required.</small>
            </div>

            <div class="field">
                <label for="vendor">Vendor</label>
                <InputText id="vendor" v-model="purchaseOrder.vendor" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="status">Status</label>
                <InputText id="status" v-model="purchaseOrder.status" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="purchaseOrder.notes" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="date_ordered">Date Ordered</label>
                <Calendar id="date_ordered" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_ordered"/>
            </div>

            <div class="field">
                <label for="date_received">Date received</label>
                <Calendar id="date_received" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_received"/>
            </div>

            <div class="field">
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Purchase Order Product(s):</h3>
            </div>

            
            <template class="caseCard" v-for="(bCase, counter) in bulkCases">

                <div class ="caseCard">
                    <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(counter)"/>

                    <h4 class="flex justify-content-start font-bold w-full">Product #{{ counter + 1 }}</h4><br>
                    <div class="block-div">
                        <div class="field">
                            <label for="name">Name:</label>
                            <Dropdown v-model="bCase.product_id" required="true" 
                            placeholder="Select a Product" class="md:w-14rem" editable
                            :options="products"
                            optionLabel="name"
                            filter
                            @change="bCase.units_per_case = onProductSelection(bCase.product_id); bCase.total = bCase.amount*bCase.units_per_case;"
                            optionValue="product_id"
                            :virtualScrollerOptions="{ itemSize: 38 }"
                            :class="{'p-invalid': submitted && !bCase.product_id}" 
                            >

                            <template #value="slotProps">
                                    <div v-if="slotProps.value" class="flex align-items-center">
                                        <div>{{ slotProps.value.product_id }}</div>
                                    </div>
                                    <span v-else>
                                        {{ slotProps.placeholder }}
                                    </span>
                                </template>
                                <template #option="slotProps">
                                    <div>{{ slotProps.option.name }} - {{ slotProps.option.upc }}</div>
                                </template>
                            </Dropdown>
                            <small class="p-error" v-if="submitted && !bCase.product_id">Name is required.</small>
                        </div>

                        <div class="field">
                            <label for="qty">QTY:</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            :class="{'p-invalid': submitted && !bCase.units_per_case}"
                            v-model="bCase.units_per_case" showButtons
                            @input="bCase.total = bCase.amount*bCase.units_per_case"/>
                            <small class="p-error" v-if="submitted && !bCase.units_per_case">Amount is required.</small>
                        </div>

                        <div class="field">
                            <label for="notes">Notes:</label>
                            <InputText id="notes" v-model="bCase.notes" rows="3" cols="20" />
                        </div>

                        <div v-show="!bCase.case_id" class="field">
                            <label for="amount">How Many Boxes to Order?</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            v-model="bCase.amount" showButtons
                            @input="bCase.total = bCase.amount*bCase.units_per_case"/>
                        </div>

                        <div class="field">
                            <label for="total">Total</label>
                            <InputNumber v-model="bCase.total" 
                            inputId="stacked-buttons" showButtons
                            @update="bCase.amount = bCase.total/bCase.units_per_case"/>
                        </div>
                    </div>

                </div>
            </template>

                <Button label="Add another product" text @click="addBulkLine"/>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="validate" />
            </template>
        </Dialog>
        
	</div>
</template>

<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import importAction from "../components/utils/importUtils";
//import Papa from "papaparse";

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712

export default {
    data() {
        return {
            //STUFF THAT WE'RE USING ON THIS VIEW
            //DATATABLE VARIABLES
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            columns: [] as any[],
            expandedRows: [],

            //DIALOG VARIABLES
            submitted: false,

            //PURCHASE ORDER VARIABLES
            purchaseOrders: [] as any[],
            purchaseOrder: {} as any,
            purchaseOrderDialog: false,
            selectedPurchaseOrder: [] as any[],

            //PRODUCTS VARIABLES
            products: [] as any[],
            product: {} as any,
            selectedProducts: [] as any[],

            //CASE VARIABLES
            cases: [] as any[],
            bulkCases: [] as any[],
            amount: 1,

            //MISC VARIABLES
            today: "",

            //STUFF FROM THE PRODUCT VIEW THAT ISN'T USED

            productDialog: false,
            productInfoDialog: false,
            deleteProductDialog: false,
            deleteProductsDialog: false,
            
            statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ],
            
            validFnsku: true,

            working: false,
            loading: false,

            filtered: false,

            unprocProducts: [],
            
            recipeProducts:[] as any[],

            toggleProduct: {} as any,

        }
    },
    created() {
        this.initFilters();
    },
    mounted() {
        console.log('Mounted');
        this.getPurchaseOrders();
        this.getUnprocessedProducts();
        this.getUnprocessedBoxes();
        this.getDate();
    },
    methods: {
        async getPurchaseOrders(){
            try {
                this.loading = true;
                this.purchaseOrders = await action.getPurchaseOrders();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getUnprocessedProducts(){
            try {
                this.products = await action.getUnprocProducts();
            } catch (err) {
                console.log(err);
            }
        },

        async getUnprocessedBoxes(){
            try {
                this.cases = await action.getUnprocCases();
            } catch (error) {
                console.log(error);
            }
        },

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        openNew() {
            this.purchaseOrder = {};
            this.bulkCases = []
            this.amount = 1;
            this.purchaseOrder.date_ordered = this.today;
            
            this.newBulkArray();

            this.submitted = false;
            this.purchaseOrderDialog = true;
        },
        newBulkArray(){

            for(let idx = 0; idx < 3; idx++){
                this.addBulkLine();
            }
        },
        addBulkLine(){
            this.bulkCases.push(
                    {
                    name: '',
                    amount: 1,
                    }
                )
        },
        deleteBulkLine(counter: any){
            this.bulkCases.splice(counter,1);
        },
        hideDialog() {
            this.purchaseOrderDialog = false;
            this.submitted = false;
        },
        getDate(){
            const date = new Date();
            this.today = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
            console.log("TODAYS DATE ", date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
        },
        onProductSelection(productId: any){
            console.log("PRODUCT ID", productId);

            for (let idx = 0; idx < this.products.length; idx++) {
                if (this.products[idx].product_id == productId) {
                    console.log("PRODUCT NAME: ", this.products[idx].name);
                    return this.products[idx].default_units_per_case;
                }
            }
        },
        validate() {
            this.savePurchaseOrder();
        },
        async savePurchaseOrder() {
            //this.submitted = true;

			if (this.purchaseOrder.purchase_order_name.trim()) {
                if (this.purchaseOrder.purchase_order_id) {
                    await this.confirmEdit();
                }
                else {
                    await this.confirmCreate();
                }

                this.purchaseOrderDialog = false;
                //this.selectedProducts = null;
                this.purchaseOrder = {};
            }
        },
        async confirmEdit(){
            try {
                this.purchaseOrders[this.findIndexById(this.purchaseOrder.purchase_order_id)] = this.purchaseOrder;
                console.log(this.purchaseOrders[this.findIndexById(this.purchaseOrder.purchase_order_id)]);

                console.log("PURCHASE ORDER BEFORE AWAIT",this.purchaseOrder);

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);
                
                console.log("PURCHASE ORDER AFTER AWAIT",this.purchaseOrder);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Updated', life: 3000});
                return editedPurchaseOrder;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        async confirmCreate(){
            try {
                this.purchaseOrders.push(this.purchaseOrder);
                let addedPurchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);


                try {
                    console.log(this.bulkCases);
                    for(let caseIdx = 0; caseIdx < this.bulkCases.length; caseIdx++){
                        //console.log(this.bulkCases[caseIdx].case_id);
                        if(this.bulkCases[caseIdx].product_id){
                            console.log("LAST INSERT ID", addedPurchaseOrderId);
                            this.bulkCases[caseIdx].purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];
                            this.bulkCases[caseIdx].status = 'Ordered';

                            console.log(this.bulkCases[caseIdx]);

                            for(let amountIdx = 0; amountIdx < this.bulkCases[caseIdx].amount; amountIdx++){
                                console.log("CASE ADDED ", this.bulkCases[caseIdx]);
                                await action.addCase(this.bulkCases[caseIdx]);
                            }
                        }
                    }
                    await action.getCases();

                } catch (error) {
                    this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
                }

                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Created', life: 3000});

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST
                console.log("ADDED PURCHASE ORDER ", addedPurchaseOrderId);
                await this.getPurchaseOrders();

                return addedPurchaseOrderId;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        editPurchaseOrder(purchaseOrder: any) {
            this.purchaseOrder = {...purchaseOrder}; //ASK MICHAEL
            this.purchaseOrderDialog = true;
        },
        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Purchase Order Expanded', detail: event.data.purchase_order_name, life: 3000 });
            
            console.log(event.data);

            let map = [] as any[];
            let recipe = [] as any[];
            this.recipeProducts = [];

            console.log("EVENT ARRAY", event.data.purchase_order_id);
            console.log("CASES", this.cases);


            for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                if(this.cases[caseIdx].purchase_order_id == event.data.purchase_order_id){
                    console.log(this.cases[caseIdx].name);
                }
            }

            return recipe;
        },

        //STUFF THAT HASN'T BEEN CHECKED AND MOVED OVER YET-------------------------------------------------

        confirmDeleteProduct(product: any) {
            this.product = product;
            this.deleteProductDialog = true;
        },
        async deleteProduct() {
            try {
                //let stop = this.validateDelete(this.product);
                //console.log(stop);
                this.deleteProductDialog = false;

                const deletedProduct = await action.deleteProduct(this.product.product_id);
                
                this.products = this.products.filter(val => val.product_id !== this.product.product_id);
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Deleted', life: 3000});

                this.product = {};
                return deletedProduct;
            } catch (err) {
                console.log(err);

                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        findIndexById(id: number) {
            let index = -1;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].product_id === id) {
                    index = i;
                    break;
                }
            }

            return index;
        },
        createId() {
            let id = '';
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for ( var i = 0; i < 5; i++ ) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        },
        //https://codesandbox.io/p/sandbox/primevue-fileuploader-custom-q2dqhh?file=%2Fsrc%2FFileUploadDemo.vue%3A42%2C7-42%2C27
        onUpload(event: any) {
            importAction.onUpload(event, 'Processed Product Key');
            
            
        },
        exportCSV() {
            //this.$refs.dt.exportCSV();
            console.log("Functionality not finished");
        },
        confirmDeleteSelected() {
            this.deleteProductsDialog = true;
        },
        async deleteSelectedProducts() {
            try {
                //WHEN THERE ARE VALUES THAT CAN BE DELETED FIRST, NO TOAST MESSAGE GOES UP, BUT THE ITEMS GET
                //REMOVED. TALK TO MICHAEL ABOUT IT TOMORROW
                if(this.selectedProducts){
                    for(let i=0; i<this.selectedProducts.length; i++){
                    //stop = this.validateDelete(this.selectedProducts[i]);

                    await action.deleteProduct(this.selectedProducts[i].product_id);
                    this.products = this.products.filter(val => !this.selectedProducts.includes(val));
                    this.$toast.add({severity:'success', summary: 'Successful', detail: this.selectedProducts[i].name+' Deleted', life: 3000});
                }
                this.deleteProductsDialog = false;
                }
                
                //this.$toast.add({severity:'success', summary: 'Successful', detail: 'Products Deleted', life: 3000});
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            } finally {
                this.selectedProducts = [];
            }
            
        },
        initFilters() {
            this.filters = {
                'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
            }
        },
        getStatusLabel(status: any) {
            switch (status) {
                case 'INSTOCK':
                    return 'success';

                case 'LOWSTOCK':
                    return 'warning';

                case 'OUTOFSTOCK':
                    return 'danger';

                default:
                    return null;
            }
        },
        //Checks all available products to make sure the fnsku being entered has not already been used
        validateFnsku(){
                let isVal = true;
                console.log("IN VALIDATE")

                console.log("THIS PRODUCT: ",this.product);

                if (this.product.fnsku) {
                    for (let i = 0; i < this.products.length; i++) {
                        //console.log(this.products[i].fnsku);
                        if (this.products[i].fnsku == this.product.fnsku && this.products[i].product_id != this.product.product_id){
                            console.log("PRODUCT ALREADY HAS THIS FNSKU: ",this.products[i]);
                            isVal = false;
                            //this.validFnsku = false;
                        }
                    }
                } 

                console.log("NO ERROR RESULT: ",isVal);
                return isVal;
            },
        /* rowStyle(data: any) {
            if (data.fnsku === '' && data.asin === '') {
                return { background: 'red' };
            }
            else {
                return { background: 'green'}
            }  
        }, */
        parseFile(){
            this.loading = true;
        },
        findProductName(id: number){
            let name = "";
            for(let prodIdx = 0; prodIdx < this.products.length; prodIdx++){
                if(id == this.products[prodIdx].product_id){
                    name = this.products[prodIdx].name;
                    break;
                }
            }
            return name;
        },
    }
}
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
.block-div {
   display: inline-flex;
   justify-content: space-between;
 }
 .caseCard{
   border-style: solid;
   border-radius: 5px;
   border-width: 1px;
 }
</style>
