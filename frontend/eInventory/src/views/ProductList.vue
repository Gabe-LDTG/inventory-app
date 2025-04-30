<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts" />
                </template>

                <template #center>
                    <Button label="Processed" severity="success" @click="displayType = 'proc'; toggleProducts(displayType)" />
                    <Button label="All" severity="help" @click="displayType = 'all'; toggleProducts(displayType)" />
                    <Button label="Unprocessed" severity="info" @click="displayType = 'unproc'; toggleProducts(displayType)" />
                </template>

                <template #end>
                    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @uploader="onUpload"/>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>
            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="displayProducts" v-model:selection="selectedProducts" dataKey="product_id"
                :paginator="true" :rows="25" :filters="filters"
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

                <Column expander header="Recipe" style="width: 5rem" @click="console.log('TESTING')"/>

                <template #expansion="slotProps">
                    <div class="p-3">
                        <h3>Recipe for {{ slotProps.data.name }}</h3>
                        <div v-if="slotProps.data.fnsku || slotProps.data.asin">
                            PROCESSED

                            <DataTable :value="getProductRecipes(slotProps.data.product_id)">
                                <Column field="name" header="Product(s) Needed"></Column>
                                <Column field="qty" header="Raw Unit(s) Needed Per Processed Unit"></Column>
                            </DataTable>
                        </div>
                        <div v-else-if="!slotProps.data.fnsku && !slotProps.data.asin">
                            This item is raw and has no recipe.
                        </div>
                    </div>
                </template>

                <Column field="name" header="Name" sortable></Column>
                <Column field="vendor_name" header="Vendor" sortable/>
                <Column field="asin" header="ASIN" sortable></Column>
                <Column field="fnsku" header="FNSKU" sortable></Column>
                <Column field="item_num" header="Item #" sortable/>
                <Column field="upc" header="UPC" sortable></Column>
                <Column field="notes" header="Notes" sortable></Column>
                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-cog" v-tooltip.top="'Product Details'" outlined rounded class="mr-2" style="color: blue;" @click="displayProductInfo(slotProps.data)"/> 
                        <Button icon="pi pi-pencil" v-tooltip.top="'Edit Product'" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash" v-tooltip.top="'Delete Product'" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{width: '450px'}" :header="getProductDialogName()" :modal="true" class="p-fluid">
            <div class="field">
                <label for="vendor">Vendor</label>
                <!-- <InputText id="vendor" v-model="product.vendor" rows="3" cols="20" /> -->
                <Dropdown v-model="product.vendor_id"
                placeholder="Select a Vendor" class="w-full md:w-14rem" editable
                :options="vendors"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="vendor_name"
                optionValue="vendor_id" />
            </div>
       
            <div class="field" v-if="!product.product_id">
                <label for="name">Name</label>
                <InputText id="name" v-model.trim="product.name" required="true" autofocus :class="{'p-invalid': submitted && !product.name}" />
                <small class="p-error" v-if="submitted && !product.name">Name is required.</small>
            </div>

            <div class="field">
                <label for="default_units_per_case">Default Units per Case</label>
                <InputText v-model="product.default_units_per_case" />
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
                <label for="item_num">Item Number</label>
                <InputText id="item_num" v-model="product.item_num" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="price_2023">Current Unit Price</label>
                <InputNumber v-model="product.price_2023" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
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
                <Calendar id="date_added" dateFormat="yy/mm/dd" v-model="product.date_received"/>
            </div>

            <div class="field">
                <label for="do_we_carry">Do We Carry?</label>
                <Dropdown v-model="product.do_we_carry"
                placeholder="Do We Carry?" class="w-full md:w-14rem" editable
                :options="binary"/>
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
                <label for="labor_cost">Labor Cost</label>
                <InputNumber v-model="product.labor_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="map">Map</label>
                <InputNumber v-model="product.labor_cost" inputId="minmaxfraction" :minFractionDigits="2" />
            </div>

            <div class="field">
                <label for="meltable">Meltable</label>
                <Dropdown v-model="product.meltable"
                placeholder="Meltable?" class="w-full md:w-14rem" editable
                :options="binary"/>
            </div>

            <div class="field">
                <label for="misc_cost">Misc Cost</label>
                <InputNumber v-model="product.misc_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="out_shipping_cost">Out-shipping Cost</label>
                <InputNumber v-model="product.out_shipping_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <!-- MAKE THE YEARLY PRICES A TABLE AT SOME POINT -->
            <div class="field">
                <label for="price_2021">Price 2021</label>
                <InputNumber v-model="product.price_2021" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="price_2022">Price 2022</label>
                <InputNumber v-model="product.price_2022" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="process_time_per_unit_sec">Process Time per Unit Sec</label>
                <InputNumber v-model="product.process_time_per_unit_sec" inputId="integeronly" />
            </div>
            
            <div class="field">
                <label for="total_cost">Total Cost</label>
                <InputNumber v-model="product.total_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>
            
            <div class="field">
                <label for="total_holiday_cost">Total Holiday Cost</label>
                <InputNumber v-model="product.total_holiday_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
            </div>

            <div class="field">
                <label for="weight_lbs">Weight (lbs)</label>
                <InputNumber v-model="product.weight_lbs" inputId="integeronly" />
            </div>

            <div class="field" v-if="product.fnsku || product.asin">
                <label>Product(s) Needed</label>
                <template class="caseCard" v-for="(ing, counter) in recipesInUse">

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteIngredient(counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">Product #{{ counter + 1 }}</h4><br>
                        <div class="block-div">
                            <div class="field">
                                <label for="name">Product Needed:</label>
                                <Dropdown v-model="ing.product_id" required="true" 
                                placeholder="Select a Product" class="md:w-14rem" editable
                                :options="unprocessedProducts"
                                optionLabel="name"
                                filter
                                optionValue="product_id"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                :class="{'p-invalid': submitted && !ing.product_id}" 
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
                                        <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num }}</div>
                                    </template>
                                </Dropdown>
                                <small class="p-error" v-if="submitted && !ing.product_id">Product is required.</small>
                            </div>

                            <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !ing.qty}"
                                v-model="ing.qty" showButtons/>
                                <small class="p-error" v-if="submitted && !ing.qty">Amount is required.</small>
                            </div>

                        </div>

                    </div>
                </template>

                <Button label="Add another product" text @click="addIngredient"/>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="validate" />
            </template>
        </Dialog>

        <Dialog v-model:visible="productInfoDialog" :header="product.Name+' Details'" :modal="true">
            <Button label="Toggle Filter" @click="toggleFilter()"/>
            
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

        <!-- <Dialog v-model:visible="vendorDialog" :style="{width: '450px'}" header="Vendor" :modal="true">
            <div class="field">
                <!- <InputText id="vendor" v-model="product.vendor" rows="3" cols="20" /> ->
                <Dropdown v-model="product.vendor"
                placeholder="Select a Vendor" class="w-full md:w-14rem" editable
                :options="vendors"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="vendor_name"
                optionValue="vendor_id" />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="vendorDialog = false"/>
                <Button label="Select" icon="pi pi-check" text @click="openNew" />
            </template>
        </Dialog> -->
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
            //PRODUCT VARIABLES
            products: [] as any[],
            displayProducts: [] as any[],
            processedProducts: [] as any[],
            unprocessedProducts: [] as any[],
            displayType: "",
            productDialog: false,
            productInfoDialog: false,
            deleteProductDialog: false,
            deleteProductsDialog: false,
            product: {} as any,
            selectedProducts: [] as any[],
            unprocProducts: [] as any[],
            recipeProducts:[] as any[],
            toggleProduct: {} as any,

            //CASE VARIABLES
            cases: [] as any[],

            //RECIPE VARIABLES
            recipes: [] as any[],
            recipeElements: [] as any[],
            organizedRecipes: [] as any[],
            recipesInUse: [] as any[],

            //VENDOR VARIABLES
            vendors: [] as any[],
            vendorDialog: false,

            //VALIDATE VARIABLES
            validFnsku: true,

            //MISC VARIABLES
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            
            filtered: false,

            submitted: false,

            statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ],

            binary: [
                'Yes',
                'No'
            ],

            columns: [] as any[],

            working: false,

            loading: false,

            expandedRows: [],
        }
    },
    created() {
        this.initFilters();
        this.columns = [
            { field: 'vendor_name', header: 'Vendor'},
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
            { field: 'name', header: 'Name' },
            { field: 'map', header: 'Map' },
            { field: 'meltable', header: 'Meltable?' },
            { field: 'misc_cost', header: 'Misc Cost' },
            { field: 'unit_box_cost', header: 'Unit Box Cost'},
            { field: 'out_shipping_cost', header: 'Out-shipping Cost' },
            { field: 'price_2021', header: 'Price 2021' },
            { field: 'price_2022', header: 'Price 2022' },
            { field: 'price_2023', header: 'Current Unit Price' },
            { field: 'process_time_per_unit_sec', header: 'Process Time per Unit Sec' },
            { field: 'total_cost', header: 'Total Cost'},
            { field: 'total_holiday_cost', header: 'Total Holiday Cost' },
            { field: 'weight_lbs', header: 'Weight (Lbs)' },
        ];
    },
    mounted() {
        console.log('Mounted');
        //ProductService.getProducts().then((data) => (this.products = data));
        //action.getProducts().then((data) => (this.products = data));
        this.initVariables();

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
        /* decodeFilterRequest(){
            String globalFilter = params.get(clientId + UINamingContainer.getSeparatorChar(context) + "globalFilter");
            boolean hasGlobalFilter = !isValueBlank(globalFilter);
            if(hasGlobalFilter) {
                filters.put("globalFilter", globalFilter);
            }
        }, */

        async initVariables(){
            try {
                this.loading = true;

                await this.getVendors();
                await this.getProducts();
                await this.getRecipes();
                // await this.getUnprocessedProducts();
                
                this.loading = false;
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
                //this.loading = true;
                this.recipes = await action.getRecipes();
                this.recipeElements = await action.getRecipeElements();

                //console.log(this.recipes);
                //console.log(this.recipeElements);
                //this.loading = false;
            } catch (error) {
                console.log(error);
            }
        },

        async getProducts(){
            try {
                //this.loading = true;
                this.products = await action.getProducts();

                this.products.forEach(p => {
                    const vendor = this.vendors.find(v => p['vendor_id'] == v['vendor_id']);

                    if (vendor){
                        //console.log("LOCATION", location);
                        p['vendor_name'] = vendor['vendor_name'];
                    }

                    if (p['price_2021']){
                        Number(p['price_2021']);
                    }

                    if (p['price_2023']){
                        Number(p['price_2023']);
                    }
                })

                this.displayProducts = this.products;
                this.processedProducts = this.products.filter(product => product.fnsku || product.asin);
                this.unprocessedProducts = this.products.filter(product => (!product.fnsku && !product.asin) || product.upc);

                //this.loading = false;
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

        async getVendors(){
            try {
                this.vendors = await action.getVendors();
            } catch (error) {
                console.log(error);                
            }
        },

        getVendorName(vendorId: any){
            console.log("IN VENDOR", vendorId);
            for(let venIdx = 0; venIdx < this.vendors.length; venIdx++){
                if(vendorId == this.vendors[venIdx].vendor_id){
                    return this.vendors[venIdx].vendor_name;
                }
            }
        },

        /* getCases(){
            action.getCases().then(data => {
                this.cases = data;
            });
        }, */

        getRecipeNames(recipe: any){
            let recipeMap = {};
            let namedRecipes= [];
            for (let prodIdx=0; prodIdx < this.products.length; prodIdx++ ){
                console.log("IN LOOP")
                if (recipe.product_made==this.products[prodIdx].product_id){
                    console.log("PRODUCT MADE", recipe.product_made)
                    recipe.made_name = this.products[prodIdx].name;
                }
                else if (recipe.product_needed==this.products[prodIdx].product_id){
                    console.log("PRODUCT needed", recipe.product_needed)
                    recipe.needed_name = this.products[prodIdx].name;
                }
            }
            console.log(recipe);
        },

        /** 
         * Description: Checks the current product being worked on. If the product has an id, it is being edited,
         * and the header will show the name of the product being edited. Otherwise, the header will display 
         * "Create Product."
         *
         * Created by: Gabe de la Torre
         * Date Created: 7-29-2024
         * Date Last Edited: 7-29-2024 
         */
        getProductDialogName(){
            let header = "";

            if(this.product.product_id)
                header = "Edit: "+this.product.name;
            else 
                header = "Create Product";

            return header;
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
            this.validFnsku = true;
            this.recipesInUse = [];
            this.newIngredients();
        },
        newIngredients(){
            for(let idx = 0; idx < 1; idx++){
                this.addIngredient();
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-25-2024
        addIngredient(){
        this.recipesInUse.push(
                {
                product_id: '',
                qty: 0,
                type: 'input',
                recipe_id: '',
                }
            )
        },
        deleteIngredient(counter: any){
        this.recipesInUse.splice(counter,1);
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
                

                // console.log(this.products[this.findIndexById(this.product.product_id)]);

                // console.log("PRODUCT BEFORE AWAIT",this.product);

                const editedProduct = await action.editProduct(this.product, this.recipesInUse);

                this.getRecipes();
                
                this.products[this.findIndexById(this.product.product_id)] = this.product;
                
                // console.log("PRODUCT AFTER AWAIT",this.product);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
                return editedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-27-2024
        async confirmCreate(){
            try {
                //this.products.push(this.product);

                let recMap = {} as any;

                console.log("RECIPE ELEMENTS ",this.recipesInUse);

                //recMap['label' as any] = this.product.name + ' - ' + this.product.fnsku;
                //recMap['vendor_id' as any] = this.product.vendor;
                recMap['recipeElements' as any] = this.recipesInUse;

                let addedProduct = await action.addProduct(this.product, recMap);

                this.products.push(addedProduct);
                // this.displayProducts.push(addedProduct);

                await this.getProducts();
                await this.getRecipes();

                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Created', life: 3000});

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST

                recMap = {};

                return addedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },
        editProduct(product: any) {
            this.recipesInUse = [];
            this.product = {...product}; //ASK MICHAEL

            console.log(this.product);

            if(this.product.fnsku || this.product.asin){
                console.log('Processed Product Edit');
                let recipeMap = this.getProductRecipes(this.product.product_id);

                console.log("RECIPE MAP", recipeMap);

                this.recipesInUse = recipeMap;
                console.log('Recipes in use: ',this.recipesInUse);
            }

            /* if(this.product.fnsku){
                console.log("PROCESSED")
                for (let recIdx = 0; recIdx < recipeMap.length; recIdx++){
                    let indRec = [] as any[];

                    indRec[<any>'recipe_id'] = recipeMap[recIdx]['recipe']['recipe_id'];
                    indRec[<any>'product_needed'] = recipeMap[recIdx]['recipe']['product_needed'];
                    indRec[<any>'name'] = recipeMap[recIdx]['product']['name'];
                    indRec[<any>'units_needed'] = recipeMap[recIdx]['recipe']['units_needed'];
                    this.recipesInUse.push(indRec);
                }
            } */

            //this.recipesInUse = this.getProductRecipes(this.product.product_id);
            this.productDialog = true;
        },
        displayProductInfo(product: any){
            this.product = {...product};
            this.toggleProduct = this.product;
            console.log("DISPLAY PRODUCT INFO ",this.product);
            console.log("Keys", Object.keys(this.product));

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
            
            console.log("MAP ",map);
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
                this.displayProducts = this.displayProducts.filter(val => val.product_id !== this.product.product_id);
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
                    await action.batchDeleteProduct(this.selectedProducts);
                    this.getProducts();
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product(s) Deleted', life: 3000});
    
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
        globalFilter(filterString: string){

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
        toggleFilter(){

            //this.productInfoDialog = false;

            this.filtered = !this.filtered;

            this.displayProductInfo(this.toggleProduct);
            this.$toast.add({severity:'success', summary: 'Successful', detail: 'Filter Toggled', life: 3000});

            //this.productInfoDialog = true;

            console.log("TOGGLE");

        },

        getProductRecipes(productId: number){

            let outputProduct = this.recipeElements.find(re => re.type === 'output' && re.product_id === productId);
            console.log("OUTPUT RECIPE", outputProduct);

            let inputProducts = this.recipeElements.filter(re => re.type === 'input' && re.recipe_id === outputProduct.recipe_id);
            console.log("INPUT RECIPES", inputProducts);

            inputProducts.forEach(ir => {
                let inProd = this.products.find(p => p.product_id === ir.product_id);
                ir.name = inProd.name;
            })

           return inputProducts;
        },

        /** 
         * Toggles what products to display based on the toggle type. Can be processed, unprocessed or
         * all products.
         * @param type {string} A string with the value of either "all", "proc", "unproc"
         *
         * Created by: Gabe de la Torre
         * Date Created: 7-31-2024
         * Date Last Edited: 7-31-2024 
         */
        toggleProducts(type: string){
            this.loading = true;
            //console.log(type);
            if(type === "all") {
                this.displayProducts = this.products;
            } else if(type === "proc"){
                this.displayProducts = this.processedProducts;
                console.log(this.displayProducts);
            } else if(type === "unproc"){
                this.displayProducts = this.unprocessedProducts;
            }
            //console.log(this.displayProducts);
            this.loading = false;
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
