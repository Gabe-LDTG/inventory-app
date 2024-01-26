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
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Cases</h4>
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
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{width: '450px'}" header="Case Details" :modal="true" class="p-fluid">
            
            <div class="field">
                <label for="name">Name</label>
                <Dropdown v-model="selectedCases" optionLabel="name" required="true" 
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="products"
                :class="{'p-invalid': submitted && !product.name}" />
                <small class="p-error" v-if="submitted && !product.name">Name is required.</small>
            </div>

            <div class="field">
                <label for="asin">QTY</label>
                <InputNumber inputId="stacked-buttons" showButtons/>
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="product.notes" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="fnsku"> Date Recieved: </label>
                <InputText id="fnsku" v-model="product.fnsku"/>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product">Are you sure you want to delete <b>{{product.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product">Are you sure you want to delete the selected product(s)?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
            </template>
        </Dialog>
	</div>
</template>

<script lang="ts">
import { ProductService } from '@/components/service/ProductService';
import axios from 'axios';
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712

export default {
    data() {
        return {
            cases: [] as any[],
            case: {},
            selectedCases: null,

            products: [] as any[],
            productDialog: false,
            deleteProductDialog: false,
            deleteProductsDialog: false,
            product: {},
            selectedProducts: null,
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
        this.getProducts();
        //this.products = Promise.resolve(action.getProducts());

        this.getProcCases();

        console.log("PRODUCTS",this.products);
        console.log("CASES",this.cases);
    },
    methods: {
        //Pulls all the products from the database using API
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data;

                //this.columns = Object.keys(this.products[0]);
                //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
                //this.displayProducts = this.products;

                console.log("Product List Recieved\n",this.products);
                console.log("Keys", Object.keys(this.products[1]));
            })
        },

        getProcCases(){

            axios.get("http://localhost:5000/cases/processed").then(res => {
                this.cases = res.data;
                //this.displayCases = this.cases;
                /* for (let i = 0; i < this.cases.length; i++) {
                this.cases[i].EDIT = false;
                } */

                console.log(this.cases);
                console.log(this.cases[0].date_recieved);
                console.log('TESTING-------------------')
                //console.log(this.cases.date_recieved.getMonth());
            })
        },

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        openNew() {
            this.product = [];
            this.submitted = false;
            this.productDialog = true;
        },
        hideDialog() {
            this.productDialog = false;
            this.submitted = false;
        },
        saveProduct() {
            this.submitted = true;

			if (this.product.name.trim()) {
                if (this.product.id) {
                    //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;
                    action.editProduct(this.product);
                    //Promise.resolve(action.editProduct(this.product));
                    this.products[this.findIndexById(this.product.id)] = this.product;
                    //alert("Testing");
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Updated', life: 3000});
                }
                else {
                    //this.product.id = this.createId();
                    //this.product.code = this.createId();
                    //this.product.image = 'product-placeholder.svg';
                    //this.product.inventoryStatus = this.product.inventoryStatus ? this.product.inventoryStatus.value : 'INSTOCK';
                    this.products.push(this.product);
                    action.addProduct(this.product);
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Created', life: 3000});
                }

                this.productDialog = false;
                this.product = {};
            }
        },
        editProduct(product) {
            this.product = {...product}; //ASK MICHAEL
            this.productDialog = true;
        },
        confirmDeleteProduct(product) {
            this.product = product;
            this.deleteProductDialog = true;
        },
        deleteProduct() {
            this.products = this.products.filter(val => val.id !== this.product.id);
            action.deleteProduct(this.product.id);
            this.deleteProductDialog = false;
            this.product = {};
            this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Deleted', life: 3000});
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
            this.deleteProductsDialog = true;
        },
        deleteSelectedProducts() {
            this.products = this.products.filter(val => !this.selectedCases.includes(val));
            
            //action.deleteProduct(this.product.id);
            this.deleteProductsDialog = false;
            this.selectedCases = null;
            this.$toast.add({severity:'success', summary: 'Successful', detail: 'Products Deleted', life: 3000});
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
