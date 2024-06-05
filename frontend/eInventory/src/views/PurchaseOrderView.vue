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


                <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-envelope" v-tooltip.top="'Enter your username'" outlined rounded severity="help" class="mr-2"/>
                        <i class="pi pi-angle-right" style="color: slateblue"/>
                        <Button icon="pi pi-box" outlined rounded severity="info" class="mr-2"/>
                        <i class="pi pi-angle-right" style="color: slateblue"/>
                        <Button icon="pi pi-truck" outlined rounded severity="warning" class="mr-2"/>
                        <i class="pi pi-angle-right" style="color: slateblue"/>
                        <Button icon="pi pi-check" outlined rounded class="mr-2" @click="confirmOrderReceived(slotProps.data)" />
                        <!-- <Button icon="pi pi-times" outlined rounded severity="danger" @click="confirmCancelOrder(slotProps.data)" /> -->
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
                                    <DataTable :value="displayRawInfo(data.purchase_order_id, data.product_id, data.amount)">
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
                                        <Column header="Total Price" class="font-bold">
                                            <template #body = {data}>
                                                {{formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount))}}
                                            </template>
                                        </Column>
                                        <Column field="status" header="Status"/>
                                    </DataTable>
                                </template>

                            </DataTable>

                            <br><h4 class="font-bold">Raw Products with No Plan</h4>
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
                            </DataTable>
                        </div>

                        <div class="p-3" v-if="slotProps.data.displayStatus === 'Unprocessed'">
                            <h4>Unprocessed Product(s) in Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                            <DataTable :value="displayInfo(slotProps.data)">
                                <Column field="name" header="Name" />
                                <Column header="UPC">
                                    <template #body="{data}">
                                        {{ getUPC(data.product_id) }}
                                    </template>
                                </Column>
                                <Column field="units_per_case" header="Units per Case" />
                                <Column field="amount" header="Total # of Boxes" />
                                <Column header="Total # of Units">
                                    <template #body = {data}>
                                        {{ data.units_per_case * data.amount }}
                                    </template>
                                </Column>
                                <Column header="Unit Price">
                                    <template #body="{data}">
                                        ${{ formatCurrency(getUnitCost(data.product_id)) }}
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold">
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount)) }}
                                    </template>
                                </Column>
                                <Column field="status" header="Status" />
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
                <label for="date_ordered">Date Ordered</label>
                <Calendar id="date_ordered" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_ordered"/>
            </div>

            <div class="field">
                <label for="date_received">Date received</label>
                <Calendar id="date_received" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_received"/>
            </div>

            <div v-if="purchaseOrder.purchase_order_id">
                <!-- EDITING/////////////////////////////////////////////////////////////////////////////////// -->

                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Requested Product(s):</h3>
                </div>

                <DataTable :value="reqPoBoxes" rowGroupMode="subheader" groupRowsBy="name">
              
                    <template #groupheader="slotProps">
                        <div class="flex align-items-center gap-2">
                            <span class="flex justify-content-start w-full">{{ slotProps.data.name }}</span>
                            <div class="flex justify-content-end w-full">Total Number of Boxes: {{ slotProps.data.amount }}</div>
                            <div class="flex justify-content-end w-full">Requested Total QTY: {{ slotProps.data.amount*slotProps.data.units_per_case }}</div>
                        </div>
                    </template>
  
                </DataTable> <br>

                <div class="field">
                    <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full">Received Product(s):</h3>
                </div>

                <template class="caseCard" v-for="(poBox, counter) in poBoxes">

                    <div class ="caseCard">
                        <Button icon="pi pi-times" severity="danger" aria-label="Cancel" style="display:flex; justify-content: center;" @click="deleteBulkLine(poCases, counter)"/>

                        <h4 class="flex justify-content-start font-bold w-full">{{ poBox.name }}</h4><br>
                        <div class="block-div">

                            <div class="field">
                                <label for="qty">QTY:</label>
                                <InputNumber inputId="stacked-buttons" required="true" 
                                :class="{'p-invalid': submitted && !poBox.units_per_case}"
                                v-model="poBox.units_per_case" showButtons
                                @input="poBox.total = poBox.amount*poBox.units_per_case"/>
                                <small class="p-error" v-if="submitted && !poBox.units_per_case">Amount is required.</small>
                            </div>

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
                            <div class="field">
                                <label for="total">Location</label>
                                <InputText id="notes" v-model="poBox.location" rows="3" cols="20" />
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
                                @update=""/>
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
                            <DataTable :value="selectRecipe(poCase)">
                                <Column field="name" header="Product Name" />
                                <Column field="default_units_per_case" header="Units per Box" />
                                <Column header="Unit(s) per Bundle" >
                                    <template #body="{data}">
                                        {{ getBundleUnits(data.product_id, poCase.product_id) }}
                                    </template>
                                </Column>
                                <Column header="Total Units Needed">
                                    <template #body="{data}">
                                        {{  getTotalUnitsNeeded(data, poCase) }}
                                    </template>
                                </Column>
                                <Column header="Total Units Ordered" >
                                    <template #body="{data}">
                                        {{ getTotalUnitsOrdered(data, poCase) }}
                                    </template>
                                </Column>
                                <Column header="Raw Box Total" >
                                    <template #body="{data}">
                                        {{ getRawBoxTotal(data, poCase) }}
                                    </template>
                                </Column>
                                <Column header="Unit Price" >
                                    <template #body="slotProps">
                                        ${{ formatCurrency(slotProps.data.price_2023) }}
                                    </template>
                                </Column>
                                <Column header="Total Price" >
                                    <template #body="{data}">
                                        {{ formatCurrency(getTotalCost(data, poCase)) }}
                                    </template>
                                </Column>
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

                    <Button label="Add another product" text @click="addBulkLine(poBoxes)"/>
                </template>

            </div>

            <template #footer>
                <!-- Adding the Total Price line fixed the syntax highlighting everywhere else -->
                <div class="flex flex-start font-bold">Total Units: {{ calculatePoUnitTotal() }}</div>
                <div class="flex flex-start font-bold">Total Price: {{ formatCurrency(calculatePoCostTotal()) }}</div>
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
            reqPoBoxes: [] as any[],
            amount: 1,
            displayStatus: "",

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
                await this.getVendors();
                await this.getPurchaseOrders();
                await this.getProducts();
                await this.getBoxes();
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

                this.purchaseOrders.forEach(po => {
                    if(po.date_ordered)
                        po.date_ordered = po.date_ordered.split('T')[0];
                    if(po.date_received)
                        po.date_received = po.date_received.split('T')[0];
                });
                
                console.log(this.purchaseOrders);
                
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

        selectRecipe(product: any){

            //console.log("TESTING MAPS: ", this.recipes.filter(r => r.product_made === productMade.product_id));
            
            //console.log("PRODUCT  ", productMade);
            let usedProducts = [] as any[];

            let usedRecipes = this.recipes.filter(r => r.product_made === product.product_id);
            usedProducts = usedRecipes.flatMap(r => this.products.filter(p => p.product_id === r.product_needed));
            usedProducts.forEach(p => usedRecipes.find(r => p.product_id === r.product_needed))

            //console.log("RECIPES USED ", usedRecipes);
            //console.log("PRODUCTS USED ", usedProducts);
            //this.poCases[counter].recInfo = usedProducts;
            return usedProducts;
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

        getBundleUnits(productNeeded: number, productMade: number){
            //console.log("PRODUCT NEEDED ", productNeeded);
            //console.log("PRODUCT MADE, ", productMade);
            let recipe = [] as any[];
            recipe = this.recipes.find(r => r.product_needed === productNeeded && r.product_made === productMade);
            return recipe[<any>'units_needed'];
        },

        getTotalUnitsNeeded(rawBox: any, poCase: any){
            return this.getBundleUnits(rawBox.product_id, poCase.product_id)*(poCase.units_per_case * poCase.amount);
        },

        getTotalUnitsOrdered(rawBox: any, poCase: any){
            return this.getRawBoxTotal(rawBox, poCase) * rawBox.default_units_per_case;
        },

        getRawBoxTotal(rawBox: any, poCase: any){
            return Math.ceil(this.getTotalUnitsNeeded(rawBox, poCase) / rawBox.default_units_per_case);
        },
        getTotalCost(rawBox: any, poCase: any){
            return rawBox.price_2023*this.getTotalUnitsOrdered(rawBox, poCase); 
        },
        getCreatedUnitTotal(poID: number){
            let total = 0;
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID);
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

            boxes.forEach(b => {
                cases.forEach(c =>{
                    let rec = this.recipes.find(r => r.product_needed === b.product_id && r.product_made === c.product_id);

                    if(rec !== undefined)
                        recipeCombos.push(rec);
                });
            });

            console.log("COMBOS: ", recipeCombos);

            boxes.forEach(b => {
                let inArray = this.recipes.find(r => b.product_id === r.product_needed);

                if (inArray === undefined){
                    poolProd.push(b);
                }
            });

            /* let pool = Object.values(poolProd.reduce((newArray, currProd) => {
                //console.log(value);
                //console.log(object);
                if (newArray[currProd.product_id]) {
                    //newArray[currProd.product_id].amount += currProd.amount; 
                    newArray[currProd.product_id].amount++;

                } else {
                    newArray[currProd.product_id] = { ...currProd , amount : 1
                    };
                }
                return newArray;
                }, {}));; */

            let pool = this.groupProducts(poolProd);

            return pool;
        },

        //Description: Groups products together to get the total amount per product
        //
        //Created by: Gabe de la Torre
        //Date Created: 6-03-2024
        //Date Last Edited: 6-03-2024
        groupProducts(prodArray: any[]){
            let result = [] as any[];
            result = Object.values(prodArray.reduce((newArray, currProd) => {
                //console.log(newArray);
                //console.log(currProd);
                if (newArray[currProd.product_id] && newArray[currProd.product_id].status == currProd.status && newArray[currProd.product_id].units_per_case == currProd.units_per_case) {
                    //newArray[currProd.product_id].amount += currProd.amount; 
                    newArray[currProd.product_id].amount++;

                } else {
                    newArray[currProd.product_id] = { ...currProd , amount : 1
                    };
                }
                return newArray;
                }, {}));;

            return result;
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

        openNew() {

            this.vendorDialog = false;
            this.poBoxes = [];
            this.poCases = [];
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
                this.purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id);
                console.log(this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id));

                console.log("PURCHASE ORDER BEFORE AWAIT ",this.purchaseOrder);

                /*if (this.purchaseOrder.date_ordered) {
                    this.purchaseOrder.date_ordered = this.purchaseOrders[0].date_ordered.split('T')[0];
                }
                if (this.purchaseOrder.date_received){
                    this.purchaseOrder.date_received = this.purchaseOrders[0].date_received.split('T')[0];
                }*/

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
                console.log("BULK CASES IN ALOCATE ",this.poBoxes);

                this.purchaseOrder.status = 'Delivered';

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
        async confirmCreate(){
            try {
                this.purchaseOrders.push(this.purchaseOrder);
                let addedPurchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);

                let casesToInsert = [] as any[];

                //this.poCases = this.poCases.filter(c => c.product_id);

                console.log("PO CASES", this.poCases);

                this.poCases.filter(c => c.product_id).forEach(async (indivCase: any) => {
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
                });

                //this.poBoxes = this.poBoxes.filter(b => b.product_id);

                this.poBoxes.filter(b => b.product_id).forEach(async (rawProduct: any) => {
                    let rawKey = this.products.find(p => p.product_id === rawProduct.product_id);

                    if(this.purchaseOrder.status === 'Draft' || this.purchaseOrder.status === 'Submitted' ||this.purchaseOrder.status === 'Ordered' || this.purchaseOrder.status === 'Inbound' ||this.purchaseOrder.status === 'Delivered')
                        rawProduct.status = this.purchaseOrder.status;

                    rawProduct.units_per_case = rawKey.default_units_per_case;
                    rawProduct.purchase_order_id = addedPurchaseOrderId[0]['LAST_INSERT_ID()'];

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
        displayInfo(po: any){
            console.log(po);
            //console.log(this.cases);
            let displayArray = [] as any[];
            let linkedCases = [] as any[]; 
            let linkedBoxes = [] as any[];
            let total = 0;

            linkedCases = this.pCases.filter(c => c.purchase_order_id === po.purchase_order_id);
            linkedBoxes = this.uBoxes.filter(b => b.purchase_order_id === po.purchase_order_id);
            //console.log(total);

            //console.log("LINKED CASES: ", linkedCases);
            //console.log("LINKED BOXES: ", linkedBoxes);

            //NOTE: NEED TO FIND A WAY TO SEPARATE THE OBJECTS BY STATUS. THAT WAY, IF SOME BOXES WERE
            //DELEVERED, AND SOME ARE ON BACK ORDER, THE USER CAN SEE THAT

            //DISPLAYING PROCESSED CASES--------------------------------------------------------------------
            if(po.displayStatus === "Processed"){
                displayArray = this.groupProducts(linkedCases);
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
        //Displays the raw product info that pertains to each processed case in the PO
        displayRawInfo(purchase_order_id: number, product_id: number, amount: number){
            let linkedRecs = this.recipes.filter(r => r.product_made === product_id);
            let linkedBoxes = this.uBoxes.filter(b => b.purchase_order_id === purchase_order_id);
            
            /* let displayArray = Object.values(linkedBoxes.reduce((value, object) => {
                    if (value[object.product_id]) {
                        //value[object.product_id].amount += object.amount; 
                        value[object.product_id].amount++;

                    } else {
                        value[object.product_id] = { ...object , amount : 1
                        };
                    }
                    return value;
                    }, {}));; */

            let displayArray = this.groupProducts(linkedBoxes);

            displayArray = displayArray.filter((raw: any) => this.recipes.find(rec => rec.product_needed === raw.product_id && rec.product_made === product_id));
            console.log(linkedRecs);
            console.log(linkedBoxes);
            console.log(displayArray);

            return displayArray;
        },
        //Description: Gets the unit cost for a specific product
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 5-28-2024
        getUnitCost(product_id: number){
            //RUNS TWICE FOR SOME REASON, ASK MICHAEL AT SOME POINT
            //console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            console.log(prod.price_2023);
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

            console.log(prod.upc);
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
            switch (po.status) {
                case 'Draft':
                    return 'warning';
                
                case 'Submitted':
                    return 'help';

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
        //Date Last Edited: 6-04-2024
        calculatePoCostTotal(){
            let total=0;

            //If the PO is being edited
            if(this.purchaseOrder.purchase_order_id){
                this.poBoxes.forEach(b => {
                    total += this.getUnitCost(b.product_id)*(b.units_per_case * b.amount);
                })
            } // If the PO is being created
            else {
                this.poCases.forEach(c => {
                    if(c.product_id){
                        //console.log(c);
                        let rec = this.recipes.find(r => c.product_id === r.product_made);
                        let rawKey = this.products.find(p => p.product_id === rec.product_needed);
                        //console.log(rawKey);
                        total += this.getTotalCost(rawKey, c);
                    }
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
            return total;
        },

        //Description: Calculates the total units ordered in a PO
        //
        //Created by: Gabe de la Torre
        //Date Created: 5-29-2024
        //Date Last Edited: 6-04-2024
        calculatePoUnitTotal(){
            let total=0;

            //console.log("PO Boxes",this.poBoxes)
            //console.log("PO Cases",this.poCases);

            //If the PO is being edited
            if(this.purchaseOrder.purchase_order_id){
                this.poBoxes.forEach(b => {
                    total += (b.units_per_case * b.amount)
                });
            } //If the PO is being created
            else {
                this.poCases.forEach(c => {
                    if(c.product_id){
                        //console.log(c);
                        let rec = this.recipes.find(r => c.product_id === r.product_made);
                        let rawKey = this.products.find(p => p.product_id === rec.product_needed);
                        //console.log(rawKey);
                        total += this.getTotalUnitsOrdered(rawKey, c);
                    }
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

            
            //console.log(total);
            return total;
        },

        //STUFF THAT HASN'T BEEN CHECKED AND MOVED OVER YET-------------------------------------------------

        //https://codesandbox.io/p/sandbox/primevue-fileuploader-custom-q2dqhh?file=%2Fsrc%2FFileUploadDemo.vue%3A42%2C7-42%2C27
        onUpload(event: any) {
            importAction.onUpload(event, 'Processed Product Key');
            
            
        },
        exportCSV() {
            //this.$refs.dt.exportCSV();
            console.log("Functionality not finished");
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
