<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCases || !selectedCases.length" />
                </template>

                <template #end>
                    <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="cases" v-model:selection="selectedCases" dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :selectAll="false"
                removableSort
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
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

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="units_per_case" header="QTY" sortable></Column>
                <Column field="notes" header="Notes" sortable></Column>
                <Column field="date_recieved" header="Date Recieved" sortable></Column>
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
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="products"
                optionLabel="name"
                optionValue="id"
                :class="{'p-invalid': submitted && !eCase.product_id}" />
                <small class="p-error" v-if="submitted && !eCase.product_id">Name is required.</small>
            </div>

            <div class="field">
                <label for="qty">QTY:</label>
                <InputNumber inputId="stacked-buttons" required="true" 
                :class="{'p-invalid': submitted && !eCase.units_per_case}"
                v-model="eCase.units_per_case" showButtons/>
                <small class="p-error" v-if="submitted && !eCase.units_per_case">Amount is required.</small>
            </div>

            <div class="field">
                <label for="notes">Notes:</label>
                <InputText id="notes" v-model="eCase.notes" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="fnsku"> Date Recieved: </label>
                <Calendar id="fnsku" dateFormat="yy/mm/dd" v-model="eCase.date_recieved"/>
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
            eCase: {},
            selectedCases: null,

            products: [] as any[],
            //productDialog: false,
            //deleteProductDialog: false,
            //deleteProductsDialog: false,
            product: {},
            //selectedProducts: null,

            filters: {},
            submitted: false,
            statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ]
        }
    },
    created() {
        this.initFilters();
    },
    mounted() {
        console.log('Mounted');
        //ProductService.getProducts().then((data) => (this.products = data));
        //action.getProducts().then((data) => (this.products = data));
        /* this.getProcProducts();
        //this.products = Promise.resolve(action.getProducts());

        this.getProcCases(); */

        this.displayController(this.displayValue);

        console.log("PRODUCTS",this.products);
        console.log("CASES",this.cases);
    },
    methods: {
        displayController(value: string){
            if(value == 'processed'){
                console.log('Processed');
                this.getProcProducts();
                this.getProcCases();

            }
            else if(value == 'unprocessed'){
                console.log('Unprocessed');
                this.getUnprocProducts();
                this.getUnprocCases();
            }
        },

        //Pulls all the products from the database using API
        getProcProducts(){
            action.getProcProducts().then(data => {
                this.products = data;
            });
        },

        getProcCases(){
            action.getProcCases().then(data => {
                this.cases = data;
            });
        },

        getUnprocProducts(){
            action.getUnprocProducts().then(data => {
                this.products = data;
            });
        },

        getUnprocCases(){
            action.getUnprocCases().then(data => {
                this.cases = data;
            });
        },

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        openNew() {
            //this.product = [];
            this.eCase = [];
            this.submitted = false;
            //this.productDialog = true;
            this.caseDialog = true;
        },
        hideDialog() {
            //this.productDialog = false;
            this.caseDialog = false;
            this.submitted = false;
        },
        saveCase() {
            this.submitted = true;

			if (this.eCase.product_id) {
                if (this.eCase.id) {
                    //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;
                    action.editCase(this.eCase);

                    const idx = this.cases.findIndex(c => c.id === this.eCase.id)
                    if(idx >= 0)
                        this.cases[idx] = this.eCase;
                    else
                        throw new Error('Could not find case we were editing :(')
                    //alert("Testing");
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
                }
                else {
                    //this.product.id = this.createId();
                    //this.product.code = this.createId();
                    //this.product.image = 'product-placeholder.svg';
                    //this.product.inventoryStatus = this.product.inventoryStatus ? this.product.inventoryStatus.value : 'INSTOCK';
                    console.log("NEW CASE", this.eCase);
                    //console.log(this.eCase.product_id.id);
                    //console.log(this.products[this.findIndexById(this.eCase.product_id)].name);
                    //this.products[this.findIndexById(this.eCase.product_id)].name = this.eCase.name;

                    //this.cases.push(this.eCase);

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
                    action.addCase(this.eCase);
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Created', life: 3000});
                }

                //this.productDialog = false;
                this.caseDialog = false;
                this.product = {};
                this.eCase = {};
            }
        },
        editCase(value) {
            this.product = {...value}; //ASK MICHAEL
            this.eCase = {...value}
            //this.productDialog = true;
            this.caseDialog = true;
        },
        confirmDeleteCase(value) {
            this.product = value;
            this.eCase = value;
            this.deleteCaseDialog = true;
        },
        deleteCase() {
            this.cases = this.cases.filter(val => val.id !== this.eCase.id);
            action.deleteCase(this.eCase.id);
            this.deleteCaseDialog = false;
            this.product = {};
            this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Deleted', life: 3000});
        },
        findIndexById(id) {
            let index = -1;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].id === id) {
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
        exportCSV() {
            this.$refs.dt.exportCSV();
        },
        confirmDeleteSelected() {
            this.deleteCasesDialog = true;
        },
        deleteSelectedCases() {
            this.cases = this.cases.filter(val => !this.selectedCases.includes(val));
            
            for(let i = 0; i < this.selectedCases.length; i++){
                action.deleteCase(this.selectedCases[i].id);
            }
            this.deleteCasesDialog = false;
            this.selectedCases = null;
            this.$toast.add({severity:'success', summary: 'Successful', detail: 'Cases Deleted', life: 3000});
        },
        initFilters() {
            this.filters = {
                'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
            }
        },
        getStatusLabel(status) {
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
        }
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
