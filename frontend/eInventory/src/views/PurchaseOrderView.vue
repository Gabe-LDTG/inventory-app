<template>
    <div>
        <div class="card">
            <Toast />
            <!-- <div v-if="loading" style="z-index: 1"> LOADING <ProgressSpinner /> </div> -->
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="success" class="mr-2" @click="vendorSelect()" />
                    <!-- <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts" /> -->
                </template>

                <!--<template #end>
                    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" @uploader="onUpload"/>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV()"  />
                </template>-->
            </Toolbar>

            <!-- :rowStyle="rowStyle" -->
            <DataTable ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" 
                dataKey="purchase_order_id"
                :paginator="true" :rows="10" :filters="filters"
                selectionMode="single"
                :selectAll="false"
                removableSort
                style="min-width: 1000px"
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

                <Column header="Total Cost">
                    <template #body="{data}">
                        {{ formatCurrency(getCreatedCostTotal(data.purchase_order_id)) }}
                    </template>
                </Column>


                <Column header="PO Phase" :exportable="false" style="min-width: 275px">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.status === 'Delivered'" class="flex flex-wrap align-items-center ">
                            <Button icon="pi pi-pencil" v-tooltip.top="'Edit PO'" :disabled="slotProps.data.status === ''" rounded class="mr-2" @click="confirmOrderReceived(slotProps.data)" />
                        </div>

                        <div v-else class="flex flex-wrap align-items-center ">
                            <Button icon="pi pi-envelope" v-tooltip.top="'PO Submitted'" :disabled="slotProps.data.status === 'Submitted' || slotProps.data.status === 'Ordered' || slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="warning" class="mr-2" @click="openStatusChangeDialog(slotProps.data); newStatus = 'Submitted'"/>
                            <i class="pi pi-angle-right" style="color: slateblue"/>
                            <Button icon="pi pi-box" v-tooltip.top="'PO Ordered'" :disabled="slotProps.data.status === 'Ordered' || slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="info" class="mr-2" @click="openStatusChangeDialog(slotProps.data); newStatus = 'Ordered'"/>
                            <i class="pi pi-angle-right" style="color: slateblue"/>
                            <Button icon="pi pi-truck" v-tooltip.top="'PO Inbound'" :disabled="slotProps.data.status === 'Inbound' || slotProps.data.status === 'Partially Delivered' || slotProps.data.status === 'Delivered'" rounded severity="warning" class="mr-2" @click="openStatusChangeDialog(slotProps.data); newStatus = 'Inbound'"/>
                            <i class="pi pi-angle-right" style="color: slateblue"/>
                            <Button icon="pi pi-check" v-tooltip.top="'PO Delivered'" :disabled="slotProps.data.status === ''" rounded class="mr-2" @click="confirmOrderReceived(slotProps.data)" />
                            <!-- <Button icon="pi pi-times" outlined rounded severity="danger" @click="confirmCancelOrder(slotProps.data)" /> -->
                        </div>
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
                                <Column expander header="Raw Product Info" style="width: 5rem" />
                                <Column field="name" header="Name" />
                                <Column header="FNSKU">
                                    <template #body="{data}">
                                        {{ getFNSKU(data.product_id) }}
                                    </template>
                                </Column>
                                <Column field="units_per_case" header="Units per Case" />
                                <Column field="amount" header="Total # of Cases" />
                                <Column header="Total # of Units">
                                    <template #body = {data}>
                                        {{ data.units_per_case * data.amount }}
                                    </template>
                                </Column>
                                <Column field="status" header="Status" />
                                <template #expansion="{data}" style="background-color: '#16a085'">
                                    <h4 class="font-bold">Raw Product(s) required for {{ data.name }}</h4>
                                    <DataTable :value="displayRawInfo(data.purchase_order_id, data.product_id, data.amount)" :rowClass="rowClass" :rowStyle="rowStyle">
                                        <Column field="name" header="Name"/>
                                        <Column header="UPC">
                                            <template #body = {data}>
                                                {{ getUPC(data.product_id) }}
                                            </template>
                                        </Column>
                                        <Column field="units_per_case" header="Units per Box"/>
                                        <Column field="amount" header="Total # of Boxes"/>
                                        <Column field="" header="Total # of Units">
                                            <template #body = {data}>
                                                {{ data.units_per_case * data.amount }}
                                            </template>
                                        </Column>
                                        <Column header="Location">
                                            <template #body="{data}">
                                                {{ formatSingleLocation(data.location) }}
                                            </template>
                                        </Column>
                                        <Column header="Total Price" class="font-bold">
                                            <template #body = {data}>
                                                {{formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount))}}
                                            </template>
                                        </Column>
                                        <Column field="status" header="Status" sortable>
                                            <template #body="slotProps">
                                                <div class="card flex flex-wrap  gap-2">
                                                    <Tag :value="slotProps.data.status" :severity="getBoxSeverity(slotProps.data)" iconPos="right"/>
                                                </div>
                                            </template>
                                        </Column>
                                    </DataTable>
                                </template>

                            </DataTable>

                           <!--  <br><h4 class="font-bold">Raw Products with No Plan</h4>
                            <DataTable :value="getPool(slotProps.data.purchase_order_id)">
                                <Column header="Name">
                                    <template #body = {data}>
                                        {{ data.name }}
                                    </template>
                                </Column>
                                <Column header="Units per Box">
                                    <template #body = {data}>
                                        {{ data.units_per_case }}
                                    </template>
                                </Column>
                                <Column header="Total # of Boxes">
                                    <template #body = {data}>
                                        {{ data.amount }}
                                    </template>
                                </Column>
                                <Column field="status" header="Status" />
                            </DataTable> -->
                        </div>

                        <div class="p-3" v-if="slotProps.data.displayStatus === 'Unprocessed'">
                            <h4>Unprocessed Product(s) in Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                            <DataTable :value="displayInfo(slotProps.data)" :rowClass="rowClass" :rowStyle="rowStyle"
                            sortField="name" :sortOrder="-1">
                                <Column field="name" header="Name" :sortable="true"/>
                                <Column header="UPC" :sortable="true">
                                    <template #body="{data}">
                                        {{ getUPC(data.product_id) }}
                                    </template>
                                </Column >
                                <Column field="units_per_case" header="Units per Case"  sortable/>
                                <Column field="amount" header="Total # of Boxes" sortable />
                                <Column header="Total # of Units" :sortable="true">
                                    <template #body = {data}>
                                        {{ data.units_per_case * data.amount }}
                                    </template>
                                </Column >
                                <Column header="Location">
                                            <template #body="{data}">
                                                {{ formatSingleLocation(data.location) }}
                                            </template>
                                        </Column>
                                <Column header="Unit Price" :sortable="true">
                                    <template #body="{data}">
                                        ${{ formatCurrency(getUnitCost(data.product_id)) }}
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold" :sortable="true">
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount)) }}
                                    </template>
                                </Column >
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

            <div v-if="purchaseOrder.purchase_order_id">
                <!-- EDITING/////////////////////////////////////////////////////////////////////////////////// -->

                <div v-if="purchaseOrder.status === 'Delivered'">
                <div class ="caseCard">
                    <div class="field">
                        <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Requested Product(s):</h3>
                    </div>

                    <DataTable :value="checkBoxes('All')" rowGroupMode="subheader" :rowStyle="rowStyleRequested">

                        <Column field="name" header="Name"/>
                        <Column field="amount" header="Total Number of Boxes"/>
                        <Column header="Total Number of Units">
                            <template #body={data}>
                                {{ data.amount*data.units_per_case }}
                            </template>
                        </Column>
    
                    </DataTable> <br>
                </div>

                <div class="caseCard">
                    <div class="field">
                        <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Received Product(s):</h3>
                    </div>

                    <DataTable :value="checkBoxes('Received')" rowGroupMode="subheader" :rowStyle="rowStyleReceived">

                        <Column field="name" header="Name"/>
                        <Column field="amount" header="Total Number of Boxes"/>
                        <Column header="Total Number of Units">
                            <template #body={data}>
                                {{ data.amount*data.units_per_case }}
                            </template>
                        </Column>

                        <template #empty> No products received yet. </template>

                    </DataTable> <br>
                </div> 
                </div>

                <div v-if="purchaseOrder.status !== 'Delivered'">
                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Purchase Order Product(s):</h3>
                </div>
                </div>

                <div class="field">
                        <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">NEW Product(s):</h3>
                    </div>
                    <DataTable :value="deliveredDataTableArray" v-model:editingRows="editingRows" 
                    rowGroupMode="subheader" groupRowsBy="name" 
                    editMode="row" @row-edit-save="onRowEditSave" :rowStyle="rowStyleCompared"
                    showGridlines
                    tableStyle="background-color: '#16a085'"
                    >
                        <template #empty>No more units being waited on.</template>

                        <template #groupheader="{data}">
                            <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                                <h4 class="flex items-center font-bold gap-2">{{ data.name }}</h4>
                                In total there are {{ getReceivedTotal(data.product_id) }} received units.
                            </div>
                        </template>

                        <Column class="font-bold" field="moment" header="Status" />
                        <Column field="name" header="Name"/>
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
                            <!-- <template #editor={data}>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="data.amount" showButtons
                                @update:model-value="data.total = data.amount*data.units_per_case"
                                />
                            </template> -->
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
                            <!-- <template #editor={data}>
                                <InputNumber v-model="data.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="data.amount = onTotalUpdate(data.total, data.units_per_case)"
                                />
                            </template> -->
                        </Column>

                        <Column header="Location">
                            <template #body="{data}">
                                <div v-if="data.moment == 'Received'">
                                    {{ formatSingleLocation(data.location) }}
                                </div>
                            </template>
                            <template #editor="{data}">
                                <label for="location">Location:</label>
                                <div class="container">
                                    <!-- <InputText id="location" v-model="eCase.location" rows="3" cols="20" /> -->
                                    <Dropdown v-model="data.location"
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

                        <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                    
                        <!-- <Column >
                            <template #body="{data}">
                                <div v-if="data.moment == 'Awaiting'">
                                    <Button label="Received" severity="success" class="mr-2" @click=""/>
                                </div>
                            </template>
                        </Column> -->

                    </DataTable> <br>
                <template class="caseCard" v-for="(poBox, counter) in checkBoxes('Awaited')">

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poCases, counter)"/>

                        <h3 class="flex justify-content-start font-bold w-full">{{ poBox.name }}</h3><br>

                        <DataTable :value="checkSpecificBoxes('All', poBox.product_id)" rowGroupMode="subheader" :rowStyle="rowStyleRequested"> 

                            <template #header>
                                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                                    <h3 class="m-0 font-bold">Requested {{ poBox.name }}</h3>
                                    In total there were {{ getRequestedTotal(poBox.product_id) }} ordered units.
                                </div>
                            </template>
                            <Column field="amount" header="Total Number of Boxes"/>
                            <Column header="Total Number of Units">
                                <template #body={data}>
                                    {{ data.amount*data.units_per_case }}
                                </template>
                            </Column>

                            <!-- <template #footer> <div :style="rowStyleRequested">In total there are {{ getRequestedTotal(poBox.product_id) }} received units.</div> </template> -->
                        </DataTable>

                        <DataTable :value="checkSpecificBoxes('Received', poBox.product_id)" rowGroupMode="subheader" :rowStyle="rowStyleReceived"> 

                            <template #header>
                                <div class="flex flex-wrap gap-2 align-items-center justify-content-between">
                                    <h3 class="m-0 font-bold">Received {{ poBox.name }}</h3>
                                    In total there are {{ getReceivedTotal(poBox.product_id) }} received units.
                                </div>
                            </template>
                            <template #empty>No units received yet.</template>
                            <Column field="amount" header="Total Number of Boxes"/>
                            <Column header="Total Number of Units">
                                <template #body={data}>
                                    {{ data.amount*data.units_per_case }}
                                </template>
                            </Column>

                            <!-- <template #footer> In total there are {{ getReceivedTotal(poBox.product_id) }} received units. </template> -->
                        </DataTable>

                        <DataTable :value="checkSpecificBoxes('Awaited', poBox.product_id)" v-model:editingRows="editingRows" rowGroupMode="subheader" editMode="row" @row-edit-save="onRowEditSave" :rowStyle="rowStyleAwaiting"> 

                            <template #header>
                                <div class="flex flex-wrap gap-2 font-bold align-items-center justify-content-between">
                                    <h3 class="m-0 font-bold">{{ poBox.name }} Still Waiting On</h3>
                                </div>
                            </template>
                            <template #empty>No more units being waited on.</template>
                            <Column field="amount" header="Total Number of Boxes">
                                <template #body={data}>
                                    {{ data.amount }}
                                </template>
                                <template #editor={data}>
                                    <InputNumber inputId="stacked-buttons" required="true" 
                                    v-model="data.amount" showButtons
                                    @update:model-value="data.total = data.amount*poBox.units_per_case"
                                    />
                                </template>
                                <!-- <template #editor={data}>
                                    <InputNumber inputId="stacked-buttons" required="true" 
                                    v-model="data.amount" showButtons
                                    @update:model-value="data.total = data.amount*data.units_per_case"
                                    />
                                </template> -->
                            </Column>
                            <Column header="Total Number of Units">
                                <template #body={data}>
                                    {{ data.total }}
                                </template>
                                <template #editor={data}>
                                    <InputNumber v-model="data.total" 
                                    inputId="stacked-buttons" showButtons
                                    @update:model-value="data.amount = onTotalUpdate(data.total, poBox.units_per_case)"
                                    />
                                </template>
                                <!-- <template #editor={data}>
                                    <InputNumber v-model="data.total" 
                                    inputId="stacked-buttons" showButtons
                                    @update:model-value="data.amount = onTotalUpdate(data.total, data.units_per_case)"
                                    />
                                </template> -->
                            </Column>
                            <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                        </DataTable>

                        <!-- <div class="flex flex-wrap gap-2 font-bold align-items-center justify-content-between">
                            <h3 class="m-0 font-bold">Waiting On</h3>
                        </div> -->
                        <div class="block-div">

                            <!-- <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !poBox.units_per_case}"
                                v-model="poBox.units_per_case" showButtons
                                @input="poBox.total = poBox.amount*poBox.units_per_case"/>
                                <small class="p-error" v-if="submitted && !poBox.units_per_case">Amount is required.</small>
                            </div> -->

                            <div class="field">
                                <label for="amount">How Many Boxes Arrived?</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                v-model="poBox.amount" showButtons
                                @update:model-value="poBox.total = poBox.amount*poBox.units_per_case"/>
                            </div>

                            <div class="field">
                                <label for="total">Total Units Received</label>
                                <InputNumber v-model="poBox.total" 
                                inputId="stacked-buttons" showButtons
                                @update:model-value="poBox.amount = onTotalUpdate(poBox.total, poBox.units_per_case)"/>
                            </div> 

                            <!-- MAKE DROPDOWN WHEN LOCATION TABLE IS SET UP -->
                            <!-- <div class="field">
                                <label for="total">Location</label>
                                <InputText id="notes" v-model="poBox.location" rows="3" cols="20" />
                            </div> -->

                            <!-- <InputText id="location" v-model="poBox.location" rows="3" cols="20" /> -->
                             <!-- <div class="field">
                                <label for="location">Location:</label>
                                <Dropdown v-model="poBox.location"
                                placeholder="Select a Location" class="w-full md:w-14rem" editable
                                :options="locations"
                                filter
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                optionLabel="name"
                                optionValue="location_id" />
                                <Button label="New Location" icon="pi pi-plus" @click="newLocation()"  />
                            </div>  -->

                            <!-- FUTURE PROJECT -->
                            <!-- <div class="field">
                                <Button label="Additional Location(s)" icon="pi pi-plus" @click="additionalLocation()"  />
                            </div> -->

                        </div>

                    </div>
                </template>

            

            </div>

            <div v-else>
                <!-- CREATING/////////////////////////////////////////////////////////////////////////////////// -->

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
                            <Dropdown v-model="poRecipe.recipe_id" required="true" 
                            placeholder="Select a Product" class="md:w-14rem" editable
                            :options="selectVendorRecipes(purchaseOrder.vendor_id)"
                            optionLabel="label"
                            filter
                            @change="onRecipeSelection(poRecipe.recipe_id, counter);"
                            optionValue="recipe_id"
                            :virtualScrollerOptions="{ itemSize: 38 }"
                            :class="{'p-invalid': submitted && !poRecipe.recipe_id}" 
                            />
                            <small class="p-error" v-if="submitted && !poRecipe.recipe_id">Name is required.</small>
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

                        <div v-if="poRecipe.amount && poRecipe.recipe_id" class="field">
                            <label class="flex justify-content-end font-bold w-full" for="total">Total to be Made:</label>
                            <div class="flex justify-content-end font-bold w-full">{{ poCases[counter].default_units_per_case * poRecipe.amount }}</div>
                        </div>

                    </div>

                    <div v-if="poCases[counter].default_units_per_case">
                        <DataTable :value="selectRecipeElements(poRecipe.recipe_id)">
                            <Column field="name" header="Product Name" />
                            <Column field="qty" header="Units per Box" >
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
                                    ${{ formatCurrency(getProductInfo(data.product_id,'price_2023')) }}
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

                <Button label="Add another product" text @click="addBulkLine(recipeArray)"/> 

                
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
                                <Dropdown v-model="poBox.product_id" required="true" 
                                placeholder="Select a Product" class="md:w-14rem" editable
                                :options="selectVendorProducts(purchaseOrder.vendor_id, 'raw')"
                                optionLabel="name"
                                filter
                                @change="poBox.units_per_case = onProductSelection(poBox.product_id); poBox.total = poBox.amount*poBox.units_per_case;"
                                optionValue="product_id"
                                :virtualScrollerOptions="{ itemSize: 38 }"
                                :class="{'p-invalid': submitted && !poBox.product_id}" 
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
                                v-model="poBox.amount" showButtons/>
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
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(poBox.amount/poBox.units_per_case)*poBox.units_per_case }}</div>
                            </div>

                            <div v-if="poBox.units_per_case && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Boxes:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ Math.ceil(poBox.amount/poBox.units_per_case) }}</div>
                            </div>

                            <div v-if="poBox.product_id" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Unit Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ getUnitCost(poBox.product_id) }}</div>
                            </div>

                            <div v-if="poBox.product_id && selectedOrderType === 'By Box'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ formatCurrency(getUnitCost(poBox.product_id)*(poBox.units_per_case * poBox.amount)) }}</div>
                            </div>

                            <div v-if="poBox.product_id && selectedOrderType === 'By Unit'" class="field">
                                <label class="flex justify-content-center font-bold w-full" for="total">Total Cost:</label>
                                <div class="flex justify-content-center font-bold w-full">{{ formatCurrency(getUnitCost(poBox.product_id)*(Math.ceil(poBox.amount/poBox.units_per_case)*poBox.units_per_case)) }}</div>
                            </div>

                        </div>

                    </div>

                </template>

            <Button label="Add another product" text @click="addBulkLine(poBoxes)"/>

            </div>

            <template #footer>
                <!-- Adding the Total Price line fixed the syntax highlighting everywhere else -->
                <div v-if="loading" style="z-index: 1" class="flex flex-start font-bold"> LOADING <ProgressSpinner style="width: 15px; height: 15px" fill="transparent" /> </div>
                <div class="flex flex-start font-bold">Total Units: {{ calculatePoUnitTotal() }}</div>
                <div class="flex flex-start font-bold">Total Price: {{ formatCurrency(calculatePoCostTotal()) }}</div>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog"/>
                <Button label="Save" icon="pi pi-check"  text @click="validate" />
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
                    <Dropdown v-model="poBox.location"
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
        
	</div>
</template>

<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import action from "../components/utils/axiosUtils";
import importAction from "../components/utils/importUtils";

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
            editingRows: [],

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
            statusChangeDialog: false,
            receivedDialog: false,
            newStatus: "",

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
            reqPoBoxes: [] as any[],
            amount: 1,
            displayStatus: "",
            deliveredDataTableArray: [] as any[],

            //VENDOR VARIABLES
            vendors: [] as any[],
            vendorDialog: false,

            //RECIPE VARIABLES
            recipes: [] as any[],
            recipeArray: [] as any[],
            recipeElements: [] as any[],
            detailedRecipes: [] as any[],
            poRecipes: [] as any[],

            //LOCATION VARIABLES
            locations: [] as any[],
            locationToCreate: {} as any,
            locationDialog: false,
            additionalLocationDialog: false,

            //MISC VARIABLES
            today: "",
            loading: false,
            statuses: [
                'Draft',
                'Submitted',
				'Ordered',
                'Inbound',
                'Partially Delivered',
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
                this.loading = true;
                await this.getVendors();
                await this.getPurchaseOrders();
                await this.getProducts();
                await this.getBoxes();
                await this.getRecipes();
                await this.getLocations();
                this.getDate();
                this.loading = false;


            } catch (error) {
                console.log(error);
            }
        },

        async getPurchaseOrders(){
            try {
                
                this.purchaseOrders = await action.getPurchaseOrders();
                this.poRecipes = await action.getPurchaseOrderRecipes();

                this.purchaseOrders.forEach(po => {
                    if(po.date_ordered)
                        po.date_ordered = po.date_ordered.split('T')[0];
                    if(po.date_received)
                        po.date_received = po.date_received.split('T')[0];
                });
                
                console.log("PURCHASE ORDERS", this.purchaseOrders);
                console.log("PO RECIPES ", this.poRecipes);
                
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

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-25-2024
        async getRecipes(){
            try {
                this.recipes = await action.getRecipes();
                this.recipeElements = await action.getRecipeElements();

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
        selectRecipeElements(recipeId: any){
            
            console.log("RECIPE  ", recipeId);
            
            let inputProducts = this.recipeElements.filter(re => re.type === 'input' && re.recipe_id === recipeId);
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

        //Description: Gets a product key from the id
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-30-2024
        //Date Last Edited: 5-30-2024
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

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 7-1-2024
        //Date Last Edited: 7-1-2024
        getProductInfo(productId: number, field: string){
            let prodKey = this.products.find(p => p.product_id === productId);
            //console.log(prodKey)
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
            //CHECK HOW TO STOP THE FUNCTION FROM RUNNING FOR EVERY ARRAY VALUE
            //console.log("rawRecEl ",rawRecEl);
            //console.log("Po CASE ",poCase);
            let unitsPerCase = 0;
            if(poCase.default_units_per_case)
                unitsPerCase = poCase.default_units_per_case;
            else if(poCase.units_per_case)
                unitsPerCase = poCase.units_per_case;
            return rawRecEl.qty*(unitsPerCase * recipeAmount);
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        getTotalUnitsOrdered(rawRecEl: any, poCase: any, recipeAmount: number){
            let rawBox = this.products.find(p => p.product_id === rawRecEl.product_id);
            return this.getRawBoxTotal(rawRecEl, poCase, recipeAmount) * rawBox.default_units_per_case;
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-1-2024
        getRawBoxTotal(rawRecEl: any, poCase: any, recipeAmount: number){
            let rawBox = this.products.find(p => p.product_id === rawRecEl.product_id);
            return Math.ceil(this.getTotalUnitsNeeded(rawRecEl, poCase, recipeAmount) / rawBox.default_units_per_case);
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
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID);
            if (usedBoxes.length !== 0)
                usedBoxes.forEach(b => total+=b.units_per_case);

            
            return total;
        },
        getCreatedCostTotal(poID: number){
            let total = 0;
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID);
            usedBoxes.forEach(b => {
                let prod = this.products.find(p => p.product_id === b.product_id);
                total+=(b.units_per_case*prod.price_2023);
            });

            if (this.purchaseOrder.discount){
                const discountDecimal = 1 - (this.purchaseOrder.discount/100);
                total = total * discountDecimal;
            }

            return total;
        },

        //Description: Creates a pool of raw products that don't have a plan
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-31-2024
        //Date Last Edited: 5-31-2024
        getPool(poId: number){
            let boxes = this.uBoxes.filter(b => b.purchase_order_id === poId);
            let cases = this.pCases.filter(c => c.purchase_order_id === poId);

            let recipeCombos = [] as any[];

            let poolProd = [] as any[];

            let caseTypes = this.groupProducts(cases);
            let boxTypes = this.groupProducts(boxes);

            caseTypes.forEach((caseType: { product_id: any; }) => {
                let recipes = this.recipes.filter(r => caseType.product_id === r.product_made);
                //let rawBox = boxTypes.find()
            });

            let pool = this.groupProducts(poolProd);

            return pool;
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
                const key = product.product_id + ':' + product.status + ':' + product.units_per_case + ':' + product.location;
                //console.log("KEY", key);
                //console.log("MAP", map);
                if (map[key]) { // if it already exists, incremenet
                    map[key].amount++;
                    //console.log(map[key].amount);
                }
                else // otherwise, add it to the map
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, status: product.status, amount: 1 };
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
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, amount: 1 };
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
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, amount: 1 };
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
                    map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, amount: 1 };
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
                vendorProducts = this.procProducts.filter(p => p['vendor'] == poVendor)
            }

            else if (status == 'raw'){
                vendorProducts = this.unprocProducts.filter(p => p['vendor'] == poVendor)
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
        openNew() {

            this.vendorDialog = false;
            this.poBoxes = [];
            this.poCases = [];
            this.recipeArray = [];
            this.selectedOrderType = "";
            this.amount = 1;

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
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: 7-03-2024
        //Date Last Edited: 7-03-2024
        onRecipeSelection(recipeId: number, counter: number){
            let recipeElement = this.recipeElements.find(re => re.recipe_id === recipeId && re.type === 'output');
            console.log("RECIPE ELEMENT, ", recipeElement);
            this.poCases[counter] = this.products.find(p => p.product_id === recipeElement.product_id);
            console.log("PO CASE", this.poCases[counter]);
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
            let errText = [];
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
                if (c.amount < 1)
                    errAmount++;
            })

            this.poCases.forEach((r: any) => {
                if (r.amount < 1)
                    errAmount++;
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

                    this.loading = false;
                    this.purchaseOrderDialog = false;
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

                /*if (this.purchaseOrder.date_ordered) {
                    this.purchaseOrder.date_ordered = this.purchaseOrders[0].date_ordered.split('T')[0];
                }
                if (this.purchaseOrder.date_received){
                    this.purchaseOrder.date_received = this.purchaseOrders[0].date_received.split('T')[0];
                }*/

                if (this.purchaseOrder.status != 'Delivered')
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

        //Description: Checks the boxes actually received in the PO vs the boxes requested and alocates the 
        // correct amount to either delivered or back-ordered
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 6-04-2024
        async alocateBoxes(){
            try {
                //console.log("BULK CASES IN ALOCATE ",this.poBoxes);
                //console.log("REQUESTED BOXES ", this.reqPoBoxes);

                if (!this.purchaseOrder.date_received)
                    this.purchaseOrder.date_received = this.today;

                if(this.purchaseOrder.status === "Partially Delivered"){
                    this.purchaseOrder.status = 'Delivered';
                    console.log("IN PARTIALLY DELIVERED");

                    let boxesToInsert = [] as any[];

                    this.reqPoBoxes = this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && box.status === "BO"));

                    this.reqPoBoxes.forEach(reqBox => {
                        let receivedBoxArray = this.checkBoxes("Received");
                        let receivedBox = receivedBoxArray.find(rb => rb.product_id === reqBox.product_id);

                        let awaitedBoxArray = this.checkBoxes("Awaited");
                        let awaitedBox = awaitedBoxArray.find(ab => ab.product_id === reqBox.product_id)

                        console.log("REQUESTED BOXES ", reqBox, " ACTUAL RECEIVED BOXES ", receivedBox, "AND AWAITED BOXES ", awaitedBox);

                        if(!reqBox.total)
                            reqBox.total = reqBox.amount * reqBox.units_per_case;

                        if(!awaitedBox.total)
                            awaitedBox.total = awaitedBox.amount * awaitedBox.units_per_case;

                        let backorderUnits = reqBox.total - awaitedBox.total;
                        let backorderBoxes = backorderUnits/awaitedBox.units_per_case;
                        let wholeBackorderBoxAmount = Math.floor(backorderBoxes);

                        let poBoxUnitsPerCase = awaitedBox.units_per_case;

                        console.log("REQUESTED UNIT AMOUNT - RECEIVED UNIT AMOUNT = BACKORDER UNIT AMOUNT");
                        console.log("REQ", reqBox.total, " - REC", awaitedBox.total, " = LEFT", backorderUnits);

                        //Get the specific decimal number for partial box purposes. 12 Received boxes might actually be 11.5
                        let actualReceivedBoxes = awaitedBox.total/poBoxUnitsPerCase;
                        let wholeReceivedBoxAmount = Math.floor(actualReceivedBoxes);

                        console.log("REQUESTED BOX AMOUNT - RECEIVED BOX AMOUNT = BACKORDER BOX AMOUNT");
                        console.log("WHOLE BOX VIEW");
                        console.log("REQ", reqBox.amount, " - REC", awaitedBox.amount, " = BO", wholeBackorderBoxAmount);

                        console.log("DECIMAL BOX VIEW");
                        console.log("REQ", reqBox.amount, " - REC", awaitedBox.total/awaitedBox.units_per_case , " = BO", backorderBoxes)
                        
                        //Gets the decimal value if one of the leftover boxes is partial
                        let remainder = actualReceivedBoxes - wholeReceivedBoxAmount;

                        let partialBoxAmount = Math.round(remainder*poBoxUnitsPerCase);

                        let backOrderBoxAmount = 0;
                        if (partialBoxAmount>0){
                            backOrderBoxAmount = poBoxUnitsPerCase-partialBoxAmount;
                        }

                        console.log("REMAINDER * UNITS PER CASE = PARTIAL BOX AMOUNT");
                        console.log("REM", remainder," * UNITS", awaitedBox.units_per_case," = PARTIAL",partialBoxAmount);

                        console.log("BACK ORDER BOX AMOUNT", backOrderBoxAmount);

                        let boxes = this.uBoxes.filter(box => box.purchase_order_id === awaitedBox.purchase_order_id && box.product_id === awaitedBox.product_id && box.status !== 'Ready');

                        //CHANGE THE WHOLEBACKORDERBOXAMOUNT TO WHOLE RECEIVED BOX AMOUNT. HAD IT SWITCHED BEFORE.
                        //ALSO GET RID OF LOOP BECAUSE WE ARE ALREADY IN THE REQ BOXES LOOP
                        boxes.forEach(box => {
                            if(wholeReceivedBoxAmount > 0){
                                console.log("FULL BOX");
                                box.status = 'Ready';
                                box.location = awaitedBox.location;
                                box.date_received = this.today;
                                boxesToInsert.push(box);
                                wholeReceivedBoxAmount--;
                            } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount > 0){
                                console.log("PARTIAL FULL AND BACKORDER BOXES");
                                //If a partial box arrives, update the last box amount to partial amount a create 
                                // an additional box whose status is back ordered
                                box.units_per_case = partialBoxAmount;
                                box.status = 'Ready';
                                box.date_received = this.today;

                                boxesToInsert.push(box);

                                let boBox = [] as any[];
                                boBox[<any>'name'] = box.name;
                                boBox[<any>'product_id'] = box.product_id
                                boBox[<any>'purchase_order_id'] = box.purchase_order_id
                                boBox[<any>'units_per_case'] = backOrderBoxAmount;
                                boBox[<any>'status'] = 'BO'

                                //EVENTUALLY, JUST ADD THE BOBOX DIRECTLY HERE
                                boxesToInsert.push(boBox);

                                partialBoxAmount = 0;
                                this.purchaseOrder.status = 'Partially Delivered'
                            } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount == 0 && wholeBackorderBoxAmount > 0) {
                                console.log("BACKORDER BOX");
                                //If no partial box arrives, update the remaining box amounts to backorder
                                box.status = 'BO';
                                box.location = null;
                                boxesToInsert.push(box);
                                this.purchaseOrder.status = 'Partially Delivered'
                                wholeBackorderBoxAmount --;
                            }
                        })                    
                    })

                    console.log(boxesToInsert);

                    let insertArray = [] as any[];

                    //AT SOME POINT, CHANGE THE EDIT FUNCTION TO ALLOW BULK EDITS AND JUST ADD THE BO BOX IN THE 
                    //PREVIOUS FOREACH FUNCTION
                    boxesToInsert.forEach(async box => {
                        if (box.case_id){
                            console.log("PRODUCT NAME: ", box.name, "BOX UNIT AMOUNT: ", box.units_per_case, "BOX STATUS: ", box.status)
                            //await action.editCase(requestedBox);
                            let tempArray = [box.case_id, box.product_id, box.units_per_case, box.location, box.notes, box.date_received, box.status, box.purchase_order_id];
                            insertArray.push(tempArray);
                        } else {
                            console.log("BACK ORDERED PARTIAL BOX", box);
                            await action.addCase(box);
                        }
                    })
                    
                    await action.bulkEditCases(insertArray);

                    console.log("BOXES TO INSERT ", boxesToInsert);
                }
                else{
                    this.purchaseOrder.status = 'Delivered';
                    let boxesToInsert = [] as any[];

                    this.reqPoBoxes.forEach(reqBox => {
                        let poBox = this.poBoxes.find(poBox => poBox.product_id === reqBox.product_id);

                        console.log("REQUESTED BOX ", reqBox, " AND ACTUAL RECEIVED BOX ", poBox);

                        if(!reqBox.total)
                            reqBox.total = reqBox.amount * reqBox.units_per_case;

                        if(!poBox.total)
                            poBox.total = poBox.amount * poBox.units_per_case;

                        let backorderUnits = reqBox.total - poBox.total;
                        let backorderBoxes = backorderUnits/poBox.units_per_case;
                        let wholeBackorderBoxAmount = Math.floor(backorderBoxes);

                        let poBoxUnitsPerCase = poBox.units_per_case;

                        console.log("REQUESTED UNIT AMOUNT - RECEIVED UNIT AMOUNT = BACKORDER UNIT AMOUNT");
                        console.log("REQ", reqBox.total, " - REC", poBox.total, " = LEFT", backorderUnits);

                        //Get the specific decimal number for partial box purposes. 12 Received boxes might actually be 11.5
                        let actualReceivedBoxes = poBox.total/poBoxUnitsPerCase;
                        let wholeReceivedBoxAmount = Math.floor(actualReceivedBoxes);

                        console.log("REQUESTED BOX AMOUNT - RECEIVED BOX AMOUNT = BACKORDER BOX AMOUNT");
                        console.log("WHOLE BOX VIEW");
                        console.log("REQ", reqBox.amount, " - REC", poBox.amount, " = BO", wholeBackorderBoxAmount);

                        console.log("DECIMAL BOX VIEW");
                        console.log("REQ", reqBox.amount, " - REC", poBox.total/poBox.units_per_case , " = BO", backorderBoxes)
                        
                        //Gets the decimal value if one of the leftover boxes is partial
                        let remainder = actualReceivedBoxes - wholeReceivedBoxAmount;

                        let partialBoxAmount = Math.round(remainder*poBoxUnitsPerCase);

                        let backOrderBoxAmount = 0;
                        if (partialBoxAmount>0){
                            backOrderBoxAmount = poBoxUnitsPerCase-partialBoxAmount;
                        }

                        console.log("REMAINDER * UNITS PER CASE = PARTIAL BOX AMOUNT");
                        console.log("REM", remainder," * UNITS", poBox.units_per_case," = PARTIAL",partialBoxAmount);

                        console.log("BACK ORDER BOX AMOUNT", backOrderBoxAmount);

                        let boxes = this.uBoxes.filter(box => box.purchase_order_id === poBox.purchase_order_id && box.product_id === poBox.product_id && box.status !== 'Ready');

                        //CHANGE THE WHOLEBACKORDERBOXAMOUNT TO WHOLE RECEIVED BOX AMOUNT. HAD IT SWITCHED BEFORE.
                        //ALSO GET RID OF LOOP BECAUSE WE ARE ALREADY IN THE REQ BOXES LOOP
                        boxes.forEach(box => {
                            if(wholeReceivedBoxAmount > 0){
                                console.log("FULL BOX");
                                box.status = 'Ready';
                                box.date_received = this.today;
                                boxesToInsert.push(box);
                                wholeReceivedBoxAmount--;
                            } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount > 0){
                                console.log("PARTIAL FULL AND BACKORDER BOXES");
                                //If a partial box arrives, update the last box amount to partial amount a create 
                                // an additional box whose status is back ordered
                                box.units_per_case = partialBoxAmount;
                                box.status = 'Ready';
                                box.date_received = this.today;

                                boxesToInsert.push(box);

                                let boBox = [] as any[];
                                boBox[<any>'name'] = box.name;
                                boBox[<any>'product_id'] = box.product_id
                                boBox[<any>'purchase_order_id'] = box.purchase_order_id
                                boBox[<any>'units_per_case'] = backOrderBoxAmount;
                                boBox[<any>'status'] = 'BO'

                                //EVENTUALLY, JUST ADD THE BOBOX DIRECTLY HERE
                                boxesToInsert.push(boBox);

                                partialBoxAmount = 0;
                                this.purchaseOrder.status = 'Partially Delivered'
                            } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount == 0 && wholeBackorderBoxAmount > 0) {
                                console.log("BACKORDER BOX");
                                //If no partial box arrives, update the remaining box amounts to backorder
                                box.status = 'BO';
                                boxesToInsert.push(box);
                                this.purchaseOrder.status = 'Partially Delivered'
                                wholeBackorderBoxAmount --;
                            }
                        })                    
                    })

                    console.log(boxesToInsert);

                    let insertArray = [] as any[];

                    //AT SOME POINT, CHANGE THE EDIT FUNCTION TO ALLOW BULK EDITS AND JUST ADD THE BO BOX IN THE 
                    //PREVIOUS FOREACH FUNCTION
                    boxesToInsert.forEach(async box => {
                        if (box.case_id){
                            console.log("PRODUCT NAME: ", box.name, "BOX UNIT AMOUNT: ", box.units_per_case, "BOX STATUS: ", box.status, "BOX LOCATION: ", box.location)
                            //await action.editCase(requestedBox);
                            let tempArray = [box.case_id, box.product_id, box.units_per_case, box.location, box.notes, box.date_received, box.status, box.purchase_order_id];
                            insertArray.push(tempArray);
                        } else {
                            console.log("BACK ORDERED PARTIAL BOX", box);
                            await action.addCase(box);
                        }
                    })
                    
                    await action.bulkEditCases(insertArray);

                    console.log("BOXES TO INSERT ", boxesToInsert);
                }
                
            } catch (error) {
                console.log(error);
                //this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
            }
        },

        async alocateBoxesOld(){
            try {
                console.log("BULK CASES IN ALOCATE ",this.poBoxes);
                console.log("REQUESTED BOXES ", this.reqPoBoxes);

                //this.purchaseOrder.status = 'Delivered';

                this.poBoxes.forEach(box => {
                    let qty = box.units_per_case;
                    let boxAmount = box.amount;

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

                    this.reqPoBoxes.forEach(requestedBox => {
                        console.log(requestedBox)
                        if (requestedBox.product_id == box.product_id){
                            if(wholeBoxAmount > 0){
                                requestedBox.status = 'Ready';
                                requestedBox.date_received = this.today;
                                wholeBoxAmount--;
                            } else if (wholeBoxAmount == 0 && partialBox > 0){
                                //If a partial box arrives, update the last box amount to partial amount a create 
                                // an additional box whose status is back ordered
                                let boBox = [] as any[];
                                boBox[<any>'name'] = requestedBox.name;
                                boBox[<any>'product_id'] = requestedBox.product_id
                                boBox[<any>'purchase_order_id'] = requestedBox.purchase_order_id

                                requestedBox.units_per_case = partialBox;
                                requestedBox.status = 'Ready';
                                requestedBox.date_received = this.today;

                                boBox[<any>'units_per_case'] = backOrderBoxAmount;
                                boBox[<any>'status'] = 'BO'

                                //EVENTUALLY, JUST ADD THE BOBOX DIRECTLY HERE
                                this.reqPoBoxes.push(boBox);

                                partialBox = 0;

                                this.purchaseOrder.status = 'Partially Delivered'
                            } else if (wholeBoxAmount == 0 && partialBox == 0) {
                                //If no partial box arrives, update the remaining box amounts to backorder
                                requestedBox.status = 'BO';
                                this.purchaseOrder.status = 'Partially Delivered'
                            }
                        }
                    })
                })

                console.log(this.reqPoBoxes);

                //AT SOME POINT, CHANGE THE EDIT FUNCTION TO ALLOW BULK EDITS AND JUST ADD THE BO BOX IN THE 
                //PREVIOUS FOREACH FUNCTION
                this.reqPoBoxes.forEach(async requestedBox => {
                    console.log("PRODUCT NAME: ", requestedBox.name, "BOX AMOUNT: ", requestedBox.units_per_case, "BOX STATUS: ", requestedBox.status)
                    if (requestedBox.case_id){
                        await action.editCase(requestedBox);
                    } else {
                        await action.addCase(requestedBox);
                    }
                })
            } catch (error) {
                console.log(error);
                this.$toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
            }
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-5-2024
        async confirmCreate(){
            try {
                this.purchaseOrders.push(this.purchaseOrder);
                let addedPurchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);
                //let addedPurchaseOrderId = '';

                console.log("PO ID BEFORE VALUES", addedPurchaseOrderId);

                let casesToInsert = [] as any[];

                let recipesToInsert = [] as any[];

                console.log("PO CASES", this.poCases);
                console.log("RECIPES ", this.recipeArray);

                this.recipeArray.filter(r => r.recipe_id).forEach(r => {
                    let tempArray = [addedPurchaseOrderId, r.recipe_id, r.amount];
                    recipesToInsert.push(tempArray);

                    let processedRecEl = this.recipeElements.find(recEl => recEl.recipe_id === r.recipe_id && recEl.type === 'output');

                    let processedCaseKey = this.products.find(prod => prod.product_id === processedRecEl.product_id);

                    let procCase = {} as any;

                        procCase.product_id = processedCaseKey.product_id;
                        procCase.units_per_case = processedCaseKey.default_units_per_case;
                        procCase.purchase_order_id = addedPurchaseOrderId;
                        if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                            procCase.status = this.purchaseOrder.status;

                        if(this.purchaseOrder.status === 'Delivered')
                            procCase.date_received = this.purchaseOrder.date_received;

                    for (let recIdx = 0; recIdx < r.amount; recIdx++){
                        casesToInsert.push(procCase);
                    }

                    let rawRecElArray = this.recipeElements.filter(recEl => recEl.recipe_id === r.recipe_id && recEl.type === 'input');

                    //c.product_id, c.units_per_case, c.location, c.notes, c.date_received, c.status, c.purchase_order_id

                    rawRecElArray.forEach(rawRecEl => {
                        let rawKey = this.products.find(prod => prod.product_id === rawRecEl.product_id);

                        let rawBox = {} as any;

                        rawBox.product_id = rawKey.product_id;
                        rawBox.units_per_case = rawKey.default_units_per_case;
                        rawBox.purchase_order_id = addedPurchaseOrderId;
                        if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                            rawBox.status = this.purchaseOrder.status;

                        if(this.purchaseOrder.status === 'Delivered')
                            rawBox.date_received = this.purchaseOrder.date_received;

                        let loopAmount = this.getRawBoxTotal(rawRecEl, procCase, r.amount);

                        for (let recIdx = 0; recIdx < loopAmount; recIdx++){
                            casesToInsert.push(rawBox);
                        }
                    })
                })

                console.log("RECIPES TO INSERT ",recipesToInsert)
                await action.bulkAddPurchaseOrderRecipe(recipesToInsert);

                /* this.poCases.filter(c => c.product_id).forEach(async (indivCase: any) => {
                    if (indivCase.product_id){

                        let indivProcKey = this.products.find(p => p.product_id === indivCase.product_id);

                        if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                            indivCase.status = this.purchaseOrder.status;
                        indivCase.units_per_case = indivProcKey.default_units_per_case;
                        indivCase.purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

                        for(let amountIdx = 0; amountIdx < indivCase.amount; amountIdx++){
                            console.log("INDIVCASE: ", indivCase);
                            //await action.addCase(indivCase)
                            casesToInsert.push(indivCase);

                            let recipesUsed = this.recipes.filter(r => r.product_made === indivCase.product_id);

                            console.log("RECIPES USED",recipesUsed);

                            recipesUsed.forEach(async (recRawProd: any) => {
                                let indivRawKey = this.products.find(p => p.product_id === recRawProd.product_needed);
                                
                                let indivRawProd = {} as any;

                                if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                                    indivRawProd.status = this.purchaseOrder.status;

                                indivRawProd.product_id = indivRawKey.product_id;
                                if(indivCase.notes)
                                    indivRawProd.notes = indivCase.notes;
                                indivRawProd.units_per_case = indivRawKey.default_units_per_case;
                                indivRawProd.purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

                                let loopAmount = this.getRawBoxTotal(indivRawKey, indivCase);

                                console.log("LOOP AMOUNT", loopAmount);

                                for(let prodIdx = 0; prodIdx < loopAmount; prodIdx++){
                                    console.log("INDIVRAWPROD: ", indivRawProd);
                                    //await action.addCase(recRawProd.product);
                                    casesToInsert.push(indivRawProd);

                                }
                            })
                        }
                    }
                }); */

                //this.poBoxes = this.poBoxes.filter(b => b.product_id);

                this.poBoxes.filter(b => b.product_id).forEach(async (rawProduct: any) => {
                    let rawKey = this.products.find(p => p.product_id === rawProduct.product_id);

                    if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                        rawProduct.status = this.purchaseOrder.status;

                    rawProduct.units_per_case = rawKey.default_units_per_case;
                    rawProduct.purchase_order_id = addedPurchaseOrderId;

                    for(let prodIdx = 0; prodIdx < rawProduct.amount; prodIdx++){
                        console.log("RAWPRODUCT: ", rawProduct);
                        //await action.addCase(rawProduct);
                        casesToInsert.push(rawProduct);
                    }
                });

                console.log("CASES TO INSERT: ", casesToInsert);

                let finalCaseArray = [] as any[];
                    casesToInsert.forEach(c =>{
                        if(!c.location)
                            c.location = null;
                        if(!c.notes)
                            c.notes = null;
                        if(!c.date_received)
                            c.date_received = null;
                        let tempArray = [c.product_id, c.units_per_case, c.location, c.notes, c.date_received, c.status, c.purchase_order_id]
                        finalCaseArray.push(tempArray);
                    })
                console.log("FINAL ARRAY", finalCaseArray);

                if(finalCaseArray.length > 0)
                    await action.bulkAddCases(finalCaseArray);

                //REMEMBER TO GET THE PRODUCTS AGAIN FOR AN UPDATED LIST
                console.log("ADDED PURCHASE ORDER ", addedPurchaseOrderId);
                await this.getPurchaseOrders();
                await this.getBoxes();

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
            this.purchaseOrder = {...purchaseOrder}; //ASK MICHAEL
            this.poCases = [];
            this.poBoxes = [];
            this.reqPoBoxes = [];

            let boxes = this.uBoxes.filter(b => b.purchase_order_id === this.purchaseOrder.purchase_order_id);
            let cases = this.pCases.filter(c => c.purchase_order_id === this.purchaseOrder.purchase_order_id);

            this.deliveredDataTableArray = this.getDeliveredDataTable(purchaseOrder.purchase_order_id, boxes);

            console.log("Boxes ",boxes);
            console.log("Cases ",cases);
            this.reqPoBoxes = this.groupProducts(boxes);
            this.poBoxes = this.groupProducts(boxes);
            this.poCases = this.groupProducts(cases);

            this.purchaseOrderDialog = true;
        },
        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Purchase Order Expanded', detail: event.data.purchase_order_name, life: 3000 });
            
            console.log("EVENT DATA ",event.data);

            this.displayStatus = "";
        },

        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-9-2024
        displayInfo(po: any){
            console.log(po);
            //console.log(this.cases);
            let displayArray = [] as any[];
            let linkedCases = [] as any[]; 
            let linkedBoxes = [] as any[];
            let poRecipes = this.poRecipes.filter(rec => po.purchase_order_id === rec.purchase_order_id);
            let poRecElements = [] as any[];

            poRecipes.forEach(poRec => {
                let recElArray = this.recipeElements.filter(recEl => recEl.recipe_id === poRec.recipe_id && recEl.type === 'output');
                recElArray.flatMap(recEl => recEl.amount = poRec.qty * recEl.qty);
                poRecElements.push(recElArray);
            });
            poRecElements = poRecElements.flat();
            let total = 0;

            linkedCases = this.pCases.filter(c => c.purchase_order_id === po.purchase_order_id);
            linkedBoxes = this.uBoxes.filter(b => b.purchase_order_id === po.purchase_order_id);
            //console.log(total);

            console.log("LINKED CASES: ", linkedCases);
            console.log("LINKED BOXES: ", linkedBoxes);

            //NOTE: NEED TO FIND A WAY TO SEPARATE THE OBJECTS BY STATUS. THAT WAY, IF SOME BOXES WERE
            //DELEVERED, AND SOME ARE ON BACK ORDER, THE USER CAN SEE THAT

            //DISPLAYING PROCESSED CASES--------------------------------------------------------------------
            if(po.displayStatus === "Processed"){

                if (linkedCases.length === 0){
                    poRecElements.forEach(recEl => {
                        let productKey = this.products.find(product => product.product_id === recEl.product_id);
                        productKey.amount = recEl.amount;
                        productKey.units_per_case = productKey.default_units_per_case;
                        productKey.status = po.status;
                        displayArray.push(productKey);
                    });
                } else {
                    displayArray = this.groupProducts(linkedCases);
                    /** @TODO Need to find a way to make sure that the display array is showing only the amount needed
                     * for the processed boxes, even if there are more raw products of the same type.
                     * IE: 30 Grinch boxes for Grinch/Cindy 2pk and 70 Grinch boxes for Grinch single,
                     * instead of 100 Grinch boxes for both
                     */
                }

                console.log("RECIPE ELEMENTS", poRecElements);
                /* Object.values(linkedCases.reduce((value, object) => {
                    if (value[object.product_id]) {
                        //value[object.product_id].amount += object.amount; 
                        value[object.product_id].amount++;

                    } else {
                        value[object.product_id] = { ...object , amount : 1
                        };
                    }
                    return value;
                    }, {}));; */
            } 
            //DISPLAYING RAW BOXES---------------------------------------------------------------------------
            else if (po.displayStatus === "Unprocessed"){
                if (linkedBoxes.length > 0)
                    displayArray = this.groupProducts(linkedBoxes);
                /* Object.values(linkedBoxes.reduce((value, object) => {
                    if (value[object.product_id]) {
                        //value[object.product_id].amount += object.amount; 
                        value[object.product_id].amount++;

                    } else {
                        value[object.product_id] = { ...object , amount : 1
                        };
                    }
                    return value;
                    }, {}));; */
            }

            console.log("DISPLAY ARRAY", displayArray);
            return displayArray;
        },
        
        /** 
         * Description: Displays the raw product info that pertains to each processed case in the PO
         * @param purchase_order_id {number} The purchase order ID
         * @param product_id {number} The ID of the output product
         * @param amount {number} The amount of output boxes made
         * @returns An array with the information of each input box required for the output boxes recipe
         *
         * Created by: Gabe de la Torre
         * Date Created: ???
         * Date Last Edited: 7-19-2024 
         */
        displayRawInfo(purchase_order_id: number, product_id: number, amount: number){
            console.log("PURCHASE ORDER:", purchase_order_id," PROCESSED PRODUCT ID:", product_id," AMOUNT:", amount);

            //Grab the linked po recipe for the inline processed product
            let linkedPoRec = this.poRecipes.find(rec => rec.purchase_order_id === purchase_order_id && this.recipeElements.find(r => r.product_id === product_id && r.type === 'output' && r.recipe_id === rec.recipe_id) !== undefined);
            
            let linkedCase = this.pCases.find(c => c.purchase_order_id === purchase_order_id && c.product_id === product_id);

            //let linkedRecEl = this.recipeElements.find(r => r.product_id === product_id && r.type === 'output');
            let rawRecInputs = this.recipeElements.filter(r => r.recipe_id === linkedPoRec.recipe_id && r.type === 'input');
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
         * Date Last Edited: 7-18-2024 
         */
        displayRawInfoMicheal(purchase_order_id: number, product_id: number, amount: number) {
        console.log("PURCHASE ORDER:", purchase_order_id," PROCESSED PRODUCT ID:", product_id," AMOUNT:", amount);
        // the recipe that is being used, determined by output product
        /**
         * @TODO rename to "recipeOutput"
         * @TODO What if there are multiple recipes that have this product as an output?
         * Or is this enforced as unique? This is why I recommended you to store the recipes
         * being used in the purchase order.
         */
        let linkedRecEl = this.recipeElements.find(r => r.product_id === product_id && r.type === 'output');
        // the input products given the recipe id
        /** @TODO rename to "rawRecInputs" */
        let rawRecEls = this.recipeElements.filter(r => r.recipe_id === linkedRecEl.recipe_id && r.type === 'input');

        // get the input boxes that are being used as inputs. Use a filter-map for-loop
        const inputBoxesAndRecEl = [] as any[];
        for(const b of this.uBoxes) {
            if(b.purchase_order_id !== purchase_order_id)
            continue;

            const inputEl = rawRecEls.find(r => r.product_id  === /* idk what field to use */ b.product_id);
            if(inputEl)
            inputBoxesAndRecEl.push({ box: b, rec: inputEl });
        }
        
        const numRecipesProcessed = amount / /* idk the field */ linkedRecEl.amount;
        return inputBoxesAndRecEl.map(({ box, rec }) => ({
            ...box,
            /* idk the field */ amount: rec.amount * numRecipesProcessed,
            leftover: box.amount - rec.amount * numRecipesProcessed
        }));
        },

        //Description: Gets the unit cost for a specific product
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 5-28-2024
        getUnitCost(product_id: number){
            //RUNS TWICE FOR SOME REASON, ASK MICHAEL AT SOME POINT
            //console.log("PRODUCT ID: ", product_id);
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

                case 'Ready':
                    return 'success';

                default:
                    //console.log("DEFAULT CASE ", c)
                    return 'info';
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
                
                this.getPurchaseOrders();
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
        calculatePoCostTotal(){
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
                            totalUnitCost = this.getUnitCost(b.product_id)*(Math.ceil(b.amount/b.units_per_case)*b.units_per_case)
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
        //Date Last Edited: 7-08-2024
        calculatePoUnitTotal(){
            let total=0;

            console.log("PO Boxes",this.poBoxes)
            //console.log("PO Cases",this.poCases);

            //If the PO is being edited
            if(this.purchaseOrder.purchase_order_id){
                //console.log(this.uBoxes);
                this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id).forEach(b => {
                    total += (b.units_per_case)
                });
            } //If the PO is being created
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
                            total += this.getTotalUnitsOrdered(recEl, processedRecElKey, poRec.amount);
                        });

                });
                this.poBoxes.forEach(b => {
                    if(b.product_id){
                        let totalUnitCost = 0;
                        if(this.selectedOrderType === 'By Box'){
                            totalUnitCost = (b.units_per_case * b.amount)
                        }
                        else if(this.selectedOrderType === 'By Unit'){
                            totalUnitCost = (Math.ceil(b.amount/b.units_per_case)*b.units_per_case)
                        }
                        total += totalUnitCost;
                    }
                });
            };

            
            // console.log(total);
            return total;
        },

        disablePoPhase(poStatus: string){

        },

        //Description: When a user wants to update their status, a dialog is opened.
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-06-2024
        //Date Last Edited: 6-06-2024
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
         * Date Created: 7-23-2024 
         * Date Last Edited: 7-23-2024 
         */
        async confirmStatusChange(){
            try {
                this.purchaseOrder.status = this.newStatus; 
                if (this.purchaseOrder.status === 'Ordered')
                this.purchaseOrder.date_ordered = this.today;

                await action.editPurchaseOrder(this.purchaseOrder);
                this.statusChangeDialog = false;
            } catch (error) {
                console.log(error);
            }
        },

        initFilters() {
            this.filters = {
                'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
            }
        },

        /** 
         * Description: Displays the raw product info that pertains to each processed case in the PO
         * @param boxType {string} A string with the value of either "Received", "Awaited", "All"
         * @returns An array based on the inputted boxType string
         * Received: All the recieved boxes
         * Awaited: All boxes yet to be delivered
         * All: All boxes belonging to the PO
         *
         * Created by: Gabe de la Torre
         * Date Created: 7-25-2024
         * Date Last Edited: 7-25-2024 
         */
        checkBoxes(boxType: string){
            let boxArray = [] as any[];

            //console.log("PO BOXES", this.poBoxes);
            //console.log("PO BOXES BY PRODUCT", this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id)));

            let allBoxes = this.groupReqProducts(this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id));

            //POSSIBLY CHECK FOR NOT EQUALS AS WELL
            let receivedBoxes = this.poBoxes.filter(boxLine => (boxLine.status !== 'Draft' && boxLine.status !== 'Submitted' && boxLine.status !== 'Ordered' && boxLine.status !== 'Inbound' && boxLine.status !== 'BO') || boxLine.status === 'Ready');
            //console.log("RECEIVED BOXES", receivedBoxes);

            //CHANGE TO INCOMING
            let awaitedBoxes = this.poBoxes.filter(boxLine => boxLine.status === 'Draft' || boxLine.status === 'Submitted' || boxLine.status === 'Ordered' || boxLine.status === 'Inbound' || boxLine.status === 'BO')
            // console.log("AWAITED BOXES", awaitedBoxes);

            if(boxType === 'Received'){
                boxArray = receivedBoxes;
            } else if (boxType === 'Awaited'){
                boxArray = awaitedBoxes;
            } else if (boxType === 'All'){
                boxArray = allBoxes;
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
            let receivedBoxes = this.poBoxes.filter(boxLine => (boxLine.status !== 'Draft' && boxLine.status !== 'Submitted' && boxLine.status !== 'Ordered' && boxLine.status !== 'Inbound' && boxLine.status !== 'BO') || boxLine.status === 'Ready');
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
            console.log(data);
            return [{ '!font-bold !text-primary-contrast': data.status === 'BO' }];
        },

        dataTableStyle(){
            return { backgroundColor: 'Black' };
        },

        rowStyle(data: any) {
            if (data.status === 'BO') {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Gold' };
            } else if (data.status === 'Draft') {
                return { font: 'bold', fontStyle: 'italic', backgroundColor: 'Blue' };
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

        rowStyleCompared(data: any){
            if (data.moment === 'Requested') {
                return { font: 'bold', backgroundColor: '#C0EEFF' };
            } else if (data.moment === 'Received') {
                return { font: 'bold', backgroundColor: '#bbffb5' };
            } else if (data.moment === 'Awaiting') {
                return { font: 'bold', backgroundColor: '#FFD580' };
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
                    box.location = newData.location;
                    //console.log("NEW DATA ",box);
                    //console.log("NEW DATA TOTAL ",box.total);
                }
            })

            this.deliveredDataTableArray.forEach(box => {
                if(box.case_id === data.case_id && box.moment === 'Awaiting'){
                    //console.log("OLD DATA ",box);
                    //console.log("EVENT DATA", newData);
                    //console.log("OLD DATA TOTAL",box.total);
                    //console.log("EVENT DATA TOTAL", newData.total);
                    box.amount = newData.amount;
                    box.total = newData.total;
                    box.location = newData.location;
                    //console.log("NEW DATA ",box);
                    //console.log("NEW DATA TOTAL ",box.total);
                }
            })
            //console.log(this.poBoxes.forEach(box => console.log(box.total)));
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
         getDeliveredDataTable(purchase_order_id: number, poBoxes: any[]){
            let tableData = [] as any[];
            // let boxes = this.uBoxes.filter(box => box.purchase_order_id === purchase_order_id);

            for(const box of poBoxes){
                box.moment = 'Requested';
                tableData.push(box);

                if (box.status === 'Ready'){
                    let readyBox = {} as any;
                    readyBox.case_id = box.case_id;
                    readyBox.date_received = box.data_received;
                    readyBox.location = box.location;
                    readyBox.name = box.name;
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

                if (box.status === 'BO'|| box.status === 'Draft'){
                    let awaitedBox = {} as any;
                    awaitedBox.case_id = box.case_id;
                    awaitedBox.date_received = box.data_received;
                    awaitedBox.location = box.location;
                    awaitedBox.name = box.name;
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

            const keyStringArray = ["moment"];
            const displayArray = this.groupProductsByKey(tableData, keyStringArray);
            displayArray.forEach((line: { total: number; amount: number; units_per_case: number; }) => {
                if(!line.total)
                    line.total = line.amount*line.units_per_case;
            });

            // console.log("DISPLAY ARRAY", displayArray);

            return displayArray;
        },

        setRowEditor(data: any){
            let toggle = false;

            if (data.moment === "Awaiting")
                toggle = true;

            return toggle;
        },

        formatSingleLocation(location: any[]){
            console.log(location)
            if(location){
                let curLoc = this.locations.find(l => l.location_id === location);

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

</style>
