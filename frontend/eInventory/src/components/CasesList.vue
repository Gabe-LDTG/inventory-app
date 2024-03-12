<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label=" New" icon="pi pi-plus" severity="success" class="mr-2 inline-block" @click="openNew" />
                    <Button label=" Delete" icon="pi pi-trash" class="mr-2 inline-block" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCases" />
                    <Button label=" New Purchase Order" icon="pi pi-upload" class="mr-2 inline-block" @click="openBulk()"  />
                </template>

                <template #end>
                    
                    <FileUpload mode="basic" :customUpload="true" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @upload="onUpload" />
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="cases" v-model:selection="selectedCases" dataKey="case_id"
                :paginator="true" :rows="10" :filters="filters"
                :selectAll="false"
                removableSort
                showGridlines
                stripedRows
                :loading="loading"
                @rowgroup-expand="onRowGroupExpand"
                :expandedRows="expandedRows"
                sortMode="single" sortField="name"
                
                rowGroupMode="subheader" groupRowsBy="name"
                :virtualScrollerOptions="{ itemSize: 46 }"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 v-if="displayValue === 'processed'" class="m-0">Manage Cases</h4>
                        
                        <h4 v-else-if="displayValue === 'unprocessed'" class="m-0">Manage Boxes</h4>
						<span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>

                <template #loading> Loading product data. Please wait. </template>

                <template #groupheader="slotProps">
                    <div class="flex align-items-center gap-2" style="background-color:#ddd;">
                        <span class="flex justify-content-start font-bold w-full">{{ slotProps.data.name }}</span>
                        <div class="flex justify-content-end font-bold w-full">Total Number of Boxes: {{ calculateBoxTotal(slotProps.data.name) }}</div>
                        <div class="flex justify-content-end font-bold w-full">Total QTY: {{ calculateTotalQTY(slotProps.data.name) }}</div>
                    </div>
                </template>

                <Column field="name" header="Name" sortable></Column>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="status" header="Status" sortable></Column>
                <Column field="units_per_case" header="QTY" sortable></Column>
                <Column field="location" header="Location" sortable></Column>
                <Column field="notes" header="Notes" sortable></Column>
                <Column field="date_received" header="Date received" sortable></Column>
                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCase(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCase(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="caseDialog" :style="{width: '450px'}" header="Case Details" :modal="true" class="p-fluid">
            
            <div class="field">
                <label for="name">Name:</label>
                <Dropdown v-model="eCase.product_id" required="true" 
                placeholder="Select a Product" class="md:w-14rem" editable
                :options="products"
                optionLabel="name"
                filter
                @change="onProductSelection(eCase.product_id)"
                optionValue="product_id"
                :virtualScrollerOptions="{ itemSize: 38 }"
                :class="{'p-invalid': submitted && !eCase.product_id}" 
                >
                <!-- :pt="{
                    root: { class: 'w-full max-width: 120rem' },
                    item: ({ context }) => ({
                        class: context.selected ? 'bg-primary' : context.focused ? 'bg-blue-100' : undefined
                    })
                }" -->

                <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex align-items-center">
                            <div>{{ slotProps.value.product_id }}</div>
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                    <template #option="slotProps">
                        <div v-if="displayValue === 'processed'" class="flex align-items-center">
                            <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku }}</div>
                        </div>
                        <div v-if="displayValue === 'unprocessed'" class="flex align-items-center">
                            <div>{{ slotProps.option.name }} - {{ slotProps.option.upc }}</div>
                        </div>
                    </template>
                </Dropdown>
                <small class="p-error" v-if="submitted && !eCase.product_id">Name is required.</small>
            </div>

            <div class="field">
                <label for="qty">QTY:</label>
                <InputNumber inputId="stacked-buttons" required="true" 
                :class="{'p-invalid': submitted && !eCase.units_per_case}"
                v-model="eCase.units_per_case" showButtons/>
                <small class="p-error" v-if="submitted && !eCase.units_per_case">Amount is required.</small>
            </div>

            <!-- MAKE DROPDOWN -->
            <div class="field">
                <label for="location">Location:</label>
                <InputText id="location" v-model="eCase.location" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="notes">Notes:</label>
                <InputText id="notes" v-model="eCase.notes" rows="3" cols="20" />
            </div>

            <div v-show="!eCase.case_id" class="field">
                <label for="amount">How Many received?</label>
                <InputNumber inputId="stacked-buttons" required="true" 
                v-model="amount" showButtons/>
            </div>

            <div class="field">
                <label for="date_received"> Date received: </label>
                <Calendar id="date_received" dateFormat="yy-mm-dd" v-model="eCase.date_received"/>
            </div>

            <div class="field">
                <label>Status:</label>
                <InputText id="status" v-model="eCase.status" rows="3" cols="20" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveCase" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCaseDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="eCase">Are you sure you want to delete <b>{{eCase.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCaseDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteCase" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCasesDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product">Are you sure you want to delete the selected product(s)?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCasesDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedCases" />
            </template>
        </Dialog>

        <Dialog v-model:visible="bulkInsertDialog" :style="{width: '450px'}" header="Purchase Order" :modal="true">
            <div class="field">
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Purchase Order Number:</h3>
                <InputText id="purchaseOrder" v-model="purchaseOrder" rows="3" cols="20" />
            </div>
            
            <template v-for="(bCase, counter) in bulkCases">

                <span @click="deleteBulkLine(counter)">x</span>
                <h3 class="flex justify-content-start font-bold w-full">Product #{{ counter + 1 }}</h3><br>
                <div class="field">
                    <label for="name">Name:</label>
                    <Dropdown v-model="bCase.product_id" required="true" 
                    placeholder="Select a Product" class="md:w-14rem" editable
                    :options="products"
                    optionLabel="name"
                    filter
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
                            <div v-if="displayValue === 'processed'" class="flex align-items-center">
                                <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku }}</div>
                            </div>
                            <div v-if="displayValue === 'unprocessed'" class="flex align-items-center">
                                <div>{{ slotProps.option.name }} - {{ slotProps.option.upc }}</div>
                            </div>
                        </template>
                    </Dropdown>
                    <small class="p-error" v-if="submitted && !bCase.product_id">Name is required.</small>
                </div><br>

                <div class="field">
                    <label for="qty">QTY:</label>
                    <InputNumber inputId="stacked-buttons" required="true" 
                    :class="{'p-invalid': submitted && !bCase.units_per_case}"
                    v-model="bCase.units_per_case" showButtons/>
                    <small class="p-error" v-if="submitted && !bCase.units_per_case">Amount is required.</small>
                </div>

                <div class="field">
                    <label for="location">Location:</label>
                    <InputText id="location" v-model="bCase.location" rows="3" cols="20" />
                </div>

                <div class="field">
                    <label for="notes">Notes:</label>
                    <InputText id="notes" v-model="bCase.notes" rows="3" cols="20" />
                </div>

                <div v-show="!bCase.case_id" class="field">
                    <label for="amount">How Many received?</label>
                    <InputNumber inputId="stacked-buttons" required="true" 
                    v-model="amount" showButtons/>
                </div>

                <div class="field">
                    <label>Status:</label>
                    <InputText id="status" v-model="bCase.status" rows="3" cols="20" />
                </div>
_____________________________________________________________
                <br><br>
            </template>

            <Button label="Add another product" text @click="addBulkLine"/>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="bulkSave" />
            </template>
        </Dialog>
	</div>
</template>

<script lang="ts">
//import { ProductService } from '@/components/service/ProductService';
import axios from 'axios';
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712


export default {
    props: {
        displayValue: String,
    },
    data() {
        return {
            cases: [] as any[],
            caseDialog: false,
            deleteCaseDialog: false,
            deleteCasesDialog: false,
            eCase: {} as any,
            selectedCases: [] as any[],
            //expandedRowGroups: [] as any,
            expandedRowGroups: null,
            expandedRows: [],

            bulkInsertDialog: false,
            bulkCases: [] as any[],
            bulkAmount: 3,
            purchaseOrder: "",

            products: [] as any[],
            //productDialog: false,
            //deleteProductDialog: false,
            //deleteProductsDialog: false,
            product: {} as any,
            //selectedProducts: null,

            amount: 1,

            loading: false,

            today: "",

            context: {} as any,

            filters: {} as any,
            submitted: false,
            statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ],

            /* filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
                'country.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
                representative: { value: null, matchMode: FilterMatchMode.IN },
                status: { value: null, matchMode: FilterMatchMode.EQUALS },
                verified: { value: null, matchMode: FilterMatchMode.EQUALS }
            }, */
            //displayLabel: this.products.name + '' + this.products.fnsku,
        }
    },
    created() {
        this.initFilters();
    },
    mounted() {
        console.log('Mounted');
        console.log(this.selectedCases)

        this.displayController(this.displayValue as string);

        this.getDate();

        //console.log("PRODUCTS",this.products);
        //console.log("CASES",this.cases);
    },
    methods: {
        async displayController(value: string){
            this.loading = true;
            if(value == 'processed'){
                console.log('Processed');
                await this.getProcProducts();
                await this.getProcCases();

            }
            else if(value == 'unprocessed'){
                console.log('Unprocessed');
                await this.getUnprocProducts();
                await this.getUnprocCases();
            }
            this.loading = false;
            console.log(this.loading);
        },

        //Pulls all the products from the database using API
        async getProcProducts(){
            try {
                this.loading = true;
                this.products = await action.getProcProducts();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getProcCases(){
            try {
                this.loading = true;
                this.cases = await action.getProcCases();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getUnprocProducts(){
            try {
                this.loading = true;
                this.products = await action.getUnprocProducts();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getUnprocCases(){
            try {
                this.loading = true;
                this.cases = await action.getUnprocCases();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
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
                    this.eCase.units_per_case = this.products[idx].default_units_per_case;
                }
            }
        },

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        openNew() {
            this.eCase = [];
            this.submitted = false;
            this.amount = 1;
            this.eCase.date_received = this.today;
            
            this.caseDialog = true;
        },
        openBulk() {
            this.bulkCases = [];
            this.submitted = false;
            this.amount = 1;
            
            for(let idx = 0; idx < this.bulkAmount; idx++){
                this.addBulkLine();
            }
            this.bulkInsertDialog = true;
        },
        addBulkLine(){
            this.bulkCases.push(
                    {
                    name: '',
                    }
                )
        },
        deleteBulkLine(counter: any){
            this.bulkCases.splice(counter,1);
        },
        hideDialog() {
            this.bulkInsertDialog = false;
            this.caseDialog = false;
            this.submitted = false;
        },
        // AS PER WHAT MICHAEL SAID, SPLIT THE ADD AND EDIT INTO SEPARATE FUNCTIONS WITH TRY CATCHES
        // THAT GET CALLED BY SAVE CASE
        async saveCase() {
            this.submitted = true;

            try {
                if (this.eCase.product_id) {
                    if (this.eCase.case_id) {
                        await this.confirmEdit();
                    }
                    else {
                        await this.confirmCreate();
                    }

                    //this.productDialog = false;
                    this.caseDialog = false;
                    this.product = {};
                    this.eCase = {};
                    this.amount = 1;
                }
            } catch (error) {
                console.log(error);
            }

        },
        async bulkSave(){
            try {
                this.submitted = true;
                console.log(this.bulkCases);

                
            } catch (error) {
                
            }
        },
        async confirmEdit(){
            try {
                //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;

                const idx = this.cases.findIndex(c => c.case_id === this.eCase.case_id)
                if(idx >= 0)
                    this.cases[idx] = this.eCase;
                else
                    throw new Error('Could not find case we were editing :(')
                //alert("Testing");

                console.log(this.eCase);
                action.editCase(this.eCase);
                console.log(this.eCase);
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        async confirmCreate(){
            try {
                console.log("NEW CASE", this.eCase);

                for(let i = 0; i < this.amount; i++){
                    await action.addCase(this.eCase);
                    console.log("LOOP CASE ",this.eCase);
                }
                //Had to regrab the list of cases because of weird formatting.
                //ASK MICHAEL IF THERES A BETTER WAY
                if(this.displayValue == 'processed'){
                    console.log('Processed');
                    this.getProcCases();

                }
                else if(this.displayValue == 'unprocessed'){
                    console.log('Unprocessed');
                    this.getUnprocCases();
                }
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case(s) Created', life: 3000});
            } catch (err: any) {
                console.log(err);
                console.log("CREATE CATCH")
                this.$toast.add({severity:'error', summary: 'Error', detail: err.request.data, life: 3000});
            }
        },
        editCase(value: any) {
            this.product = {...value}; //ASK MICHAEL
            this.eCase = {...value}
            //this.productDialog = true;
            this.caseDialog = true;
        },
        confirmDeleteCase(value: any) {
            this.product = value;
            this.eCase = value;
            this.deleteCaseDialog = true;
        },
        async deleteCase() {
            try {
                this.cases = this.cases.filter(val => val.case_id !== this.eCase.case_id);
                await action.deleteCase(this.eCase.case_id);
                this.deleteCaseDialog = false;
                this.product = {};
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Deleted', life: 3000});
            } catch (err: any) {
                console.log(err);
            }
        },
        findIndexById(id: any) {
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
        onUpload(event: any) {
            console.log(event);
        },
        exportCSV() {
            //this.$refs.dt.exportCSV();
            console.log("Functionality not finished");
        },
        confirmDeleteSelected() {
            this.deleteCasesDialog = true;
        },
        async deleteSelectedCases() {
            try {
                if(this.selectedCases){
                    this.cases = this.cases.filter(val => !this.selectedCases.includes(val));
            
                for(let i = 0; i < this.selectedCases.length; i++){
                   await action.deleteCase(this.selectedCases[i].case_id);
                }
                this.deleteCasesDialog = false;
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Cases Deleted', life: 3000});
            
                }
                } catch (err) {
                console.log(err);
            } finally {
                this.selectedCases = [];
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
        calculateBoxTotal(name: any){
            let total = 0;

            if (this.cases) {
                for (let c of this.cases) {
                    if (c.name === name) {
                        total++;
                    }
                }
            }

            return total;
        },
        calculateTotalQTY(name: any){
            let total = 0;

            if (this.cases) {
                for (let c of this.cases) {
                    if (c.name === name) {
                        total += c.units_per_case;
                        //console.log(c.units_per_case);
                        //console.log(total + c.units_per_case);
                    }
                }
            }

            return total;
        },
        onRowGroupExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Product Expanded', detail: event.data.name, life: 3000 });
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
</style>
