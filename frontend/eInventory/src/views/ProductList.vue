<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)"  />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="products" v-model:selection="selectedProducts" dataKey="id"
                :paginator="true" :rows="10" :filters="filters"
                :selectAll="false"
                removableSort
                :rowClass="({ desc }) => desc === 'Disconnected' ? 'text-red-500': null"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Products</h4>
						<span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="asin" header="ASIN" sortable></Column>
                <Column field="fnsku" header="FNSKU" sortable></Column>
                <Column field="upc" header="UPC" sortable></Column>
                <Column field="notes" header="Notes" sortable></Column>
                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-cog" outlined rounded class="mr-2" style="color: blue;" @click="displayProductInfo(slotProps.data)"/> 
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{width: '450px'}" header="Product Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name">Name</label>
                <InputText id="name" v-model.trim="product.name" required="true" autofocus :class="{'p-invalid': submitted && !product.name}" />
                <small class="p-error" v-if="submitted && !product.name">Name is required.</small>
            </div>

            <div class="field">
                <label for="asin">ASIN</label>
                <InputText id="asin" v-model="product.asin"/>
            </div>

            <div class="field">
                <label for="fnsku">FNSKU</label>
                <InputText id="fnsku" v-model="product.fnsku"/>
            </div>

            <div class="field">
                <label for="upc">UPC</label>
                <InputText id="upc" v-model="product.upc"/>
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="product.notes" rows="3" cols="20" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="productInfoDialog" :modal="true">
                    <!-- <div v-for="column in columns">
                        <p>
                            <div class="field">
                                <label for="asin">{{ column.header }}</label>
                                
                            </div>
                        </p>
                    </div> -->
                    <!-- <DataTable :value="product" scrollable tableStyle="min-width: 50rem" scrollHeight="400px">
                        <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
                    </DataTable>
                    <Button label="Okay" icon="pi pi-times" text @click="productInfoDialog = false"/> -->
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
            products: [] as any[],
            productDialog: false,
            productInfoDialog: false,
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
            ],
            columns: [] as any[],
        }
    },
    created() {
        this.initFilters();
        this.columns = [
            { field: '30_day_storage_cost', header: '30 Day Storage Cost'},
            { field: 'amz_fees_cost', header: 'Amz Fees Cost'},
            { field: 'amz_fulfilment_cost', header: 'Amz Fulfilment Cost'},
            { field: 'bag_cost', header: 'Bag Cost' },
            { field: 'bag_size' , header: 'Bag Size'},
            { field: 'box_cost' , header: 'Box Cost'},
            { field: 'box_size', header: 'Box Size' },
            { field: 'box_type', header: 'Box Type' },
            { field: 'date_added', header: 'Date Added' },
            { field: 'do_we_carry', header: 'Do We Carry?' },
            { field: 'holiday_storage_cost', header: 'Holiday Storage Cost' },
            { field: 'in_shipping_cost', header: 'In-shipping Cost' },
            { field: 'item_cost', header: 'Item Cost'},
            { field: 'item_num', header: 'Item Number'},
            { field: 'labor_cost', header: 'Labor Cost' },
            { field: 'map', header: 'Map' },
            { field: 'meltable', header: 'Meltable?' },
            { field: 'misc_cost', header: 'Misc Cost' },
            { field: 'out_shipping_cost', header: 'Out-shipping Cost' },
            { field: 'price_2021', header: 'Price 2021' },
            { field: 'price_2022', header: 'Price 2022' },
            { field: 'price_2023', header: 'Price 2023' },
            { field: 'process_time_per_unit_sec', header: 'Process Time per Unit Sec' },
            { field: 'total_cost', header: 'Total Cost'},
            { field: 'total_holiday_cost', header: 'Total Holiday Cost' },
            { field: 'vendor', header: 'Vendor' },
            { field: 'weight_lbs', header: 'Weight (Lbs)' },
        ];
    },
    mounted() {
        console.log('Mounted');
        //ProductService.getProducts().then((data) => (this.products = data));
        //action.getProducts().then((data) => (this.products = data));
        this.getProducts();
        //this.products = Promise.resolve(action.getProducts());

        console.log(this.products);
    },
    methods: {
        getProducts(){
            action.getProducts().then(data => {
                this.products = data;
            });
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
                    console.log(this.products[this.findIndexById(this.product.id)]);
                    console.log(this.product);
                    //alert("Testing");
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
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
        displayProductInfo(product){
            this.product = {...product};
            console.log(this.product);
            console.log("Keys", Object.keys(this.product));
            let keys = Object.keys(this.product);
            console.log(this.columns);
            for (let i = 0; i<keys.length; i++){
    
            }
            this.productInfoDialog = true;
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
            this.products = this.products.filter(val => !this.selectedProducts.includes(val));
            
            for(let i=0; i<this.selectedProducts.length; i++){
                action.deleteProduct(this.selectedProducts[i].id);
            }
            this.deleteProductsDialog = false;
            this.selectedProducts = null;
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
