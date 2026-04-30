<template>
    <div class="pl-scale-shell">
        <div class="pl-scale-root">
        <div class="card">
            <Toast />
            <Toolbar class="mb-4 pl-toolbar">
                <template #start>
                    <span class="p-input-icon-right pl-toolbar-search">
                        <InputText v-model="searchText" placeholder="Search..." />
                    </span>
                </template>

                <template #end>
                    <div class="pl-toolbar-actions">
                        <Button label="Processed" :class="['pl-action-btn', 'pl-action-btn--secondary', 'pl-action-btn--processed', { 'is-active': displayType === 'proc' }]" @click="toggleProducts('proc')" />
                        <Button label="All" :class="['pl-action-btn', 'pl-action-btn--secondary', 'pl-action-btn--all', { 'is-active': displayType === 'all' || !displayType }]" @click="toggleProducts('all')" />
                        <Button label="Unprocessed" :class="['pl-action-btn', 'pl-action-btn--secondary', 'pl-action-btn--unprocessed', { 'is-active': displayType === 'unproc' }]" @click="toggleProducts('unproc')" />
                    </div>
                </template>

                <!-- <template #end>
                    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @uploader="onUpload"/>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template> -->
            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <div class="dt-loading-wrapper">
            <Transition name="loader-fade">
                <div v-if="tableLoading" class="dt-loading-overlay">
                    <div class="loading-card">
                        <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="3" fill="transparent" animationDuration=".9s" />
                        <span class="loading-label">Loading&hellip;</span>
                    </div>
                </div>
            </Transition>
            <!-- <DataTable ref="dt" :value="displayProducts" v-model:selection="selectedProducts" dataKey="product_id"
                :paginator="false" :rows="10" :filters="filters"
                :selectAll="false"
                removableSort
                showGridlines
                stripedRows
                columnResizeMode="fit"
                scrollable scrollHeight="800px"
                :loading="loading"
                :expandedRows="expandedRows" @rowExpand="onRowExpand"
                :virtualScrollerOptions="{ lazy: true, onLazyLoad: onLazyLoad, itemSize: 46, delay: 200, numToleratedItems: 10 }"
                :style="{ fontSize: (15 * tableZoom) + 'px', zoom: tableZoom, width: '100%'}"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"> -->
                <DataTable
                    ref="dt"
                    class="pl-product-table"
                    :value="displayProducts"
                    v-model:selection="selectedProducts"
                    dataKey="product_id"
                    :lazy="true"
                    :filters="filters"
                    :selectAll="false"
                    removableSort
                    showGridlines
                    scrollable 
                    scrollHeight="calc(100vh - 230px)"
                    stripedRows
                    columnResizeMode="fit"
                    :loading="tableLoading"
                    :rowStyle="rowStyleProductRow"
                    :expandedRows="expandedRows"
                    @rowToggle="onRowToggle"
                    :paginator="true"
                    :rows="rowsPerPage"
                    :totalRecords="totalRecords"
                    @page="onPage"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                >
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Products</h4>
						<div class="flex flex-wrap gap-2 align-items-center pl-table-header-actions">
                            <ZoomDropdown v-model="tableZoom" />
                            <Button label="New" icon="pi pi-plus" class="pl-action-btn pl-action-btn--primary" @click="openNew" />
                            <Button label="Delete" icon="pi pi-trash" class="pl-action-btn pl-action-btn--danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || selectedProducts.length === 0" />
                        </div>
					</div>
                </template>

                <template #loading> Loading product data. Please wait. </template>
                <Column selectionMode="multiple" :exportable="false" :style="{ width: '60px', minWidth: '60px' }"></Column>

                <Column expander header="Recipe" :style="{ width: '80px', minWidth: '80px' }"/>

                <template #expansion="slotProps">
                    <div class="p-3">
                        <h3>Recipe for {{ slotProps.data.name }}</h3>
                        <div v-if="slotProps.data.fnsku || slotProps.data.asin">
                            PROCESSED

                            <DataTable :value="getProductRecipes(slotProps.data.product_id)">
                                <Column field="name" header="Product(s) Needed"></Column>
                                <Column field="item_num" header="Item #"></Column>
                                <Column field="qty" header="Raw Unit(s) Needed Per Processed Unit"></Column>
                            </DataTable>
                        </div>
                        <div v-else-if="!slotProps.data.fnsku && !slotProps.data.asin">
                            This item is raw and has no recipe.
                        </div>
                    </div>
                </template>

                <Column field="name" header="Name" sortable :style="{ width: '200px', minWidth: '200px' }"></Column>
                <Column field="vendor_name" header="Vendor" sortable :style="{ width: '150px', minWidth: '150px' }"/>
                <Column header="Default Units/Case" :style="{ width: '130px', minWidth: '130px' }">
                    <template #body="{data}">
                        <div :class="{'warning-cell': !data.default_units_per_case || data.default_units_per_case <= 0, 'cell-content': true}">
                            {{ (!data.default_units_per_case || data.default_units_per_case <= 0) ? '[MISSING VALUE]' : data.default_units_per_case }}
                        </div>
                    </template>
                </Column>
                <Column header="ASIN" sortable :style="{ width: '150px', minWidth: '150px' }">
                    <template #body="{data}">
                        <div :class="{'warning-cell': isProcessedProduct(data) && !data.asin, 'cell-content': true}">
                            {{ isProcessedProduct(data) && !data.asin ? '[MISSING VALUE]' : (data.asin || '-') }}
                        </div>
                    </template>
                </Column>
                <Column header="FNSKU" sortable :style="{ width: '150px', minWidth: '150px' }">
                    <template #body="{data}">
                        <div :class="{'warning-cell': isProcessedProduct(data) && !data.fnsku, 'cell-content': true}">
                            {{ isProcessedProduct(data) && !data.fnsku ? '[MISSING VALUE]' : (data.fnsku || '-') }}
                        </div>
                    </template>
                </Column>
                <Column field="item_num" header="Item #" sortable :style="{ width: '130px', minWidth: '130px' }">
                    <template #body="{data}">
                        <div :class="{'warning-cell': !isProcessedProduct(data) && !data.item_num, 'cell-content': true}">
                            {{ !isProcessedProduct(data) && !data.item_num ? '[MISSING VALUE]' : (data.item_num || '-') }}
                        </div>
                    </template>
                </Column>   
                <Column header="UPC" sortable :style="{ width: '150px', minWidth: '150px' }">
                    <template #body="{data}">
                        <div :class="{'warning-cell': !isProcessedProduct(data) && !data.upc, 'cell-content': true}">
                            {{ !isProcessedProduct(data) && !data.upc ? '[MISSING VALUE]' : (data.upc || '-') }}
                        </div>
                    </template>
                </Column>
                <Column field="notes" header="Notes" sortable :style="{ width: '160px', minWidth: '160px' }"></Column>
                <Column :exportable="false" :style="{ width: '180px', minWidth: '180px' }">
                    <template #body="slotProps">
                        <Button icon="pi pi-cog" v-tooltip.top="'Product Details'" outlined rounded class="mr-2 pl-icon-btn pl-icon-btn--info" @click="displayProductInfo(slotProps.data)"/>
                        <Button icon="pi pi-pencil" v-tooltip.top="'Edit Product'" outlined rounded class="mr-2 pl-icon-btn pl-icon-btn--edit" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash" v-tooltip.top="'Delete Product'" outlined rounded class="pl-icon-btn pl-icon-btn--danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
            </div>
        </div>

        <Dialog v-model:visible="productDialog" :style="{ width: '980px', maxWidth: '95vw' }" :header="getProductDialogName()" :modal="true" class="p-fluid pl-product-dialog">
            <div class="pl-dialog-layout">
                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Core Details</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="vendor">Vendor</label>
                            <Dropdown v-model="product.vendor_id"
                            placeholder="Select a Vendor" class="w-full md:w-14rem" editable
                            :options="vendors"
                            filter
                            :virtualScrollerOptions="{ itemSize: 38 }"
                            optionLabel="vendor_name"
                            optionValue="vendor_id" />
                            <small class="p-error" v-if="submitted && !product.vendor_id">Vendor is required.</small>
                        </div>

                        <div class="field">
                            <label for="name">Name</label>
                            <InputText id="name" v-model.trim="product.name" required="true" autofocus :class="{'p-invalid': submitted && !product.name}" />
                            <small class="p-error" v-if="submitted && !product.name">Name is required.</small>
                        </div>

                        <div class="field">
                            <label for="notes">Notes</label>
                            <InputText id="notes" v-model="product.notes" rows="3" cols="20" />
                        </div>

                        <div class="field">
                            <label for="date_added">Date Added</label>
                            <Calendar id="date_added" dateFormat="yy/mm/dd" v-model="product.date_received"/>
                        </div>
                        
                    </div>
                </section>

                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Raw Details</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="upc">UPC</label>
                            <InputText id="upc" v-model="product.upc"/>
                        </div>

                        <div class="field">
                            <label for="item_num">Item Number</label>
                            <InputText id="item_num" v-model="product.item_num" rows="3" cols="20" />
                        </div>
                   </div>
                </section>

                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Processed Details</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="asin">ASIN</label>
                            <InputText id="asin" v-model="product.asin"/>
                        </div>

                        <div class="field">
                            <label for="fnsku">FNSKU</label>
                            <InputText id="fnsku" v-model="product.fnsku" />
                            <small class="p-error" v-if="submitted && validFnsku===false">FNSKU already in use.</small>
                        </div>
                   </div>
                </section>

                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Packaging And Size</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="default_units_per_case">Default Units per Case</label>
                            <InputText v-model="product.default_units_per_case" />
                        </div>

                        <div class="field">
                            <label for="bag_size">Bag Size</label>
                            <Dropdown v-model="product.bag_size"
                            placeholder="Select a Bag Size" class="w-full md:w-14rem"
                            :options="bags"
                            @change="updateBagCost"
                            :virtualScrollerOptions="{ itemSize: 38 }"
                            optionLabel="size"
                            optionValue="size" />
                        </div>

                        <div class="field">
                            <label for="bag_cost">Bag Cost</label>
                            <InputNumber v-model="product.bag_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="box_type">Box Type</label>
                            <Dropdown v-model="product.box_type"
                            placeholder="Select a Bag Size" class="w-full md:w-14rem"
                            :options="boxes"
                            @change="updateBoxCost"
                            :virtualScrollerOptions="{ itemSize: 38 }"
                            optionLabel="size"
                            optionValue="size" />
                        </div>

                        <div class="field">
                            <label for="box_cost">Box Cost</label>
                            <InputNumber v-model="product.box_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <div v-if="product.fnsku || product.asin">
                                <label for="weight_lbs">Weight per Case (lbs)</label>
                                <InputNumber v-model="product.weight_lbs" inputId="integeronly" />
                            </div>
                            <div v-else>
                                <label for="weight_lbs">Weight per Box (lbs)</label>
                                <InputNumber v-model="product.weight_lbs" inputId="integeronly" />
                            </div>
                        </div>
                    </div>
                </section>

                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Pricing And Costs</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="price_2023">Current Unit Price</label>
                            <InputNumber v-model="product.price_2023" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="price_2022">Price 2022</label>
                            <InputNumber v-model="product.price_2022" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="price_2021">Price 2021</label>
                            <InputNumber v-model="product.price_2021" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="item_cost">Item Cost</label>
                            <InputNumber v-model="product.item_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="in_shipping_cost">In-shipping Cost</label>
                            <InputNumber v-model="product.in_shipping_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="out_shipping_cost">Out-shipping Cost</label>
                            <InputNumber v-model="product.out_shipping_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="30_day_storage_cost">30 Day Storage Cost</label>
                            <InputNumber v-model="product['30_day_storage_cost']" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="holiday_storage_cost">Holiday Storage Cost</label>
                            <InputNumber v-model="product.holiday_storage_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
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
                            <label for="labor_cost">Labor Cost</label>
                            <InputNumber v-model="product.labor_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="misc_cost">Misc Cost</label>
                            <InputNumber v-model="product.misc_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="map">Map</label>
                            <InputNumber v-model="product.map" inputId="minmaxfraction" :minFractionDigits="2" />
                        </div>

                        <div class="field">
                            <label for="process_time_per_unit_sec">Process Time per Unit Sec</label>
                            <InputNumber v-model="product.process_time_per_unit_sec" inputId="integeronly" />
                        </div>

                        <div class="field">
                            <label for="unit_box_cost">Unit Box Cost</label>
                            <InputNumber v-model="product.unit_box_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="total_cost">Total Cost</label>
                            <InputNumber v-model="product.total_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>

                        <div class="field">
                            <label for="total_holiday_cost">Total Holiday Cost</label>
                            <InputNumber v-model="product.total_holiday_cost" inputId="currency-us" mode="currency" currency="USD" locale="en-US" />
                        </div>
                    </div>
                </section>

                <section class="pl-dialog-section">
                    <h4 class="pl-dialog-section-title">Other</h4>
                    <div class="pl-fields-grid">
                        <div class="field">
                            <label for="do_we_carry">Do We Carry?</label>
                            <Dropdown v-model="product.do_we_carry"
                            placeholder="Do We Carry?" class="w-full md:w-14rem" editable
                            :options="binary"/>
                        </div>

                        <div class="field">
                            <label for="meltable">Meltable</label>
                            <Dropdown v-model="product.meltable"
                            placeholder="Meltable?" class="w-full md:w-14rem" editable
                            :options="binary"/>
                        </div>
                    </div>
                </section>

                <section class="pl-dialog-section" v-if="product.fnsku || product.asin">
                    <h4 class="pl-dialog-section-title">Processed Product Recipe</h4>
                    <div class="field">
                        <label>Product(s) Needed</label>
                        <template class="caseCard" v-for="(ing, counter) in recipesInUse">

                            <div class ="caseCard">
                                <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteIngredient(counter)"/>

                                <h4 class="flex justify-content-start font-bold w-full">Product #{{ counter + 1 }}</h4>
                                <div class="pl-fields-grid">
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

                                    <div class="field" style="max-width: 10rem;">
                                        <label for="qty">QTY:</label>
                                        <InputNumber inputId="stacked-buttons" required="true"
                                        :class="{'p-invalid': submitted && !ing.qty}"
                                        v-model="ing.qty" showButtons />
                                        <small class="p-error" v-if="submitted && !ing.qty">Amount is required.</small>
                                    </div>

                                </div>

                            </div>
                        </template>

                        <Button label="Add another product" class="pl-action-btn pl-action-btn--secondary" @click="addIngredient"/>
                    </div>
                </section>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="pl-action-btn pl-action-btn--secondary" @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check" class="pl-action-btn pl-action-btn--primary" @click="validate" :disabled="saving" :loading="saving" />
            </template>
        </Dialog>

        <Dialog v-model:visible="productInfoDialog" :style="{ width: '900px', maxWidth: '95vw' }" :header="product.Name+' Details'" :modal="true" class="pl-product-info-dialog">
            <div class="pl-product-info-toolbar">
                <Button label="Toggle Filter" class="pl-action-btn pl-action-btn--secondary" @click="toggleFilter()"/>
            </div>

            <div class="pl-product-info-sections" v-if="getProductInfoSections().length">
                <section class="pl-dialog-section" v-for="section in getProductInfoSections()" :key="section.title">
                    <h4 class="pl-dialog-section-title">{{ section.title }}</h4>
                    <div class="pl-product-info-grid">
                        <div class="pl-product-info-item" v-for="item in section.items" :key="item.label">
                            <span class="pl-product-info-label">{{ item.label }}</span>
                            <span class="pl-product-info-value">{{ item.value }}</span>
                        </div>
                    </div>
                </section>
            </div>
            <p v-else class="pl-empty-state">No details available.</p>
        </Dialog>

        <Dialog v-model:visible="deleteProductDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product">Are you sure you want to delete <b>{{product.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="pl-action-btn pl-action-btn--secondary" @click="deleteProductDialog = false"/>
                <Button label="Yes" icon="pi pi-check" class="pl-action-btn pl-action-btn--danger" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="product">Are you sure you want to delete the selected product(s)?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="pl-action-btn pl-action-btn--secondary" @click="deleteProductsDialog = false"/>
                <Button label="Yes" icon="pi pi-check" class="pl-action-btn pl-action-btn--danger" @click="deleteSelectedProducts" />
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
        </div>
</template>

<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import importAction from "../components/utils/importUtils";
import { table } from 'console';
import ZoomDropdown from '../components/ZoomDropdown.vue';
import {debounce} from 'lodash';
//import Papa from "papaparse";

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712

export default {
    components: {
        ZoomDropdown
    },
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
            tableZoom: 1,

            searchText: '',

            currentPage: 1,
            rowsPerPage: 25,
            totalRecords: 0,

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

            bags: [
                {size: '3x7', price: 0.05},
                {size: '5x10', price: 0.05},
                {size: '6x9', price: 0.05},
                {size: '8x10', price: 0.05},
                {size: '9x14', price: 0.05},
                {size: '10x12', price: 0.05},
                {size: '10x15', price: 0.05},
                {size: '12x15', price: 0.05},
                {size: '12x16', price: 0.05},
                {size: '12x18', price: 0.05},
                {size: '13x17', price: 0.05},
                {size: '14x20', price: 0.05},
                {size: '19x24', price: 0.05},
                {size: '24x30', price: 0.05},
                {size: 'NONE', price: 0.05},
                {size: 'Bubble Bag 8x11.5', price: 0.05},
                {size: '4x4x4 Box', price: 0.05},
                {size: '9x12 Clear Bag', price: 0.05},
                {size: 'Plastic Wrap', price: 0.05},
                {size: 'Tube Bagging', price: 0.05},
                {size: 'Prebagged', price: 0.05},
                {size: '11x14 Clear Bag', price: 0.05},
                {size: '2x7 Clear Bag', price: 0.05}
            ],

            boxes: [
                {size: 'Small', price: 0.05},
                {size: 'Medium', price: 0.05},
                {size: 'Large', price: 0.05},
            ],

            binary: [
                'Yes',
                'No'
            ],

            columns: [] as any[],

            working: false,

            saving: false,

            loading: false,
            tableLoading: false,

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
            { field: 'upc', header: 'UPC'},
            { field: 'fnsku', header: 'FNSKU'},
            { field: 'asin', header: 'ASIN'},
            { field: 'item_num_1', header: 'Item Number #1'},
            { field: 'item_num_2', header: 'Item Number #2'},
            { field: 'item_num_3', header: 'Item Number #3'},
            { field: 'item_num_4', header: 'Item Number #4'},
            { field: 'item_num_5', header: 'Item Number #5'},
            { field: 'item_num_6', header: 'Item Number #6'},
            { field: 'labor_cost', header: 'Labor Cost' },
            { field: 'name', header: 'Name' },
            { field: 'map', header: 'Map' },
            { field: 'notes', header: 'Notes' },
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
        /**@TODO Implement a slight delay when a user is typing into the universal search bar, this way, the database is only queried once */
        // debounced search -> call loadPage(1) after user stops typing (300ms)
        this.onSearchDebounced = debounce(async () => {
            this.currentPage = 1;
            this.tableLoading = true;
            await this.loadPage(1);
        }, 300, { trailing: true }) as (() => Promise<void>);
    },

    async mounted() {
        console.log('Mounted');
        this.tableLoading = true;
        await this.initVariables();      // loads vendors/products/recipes you already use

        await this.loadPage(1);          // load first page for the table
    },


     
    watch: {
        searchText: {
            handler() { this.onSearchDebounced(); }
        },
    },
    methods: {
        onSearchDebounced: async () => Promise.resolve(),



        async initLazyData(){
            try {
                this.totalRecords = await action.getProductsCount(0, '', this.searchText);
                this.displayProducts = Array.from({ length: this.totalRecords });
            } catch (e) {
                console.log(e);
            }
        },
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
        async onLazyLoad(event: any){
            console.log('Lazy load', event);
            const { first = 0, last = 0 } = event || {};
            const slice = await action.getProductsLazy(first, last, 0, '', this.searchText);
            // place results into the existing array to avoid replacing reference
            for (let i = 0; i < slice.length; i++) {
                const idx = first + i;
                if (idx < this.displayProducts.length) this.displayProducts[idx] = slice[i];
            }
        },
        updateBagCost(){
            this.product.bag_cost = this.bags.find(bag => bag.size === this.product.bag_size)?.price || 0;
        },

        updateBoxCost(){
            this.product.box_cost = this.boxes.find(box => box.size === this.product.box_type)?.price || 0;
        },

        async universalSearch(){
            try {
                this.loading = true;
                this.displayProducts = await action.getFilteredProductKeys('', this.searchText, 0);
                this.loading = false;
            } catch (error) {
                console.log(error);
            }
        },

        async loadPage(page: number) {
            try {
                this.tableLoading = true;

                // Map your displayType to the processed flag used by the backend
                const processedFlag =
                    this.displayType === 'proc'   ? 1 :
                    this.displayType === 'unproc' ? 2 :
                    0; // all

                // Get total count (for paginator) and current page rows in parallel
                const [total, rows] = await Promise.all([
                    action.getProductsCount(processedFlag, '', this.searchText || ''),
                    action.getProductsPage(
                        page,
                        this.rowsPerPage,
                        processedFlag,
                        '',               // global search column
                        this.searchText || ''
                    )
                ]);

                this.totalRecords = total;

                // Attach vendor_name etc. the same way you do in getProducts()
                rows.forEach(p => {
                    const vendor = this.vendors.find(v => p['vendor_id'] == v['vendor_id']);
                    if (vendor) p['vendor_name'] = vendor['vendor_name'];
                });

                this.displayProducts = rows;
                this.currentPage = page;
                
                // Reset scroll position to top after new page data loads
                this.$nextTick(() => {
                    const dtElement = (this.$refs.dt as any)?.$el;
                    console.log('dt element:', dtElement);
                    
                    // Find the scrollable table, then scroll its parent wrapper
                    const scrollableTable = dtElement?.querySelector('.p-datatable-scrollable-table');
                    if (scrollableTable) {
                        // The wrapper is usually 2-3 parents up
                        let scrollableWrapper = scrollableTable.parentElement;
                        console.log('Found scrollable table, scrolling parent:', scrollableWrapper);
                        if (scrollableWrapper && scrollableWrapper.scrollHeight > scrollableWrapper.clientHeight) {
                            scrollableWrapper.scrollTop = 0;
                            console.log('Set scroll wrapper scrollTop to 0');
                        }
                    }
                });
                
            } catch (e) {
                console.log(e);
            } finally {
                this.tableLoading = false;
            }
        },

        onPage(event: any) {
            // PrimeVue gives 0-based page index
            const newPage = event.page + 1;
            this.rowsPerPage = event.rows;

            // Collapse expanded rows when changing pages
            this.expandedRows = [];

            this.loadPage(newPage);
        },

        isProcessedProduct(product: any) {
            return !!(product?.fnsku || product?.asin);
        },

        rowStyleProductRow(data: any, options?: any) {
            if (!data) return {};
            const processed = this.isProcessedProduct(data);
            const rows = this.displayProducts || [];

            // Determine alternating stripe index within the same type (processed vs unprocessed)
            const rowIndex = typeof options?.rowIndex === 'number' ? options.rowIndex : rows.findIndex(r => r.product_id === data.product_id);
            let typeCount = 0;
            for (let i = 0; i <= rowIndex && i < rows.length; i++) {
                const candidate = rows[i];
                if (this.isProcessedProduct(candidate) === processed) {
                    typeCount++;
                }
            }

            const even = typeCount % 2 === 0;
            if (processed) {
                return { backgroundColor: even ? '#e6ffea' : '#ccffd1' }; // green shades
            }

            return { backgroundColor: even ? '#e8f0ff' : '#d3e3ff' }; // blue shades
        },

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

                // this.displayProducts = this.products;
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
            console.log("VALID FNSKU ", this.validFnsku, "PRODUCT VENDOR ", this.product.vendor_id, "PRODUCT NAME ", this.product.name);

            if (this.validFnsku == true && this.product.vendor_id && this.product.name){
                this.saveProduct();
            } else {
                let errorHeader = '';
                if(this.validFnsku == false){
                    errorHeader += 'Invalid FNSKU. ';
                }
                if(!this.product.vendor_id){
                    errorHeader += 'Invalid Vendor. ';
                }
                if(!this.product.name){
                    errorHeader += 'Invalid Product Name. ';
                }
                this.$toast.add({severity:'error', summary: errorHeader, detail: 'Please fill in all required fields.'});
            }
        },
        async saveProduct() {
            //this.submitted = true;
            if (this.saving) return;
            this.saving = true;

			try {
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
            } finally {
                this.saving = false;
            }
        },
        /**
         * 
         * Date Last Edited: 2-27-2026
         */
        async confirmEdit(){
            try {
                //this.product.inventoryStatus = this.product.inventoryStatus.value ? this.product.inventoryStatus.value: this.product.inventoryStatus;

                //Promise.resolve(action.editProduct(this.product));
                

                // console.log(this.products[this.findIndexById(this.product.product_id)]);

                // console.log("PRODUCT BEFORE AWAIT",this.product);

                const editedProduct = await action.editProduct(this.product, this.recipesInUse);

                this.getRecipes();
                
                this.products[this.findIndexById(this.product.product_id)] = this.product;
                await this.loadPage(this.currentPage);
                
                // console.log("PRODUCT AFTER AWAIT",this.product);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Case Updated', life: 3000});
                return editedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err});
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 2-27-2026
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
                await this.loadPage(this.currentPage);

                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product Created', life: 3000});

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST

                recMap = {};

                return addedProduct;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err});
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

                this.$toast.add({severity:'error', summary: 'Error', detail: err});
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
                if(this.selectedProducts && this.selectedProducts.length > 0){
                    await action.batchDeleteProduct(this.selectedProducts);
                    this.getProducts();
                    this.$toast.add({severity:'success', summary: 'Successful', detail: 'Product(s) Deleted', life: 3000});
    
                    this.deleteProductsDialog = false;
                    }
                
                //this.$toast.add({severity:'success', summary: 'Successful', detail: 'Products Deleted', life: 3000});
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err});
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
        onRowToggle(event: any) {
            // Keep the expanded row state in sync with the table
            this.expandedRows = event.data;
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

        getProductInfoSections(){
            const productMap = (this.product && typeof this.product === 'object') ? this.product : {};
            const usdFormatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            });
            const monetaryLabelPattern = /(cost|price|map)/i;

            const formatDisplayValue = (label: string, value: any) => {
                if (value === null || value === undefined || value === '') return '-';

                if (monetaryLabelPattern.test(label)) {
                    if (typeof value === 'number') return usdFormatter.format(value);

                    const parsed = Number(value);
                    if (!Number.isNaN(parsed)) return usdFormatter.format(parsed);

                    return String(value).startsWith('$') ? value : `$${value}`;
                }

                return value;
            };

            const sectionConfig = [
                {
                    title: 'Core Details',
                    keys: ['Name', 'Vendor', 'Date Added', 'Notes']
                },
                {
                    title: 'Raw Details',
                    keys: ['Item Number', 'UPC']
                },
                {
                    title: 'Processed Details',
                    keys: ['ASIN', 'FNSKU']
                },
                {
                    title: 'Packaging And Size',
                    keys: ['Default Units per Case', 'Bag Size', 'Bag Cost', 'Box Type', 'Box Cost', 'Weight (Lbs)']
                },
                {
                    title: 'Pricing And Costs',
                    keys: [
                        'Current Unit Price',
                        'Price 2022',
                        'Price 2021',
                        'Item Cost',
                        'In-shipping Cost',
                        'Out-shipping Cost',
                        '30 Day Storage Cost',
                        'Holiday Storage Cost',
                        'Amz Fees Cost',
                        'Amz Fulfilment Cost',
                        'Labor Cost',
                        'Misc Cost',
                        'Map',
                        'Process Time per Unit Sec',
                        'Total Cost',
                        'Total Holiday Cost',
                        'Unit Box Cost'
                    ]
                }
            ];

            const assignedKeys = new Set<string>();
            const sections = sectionConfig
                .map(section => {
                    const items = section.keys
                        .filter((key: string) => Object.prototype.hasOwnProperty.call(productMap, key))
                        .map((key: string) => {
                            assignedKeys.add(key);
                            return {
                                label: key,
                                value: formatDisplayValue(key, productMap[key])
                            };
                        });

                    return {
                        title: section.title,
                        items,
                    };
                })
                .filter(section => section.items.length > 0);

            const otherItems = Object.entries(productMap)
                .filter(([key]) => !assignedKeys.has(key))
                .map(([key, value]) => ({
                    label: key,
                    value: formatDisplayValue(key, value),
                }));

            if (otherItems.length) {
                sections.push({
                    title: 'Other',
                    items: otherItems,
                });
            }

            return sections;
        },

        getProductRecipes(productId: number){

            let outputProduct = this.recipeElements.find(re => re.type === 'output' && re.product_id === productId);
            console.log("OUTPUT RECIPE", outputProduct);

            let inputProducts = this.recipeElements.filter(re => re.type === 'input' && re.recipe_id === outputProduct.recipe_id);
            console.log("INPUT RECIPES", inputProducts);

            inputProducts.forEach(ir => {
                let inProd = this.products.find(p => p.product_id === ir.product_id);
                ir.name = inProd.name;
                ir.item_num = inProd.item_num;
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
        /* toggleProducts(type: string){
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
        }, */
        toggleProducts(type: string){
            this.displayType = type;
            this.loadPage(1);
        },
    }

    ,computed: {}
}
</script>

<style>
.pl-scale-shell {
    width: 100%;
}

.card {
    --pl-transition-fast: 160ms ease;
    --pl-primary-border: #1f8c56;
    --pl-primary-top: #44c783;
    --pl-primary-bottom: #2ca765;
    --pl-secondary-border: #91a8bf;
    --pl-secondary-top: #f7fbff;
    --pl-secondary-bottom: #ebf2f8;
    --pl-secondary-text: #1b3b59;
    --pl-danger-border: #c66a6a;
    --pl-danger-top: #ffe7e7;
    --pl-danger-bottom: #ffd4d4;
    --pl-danger-text: #7e1f1f;
}

.pl-action-btn {
    border-radius: 10px;
    font-weight: 700;
    min-height: 2.1rem;
    padding: 0.35rem 0.75rem;
    transition: all var(--pl-transition-fast);
}

.pl-action-btn--primary {
    border: 1px solid var(--pl-primary-border);
    background: linear-gradient(180deg, #e6f8ee 0%, #d2f0e0 100%);
    color: #17653d;
}

.pl-action-btn--primary:hover {
    border-color: #1b7a49;
    background: linear-gradient(180deg, #dbf4e7 0%, #c4e8d6 100%);
    box-shadow: 0 3px 8px rgba(33, 128, 76, 0.18);
}

.pl-action-btn--secondary {
    border: 1px solid var(--pl-secondary-border);
    background: linear-gradient(180deg, var(--pl-secondary-top) 0%, var(--pl-secondary-bottom) 100%);
    color: var(--pl-secondary-text);
}

.pl-action-btn--secondary:hover {
    border-color: #7193b5;
    background: linear-gradient(180deg, #eef6ff 0%, #dfeeff 100%);
    color: #1b3b59;
}

.pl-action-btn--processed {
    border: 1px solid #2b9a64;
    background: linear-gradient(180deg, #e9fff2 0%, #d3f3e1 100%);
    color: #145537;
}

.pl-action-btn--processed:hover {
    border-color: #258a58;
    background: linear-gradient(180deg, #e1f9ec 0%, #c5e8d4 100%);
    color: #11482f;
}

.pl-action-btn--unprocessed {
    border: 1px solid #6ea3da;
    background: linear-gradient(180deg, #edf5ff 0%, #dbeaff 100%);
    color: #1f4f7c;
}

.pl-action-btn--unprocessed:hover {
    border-color: #5d93cb;
    background: linear-gradient(180deg, #e4f0ff 0%, #cfe3ff 100%);
    color: #17456f;
}

.pl-action-btn--all:hover {
    border-color: #9cabb9;
    background: linear-gradient(180deg, #f4f7fa 0%, #e7edf3 100%);
    color: #2f4a63;
}

.pl-action-btn--secondary.is-active {
    border-color: #5f95cf;
    background: linear-gradient(180deg, #d9ecff 0%, #c2e0ff 100%);
    color: #123e66;
    box-shadow: inset 0 0 0 1px rgba(24, 86, 148, 0.2);
}

.pl-action-btn--processed.is-active {
    border-color: #1f8c56;
    background: linear-gradient(180deg, #dff8ea 0%, #c4ebd6 100%);
    color: #135233;
    box-shadow: inset 0 0 0 1px rgba(20, 109, 67, 0.2);
}

.pl-action-btn--unprocessed.is-active {
    border-color: #5f95cf;
    background: linear-gradient(180deg, #d9ecff 0%, #c2e0ff 100%);
    color: #123e66;
    box-shadow: inset 0 0 0 1px rgba(24, 86, 148, 0.2);
}

.pl-action-btn--all.is-active {
    border-color: #91a8bf;
    background: linear-gradient(180deg, #eef3f8 0%, #e1e9f1 100%);
    color: #294661;
    box-shadow: inset 0 0 0 1px rgba(66, 92, 116, 0.14);
}

.dt-loading-wrapper {
    position: relative;
}

.dt-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 32, 51, 0.25);
    backdrop-filter: blur(2px);
    border-radius: 12px;
}

.loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 1.4rem 1.8rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #d5e2ef;
    box-shadow: 0 10px 30px rgba(16, 35, 55, 0.2);
}

.loading-label {
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #234765;
    text-transform: uppercase;
}

.loader-fade-enter-active,
.loader-fade-leave-active {
    transition: opacity 0.2s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
    opacity: 0;
}

.pl-action-btn--danger {
    border: 1px solid var(--pl-danger-border);
    background: linear-gradient(180deg, var(--pl-danger-top) 0%, var(--pl-danger-bottom) 100%);
    color: var(--pl-danger-text);
}

.pl-action-btn--danger:hover {
    border-color: #ae5252;
    background: linear-gradient(180deg, #ffdddd 0%, #ffc5c5 100%);
}

.pl-icon-btn {
    transition: all var(--pl-transition-fast);
}

.pl-icon-btn--info {
    color: #2a6aa5;
    border-color: #8fb1d1;
}

.pl-icon-btn--edit {
    color: #1f8c56;
    border-color: #91c7ab;
}

.pl-icon-btn--danger {
    color: #b43a3a;
    border-color: #d89b9b;
}

.pl-icon-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(16, 35, 55, 0.14);
}

.pl-dialog-layout {
    display: grid;
    gap: 1rem;
    padding-top: 0.25rem;
}

.pl-dialog-section {
    border: 1px solid #d6e2ee;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.pl-dialog-section-title {
    margin: 0 0 0.8rem;
    color: #21415f;
    font-size: 0.98rem;
    font-weight: 700;
}

.pl-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.6rem 0.9rem;
}

.pl-product-info-toolbar {
    margin-bottom: 0.9rem;
}

.pl-product-info-sections {
    display: grid;
    gap: 0.85rem;
}

.pl-product-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
}

.pl-product-info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.45rem 0.55rem;
    border-radius: 8px;
    background: #f4f8fc;
    border: 1px solid #dce8f3;
}

.pl-product-info-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #45647f;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.pl-product-info-value {
    color: #203849;
    font-weight: 600;
    word-break: break-word;
}

.pl-empty-state {
    margin: 0;
    color: #506b82;
}

:deep(.pl-product-dialog .p-dialog-content),
:deep(.pl-product-info-dialog .p-dialog-content) {
    background: #f4f8fc;
}

:deep(.pl-toolbar.p-toolbar) {
    border: 1px solid var(--surface-border, #d4d8dd);
    border-radius: 12px;
    background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
}

.pl-toolbar-search {
    min-width: 220px;
}

.pl-toolbar-actions {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
}

.pl-table-header-actions {
    justify-content: flex-end;
}

:deep(.pl-product-table .p-datatable-wrapper) {
    overflow-x: auto;
}

:deep(.pl-product-table .p-datatable-table) {
    min-width: 1350px;
}

.pl-product-table .p-datatable-thead > tr > th .p-checkbox {
    display: none;
}

.warning-cell {
  background-color: #ffb439 !important;
  color: black;
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
}

.cell-content {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

@media (max-width: 1024px) {
    :deep(.pl-product-table .p-datatable-table) {
        min-width: 980px;
    }
}

@media (max-width: 768px) {
    .pl-toolbar-search {
        width: 100%;
    }

    .pl-toolbar-search :deep(.p-inputtext) {
        width: 100%;
    }

    .pl-toolbar-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .pl-toolbar-actions :deep(.p-button) {
        flex: 1 1 auto;
        min-width: 0;
    }

    .pl-table-header-actions {
        width: 100%;
        justify-content: flex-start;
    }

    :deep(.pl-product-table .p-datatable-table) {
        min-width: 860px;
    }
}
</style>
