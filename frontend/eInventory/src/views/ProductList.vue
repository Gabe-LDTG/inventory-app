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
            <DataTable ref="dt" :value="products" v-model:selection="selectedProducts" dataKey="product_id"
                :paginator="true" :rows="100" :filters="filters"
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
                        <h4 class="m-0">Manage Products</h4>
						<span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>

                <template #loading> Loading product data. Please wait. </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

                <Column expander style="width: 5rem" @click="console.log('TESTING')"/>

                <template #expansion="slotProps">
                    <div class="p-3">
                        <h3>Recipe for {{ slotProps.data.name }}</h3>
                        <div v-if="slotProps.data.fnsku || slotProps.data.asin">
                            PROCESSED
                            <div v-show="slotProps.data.products_needed_a">
                                <h4 class="font-bold">Product(s) Needed A: </h4> <h4>{{ findProductName(slotProps.data.products_needed_a) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_1 }}</p><br>
                            </div>
                            <div v-show="slotProps.data.products_needed_b">
                                <h4 class="font-bold">Product(s) Needed B: </h4> <h4>{{ findProductName(slotProps.data.products_needed_b) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_2 }}</p><br>
                            </div>
                            <div v-show="slotProps.data.products_needed_c">
                                <h4 class="font-bold">Product(s) Needed C: </h4> <h4>{{ findProductName(slotProps.data.products_needed_c) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_3 }}</p><br>
                            </div>
                            <div v-show="slotProps.data.products_needed_d">
                                <h4 class="font-bold">Product(s) Needed D: </h4> <h4>{{ findProductName(slotProps.data.products_needed_d) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_4 }}</p><br>
                            </div>
                            <div v-show="slotProps.data.products_needed_e">
                                <h4 class="font-bold">Product(s) Needed E: </h4> <h4>{{ findProductName(slotProps.data.products_needed_e) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_5 }}</p><br>
                            </div>
                            <div v-show="slotProps.data.products_needed_f">
                                <h4 class="font-bold">Product(s) Needed F: </h4> <h4>{{ findProductName(slotProps.data.products_needed_f) }}</h4>
                                <p class="font-bold">QTY: </p><p>{{ slotProps.data.qty_6 }}</p>
                            </div>
                        </div>
                        <div v-else-if="!slotProps.data.fnsku && !slotProps.data.asin">
                            This item is raw and has no recipe.
                        </div>
                    </div>
                </template>

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
                <InputText id="fnsku" v-model="product.fnsku" />
                <small class="p-error" v-if="submitted && validFnsku===false">FNSKU already in use.</small>
            </div>

            <div class="field">
                <label for="upc">UPC</label>
                <InputText id="upc" v-model="product.upc"/>
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="product.notes" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="30_day_storage_cost">30 Day Storage Cost</label>
                <InputNumber v-model="product['30_day_storage_cost']" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="amz_fees_cost">Amz Fees Cost</label>
                <InputNumber v-model="product.amz_fees_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="amz_fulfilment_cost">Amz Fulfilment Cost</label>
                <InputNumber v-model="product.amz_fulfilment_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="bag_cost">Bag Cost</label>
                <InputNumber v-model="product.bag_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <!-- MAKE DROPDOWN -->
            <div class="field">
                <label for="bag_size">Bag Size</label>
                <InputText id="bag_size" v-model="product.bag_size" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="box_cost">Box Cost</label>
                <InputNumber v-model="product.box_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="box_type">Box Type</label>
                <InputText id="box_type" v-model="product.box_type" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="date_added">Date Added</label>
                <Calendar id="date_added" dateFormat="yy/mm/dd" v-model="product.date_recieved"/>
            </div>

            <!-- MAKE DROPDOWN -->
            <div class="field">
                <label for="do_we_carry">Do We Carry?</label>
                <InputText id="do_we_carry" v-model="product.do_we_carry" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="holiday_storage_cost">Holiday Storage Cost</label>
                <InputNumber v-model="product.holiday_storage_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="in_shipping_cost">In-shipping Cost</label>
                <InputNumber v-model="product.in_shipping_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="item_cost">Item Cost</label>
                <InputNumber v-model="product.item_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="item_num">Item Number</label>
                <InputText id="item_num" v-model="product.item_num" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="labor_cost">Labor Cost</label>
                <InputNumber v-model="product.labor_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="map">Map</label>
                <InputNumber v-model="product.labor_cost" inputId="minmaxfraction" :minFractionDigits="2" />
            </div>

            <!-- MAKE DROPDOWN -->
            <div class="field">
                <label for="meltable">Meltable</label>
                <InputText id="meltable" v-model="product.meltable" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="misc_cost">Misc Cost</label>
                <InputNumber v-model="product.misc_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="out_shipping_cost">Out-shipping Cost</label>
                <InputNumber v-model="product.out_shipping_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="price_2021">Price 2021</label>
                <InputNumber v-model="product.price_2021" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="price_2022">Price 2022</label>
                <InputNumber v-model="product.price_2022" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="price_2023">Price 2023</label>
                <InputNumber v-model="product.price_2023" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="process_time_per_unit_sec">Process Time per Unit Sec</label>
                <InputNumber v-model="product.process_time_per_unit_sec" inputId="integeronly" />
            </div>

            <div class="field">
                <label for="products_needed_a">Products needed A</label>
                <Dropdown v-model="product.products_needed_a" 
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" />
            </div>

            <div class="field">
                <label for="qty_1">Quantity #1</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_1" showButtons :class="{'p-invalid': submitted && !product.products_needed_a}"/>
                <small class="p-error" v-if="submitted && product.qty_1 && !product.products_needed_a">Please select a product.</small>
            </div>

            <div class="field">
                <label for="products_needed_a">Products needed B</label>
                <Dropdown v-model="product.products_needed_b" 
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" />
            </div>

            <div class="field">
                <label for="qty_2">Quantity #2</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_2" showButtons/>
            </div>

            <div class="field">
                <label for="products_needed_c">Products needed C</label>
                <Dropdown v-model="product.products_needed_c" 
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" />
            </div>

            <div class="field">
                <label for="qty_3">Quantity #3</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_3" showButtons/>
            </div>

            <div class="field">
                <label for="products_needed_d">Products needed D</label>
                <Dropdown v-model="product.products_needed_d"
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" />
            </div>

            <div class="field">
                <label for="qty_4">Quantity #4</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_4" showButtons/>
            </div>

            <div class="field">
                <label for="products_needed_e">Products needed E</label>
                <Dropdown v-model="product.products_needed_e" 
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" />
            </div>

            <div class="field">
                <label for="qty_5">Quantity #5</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_5" showButtons/>
            </div>

            <div class="field">
                <label for="products_needed_f">Products needed F</label>
                <Dropdown v-model="product.products_needed_f"  
                placeholder="Select a Product" class="w-full md:w-14rem" editable
                :options="unprocProducts"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="product_id" > 

                <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex align-items-center">
                            <div>{{ slotProps.value.product_id }}</div>
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                    <template #option="slotProps">
                        <div v-if="!slotProps.option.fnsku || !slotProps.option.asin" class="flex align-items-center">
                            <div>{{ slotProps.option.name }} - {{ slotProps.option.upc }}</div>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <div class="field">
                <label for="qty_1">Quantity #6</label>
                <InputNumber inputId="stacked-buttons"
                v-model="product.qty_6" showButtons/>
            </div>
            
            <div class="field">
                <label for="total_cost">Total Cost</label>
                <InputNumber v-model="product.total_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>
            
            <div class="field">
                <label for="total_holiday_cost">Total Holiday Cost</label>
                <InputNumber v-model="product.total_holiday_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <!-- MAKE DROPDOWN -->
            <div class="field">
                <label for="vendor">Vendor</label>
                <InputText id="vendor" v-model="product.vendor" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="weight_lbs">Weight (lbs)</label>
                <InputNumber v-model="product.weight_lbs" inputId="integeronly" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="validate" />
            </template>
        </Dialog>

        <Dialog v-model:visible="productInfoDialog" header="Additional Details" :modal="true">
            <Button label="Toggle Filter" @click="filtered = !filtered;"/>
            <div v-for="(item, index) in product">
                <label>{{ index }}: </label><br>
                {{ item }} <br><br>
            </div>
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
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import importAction from "../components/utils/importUtils";
//import Papa from "papaparse";

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712

export default {
    data() {
        return {
            products: [] as any[],
            cases: [] as any[],
            productDialog: false,
            productInfoDialog: false,
            deleteProductDialog: false,
            deleteProductsDialog: false,
            product: {} as any,
            selectedProducts: [] as any[],
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            submitted: false,
            statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ],
            columns: [] as any[],
            validFnsku: true,

            working: false,
            loading: false,

            filtered: false,

            unprocProducts: [],
            expandedRows: [],
            recipeProducts:[] as any[],

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
            { field: 'box_type', header: 'Box Type' },
            { field: 'date_added', header: 'Date Added' },
            { field: 'do_we_carry', header: 'Do We Carry?' },
            { field: 'default_units_per_case', header: 'Default Units per Case'},
            { field: 'holiday_storage_cost', header: 'Holiday Storage Cost' },
            { field: 'in_shipping_cost', header: 'In-shipping Cost' },
            { field: 'item_cost', header: 'Item Cost'},
            { field: 'item_num', header: 'Item Number'},
            { field: 'item_num_1', header: 'Item Number #1'},
            { field: 'item_num_2', header: 'Item Number #2'},
            { field: 'item_num_3', header: 'Item Number #3'},
            { field: 'item_num_4', header: 'Item Number #4'},
            { field: 'item_num_5', header: 'Item Number #5'},
            { field: 'item_num_6', header: 'Item Number #6'},
            { field: 'labor_cost', header: 'Labor Cost' },
            { field: 'map', header: 'Map' },
            { field: 'meltable', header: 'Meltable?' },
            { field: 'misc_cost', header: 'Misc Cost' },
            { field: 'unit_box_cost', header: 'Unit Box Cost'},
            { field: 'out_shipping_cost', header: 'Out-shipping Cost' },
            { field: 'price_2021', header: 'Price 2021' },
            { field: 'price_2022', header: 'Price 2022' },
            { field: 'price_2023', header: 'Price 2023' },
            { field: 'process_time_per_unit_sec', header: 'Process Time per Unit Sec' },
            /* { field: 'products_needed_a', header: 'Products needed A'},
            { field: 'products_needed_b', header: 'Products needed B'},
            { field: 'products_needed_c', header: 'Products needed C'},
            { field: 'products_needed_d', header: 'Products needed D'},
            { field: 'products_needed_e', header: 'Products needed E'},
            { field: 'products_needed_f', header: 'Products needed F'},
            { field: 'qty_1', header: 'Quantity #1'},
            { field: 'qty_2', header: 'Quantity #2'},
            { field: 'qty_3', header: 'Quantity #3'},
            { field: 'qty_4', header: 'Quantity #4'},
            { field: 'qty_5', header: 'Quantity #5'},
            { field: 'qty_6', header: 'Quantity #6'}, */
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
        this.getUnprocessedProducts();
        //this.getCases();
        //this.products = Promise.resolve(action.getProducts());

        //console.log(this.products);
    },
    methods: {
        /* getProducts(){
            action.getProducts().then(data => {
                this.products = data;
            });
        }, */

        async getProducts(){
            try {
                this.loading = true;
                this.products = await action.getProducts();
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getUnprocessedProducts(){
            try {
                this.unprocProducts = await action.getUnprocProducts();
            } catch (err) {
                console.log(err);
            }
        },

        /* getCases(){
            action.getCases().then(data => {
                this.cases = data;
            });
        }, */

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        openNew() {
            this.product = [];
            this.submitted = false;
            this.productDialog = true;
            this.validFnsku = true;
        },
        hideDialog() {
            this.productDialog = false;
            this.submitted = false;
        },
        validate() {
            //this.validateFnsku();
            this.submitted = true;
            this.validFnsku = this.validateFnsku();
            if (this.validFnsku == true){
                this.saveProduct();
            }
        },
        async saveProduct() {
            //this.submitted = true;

			if (this.product.name.trim()) {
                if (this.product.product_id) {
                    await this.confirmEdit();
                }
                else {
                    await this.confirmCreate();
                }

                this.productDialog = false;
                //this.selectedProducts = null;
                this.product = {};
            }
        },
        async confirmEdit(){
            try {
                //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;

                //Promise.resolve(action.editProduct(this.product));
                this.products[this.findIndexById(this.product.product_id)] = this.product;
                console.log(this.products[this.findIndexById(this.product.product_id)]);

                console.log("PRODUCT BEFORE AWAIT",this.product);

                const editedProduct = await action.editProduct(this.product);
                
                console.log("PRODUCT AFTER AWAIT",this.product);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
                return editedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        async confirmCreate(){
            try {
                this.products.push(this.product);
                let addedProduct = await action.addProduct(this.product);
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Created', life: 3000});

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST

                this.getProducts();

                return addedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        editProduct(product: any) {
            this.product = {...product}; //ASK MICHAEL
            this.productDialog = true;
        },
        displayProductInfo(product: any){
            this.product = {...product};
            console.log(this.product);
            //console.log("Keys", Object.keys(this.product));

            let keys = Object.keys(this.product);
            let map = {} as any;

            if(this.filtered == false){
                keys.forEach((key) => {
                //console.log(`${key}: ${this.product[key]}`);
                for (let j = 0; j<this.columns.length; j++){
                    if (key==this.columns[j].field){
                        //console.log(this.columns[j].header);
                        map[this.columns[j].header] = this.product[key];
                    }
                }
            });
            }

            else if(this.filtered == true){
                keys.forEach((key) => {
                //console.log(`${key}: ${this.product[key]}`);
                for (let j = 0; j<this.columns.length; j++){
                    if (key==this.columns[j].field && this.product[key]){
                        //console.log(this.columns[j].header);
                        map[this.columns[j].header] = this.product[key];
                    }
                }
            });
            }
            
            console.log(map);
            this.product = map;
            this.productInfoDialog = true;
        },
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
        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Product Expanded', detail: event.data.name, life: 3000 });
            
            let map = [] as any[];
            let recipe = [] as any[];
            this.recipeProducts = [];

            for(let prodIdx = 0; prodIdx < this.products.length; prodIdx++){
                if(event.data.products_needed_a == this.products[prodIdx].product_id){
                    map[<any>'product_needed'] = this.products[prodIdx].name;
                    map[<any>'qty'] = event.data.qty_1;
                    this.recipeProducts.push(map);
                    recipe.push(map);
                }

            }

            return recipe;
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
</style>
