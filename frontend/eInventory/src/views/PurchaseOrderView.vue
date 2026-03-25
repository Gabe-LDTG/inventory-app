<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New PO" icon="pi pi-plus" severity="success" class="mr-2" @click="vendorSelect()" />
                 </template>

            </Toolbar> 

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" 
                dataKey="purchase_order_id"
                :paginator="true" 
                :rows="rowsPerPage" 
                :totalRecords="totalRecords"
                :lazy="true"
                :filters="filters"
                selectionMode="single"
                :selectAll="false"
                removableSort
                style="min-width: 1000px"
                showGridlines
                stripedRows
                @sort="onSort"
                scrollable 
                scrollHeight="800px"
                :style="{ fontSize: (15 * tableZoom) + 'px', zoom: tableZoom, width: '100%'}"
                :loading="loading"
                :expandedRows="expandedRows" @rowExpand="onRowExpand"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                        <h4 class="m-0">Manage Purchase Orders</h4>
                        <ZoomDropdown v-model="tableZoom" />
                        <span class="p-input-icon-right">
                            <!-- <i class="pi pi-search" /> -->
                            <InputText v-model="searchText" placeholder="Search..." />
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
                        <div class="po-status-pill" :class="`status-${(slotProps.data.status || '').toLowerCase().replace(/\s+/g, '-')}`">
                            <div class="po-status-pill-fill" :style="{ width: getPOProgressPercent(slotProps.data.status) + '%' }"></div>
                            <span class="po-status-pill-text">
                                <i :class="getPOIcon(slotProps.data)"></i>
                                {{ slotProps.data.status }}
                            </span>
                        </div>
                    </template>
                </Column>

                <Column header="Vendor" sortable>
                    <template #body={data}>
                        {{ getVendor(data.vendor_id) }}
                    </template>
                </Column>

                <Column field="notes" header="Notes" sortable />

                <Column field="date_ordered" header="Date Ordered" sortable />

                <Column field="date_received" header="Date Received" sortable />

                <Column header="Total Units">
                    <template #body="{data}">
                        {{ getCreatedUnitTotal(data.purchase_order_id) }}
                    </template>
                </Column>

                <Column header="Discount">
                    <template #body="{data}">
                        {{ data.discount ? data.discount + '% Off' : 'No Discount' }}
                    </template>
                </Column>

                <Column header="Total Cost">
                    <template #body="{data}">
                        {{ formatCurrency(getCreatedCostTotal(data.purchase_order_id, data.discount)) }}
                    </template>
                </Column>

                <Column header="PO Phase" :exportable="false">
                    <template #body="slotProps">

                        <div style="min-width: 235px" >
                            <div class="flex flex-wrap align-items-center "> 
                                <Button icon="pi pi-envelope" v-tooltip.top="'PO Submitted'" :disabled="slotProps.data.status === 'Submitted' || slotProps.data.status === 'Ordered' || slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="warning" class="mr-2" @click="openStatusChangeDialog(slotProps.data); newStatus = 'Submitted'"/>
                                <i class="pi pi-angle-right" style="color: gray"/>
                                <Button icon="pi pi-box" v-tooltip.top="'PO Ordered'" :disabled="slotProps.data.status === 'Ordered' || slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="info" class="mr-2" @click="openStatusChangeDialog(slotProps.data); newStatus = 'Ordered'"/>
                                <i class="pi pi-angle-right" style="color: gray"/>
                                <Button icon="pi pi-truck" v-tooltip.top="'PO Inbound'" :disabled="slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="warning" class="mr-2" @click="openInboundDialog(slotProps.data); newStatus = 'Inbound'"/>
                                <i class="pi pi-angle-right" style="color: gray"/>
                                <Button icon="pi pi-check" v-tooltip.top="'PO Delivered'" :disabled="slotProps.data.status === 'Delivered'" rounded class="mr-2" @click="confirmOrderReceived(slotProps.data)" />
                                <!-- <Button icon="pi pi-times" outlined rounded severity="danger" @click="confirmCancelOrder(slotProps.data)" /> -->
                                
                            </div>
                        </div>
                    </template>
                </Column>

                <Column header="Edit PO" :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" v-tooltip.top="'Edit PO'" :disabled="slotProps.data.status === ''" rounded class="mr-2" @click="onPurchaseOrderDialogOpen(2, slotProps.data)" />
                    </template>
                </Column>

                <template #expansion="slotProps">
                    <!--<ButtonGroup class="flex justify-content-center">-->
                    <div class="flex justify-content-center">
                        <Button label="Processed" @click="slotProps.data.displayStatus = 'Processed'"/>
                        <Button label="Unprocessed" severity="info" @click="slotProps.data.displayStatus = 'Unprocessed'"/>
                    </div>
                    <!--</ButtonGroup>-->
                        <div class="p-3" v-if="slotProps.data.displayStatus === 'Processed'">
                            <h3 class="font-bold">Processed Product(s) in Purchase Order {{ slotProps.data.purchase_order_name }}</h3>
                            <DataTable :value="displayInfo(slotProps.data)" 
                            :expandedRows="expandedRows">
                            <!-- <template #groupheader="slotProps">
                                <div class="flex align-items-center gap-2">
                                    <span class="flex justify-content-start font-bold w-full">{{ slotProps.data.name }}</span>
                                    <div class="flex justify-content-end font-bold w-full">Total Number of Boxes: {{ calculateBoxTotal(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                                    <div class="flex justify-content-end font-bold w-full">Total QTY: {{ calculateTotalQTY(slotProps.data.name, slotProps.data.purchase_order_id) }}</div>
                                </div>
                            </template> -->
                                <template #empty> No planned cases found. </template>
                                <Column expander header="Raw Product Info" style="width: 5rem" />
                                <Column field="product_name" header="Name" />
                                <Column header="FNSKU">
                                    <template #body="{data}">
                                        {{ getFNSKU(data.product_id) }}
                                    </template>
                                </Column>
                                <Column field="units_per_case" header="Units per Case" />
                                <Column field="amount" header="Total # of Cases" />
                                <Column field="totalUnits" header="Total # of Units" :sortable="true" />
                                <!-- <Column field="status" header="Status" /> -->
                                <template #expansion="{data}" style="background-color: '#16a085'">
                                    <h4 class="font-bold">Raw Product(s) required for {{ data.product_name }}</h4>
                                    <DataTable :value="displayRawInfoMicheal(data.purchase_order_id, data.product_id, data.amount)" :rowClass="rowClass" :rowStyle="rowStyle">
                                        <Column field="product_name" header="Name"/>
                                        <Column header="UPC">
                                            <template #body = {data}>
                                                {{ getUPC(data.product_id) }}
                                            </template>
                                        </Column>
                                        <Column header="Item #">
                                            <template #body = {data}>
                                                {{ getItemNum(data.product_id) }}
                                            </template>
                                        </Column>
                                        <Column field="units_per_case" header="Units per Box"/>
                                        <Column field="amount" header="Total # of Boxes"/>
                                        <Column header="Total # of Units">
                                            <template #body = {data}>
                                                {{ data.units_per_case * data.amount }}
                                            </template>
                                        </Column>
                                        <!-- <Column header="Location">
                                            <template #body="{data}">
                                                {{ formatSingleLocation(data.location) }}
                                            </template>
                                        </Column> -->
                                        <Column header="Total Price" class="font-bold">
                                            <template #body = {data}>
                                                {{formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount)*(1-(getPurchaseOrderDiscount(data.purchase_order_id)))) }}
                                            </template>
                                        </Column>
                                        <Column header="Status" sortable>
                                            <template #body="slotProps">
                                                <div class="card flex flex-wrap  gap-2">
                                                    <Tag :value="slotProps.data.status" :severity="getBoxSeverity(slotProps.data)" iconPos="right"/>
                                                </div>
                                            </template>
                                        </Column>
                                    </DataTable>
                                </template>

                            </DataTable>

                            <br><h4 class="font-bold">Raw Products with No Plan</h4>
                            <DataTable :value="getPoolNew(slotProps.data.purchase_order_id)" :rowStyle="rowStylePool">
                                <template #empty> No unplanned products found. </template>

                                <Column header="Name">
                                    <template #body = {data}>
                                        {{ data.product_name }}
                                    </template>
                                </Column>
                                <Column header="Item #" field="item_num" >
                                    <template #body = {data}>
                                        {{ getItemNum(data.product_id) }}
                                    </template>
                                </Column>
                                <Column field="total" header="Total # of Units">
                                    <template #body = {data}>
                                        {{ data.totalUnits }}
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold">
                                    <template #body = {data}>
                                        {{formatCurrency(getUnitCost(data.product_id)*(data.totalUnits)*(1-(getPurchaseOrderDiscount(data.purchase_order_id))))}}
                                    </template>
                                </Column>
                                <!-- <Column header="Status" sortable>
                                    <template #body="slotProps">
                                        <div class="card flex flex-wrap  gap-2">
                                            <Tag :value="slotProps.data.status" :severity="getBoxSeverity(slotProps.data)" iconPos="right"/>
                                        </div>
                                    </template>
                                </Column> -->
                            </DataTable>
                        </div> 

                        <div class="p-3" v-if="slotProps.data.displayStatus === 'Unprocessed'">
                            <h4>Unprocessed Product(s) in Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                            <DataTable 
                            :value="displayInfo(slotProps.data)" 
                            :rowClass="rowClass" :rowStyle="rowStyle"
                            sortField="name" removableSort :sortOrder="-1"
                            >
                                <Column field="product_name" header="Name" :sortable="true"/>
                                <Column header="UPC" > <!-- Fix sort -->
                                    <template #body="{data}">
                                        {{ getUPC(data.product_id) }}
                                    </template>
                                </Column >
                                <Column header="Item #">
                                    <template #body = {data}>
                                        {{ getItemNum(data.product_id) }}
                                    </template>
                                </Column>
                                <Column field="units_per_case" header="Units per Box"  sortable/>
                                <Column field="amount" header="Total # of Boxes" sortable />
                                <Column header="Total # of Units" :sortable="true">
                                    <template #body = {data}>
                                        {{ data.units_per_case * data.amount }}
                                    </template>
                                </Column >
                                <Column header="Location">
                                            <template #body="{data}">
                                                {{ formatSingleLocation(data.location_id) }}
                                            </template>
                                        </Column>
                                <Column header="Unit Price" > <!-- Fix sort -->
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)) }} 
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold" > <!-- Fix sort -->
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount)*(1-(getPurchaseOrderDiscount(data.purchase_order_id)))) }}
                                    </template>
                                </Column >
                                <Column field="notes" header="Notes" class="font-bold"></Column>
                                <Column field="status" header="Status" :sortable="true">
                                    <template #body="slotProps">
                                        <div class="card flex flex-wrap  gap-2">
                                            <Tag :value="slotProps.data.status" :severity="getBoxSeverity(slotProps.data)" iconPos="right"/>
                                        </div>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                </template>

            </DataTable>
        </div>

        <Dialog v-model:visible="vendorDialog" :style="{width: '450px'}" header="Vendor Select" :modal="true" class="vendor-select-dialog">
            <div class="field vendor-select-content">
                <p class="vendor-select-subtitle">Choose the vendor for this purchase order.</p>
                <AutoComplete 
                    v-model="purchaseOrder.vendor"
                    :suggestions="filteredVendors"
                    @complete="searchVendors"
                    @item-select="onVendorAutoCompleteSelect($event.value)"
                    :dropdown="true"
                    @focus="searchVendors({ query: '' })"
                    :showOnFocus="true"
                    :optionLabel="'vendor_name'"
                    placeholder="Select or enter a vendor"
                    class="vendor-select-autocomplete"
                    :class="{'p-invalid': vendorSubmitted == true && !purchaseOrder.vendor}"
                    :forceSelection="false"
                />
                <small class="p-error" v-if="vendorSubmitted == true && !purchaseOrder.vendor">Vendor is required.</small>

            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideVendorDialog()"/>
                <Button label="Select" icon="pi pi-check" text @click="vendorSubmitted = true; onPurchaseOrderDialogOpen(1);" />
            </template>
        </Dialog>

        <Dialog v-model:visible="missingDefaultUnitsDialog" :style="{width: '600px'}" header="Missing Default Units" :modal="true">
            <div class="field">
                <p>The following raw product(s) required for the processed case lack a default box amount. Please fill in below.</p>
            </div>

            <div v-for="(item, idx) in missingDefaults" :key="item.product_id" class="field">
                <div class="grid">
                    <div class="col-6">
                        <div class="font-bold">{{ item.name }}</div>
                        <div class="text-sm">Item#: {{ item.item_num }}</div>
                    </div>
                    <div class="col-6">
                        <label class="block">Default Units per Case</label>
                        <InputNumber v-model="item.default_units_per_case" :min="1" showButtons />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" text @click="missingDefaultUnitsDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveMissingDefaultUnits" autoFocus />
            </template>
        </Dialog>

        <Dialog v-model:visible="purchaseOrderDialog" :style="{width: '1000px'}" header="Purchase Order Details" :modal="true" class="p-fluid">

            <div v-if="purchaseOrder.purchase_order_id">

                <div class="field">
                        <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Product(s):</h3>
                    </div>
                    <DataTable :value="delivered" v-model:editingRows="editingRows" 
                    rowGroupMode="subheader" groupRowsBy="product_id" 
                    editMode="row" @row-edit-save="onRowEditSave" :rowStyle="rowStyleCompared"
                    scrollable scrollHeight="600px"
                    sortField="product_id" 
                    showGridlines
                    tableStyle="background-color: '#16a085'"
                    >
                        <template #empty>No units in purchase order.</template>

                        <template #groupheader="{data}">
                            <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                                <h4 class="flex items-center font-bold gap-2">{{ data.product_name }}</h4>
                                In total there are {{ getReceivedTotal(data.product_id) }} received units.
                            </div>
                        </template>

                        <Column class="font-bold" field="moment" header="Status" />
                        <Column field="product_name" header="Name"/>
                        <Column field="amount" header="Total Number of Boxes">
                            <template #body={data}>
                                {{ data.amount }}
                            </template>
                            <template #editor={data}>
                                <label for=""># of Boxes that Arrived:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="data.amount" showButtons
                                @update:model-value="data.total = data.amount*data.units_per_case"
                                />
                            </template>
                        </Column>
                        <Column header="Total Number of Units">
                            <template #body={data}>
                                {{ data.total }}
                            </template>
                            <template #editor={data}>
                                <label for="total"># of Units that Arrived:</label>
                                <InputNumber v-model="data.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="data.amount = onTotalUpdate(data.total, data.units_per_case)"
                                />
                            </template>
                        </Column>

                        <Column header="Location">
                            <template #body="{data}">
                                <div v-if="data.moment == 'Received' || data.moment== 'Awaiting' || data.moment== 'Newly Arrived'">
                                    {{ formatSingleLocation(data.location_id) }}
                                </div>
                            </template>
                            <template #editor="{data}">
                                <label for="location">Location:</label>
                                <div class="container">
                                    <!-- <InputText id="location" v-model="eCase.location" rows="3" cols="20" /> -->
                                    <Dropdown v-model="data.location_id"
                                    placeholder="Select a Location" class="w-full md:w-14rem" editable
                                    :options="locations"
                                    filter
                                    :virtualScrollerOptions="{ itemSize: 38 }"
                                    optionLabel="name"
                                    optionValue="location_id" />
                                    <Button icon="pi pi-plus" v-tooltip.top="'Add New Location'" @click="newLocation()"  />
                                </div>
                            </template>
                        </Column>

                        <!-- <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column> -->
                    
                        <Column >
                            <template #body="{data}">
                                <div v-if="data.moment === 'Awaiting' || data.moment === 'Back Ordered' || data.moment === 'Newly Arrived'">
                                    <Button  icon="pi pi-pencil" text style="color: gray" v-tooltip.top="'Inventory newly-received products'" @click="receivedDialogSetup(data.product_id)"/>
                                </div>
                            </template>
                        </Column>

                    </DataTable> <br>           

            </div>

            <div v-else>
                <!-- CREATING/////////////////////////////////////////////////////////////////////////////////// -->
                <div class="field">
                    <label for="purchase_order_name">Name</label>
                    <InputText id="name" v-model.trim="purchaseOrder.purchase_order_name" required="true" autofocus :class="{'p-invalid': submitted == true && (!purchaseOrder.purchase_order_name || purchaseOrder.purchase_order_name == '')}" 
                    :disabled="purchaseOrder.purchase_order_id"/>
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
                    <Dropdown v-model="purchaseOrder.status" :options="statuses" @change="onStatusChange()"/>
                </div>

                <div class="field">
                    <label for="notes">Notes</label>
                    <InputText id="notes" v-model="purchaseOrder.notes" rows="3" cols="20" />
                </div>

                <div class="field">
                    <label for="discount">Discount</label>
                    <InputNumber v-model="purchaseOrder.discount" suffix="%" fluid />
                </div>

                <div class="field">
                    <label for="date_ordered">Date Ordered</label>
                    <Calendar id="date_ordered" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_ordered"/>
                </div>

                <div class="field">
                    <label for="date_received">Date received</label>
                    <Calendar id="date_received" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_received"/>
                </div>

                <!--------------------------------------- RECIPES ---------------------------------------------->
                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Planning Processed Case(s):</h3>
                </div>

                <template class="caseCard" v-for="(poRecipe, counter) in recipeArray">

                <div class ="caseCard">
                    <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(recipeArray, counter)"/>

                    <h4 class="flex justify-content-start font-bold w-full">Processed Product to Create #{{ counter + 1 }}</h4><br>
                    <div class="block-div">
                        <div class="field">
                            <label for="name">Name:</label>
                            <AutoComplete 
                                v-model="poRecipe.recipeObj"
                                :suggestions="filteredRecipes[counter] || []"
                                @complete="(event: any) => searchRecipes(event, counter)"
                                @item-select="onRecipeSelection(poRecipe.recipeObj, counter)"
                                :dropdown="true"
                                :optionLabel="'label'"
                                
                                placeholder="Select or enter a product"
                                class="md:w-14rem"
                                :class="{'p-invalid': submitted && !poRecipe.recipeObj}"
                                :forceSelection="false"
                            /> <!-- :modelValue="'label'" -->
                            <small class="p-error" v-if="submitted && !poRecipe.recipeObj">Name is required.</small>
                        </div>

                        <div class="field">
                            <label for="qty">Normal Case QTY:</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            :class="{'p-invalid': submitted && !poCases[counter].default_units_per_case}"
                            v-model="poCases[counter].default_units_per_case" disabled
                            />
                            <small class="p-error" v-if="submitted && !poCases[counter].default_units_per_case">Amount is required.</small>
                        </div>

                        <div class="field">
                            <label for="amount">Cases Desired to Be Made</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            v-model="poRecipe.amount" showButtons :min="1"
                            @update=""/>
                        </div>

                        <div class="field">
                            <label for="notes">Notes:</label>
                            <InputText id="notes" v-model="poCases[counter].notes" rows="3" cols="20" />
                        </div>

                        <div v-if="poRecipe.amount && poRecipe.recipeObj" class="field">
                            <label class="flex justify-content-end font-bold w-full" for="total">Total to be Made:</label>
                            <div class="flex justify-content-end font-bold w-full">{{ poCases[counter].default_units_per_case * poRecipe.amount }}</div>
                        </div>

                    </div>

                    <div v-if="poCases[counter].default_units_per_case">
                        <DataTable :value="selectRecipeElements(poRecipe.recipeObj)" :rowStyle="rowStyleMissingDefault">
                            <Column field="name" header="Product Name" />
                            <Column header="Units per Box" >
                                <template #body="{data}">
                                    {{ getProductInfo(data.product_id, 'default_units_per_case') }}
                                </template>
                            </Column>
                            <Column field="qty" header="Unit(s) per Bundle" ></Column>
                            <Column header="Total Units Needed">
                                <template #body="{data}">
                                    {{  getTotalUnitsNeeded(data, poCases[counter], poRecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Total Units Ordered" >
                                <template #body="{data}">
                                    {{ getTotalUnitsOrdered(data, poCases[counter], poRecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Raw Box Total" >
                                <template #body="{data}">
                                    {{ getRawBoxTotal(data, poCases[counter], poRecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Unit Price" >
                                <template #body="{data}">
                                    {{ formatCurrency(getProductInfo(data.product_id,'price_2023')) }}
                                </template>
                            </Column>
                            <Column header="Total Price" >
                                <template #body="{data}">
                                    {{ formatCurrency(getTotalCost(data, poCases[counter], poRecipe.amount)) }}
                                </template>
                            </Column>
                        </DataTable>
                        <InputText id="notes" v-model="poCases[counter].notes" rows="3" cols="20" />
                    </div>
                
                </div>

                </template>

                <Button label="Add another product" text @click="addBulkLine(recipeArray); addBulkLine(poCases);"/> 

                
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

                <template v-if="selectedOrderType" class="caseCard" v-for="(poBox, counter) in poBoxes">

                    <!-- ADD ANOTHER COLUMN THAT SELECTS BETWEEN 'ORDER BY BOX' AND 'ORDER BY UNIT'. BY BOX WILL DISPLAY -->
                    <!-- THE TOTAL UNITS NEEDED AND BY UNIT WILL SHOW THE TOTAL BOXES NEEDED -->

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poBoxes, counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">Raw Product #{{ counter + 1 }}</h4><br>
                        <div class="block-div">
                            <div class="field">
                                <label for="name">Name:</label>
                                    <AutoComplete 
                                        v-model="poBox.productObj"
                                        :suggestions="filteredRawProducts || []"
                                        @complete="(event: any) => searchRawProducts(event)"
                                        @item-select="onRawProductAutoCompleteSelectCreate($event.value, counter)"
                                        :dropdown="true"
                                        :optionLabel="(data) => data.name"
                                        :virtualScrollerOptions="{ itemSize: 38 }"
                                        placeholder="Select or enter a product"
                                        class="md:w-19rem"
                                        :class="{'p-invalid': submitted && !poBox.product_id}"
                                        :forceSelection="false"
                                    > 
                                    <template #option="slotProps">
                                        <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num }}</div>
                                    </template>
                                </AutoComplete>


                                <small class="p-error" v-if="submitted && !poBox.product_id">Name is required.</small>
                            </div>

                            <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !poBox.units_per_case}"
                                v-model="poBox.units_per_case" disabled
                                @input="poBox.total = poBox.amount*poBox.units_per_case"/>
                                <small class="p-error" v-if="submitted && !poBox.units_per_case">Amount is required.</small>
                            </div>

                            <div v-if="selectedOrderType === 'By Box'" v-show="!poBox.case_id" class="field">
                                <label for="amount">How Many Boxes to Order?</label>
                                <InputNumber inputId="stacked-buttons" required="true" :min="1"
                                v-model="poBox.amount" showButtons/>
                            </div>

                            <div v-else-if="selectedOrderType === 'By Unit'" v-show="!poBox.case_id" class="field">
                                <label for="amount">REQUESTED Units to Order:</label>
                                <InputNumber inputId="stacked-buttons" required="true" :min="1"
                                v-model="poBox.unitAmount" @input="poBox.amount = Math.ceil(poBox.unitAmount/poBox.units_per_case)" showButtons/>
                            </div>

                            <div class="field">
                                <label for="notes">Notes:</label>
                                <InputText id="notes" v-model="poBox.notes" rows="3" cols="20" />
                            </div>

                            <div v-if="poBox.units_per_case && selectedOrderType === 'By Box'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Units:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ poBox.units_per_case * poBox.amount }}</div>
                            </div>

                            <div v-if="poBox.units_per_case && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Units:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(poBox.unitAmount/poBox.units_per_case)*poBox.units_per_case }}</div>
                            </div>

                            <div v-if="poBox.units_per_case && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Boxes:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(poBox.unitAmount/poBox.units_per_case) }}</div>
                            </div>

                            <div v-if="poBox.product_id" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Unit Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ formatCurrency(getUnitCost(poBox.product_id)) }}</div>
                            </div>

                            <div v-if="poBox.product_id && selectedOrderType === 'By Box'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ formatCurrency(getUnitCost(poBox.product_id)*(poBox.units_per_case * poBox.amount)) }}</div>
                            </div>

                            <div v-if="poBox.product_id && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ formatCurrency(getUnitCost(poBox.product_id)*(Math.ceil(poBox.unitAmount/poBox.units_per_case)*poBox.units_per_case)) }}</div>
                            </div>

                        </div>

                    </div>

                </template>

            <Button label="Add another product" text @click="addBulkLine(poBoxes)"/>

            </div>

            <template #footer>
                <!-- Adding the Total Price line fixed the syntax highlighting everywhere else -->
                <div class="flex flex-start font-bold">Total Units: {{ calculatePoUnitTotal() }}</div>
                <div class="flex flex-start font-bold">Total Price: {{ formatCurrency(calculatePoCostTotal()) }}</div>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check"  text @click="validate" />
            </template>
        </Dialog>

        <!-- @TODO Make the width reactive to the size of the user's monitor -->
        <Dialog v-model:visible="editPurchaseOrderDialog" :style="{width: '1800px'}" header="Edit Purchase Order" :modal="true" class="p-fluid">
            <div class="flex align-items-left align-self-flex-start">
                <!-- <Button label="Header" text @click=""/> -->
                <!-- <Button label="Product Info" text @click="" /> -->
            </div>
            
            <div class="field">
                <label for="purchase_order_name">Name</label>
                <InputText id="name" v-model.trim="purchaseOrder.purchase_order_name" required="true" autofocus :class="{'p-invalid': submitted == true && (!purchaseOrder.purchase_order_name || purchaseOrder.purchase_order_name == '')}" 
                />
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
                <Dropdown v-model="purchaseOrder.status" :options="statuses" @change="onStatusChange()"/>
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="purchaseOrder.notes" rows="3" cols="20" />
            </div>

            <div class="field">
                <label for="discount">Discount</label>
                <InputNumber v-model="purchaseOrder.discount" suffix="%" fluid />
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
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Raw Boxes:</h3>
            </div>
            <DataTable v-model:editingRows="rawEditingRows" :value="poBoxes" :rowStyle="editRowStyleRaw" dataKey="product_id" editMode="row" @row-edit-init="onPOBoxRowEditInit" @row-edit-save="onPOBoxRowEditSave">
                <Column header="Name" field="product_name">
                    <template #editor="{data, field, index}">
                        <AutoComplete 
                                v-model="data.productObj"
                                :suggestions="filteredRawProducts || []"
                                @complete="(event: any) => searchRawProducts(event)"
                                @item-select="onRawProductAutoCompleteSelectEdit($event.value, data)"
                                :dropdown="true"
                                :optionLabel="(data) => data.name"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                placeholder="Select or enter a product"
                                class="md:w-19rem"
                                :class="{'p-invalid': submitted && !data.product_id}"
                                :forceSelection="false"
                            > 
                            <template #option="slotProps">
                                <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num }}</div>
                            </template>
                        </AutoComplete><!-- :modelValue="'label'" -->
                            <small class="p-error" v-if="submitted && !data.product_id">Name is required.</small>
                        
                    </template>
                </Column>
                <Column header="Item #">
                    <template #body={data}>
                        <div v-if="data.product_id">
                            {{ getProductInfo(data.product_id, "item_num") }}
                        </div>
                    </template>
                </Column>
                <Column header="UPC">
                    <template #body={data}>
                        <div v-if="data.product_id">
                            {{ getProductInfo(data.product_id, "upc") }}
                        </div>
                    </template>
                </Column>
                <Column header="# of Boxes" field="amount">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @update:model-value="data.total = data.amount*data.units_per_case"/>
                    </template>
                </Column>
                <Column header="Units per Box" field="units_per_case">
                    <template #editor="{data}">
                        <span>{{ data.units_per_case ?? '—' }}</span>
                    </template>
                </Column>
                <Column header="Total Units" field="total">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @update:model-value="data.amount = data.total/data.units_per_case"/>
                        <!-- Math.ceil(data.total/data.units_per_case) -->
                    </template>
                </Column>
                <Column header="Status" field="status"></Column>
                <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                <Column >
                    <template #body="{data}">
                        <Button
                            v-if="data.product_id"
                            v-tooltip.top="'Cancel Product'"
                            text
                            icon="pi pi-ban"
                            :disabled="Boolean(data?.d_editing) || isRawRowEditing(data)"
                            @click="onRawProductCancel(data)"
                        />
                        <Button
                            v-else
                            v-tooltip.top="'Remove Unsaved Row'"
                            text
                            icon="pi pi-times"
                            severity="secondary"
                            @click="removeUnsavedRawRow(data)"
                        />
                    </template>
                </Column>
            </DataTable> 
            <Button label="Add another product" text @click="addBulkLine(poBoxes)"/>
            <br>

            <div class="field">
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Planned Processed Case(s):</h3>
            </div>
            <small class="p-error" v-if="totalErrorMSG">{{totalErrorMSG}}</small>
            <DataTable v-model:editingRows="editingRows" :value="singlePoRecipes" :rowStyle="editRowStyleProc" editMode="row" @row-edit-save="onPORecipeRowEditSave">
                <Column header="Name" field="product_name">
                    <template #editor="{data, field}">
                        <ProductAutoComplete 
                            v-model="data.productObj" 
                            :displayValue="1" 
                            :vendor_id="purchaseOrder.vendor_id"
                            @update:modelValue="onProcessedProductAutoCompleteSelect"
                        />
                        <div v-if="data.productObj">
                            <DataTable :value="getRawProducts(data.productObj.product_id)">
                                <Column header="Name" field="name">
                                    <template #body={data}>
                                        {{ data.key.name }}
                                    </template>
                                </Column>
                                <Column header="Units per Box" field="units_per_case">
                                    <template #body={data}>
                                        {{ data.key.default_units_per_case }}
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </template>
                </Column>
                <Column header="ASIN" field="">
                    <template #body={data}>
                        <div v-if="data.product_id">
                            {{ getProductInfo(data.product_id, "asin") }}
                        </div>
                    </template>
                </Column>
                <Column header="FNSKU" field="">
                    <template #body={data}>
                        <div v-if="data.product_id">
                            {{ getProductInfo(data.product_id, "fnsku") }}
                        </div>
                    </template>
                </Column>
                <Column header="# of Cases" field="amount">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @update:model-value="data.qty = data.amount*data.units_per_case"/>
                    </template>
                </Column>
                <Column header="Units per Case" field="units_per_case"></Column>
                <Column header="Total Units" field="qty">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @update:model-value="data.amount = data.qty/data.units_per_case"/>
                        <!-- Math.ceil(data.total/data.units_per_case) -->
                    </template>
                </Column>
                <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                <!-- <Column >
                    <template #body>
                        <Button v-tooltip.top="'Cancel Product'" text icon="pi pi-ban" @click="onProcProductCancel"/>
                    </template>
                </Column> -->
            </DataTable>
            <Button label="Add another product" text @click="openNewPurchaseOrderProductDialog"/>
            <br>

            <template #footer>
                <!-- Adding the Total Price line fixed the syntax highlighting everywhere else -->
                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                    <div>
                        <div class="flex flex-start font-bold">Total Units: {{ calculatePoUnitTotal() }}</div>
                        <div class="flex flex-start font-bold">Total Price: {{ formatCurrency(calculatePoCostTotal()) }}</div>
                    </div>
                    
                    <Button label="Close"  @click="editPurchaseOrderDialog = false"/>
                </div>
                <!-- <Button label="Save" icon="pi pi-check"  text @click="validate" /> -->
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

        <Dialog v-model:visible="rawProductCancelDialog" :style="{width: '480px'}" header="Confirm Product Cancellation" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="rawProductToCancel">
                    Are you sure you want to cancel
                    <b>{{ rawProductToCancel.product_name || ('Product #' + rawProductToCancel.product_id) }}</b>
                    from this purchase order?
                </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeRawProductCancelDialog"/>
                <Button label="Yes, Cancel Product" icon="pi pi-check" severity="danger" text @click="confirmRawProductCancel" />
            </template>
        </Dialog>

        <Dialog v-model:visible="statusChangeDialog" :style="{width: '450px'}" header="Status Change" :modal="true">
            <div class="confirmation-content">
                <span v-if="purchaseOrder">Change Purchase Order <b>{{purchaseOrder.purchase_order_name}}</b> status to {{ newStatus }}?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="statusChangeDialog = false; newStatus=''"/>
                <Button label="Yes" icon="pi pi-check" text @click="confirmStatusChange" />
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

        <Dialog v-model:visible="additionalLocationDialog" :style="{width: '450px'}" header="Add Location" :modal="true">
            <template v-if="selectedOrderType" class="caseCard" v-for="(poBox, counter) in poBoxes">
                <div class="field">
                    <label for="location">Location:</label>
                    <!-- <InputText id="location" v-model="eCase.location" rows="3" cols="20" /> -->
                    <Dropdown v-model="poBox.location_id"
                    placeholder="Select a Location" class="w-full md:w-14rem" editable
                    :options="locations"
                    filter
                    :virtualScrollerOptions="{ itemSize: 38 }"
                    optionLabel="name"
                    optionValue="location_id" />
                </div>
            </template>
            
            <Button label="New Location" icon="pi pi-plus" @click="newLocation()"  />
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="additionalLocationDialog = false;"/>
                <Button label="Save" icon="pi pi-check" text @click="createLocation" />
            </template>
        </Dialog>

        <Dialog v-model:visible="receivedDialog" header="Received Boxes [Click any cell to edit]" :modal="true">
            <DataTable :value="receivedLocationsArray" v-model:editingRows="editingRows" 
                    rowGroupMode="subheader" groupRowsBy="name" 
                    editMode="cell" @row-edit-save="onReceivedLocationRowSave" @cell-edit-complete="onReceivedLocationCellEdit"
                    scrollable scrollHeight="400px"
                    showGridlines
                    >
                        <!-- <Column field="name" header="Name"/> -->
                        <Column field="amount" header="Total Number of Boxes">
                            <template #body={data}>
                                {{ data.amount }}
                            </template>
                            <template #editor={data}>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="data.amount" showButtons
                                @update:model-value="data.total = Math.round(data.amount*data.units_per_case)"
                                />
                            </template>
                        </Column>
                        <Column header="Total Number of Units">
                            <template #body={data}>
                                {{ data.total }}
                            </template>
                            <template #editor={data}>
                                <InputNumber v-model="data.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="data.amount = onTotalUpdate(data.total, data.units_per_case)"
                                />
                            </template>
                        </Column>

                        <Column header="Location">
                            <template #body="{data}">
                                {{ formatSingleLocation(data.location_id) }}
                            </template>
                            <template #editor="{data}">
                                <div class="container">
                                    <!-- <InputText id="location" v-model="eCase.location" rows="3" cols="20" /> -->
                                    <Dropdown v-model="data.location_id"
                                    placeholder="Select a Location" class="w-full md:w-14rem" editable
                                    :options="locations"
                                    filter
                                    :virtualScrollerOptions="{ itemSize: 38 }"
                                    optionLabel="name"
                                    optionValue="location_id" />
                                    <Button icon="pi pi-plus" v-tooltip.top="'Add New Location'" @click="newLocation()"  />
                                </div>
                            </template>
                        </Column>

                        <!-- <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column> -->

                        <Column >
                            <template #body="{index}">
                                <div v-if="index > 0">
                                    <Button icon="pi pi-times" style="color: red" text @click="deleteBulkLine(receivedLocationsArray, index)"/>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <!-- <Button  text label="Additional Pallet" v-tooltip.top="'Products located on additional pallet'" @click="addReceivedArrayLine"/> -->
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="receivedDialog = false;"/>
                <Button label="Save" icon="pi pi-check" text @click="receivedDialogSave" />
            </template>
        </Dialog>

        <Transition name="loader-fade">
            <div v-if="loading" class="loading-overlay">
                <div class="loading-card">
                    <ProgressSpinner style="width: 64px; height: 64px" strokeWidth="3" fill="transparent" animationDuration=".9s" />
                    <span class="loading-label">Loading&hellip;</span>
                </div>
            </div>
        </Transition>

        <Dialog v-model:visible="newPurchaseOrderProductDialog" header="New Purchase Order Product" :modal="true">
            <h4 class="flex justify-content-start font-bold w-full">Processed Product to Create</h4><br>

            <div class="block-div">
                        <div class="field">
                            <label for="name">Name:</label>
                            <AutoComplete 
                                v-model="newPORecipe.recipeObj"
                                :suggestions="filteredRecipesEdit || []"
                                @complete="(event: any) => searchRecipesEdit(event)"
                                @item-select="onRecipeSelectionEdit(newPORecipe.recipeObj)"
                                :dropdown="true"
                                :optionLabel="'label'"
                                placeholder="Select or enter a product"
                                class="md:w-14rem"
                                :class="{'p-invalid': submitted && !newPORecipe.recipeObj}"
                                :forceSelection="false"
                            />
                            <small class="p-error" v-if="submitted && !newPORecipe.recipeObj">Name is required.</small>
                        </div>

                        <div class="field">
                            <label for="qty">Normal Case QTY:</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            :class="{'p-invalid': submitted && !newPORecipe.default_units_per_case}"
                            v-model="poCasesEdit.default_units_per_case" disabled
                            />
                            <small class="p-error" v-if="submitted && !newPORecipe.default_units_per_case">Amount is required.</small>
                        </div>

                        <div class="field">
                            <label for="amount">Cases Desired to Be Made</label>
                            <InputNumber inputId="stacked-buttons" required="true" 
                            v-model="newPORecipe.amount" showButtons :min="1"
                            @update=""/>
                        </div>

                        <div class="field">
                            <label for="notes">Notes:</label>
                            <InputText id="notes" v-model="newPORecipe.notes" rows="3" cols="20" />
                        </div>

                        <div v-if="newPORecipe.amount && newPORecipe.recipeObj" class="field">
                            <label class="flex justify-content-end font-bold w-full" for="total">Total to be Made:</label>
                            <div class="flex justify-content-end font-bold w-full">{{ poCasesEdit.default_units_per_case * newPORecipe.amount }}</div>
                        </div>

                    </div>

                    <div v-if="poCasesEdit.default_units_per_case">
                        <DataTable :value="selectRecipeElements(newPORecipe.recipeObj)">
                            <Column field="name" header="Product Name" />
                            <Column field="qty" header="Units per Box" >
                                <template #body="{data}">
                                    {{ getProductInfo(data.product_id, 'default_units_per_case') }}
                                </template>
                            </Column>
                            <Column field="qty" header="Unit(s) per Bundle" ></Column>
                            <Column header="Total Units Needed">
                                <template #body="{data}">
                                        {{  getTotalUnitsNeeded(data, poCasesEdit, newPORecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Total Units Ordered" >
                                <template #body="{data}">
                                    {{ getTotalUnitsOrdered(data, poCasesEdit, newPORecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Raw Box Total" >
                                <template #body="{data}">
                                    {{ getRawBoxTotal(data, poCasesEdit, newPORecipe.amount) }}
                                </template>
                            </Column>
                            <Column header="Unit Price" >
                                <template #body="{data}">
                                    {{ formatCurrency(getProductInfo(data.product_id,'price_2023')) }}
                                </template>
                            </Column>
                            <Column header="Total Price" >
                                <template #body="{data}">
                                    {{ formatCurrency(getTotalCost(data, poCasesEdit, newPORecipe.amount)) }}
                                </template>
                            </Column>
                        </DataTable>
                        <InputText id="notes" v-model="poCasesEdit.notes" rows="3" cols="20" />
                    </div>
            
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeNewPurchaseOrderProductDialog"/>
                <Button label="Save" icon="pi pi-check" text @click="saveNewPurchaseOrderProduct"/>
            </template>
        </Dialog>

        <Dialog v-model:visible="inboundPurchaseOrderDialog" :header="'Inbounding Purchase Order ' + purchaseOrder.purchase_order_name" :modal="true">

        </Dialog>
        
    </div>
</template>

<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils";
import importAction from "../components/utils/importUtils";

import InputNumber from 'primevue/inputnumber';
import { debounce, keys } from 'lodash';

import ZoomDropdown from '@/components/ZoomDropdown.vue';
import ProductAutoComplete from '@/components/ProductAutoComplete.vue';
import { table } from 'console';

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr9a7h?file=/src/App.vue:3297-3712

export default {
    components: {
        ZoomDropdown,
        ProductAutoComplete
    },
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
            locationSubmitted: false,

            //PURCHASE ORDER VARIABLES
            purchaseOrders: [] as any[],
            purchaseOrder: {} as any,
            purchaseOrderDialog: false,
            selectedPurchaseOrder: [] as any[],
            cancelOrderDialog: false,
            rawProductCancelDialog: false,
            rawProductToCancel: null as any,
            editPurchaseOrderDialog: false,
            newPurchaseOrderProductDialog: false,
            editingRows: [] as any[],
            rawEditingRows: [] as any[],
            recipeEditingRows: [] as any[],
            rawOrderType: ['By Box', 'By Unit'],
            selectedOrderType: "",
            statusChangeDialog: false,
            receivedDialog: false,
            newStatus: "",
            headerData: { name: '', vendor_id: 0, status: '', notes: '', discount: 0, date_ordered: null, date_received: null},
            inboundPurchaseOrderDialog: false,

            //PRODUCTS VARIABLES
            products: [] as any[],
            unprocProducts: [] as any[],
            procProducts: [] as any[],
            product: {} as any,
            selectedProducts: [] as any[],
            totalErrorMSG: "" as string,
            // filteredProducts: [] as any[],
            filteredRawProducts: [] as any[],

            // MISSING DEFAULT UNITS DIALOG
            missingDefaultUnitsDialog: false,
            missingDefaults: [] as Array<{ product_id: number; name: string; item_num: string; default_units_per_case: number | null }>,
            missingDefaultsRecipeIndex: null as number | null,

            //CASE VARIABLES
            cases: [] as any[],
            uBoxes: [] as any[],
            pCases: [] as any[],
            poCases: [] as any[],
            poCasesEdit: {} as any,
            poBoxes: [] as any[],
            reqPoBoxes: [] as any[],
            editedLine: {} as any,
            amount: 1,
            displayStatus: "",
            delivered: [] as any[],
            boxesToDelete: [] as any[],
            inboundBoxes: [] as any[],

            //VENDOR VARIABLES
            vendors: [] as any[],
            vendorDialog: false,
            vendorSubmitted: false,
            filteredVendors: [] as any[],

            //RECIPE VARIABLES
            recipes: [] as any[],
            displayRecipes: [] as any[],
            recipeArray: [] as any[],
            recipeArrayEdit: {} as any,
            recipeElements: [] as any[],
            displayRecipeElements: [] as any[],
            detailedRecipes: [] as any[],
            poRecipes: [] as any[],
            singlePoRecipes: [] as any[],
            filteredRecipes: [] as any[],
            filteredRecipesEdit: [] as any[],
            newPORecipe: {} as any,

            //LOCATION VARIABLES
            locations: [] as any[],
            locationToCreate: {} as any,
            locationDialog: false,
            additionalLocationDialog: false,
            receivedLocationsArray: [] as any,
            specificProductReceivedLocArray: [] as any[],

            //MISC VARIABLES
            tableZoom: 1,
            today: "",
            loading: false,
            isInitializingPurchaseOrder: false,
            statuses: [
                'Draft',
                'Submitted',
                'Ordered',
                'Inbound',
                'Partially Delivered',
                'Delivered',
            ],
            filterField: '',
            searchText: '',
            currentPage: 1,
            rowsPerPage: 25,
            totalRecords: 0,
            sortField: '',
            sortOrder: -1,

        }
    },
    created() {
        this.initFilters();
        this.lazySave = debounce(() => this.save(), 250, { trailing: true }) as (() => Promise<void>);
        this.onSearchDebounced = debounce(async () => {
            this.currentPage = 1;
            await this.loadPage(1);
        }, 300, { trailing: true }) as (() => Promise<void>);
    },
    watch: {
        purchaseOrder: {
        deep: true,
        handler() {
            if (this.isInitializingPurchaseOrder || !this.editPurchaseOrderDialog) return;
            this.lazySave();
        }
        },
        searchText: {
            handler() { this.onSearchDebounced(); }
        },
    },
    async mounted() {
        console.log('Mounted');
        this.loading = true;
        await this.initVariables();      // loads vendors/products/recipes you already use
        await this.loadPage(1);          // load first page for the table
        this.loading = false;
    },
    methods: {
        lazySave: () => Promise.resolve(),
        onSearchDebounced: async () => Promise.resolve(),
        
        async save(): Promise<void> { 
            try {
                if(this.purchaseOrder.purchase_order_id){
                    const editedPO = await action.editPurchaseOrder(this.purchaseOrder);
                    console.log(editedPO);
                    if(editedPO.date_ordered)
                        editedPO.date_ordered = editedPO.date_ordered.split('T')[0];
                    if(editedPO.date_received)
                        editedPO.date_received = editedPO.date_received.split('T')[0];

                    const poIdx = this.purchaseOrders.findIndex(po => po.purchase_order_id === editedPO.purchase_order_id);
                    this.purchaseOrders[poIdx] = editedPO;
                }
            } catch (error) {
                console.error(error);
            }
         }, 

         async onSort(event: any){
            console.log("SORT EVENT: ", event);
            this.sortField = event.sortField;
            this.sortOrder = event.sortOrder;
            this.currentPage = 1;
            await this.loadPage(1);
         },

         async loadPage(page: number) {
            try {
                // this.loading = true;
                // console.log("Search Text: ", this.searchText);

                // Get total count (for paginator) and current page rows
                const data = await action.getPurchaseOrdersPage(
                    page,
                    this.rowsPerPage,
                    this.filterField || '',
                    this.searchText || '',
                    this.sortField || '',
                    this.sortOrder
                );            

                this.totalRecords = data.total_count;

                /**@TODO Potentially optimize this by only loading vendors relevant to the current page. Was deemed not yet necessary as of 3/5/2026 */
                // Attach vendor_name etc. the same way you do in getProducts()
                data.purchase_orders.forEach((p: any) => {
                    const vendor = this.vendors.find((v: any) => p['vendor_id'] == v['vendor_id']);
                    if (vendor) p['vendor_name'] = vendor['vendor_name'];
                });

                
                // this.products = await action.getProducts();
                this.products = data.all_products;

                this.purchaseOrders = data.purchase_orders;
                this.currentPage = page;
                

                this.purchaseOrders.forEach(po => {
                    if(po.date_ordered)
                        po.date_ordered = po.date_ordered.split('T')[0];
                    if(po.date_received)
                        po.date_received = po.date_received.split('T')[0];
                });
                
                const poIds: number[] = this.purchaseOrders.map((po: any) => po.purchase_order_id);
                
                // const pageRecipes = await action.getRecipesAndElementsForPOs(poIds);
                this.displayRecipes = data.all_recipes;
                this.displayRecipeElements = data.all_recipe_elements;
                this.poRecipes = data.all_po_recipes;
                this.uBoxes = data.all_boxes;
                // this.pCases = await action.getProcrocCasesForPOPage(poIds); // Taking out for now because po_recipes fills the gap for this
                // await action.getRecipesAndElementsForPOs(poIds);

                // console.log("BOXES: ", this.uBoxes);
                // console.log("CASES: ", this.pCases);
                
                // Reset scroll position to top after new page data loads
                this.$nextTick(() => {
                    const dtElement = (this.$refs.dt as any)?.$el;
                    
                    // Find the scrollable table, then scroll its parent wrapper
                    const scrollableTable = dtElement?.querySelector('.p-datatable-scrollable-table');
                    if (scrollableTable) {
                        // The wrapper is usually 2-3 parents up
                        let scrollableWrapper = scrollableTable.parentElement;
                        if (scrollableWrapper && scrollableWrapper.scrollHeight > scrollableWrapper.clientHeight) {
                            scrollableWrapper.scrollTop = 0;
                        }
                    }
                });
            } catch (e) {
                console.error(e);
            }
            finally {
                // this.loading = false;
            }
        },

        onPage(event: any) {
            // PrimeVue gives 0-based page index
            const newPage = event.page + 1;
            this.rowsPerPage = event.rows;
            this.loadPage(newPage);
        },

        async initVariables(){
            try {
                // this.loading = true;

                await this.getVendors();
                // await this.getProducts();
                // await this.getBoxes();
                // await this.getRecipes();
                await this.getLocations();
                this.getDate();
                // this.loading = false;


            } catch (error) {
                console.log(error);
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

        async getRawProductsForVendor(){
            try {
                this.unprocProducts = await action.getRawProductsForVendor(this.purchaseOrder.vendor_id);
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

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 3-13-2026
        async getRecipes(){
            try {
                if(this.recipes.length === 0 || this.recipeElements.length === 0 || this.recipes[0].vendor_id !== this.purchaseOrder.vendor_id){
                    let recipesAndElements = await action.getRecipesAndElementsForVendors(this.purchaseOrder.vendor_id);
                    this.recipes = recipesAndElements.recipes;
                    this.recipeElements = recipesAndElements.elements;
                }

                //console.log(this.recipes);
                //console.log(this.recipeElements);
            } catch (error) {
                console.log(error);
            }
        },

        /**
         * Description: Grabs the locations from the database
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-22-2024
         * Date Last Edited: 7-22-2024
         */
        async getLocations(){
            try {
                this.locations = await action.getLocations();
            } catch (error) {
                console.log(error);
            }
        }, 

        /**
         * Description: Clears the locationToCreate object and opens the Dialog for adding a new location to the database
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-22-2024
         * Date Last Edited: 7-22-2024
         */
        newLocation(){
            this.locationToCreate = {};

            this.locationDialog = true;
        },

        /**
         * Description: 
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-22-2024
         * Date Last Edited: 7-22-2024
         */
        additionalLocation(){},

        /**
         * Description: Inserts a new location into the databse, refreshes the locations array, closes the location
         * dialog, and clears the locationToCreate object
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-22-2024
         * Date Last Edited: 7-22-2024
         */
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
        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-03-2024
        selectRecipeElements(recipe: any){
            
            console.log("RECIPE  ", recipe);
            
            let inputProducts = this.recipeElements.filter(re => re.type === 'input' && re.recipe_id === recipe.recipe_id);
            console.log("INPUT PRODUCTS: ", inputProducts);

            inputProducts.forEach(ir => {
                let inProd = this.products.find(p => p.product_id === ir.product_id);
                ir.name = inProd.name;
            })

            //console.log("RECIPES USED ", usedRecipes);
            //console.log("PRODUCTS USED ", usedProducts);
            //this.poCases[counter].recInfo = usedProducts;
            return inputProducts;
        },

        /**
         * Use a product ID to grab all of the key metadata
         * 
         * @param productId {number} The ID for the product key the user wants
         * @returns An object containing the desired product key
         * 
         * Created by: Gabe de la Torre
         * Date Created: 5-30-2024
         * Date Last Edited: 5-30-2024
         */
        getProductKey(productId: number){
            let foundProd = this.products.find(p => p.product_id === productId);
            console.log(foundProd);
            return foundProd;
        },

        //Description: Gets vendor name from the id
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 5-29-2024
        getVendor(vendorId: any){
            //console.log(vendorId);
            let vendor = this.vendors.find(v => v.vendor_id === vendorId);
            //console.log(vendor);
            let name = vendor.vendor_name;
            //console.log(name);
            return name;
        },

        /**
         * Takes a product id and field name that is inputted and returns the value for that field.
         * 
         * @param productId {number} The id of the product the user is looking for 
         * @param field {string} The field in the product key the user is looking for
         * @returns The value for the user-specified field
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-1-2024
         * Date Last Edited: 7-1-2024
         */
        getProductInfo(productId: number, field: string){
            let prodKey = this.products.find(p => p.product_id === productId);
            if (!prodKey) return null;
            console.log("Product Key for ID ", productId, ": ", prodKey);
            // console.log("Value for field " + field + " for product " + prodKey.name + ":", prodKey[field]);
            return prodKey[field];
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        /* getBundleUnits(productNeeded: number){
            //console.log("PRODUCT NEEDED ", productNeeded);
            //console.log("PRODUCT MADE, ", productMade);
            let recipeElement = [] as any[];
            recipeElement = this.recipeElements.find(r => r.product_id === productNeeded && r.type === 'input');
            console.log("BUNDLE REC EL", recipeElement);
            return recipeElement[<any>'qty'];
        }, */

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-3-2024
        getTotalUnitsNeeded(rawRecEl: any, poCase: any, recipeAmount: number){
            // Defensive: avoid NaN if default units are missing
            const unitsPerCase = poCase?.default_units_per_case || poCase?.units_per_case || 0;
            if (!unitsPerCase || !recipeAmount || !rawRecEl?.qty) return 0;
            return rawRecEl.qty * (unitsPerCase * recipeAmount);
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        getTotalUnitsOrdered(rawRecEl: any, poCase: any, recipeAmount: number){
            const rawBox = this.products.find(p => p.product_id === rawRecEl.product_id);
            if (!rawBox || !rawBox.default_units_per_case) return 0;
            return this.getRawBoxTotal(rawRecEl, poCase, recipeAmount) * rawBox.default_units_per_case;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        getRawBoxTotal(rawRecEl: any, poCase: any, recipeAmount: number){
            const rawBox = this.products.find(p => p.product_id === rawRecEl.product_id);
            if (!rawBox || !rawBox.default_units_per_case) return 0;
            const unitsNeeded = this.getTotalUnitsNeeded(rawRecEl, poCase, recipeAmount);
            if (!unitsNeeded) return 0;
            return Math.ceil(unitsNeeded / rawBox.default_units_per_case);
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        getTotalCost(rawRecEl: any, poCase: any, recipeAmount: number){
            let rawBox = this.products.find(p => p.product_id === rawRecEl.product_id);
            return rawBox.price_2023*this.getTotalUnitsOrdered(rawRecEl, poCase, recipeAmount); 
        },
        getCreatedUnitTotal(poID: number){
            let total = 0;
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID && b.status !== 'Cancelled');
            // console.log("Used Boxes For Unit Total", usedBoxes);
            if (usedBoxes.length !== 0)
                usedBoxes.forEach(b => total+=b.units_per_case);

            // console.log("Total:", total);
            return total;
        },
        /**
         * Takes the id and discount from a purchase order, grabs all boxes linked to the purchase order, then 
         * calculates the total cost past on product price and unit amount
         * 
         * @param poID {number} The Purchase Order Id
         * @param poDiscount {number} The urchase Order discount
         * @returns Total cost for the purchase order, with discount applied if neccessary 
         * @author Gabe de la Torre-Garcia
         * 
         * Created On: ???
         * 
         * Last Edited: 2-14-2025
         */
        getCreatedCostTotal(poID: number, poDiscount: number){
            let total = 0;
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID && b.status !== 'Cancelled');
            // console.log("Used Boxes For Cost Total", usedBoxes);
            // console.log("Products List", this.products);
            usedBoxes.forEach(b => {
                let prod = this.products.find(p => p.product_id === b.product_id);
                // console.log("Product key for box: ", prod);
                total+=(b.units_per_case*prod.price_2023);
                // console.log("Total in for each: ", total);
            });

            if (poDiscount){
                const discountDecimal = 1 - (poDiscount/100);
                total = total * discountDecimal;
            }
            // console.log("Total after discount: ", total);

            return total;
        },

        /**
         * Calculates the total cost for the purchase order, robustly handling undefined/null values and business logic.
         * Sums cost for recipes and raw boxes, applies discount if present.
         * Defensive against missing/invalid data.
         */
        calculatePoCostTotal() {
            let total = 0;
            // If editing an existing PO, sum from uBoxes
            if (this.purchaseOrder && this.purchaseOrder.purchase_order_id) {
                (this.uBoxes || []).filter(box => box && box.purchase_order_id === this.purchaseOrder.purchase_order_id && box.status !== 'Cancelled').forEach(b => {
                    if (!b || b.product_id == null || b.units_per_case == null) return;
                    const unitCost = this.getUnitCost && typeof this.getUnitCost === 'function' ? this.getUnitCost(b.product_id) : 0;
                    if (unitCost == null) return;
                    total += unitCost * b.units_per_case;
                });
            } else {
                // If creating a new PO, sum from recipeArray and poBoxes
                (this.recipeArray || []).filter(poRec => poRec && poRec.recipe_id).forEach(poRec => {
                    const recipeKey = (this.recipes || []).find(r => poRec.recipe_id === r.recipe_id);
                    if (!recipeKey) return;
                    const recipeElements = (this.recipeElements || []).filter(recEl => recEl.recipe_id === recipeKey.recipe_id);
                    const processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    const processedRecElKey = (this.products || []).find((p) => processedRecEl && p.product_id === processedRecEl.product_id);
                    const rawRecElArray = recipeElements.filter(recEl => recEl.type === 'input');
                    rawRecElArray.forEach(recEl => {
                        if (!this.getTotalCost || typeof this.getTotalCost !== 'function') return;
                        total += this.getTotalCost(recEl, processedRecElKey, poRec.amount);
                    });
                });
                (this.poBoxes || []).filter(b => b && b.status !== 'Cancelled').forEach(b => {
                    if (!b || b.product_id == null) return;
                    let totalUnitCost = 0;
                    if (this.selectedOrderType === 'By Box') {
                        totalUnitCost = this.getUnitCost(b.product_id) * (b.units_per_case * b.amount);
                    } else if (this.selectedOrderType === 'By Unit') {
                        totalUnitCost = this.getUnitCost(b.product_id) * (Math.ceil(b.unitAmount / b.units_per_case) * b.units_per_case);
                    }
                    total += totalUnitCost;
                });
            }
            // Apply discount if present
            const discount = this.purchaseOrder && this.purchaseOrder.discount;
            if (discount) {
                const discountDecimal = 1 - (discount / 100);
                total = total * discountDecimal;
            }
            return total;
        },

        /**
         * Description: Validates that a vendor has been selected before allowing the user to create a new purchase order. 
         * If validation fails, an error toast will appear. If validation passes, the openNew() function will be called to open the dialog for creating a new purchase order.
         * 
         * @author Gabe de la Torre-Garcia
         * 
         * Date Created: 3-16-2026
         * 
         * Date Last Edited: 3-16-2026
         */
        validateVendor(){
            if (!this.purchaseOrder.vendor_id && this.vendorSubmitted == true) {
                this.$toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Vendor is required.' });
            }
            else {
                this.openNew();
            }
        },

        /** @TODO Split the recipes into two different arrays: one for when users are editing/creating po's and one for the recipes in pagination */
        getPoolNew(purchase_order_id: number){
            let poolArray = [] as any[];
            let linkedPoRecipes = this.poRecipes.filter(rec => rec.purchase_order_id === purchase_order_id);
            let boxesBeingUsed = [] as any[];

            let boxArray = this.uBoxes.filter(box => box.purchase_order_id === purchase_order_id && box.status !== 'Cancelled');
            console.log("boxArray", boxArray);
            
            linkedPoRecipes.forEach(poRec => {
                let recipeOutput = this.displayRecipeElements.find(r => r.recipe_id === poRec.recipe_id && r.type === 'output');
                console.log("recipeOutput", recipeOutput);
                let outputKey = this.products.find(p => p.product_id === recipeOutput.product_id);
                console.log("outputKey", outputKey);

                // console.log(this.poRecipes)
                let poRecipe = this.poRecipes.find(recipe => recipe.purchase_order_id === purchase_order_id && recipe.recipe_id === recipeOutput.recipe_id);
                console.log("poRecipe",poRecipe);

                // the input products given the recipe id
                //2-27-2026 NOTE: I changed poRecipe.recipeObj.recipe_id to poRecipe.recipe_id because logging poRecipe in this function shows that there is no nest object. Kept the recipeObj calls for other instances,
                // just in case that affects any of the others. Will monitor and clean up later. 
                let rawRecInputs = this.displayRecipeElements.filter(r => r.recipe_id === poRecipe.recipe_id && r.type === 'input');

                let totals = [] as any[];

                rawRecInputs.forEach(r => {
                    let map = {} as any;
                    map.product_id = r.product_id;
                    r.totalUnits = poRecipe.qty; 
                    map.currentUnits = 0;
                    totals.push(map);
                });
                console.log("rawRecInputs", rawRecInputs);


                // get the input boxes that are being used as inputs. Use a filter-map for-loop
                const inputBoxesAndRecEl = [] as any[];

                // console.log(this.uBoxes);

                let filteredBoxArray = this.groupProducts(boxArray);
                console.log("filteredBoxArray", filteredBoxArray);

                let boxIdx = 0;

                for(const b of boxArray) {
                    if(b.purchase_order_id !== purchase_order_id)
                    continue;


                    let inputEl = rawRecInputs.find(r => r.product_id  === b.product_id);
                    if(inputEl){
                        let total = totals.find(t => t.product_id === inputEl.product_id)

                        let boxInArray = boxesBeingUsed.find(boxLine => boxLine.case_id === b.case_id);
                        // console.log("Box in array: ",boxInArray);
                        // Box already being used
                        if(boxInArray)
                            continue;

                        if(inputEl.totalUnits > total.currentUnits && (inputEl.totalUnits - b.units_per_case) >= total.currentUnits){
                            b.taken = true;
                            inputBoxesAndRecEl.push({ box: b, rec: inputEl });
                            boxesBeingUsed.push(b);
                            // console.log("INPUT BOXES", inputBoxesAndRecEl);
                            total.currentUnits += b.units_per_case;
                            // console.log("TOTAL UNITS", inputEl.totalUnits);
                        } else if (inputEl.totalUnits === total.currentUnits){
                            continue;
                        }
                    }
                }
            })

            console.log("Cases being used: ",boxesBeingUsed);

            for(const b of boxArray) {
                if(b.purchase_order_id !== purchase_order_id || b.taken === true)
                continue;

                /* let boxInArray = boxesBeingUsed.find(boxLine => boxLine === b.case_id);
                        console.log(boxInArray);
                        // Box already being used
                        if(boxInArray)
                        continue; */


                poolArray.push(b);
            }
            console.log("poolArray", poolArray);
            console.log("Grouped pool array", helper.groupProductsById(poolArray));
            return helper.groupProductsById(poolArray);
        },

        //Description: Creates a pool of raw products that don't have a plan
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-31-2024
        //Date Last Edited: 2-24-2025
        getPool(poId: number){
            let poolProd = [] as any[];

            let linkedPoRecipes = this.poRecipes.filter(rec => rec.purchase_order_id === poId);

            linkedPoRecipes.forEach(poRec => {
                let linkedInputElements = this.recipeElements.filter(recEl => recEl.recipe_id === poRec.recipe_id && recEl.type === 'input');
            })

            return poolProd;
        },

        /**
         * Description: Groups products together to get the total amount per product
         * @param prodArray {any[]} An array of individual records that needs to be grouped
         * @returns Gets an array where the values are records grouped together by product_id, status, 
         * and units_per_case
         * 
         * Created by: Gabe de la Torre
         * Date Created: 6-03-2024
         * Date Last Edited: 7-19-2024
         */
        groupProducts(prodArray: any[]){
            // get the products in the pool along with their amount
            let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {
                const key = product.product_id + ':' + product.status + ':' + product.units_per_case + ':' + product.location_id;
                //console.log("KEY", key);
                //console.log("MAP", map);
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                    map[key].case_ids.push(product.case_id);
                    //console.log(map[key].amount);
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, case_ids : [product.case_id], units_per_case: product.units_per_case, location: product.location_id, status: product.status, amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

            //console.log("POOL", pool);
            return pool;
        },

        groupReqProducts(prodArray: any[]){
            // get the products in the pool along with their amount
            let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {
                const key = product.product_id + ':' + product.units_per_case;
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                } 
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location_id, amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

            return pool;
        },

        /**
         * Description: Groups products together to get the total amount per product based on a specified key
         * @param prodArray {any[]} An array of individual records that needs to be grouped
         * @param keyString {string} A string of fields that is used to group records together
         * @returns Gets an array where the values are records grouped together by product_id, units_per_case, 
         * and the contents of the keyString
         * 
         * Created by: Gabe de la Torre
         * Date Created: 7-19-2024
         * Date Last Edited: 7-19-2024
         */
         groupProductsByKey(prodArray: any[], keyArray: any[]){
            // get the products in the pool along with their amount
            let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {
                let keyString = "";
                keyArray.forEach(key => keyString += ':'+product[key]);

                const key = product.product_id + ':' + product.units_per_case + keyString;
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location_id, amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

            return pool;
        },
         groupProductsByKeyOLD(prodArray: any[], keyString: string){
            // get the products in the pool along with their amount
            let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {
                const key = product.product_id + ':' + product.units_per_case + ':' + keyString;
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location_id, amount: 1 };
                return map;
            }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

            return pool;
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

        //Description: Gets the raw or processed products for a specific vendor
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 5-29-2024
        selectVendorProducts(poVendor: any, status: any){
            let vendorProducts = [] as any[];
            
            if(status == 'proc'){
                vendorProducts = this.procProducts.filter(p => p['vendor_id'] == poVendor)
            }

            else if (status == 'raw'){
                vendorProducts = this.unprocProducts.filter(p => p['vendor_id'] == poVendor)
            }
            return vendorProducts;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 7-3-2024
        //Date Last Edited: 7-3-2024
        selectVendorRecipes(poVendor: any){
            let vendorRecipes = [] as any[];

            vendorRecipes = this.recipes.filter(r => r['vendor_id'] == poVendor)

            return vendorRecipes;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-5-2024
        async openNew() {
            try {
                // this.loading = true;
                this.vendorDialog = false;
                this.vendorSubmitted = false;
                this.poBoxes = [];
                this.poCases = [];
                this.recipeArray = [];
                this.selectedOrderType = "";
                this.amount = 1;
                console.log("Selected Vendor: ", this.purchaseOrder.vendor_id);
                /* if(this.recipes.length === 0 || this.recipeElements.length === 0){
                    
                } */

                

                const today = new Date();
                const year = today.getFullYear().toString();

                let nickname = '';
                let maxSeqForYear = 0;

                let newestPos = await action.getNewestPurchaseOrdersByVendor(this.purchaseOrder.vendor_id);

                // Find the highest sequence number for the current year for this vendor
                // PO name format: {vendorCode}-{YYYY}{seq}[suffix]
                // Example: AU-202603fbm (vendor AU, year 2026, seq 03, suffix fbm)
                newestPos.forEach(po => {

                    const name = po.purchase_order_name || '';
                    const match = name.match(/^([^_-]+)[-_](\d{4})(\d{2,3})([A-Za-z].*)?$/);

                    // If it doesn't match the expected format, just skip this PO
                    if (!match) return;

                    const poNickname = match[1] || '';
                    if (!nickname && poNickname) {
                        nickname = poNickname;
                    }

                    const poYear = match[2];
                    const seq = Number(match[3]);
                    if (poYear === year && !isNaN(seq)) {
                        maxSeqForYear = Math.max(maxSeqForYear, seq);
                    }
                });

                // Reset annually: start at 1 for a new year
                const nextSeq = maxSeqForYear + 1;
                const seqStr = String(nextSeq).padStart(2, '0');

                if (!nickname) {
                    nickname = '[COMPANY_CODE_HERE]';
                }

                this.purchaseOrder.purchase_order_name = `${nickname}-${year}${seqStr}`;

                this.purchaseOrder.status = "Draft";
                //this.purchaseOrder.raw = this.poBoxes;
                //this.purchaseOrder.cases = this.poCases

                //console.log(this.purchaseOrders[0].date_ordered.split('T')[0]);
                console.log(this.purchaseOrder)
                //console.log(this.selectedOrderType);
                
                this.newBulkArray();

                this.submitted = false;
                this.purchaseOrderDialog = true;
                // this.loading = false;
                console.log("Purchase Order Dialog Opened, PO Object: ", this.purchaseOrder);
            } catch (error) {
                console.error("Error occurred while opening new purchase order:", error);
            }
            
        },

        /**
         * @description Handles the opening of the purchase order dialog for both creating a new PO and editing an existing PO.
         * Initializes necessary data such as raw products and recipes based on the vendor, and then opens the dialog with the appropriate state for either creating or editing.
         * @param dialogType The type of dialog to open (1 for creating a new PO, 2 for editing an existing PO)
         * @param purchaseOrder The purchase order object to edit (required if dialogType is 2)
         * @author Gabe de la Torre-Garcia
         * @dateCreated 3-25-2026
         * @dateLastEdited 3-25-2026
         */
        async onPurchaseOrderDialogOpen(dialogType: number, purchaseOrder?: any){
            try {
                this.loading = true;
                this.isInitializingPurchaseOrder = true;
                console.log("Purchase Order Dialog opened with dialogType:", dialogType);

                if (dialogType === 1) {
                    console.log("Purchase Order Dialog opened from Create New PO flow");
                    this.vendorSubmitted = true;

                    if (!this.purchaseOrder.vendor_id) {
                        this.$toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Vendor is required.' });
                        return;
                    }

                    await this.getRawProductsForVendor();
                    await this.getRecipes();
                    await this.openNew();
                } else if (dialogType === 2) {
                    console.log("Purchase Order Dialog opened from Edit PO flow");
                    console.log("Purchase Order to edit:", purchaseOrder);

                    if (!purchaseOrder?.purchase_order_id) {
                        console.warn("Edit PO flow was called without a valid purchase order.");
                        return;
                    }

                    // Set the active PO first so vendor-scoped initialization uses the correct vendor.
                    this.purchaseOrder = { ...purchaseOrder };

                    await this.getRawProductsForVendor();
                    await this.getRecipes();
                    await this.editPurchaseOrder(purchaseOrder);
                } else {
                    console.log("Purchase Order Dialog opened with unknown dialogType:", dialogType);
                }
            } catch (error) {
                console.error("Error occurred during Purchase Order Dialog initialization:", error);
            } finally {
                this.isInitializingPurchaseOrder = false;
                this.loading = false;
            }
        },


        /**
         * Calculates the total units for the purchase order, with defensive checks for undefined/null values.
         * Filters out any undefined/null or incomplete objects in recipeArray and poBoxes.
         *
         * Fixes: TypeError: Cannot read properties of undefined (reading 'recipe_id')
         * Commented out 3/25/2026
         */
        /* calculatePoUnitTotal() {
            // Defensive: filter out undefined/null or incomplete objects
            console.log("Recipe Array: ", this.recipeArray);
            const validRecipeArray = (this.recipeArray || []).filter(r => r && typeof r === 'object' && r.recipe_id != null && r.amount != null);
            const validPoBoxes = (this.poBoxes || []).filter(b => b && typeof b === 'object' && b.product_id != null && b.units_per_case != null);
            console.log("Valid Recipe Array: ", validRecipeArray);

            let total = 0;
            validRecipeArray.forEach(r => {
                // Defensive: ensure r.recipe_id is valid
                if (!r || r.recipe_id == null) return;
                // Find the recipe element for this recipe
                const recipeEl = this.recipeElements && Array.isArray(this.recipeElements)
                    ? this.recipeElements.find(el => el.recipe_id === r.recipe_id && el.type === 'output')
                    : null;
                if (!recipeEl) return;
                // Find the product for this recipe element
                const product = this.products && Array.isArray(this.products)
                    ? this.products.find(p => p.product_id === recipeEl.product_id)
                    : null;
                if (!product || product.default_units_per_case == null) return;
                // Add to total
                total += r.amount * product.default_units_per_case;
            });
            // Optionally, add logic for poBoxes if needed
            // validPoBoxes.forEach(b => {
            //     if (!b || b.units_per_case == null || b.amount == null) return;
            //     total += b.amount * b.units_per_case;
            // });
            return total;
        }, */

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-3-2024
        newBulkArray(){

            for(let idx = 0; idx < 3; idx++){
                this.addBulkLine(this.poCases);
                this.addBulkLine(this.poBoxes);
                this.addBulkLine(this.recipeArray);
            }
        },
        addBulkLine(poArray: any){
            console.log("PO ARRAY", poArray);
            poArray.push(
                    {
                    name: '',
                    amount: 1,
                    default_units_per_case: 0,
                    units_per_case: 0,
                    }
                )
        },
        deleteBulkLine(array: any, counter: any){
            array.splice(counter,1);
        },
        hideDialog() {
            this.submitted = false;
            this.purchaseOrder = {};
            // this.vendorSubmitted = false;
            this.purchaseOrderDialog = false;
        },

        hideVendorDialog() {
            this.vendorSubmitted = false;
            this.purchaseOrder = {};
            this.vendorDialog = false;
        },
        getDate(){
            const date = new Date();
            this.today = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
            console.log("TODAYS DATE ", date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
        },

        onVendorAutoCompleteSelect(vendorObj: any){
            console.log("Vendor AutoComplete Selection:", vendorObj);
            if (vendorObj && vendorObj.vendor_id) {
                this.purchaseOrder.vendor = vendorObj;
                this.purchaseOrder.vendor_id = vendorObj.vendor_id;
            }
        },

        onProductSelection(productId: any){
            console.log("PRODUCT ID", productId);

            let product = this.products.find(p => p.product_id === productId);

            return product.default_units_per_case;
        },

        /**
         * Writes a selected raw-product AutoComplete result onto any row object.
         * Used by both the create and edit flows so assignment logic stays in one place.
         * @param productObj The product selected from the AutoComplete suggestions
         * @param rowData    The row object to populate (poBoxes[i] or the editing row)
         */
        applyRawProductToRow(productObj: any, rowData: any){
            if (!productObj?.product_id || !rowData) return;
            rowData.productObj     = productObj;
            rowData.product_id     = productObj.product_id;
            rowData.product_name   = productObj.name;
            rowData.units_per_case = productObj.default_units_per_case || 1;
            rowData.total          = (rowData.amount || 1) * rowData.units_per_case;
            console.log("applyRawProductToRow – row after assignment:", JSON.stringify(rowData));
        },

        onRawProductAutoCompleteSelectCreate(productObj: any, index: number){
            console.log("Product AutoComplete Selection (create):", productObj, "index:", index);
            this.applyRawProductToRow(productObj, this.poBoxes[index]);
        },

        /**
         * Description: When a user selects a product from the autocomplete, this function updates the current editing row with the product id, name, and default units per case.
         * @param productObj The product selected from the AutoComplete
         * @param rowData    The PrimeVue DataTable editing-row data object
         */
        onRawProductAutoCompleteSelectEdit(productObj: any, rowData: any){
            console.log("Product AutoComplete Selection (edit):", productObj);
            this.applyRawProductToRow(productObj, rowData);
        },

        /**
         * 
         * @param productObj 
         */
        onProcessedProductAutoCompleteSelect(productObj: any){
            console.log("Processed Product AutoComplete Selection:", productObj);
            
            if (productObj && productObj.product_id) {
                // Update the product_id in the current editing row
                const editingRow = this.editingRows[0]; // Assuming single row editing
                if (editingRow) {
                    editingRow.product_id = productObj.product_id;
                    editingRow.product_name = productObj.name;
                    editingRow.units_per_case = productObj.default_units_per_case || 1;
                    editingRow.qty = editingRow.amount * editingRow.units_per_case;
                }
            }
        },

        /**
         * Gets the raw products used for a processed product recipe
         * @param procProductId - The ID of the processed product
         * @returns An array of raw products
         */
        getRawProducts(procProductId: number){
            const output = this.recipeElements.find(re => re.product_id === procProductId && re.type === 'output');
            const rawProductInfo: {rec: any, key: any}[] = [];
            const inputs = this.recipeElements.filter(re => re.recipe_id === output.recipe_id && re.type === 'input');
            for (const input of inputs) {
                const rawProduct = this.products.find(p => p.product_id === input.product_id);
                rawProductInfo.push({rec: input, key: rawProduct});
            }
            console.log("Raw Products: ", rawProductInfo);
            return rawProductInfo;
        },

        /**
         * If the selected processed recipe has raw ingredients missing default_units_per_case, open a dialog so the user can enter values.
         */
        checkMissingDefaultUnitsForRecipe(recipeObj: any, counter: number){
            if (!recipeObj) return;

            const recipeId = typeof recipeObj === 'object' && recipeObj.recipe_id ? recipeObj.recipe_id : recipeObj;
            if (!recipeId) return;

            const rawElements = this.recipeElements.filter(re => re.recipe_id === recipeId && re.type === 'input');
            const missing = rawElements
                .map(re => this.products.find(p => p.product_id === re.product_id))
                .filter(p => p && (!p.default_units_per_case || p.default_units_per_case <= 0));

            if (!missing.length) return;

            this.missingDefaultsRecipeIndex = counter;
            this.missingDefaults = missing.map(p => ({
                product_id: p.product_id,
                name: p.name,
                item_num: p.item_num,
                default_units_per_case: p.default_units_per_case || null,
            }));
            this.missingDefaultUnitsDialog = true;
        },

        async saveMissingDefaultUnits(){
            const invalid = this.missingDefaults.some(d => {
                const numeric = Number(d.default_units_per_case);
                return !Number.isFinite(numeric) || numeric <= 0;
            });
            if (invalid) {
                this.$toast.add({ severity: 'error', summary: 'Missing value', detail: 'Please enter a valid numeric default units per case for all products.', life: 4000 });
                return;
            }

            try {
                this.loading = true;
                for (const item of this.missingDefaults) {
                    const product = this.products.find(p => p.product_id === item.product_id);
                    if (!product) continue;
                    const numeric = Number(item.default_units_per_case);
                    product.default_units_per_case = numeric;
                    // Update the product record on the server
                    await action.editProduct(product, []);
                }

                // Refresh derived tables that use default_units_per_case
                this.products = [...this.products];
                this.missingDefaultUnitsDialog = false;
                this.$toast.add({ severity: 'success', summary: 'Saved', detail: 'Default units were updated.', life: 3000 });

                // If we were highlighting a recipe row for missing defaults, clear it now
                this.missingDefaultsRecipeIndex = null;

                this.loading = false;

            } catch (error) {
                console.error(error);
                this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to save default units.', life: 4000 });
            }
        },

        /**
         * On recipe selection, updates the recipe array with the selected recipe id
         * @param recipeId - The recipe id to select
         * @param counter - The counter to update
         * 
         * Created by: Gabe de la Torre
         * 
         * Date Created: 7-03-2024
         * 
         * Date Last Edited: 7-15-2024
         */
        onRecipeSelection(recipeId: any, counter: number){
            // Ensure recipeId is always a primitive
            console.log("RECIPE ID BEGIN: ", recipeId);
            let id = recipeId;
            if (typeof recipeId === 'object' && recipeId !== null && 'recipe_id' in recipeId) {
                id = recipeId.recipe_id;
            }
            this.recipeArray[counter].recipe_id = id;
            console.log("RECIPE ID: ", id);
            console.log("PO RECIPE ID: ", this.poRecipes[counter].recipe_id);
            let recipeElement = this.recipeElements.find(re => re.recipe_id === id && re.type === 'output');
            console.log("RECIPE ELEMENT, ", recipeElement);
            this.poCases[counter] = this.products.find(p => p.product_id === recipeElement.product_id);
            console.log("PO CASE", this.poCases[counter]);

            // If the selected recipe contains raw products missing default_units_per_case, prompt the user to set them
            this.checkMissingDefaultUnitsForRecipe(recipeId, counter);
        },

        onRecipeSelectionEdit(recipeId: any){
            console.log("RECIPE ID BEGIN: ", recipeId);
            let id = recipeId;
            if (typeof recipeId === 'object' && recipeId !== null && 'recipe_id' in recipeId) {
                id = recipeId.recipe_id;
            }
            this.recipeArrayEdit.recipe_id = id;
            this.recipeArrayEdit.default_units_per_case = recipeId.default_units_per_case;
            console.log("RECIPE ID: ", id);
            let recipeElement = this.recipeElements.find(re => re.recipe_id === id && re.type === 'output');
            console.log("RECIPE ELEMENT, ", recipeElement);
            this.poCasesEdit = this.products.find(p => p.product_id === recipeElement.product_id);
            console.log("PO CASE", this.poCasesEdit);
        },

        //Description: Validates a purchase order before creation/editing.
        //Currently checks:
        //1) The PO has a name
        //2) All desired cases have an amount of 1 or greater
        //3) All desired raw boxes have an amount of 1 or greater
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: ???
        validate() {
            this.submitted == true;
            

            let errAmount = 0;
            let errText = [] as any[];
            //console.log("PO", this.purchaseOrder);
            //console.log("PO CASES: ", this.poCases);
            //console.log("PO BOXES: ", this.poBoxes);
            //console.log("NOT FLATTENED", this.purchaseOrder.cases);
            //console.log("FLATTENED PO ONE LEVEL", this.purchaseOrder.cases.flat());
            //console.log("FLATTENED PO TWO LEVELS", this.purchaseOrder.cases.flat(2));

            if(!this.purchaseOrder.purchase_order_name){
                errAmount++;
                errText.push("No PO name entered");
            }

            this.poCases.forEach((c: any) => {
                if (c.amount <= 0){
                    console.log("Case error: ", c);
                    errAmount++;
                }
                    
            })

            this.poBoxes.forEach((r: any) => {
                if (r.amount <= 0){
                    console.log("Box error: ", r);
                    errAmount++;
                }
                    
            })

            if (errAmount == 0){
                this.savePurchaseOrder();
            }
            else{
                if(errAmount > 1)
                    this.$toast.add({severity:'error', summary: "There are "+errAmount+" total errors", detail: errText.join("/n")});
                else
                    this.$toast.add({severity:'error', summary: "There is "+errAmount+" error", detail: errText.join("/n")});
            }
        },
        async savePurchaseOrder() {
            try {
                //this.submitted = true;
                if (this.purchaseOrder.purchase_order_name.trim()) {
                    this.loading = true;
                    if (this.purchaseOrder.purchase_order_id) {
                        await this.confirmEdit();
                    }
                    else {
                        await this.confirmCreate();
                    }

                    if(this.purchaseOrder.status !== 'Draft' || this.purchaseOrder.status !== 'Submitted'){
                        await this.checkForRequests();
                    }

                    this.loading = false;
                    this.purchaseOrderDialog = false;
                    this.editPurchaseOrderDialog = false;
                    //this.selectedProducts = null;
                    this.purchaseOrder = {};
                }
            } catch (error) {
                console.log(error);
            }
        },


        async confirmEdit(){
            try {
                //this.purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id);
                console.log(this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id));

                console.log("PURCHASE ORDER BEFORE AWAIT ",this.purchaseOrder);

                // if (this.purchaseOrder.status != 'Delivered')
                if(this.reqPoBoxes.length > 0){
                    console.log("IN ALOCATE");
                    await this.alocateBoxes();
                } else {
                    console.log('Editing PO');
                    console.log('Boxes to edit: ', this.poBoxes);
                    console.log('Cases to edit: ', this.poCases);
                }

                this.uBoxes.forEach(box =>{
                    if(box.status !== 'On RTP' && box.purchase_order_id === this.purchaseOrder.purchase_order_id){
                        this.purchaseOrder.status = 'Partially Delivered';
                        console.log("Box not ready: ",box)
                    }
                })

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);
                
                console.log("PURCHASE ORDER AFTER AWAIT ",this.purchaseOrder);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Updated', life: 3000});
                await this.loadPage(this.currentPage);
                // await this.getBoxes();

                return editedPurchaseOrder;
            } catch (error) {
                console.log(error);
                this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
            }
        },

        /**
         * Checks the boxes actually received in the PO vs the boxes requested and alocates the 
         * correct amount to either delivered or back-ordered
         * 
         * Created by: Gabe de la Torre
         * 
         * Date Last Edited: 4-28-2025
         */
        async alocateBoxes(){
            try {
                //console.log("BULK CASES IN ALOCATE ",this.poBoxes);
                console.log("REQUESTED BOXES ", this.reqPoBoxes);

                if (!this.purchaseOrder.date_received)
                    this.purchaseOrder.date_received = this.today;


                this.purchaseOrder.status = 'Delivered';
                let boxesToInsert = [] as any[];

                // Grab the boxes already received and the newly inputted boxes
                let receivedBoxArray = this.checkBoxes("Received");
                let newlyArrivedBoxArray = this.checkBoxes("Newly Arrived");
                let awaitedBoxes = this.checkBoxes("Awaited");

                console.log("receivedBoxArray", receivedBoxArray);
                console.log("newlyArrivedBoxArray",newlyArrivedBoxArray);
                
                // Loop through all of the requested boxes
                this.reqPoBoxes.forEach(reqBox => {
                    // let poBox = this.poBoxes.find(poBox => poBox.product_id === reqBox.product_id);                    

                    // Grab the received Box line and all of the newly arrived boxes.
                    /** @TODO Loop through the newlyArrivedBox array, function should still work as intended.
                     * Try to find a more effecient way to work after getting it to work at all.
                     */
                    let receivedBox = receivedBoxArray.find(rb => rb.product_id === reqBox.product_id);
                    let newlyArrivedBoxes = newlyArrivedBoxArray.filter(ab => ab.product_id === reqBox.product_id);
                    let newArrive = {} as any;

                    console.log("NEW ARRIVAL ARRAY", newlyArrivedBoxes);

                    // Check if the newly arrived boxes are in one location or multiple
                    if (newlyArrivedBoxes.length === 1){
                        newArrive = newlyArrivedBoxes[0];
                        console.log("ONLY ONE LOCATION");
                        // console.log("REQUESTED BOXES ", reqBox, " ACTUAL RECEIVED BOXES ", receivedBox, "AND NEWLY RECEIVED BOXES ", newArrive);
                        // Calculations
                        boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, newArrive, true));
                    } else if (newlyArrivedBoxes.length > 1) {
                        console.log("MULTIPLE LOCATIONS");
                        let lineIdx = 0;
                        let lastLine = false;
                        newlyArrivedBoxes.forEach(newRow => {
                            newArrive = newRow;
                            console.log("REQUESTED BOXES ", reqBox, " ACTUAL RECEIVED BOXES ", receivedBox, "AND NEWLY RECEIVED BOXES ", newArrive);
                            // Calculations
                            if(lineIdx > newlyArrivedBoxes.length)
                                lastLine = true;

                            boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, newArrive, lastLine));
                            lineIdx++;
                        })
                    } else {
                        // No locations, all awaited boxes of this product type set to back ordered
                        let noArrivales = {} as any;
                        noArrivales.total = 0;
                        noArrivales.amount = 0;
                        noArrivales.units_per_case = reqBox.units_per_case;
                        noArrivales.purchase_order_id = reqBox.purchase_order_id;
                        noArrivales.product_id = reqBox.product_id;
                        boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, noArrivales, true));
                        /* let awaitedProduct = awaitedBoxes.filter(box => box.product_id === reqBox.product_id);
                        awaitedProduct.forEach(box => {
                            box.status = 'BO';
                            boxesToInsert.push(box);
                        }) */
                    }            
                                       
                })

                console.log("BOXES TO INSERT ", boxesToInsert.flat());

                let insertArray = [] as any[];

                boxesToInsert.flat().forEach(async box => {
                    if (box.case_id){
                        //console.log("PRODUCT NAME: ", box.name, "BOX UNIT AMOUNT: ", box.units_per_case, "BOX STATUS: ", box.status, "BOX LOCATION: ", box.location)
                        let tempArray = [box.units_per_case, box.date_received, box.notes, box.product_id, box.location_id, box.status, box.purchase_order_id, box.request_id, box.case_id];
                        insertArray.push(tempArray);
                    } else {
                        console.log("BACK ORDERED PARTIAL BOX", box);
                        await action.addCase(box);
                    }
                })
                
                console.log('Insert Array: ', insertArray);
                await action.bulkEditCases(insertArray);

                // console.log("BOXES TO INSERT ", boxesToInsert);

                    
            } catch (error) {
                console.log(error);
            }
        },

        /**
         * Loops through the awaited boxes and calculates how many need to be set to 'received' or 'back ordered'
         * @param requested All requested boxes of a specific product type
         * @param received All currently received boxes of a specific product type
         * @param newlyArrived All newly arrived boxes of a specific product type
         * @param lastLocation Checks whether this is the final location (for boxes in multiple locations)
         * @returns An array of boxes that are either set to 'ready' or 'back ordered'
         * 
         * Created By: Gabe de la Torre-Garcia
         * 
         * Last Edited: 4-28-2025
         */
        alocateBoxCalculation(requested: any, received: any, newlyArrived: any, lastLocation: Boolean){
            console.log("IN ALOCATE BOX CALCULATION__________________________________________________________");
            console.log("REQUESTED BOXES ", requested, " RECEIVED BOXES ", received, "AND NEWLY ARRIVED BOXES ", newlyArrived);
            let boxesToInsert = [] as any[];



            // If no boxes have been received, set the object properties to zero
            if(!received){
                received = {} as any;
                received.total = 0;
                received.amount = 0;
                received.units_per_case = 0;
            }

            // If any of the three objects are missing a total property, populate it here
            if(!requested.total)
                requested.total = requested.amount * requested.units_per_case;

            if(!received.total)
                received.total = received.amount * received.units_per_case;

            if(!newlyArrived.total)
                newlyArrived.total = newlyArrived.amount * newlyArrived.units_per_case;

            // Calculate any units that would be back ordered
            let backorderUnits = requested.total - (received.total + newlyArrived.total);
            let backorderBoxes = backorderUnits/newlyArrived.units_per_case;
            let wholeBackorderBoxAmount = Math.floor(backorderBoxes);

            let poBoxUnitsPerCase = newlyArrived.units_per_case;

            console.log("PRODUCT ", requested.product_name);
            console.log("REQUESTED UNIT AMOUNT - (RECEIVED + NEWLY ARRIVED UNIT AMOUNT) = BACKORDER UNIT AMOUNT");
            console.log("REQ", requested.total, " - (REC + NEW)", "(", received.total, "+", newlyArrived.total, ")", " = LEFT", backorderUnits);

            //Get the specific decimal number for partial box purposes. 12 Received boxes might actually be 11.5
            let actualReceivedBoxes = newlyArrived.total/poBoxUnitsPerCase;
            let wholeReceivedBoxAmount = Math.floor(actualReceivedBoxes);

            console.log("REQUESTED BOX AMOUNT - (RECEIVED + NEWLY ARRIVED UNIT AMOUNT) = BACKORDER BOX AMOUNT");
            console.log("WHOLE BOX VIEW");
            console.log("REQ", requested.amount, " - (REC + NEW)", "(", received.amount, "+", newlyArrived.amount, ")", " = BO", wholeBackorderBoxAmount);

            // console.log("DECIMAL BOX VIEW");
            // console.log("REQ", requested.amount, " - (REC + NEW)", "(", received.amount, "+", newlyArrived.total/newlyArrived.units_per_case, ")", " = BO", backorderBoxes)
            
            //Gets the decimal value if one of the leftover boxes is partial
            let remainder = actualReceivedBoxes - wholeReceivedBoxAmount;

            let partialBoxAmount = 0;
            if(backorderUnits > 0)
                partialBoxAmount = Math.round(remainder*poBoxUnitsPerCase);

            let partialBackOrderBoxAmount = 0;
            if (partialBoxAmount > 0 && backorderUnits > 0){
                partialBackOrderBoxAmount = poBoxUnitsPerCase-partialBoxAmount;
            }

            // console.log("REMAINDER * UNITS PER CASE = PARTIAL BOX AMOUNT");
            // console.log("REM", remainder," * UNITS", newlyArrived.units_per_case," = PARTIAL",partialBoxAmount);

            console.log("PARTIAL BACK ORDER BOX AMOUNT", partialBackOrderBoxAmount);

            // Grab all the boxes for this PO of this product type that are not cancelled or arrived. 
            let boxes = this.uBoxes.filter(box => box.purchase_order_id === newlyArrived.purchase_order_id && box.product_id === newlyArrived.product_id && box.status !== 'On RTP' && box.status !== 'Cancelled');

            let backorderCompare = 0;

            boxes.forEach(box => {
                if(wholeReceivedBoxAmount > 0){
                    // console.log(newlyArrived);
                    console.log("FULL BOX");
                    box.status = 'On RTP';
                    box.date_received = this.today;

                    if(!box.location_id)
                        box.location_id = newlyArrived.location_id;
                    
                    // console.log(box);
                    boxesToInsert.push(box);
                    wholeReceivedBoxAmount--;
                } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount > 0 && partialBackOrderBoxAmount > 0){
                    console.log("PARTIAL FULL AND BACKORDER BOXES");

                    //If a partial box arrives, update the last box amount to partial amount a create 
                    // an additional box whose status is back ordered
                    box.units_per_case = partialBoxAmount;
                    box.status = 'On RTP';
                    box.date_received = this.today;

                    if(!box.location_id)
                        box.location_id = newlyArrived.location_id;

                    console.log(box);
                    boxesToInsert.push(box);

                    let boBox = [] as any[];
                    boBox[<any>'name'] = box.name;
                    boBox[<any>'product_id'] = box.product_id
                    boBox[<any>'purchase_order_id'] = box.purchase_order_id
                    boBox[<any>'units_per_case'] = partialBackOrderBoxAmount;
                    boBox[<any>'status'] = 'BO'

                    console.log(boBox);
                    //EVENTUALLY, JUST ADD THE BO BOX DIRECTLY HERE
                    boxesToInsert.push(boBox);

                    partialBoxAmount = 0;
                    this.purchaseOrder.status = 'Partially Delivered'
                } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount == 0 && backorderCompare < wholeBackorderBoxAmount && lastLocation === true) {
                    console.log("BACKORDER BOX");
                    //If no partial box arrives, update the remaining box amounts to backorder
                    box.status = 'BO';

                    // console.log(box);
                    boxesToInsert.push(box);
                    this.purchaseOrder.status = 'Partially Delivered'
                    backorderCompare++;
                }
            }) 

            return boxesToInsert;
        },

        /**
         * Creates a new purchase order, the recipe's required for the purchase order, and the raw boxes to order.
         * 
         * Created by: Gabe de la Torre
         * Date Created: ???
         * Date Last Edited: 2-24-2025
         */
        async confirmCreate(){
            try {
                this.purchaseOrders.push(this.purchaseOrder);
                let addedPurchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);
                //let addedPurchaseOrderId = '';

                console.log("PO ID BEFORE VALUES", addedPurchaseOrderId);

                let boxesToInsert = [] as any[];

                let recipesToInsert = [] as any[];

                console.log("PO CASES", this.poCases);
                console.log("RECIPES ", this.recipeArray);

                this.recipeArray.filter(r => r.recipe_id).forEach(r => {

                    let processedRecEl = this.recipeElements.find(recEl => recEl.recipe_id === r.recipe_id && recEl.type === 'output');

                    let processedCaseKey = this.products.find(prod => prod.product_id === processedRecEl.product_id);

                    let totalUnitQty = r.amount*processedCaseKey.default_units_per_case;

                    console.log("Total Recipe QTY: ", totalUnitQty);
                    let tempArray = [addedPurchaseOrderId, r.recipe_id, totalUnitQty];
                    recipesToInsert.push(tempArray);

                    /* let procCase = {} as any;

                    procCase.product_id = processedCaseKey.product_id;
                    procCase.units_per_case = processedCaseKey.default_units_per_case;
                    procCase.purchase_order_id = addedPurchaseOrderId;
                    if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                        procCase.status = this.purchaseOrder.status;

                    if(this.purchaseOrder.status === 'Delivered')
                        procCase.date_received = this.purchaseOrder.date_received;

                    for (let recIdx = 0; recIdx < r.amount; recIdx++){
                        casesToInsert.push(procCase);
                    } */

                    let rawRecElArray = this.recipeElements.filter(recEl => recEl.recipe_id === r.recipe_id && recEl.type === 'input');
                    console.log("Raw Recipe Element Array: ", rawRecElArray);

                    rawRecElArray.forEach(rawRecEl => {
                        let rawKey = this.products.find(prod => prod.product_id === rawRecEl.product_id);
                        console.log("Raw Product Key in Create: ", rawKey);

                        let rawBox = {} as any;

                        rawBox.product_id = rawKey.product_id;
                        rawBox.units_per_case = rawKey.default_units_per_case;
                        rawBox.purchase_order_id = addedPurchaseOrderId;
                        if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                            rawBox.status = this.purchaseOrder.status;

                        if(this.purchaseOrder.status === 'Delivered')
                            rawBox.date_received = this.purchaseOrder.date_received;

                        // let loopAmount = this.getRawBoxTotal(rawRecEl, procCase, r.amount);
                        let loopAmount = Math.ceil(totalUnitQty / rawBox.units_per_case);
                        console.log("Loop Amount in Linked Raw Box Create: ", loopAmount);

                        for (let recIdx = 0; recIdx < loopAmount; recIdx++){
                            boxesToInsert.push(rawBox);
                        }
                    })
                })

                console.log("RECIPES TO INSERT ",recipesToInsert)
                if(recipesToInsert.length > 0)
                    await action.bulkAddPurchaseOrderRecipe(recipesToInsert);

                //this.poBoxes = this.poBoxes.filter(b => b.product_id);

                this.poBoxes.filter(b => b.product_id).forEach((rawProduct: any) => {
                    let rawKey = this.products.find(p => p.product_id === rawProduct.product_id);

                    if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                        rawProduct.status = this.purchaseOrder.status;

                    rawProduct.units_per_case = rawKey.default_units_per_case;
                    rawProduct.purchase_order_id = addedPurchaseOrderId;

                    for(let prodIdx = 0; prodIdx < rawProduct.amount; prodIdx++){
                        console.log("RAWPRODUCT: ", rawProduct);
                        //await action.addCase(rawProduct);
                        boxesToInsert.push(rawProduct);
                    }
                });

                console.log("BOXES TO INSERT: ", boxesToInsert);

                let finalCaseArray = [] as any[];
                    boxesToInsert.forEach(c =>{
                        if(!c.location_id)
                            c.location_id = null;
                        if(!c.notes)
                            c.notes = null;
                        if(!c.date_received)
                            c.date_received = null;
                        let tempArray = [c.units_per_case, c.date_received, c.notes, c.product_id,  c.location_id, c.status, c.purchase_order_id, c.request_id];
                        finalCaseArray.push(tempArray);
                    })
                console.log("FINAL ARRAY", finalCaseArray);

                if(finalCaseArray.length > 0)
                    await action.bulkCreateCases(finalCaseArray);

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST
                console.log("ADDED PURCHASE ORDER ", addedPurchaseOrderId);
                await this.loadPage(this.currentPage);
                // await this.getBoxes();

                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Created', life: 3000});

                return addedPurchaseOrderId;
            } catch (err) {
                console.log(err);
                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },

        //Description: Sets up all the boxes and cases related to a purchase order and then opens the po dialog
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-03-2024
        confirmOrderReceived(purchaseOrder: any) {
            this.purchaseOrder = {...purchaseOrder};
            this.poCases = [];
            this.poBoxes = [];
            this.reqPoBoxes = [];
            this.editedLine = {};
            this.delivered = [];

            let boxes = this.uBoxes.filter(b => b.purchase_order_id === this.purchaseOrder.purchase_order_id && b.status !== 'Cancelled');
            let cases = this.pCases.filter(c => c.purchase_order_id === this.purchaseOrder.purchase_order_id);

            this.delivered = this.getDeliveredDataTable(boxes);

            console.log("Boxes ",boxes);
            console.log("Cases ",cases);
            this.reqPoBoxes = this.groupReqProducts(boxes);
            this.poBoxes = this.groupProducts(boxes);
            this.poCases = this.groupProducts(cases);

            console.log("reqPoBoxes ", this.reqPoBoxes);
            console.log("delivered ", this.delivered);

            this.purchaseOrderDialog = true;
        },

        /**
         * Description: Opens a dialog that allows the user to edit the chosen PO.
         * @param purchaseOrder {any} 
         * 
         * Created by: Gabe de la Torre
         * Date Created: 2-17-2025
         * Date Last Edited: 2-17-2025
         */
        async editPurchaseOrder(purchaseOrder: any) {
            try {
                // this.purchaseOrder = {...purchaseOrder};
                this.poCases = [];
                this.poBoxes = [];
                this.reqPoBoxes = [];
                this.editedLine = {};
                this.boxesToDelete = [];
                this.delivered = [];
                this.singlePoRecipes = [];
                // await this.getRecipes();

                let boxes = this.uBoxes.filter(b => b.purchase_order_id === this.purchaseOrder.purchase_order_id && b.status !== 'Cancelled');
                let poRecs = this.poRecipes.filter(r => r.purchase_order_id === this.purchaseOrder.purchase_order_id);

                poRecs.forEach(recLine => {
                    let outputElement = this.recipeElements.find(re => re.recipe_id === recLine.recipe_id);
                    let elementKey = this.products.find(p => p.product_id === outputElement.product_id);
                    recLine.product_name = elementKey.name;
                    recLine.product_id = elementKey.product_id;
                    recLine.units_per_case = elementKey.default_units_per_case;
                    recLine.amount = recLine.qty/recLine.units_per_case;
                })
                

                console.log("PO Recs: ",poRecs);

                this.delivered = this.getDeliveredDataTable(boxes);

                // console.log("Boxes ",boxes);
                // console.log("Cases ",cases);
                // this.poBoxes = this.groupProducts(boxes);
                this.poBoxes = helper.groupItemsByKey(boxes, ['product_id']);
                // this.poBoxes.forEach(box => box.total = box.amount*box.units_per_case);
                this.singlePoRecipes = poRecs;

                console.log("PO Boxes: ", this.poBoxes);
                console.log("PO Recipes: ", this.singlePoRecipes);

                console.log("reqPoBoxes ", this.reqPoBoxes);
                console.log("delivered ", this.delivered);

                this.checkPoTotals();
                this.editPurchaseOrderDialog = true;
            } catch (error) {
                console.error("Error in editPurchaseOrder: ", error);
            }
            
        },

        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Purchase Order Expanded', detail: event.data.purchase_order_name, life: 3000 });
            
            console.log("EVENT DATA ",event.data);

            this.displayStatus = "";
        },

        /**
         * Takes an inputed PO and displays both processed cases and raw boxes belonging to the PO. Builds cases
         * to display, since cases are created later in the program lifecycle. 
         * 
         * @param po The purchase order the user is viewing. Multiple fields from this PO are used to display data.
         * @returns An array of either cases or boxes belonging to the PO. Which type of container viewed is based on
         * user input
         * 
         * Created by: Gabe de la Torre
         * 
         * Date Created: 7-9-2024
         * 
         * Date Last Edited: 2-24-2025
         */
        displayInfo(po: any){
            console.log("LOOP CHECK_____________________________________________________________");
            console.log("Purchase Order to display: ",po);
            //console.log(this.cases);
            let displayArray = [] as any[];
            // let linkedCases = [] as any[]; 
            let linkedBoxes = [] as any[];
            let poRecipes = this.poRecipes.filter(rec => po.purchase_order_id === rec.purchase_order_id);
            let poRecElements = [] as any[];

            console.log("displayRecipeElements: ", this.displayRecipeElements);
            poRecipes.forEach(poRec => {
                let recElArray = this.displayRecipeElements.filter(recEl => recEl.recipe_id === poRec.recipe_id && recEl.type === 'output');
                recElArray.flatMap(recEl => recEl.amount = poRec.qty * recEl.qty);
                poRecElements.push(recElArray);
            });
            poRecElements = poRecElements.flat();
            let total = 0;

            // linkedCases = this.pCases.filter(c => c.purchase_order_id === po.purchase_order_id);
            linkedBoxes = this.uBoxes.filter(b => b.purchase_order_id === po.purchase_order_id && b.status !== 'Cancelled');

            //DISPLAYING PROCESSED CASES--------------------------------------------------------------------
            if(po.displayStatus === "Processed"){

                poRecElements.forEach(recEl => {
                    let productKey = this.products.find(product => product.product_id === recEl.product_id);
                    productKey.amount = recEl.amount/productKey.default_units_per_case;
                    productKey.units_per_case = productKey.default_units_per_case;
                    productKey.status = po.status;
                    productKey.product_name = productKey.name;
                    productKey.totalUnits = recEl.amount;
                    productKey.purchase_order_id = po.purchase_order_id;
                    displayArray.push(productKey);
                });

                // console.log("RECIPE ELEMENTS", poRecElements);
            } 
            //DISPLAYING RAW BOXES---------------------------------------------------------------------------
            else if (po.displayStatus === "Unprocessed"){
                if (linkedBoxes.length > 0)
                    // displayArray = this.groupProducts(linkedBoxes);
                    displayArray = helper.groupProductsByKey(linkedBoxes, ['status', 'notes', 'location_id']);
            }

            console.log("DISPLAY ARRAY", displayArray);
            return displayArray;
        },
        
        /** 
         * Displays the raw product info that pertains to each processed case in the PO
         * @param purchase_order_id {number} The purchase order ID
         * @param product_id {number} The ID of the output product
         * @param amount {number} The amount of output boxes made
         * @returns An array with the information of each input box required for the output boxes recipe
         *
         * Created by: Gabe de la Torre
         * 
         * Date Created: ???
         * 
         * Date Last Edited: 7-19-2024 
         */
        displayRawInfo(purchase_order_id: number, product_id: number, amount: number){
            console.log("PURCHASE ORDER:", purchase_order_id," PROCESSED PRODUCT ID:", product_id," AMOUNT:", amount);

            //Grab the linked po recipe for the inline processed product
            let linkedPoRec = this.poRecipes.find(rec => rec.purchase_order_id === purchase_order_id && this.displayRecipeElements.find(r => r.product_id === product_id && r.type === 'output' && r.recipe_id === rec.recipe_id) !== undefined);
            
            // let linkedCase = this.pCases.find(c => c.purchase_order_id === purchase_order_id && c.product_id === product_id);

            //let linkedRecEl = this.recipeElements.find(r => r.product_id === product_id && r.type === 'output');
            let rawRecInputs = this.displayRecipeElements.filter(r => r.recipe_id === linkedPoRec.recipe_id && r.type === 'input');
            //let linkedBoxes = this.uBoxes.filter(b => b.purchase_order_id === purchase_order_id);

            let linkedBoxes = [] as any[];
            for(const box of this.uBoxes) {
                if (box.purchase_order_id !== purchase_order_id)
                continue;

                const recInput = rawRecInputs.find(input => box.product_id === input.product_id);
                if (recInput)
                //linkedBoxes.push({ box: box, rec: recInput });
                linkedBoxes.push(box);
            }
            console.log("LINKED BOXES ",linkedBoxes);
            console.log("PO RECIPE ARRAY", linkedPoRec);

            let displayArray = this.groupProducts(linkedBoxes);
            console.log("DISPLAY ARRAY BEFORE FOR EACH", displayArray);

           /*  displayArray.forEach((line: any) => {
                const recInput = rawRecInputs.find(input => line.product_id === input.product_id);

                line.amount = Math.ceil((linkedCase.units_per_case*amount*recInput.qty)/line.units_per_case);
            })  */

            console.log(displayArray);

            //displayArray = displayArray.filter((raw: any) => this.recipes.find(rec => rec.product_needed === raw.product_id && rec.product_made === product_id));
            //displayArray = displayArray.filter((raw: any) => rawRecEls.filter(rawRecEl => raw.product_id === rawRecEl.product_id));
            
            //console.log("LINKED REC EL ",linkedRecEl);
            console.log("RAW REC ELS", rawRecInputs);
            console.log("LINKED BOXES ",linkedBoxes);
            console.log("DISPLAY ARRAY ",displayArray);

            return displayArray;
        },

        /**
         * Give the raw info of a particular purchase order's work-order,
         * dynamically inferred from the given output product and its amount.
         * 
         * @param purchase_order_id {number} The purchase order ID
         * @param product_id {number} The output product ID
         * @param amount {number} The amount of the output products
         * @returns The box info, with amount being the amount used, and leftover being the amount left over
         * 
         * Created by: Micheal Chapell
         * Date Created: 7-18-2024 
         * Date Last Edited: 3-12-2025
         */
        displayRawInfoMicheal(purchase_order_id: number, product_id: number, amount: number) {
        console.log("LOOP CHECK: ___________________________________________________");
        console.log("PURCHASE ORDER:", purchase_order_id," PROCESSED PRODUCT ID:", product_id," AMOUNT:", amount);

        // the recipe that is being used, determined by output product
        /**
         * @TODO What if there are multiple recipes that have this product as an output?
         * Or is this enforced as unique? This is why I recommended you to store the recipes
         * being used in the purchase order.
         */
        let recipeOutput = this.displayRecipeElements.find(r => r.product_id === product_id && r.type === 'output');
        console.log("recipeOutput", recipeOutput);
        let outputKey = this.products.find(p => p.product_id === recipeOutput.product_id);
        console.log("outputKey", outputKey);

        // console.log(this.poRecipes)
        let poRecipe = this.poRecipes.find(recipe => recipe.purchase_order_id === purchase_order_id && recipe.recipe_id === recipeOutput.recipe_id);
        console.log("poRecipe",poRecipe);

        // the input products given the recipe id
        /*2-27-2026 NOTE: I changed poRecipe.recipeObj.recipe_id to poRecipe.recipe_id because logging poRecipe in this function shows that there is no nest object. This was also a problem on line 1600. 
        * There appears to have been a change in the structure of poRecipe at some point. Will look closer when I have the time. Right now, I am on a tight schedule.
        */
        let rawRecInputs = this.displayRecipeElements.filter(r => r.recipe_id === poRecipe.recipe_id && r.type === 'input');

        let totals = [] as any[];

        rawRecInputs.forEach(r => {
            let map = {} as any;
            map.product_id = r.product_id;
            map.currentUnits = 0;

            r.totalUnits = poRecipe.qty; 
            // r.totalUnits = poRecipe.qty*outputKey.default_units_per_case; 

            totals.push(map);
        });
        console.log("rawRecInputs", rawRecInputs);
        console.log("totals: ", totals);


        // get the input boxes that are being used as inputs. Use a filter-map for-loop
        const inputBoxesAndRecEl = [] as any[];

        // console.log(this.uBoxes);

        let boxArray = this.uBoxes.filter(box => box.purchase_order_id === purchase_order_id);
        console.log("boxArray", boxArray);

        let filteredBoxArray = this.groupProducts(boxArray);
        console.log("filteredBoxArray", filteredBoxArray);

        let boxIdx = 0;

        for(const b of boxArray) {
            let inputEl = rawRecInputs.find(r => r.product_id  === b.product_id);
            if(inputEl){
                let total = totals.find(t => t.product_id === inputEl.product_id)
                console.log("Current Total: ", total.currentUnits);

                /*
                 3-12-2025: Removed the "(inputEl.totalUnits - b.units_per_case) >= total.currentUnits" portion
                 of the if statement. Some packs (i.e. Grinch/Max 2pk) require uneven amounts of units, and so some 
                 units will be left over.
                */
                if(inputEl.totalUnits > total.currentUnits){
                    b.taken = true;
                    inputBoxesAndRecEl.push({ box: b, rec: inputEl });
                    total.currentUnits += b.units_per_case;
                    console.log("TOTAL UNITS", inputEl.totalUnits);
                } else if (inputEl.totalUnits === total.currentUnits){
                    continue;
                }
            }
        }

        console.log(this.groupProducts(inputBoxesAndRecEl));

        console.log("inputBoxesAndRecEl", inputBoxesAndRecEl);

        let returnArray = inputBoxesAndRecEl.map(({ box, rec }) => ({
            ...box,
        }));

        console.log("returnArray", returnArray);

        return this.groupProducts(returnArray);
        },

        getPurchaseOrderDiscount(purchase_order_id: number){
            let discount = 0;
            let po = this.purchaseOrders.find(po => po.purchase_order_id === purchase_order_id);
                if(po.discount)
                    discount = po.discount/100;
            return discount;
        },

        //Description: Gets the unit cost for a specific product
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 5-28-2024
        getUnitCost(product_id: number){
            //RUNS TWICE FOR SOME REASON, ASK MICHAEL AT SOME POINT
            console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            //console.log(prod.price_2023);
            //NEED TO MAKE ANOTHER TABLE FOR PRICES
            return prod.price_2023;
        },
        //Description: Gets the fnksu for a specific product
        //Created by: Gabe de la Torre
        //Date Created: 5-28-2024
        //Date Last Edited: 5-28-2024
        getFNSKU(product_id: number){
            //console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            //console.log(prod.fnsku);
            return prod.fnsku;
        },

        //Description: Gets the upc for a specific product
        //Created by: Gabe de la Torre
        //Date Created: 5-28-2024
        //Date Last Edited: 5-28-2024
        getUPC(product_id: number){
            //console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            //console.log(prod.upc);
            return prod.upc;
        },
        /**
         * Grabs the item number for a specific product
         * 
         * @param product_id {number} The output product ID
         * @returns The product item number
         * 
         * Created by: Gabe de la Torre-Garcia
         * Date Created: 2-14-2025 
         * Date Last Edited: 2-14-2025  
         */
        getItemNum(product_id: number){
            //console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            return prod.item_num;
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

        //Description: Changes the color of the PO status based on what the status is
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-04-2024
        getPOSeverity(po: any) {
            //console.log("STATUS", po.status);
            switch (po.status) {
                case 'Draft':
                    return 'danger';
                
                case 'Submitted':
                    return 'warning';

                case 'Ordered':
                    return 'info';

                case 'Inbound':
                    return 'warning';

                case 'Partially Delivered':
                    return 'warning';

                case 'Delivered':
                    return 'success';

                case 'Canceled':
                    return 'danger';
              

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'info';
            }
        },

        //Description: Changes the icon of the PO status based on what the status is
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-04-2024
        getPOIcon(c: any){
            switch (c.status) {
                case 'Draft':
                    return 'pi pi-pencil';
                
                case 'Submitted':
                    return 'pi pi-envelope';

                case 'Ordered':
                    return 'pi pi-box';

                case 'Inbound':
                    return 'pi pi-truck';

                case 'Partially Delivered':
                    return 'pi pi-hourglass';

                case 'Delivered':
                    return 'pi pi-check';

                case 'Canceled':
                    return 'pi pi-times';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'pi pi-question-circle';
            }
        },

        getBoxSeverity(box: any) {
            //console.log("STATUS", po.status);
            switch (box.status) {
                case 'BO':
                    return 'warning';

                case 'On RTP':
                    return 'success';

                case 'Cancelled':
                    return 'danger';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'info';
            }
        },

        onTotalUpdate(total: any, units_per_case: any){
            return Number((total/units_per_case).toFixed(2));
        },
        onQtyUpdate(qty: any, units_per_case: any){
            let total = qty*units_per_case;
            return total;
        },
        //Description: When the PO status is changed, the date ordered and date received fields are
        //updated accordingly
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-29-2024
        //Date Last Edited: 5-29-2024
        onStatusChange(){
            //If the PO is new
            if(!this.purchaseOrder.purchase_order_id){
                if(this.purchaseOrder.status === "Ordered" || this.purchaseOrder.status === "Inbound")
                    this.purchaseOrder.date_ordered = this.today;
                else if(this.purchaseOrder.status === "Delivered"){
                    this.purchaseOrder.date_ordered = this.today;
                    this.purchaseOrder.date_received = this.today;
                }
            } 
            //If the PO already exists and is being edited
            else {
                if(this.purchaseOrder.status === "Ordered" && !this.purchaseOrder.date_ordered)
                    this.purchaseOrder.date_ordered = this.today;
                else if(this.purchaseOrder.status === "Delivered")
                    this.purchaseOrder.date_received = this.today;
            }
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
                //this.purchaseOrder.date_ordered = null;

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);

                for(let caseIdx = 0; caseIdx < this.cases.length; caseIdx++){
                    if (this.cases[caseIdx].purchase_order_id == this.purchaseOrder.purchase_order_id){
                        this.cases[caseIdx].status = "Canceled"

                        action.editCase(this.cases[caseIdx]);
                    }
                }
                
                await this.loadPage(this.currentPage);
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Order Canceled', life: 3000});

                this.purchaseOrder = {};
                return editedPurchaseOrder;
            } catch (err) {
                console.log(err);

                this.$toast.add({severity:'error', summary: 'Error', detail: err, life: 3000});
            }
        },

        //Description: Calculates the total cost of a PO
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-29-2024
        //Date Last Edited: 7-08-2024
        calculatePoCostTotalOLD(){
            let total=0;

            //If the PO is being edited
            if(this.purchaseOrder.purchase_order_id){
                //console.log(this.uBoxes);
                this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id).forEach(b => {
                    total += this.getUnitCost(b.product_id) * (b.units_per_case)
                });
            } // If the PO is being created
            else {
                this.recipeArray.filter(poRec => poRec.recipe_id).forEach(poRec => {
                    //console.log(poRec);

                    let recipeKey = this.recipes.find(r => poRec.recipe_id === r.recipe_id);
                    //console.log(recipeKey);

                    let recipeElements = this.recipeElements.filter(recEl => recEl.recipe_id === recipeKey.recipe_id);
                    //console.log(recipeElements);

                    let processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    let processedRecElKey = this.products.find((p: any) => p.product_id === processedRecEl.product_id);
                    let rawRecElArray = recipeElements.filter(recEl => recEl.type === 'input');
                    //console.log("Processed Rec El ", processedRecEl, " and Raw Rec El Array ", rawRecElArray);

                    rawRecElArray.forEach(recEl => {
                            total += this.getTotalCost(recEl, processedRecElKey, poRec.amount);
                        });

                });
                this.poBoxes.forEach(b => {
                    if(b.product_id){
                        let totalUnitCost = 0;
                        if(this.selectedOrderType === 'By Box'){
                            totalUnitCost = this.getUnitCost(b.product_id)*(b.units_per_case * b.amount)
                        }
                        else if(this.selectedOrderType === 'By Unit'){
                            totalUnitCost = this.getUnitCost(b.product_id)*(Math.ceil(b.unitAmount/b.units_per_case)*b.units_per_case)
                        }
                        total += totalUnitCost;
                    }
                });
            }

            //console.log(total);
            if (this.purchaseOrder.discount){
                const discountDecimal = 1 - (this.purchaseOrder.discount/100);
                total = total * discountDecimal;
            }

            return total;
        },

        //Description: Calculates the total units ordered in a PO
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-29-2024
        //Date Last Edited: 3-25-2026
        calculatePoUnitTotal(){
            let total=0;

            // console.log("PO Boxes",this.poBoxes)
            //console.log("PO Cases",this.poCases);

            //If the PO is being edited
            if(this.purchaseOrder.purchase_order_id){
                //console.log(this.uBoxes);
                this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && box.status !== 'Cancelled').forEach(b => {
                    total += (b.units_per_case)
                });
            } //If the PO is being created
            else {
                // Edited out 3/25/2026
                /* this.recipeArray.filter(poRec => poRec.recipe_id).forEach(poRec => {
                    //console.log(poRec);

                    let recipeKey = this.recipes.find(r => poRec.recipe_id === r.recipe_id);
                    //console.log(recipeKey);

                    let recipeElements = this.recipeElements.filter(recEl => recEl.recipe_id === recipeKey.recipe_id);
                    //console.log(recipeElements);

                    let processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    let processedRecElKey = this.products.find((p: any) => p.product_id === processedRecEl.product_id);
                    let rawRecElArray = recipeElements.filter(recEl => recEl.type === 'input');
                    //console.log("Processed Rec El ", processedRecEl, " and Raw Rec El Array ", rawRecElArray);

                    rawRecElArray.forEach(recEl => {
                            total += this.getTotalUnitsOrdered(recEl, processedRecElKey, poRec.amount);
                        });

                }); */
                this.poBoxes.filter(b => b && b.status !== 'Cancelled').forEach(b => {
                    if(b.product_id){
                        let totalUnits = 0;
                        if(this.selectedOrderType === 'By Box'){
                            totalUnits = (b.units_per_case * b.amount)
                        }
                        else if(this.selectedOrderType === 'By Unit'){
                            totalUnits = (Math.ceil(b.unitAmount/b.units_per_case)*b.units_per_case)
                        }
                        total += totalUnits;
                    }
                });
            };

            
            // console.log(total);
            return total;
        },

        getPOProgressPercent(status: string): number {
            const progressMap: Record<string, number> = {
                'Draft': 10,
                'Submitted': 25,
                'Ordered': 50,
                'Inbound': 70,
                'Partially Delivered': 85,
                'Delivered': 100,
                'Canceled': 100,
            };

            return progressMap[status] ?? 0;
        },

        disablePoPhase(poStatus: string){

        },

        /**
         * When a user wants to update their status, a dialog is opened.
         * 
         * @param purchaseOrder The PO that will have its status updated
         * 
         * Created by: Gabe de la Torre
         * 
         * Date Created: 6-06-2024
         * 
         * Date Last Edited: 6-06-2024
         */
        openStatusChangeDialog(purchaseOrder: any) {
            this.purchaseOrder = purchaseOrder;
            this.statusChangeDialog = true;
        },

        //Description: When the user clicks confirm on a status change, the PO status is changed to the appropriate phase
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-06-2024
        //Date Last Edited: 6-06-2024
        confirmStatusChangeDialog(newStatus: string){

            this.statusChangeDialog = false;

            this.purchaseOrder = {};
        },

        /**
         * Description: Updates the current purchase order's status to the user selected status and then posts those 
         * edits to the database
         * 
         * Created by: Gabe de la Torre
         * 
         * Date Created: 7-23-2024 
         * 
         * Date Last Edited: 7-23-2024 
         */
        async confirmStatusChange(){
            try {
                this.purchaseOrder.status = this.newStatus; 
                if (this.purchaseOrder.status === 'Ordered')
                this.purchaseOrder.date_ordered = this.today;

                console.log("PO in status change: ", this.purchaseOrder);

                await action.editPurchaseOrder(this.purchaseOrder);
                await this.getRecipes();

                if(this.purchaseOrder.status !== 'Draft' || this.purchaseOrder.status !== 'Submitted'){
                    console.log("Check for Requests");
                    await this.checkForRequests();
                }   
                this.statusChangeDialog = false;
            } catch (error) {
                console.log(error);
            }
        },

        /**
         * Checks the current PO to see if all of the recipes have requests already. If not, add them.
         * 
         * Created By: Gabe de la Torre-Garcia
         * 
         * Date Created: 3-10-2025
         * 
         * Date Last Edited: 3-10-2025
         */
        async checkForRequests(){
            // Check to see if there are any requests for the PO recipes, if not, create them
            let requests = await action.getRequests('');

            console.log("IN REQUEST CHECK");

            console.log(this.purchaseOrder);
            console.log(this.poRecipes);

            let neededPoRecipes = this.poRecipes.filter(recipe => recipe.purchase_order_id === this.purchaseOrder.purchase_order_id)
            console.log("Needed Po Recipes: ", neededPoRecipes);

            neededPoRecipes.forEach(async (recipe) =>  {

                let neededRecElement = this.recipeElements.find(recElement => recElement.recipe_id === recipe.recipe_id && recElement.type === 'output');
                console.log("Needed Recipe Element: ", neededRecElement);

                let productKey = this.products.find(product => product.product_id === neededRecElement.product_id);
                console.log("Product Key: ", productKey);

                let recRequest = requests.find(request => request.product_id === neededRecElement.product_id && request.purchase_order_id === this.purchaseOrder.purchase_order_id);
                console.log("Recipe Request: ", recRequest);
                if(!recRequest){
                    // No request made for this recipe yet, make one
                    const createdRequest: {
                        product_id: number; 
                        purchase_order_id: number;
                        notes: string | null, 
                        status: string,
                        labels_printed: boolean; 
                        ship_label: boolean; 
                        priority: string; 
                        ship_to_amz: number; 
                        deadline: Date | null; 
                        warehouse_qty: number;
                        container_qty: number;
                    } = {
                        product_id: Number(neededRecElement.product_id),
                        purchase_order_id: Number(this.purchaseOrder.purchase_order_id),
                        notes: null, 
                        status: '5 ON ORDER', 
                        labels_printed: false, 
                        ship_label: false, 
                        priority: '6 Prep For Later', 
                        ship_to_amz: 0, 
                        deadline: null, 
                        warehouse_qty: 0,
                        container_qty: Number(recipe.qty)
                    };

                    console.log("Created Request: ", createdRequest);

                    await action.addRequest(createdRequest);
                }
            });
        },

        initFilters() {
            this.filters = {
                'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
            }
        },

        /** 
         * Description: Displays the raw product info that pertains to each processed case in the PO
         * @param boxType {string} A string with the value of "Received", "Awaited", "New Arrived", or "All"
         * @returns An array based on the inputted boxType string
         * Received: All the recieved boxes
         * Awaited: All boxes yet to be delivered
         * Newly Arrived: All boxes that were just received
         * All: All boxes belonging to the PO
         *
         * Created by: Gabe de la Torre on 7-25-2024
         * 
         * Date Last Edited: 4-28-2025 
         */
        checkBoxes(boxType: string){
            let boxArray = [] as any[];

            console.log("PO BOXES", this.poBoxes);
            //console.log("PO BOXES BY PRODUCT", this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id)));

            let allBoxes = this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id));

            //POSSIBLY CHECK FOR NOT EQUALS AS WELL
            let receivedBoxes = this.poBoxes.filter(boxLine => (boxLine.status !== 'Draft' && boxLine.status !== 'Submitted' && boxLine.status !== 'Ordered' && boxLine.status !== 'Inbound' && boxLine.status !== 'BO') || boxLine.status === 'On RTP');
            // console.log("RECEIVED BOXES", receivedBoxes);

            //CHANGE TO INCOMING
            let awaitedBoxes = this.poBoxes.filter(boxLine => boxLine.status === 'Draft' || boxLine.status === 'Submitted' || boxLine.status === 'Ordered' || boxLine.status === 'Inbound' || boxLine.status === 'BO')
            // console.log("AWAITED BOXES", awaitedBoxes);

            let newlyArrivedBoxes = this.poBoxes.filter(boxLine => boxLine.moment === 'Newly Arrived');
            

            if(boxType === 'Received'){
                boxArray = receivedBoxes;
            } else if (boxType === 'Awaited'){
                boxArray = awaitedBoxes;
            } else if (boxType === 'All'){
                boxArray = allBoxes;
            } else if (boxType === 'Newly Arrived'){
                boxArray = newlyArrivedBoxes;
            }

            //console.log("Box Array ",boxArray);
            return boxArray;
        },

        /** 
         * Description: Displays the raw product info that pertains to a specific processed case in the PO
         * @param boxType {string} A string with the value of either "Received", "Awaited", "All"
         * @param product_id {number} The ID of the output product
         * @returns An array based on the inputted boxType string
         * Received: All the recieved boxes related to the inputed processed product
         * Awaited: All boxes yet to be delivered related to the inputed processed product
         * All: All boxes belonging to the PO related to the inputed processed product
         *
         * Created by: Gabe de la Torre
         * Date Created: 7-29-2024
         * Date Last Edited: 7-31-2024 
         */
        checkSpecificBoxes(boxType: string, product_id: number){
            let boxArray = [] as any[];

            //console.log("PO BOXES", this.poBoxes);
            let allBoxes = this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id));

            //POSSIBLY CHECK FOR NOT EQUALS AS WELL
            let receivedBoxes = this.poBoxes.filter(boxLine => (boxLine.status !== 'Draft' && boxLine.status !== 'Submitted' && boxLine.status !== 'Ordered' && boxLine.status !== 'Inbound' && boxLine.status !== 'BO') || boxLine.status === 'On RTP');
            //console.log("RECEIVED BOXES", receivedBoxes);

            let awaitedBoxes = this.poBoxes.filter(boxLine => boxLine.status === 'Draft' || boxLine.status === 'Submitted' || boxLine.status === 'Ordered' || boxLine.status === 'Inbound' || boxLine.status === 'BO')
            //console.log(boxArray.push(allBoxes), boxArray.push(receivedBoxes), boxArray);
            awaitedBoxes.forEach(box => {
                if(!box.total)
                    box.total = box.amount*box.units_per_case;
            });

            if(boxType === 'Received'){
                boxArray = receivedBoxes;
            } else if (boxType === 'Awaited'){
                boxArray = awaitedBoxes;
            } else if (boxType === 'All'){
                boxArray = allBoxes;
            }

            //console.log("ARRAY BEFORE FILTER", boxArray);
            boxArray = boxArray.flat().filter(box => box.product_id === product_id);
            //console.log("ARRAY AFTER FILTER", boxArray);

            return boxArray;
        },
        
        rowClass(data: any) {
            // console.log(data);
            return [{ '!font-bold !text-primary-contrast': data.status === 'BO' }];
        },

        dataTableStyle(){
            return { backgroundColor: 'Black' };
        },

        rowStyle(data: any) {
            if (data.status === 'BO') {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Gold' };
            } else if  (data.status === 'On RTP') {
                return { font: 'bold', backgroundColor: '#bbffb5' };
            } else {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: '#C0EEFF' };
            }
        },

        rowStyleMissingDefault(data: any) {
            // Highlight raw recipe rows when the missing-default-unit dialog is open
            if (!this.missingDefaultUnitsDialog) {
                return {};
            }

            const defaultUnits = this.getProductInfo(data.product_id, 'default_units_per_case');
            if (!defaultUnits || defaultUnits <= 0) {
                return { font: 'bold', backgroundColor: '#ffb439' };
            }

            return {};
        },

        editRowStyleRaw(data: any) {
            // console.log(data);
            if (data.case_id) {
                if (data.status == 'Cancelled'){
                    return { font: 'bold', backgroundColor: '#f19595' };
                } else {
                    return { font: 'bold', backgroundColor: '#C0EEFF' };
                }
            }  else {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Gold' };
            }
        },

        editRowStyleProc(data: any) {
            if (data.product_id) {
                if(data.warning === true){
                    return { font: 'bold', backgroundColor: '#ffb439' };
                } else {
                    return { font: 'bold', backgroundColor: '#bbffb5' };
                }
            } else {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Gold' };
            }
        },

        rowStyleRequested() {
            return { font: 'bold', backgroundColor: '#C0EEFF' };
        },
        rowStyleReceived() {
            return { font: 'bold', backgroundColor: '#bbffb5' };
        },
        rowStyleAwaiting() {
            return { font: 'bold', backgroundColor: '#FFD580'};
        },
        rowStyleUnprocessed() {
            return { font: 'bold', backgroundColor: '#C0EEFF' };
        },
        rowStylePool() {
            return { font: 'bold', backgroundColor: '#C0EEFF' };
        },

        rowStyleCompared(data: any){
            if (data.moment === 'Requested') {
                return { font: 'bold', backgroundColor: '#C0EEFF' };
            } else if (data.moment === 'Received') {
                return { font: 'bold', backgroundColor: '#bbffb5' };
            } else if (data.moment === 'Awaiting') {
                return { font: 'bold', backgroundColor: '#FFD580' };
            } else if (data.moment === 'Newly Arrived') {
                return { font: 'bold', backgroundColor: '#a3e4d7' };
            }else if (data.moment === 'Back Ordered') {
                return { font: 'bold', backgroundColor: '#f1948a' };
            }
        },

        /**
         * 
         * 
         * @param 
         * 
         * Created by: Gabe de la Torre-Garcia
         * Date Created: 8-01-2024 
         * Date Last Edited: 8-01-2024 
         */
        onCellEditComplete(event: any) {
            console.log(event);
            let {data, newValue, field} = event;
            data[field] = newValue;
        },

        /**
         * 
         * 
         * @param 
         * 
         * Created by: Gabe de la Torre-Garcia
         * Date Created: 8-02-2024 
         * Date Last Edited: 8-02-2024 
         */
        onRowEditSave(event: any) {
            console.log("EVENT ",event);
            
            let { data, newData } = event;

            console.log(this.poBoxes);

            this.poBoxes.forEach(box => {
                if(box.case_id === data.case_id){
                    //console.log("OLD DATA ",box);
                    //console.log("EVENT DATA", newData);
                    //console.log("OLD DATA TOTAL",box.total);
                    //console.log("EVENT DATA TOTAL", newData.total);
                    box.amount = newData.amount;
                    box.total = newData.total;
                    box.location_id = newData.location_id;
                    //console.log("NEW DATA ",box);
                    //console.log("NEW DATA TOTAL ",box.total);
                }
            })

            this.delivered.forEach(box => {
                if(box.case_id === data.case_id && box.moment === 'Awaiting'){
                    //console.log("OLD DATA ",box);
                    //console.log("EVENT DATA", newData);
                    //console.log("OLD DATA TOTAL",box.total);
                    //console.log("EVENT DATA TOTAL", newData.total);
                    box.amount = newData.amount;
                    box.total = newData.total;
                    box.location_id = newData.location_id;
                    //console.log("NEW DATA ",box);
                    //console.log("NEW DATA TOTAL ",box.total);
                }
            })
            //console.log(this.poBoxes.forEach(box => console.log(box.total)));
        },

        onPOBoxRowEditInit(event: any){
            console.log("INIT EVENT ", event);

        },

        isRawRowEditing(raw_product: any){
            if (!raw_product) return false;

            if (Array.isArray(this.rawEditingRows)) {
                return this.rawEditingRows.some((row: any) =>
                    row === raw_product || row?.product_id === raw_product?.product_id
                );
            }

            if (this.rawEditingRows && typeof this.rawEditingRows === 'object') {
                const productId = raw_product?.product_id;
                if (productId === null || productId === undefined) return false;
                return Boolean((this.rawEditingRows as Record<string, any>)[productId]);
            }

            return false;
        },

        removeUnsavedRawRow(raw_product: any){
            if (!raw_product || raw_product.product_id) return;

            const index = this.poBoxes.findIndex((row: any) => row === raw_product);
            if (index < 0) return;

            this.poBoxes.splice(index, 1);
        },

        /**
         * When the user saves a row while editing a purchase order, this function places the updated data into the 
         * poBox array. Then, checks to make sure that the updated unit amount is enough for the planned cases.
         * @param event {event} The data grabbed in the event of a user saving a row while editing a purchase order
         * 
         * Create By: Gabe de la Torre-Garcia
         * 
         * Date Created: 2-19-2025
         * 
         * Date Last Edited: 3-5-2025
         */
        async onPOBoxRowEditSave(event: any){
            /* 
            For a day when I can learn typescript
            event: SubmitEvent
            const { newData, index } = event.target as HTMLFormElement;

            */

            console.log(event);
            const { newData, index } = event;
            console.log("Old data: ", this.poBoxes[index]);
            console.log("New data: ", newData);

            // Grab the new values: total units, the units per raw box, and the amount of raw boxes.
            let total = newData.total;
            let units_per_case = newData.units_per_case;
            let amount = newData.amount;
            let cancelledTotal = 0;
            let maxTotal = 0;

            type boxRow = {
                    [key: string]: string | number | null;
                };

            // For the event that the vendor ships more units than were expected. NOTE: Extra units sent do not affect
            // the PO price
            let createdBoxes: Array<boxRow> = [];   

            console.log(total, '/', units_per_case, '=', amount);

            // Grab the raw boxes that belong to this PO, and are the product type for the edited row.
            let editedBoxes: Array<boxRow> = this.uBoxes.filter(box => 
                box.purchase_order_id === this.purchaseOrder.purchase_order_id &&
                box.product_id === this.poBoxes[index].product_id &&
                box.status !== 'On RTP'
            );

            // If the boxes exist (the product was already in the PO and just being edited)
            if(editedBoxes.length > 0){
                console.log("Boxes to edit: ", editedBoxes);

                const productKey = this.products.find(product => product.product_id === this.poBoxes[index].product_id)
                console.log('product key', productKey);

                // Grab the partial box, if it exists
                const partialIdx = editedBoxes.findIndex(box => Number.isInteger(Number(box.units_per_case)/productKey.default_units_per_case) === false);
                
                // If it does, set the units in the box to the default amount.
                // This is because the function will set the new partial amount, if needed.
                if (partialIdx !== -1){
                    editedBoxes[partialIdx].units_per_case = productKey.default_units_per_case;
                }
                    

                editedBoxes.forEach(box => maxTotal += Number(box.units_per_case));

                // If the new amount is not a whole number AND the new total is less than the old,
                // Calculate the number of units cancelled, and set the new partial box amount.
                if(Number.isInteger(amount) === false && maxTotal > newData.total){ //&& this.poBoxes[index].total > newData.total (might need to add back)
                    console.log("Create partial Box");
                    cancelledTotal = Math.ceil((Math.ceil(amount) - amount)*this.poBoxes[index].units_per_case);
                    // console.log("Amount: ", amount, " - floor(amount): ", Math.floor(amount));
                    let decimalAmount = amount - Math.floor(amount);
                    let partialBoxUnits = Math.round(decimalAmount * this.poBoxes[index].units_per_case);
                    // console.log(decimalAmount * this.poBoxes[index].units_per_case);
                    // console.log("Partial box amount", partialBoxUnits);
                    editedBoxes[0].units_per_case = partialBoxUnits;
                } 

                let currentTotal = 0;

                // Loop through each edited box, totalling the amount of units in each box until currentTotal and total
                // match. Then, cancel the rest of the boxes.
                editedBoxes.forEach(box => {
                    if(currentTotal < total && total >= (currentTotal + Number(box.units_per_case))){
                        currentTotal += Number(box.units_per_case);
                        box.status = this.poBoxes[index].status;
                    } else {
                        cancelledTotal += Number(box.units_per_case);
                        box.status = 'Cancelled';
                    }
                });
                 
                // If the forEach ends and current total is still less than total, add new boxes to be created 
                if(currentTotal < total){
                    while (currentTotal < total){
                        currentTotal += newData.units_per_case;
                        console.log("+1 Box needed");
                        /* createdBoxes.push({
                            product_id: newData.product_id,
                            purchase_order_id: this.purchaseOrder.purchase_order_id,
                            units_per_case: newData.units_per_case,
                            status: this.purchaseOrder.status
                        }); */
                    }
                }

                // console.log("Boxes after edit but before update: ", editedBoxes);
            // Else if the boxes do not exist (the product is being newly added to the PO)
            } else {         
                // Add new boxes to be created
                for(let boxIdx = 0; boxIdx < newData.amount; boxIdx++){
                    createdBoxes.push({
                        product_id: newData.product_id,
                        purchase_order_id: this.purchaseOrder.purchase_order_id,
                        units_per_case: newData.units_per_case,
                        status: 'Draft'
                    });
                }

                // Check to see if the amount is a decimal, if it is
                let decimalCheck = newData.amount - Math.floor(newData.amount);
                if(decimalCheck !== 0){
                    // Set the first box in the createdBoxes array to a partial amound
                    let partialUnits = Math.round(newData.units_per_case * decimalCheck);
                    createdBoxes[0].units_per_case = partialUnits;
                }

                // console.log("Boxes to create: ", createdBoxes);
            }

            console.log("Boxes after edit but before update: ", editedBoxes);
            console.log("Boxes after create but before update:: ", createdBoxes);

            // Map out the boxes in the array order necessary for DB insertion
            if(editedBoxes.length > 0){
                // editBoxes(editedBoxes)
                let boxMap = [] as any[];
                let boxesToUpdate = [] as any[];
                editedBoxes.forEach(box => {
                    boxMap = [
                        box.units_per_case,
                        box.date_received,
                        box.notes,
                        box.product_id,
                        box.location_id,
                        box.status,
                        box.purchase_order_id,
                        box.request_id,
                        box.case_id
                    ];

                    boxesToUpdate.push(boxMap);
                });
                
                // Update the boxes
                await action.bulkEditCases(boxesToUpdate);
                this.$toast.add({severity:'success', summary: 'BOXES EDITED', detail: editedBoxes.length+' boxes edited', life: 10000});
                /* if(cancelledTotal > 0){
                    this.$toast.add({severity:'error', summary: 'UNITS CANCELLED', detail: cancelledTotal+' units cancelled', life: 10000});
                } */

            }        

            if(createdBoxes.length > 0){
                // addBoxes(createdBoxes)
                let finalBoxArray = [] as any[];
                createdBoxes.forEach(b =>{
                        if(!b.location_id)
                            b.location_id = null;
                        if(!b.notes)
                            b.notes = null;
                        if(!b.date_received)
                            b.date_received = null;
                        let tempArray = [
                            b.units_per_case, 
                            b.date_received, 
                            b.notes, 
                            b.product_id,  
                            b.location_id, 
                            b.status, 
                            b.purchase_order_id, 
                            b.request_id
                        ]
                        finalBoxArray.push(tempArray);
                    })
                await action.bulkCreateCases(finalBoxArray);
                await this.loadPage(this.currentPage);
                // await this.getBoxes();
                this.$toast.add({severity:'success', summary: 'BOXES CREATED', detail: createdBoxes.length+' boxes added to order', life: 10000});
            }

            // this.checkPoTotals(newData.product_id, newData.total)

            this.poBoxes[index] = newData;
            this.poBoxes[index].product_name = this.getProductInfo(this.poBoxes[index].product_id, 'name');

            this.syncCurrentPurchaseOrderBoxViews();
            this.checkPoTotals();
        },

        /**
         * Keeps all box-backed collections in sync after any edit/cancel/create operation.
         * This prevents stale DataTable views that would otherwise only refresh on full page reload.
         */
        syncCurrentPurchaseOrderBoxViews(){
            const currentPoId = this.purchaseOrder?.purchase_order_id;
            if (!currentPoId) return;

            // Reassign for Vue reactivity, then rebuild all current-PO views from the same source.
            this.uBoxes = [...(this.uBoxes || [])];
            const poAllBoxes = this.uBoxes.filter((box: any) => box.purchase_order_id === currentPoId);
            this.purchaseOrder.individual_boxes = poAllBoxes;

            const activePoBoxes = poAllBoxes.filter((box: any) => box.status !== 'Cancelled');
            this.poBoxes = helper.groupItemsByKey(activePoBoxes, ['product_id']);

            // Keep the paginated table row in sync too, when present.
            const poRowIdx = (this.purchaseOrders || []).findIndex((po: any) => po.purchase_order_id === currentPoId);
            if (poRowIdx > -1) {
                const nextPo = { ...this.purchaseOrders[poRowIdx] };
                nextPo.individual_boxes = [...poAllBoxes];
                nextPo.grouped_boxes = [...this.poBoxes];
                this.purchaseOrders.splice(poRowIdx, 1, nextPo);
            }
        },

        /**
         * Compares raw product totals with the planned recipe totals in a PO. 
         * If the raw total is less, a warning is thrown.
         * @param rawProductId The product ID of the raw product that has a new total
         * @param rawTotal The new total to be compared to the recipe total
         * 
         * Created By: Gabe de la Torre-Garcia on: 3-12-25
         * 
         * Lasted Edited: 4-7-25
         */
         checkPoTotals(){
            /* 
            * Create an array of objects that tracks a raw box type, the recipes it is used in, 
            * the raw total units, and the needed total units
            */
            let poTotals: {raw_id: number, recipe_id: number[], raw_total: number, needed_total: number}[] = Object.values(this.poBoxes.reduce((map, box) => {
                const key = box.product_id;

                // console.log("Box in reduce: ", box);

                //If the product already exists in the map, increase the raw total
                if(map[key]){
                    // Make sure the box is not a cancelled box
                    if(box.status !== 'Cancelled'){
                        map[key].raw_total += box.total;
                    }
                } else { // Else, add the box type to the map
                    map[key] = {raw_id: box.product_id, recipe_id: null, raw_total: box.total, needed_total: 0}
                }
                return map;
            }, { } as { raw_id: number, recipe_id: number[], raw_total: number, needed_total: number }));

            // console.log("PO Totals before check: ", poTotals);

            // Loop through the recipes used in this PO
            this.singlePoRecipes.forEach(poRecipe => {
                console.log("PO Recipe in forEach: ", poRecipe);
                

                // Grab each recipe element that is used in this PO
                let usedRecElements = this.recipeElements.filter(recElement => recElement.recipe_id === poRecipe.po_recipe_id && recElement.type === 'input');

                // Go through each recipe element
                usedRecElements.forEach(recElement => {
                    // Find the array index in the total array for the product type that matched the input recipe element
                    const totalIdx = poTotals.findIndex(total => total.raw_id === recElement.product_id);

                    // If the index exist
                    if(totalIdx > -1){
                        /**
                         * That means that the outer loop recipe uses this raw product, add the total recipe qty
                         * to the needed total.
                         */
                        poTotals[totalIdx].needed_total += poRecipe.qty; 
                        if(poTotals[totalIdx].recipe_id) // Add the used recipe to the recipe array in the total array
                            poTotals[totalIdx].recipe_id = [...poTotals[totalIdx].recipe_id, poRecipe.recipeObj.recipe_id];
                        else
                            poTotals[totalIdx].recipe_id = [poRecipe.recipeObj.recipe_id];
                    }                       
                });
            });
            console.log("PO Totals after check: ", poTotals);

            let recipeIdxArray: number[] = [];

            // Loop through the total array 
            poTotals.forEach(totalLine => {
                // If there are less raw units than needed units, throw up a warning
                if(totalLine.raw_total < totalLine.needed_total){
                    this.totalErrorMSG = 'The highlighted planned cases must be edited if the raw total remains'

                    // Grab the recipe indexes that now need highlighting
                    totalLine.recipe_id.forEach(recipe_id_line => {
                        // console.log("Recipe Id Line: ",recipe_id_line);
                        const singlePoRecipeIdx = this.singlePoRecipes.findIndex(r => r.recipe_id === recipe_id_line);
                        // console.log("Po Recipe Idx: ",singlePoRecipeIdx);
                        recipeIdxArray.push(singlePoRecipeIdx);
                    })
                    this.$toast.add({ severity: 'warn', summary: 'Too few raw units', detail: 'The current raw unit total is less than the current planned total', life:10000 });
                
                } else { // Clear the warning off all current line items
                    this.singlePoRecipes.forEach(poRecipe => {
                        poRecipe.warning = false;
                    });
                    this.totalErrorMSG = '';
                }
            });

            console.log('Recipe Index Array: ', recipeIdxArray);

            // Loop through the different recipe lines and apply the warning
            recipeIdxArray.forEach(recipeIdx => {
                console.log(recipeIdx);
                this.singlePoRecipes[recipeIdx].warning = true;
            })
        },

        /**
         * When the user saves a row while editing a purchase order recipe, this function places the updated data into the 
         * singlePoRecipe array.
         * @param event {event} The data grabbed in the event of a user saving a row while editing a purchase order
         * 
         * Create By: Gabe de la Torre-Garcia
         * Date Created: 2-19-2025
         * Date Last Edited: 3-3-2025
         */
        async onPORecipeRowEditSave(event: any){
            const { newData, index } = event;
            console.log("Old data: ", this.singlePoRecipes[index]);
            console.log("New data: ", newData);

            let total = newData.total;
            let units_per_case = newData.units_per_case;
            let amount = newData.amount;

            console.log(total, '/', units_per_case, '=', amount);

            let editedRecipe = this.poRecipes.find(recipe => 
                recipe.purchase_order_id === this.purchaseOrder.purchase_order_id &&
                recipe.recipe_id === this.singlePoRecipes[index].recipe_id 
            );

            console.log("Recipe to edit: ", editedRecipe);

            editedRecipe.qty = newData.qty;

            console.log("Recipe after edit: ")

            await action.editPurchaseOrderRecipe(editedRecipe);
            this.$toast.add({severity:'success', summary: 'CASES UPDATED', detail: newData.amount + ' cases edited', life: 10000});



            this.singlePoRecipes[index] = newData;
            this.singlePoRecipes[index].product_name = this.getProductInfo(this.singlePoRecipes[index].product_id, 'name');

            // this.singlePoRecipes
            this.checkPoTotals();
        },


        onRawProductCancel(raw_product: any){
            if (!raw_product) return;

            // If the row is currently being edited, there is no persisted record to cancel yet.
            if (this.isRawRowEditing(raw_product)) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Finish Editing First',
                    detail: 'Save or cancel the row edit before canceling this product.',
                    life: 3000
                });
                return;
            }

            const index = this.poBoxes.findIndex(item =>
                item === raw_product ||
                (item.product_id === raw_product.product_id &&
                 item.purchase_order_id === raw_product.purchase_order_id &&
                 item.units_per_case === raw_product.units_per_case)
            );

            if (index < 0 || !this.poBoxes[index]) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Unable to Cancel',
                    detail: 'This product row could not be matched. Try saving the edit first.',
                    life: 3000
                });
                return;
            }

            this.rawProductToCancel = this.poBoxes[index];
            this.rawProductCancelDialog = true;
        },

        closeRawProductCancelDialog(){
            this.rawProductCancelDialog = false;
            this.rawProductToCancel = null;
        },

        async confirmRawProductCancel(){
            if (!this.rawProductToCancel) {
                this.closeRawProductCancelDialog();
                return;
            }

            const target = this.rawProductToCancel;
            const index = this.poBoxes.findIndex(item =>
                item === target ||
                (item.product_id === target.product_id &&
                 item.purchase_order_id === target.purchase_order_id &&
                 item.units_per_case === target.units_per_case)
            );

            if (index < 0 || !this.poBoxes[index]) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Unable to Cancel',
                    detail: 'This product row could not be matched. It may have changed.',
                    life: 3000
                });
                this.closeRawProductCancelDialog();
                return;
            }

            try {
                // Find the individual boxes that make up this poBox row
                const individualBoxes: any[] = this.purchaseOrder.individual_boxes || [];
                const matchingBoxes = individualBoxes
                    .filter(b =>
                        b.product_id === target.product_id &&
                        b.units_per_case === target.units_per_case &&
                        b.status !== 'Cancelled'
                    )
                    .slice(0, target.amount);

                if (matchingBoxes.length === 0) {
                    this.$toast.add({
                        severity: 'warn',
                        summary: 'No Boxes Found',
                        detail: 'No matching individual boxes could be located for this product line.',
                        life: 3000
                    });
                    this.closeRawProductCancelDialog();
                    return;
                }

                // Build one key-value object per box for bulk_update_case_v2
                const cancelPayload = matchingBoxes.map(b => ({
                    case_id:            b.case_id,
                    product_id:         b.product_id,
                    units_per_case:     b.units_per_case,
                    date_received:      b.date_received ?? null,
                    notes:              b.notes ?? null,
                    location_id:        b.location_id ?? null,
                    status:             'Cancelled',
                    purchase_order_id:  b.purchase_order_id,
                    request_id:         b.request_id ?? null
                }));

                await action.bulkEditCasesV2(cancelPayload);

                // Update local state to reflect the cancellation across all sources used by the UI
                const cancelledCaseIds = new Set(matchingBoxes.map(b => b.case_id));

                this.uBoxes = (this.uBoxes || []).map(box =>
                    cancelledCaseIds.has(box.case_id)
                        ? { ...box, status: 'Cancelled' }
                        : box
                );

                this.syncCurrentPurchaseOrderBoxViews();
                this.checkPoTotals();

                let linkedPoRec = this.poRecipes.find(rec =>
                    rec.purchase_order_id === target.purchase_order_id &&
                    this.recipeElements.find(r =>
                        r.product_id === target.product_id &&
                        r.type === 'input' &&
                        r.recipe_id === rec.recipe_id
                    ) !== undefined
                );
                console.log("PO Recipe in cancel function: ", linkedPoRec);

                this.$toast.add({
                    severity: 'success',
                    summary: 'Product Cancelled',
                    detail: `${target.product_name || 'Selected product'} was marked as cancelled (${matchingBoxes.length} box${matchingBoxes.length !== 1 ? 'es' : ''}).`,
                    life: 2500
                });
            } catch (error) {
                console.error("Error cancelling product: ", error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Cancellation Failed',
                    detail: 'An error occurred while cancelling this product. Please try again.',
                    life: 4000
                });
            }

            this.closeRawProductCancelDialog();
        },

        onProcProductCancel(product_id: number){
            const index = this.poCases.findIndex(item => item.product_id === product_id);
            this.poCases[index].status = "Cancelled";
            // console.log("Cases after cancel: ", this.poCases);
        },

        getReceivedTotal(product_id: number) {
            let receivedArray = this.checkSpecificBoxes('Received', product_id);
            let total = 0;

            receivedArray.forEach(line => {
                //console.log(line);
                total += line.amount * line.units_per_case});
            return total;
        },

        getRequestedTotal(product_id: number) {
            let receivedArray = this.checkSpecificBoxes('All', product_id);
            let total = 0;

            receivedArray.forEach(line => {
                //console.log(line);
                total += line.amount * line.units_per_case});
            return total;
        },

        /**
         * Takes a purchase order id and generates an array that displays the requested, received, and awaited product
         * 
         * @param purchase_order_id {number} The id of the purchase order that is currently being viewed
         * @returns An array of products belonging to the purchase order and separated into three types: Requested,
         * Received, and Awaiting
         * 
         * Created by: Gabe de la Torre-Garcia
         * Date Created: 8-05-2024 
         * Date Last Edited: 8-05-2024 
         */
         getDeliveredDataTable(poBoxes: any[]){
            let tableData = [] as any[];
            // let boxes = this.uBoxes.filter(box => box.purchase_order_id === purchase_order_id);

            for(const box of poBoxes){
                let location = null;
                box.moment = 'Requested';
                location = box.location_id;
                box.location_id = null;
                tableData.push(box);

                if (box.status === 'On RTP'){
                    let readyBox = {} as any;
                    readyBox.case_id = box.case_id;
                    readyBox.date_received = box.data_received;
                    readyBox.location_id = location;
                    readyBox.product_name = box.product_name;
                    readyBox.notes = box.notes;
                    readyBox.product_id = box.product_id;
                    readyBox.purchase_order_id = box.purchase_order_id;
                    readyBox.status = box.status;
                    readyBox.units_per_case = box.units_per_case;
                    readyBox.moment = 'Received';
                    // console.log("BOX MOMENT",box.moment);
                    // console.log("READY BOX MOMENT",readyBox.moment);
                    tableData.push(readyBox);
                }

                if (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Indbound' || box.status === 'Partially Delivered'){
                    let awaitedBox = {} as any;
                    awaitedBox.case_id = box.case_id;
                    awaitedBox.date_received = box.data_received;
                    awaitedBox.location_id = location;
                    awaitedBox.product_name = box.product_name;
                    awaitedBox.notes = box.notes;
                    awaitedBox.product_id = box.product_id;
                    awaitedBox.purchase_order_id = box.purchase_order_id;
                    awaitedBox.status = box.status;
                    awaitedBox.units_per_case = box.units_per_case;
                    awaitedBox.moment = 'Awaiting';
                    //console.log("BOX MOMENT",box.moment);
                    // console.log("AWAITED BOX MOMENT",awaitedBox.moment);
                    tableData.push(awaitedBox);
                }
            }

            console.log("BOXES", tableData);

            const keyStringArray = ["product_id", "moment", "location"];
            // const displayArray = this.groupProductsByKey(tableData, keyStringArray);
            const displayArray = helper.groupItemsByKey(tableData, keyStringArray);
            displayArray.forEach((line: { total: number; amount: number; units_per_case: number; }) => {
                line.amount = Number((line.total/line.units_per_case).toFixed(2));
                if(!line.total)
                    line.total = line.amount*line.units_per_case;
            });

            console.log("DISPLAY ARRAY", displayArray);

            return displayArray;
        },

        setRowEditor(data: any){
            let toggle = false;

            if (data.moment === "Awaiting")
                toggle = true;

            return toggle;
        },

        formatSingleLocation(location_id: any[]){
            //  console.log("Location: ",location_id)
            if(location_id){
                let curLoc = this.locations.find(l => l.location_id === location_id);

                return curLoc.name;
            }
            
        },

        formatLocations(locations: any[]){
            console.log(locations)
            if(locations){
                let locationNames = [] as any[];
                locations.forEach(loc => {
                    if (loc){
                        let curLoc = this.locations.find(l => l.location_id === loc);
                        //console.log(loc)
                        //console.log(curLoc)
                        locationNames.push(curLoc.name);
                    }
                })
                return locationNames.toString();
            }
            
        },

        // 8/8
        receivedDialogSetup(product_id: number){
            this.receivedDialog = true;
            console.log(this.poBoxes);
            
            this.receivedLocationsArray = [];
            this.editedLine ={};
            // this.delivered= this.delivered.filter(box => box.moment === "Awaiting" || box.moment === "Newly Arrived" || box.moment === "Back Ordered");
            
            this.editedLine = this.delivered.find(box => box.product_id === product_id && box.moment === "Awaiting")
            this.receivedLocationsArray = this.delivered.filter(box => box.product_id === product_id && (box.moment === "Awaiting" || box.moment === "Newly Arrived" || box.moment === "Back Ordered"));

            if (this.editedLine === undefined){
                let bundleArray = this.delivered.filter(box => box.product_id === product_id && box.moment === "Newly Arrived" || box.moment === "Back Ordered");
                this.editedLine = {};
                this.editedLine.amount = 0;
                this.editedLine.total = 0;
                
                bundleArray.forEach(boxLine => {
                    let map = {} as any;
                    map.amount = boxLine.amount;
                    map.total = boxLine.total;
                    map.product_id = boxLine.product_id;

                    console.log(map)

                    this.editedLine.amount += map.amount;
                    this.editedLine.total += map.total;
                    

                    if(!this.editedLine.product_id)
                        this.editedLine.product_id = map.product_id;
                });
            }
            
            console.log("editedLine", this.editedLine);
            console.log(this.editedLine.amount);

            if(this.receivedLocationsArray.length === 0){
                
                console.log("IN ARRAY IF");

                
                this.addReceivedArrayLine();
                console.log(this.editedLine.amount);
                this.receivedLocationsArray[0].amount = this.editedLine.amount;
                this.receivedLocationsArray[0].total = this.editedLine.total;
            }
        },

        // 8/8
        addReceivedArrayLine(){
            this.receivedLocationsArray.push(
                    {
                    product_id: this.editedLine.product_id,
                    amount: 1,
                    name: this.editedLine.name,
                    units_per_case: this.editedLine.units_per_case,
                    total: this.editedLine.units_per_case,
                    location: null
                    }
                )
        },

        // 8/8
        onReceivedLocationRowSave(event: any){
            console.log(event);
            let { newData, index } = event;

            this.receivedLocationsArray[index] = newData;
            // console.log(this.receivedLocationsArray[index])
            console.log(this.receivedLocationsArray);
            console.log(this.poBoxes);
        },

        /**
         * 
         * 
         * @param 
         * 
         * Created by: Gabe de la Torre-Garcia
         * Date Created: 8-01-2024 
         * Date Last Edited: 8-01-2024 
         */
         onReceivedLocationCellEdit(event: any) {
            // console.log(event);
            let { newData, index } = event;

            this.receivedLocationsArray[index] = newData;
        },

        /**
         * 
         * 
         * Created By: Gabe de la Torre-Garcia on: 8-8-24
         * 
         * Last Edited: 4-7-2025
         */
        receivedDialogSave(){
            let total = 0;
            let numErr = 0;
            let errMSG = [] as any[];
            this.locationSubmitted = true;
            this.receivedLocationsArray.forEach((line: { amount: number; location_id: number; }) => {
                total += line.amount

                if (!line.location_id){
                    numErr++;
                    errMSG.push("Location Required");
                }

            });

            let requestedTotalOBJ = {} as any;
            let arrivingTotalAmount = 0;
            let arrivingTotalUnits = 0;
            // console.log(total);
            // console.log(this.editedLine.amount);

            /**
             * @TODO Eventually, I want this to open a confirm dialog to make sure a user knows that the inserted 
             * box amount is greater than what was order. This is for the fringe cases where we get more than we ordered
             */
            /* if (total > this.editedLine.amount){
                numErr++;
                errMSG.push("Number Awaiting: "+ this.editedLine.amount+ ". Number Inputted: "+total);
            }  */
            
            // Check to make sure that the user has entered locations for each line 
            if (this.locationSubmitted === true && numErr > 0) {
                this.$toast.add({severity:'error', summary: "Error", detail: errMSG.join('\n'), life: 3000});
            } else {
                // Grab all PO boxes that are not received already
                let awaitedBoxes = this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && box.product_id === this.editedLine.product_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Indbound') || box.moment === "Newly Arrived" );
                console.log("awaitedBoxes", awaitedBoxes);
                // console.log("Received locations array:", this.receivedLocationsArray);

                // Make a key variable with all of the required box fields
                let receivedLocKey = this.receivedLocationsArray[0];

                if (this.receivedLocationsArray.length === 1){ // All boxes placed on one location

                    console.log("PO Boxes: ", this.poBoxes);
                    // 
                    this.poBoxes.forEach(box => {
                        if (box.product_id === receivedLocKey.product_id && (box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Indbound' || box.status === 'Partially Delivered' || box.status === 'BO')){
                            box.location_id = receivedLocKey.location_id;
                            box.amount = receivedLocKey.amount;
                            box.total = receivedLocKey.total;
                            box.moment = "Newly Arrived";
                        }
                    })

                    console.log("delivered before forEach",this.delivered);

                    this.delivered.forEach(box => {
                        if (box.product_id === receivedLocKey.product_id && (box.moment==='Awaiting' || box.moment === 'Back Ordered' || box.moment==='Newly Arrived') ){
                            box.location_id = receivedLocKey.location_id;
                            box.amount = receivedLocKey.amount;
                            box.total = receivedLocKey.total;
                            box.moment = "Newly Arrived";

                            arrivingTotalAmount += box.amount;
                            arrivingTotalUnits += box.total;

                        } else if (box.product_id === receivedLocKey.product_id && box.moment==='Received') {
                            arrivingTotalAmount += box.amount;
                            arrivingTotalUnits += box.total;

                        } else if (box.product_id === receivedLocKey.product_id && box.moment==='Requested'){
                            requestedTotalOBJ = box;
                        }
                    })
                    console.log("delivered after forEach", this.delivered);
                    console.log("poBoxes", this.poBoxes);

                } else { // Boxes spread accross multiple locations

                    // let receivedLocKey = this.receivedLocationsArray[0];
                    let boxKey = {} as any;
                    let locationAmountArray = [] as any[];
                    this.receivedLocationsArray.forEach((line: { location_id: number; amount: number; }) => {
                        let locationAmountOBJ = {} as any;
                        locationAmountOBJ.location_id = line.location_id;
                        locationAmountOBJ.amount = line.amount;

                        locationAmountArray.push(locationAmountOBJ);
                    });

                    this.poBoxes.forEach(box => {
                            if (box.product_id === receivedLocKey.product_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Indbound' || box.status === 'Partially Delivered') ){
                                boxKey = box;
                                box.location_id = receivedLocKey.location_id;
                                box.amount = receivedLocKey.amount;
                                box.total = receivedLocKey.total;
                                box.moment = "Newly Arrived";
                            }
                        })

                    console.log("delivered",this.delivered);

                    this.delivered.forEach(box => {
                        if (box.product_id === receivedLocKey.product_id && box.moment==='Awaiting' ){
                            box.location_id = receivedLocKey.location_id;
                            box.amount = receivedLocKey.amount;
                            box.total = receivedLocKey.total;
                            box.moment = "Newly Arrived";

                            arrivingTotalAmount += box.amount;
                            arrivingTotalUnits += box.total;

                        } else if (box.product_id === receivedLocKey.product_id && box.moment==='Received') {
                            arrivingTotalAmount += box.amount;
                            arrivingTotalUnits += box.total;

                        } else if (box.product_id === receivedLocKey.product_id && box.moment==='Requested'){
                            requestedTotalOBJ = box;
                        }
                    })

                
                    // this.delivered = this.delivered.filter(row => row.product_id !== receivedLocKey.product_id);
                    // console.log("Irrelevant Product Table Lines: ", this.delivered);

                    /**
                     * Starting with the first additional location, loop through all locations, creating an object 
                     * using that indexes field values. This object is pushed into the delivered table array and 
                     * the PO Boxes array. 
                     * 
                     * @TODO If the user needs to reopen the menu and edit something, the edited line will be pushed
                     * as a new line, rather than updating the necessary line. Need to find a way to only push new 
                     * lines while successfully updating edited lines. 
                     */
                    console.log("Received locations array:", this.receivedLocationsArray);
                    console.log("Array length ",this.receivedLocationsArray.length);
                    console.log("Box Key: ", boxKey);
                    for ( let locArrayIdx = 1; locArrayIdx < this.receivedLocationsArray.length; locArrayIdx++){
                        console.log('receivedLocationsArray', this.receivedLocationsArray[locArrayIdx]);
                        let newArrayObj = {} as any;
                        newArrayObj.amount = this.receivedLocationsArray[locArrayIdx].amount;
                        newArrayObj.location_id = this.receivedLocationsArray[locArrayIdx].location_id;
                        newArrayObj.product_id = this.receivedLocationsArray[locArrayIdx].product_id;
                        newArrayObj.total = this.receivedLocationsArray[locArrayIdx].total;
                        newArrayObj.units_per_case = this.receivedLocationsArray[locArrayIdx].units_per_case;

                        newArrayObj.product_name = this.receivedLocationsArray[0].product_name;
                        newArrayObj.case_id = this.receivedLocationsArray[0].case_id;
                        newArrayObj.date_received = this.receivedLocationsArray[0].date_received;
                        newArrayObj.moment = "Newly Arrived";
                        newArrayObj.notes = this.receivedLocationsArray[0].notes;
                        newArrayObj.purchase_order_id = this.receivedLocationsArray[0].purchase_order_id;
                        newArrayObj.status = this.receivedLocationsArray[0].status;

                        arrivingTotalAmount += this.receivedLocationsArray[locArrayIdx].amount;
                        arrivingTotalUnits += this.receivedLocationsArray[locArrayIdx].total;

                        this.delivered.push(newArrayObj);
                        this.poBoxes.push(newArrayObj);

                        let newlyArrivedProductArray = this.delivered.filter(row => row.product_id === receivedLocKey.product_id && row.moment === 'Newly Arrived');

                        console.log("Relevant Product Table Lines: ", newlyArrivedProductArray);
                       
                    }

                    let awaitedBoxArray = this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Indbound' || box.status === 'Partially Delivered'));
                    console.log("AWAITED BOXES IN DIALOG SAVE", awaitedBoxArray);
                    console.log("LOCATION ARRAY", locationAmountArray);

                    let locationIdx = 0;

                    awaitedBoxArray.forEach(box => {
                        if(locationAmountArray[locationIdx]){
                            console.log("LOCATION" , locationAmountArray[locationIdx].location_id, "AMOUNT", locationAmountArray[locationIdx].amount);
                            console.log(box);
                            if(locationAmountArray[locationIdx].amount === 0){
                            locationIdx++;
                            } else {
                            box.location_id = locationAmountArray[locationIdx].location_id;

                            console.log(box.location_id);
                            locationAmountArray[locationIdx].amount--;
                            }
                        }
    
                    });

                }
                // let key = this.uBoxes.find(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id);
                
                console.log("U Boxes after location setting",this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && (box.status === 'Draft' || box.status === 'BO')))

                let backOrderLine = this.delivered.find(line => line.moment === "Back Ordered")

                /* if(backOrderLine){
                    console.log("backOrderLine.amount", " = ", "requestedTotalOBJ.amount", " - ", "arrivingTotalAmount");
                    console.log(backOrderLine.amount, " = ", requestedTotalOBJ.amount, " - ", arrivingTotalAmount);
                    console.log(backOrderLine.amount);
                    console.log(requestedTotalOBJ.amount);
                    console.log(arrivingTotalAmount);
                    backOrderLine.amount = requestedTotalOBJ.amount - arrivingTotalAmount;
                    backOrderLine.total = requestedTotalOBJ.total - arrivingTotalUnits;
                } else {
                    let backOrderOBJ = {} as any;
                    backOrderOBJ.moment = "Back Ordered";
                    
                    // console.log(backOrderLine.amount);
                    console.log(requestedTotalOBJ);
                    console.log(arrivingTotalAmount);
                    backOrderOBJ.amount = requestedTotalOBJ.amount - arrivingTotalAmount;
                    backOrderOBJ.total = requestedTotalOBJ.total - arrivingTotalUnits;
                    backOrderOBJ.name = this.editedLine.name;

                    console.log("backOrderLine.amount", " = ", "requestedTotalOBJ.amount", " - ", "arrivingTotalAmount");

                    console.log(backOrderOBJ.amount, " = ", requestedTotalOBJ.amount, " - ", arrivingTotalAmount);
                    
                    this.delivered.push(backOrderOBJ);
                } */

                console.log("Received locations array at end of save:", this.receivedLocationsArray);
                console.log("delivered",this.delivered);
                console.log("Po Boxes at end of save: ",this.poBoxes);

                this.receivedDialog = false;
            }
        },

        searchVendors(event: any) {
            // console.log("Search Vendors Event: ", event);
            const query = event.query ? event.query.toLowerCase() : '';
            this.filteredVendors = this.vendors.filter(v =>
                v.vendor_name && v.vendor_name.toLowerCase().includes(query)
            );
            // console.log("Filtered Vendors after search: ", this.filteredVendors);
        },

        searchRecipes(event: any, counter: number) {
            console.log("Search Recipes Event: ", event);
            // console.log("Search Recipes Counter: ", counter);
            console.log("Filtered Recipes: ", this.filteredRecipes);
            const query = event.query ? event.query.toLowerCase() : '';
            // const allRecipes = this.selectVendorRecipes(this.purchaseOrder.vendor_id) || [];
            // Ensure filteredRecipes is an array of arrays, one per row
            if (!Array.isArray(this.filteredRecipes)) 
                this.filteredRecipes = [];

            this.filteredRecipes[counter] = this.recipes.filter(r =>
                r.label && r.label.toLowerCase().includes(query)
            );
            console.log("Filtered Recipes after search: ", this.filteredRecipes);
        },

        /**@TODO Finish the AutoComplete for boxes */
        searchRawProducts(event: any) {
            console.log("Search Products Event: ", event);
            // console.log("Search Products Counter: ", counter);
            console.log("Filtered Products: ", this.filteredRawProducts);
            const query = event.query ? event.query.toLowerCase() : '';
            // const allProducts = this.products || [];
            // Ensure filteredProducts is an array of arrays, one per row
            if (!Array.isArray(this.filteredRawProducts)) 
                this.filteredRawProducts = [];

            this.filteredRawProducts = this.unprocProducts.filter(p =>
                p.name && p.name.toLowerCase().includes(query)
            );
            console.log("Filtered Products after search: ", this.filteredRawProducts);
        },

        searchRecipesEdit(event: any) {
            console.log("Search Recipes Event: ", event);
            // console.log("Search Recipes Counter: ", counter);
            console.log("Filtered Recipes: ", this.filteredRecipesEdit);
            const query = event.query ? event.query.toLowerCase() : '';
            // const allRecipes = this.selectVendorRecipes(this.purchaseOrder.vendor_id) || [];
            // Ensure filteredRecipes is an array of arrays, one per row
            if (!Array.isArray(this.filteredRecipes)) 
                this.filteredRecipesEdit = [];

            this.filteredRecipesEdit = this.recipes.filter(r =>
                r.label && r.label.toLowerCase().includes(query)
            );
            console.log("Filtered Recipes after search: ", this.filteredRecipesEdit);
        },

        /**
         * If requests haven't been made for the purchase order, add them
         */
        async addRequestsToProcess(){

        },

        openNewPurchaseOrderProductDialog(){
            this.newPurchaseOrderProductDialog = true;
            this.newPORecipe = {} as any;
            this.newPORecipe.amount = 1;
            this.poCasesEdit = [];
            this.addBulkLine(this.singlePoRecipes);
            const lastIdx = this.singlePoRecipes.length - 1;
        },

        closeNewPurchaseOrderProductDialog(){
            this.newPurchaseOrderProductDialog = false;
            const lastIdx = this.singlePoRecipes.length - 1;
            this.deleteBulkLine(this.singlePoRecipes, lastIdx)

        },

        saveNewPurchaseOrderProduct(){
            console.log("Saving new purchase order product");
        },

        async openInboundDialog(purchaseOrder: any){
            try {
                this.inboundPurchaseOrderDialog = true;
                console.log("Purchase order in inbound dialog: ", purchaseOrder);
                console.log("PO Boxes: ", this.poBoxes);
                let allInboundBoxes = await action.getInboundBoxes(purchaseOrder.purchase_order_id);
                this.inboundBoxes = helper.groupProductsByKey(allInboundBoxes, ["product_id"]);
                console.log("Inbound boxes: ", this.inboundBoxes);

            } catch (error) {
                console.error("Error opening inbound dialog: ", error);
            }
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

 .container {
  display: flex;
  align-items: center;
}

.p-datatable.p-datatable-gridlines .p-datatable-border-color .p-datatable-tbody > tr {
  background: gray
  
}

/* ── Loading overlay ─────────────────────────────────────────── */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 3.5rem;
  border-radius: 14px;
  background: var(--surface-card, #1e1e2e);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.loading-label {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-color, #e0e0e0);
  text-transform: uppercase;
}

.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.25s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}

.vendor-select-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 0.25rem;
    text-align: center;
}

.vendor-select-subtitle {
    margin: 0;
    color: var(--text-color-secondary, #6b7280);
    font-size: 0.95rem;
}

.vendor-select-autocomplete {
    width: min(360px, 100%);
}

:deep(.vendor-select-autocomplete .p-inputtext) {
    text-align: center;
}

:deep(.vendor-select-dialog .p-dialog-content) {
    padding-top: 0.75rem;
}

.card {
    border: 1px solid var(--surface-border, #d4d8dd);
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f6f8fa 100%);
    box-shadow: 0 12px 28px rgba(8, 25, 45, 0.08);
    overflow: hidden;
}

:deep(.card .p-toolbar) {
    border: 0;
    border-bottom: 1px solid var(--surface-border, #d4d8dd);
    background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
    padding: 0.9rem 1.1rem;
}

:deep(.card .p-datatable) {
    border: 0;
}

:deep(.card .p-datatable .p-datatable-header) {
    border: 0;
    border-bottom: 1px solid var(--surface-border, #d4d8dd);
    background: #fcfdff;
    padding: 0.85rem 1rem;
}

:deep(.card .p-datatable .p-datatable-thead > tr > th) {
    background: #f3f7fb;
    color: #24384c;
    font-weight: 700;
    border-color: #dce3ea;
    padding: 0.8rem 0.65rem;
}

:deep(.card .p-datatable .p-datatable-tbody > tr > td) {
    border-color: #e7edf3;
    padding: 0.75rem 0.65rem;
}

:deep(.card .p-datatable .p-datatable-tbody > tr:hover) {
    background: #f6fbff;
}

:deep(.card .p-datatable .p-paginator) {
    border: 0;
    border-top: 1px solid var(--surface-border, #d4d8dd);
    background: #fbfdff;
    padding: 0.65rem 0.9rem;
}

:deep(.card .p-tag) {
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0.25rem 0.6rem;
}

.po-status-pill {
    position: relative;
    width: 190px;
    min-height: 30px;
    border-radius: 999px;
    border: 1px solid #c9d5e3;
    background: #eef3f8;
    overflow: hidden;
}

.po-status-pill-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, #6c93bd 0%, #4f7eaf 100%);
    transition: width 220ms ease;
}

.po-status-pill-text {
    position: relative;
    z-index: 1;
    height: 100%;
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem 0.75rem;
    font-weight: 700;
    color: #12304f;
    white-space: nowrap;
}

.po-status-pill.status-delivered .po-status-pill-fill {
    background: linear-gradient(90deg, #2f9e63 0%, #46c07f 100%);
}

.po-status-pill.status-canceled .po-status-pill-fill {
    background: linear-gradient(90deg, #9aa6b2 0%, #7f8b97 100%);
}

@media (max-width: 768px) {
    .card {
        border-radius: 12px;
    }

    :deep(.card .p-toolbar) {
        padding: 0.75rem;
    }

    :deep(.card .p-datatable .p-datatable-header) {
        padding: 0.7rem;
    }
}

</style>
