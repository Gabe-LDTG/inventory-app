<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label=" New" icon="pi pi-plus" severity="success" class="mr-2 inline-block" @click="openNew" />
                    <!-- <Button label=" Delete" icon="pi pi-trash" class="mr-2 inline-block" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCases" /> -->
                    <!-- <Button label=" New Purchase Order" icon="pi pi-upload" class="mr-2 inline-block" @click="openBulk()"  /> -->
                </template>

                <template #end>
                    
                    <!-- <FileUpload mode="basic" :customUpload="true" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @upload="onUpload" /> -->
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>
            </Toolbar>

            <!-- sortMode="single" sortField="name"  WAS MAKING REMOVEABLE SORT BREAK-->
            <!-- MIGHT HAVE BEEN TO ORGANIZE TTHE GROUPED ITEMS BY NAME. WILL WORK ON IF NEED BE -->
            <DataTable ref="dt" :value="cases" v-model:selection="selectedCases" dataKey="case_id"
                :paginator="true" :rows="10" :filters="filters" 
                :selectAll="false"
                removableSort
                showGridlines
                stripedRows
                :style="{ fontSize: (15 * tableZoom) + 'px', zoom: tableZoom, width: '100%'}"
                :loading="loading"
                @rowgroup-expand="onRowGroupExpand"
                :expandedRows="expandedRows"
                :globalFilterFields="['product_name']"
                :virtualScrollerOptions="{ itemSize: 46 }"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 v-if="displayValue === 'processed'" class="m-0">Manage Cases</h4>
                        
                        <h4 v-else-if="displayValue === 'unprocessed'" class="m-0">Manage Boxes</h4>
                        
                        <ZoomDropdown v-model="tableZoom" />

                        <!-- <Button type="button"  label="Display Ordered Cases" outlined @click="ordersFiltered = !ordersFiltered; onFilter()" /> -->

						<span class="p-input-icon-right">
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </span>
					</div>
                </template>

                <template #loading> Loading product data. Please wait. </template>

                <!-- <template #groupheader="slotProps">
                    <div class="flex align-items-center gap-2" style="background-color:#ddd;">
                        <span class="flex justify-content-start font-bold w-full">{{ slotProps.data.name }}</span>
                        <div class="flex justify-content-end font-bold w-full">Total Number of Boxes: {{ calculateBoxTotal(slotProps.data.name) }}</div>
                        <div class="flex justify-content-end font-bold w-full">Total QTY: {{ calculateTotalQTY(slotProps.data.name) }}</div>
                    </div>
                </template> -->

                <div v-if="displayValue === 'processed'" class="flex align-items-center">
                    <Column expander header="Individual Cases" style="width: 5rem" />
                </div>
                <div v-else-if="displayValue === 'unprocessed'" class="flex align-items-center">
                    <Column expander header="Individual Boxes" style="width: 5rem" />
                </div>
                <Column field="product_name" header="Name" sortable />
                
                <Column field="status" header="Status" sortable>
                    <template #body="slotProps">
                        <div class="card flex flex-wrap  gap-2">
                            <Tag :value="slotProps.data.status" :severity="getCaseSeverity(slotProps.data)" :icon="getCaseIcon(slotProps.data)" iconPos="right"/>
                        </div>
                    </template>
                </Column>
                <div v-if="displayValue === 'processed'" class="flex align-items-center">
                    <Column field="units_per_case" header="Units per case" sortable/>
                    <Column field="amount" header="Number of cases" sortable />
                </div>
                <div v-else-if="displayValue === 'unprocessed'" class="flex align-items-center">
                    <Column field="units_per_case" header="Units per box" sortable/>
                    <Column field="amount" header="Number of boxes" sortable />
                </div>

                <Column header="Total # Of Units" sortable>
                    <template #body="{data}">
                        {{ data.units_per_case * data.amount }}
                    </template>
                </Column>

                <Column field="location_name" header="Location" sortable>
                    <template #body="{data}">
                        {{ formatLocations(data.location) }}
                    </template>
                </Column>

                <template #expansion="{data}" style="background-color: '#16a085'">
                    <DataTable :value="getIndivCases(data.product_id, data.units_per_case)" v-model:selection="selectedCases" dataKey="case_id"
                    removableSort
                    :paginator="true" :rows="5"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport">
                        <Column header="PO">
                            <template #body="{data}">
                                {{ getPoName(data.purchase_order_id) }}
                            </template>
                        </Column>
                        <Column field="product_name" header="Name"  />
                        <div v-if="displayValue === 'processed'" class="flex align-items-center">
                            <Column field="units_per_case" header="Units per case" />
                        </div>
                        <div v-else-if="displayValue === 'unprocessed'" class="flex align-items-center">
                            <Column field="units_per_case" header="Units per box" />
                        </div>
                        <Column field="amount" header="Number of boxes" sortable />
                        <Column header="Total # Of Units" sortable>
                            <template #body="{data}">
                                {{ data.units_per_case * data.amount }}
                            </template>
                        </Column>
                        <Column field="location_name" header="Location">
                            <template #body="slotProps">
                                {{ getIndivLocation(slotProps.data.location_id) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="slotProps">
                                <div class="card flex flex-wrap  gap-2">
                                    <Tag :value="slotProps.data.status" :severity="getCaseSeverity(slotProps.data)" :icon="getCaseIcon(slotProps.data)" iconPos="right"/>
                                </div>
                            </template>
                        </Column>
                        <Column field="notes" header="Notes" sortable/>
                        <!-- <Column field="date_received" header="Date received" sortable >
                            <template #body="slotProps">
                                {{ slotProps.data.date_received }}
                            </template>
                        </Column> -->
                        <Column :exportable="false" style="min-width:8rem">
                            <template #body="slotProps">
                                <Button icon="pi pi-pencil"  v-tooltip.top="'Edit'" outlined rounded class="mr-2" @click="editCase(slotProps.data)" />
                                <Button icon="pi pi-trash"  v-tooltip.top="'Delete'" outlined rounded severity="danger" @click="confirmDeleteCase(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
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
                            <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num }}</div>
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

            <div class="field">
                <label for="location">Location:</label>
                <!-- <InputText id="location" v-model="eCase.location" rows="3" cols="20" /> -->
                <Dropdown v-model="eCase.location_id"
                placeholder="Select a Location" class="w-full md:w-14rem" editable
                :options="locations"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="name"
                optionValue="location_id" />
                <Button label="Add Location" icon="pi pi-plus" @click="newLocation()"  />
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
                <Dropdown v-model="eCase.status"
                placeholder="Select a Status" class="w-full md:w-14rem" editable
                :options="statuses"/>
            </div>

            <template #footer>
                <div v-show="eCase.case_id" class="field">
                    <label for="amount">How Many to Edit?</label>
                    <InputNumber inputId="stacked-buttons" required="true" 
                    v-model="eCase.amount" showButtons/>
                </div>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveCase" />
                <!-- <Button label="Edit One" icon="pi pi-check" text @click="saveCase" />
                <Button label="Edit All" /> -->
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCaseDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <label for="amount">How many to delete?</label>
                    <InputNumber inputId="stacked-buttons" required="true" 
                    v-model="eCase.amount" showButtons/>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteCaseDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="bulkDeleteCase" />
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
                    <InputText id="location" v-model="bCase.location_id" rows="3" cols="20" />
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

        <Dialog v-model:visible="locationDialog" :style="{width: '450px'}" header="Add Location" :modal="true">
            <div class="field">
                <label>Location Name:</label>
                <InputText id="location" v-model="locationToCreate.name" rows="3" cols="20" />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="locationDialog = false;"/>
                <Button label="Save" icon="pi pi-check" text @click="createLocation" />
            </template>
        </Dialog>
	</div>
</template>

<script lang="ts">
//import { ProductService } from '@/components/service/ProductService';
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils";
import ZoomDropdown from './ZoomDropdown.vue';

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712


export default {
    components: {
        ZoomDropdown
    },
    props: {
        displayValue: String,
    },
    data() {
        return {
            //CASE VARIABLES
            dbCases: [] as any[],
            cases: [] as any[],
            caseDialog: false,
            deleteCaseDialog: false,
            deleteCasesDialog: false,
            eCase: {} as any,
            oldCaseValues: {} as any,
            selectedCases: [] as any[],
            filteredCases: [] as any[],
            bulkCases: [] as any[],

            //PRODUCT VARIABLES
            products: [] as any[],
            product: {} as any,

            //LOCATION VARIABLES
            locations: [] as any[],
            locationToCreate: {} as any,
            locationDialog: false,

            //MISC VARIABLES
            ordersFiltered: true,
            //expandedRowGroups: [] as any,
            expandedRowGroups: null,
            expandedRows: [],
            statuses: [
                'Partial Reserved',
                'On RTP',
				'FBM',
                'Do Not Ship',
                'JUST ARRIVED',
				'Pool',
                'NEEDS PLAN',
                'Reserved',
                'NEED TO CHECK'
            ],

            purchase_orders: [] as any[],

            bulkInsertDialog: false,
            
            bulkAmount: 3,
            purchaseOrder: "",

            amount: 1,

            loading: false,

            today: "",

            context: {} as any,

            tableZoom: 1,

            filters: {
                global: { value: "", matchMode: FilterMatchMode.CONTAINS },
            } as any,
            submitted: false,
            /* statuses: [
				{label: 'INSTOCK', value: 'instock'},
				{label: 'LOWSTOCK', value: 'lowstock'},
				{label: 'OUTOFSTOCK', value: 'outofstock'}
            ], */

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

        //this.getDate();
        //this.onFilter();

        //console.log("PRODUCTS",this.products);
        //console.log("CASES",this.cases);
    },
    methods: {
        async displayController(value: string){
            this.loading = true;

            this.today = helper.getDate();
            
            await this.getLocations();

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
            //Possibly try doing this for the product vendors when you have more time
            //Seems more effecient than current trying for two for loops.
            this.dbCases.forEach(c => {
                if (c.date_received){ c.date_received = helper.formatDate(c.date_received)};
            })

            // console.log(this.cases);
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

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-11-2024
        async getProcCases(){
            try {
                this.loading = true;
                this.dbCases = await action.getProcDeliveredCases();
                console.log(this.dbCases);
                this.cases = this.groupBoxes(this.dbCases);
                console.log(this.cases);
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

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-11-2024
        async getUnprocCases(){
            try {
                this.loading = true;
                this.dbCases = await action.getUnprocDeliveredBoxes();
                console.log(this.dbCases);
                this.cases = this.groupBoxes(this.dbCases);
                console.log(this.cases);
                this.purchase_orders = await action.getPurchaseOrders();
                /* for (let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                    //console.log("CASE ",this.cases[caseIdx]);
                    if(this.cases[caseIdx].status == 'Canceled'){
                        //console.log("Canceled product, don't display");
                        this.cases.splice(caseIdx, 1);
                        //Have to decrement the index because array length has been reduced by one
                        caseIdx--;
                    }
                    if(this.cases[caseIdx].status != 'Ready'){
                        this.filteredCases.push(this.cases[caseIdx]);
                    }
                    for (let poIdx = 0; poIdx < this.purchase_orders.length; poIdx++){
                        if (this.cases[caseIdx].purchase_order_id == this.purchase_orders[poIdx].purchase_order_id){
                            this.cases[caseIdx].purchase_order_name = this.purchase_orders[poIdx].purchase_order_name;
                            //console.log(this.cases[caseIdx]);
                        }

                    }
                } */
                this.loading = false;
            } catch (err) {
                console.log(err);
            }
        },

        async getLocations(){
            try {
                this.locations = await action.getLocations();
            } catch (error) {
                console.log(error);
            }
        }, 

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-11-2024
        //Date Last Edited: 6-11-2024
        getIndivCases(productId: number, unitsPerCase: number){
            return this.groupByLocation(this.dbCases.filter(c => c.product_id === productId && c.units_per_case === unitsPerCase));
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-11-2024
        //Date Last Edited: 6-12-2024
        getIndivLocation(locationId: number){
            //console.log("LOCATION ID",locationId);
            //console.log("LOCATIONS", this.locations)
            let location = this.locations.find(l => l.location_id === locationId);
            //console.log("LOCATION",location);
            if(location !== undefined){
                return location.name;
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-12-2024
        //Date Last Edited: 6-12-2024
        formatLocations(locations: any[]){
            // console.log(locations)
            if(locations){
                let locationNames = [] as any[];
                locations.forEach(loc => {
                    if (loc){
                        let curLoc = this.locations.find(l => l.location_id === loc);
                        //console.log(loc)
                        // console.log(curLoc)
                        locationNames.push(curLoc.name);
                    }
                })
                return locationNames.toString();
            }
            
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

        //EVENTUALLY PUT THIS IN A NEW TS FILE (IE "helperFunctions.ts")

        openNew() {
            this.eCase = [];
            this.eCase.status = 'Just Prepped';
            this.submitted = false;
            this.amount = 1;
            //this.eCase.date_received = this.today;
            
            this.caseDialog = true;
        },
        newLocation(){
            this.locationToCreate = {};

            this.locationDialog = true;
        },
        async createLocation(){
            try {
                await action.addLocation(this.locationToCreate);

                this.getLocations();

                this.locationDialog = false;
                this.locationToCreate = {};
                
            } catch (error) {
                console.log(error);
            }
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
        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-12-2024
        async saveCase() {
            try {
                this.submitted = true;
                console.log(this.eCase);

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

        //Description: Grabs the requested amount of boxes/cases by linking the database variables by 
        // product type, location, box/case unit quantity, and status. Then, the filtered 2d array of 
        // boxes/cases to edit is sent to the backend for updating.
        //
        //Created by: Gabe de la Torre
        //Date Created: 2-6-2025
        //Date Last Edited: 6-12-2024
        async confirmEdit(){
            try {
                //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;
                // console.log("eCase: ",this.eCase);
                // console.log("DB cases: ", this.dbCases);

                // console.log(this.eCase);

                if(this.eCase.date_received)
                this.eCase.date_received = this.eCase.date_received.split('T')[0];

                // console.log('Old case values ', this.oldCaseValues);

                // Match database boxes/cases by product type, location, unit quantity, and status
                let boxesToEdit = this.dbCases.filter(box => box.product_id === this.oldCaseValues.product_id &&  box.location_id === this.oldCaseValues.location_id && box.status === this.oldCaseValues.status && box.units_per_case === this.oldCaseValues.units_per_case)
    
                // console.log("BOXES TO EDIT", boxesToEdit);
                let editBoxArray = [] as any[];

                // console.log("Box amount: ",this.eCase.amount);

                // Loop through based on the user-inputted amount before updating and formatting the values
                for(let boxIdx = 0; boxIdx < this.eCase.amount; boxIdx++){
                    console.log('Box to Edit in loop', boxesToEdit[boxIdx]);
                    if(boxesToEdit[boxIdx]){
                        let boxMap = [] as any[];
                        console.log(boxesToEdit[boxIdx]);
                        boxesToEdit[boxIdx].units_per_case = this.eCase.units_per_case;
                        boxesToEdit[boxIdx].date_received = this.eCase.date_received;
                        boxesToEdit[boxIdx].notes = this.eCase.notes;
                        boxesToEdit[boxIdx].product_id = this.eCase.product_id;
                        boxesToEdit[boxIdx].location_id = this.eCase.location_id;
                        boxesToEdit[boxIdx].status = this.eCase.status;
                        boxesToEdit[boxIdx].purchase_order_id = this.eCase.purchase_order_id;
                        boxesToEdit[boxIdx].request_id = this.eCase.request_id;

                        boxMap = [
                            boxesToEdit[boxIdx].units_per_case,
                            boxesToEdit[boxIdx].date_received,
                            boxesToEdit[boxIdx].notes,
                            boxesToEdit[boxIdx].product_id,
                            boxesToEdit[boxIdx].location_id,
                            boxesToEdit[boxIdx].status,
                            boxesToEdit[boxIdx].purchase_order_id,
                            boxesToEdit[boxIdx].request_id,
                            boxesToEdit[boxIdx].case_id
                        ];
                        editBoxArray.push(boxMap);
                    }
                }
                console.log("Edit Box Array: ",editBoxArray);
                //await action.editCase(this.eCase);

                // Send the updated values to the backend before grabbing the database records again.

                await action.bulkEditCases(editBoxArray);

                if(this.displayValue == 'processed'){
                    console.log('Processed');
                    await this.getProcCases();

                }
                else if(this.displayValue == 'unprocessed'){
                    console.log('Unprocessed');
                    await this.getUnprocCases();
                }
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-12-2024
        async confirmCreate(){
            try {
                console.log("NEW CASE", this.eCase);

                // TODO: MOVE LOOP TO BACKEND
                /* for(let i = 0; i < this.amount; i++){
                    await action.addCase(this.eCase);
                    console.log("LOOP CASE ",this.eCase);
                } */
               this.eCase.amount = this.amount;

                /** @TODO Add a field in the form for request id's possibly, for now, just setting to null */
                this.eCase.request_id = null;

                await action.batchCreateCases(this.eCase);
                //Had to regrab the list of cases because of weird formatting.
                //ASK MICHAEL IF THERES A BETTER WAY
                if(this.displayValue == 'processed'){
                    console.log('Processed');
                    await this.getProcCases();

                }
                else if(this.displayValue == 'unprocessed'){
                    console.log('Unprocessed');
                    await this.getUnprocCases();
                }
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case(s) Created', life: 3000});
            } catch (err: any) {
                console.log(err);
                // console.log("CREATE CATCH")
                this.$toast.add({severity:'error', summary: 'Error', detail: err.request.data, life: 3000});
            }
        },
        editCase(value: any) {
            this.product = {...value}; //ASK MICHAEL
            this.eCase = {...value};
            this.oldCaseValues = {...value};
            //this.productDialog = true;
            this.caseDialog = true;
        },
        confirmDeleteCase(value: any) {
            this.product = value;
            this.eCase = value;
            this.deleteCaseDialog = true;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-12-2024
        async bulkDeleteCase() {
            try {
                //this.dbCases = this.dbCases.filter(c => c.case_id !== this.eCase.case_id);
                let id_array = [] as number[];
                let boxesToDelete = this.dbCases.filter(box => box.product_id === this.eCase.product_id &&  box.location_id === this.eCase.location_id && box.status === this.eCase.status && box.units_per_case === this.eCase.units_per_case)
                console.log('Boxes to delete: ', boxesToDelete);

                console.log(this.eCase.amount);

                for (let delIdx=0; delIdx < this.eCase.amount; delIdx++){
                    let boxMap = boxesToDelete[delIdx];
                    // console.log("Box Map: ", boxMap);
                    id_array.push(boxMap.case_id);
                }

                console.log("ID array", id_array);

                await action.bulkDeleteCase(id_array);

                if(this.displayValue == 'processed'){
                    console.log('Processed');
                    await this.getProcCases();

                }
                else if(this.displayValue == 'unprocessed'){
                    console.log('Unprocessed');
                    await this.getUnprocCases();
                }

                this.deleteCaseDialog = false;
                this.eCase = {};
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case(s) Deleted', life: 3000});
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
                //    await action.deleteCase(this.selectedCases[i].case_id);
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
        getCaseSeverity(c: any) {
            //console.log("CASE SEVERITY ", c.status);
            switch (c.status) {
                case 'Ready':
                    return 'success';

                case 'Canceled':
                    return 'danger';

                case 'BO':
                    return 'warning';

                case 'Ordered':
                    return 'info';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'info';
            }
        },
        getCaseIcon(c: any){
            switch (c.status) {
                case 'Ready':
                    return 'pi pi-check';

                case 'Canceled':
                    return 'pi pi-times';

                case 'BO':
                    return 'pi pi-hourglass';

                case 'Ordered':
                    return 'pi pi-truck';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'pi pi-question-circle';
            }
        },
        onFilter(){
            console.log("FILTERED CASES", this.filteredCases);
            if(this.ordersFiltered == true){
                console.log("FILTERED")
                for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                    for(let filterIdx = 0; filterIdx < this.filteredCases.length; filterIdx++){
                        if (this.filteredCases[filterIdx].id == this.cases[caseIdx].id){
                            this.cases.splice(caseIdx, 1);
                            //Have to decrement the index because array length has been reduced by one
                            caseIdx--;
                            break;
                        }
                    }
                }
            } else if(this.ordersFiltered == false){
                console.log("UNFILTERED")
                for(let filterIdx = 0; filterIdx < this.filteredCases.length; filterIdx++){

                    this.cases.push(this.filteredCases[filterIdx]);
                }
                console.log("UNFILTERED CASES", this.cases);
            }; 
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-11-2024
        //Date Last Edited: 6-12-2024
        groupBoxes(boxArray: any[]){
            // get the products in the pool along with their amount
            let pool: (typeof boxArray)[number] & { amount: number } = Object.values(boxArray.reduce((map, product) => {
                const key = product.product_id + ':' + product.units_per_case;
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                    if(map[key].location.find((l: any) => l === product.location_id) === undefined){
                        //console.log("DIFFERENT LOCATION");
                        map[key].location.push(product.location_id);
                        // console.log(map[key].location);
                    } 
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: [product.location_id], amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof boxArray)[number] & { amount: number } }));

            return pool;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-11-2024
        //Date Last Edited: 7-10-2024
        groupByLocation(boxArray: any[]){
            // get the products in the pool along with their amount
            let pool: (typeof boxArray)[number] & { amount: number } = Object.values(boxArray.reduce((map, product) => {
                const key = product.product_id + ':' + product.location_id + ':' + product.status + ':' + product.purchase_order_id;
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location_id, status: product.status, amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof boxArray)[number] & { amount: number } }));

            return pool;
        },

        getPoName(poId: number){
            let po = this.purchase_orders.find(po => po.purchase_order_id === poId);
            let name = "N/A";

            if (po !== undefined)
                name = po.purchase_order_name;

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
