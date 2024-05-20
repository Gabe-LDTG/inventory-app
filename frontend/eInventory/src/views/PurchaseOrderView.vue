<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="vendorSelect()" />
                    <!-- <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts" /> -->
                </template>

                <template #end>
                    <!-- <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @uploader="onUpload"/> -->
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>
            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" dataKey="purchase_order_id"
                :paginator="true" :rows="10" :filters="filters"
                selectionMode="single"
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

                <!-- <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column> -->

                <Column expander header="Order Info" style="width: 5rem" />

                <Column field="purchase_order_name" header="Purchase Order" sortable></Column>

                <Column field="status" header="Status" sortable>
                    <template #body="slotProps">
                        <div class="card flex flex-wrap  gap-2">
                            <Tag :value="slotProps.data.status" :severity="getPOSeverity(slotProps.data)" :icon="getPOIcon(slotProps.data)" iconPos="right"/>
                        </div>
                    </template>
                </Column>

                <Column field="vendor" header="Vendor" sortable></Column>

                <Column field="notes" header="Notes" sortable></Column>

                <Column field="date_ordered" header="Date Ordered" sortable></Column>

                <Column field="date_received" header="Date Received" sortable></Column>

                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-check" outlined rounded class="mr-2" @click="confirmOrderReceived(slotProps.data)" />
                        <!-- <Button icon="pi pi-times" outlined rounded severity="danger" @click="confirmCancelOrder(slotProps.data)" /> -->
                    </template>
                </Column>

                <template #expansion="slotProps">
                    <div class="p-3">
                        <h4>Products in Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                        <DataTable :value="displayInfo(slotProps.data)" 
                        rowGroupMode="subheader" groupRowsBy="name">
                        <template #groupheader="slotProps">
                            <div class="flex align-items-center gap-2">
                                <span class="flex justify-content-start font-bold w-full">{{ slotProps.data.name }}</span>
                                <div class="flex justify-content-end font-bold w-full">Total Number of Boxes: {{ calculateBoxTotal(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                                <div class="flex justify-content-end font-bold w-full">Total QTY: {{ calculateTotalQTY(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                            </div>
                        </template>
                            <Column field="name" header="Name"></Column>
                        </DataTable>
                    </div>
                </template>

            </DataTable>
        </div>

        <Dialog v-model:visible="vendorDialog" :style="{width: '450px'}" header="Vendor Select" :modal="true">
            <div class="field">
                <!-- <!- <InputText id="vendor" v-model="product.vendor" rows="3" cols="20" /> -> -->
                <Dropdown v-model="purchaseOrder.vendor_id"
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
        </Dialog>

        <Dialog v-model:visible="purchaseOrderDialog" :style="{width: '1000px'}" header="Purchase Order Details" :modal="true" class="p-fluid">

            <div class="field">
                <label for="purchase_order_name">Purchase Order</label>
                <InputText id="name" v-model.trim="purchaseOrder.purchase_order_name" required="true" autofocus :class="{'p-invalid': submitted == true && (!purchaseOrder.purchase_order_name || purchaseOrder.purchase_order_name == '')}" />
                <small class="p-error" v-if="submitted == true && (!purchaseOrder.purchase_order_name || purchaseOrder.purchase_order_name == '')">Name is required.</small>
            </div>

            <div class="field">
                <label for="vendor">Vendor</label>
                <Dropdown disabled v-model="purchaseOrder.vendor_id"
                placeholder="Select a Vendor" class="w-full md:w-14rem" editable
                :options="vendors"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="vendor_name"
                optionValue="vendor_id" />
            </div>

            <div class="field">
                <label for="status">Status</label>
                <Dropdown v-model="purchaseOrder.status" :options="statuses" />
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
                <label for="total_units">Total Units</label>
            </div>

            <div class="field">
                <label for="total_price">Total</label>
            </div>

            <div v-if="purchaseOrder.purchase_order_id">
                <!-- EDITING/////////////////////////////////////////////////////////////////////////////////// -->

                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Requested Product(s):</h3>
                </div>

                <DataTable :value="poCases" rowGroupMode="subheader" groupRowsBy="name">
              
                    <template #groupheader="slotProps">
                        <div class="flex align-items-center gap-2">
                            <span class="flex justify-content-start w-full">{{ slotProps.data.name }}</span>
                            <div class="flex justify-content-end w-full">Total Number of Boxes: {{ calculateBoxTotal(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                            <div class="flex justify-content-end w-full">Requested Total QTY: {{ calculateTotalQTY(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                        </div>
                    </template>
  
                </DataTable> <br>

                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Received Product(s):</h3>
                </div>

                <template class="caseCard" v-for="(poCase, counter) in poCases">

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poCases, counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">{{ poCase.name }}</h4><br>
                        <div class="block-div">
                            <!-- <div class="field">
                                <label for="name">Name:</label>
                                <Dropdown v-model="poCase.product_id" required="true" 
                                placeholder="Select a Product" class="md:w-14rem" editable
                                :options="products"
                                optionLabel="name"
                                filter
                                disabled
                                @change="poCase.units_per_case = onProductSelection(poCase.product_id); poCase.total = poCase.amount*poCase.units_per_case;"
                                optionValue="product_id"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                :class="{'p-invalid': submitted && !poCase.product_id}" 
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
                                <small class="p-error" v-if="submitted && !poCase.product_id">Name is required.</small>
                            </div> -->

                            <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !poCase.units_per_case}"
                                v-model="poCase.units_per_case" showButtons
                                @input="poCase.total = poCase.amount*poCase.units_per_case"/>
                                <small class="p-error" v-if="submitted && !poCase.units_per_case">Amount is required.</small>
                            </div>

                            <div v-show="!poCase.case_id" class="field">
                                <label for="amount">How Many Boxes Arrived?</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="poCase.amount" showButtons
                                @update:model-value="poCase.total = onTotalUpdate(poCase.amount, poCase.units_per_case)"/>
                            </div>

                            <div class="field">
                                <label for="total">Received Total</label>
                                <InputNumber v-model="poCase.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="poCase.amount = onTotalUpdate(poCase.total, poCase.units_per_case)"/>
                            </div>

                            <!-- MAKE DROPDOWN WHEN LOCATION TABLE IS SET UP -->
                            <div class="field">
                                <label for="total">Location</label>
                                <InputText id="notes" v-model="poCase.location" rows="3" cols="20" />
                            </div>

                        </div>

                    </div>
                    </template>

            </div>

            <div v-else>
                <!-- CREATING/////////////////////////////////////////////////////////////////////////////////// -->
                <!-- PROC------------------------------------------------------------------------------------ -->
                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Planning Processed Case(s):</h3>
                </div>

                <template class="caseCard" v-for="(poCase, counter) in poCases">

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poCases, counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">Processed Product to Create #{{ counter + 1 }}</h4><br>
                        <div class="block-div">
                            <div class="field">
                                <label for="name">Name:</label>
                                <Dropdown v-model="poCase.product_id" required="true" 
                                placeholder="Select a Product" class="md:w-14rem" editable
                                :options="selectVendorProducts(purchaseOrder.vendor_id, 'proc')"
                                optionLabel="name"
                                filter
                                @change="poCase.units_per_case = onProductSelection(poCase.product_id); /* selectRecipe(poCase, counter);*/ poCase.total = poCase.amount*poCase.units_per_case;"
                                optionValue="product_id"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                :class="{'p-invalid': submitted && !poCase.product_id}" 
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
                                        <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku }}</div>
                                    </template>
                                </Dropdown>
                                <small class="p-error" v-if="submitted && !poCase.product_id">Name is required.</small>
                            </div>

                            <div class="field">
                                <label for="qty">Normal Case QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !poCase.units_per_case}"
                                v-model="poCase.units_per_case" disabled
                                />
                                <small class="p-error" v-if="submitted && !poCase.units_per_case">Amount is required.</small>
                            </div>

                            <div v-show="!poCase.case_id" class="field">
                                <label for="amount">Cases Desired to Be Made</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="poCase.amount" showButtons :min="1"
                                @update:model-value=""/>
                            </div>

                            <div class="field">
                                <label for="notes">Notes:</label>
                                <InputText id="notes" v-model="poCase.notes" rows="3" cols="20" />
                            </div>

                            <div v-if="poCase.units_per_case" class="field">
                                <label class="flex justify-content-end font-bold w-full" for="total">Total to be Made:</label>
                                <div class="flex justify-content-end font-bold w-full">{{ poCase.units_per_case * poCase.amount }}</div>
                            </div>

                            <!-- <div class="field">
                                <label for="total">Requested Total</label>
                                <InputNumber v-model="poCase.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="poCase.amount = onTotalUpdate(poCase.total, poCase.units_per_case)"/>
                            </div> -->

                        </div>
                        
                        <!-- <div v-show="poCase.total">
                            <label class="flex justify-content-end font-bold w-full" for="actualTotal">Total:</label>
                        </div> -->
                        <div v-if="poCase.units_per_case">
                            <DataTable :value="selectRecipe(poCase, counter)">
                                <Column field="name" header="Product Name" />
                                <Column field="default_units_per_case" header="Units per Box" />
                                <!-- <Column field="recipe.units_needed" header="Unit(s) per Bundle" />
                                <Column field="used_total" header="Total Units Needed" />
                                <Column field="raw_total" header="Total Units Ordered" />
                                <Column field="raw_box_total" header="Raw Box Total" /> -->
                                <!-- <Column field="price_2023" header="Unit Price" >
                                    <template #body="slotProps">
                                        ${{ formatCurrency(slotProps.data.product.price_2023) }}
                                    </template>
                                </Column>
                                <Column header="Total Price" >
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.product.price_2023*slotProps.data.raw_box_total) }}
                                    </template>
                                </Column> -->
                            </DataTable>
                            <InputText id="notes" v-model="poCase.notes" rows="3" cols="20" />
                        </div>

                    </div>
                </template>

                <Button label="Add another product" text @click="addBulkLine(poCases)"/>


                <!-- RAW ----------------------------------------------------------------------------------- -->
                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Raw Box(s):</h3>
                </div>

                <div class="field">
                    <h4 for="purchaseOrder" class="flex justify-content-start font-bold w-full">How would you like to order the raw product?</h4>

                    <div v-for="type in rawOrderType" class="flex align-items-center">
                        <RadioButton v-model="selectedOrderType" name="dynamic" :value="type"/>
                        <label :for="type">{{ type }}</label>
                    </div>
                </div>

                <template v-if="selectedOrderType" class="caseCard" v-for="(rCase, counter) in poBoxes">

                    <!-- ADD ANOTHER COLUMN THAT SELECTS BETWEEN 'ORDER BY BOX' AND 'ORDER BY UNIT'. BY BOX WILL DISPLAY -->
                    <!-- THE TOTAL UNITS NEEDED AND BY UNIT WILL SHOW THE TOTAL BOXES NEEDED -->

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poBoxes, counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">Raw Product #{{ counter + 1 }}</h4><br>
                        <div class="block-div">
                            <div class="field">
                                <label for="name">Name:</label>
                                <Dropdown v-model="rCase.product_id" required="true" 
                                placeholder="Select a Product" class="md:w-14rem" editable
                                :options="selectVendorProducts(purchaseOrder.vendor_id, 'raw')"
                                optionLabel="name"
                                filter
                                @change="rCase.units_per_case = onProductSelection(rCase.product_id); rCase.total = rCase.amount*rCase.units_per_case;"
                                optionValue="product_id"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                :class="{'p-invalid': submitted && !rCase.product_id}" 
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
                                <small class="p-error" v-if="submitted && !rCase.product_id">Name is required.</small>
                            </div>

                            <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !rCase.units_per_case}"
                                v-model="rCase.units_per_case" disabled
                                @input="rCase.total = rCase.amount*rCase.units_per_case"/>
                                <small class="p-error" v-if="submitted && !rCase.units_per_case">Amount is required.</small>
                            </div>

                            <div v-if="selectedOrderType === 'By Box'" v-show="!rCase.case_id" class="field">
                                <label for="amount">How Many Boxes to Order?</label>
                                <InputNumber inputId="stacked-buttons" required="true" :min="1"
                                v-model="rCase.amount" showButtons/>
                            </div>

                            <div v-else-if="selectedOrderType === 'By Unit'" v-show="!rCase.case_id" class="field">
                                <label for="amount">REQUESTED Units to Order:</label>
                                <InputNumber inputId="stacked-buttons" required="true" :min="1"
                                v-model="rCase.amount" showButtons/>
                            </div>

                            <div class="field">
                                <label for="notes">Notes:</label>
                                <InputText id="notes" v-model="rCase.notes" rows="3" cols="20" />
                            </div>

                            <div v-if="rCase.units_per_case && selectedOrderType === 'By Box'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Units:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ rCase.units_per_case * rCase.amount }}</div>
                            </div>

                            <div v-if="rCase.units_per_case && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Units:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(rCase.amount/rCase.units_per_case)*rCase.units_per_case }}</div>
                            </div>

                            <div v-if="rCase.units_per_case && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Boxes:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(rCase.amount/rCase.units_per_case) }}</div>
                            </div>

                            <div class="field"></div>

                            <div class="field"></div>

                            <!-- <div class="field">
                                <label for="total">Requested Total</label>
                                <InputNumber v-model="poCase.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="poCase.amount = onTotalUpdate(poCase.total, poCase.units_per_case)"/>
                            </div> -->

                        </div>
                        
                        <!-- <div v-show="poCase.total">
                            <label class="flex justify-content-end font-bold w-full" for="actualTotal">Total:</label>
                        </div> -->


                    </div>
                    </template>

                    <Button label="Add another product" text @click="addBulkLine(poBoxes)"/>

            </div>
            
            

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="validate" />
            </template>
        </Dialog>

        <Dialog v-model:visible="cancelOrderDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="purchaseOrder">Are you sure you want to cancel purchase order <b>{{purchaseOrder.purchase_order_name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="cancelOrderDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="cancelOrder" />
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
            cancelOrderDialog: false,
            rawOrderType: ['By Box', 'By Unit'],
            selectedOrderType: "",

            //PRODUCTS VARIABLES
            products: [] as any[],
            unprocProducts: [] as any[],
            procProducts: [] as any[],
            product: {} as any,
            selectedProducts: [] as any[],

            //CASE VARIABLES
            cases: [] as any[],
            uBoxes: [] as any[],
            pCases: [] as any[],
            poCases: [] as any[],
            poBoxes: [] as any[],
            amount: 1,

            //VENDOR VARIABLES
            vendors: [] as any[],
            vendorDialog: false,

            //RECIPE VARIABLES
            recipes: [] as any[],
            detailedRecipes: [] as any[],
            poRecipes: [] as any[],

            //MISC VARIABLES
            today: "",
            loading: false,
            statuses: [
                'Draft',
                'Submitted',
				'Ordered',
                'Indbound',
				'Delivered',
            ],

            //STUFF FROM THE PRODUCT VIEW THAT ISN'T USED

            productDialog: false,
            productInfoDialog: false,
            deleteProductsDialog: false,

            working: false,

            filtered: false,
            
            recipeProducts:[] as any[],

            toggleProduct: {} as any,

        }
    },
    created() {
        this.initFilters();
    },
    mounted() {
        console.log('Mounted');
        this.initVariables();
    },
    methods: {
        async initVariables(){
            try {
                await this.getPurchaseOrders();
                await this.getProducts();
                await this.getBoxes();
                await this.getVendors();
                await this.getRecipes();
                this.getDate();


            } catch (error) {
                console.log(error);
            }
        },

        async getPurchaseOrders(){
            try {
                this.loading = true;
                this.purchaseOrders = await action.getPurchaseOrders();
                
                this.loading = false;
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

        async getVendors(){
            try {
                this.vendors = await action.getVendors();
            } catch (error) {
                console.log(error);                
            }
        },

        async getRecipes(){
            try {
                this.recipes = await action.getRecipes();
            } catch (error) {
                console.log(error);
            }
        },

        selectRecipe(productMade: any, counter: number){

            //console.log("TESTING MAPS: ", this.recipes.filter(r => r.product_made === productMade.product_id));
            
            //console.log("PRODUCT  ", productMade);
            let usedProducts = [] as any[];
            let productMap = {} as any;

            let usedRecipes = this.recipes.filter(r => r.product_made === productMade.product_id);
            
            usedProducts = usedRecipes.flatMap(r => this.products.filter(p => p.product_id === r.product_needed));

            usedProducts.forEach(p => usedRecipes.find(r => p.product_id === r.product_needed))

            console.log("RECIPES USED ", usedRecipes);
            console.log("PRODUCTS USED ", usedProducts);
            //this.poCases[counter].recInfo = usedProducts;
            return usedProducts;
        },

        //Calculates various totals of raw product based on the current processed case being inputted
        //from the purchase order
        getRecipeTotal(amount:number){
            /*//The total amount of units for the current processed case in the array
            let procTotal = this.poCases[counter].units_per_case*amount;
            //console.log(procTotal);
            //Goes through each raw product used per processed bundle to calculate various totals
            this.poCases[counter].recInfo.forEach((ri: any) => {
                let usedTotal = procTotal*ri.recipe.units_needed;
                ri.used_total = usedTotal;

                //Rounds up to the nearest who box to order
                ri.raw_box_total = Math.ceil(usedTotal/ri.product.default_units_per_case);
                ri.raw_total = ri.raw_box_total * ri.product.default_units_per_case;
            })*/
            //console.log("RECIPE INFO: ", this.poCases[counter].recInfo);


        },

        formatCurrency(value: any) {
            if(value)
				return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
			return;
        },
        vendorSelect(){
            //WHEN BABY PAPER IS SELECTED, JUST CREATE ONE BOX WITH THE DESIRED AMOUNT TO ORDER
            this.vendorDialog = true;
            this.purchaseOrder = {};
        },
        selectVendorProducts(poVendor: any, status: any){
            let vendorProducts = [] as any[];
            
            if(status == 'proc'){
                this.procProducts.forEach(p => {
                    if(p['vendor'] == poVendor){
                        vendorProducts.push(p);
                    }
                })
            }

            else if (status == 'raw'){
                this.unprocProducts.forEach(p => {
                    if(p['vendor'] == poVendor){
                        vendorProducts.push(p);
                    }
                })
            }
            return vendorProducts;
        },

        openNew() {

            this.vendorDialog = false;
            this.poBoxes = [];
            this.poCases = [];
            this.selectedOrderType = "";
            this.amount = 1;

            this.purchaseOrder.date_ordered = this.today;
            this.purchaseOrder.status = "Draft";
            //this.purchaseOrder.raw = this.poBoxes;
            //this.purchaseOrder.cases = this.poCases


            //console.log(this.purchaseOrders[0].date_ordered.split('T')[0]);
            console.log(this.purchaseOrder)
            //console.log(this.selectedOrderType);
            
            this.newBulkArray();

            this.submitted = false;
            this.purchaseOrderDialog = true;
        },
        newBulkArray(){

            for(let idx = 0; idx < 3; idx++){
                this.addBulkLine(this.poCases);
                this.addBulkLine(this.poBoxes);
            }
        },
        addBulkLine(poArray: any){
            poArray.push(
                    {
                    name: '',
                    amount: 1,
                    }
                )
        },
        deleteBulkLine(array: any, counter: any){
            array.splice(counter,1);
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
            //console.log("PRODUCT ID", productId);

            let product = this.products.find(p => p.product_id === productId);

            return product.default_units_per_case;

            /*for (let idx = 0; idx < this.products.length; idx++) {
                if (this.products[idx].product_id == productId) {
                    console.log("PRODUCT NAME: ", this.products[idx].name);
                    return this.products[idx].default_units_per_case;
                }
            }*/
        },

        //Validates a purchase order before creation/editing.
        //Currently checks:
        //1) The PO has a name
        //2) All desired cases have an amount of 1 or greater
        //3) All desired raw boxes have an amount of 1 or greater
        validate() {
            this.submitted == true;

            let errAmount = 0;
            let errText = [];
            console.log("PO", this.purchaseOrder);
            console.log("PO CASES: ", this.poCases);
            console.log("PO BOXES: ", this.poBoxes);
            //console.log("NOT FLATTENED", this.purchaseOrder.cases);
            //console.log("FLATTENED PO ONE LEVEL", this.purchaseOrder.cases.flat());
            //console.log("FLATTENED PO TWO LEVELS", this.purchaseOrder.cases.flat(2));

            if(!this.purchaseOrder.purchase_order_name){
                errAmount++;
                errText.push("No PO name entered");
            }

            this.poCases.forEach((c: any) => {
                if (c.amount < 1)
                    errAmount++;
            })

            this.poCases.forEach((r: any) => {
                if (r.amount < 1)
                    errAmount++;
            })

            if (errAmount == 0){
                //this.savePurchaseOrder();
            }
            else{
                if(errAmount > 1)
                    this.$toast.add({severity:'error', summary: "There are "+errAmount+" total errors", detail: errText.join("/n")});
                else
                    this.$toast.add({severity:'error', summary: "There is "+errAmount+" error", detail: errText.join("/n")});
            }
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

                console.log("PURCHASE ORDER BEFORE AWAIT ",this.purchaseOrder);

                if (this.purchaseOrder.date_ordered) {
                    this.purchaseOrder.date_ordered = this.purchaseOrders[0].date_ordered.split('T')[0];
                }
                if (this.purchaseOrder.date_received){
                    this.purchaseOrder.date_received = this.purchaseOrders[0].date_received.split('T')[0];
                }

                await this.alocateBoxes();

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);
                
                console.log("PURCHASE ORDER AFTER AWAIT ",this.purchaseOrder);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Updated', life: 3000});
                await this.getPurchaseOrders();
                await this.getBoxes();

                return editedPurchaseOrder;
            } catch (error) {
                console.log(error);
                this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
            }
        },
        async alocateBoxes(){
            try {
                let relatedCases = this.displayInfo(this.purchaseOrder);
                let rcLength = relatedCases.length;
                console.log("LINKED CASES", relatedCases);
                console.log("BULK CASES IN ALOCATE ",this.poCases);
                for(let bcIdx=0; bcIdx < this.poCases.length; bcIdx++){

                    console.log(bcIdx);

                    console.log(this.poCases[bcIdx]);
                    let totalAmount = this.poCases[bcIdx].total;
                    let qty = this.poCases[bcIdx].units_per_case;

                    let boxAmount = totalAmount/qty;
                    let wholeBoxAmount = Math.floor(boxAmount);
                    let remainder = boxAmount - wholeBoxAmount;
                    let partialBox = Math.round(remainder*qty);
                    let backOrderBoxAmount = 0;
                    if (partialBox>0){
                        backOrderBoxAmount = qty-partialBox;
                    }

                    console.log("BOX AMOUNT", boxAmount);
                    console.log("WHOLE BOX AMOUNT", wholeBoxAmount);
                    console.log("REMAINDER", remainder);
                    console.log("PARTIAL BOX", partialBox);
                    console.log("BACK ORDER BOX AMOUNT", backOrderBoxAmount);

                    for(let rcIdx = 0; rcIdx < rcLength; rcIdx++){
                        if (relatedCases[rcIdx].product_id == this.poCases[bcIdx].product_id){
                            if(wholeBoxAmount > 0){
                                relatedCases[rcIdx].status = 'Ready';
                                relatedCases[rcIdx].date_received = this.today;
                                wholeBoxAmount--;
                            } else if (wholeBoxAmount == 0 && partialBox > 0){
                                //If a partial box arrives, update the last box amount to partial amount a create 
                                // an additional box whose status is back ordered
                                let boBox = [] as any[];
                                boBox[<any>'name'] = relatedCases[rcIdx].name;
                                boBox[<any>'product_id'] = relatedCases[rcIdx].product_id
                                boBox[<any>'purchase_order_id'] = relatedCases[rcIdx].purchase_order_id

                                relatedCases[rcIdx].units_per_case = partialBox;
                                relatedCases[rcIdx].status = 'Ready';
                                relatedCases[rcIdx].date_received = this.today;

                                boBox[<any>'units_per_case'] = backOrderBoxAmount;
                                boBox[<any>'status'] = 'BO'
                                relatedCases.push(boBox);

                                partialBox = 0;

                                this.purchaseOrder.status = 'Partially Delivered'
                            } else if (wholeBoxAmount == 0 && partialBox == 0) {
                                //If no partial box arrives, update the remaining box amounts to backorder
                                relatedCases[rcIdx].status = 'BO';
                                this.purchaseOrder.status = 'Partially Delivered'
                            }
                        }
                    }

                }
                console.log(relatedCases);
                for (let rcIdx = 0; rcIdx < relatedCases.length; rcIdx++){
                    console.log("PRODUCT NAME: ", relatedCases[rcIdx].name, "BOX AMOUNT: ", relatedCases[rcIdx].units_per_case, "BOX STATUS: ", relatedCases[rcIdx].status)
                    if (relatedCases[rcIdx].case_id){
                        await action.editCase(relatedCases[rcIdx]);
                    } else {
                        await action.addCase(relatedCases[rcIdx]);
                    }
                }
            } catch (error) {
                console.log(error);
                this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
            }
        },
        async confirmCreate(){
            try {
                this.purchaseOrders.push(this.purchaseOrder);
                let addedPurchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);

                this.poCases.forEach(async (indivCase: any) => {
                    if (indivCase.product_id){

                        indivCase.status = 'Ordered';

                        indivCase.units_per_case = indivCase.default_units_per_case;

                        indivCase.purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

                        for(let amountIdx = 0; amountIdx < indivCase.amount; amountIdx++){
                            console.log("INDIVCASE: ", indivCase);
                            await action.addCase(indivCase)

                            indivCase.recInfo.forEach(async (indivRawProd: any) => {
                                
                                indivRawProd.product.status = 'Ordered';

                                indivRawProd.product.units_per_case = indivRawProd.product.default_units_per_case;

                                indivRawProd.product.purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

                                for(let prodIdx = 0; prodIdx < indivRawProd.raw_box_total; prodIdx++){
                                    console.log("INDIVRAWPROD: ", indivRawProd);
                                    await action.addCase(indivRawProd.product);
                                }
                            })
                        }
                    }
                });

                this.poBoxes.forEach(async (rawProduct: any) => {
                    rawProduct.units_per_case = rawProduct.default_units_per_case;
                    for(let prodIdx = 0; prodIdx < rawProduct.amount; prodIdx++){
                        console.log("RAWPRODUCT: ", rawProduct);
                        await action.addCase(rawProduct);
                    }
                });

                try {
                    console.log(this.poCases);
                    for(let caseIdx = 0; caseIdx < this.poCases.length; caseIdx++){
                        //console.log(this.poCases[caseIdx].case_id);
                        if(this.poCases[caseIdx].product_id){
                            console.log("LAST INSERT ID", addedPurchaseOrderId);
                            this.poCases[caseIdx].status = 'Ordered';
                            this.poCases[caseIdx].purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

                            console.log(this.poCases[caseIdx]);

                            for(let amountIdx = 0; amountIdx < this.poCases[caseIdx].amount; amountIdx++){
                                console.log("CASE ADDED ", this.poCases[caseIdx]);
                                //this.cases.push(this.poCases[caseIdx]);
                                await action.addCase(this.poCases[caseIdx]);
                            }
                        }
                    }
                    this.getBoxes();

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
        confirmOrderReceived(purchaseOrder: any) {
            this.purchaseOrder = {...purchaseOrder}; //ASK MICHAEL
            this.purchaseOrder.status = 'Delivered';
            this.poCases = [];

            let currentCase = [];

            for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                if (this.cases[caseIdx].purchase_order_id == this.purchaseOrder.purchase_order_id){
                    console.log(this.cases[caseIdx])
                    currentCase = this.cases[caseIdx];
                    currentCase.total = this.cases[caseIdx].units_per_case;
                    currentCase.duplicate = false;
                    console.log('CURRENT CASE', currentCase);

                    for(let bcIdx = 0; bcIdx < this.poCases.length; bcIdx++){
                        if (this.poCases[bcIdx].name == currentCase.name){
                            console.log("DUPLICATE CASE")
                            this.poCases[bcIdx].total += currentCase.total;
                            this.poCases[bcIdx].plannedTotal = this.poCases[bcIdx].total;
                            currentCase.duplicate = true;
                            console.log(currentCase);
                        }
                    }
                    if(currentCase.duplicate == false){
                        this.poCases.push(this.cases[caseIdx]);
                    }
                    
                }
            }

            this.purchaseOrderDialog = true;
        },
        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Purchase Order Expanded', detail: event.data.purchase_order_name, life: 3000 });
            
            console.log("EVENT DATA ",event.data);



            let map = [] as any[];
            let recipe = [] as any[];
            this.recipeProducts = [];

            //console.log("EVENT ARRAY", event.data.purchase_order_id);
            //console.log("CASES", this.cases);


            for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                if(this.cases[caseIdx].purchase_order_id == event.data.purchase_order_id){
                    console.log(this.cases[caseIdx].name);
                    
                }
            }

            return recipe;
        },
        displayInfo(po: any): any[] {
            console.log(po);
            let linkedCases = [] as any[]; 
            let total = 0;

            for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                if (this.cases[caseIdx].purchase_order_id == po.purchase_order_id){
                    total+=this.cases[caseIdx].units_per_case;
                    linkedCases.push(this.cases[caseIdx]);
                }
            }
            console.log(total);

            console.log("LINKED CASES ", linkedCases);

            return linkedCases;
        },
        calculateBoxTotal(name: any, purchase_order_id: any){
            let total = 0;

            if (this.cases) {
                for (let c of this.cases) {
                    if (c.name == name && c.purchase_order_id == purchase_order_id) {
                        total++;
                    }
                }
            }

            return total;
        },
        calculateTotalQTY(name: any, purchase_order_id: any){
            let total = 0;

            if (this.cases) {
                for (let c of this.cases) {
                    if (c.name == name && c.purchase_order_id == purchase_order_id) {
                        total += c.units_per_case;
                        //console.log(c.units_per_case);
                        //console.log(total + c.units_per_case);
                    }
                }
            }

            return total;
        },

        getPOSeverity(po: any) {
            switch (po.status) {
                case 'Delivered':
                    return 'success';

                case 'Canceled':
                    return 'danger';

                case 'Partially Delivered':
                    return 'warning';

                case 'Ordered':
                    return 'info';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'info';
            }
        },
        getPOIcon(c: any){
            switch (c.status) {
                case 'Delivered':
                    return 'pi pi-check';

                case 'Canceled':
                    return 'pi pi-times';

                case 'Partially Delivered':
                    return 'pi pi-hourglass';

                case 'Ordered':
                    return 'pi pi-truck';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'pi pi-question-circle';
            }
        },
        onTotalUpdate(total: any, units_per_case: any){
            let qty = Math.ceil(total/units_per_case);
            return qty;
        },
        onQtyUpdate(qty: any, units_per_case: any){
            let total = qty*units_per_case;
            return total;
        },
        confirmCancelOrder(purchaseOrder: any) {
            this.purchaseOrder = purchaseOrder;
            this.cancelOrderDialog = true;
        },
        async cancelOrder() {
            try {
                //let stop = this.validateDelete(this.product);
                //console.log(stop);
                this.cancelOrderDialog = false;

                this.purchaseOrder.status = 'Canceled';

                //DATE FORMATTING IS BEING WEIRD I JUST WANT TO SEE IF THE CANCEL FUNCTION WORKS
                this.purchaseOrder.date_ordered = null;

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);

                for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                    if (this.cases[caseIdx].purchase_order_id == this.purchaseOrder.purchase_order_id){
                        this.cases[caseIdx].status = "Canceled"

                        action.editCase(this.cases[caseIdx]);
                    }
                }
                
                this.getPurchaseOrders();
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Order Canceled', life: 3000});

                this.purchaseOrder = {};
                return editedPurchaseOrder;
            } catch (err) {
                console.log(err);

                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },



        //STUFF THAT HASN'T BEEN CHECKED AND MOVED OVER YET-------------------------------------------------

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
