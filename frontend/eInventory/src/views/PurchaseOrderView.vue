<template>
    <div>
        <div class="card">
            <Toast />
            <Toolbar class="mb-4 po-toolbar">
                <template #start>
                    <div class="po-toolbar-filters">
                        <span class="p-input-icon-right po-toolbar-filter po-toolbar-filter--search">
                            <div v-tooltip.top="isSearchBarDisabled() ? 'Search bar disabled when filters are in place' : null">
                                <InputText v-model="searchText" placeholder="Search purchase orders..." :disabled="isSearchBarDisabled()"/>
                            </div>
                        </span>
                        <div class="po-view-toggle" role="group" aria-label="Purchase order layout mode">
                            <div v-tooltip.top="isFilterBoxDisabled() ? 'Filter box disabled when search is in place' : null">
                                <Button :icon="setFilterIcon()" class="p-button-rounded p-button-text" @click="openFilterMenu" :disabled="isFilterBoxDisabled()" />
                            </div>
                            <!-- <Button
                                label="Cards"
                                icon="pi pi-id-card"
                                class="po-view-toggle-btn"
                                :severity="poViewMode === 'cards' ? 'info' : 'secondary'"
                                :outlined="poViewMode !== 'cards'"
                                @click="setPoViewMode('cards')"
                            />
                            <Button
                                label="Table"
                                icon="pi pi-table"
                                class="po-view-toggle-btn"
                                :severity="poViewMode === 'table' ? 'info' : 'secondary'"
                                :outlined="poViewMode !== 'table'"
                                @click="setPoViewMode('table')"
                            />  -->
                        </div>
                    </div>
                </template>
                <template #end>
                    <Button
                        label="Receive Active Invoices"
                        icon="pi pi-download"
                        class="po-action-btn po-action-btn--receive"
                        :disabled="!activeReceiveInvoices.length"
                        @click="openReceiveAllActiveInvoices()"
                    />
                </template>

            </Toolbar> 

            <!-- :rowStyle="rowStyle" -->
            <div :class="['po-master-detail', { 'po-master-detail--table': poViewMode === 'table' }]">
            <div :class="['dt-loading-wrapper', 'po-master-detail__table', { 'po-master-detail__table--cards': poViewMode === 'cards' }]">
            <Transition name="loader-fade">
                <div v-if="tableLoading" class="dt-loading-overlay">
                    <div class="loading-card">
                        <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="3" fill="transparent" animationDuration=".9s" />
                        <span class="loading-label">Loading&hellip;</span>
                    </div>
                </div>
            </Transition>

            <div v-if="poViewMode === 'cards'" class="po-card-grid-wrapper">
                <div class="po-card-grid-header">
                    <h4 class="m-0">Manage Purchase Orders</h4>
                    <div class="po-header-actions">
                        <!-- <ZoomDropdown v-model="tableZoom" /> -->
                        <Button
                            label="New PO"
                            icon="pi pi-plus"
                            class="po-action-btn po-action-btn--primary"
                            @click="vendorSelect()"
                        />
                    </div>
                </div>

                <div v-if="purchaseOrders.length" class="po-card-grid">
                    <article
                        v-for="po in purchaseOrders"
                        :key="po.purchase_order_id"
                        class="po-card"
                        @click="openDetailDialog(po)"
                    >
                        <header class="po-card-header">
                            <div class="po-card-header-row">
                                <div class="po-card-text">
                                    <h5 class="po-card-title">{{ po.purchase_order_name }}</h5>
                                    <p class="po-card-subtitle">{{ getVendor(po.vendor_id) }} • {{ po.status || 'Draft' }}</p>
                                </div>

                                <div class="po-card-dots">
                                    <Button class="po-card-dot-appearance" text icon="pi pi-ellipsis-v"  v-tooltip.top="'Additional Actions'" @click.stop="togglePoPopup($event, po.purchase_order_id)" />
                                </div>
                            </div>

                            <Popover :ref="(el) => setPoPopupRef(el, po.purchase_order_id)">
                                <div class="popover-button-stack">
                                    <Button
                                        label="Add Invoice"
                                        icon="pi pi-plus"
                                        class="po-action-btn po-action-btn--inbound"
                                        @click.stop="openInboundWorkspace(po)"
                                    />
                                    <Button
                                        label="Receive"
                                        icon="pi pi-download"
                                        class="po-action-btn po-action-btn--receive"
                                        @click.stop="openReceiveInvoicesWorkspace(po)"
                                    />
                                    <Button
                                        label="Edit PO"
                                        icon="pi pi-pencil"
                                        class="po-action-btn po-action-btn--secondary"
                                        :disabled="po.status === ''"
                                        @click.stop="openEditWorkspace(po)"
                                    />
                                    <div v-tooltip.top="isOrderDeleteButtonDisabled(po) ? 'Only Orders with a status of Draft can be deleted.' : null">
                                    <Button
                                        label="Delete PO"
                                        icon="pi pi-trash"
                                        class="po-action-btn po-action-btn--danger"
                                        @click.stop="confirmDeletePurchaseOrder(po)"
                                        :disabled="isOrderDeleteButtonDisabled(po)"
                                    />
                                    </div>
                                </div>
                            </Popover>
                        </header>

                        <div class="po-progress-pill">
                            <div class="po-progress-track" :title="getPoProgressSummary(po)">
                                <div class="po-progress-segment po-progress-segment--delivered" :style="getPoProgressSegmentStyle(po, 'delivered')"></div>
                                <div class="po-progress-segment po-progress-segment--inbound" :style="getPoProgressSegmentStyle(po, 'inbound')"></div>
                                <div class="po-progress-segment po-progress-segment--ordered" :style="getPoProgressSegmentStyle(po, 'ordered')"></div>
                                <div class="po-progress-segment po-progress-segment--backordered" :style="getPoProgressSegmentStyle(po, 'back ordered')"></div>
                                <div class="po-progress-segment po-progress-segment--flagged" :style="getPoProgressSegmentStyle(po, 'flagged')"></div>
                                <div class="po-progress-segment po-progress-segment--other" :style="getPoProgressSegmentStyle(po, 'other')"></div>
                            </div>
                            <div class="po-progress-meta">{{ getPoProgressSummary(po) }}</div>
                        </div>

                        <div class="po-card-metrics">
                            <div class="po-card-metric">
                                <span class="po-card-metric-label">Total Units</span>
                                <span class="po-card-metric-value">{{ getCreatedUnitTotal(po.purchase_order_id) }}</span>
                            </div>
                            <div class="po-card-metric">
                                <span class="po-card-metric-label">Total Cost</span>
                                <span class="po-card-metric-value">{{ formatCurrency(getCreatedCostTotal(po.purchase_order_id, po.discount) || 0) }}</span>
                            </div>
                        </div>

                    </article>
                </div>

                <div v-else class="po-card-empty">No purchase orders found.</div>

                <div class="po-card-pagination">
                    <Paginator
                        :first="(currentPage - 1) * rowsPerPage"
                        :rows="rowsPerPage"
                        :totalRecords="totalRecords"
                        :rowsPerPageOptions="[5,10,25,100,500,1000]"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
                        @page="onPage"
                    />
                </div>
            </div>

            <DataTable v-else ref="dt" :value="purchaseOrders" v-model:selection="selectedPurchaseOrder" 
                class="po-main-table"
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
                tableStyle="min-width: 1600px"
                :style="{ fontSize: (15 * tableZoom) + 'px', zoom: tableZoom, width: '100%'}"
                :loading="tableLoading"
                :expandedRows="expandedRows" @rowExpand="onRowExpand"
                @page="onPage"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25,100,500,1000]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders">
                <template #header>
                    <div class="flex flex-wrap gap-2 align-items-center justify-content-between po-table-header">
                        <h4 class="m-0">Manage Purchase Orders</h4>
                        <div class="po-header-actions">
                            <ZoomDropdown v-model="tableZoom" />
                            <Button
                                label="New PO"
                                icon="pi pi-plus"
                                class="po-action-btn po-action-btn--primary"
                                @click="vendorSelect()"
                            />
                        </div>
                    </div>
                </template>

                <template #loading> Loading purchase orders. Please wait. </template>

                <template #empty> No purchase orders found. </template>

                <!-- <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column> -->

                <Column expander header="Order Info" style="width: 5rem" />

                <Column field="purchase_order_name" header="Purchase Order" sortable></Column>

                <Column header="Order Progress" sortable>
                    <template #body="slotProps">
                        <div class="po-progress-pill">
                            <div class="po-progress-track" :title="getPoProgressSummary(slotProps.data)">
                                <div
                                    class="po-progress-segment po-progress-segment--delivered"
                                    :style="getPoProgressSegmentStyle(slotProps.data, 'delivered')"
                                ></div>
                                <div
                                    class="po-progress-segment po-progress-segment--inbound"
                                    :style="getPoProgressSegmentStyle(slotProps.data, 'inbound')"
                                ></div>
                                <div
                                    class="po-progress-segment po-progress-segment--other"
                                    :style="getPoProgressSegmentStyle(slotProps.data, 'other')"
                                ></div>
                            </div>
                            <div class="po-progress-meta">{{ getPoProgressSummary(slotProps.data) }}</div>
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

                <!-- @TODO Create a button in the toolbar for opening all incomplete invoices for display -->
                <Column header="Inbound" :exportable="false">
                    <template #body="slotProps">
                        <Button
                            label="Inbound"
                            icon="pi pi-truck"
                            v-tooltip.top="'Create an invoice for this purchase order'"
                            class="po-action-btn po-action-btn--inbound"
                            @click="openInboundWorkspace(slotProps.data)"
                        />
                    </template>
                </Column>

                <Column header="Edit PO" :exportable="false">
                    <template #body="slotProps">
                        <Button
                            label="Edit"
                            icon="pi pi-pencil"
                            v-tooltip.top="'Edit PO'"
                            :disabled="slotProps.data.status === ''"
                            class="po-action-btn po-action-btn--secondary"
                            @click="openEditWorkspace(slotProps.data)"
                        />
                    </template>
                </Column>

                <template #expansion="slotProps">
                    <!--<ButtonGroup class="flex justify-content-center">-->
                    <div class="flex justify-content-center">
                        <Button label="Processed" @click="slotProps.data.displayStatus = 'Processed'"/>
                        <Button label="Unprocessed" severity="info" @click="slotProps.data.displayStatus = 'Unprocessed'"/>
                        <Button label="Invoices" severity="help" @click="slotProps.data.displayStatus = 'Invoices'"/>
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
                            <div class="flex justify-content-between align-items-center mb-2">
                                <h4 class="m-0">Unprocessed Product(s) in Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                                <Button
                                    :label="slotProps.data.showCancelledProducts ? 'Hide Canceled Products' : 'Show Canceled Products'"
                                    :severity="slotProps.data.showCancelledProducts ? 'secondary' : 'danger'"
                                    size="small"
                                    @click="slotProps.data.showCancelledProducts = !slotProps.data.showCancelledProducts"
                                />
                            </div>
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
                                        {{ data.total_units || (data.units_per_case * data.amount) }}
                                    </template>
                                </Column >
                                <<!-- Column header="Location">
                                    <template #body="{data}">
                                        {{ formatSingleLocation(data.location_id) }}
                                    </template>
                                </Column> -->
                                <Column header="Unit Price" > <!-- Fix sort -->
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)) }} 
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold" > <!-- Fix sort -->
                                    <template #body="{data}">
                                        {{ formatCurrency(getUnitCost(data.product_id)*data.total_units*(1-(getPurchaseOrderDiscount(data.purchase_order_id)))) || formatCurrency(getUnitCost(data.product_id)*(data.units_per_case * data.amount)*(1-(getPurchaseOrderDiscount(data.purchase_order_id)))) }}
                                    </template>
                                </Column >
                                <Column field="notes" header="Notes" class="font-bold"></Column>
                            </DataTable>
                        </div>

                        <div class="p-3" v-if="slotProps.data.displayStatus === 'Invoices'">
                            <h4 class="m-0">Invoice(s) for Purchase Order {{ slotProps.data.purchase_order_name }}</h4>
                            <DataTable
                                :value="displayInfo(slotProps.data)"
                                dataKey="invoice_id"
                                :expandedRows="getInvoiceExpandedRows(slotProps.data.purchase_order_id)"
                                @update:expandedRows="setInvoiceExpandedRows(slotProps.data.purchase_order_id, $event)"
                            >
                                <template #empty> No invoices linked to this purchase order. </template>
                                <Column expander style="width: 3rem" />
                                <Column field="invoice_name" header="Invoice" sortable />
                                <Column field="total_cost" header="Total Cost" sortable>
                                    <template #body="{data}">
                                        {{ formatCurrency(data.total_cost) }}
                                    </template>
                                </Column>
                                <Column field="date_shipped" header="Date Shipped" sortable />
                                <Column field="date_due" header="Date Due" sortable />
                                <Column field="date_paid" header="Date Paid" sortable />
                                <Column field="filed" header="Filed" sortable>
                                    <template #body="{data}">
                                        <Tag :value="data.filed ? 'Yes' : 'No'" :severity="data.filed ? 'success' : 'warning'" />
                                    </template>
                                </Column>
                                <Column field="notes" header="Notes" />

                                <template #expansion="invoiceSlotProps">
                                    <div class="invoice-lines-expand-wrap">
                                        <h5 class="m-0 mb-2">Inbound Product Lines</h5>
                                        <DataTable :value="getInvoiceLinkedLines(invoiceSlotProps.data)" dataKey="po_raw_line_id" size="small">
                                            <template #empty> No inbound product lines linked to this invoice. </template>
                                            <Column field="product_name" header="Product">
                                                <template #body="{data}">
                                                    {{ data.product_name || getProductInfo(data.product_id, 'name') || `Product #${data.product_id}` }}
                                                </template>
                                            </Column>
                                            <Column field="item_num" header="Item #" />
                                            <Column field="upc" header="UPC" />
                                            <Column field="total_units" header="Units" />
                                            <Column field="status" header="Status" />
                                            <Column field="notes" header="Notes" />
                                        </DataTable>
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                </template>

            </DataTable>
            </div>

            <aside v-if="poViewMode === 'table'" class="po-workspace-panel" aria-label="Purchase order workspace">
                <template v-if="selectedWorkspacePo">
                    <div class="po-workspace-header">
                        <div class="po-workspace-kicker">Inbound Workspace</div>
                        <h3 class="po-workspace-title">{{ selectedWorkspacePo.purchase_order_name }}</h3>
                        <p class="po-workspace-subtitle">
                            {{ getVendor(selectedWorkspacePo.vendor_id) }}
                            <span class="po-workspace-dot">•</span>
                            {{ selectedWorkspacePo.status || 'Draft' }}
                        </p>
                    </div>

                    <div class="po-workspace-metrics">
                        <div class="po-workspace-metric">
                            <span class="po-workspace-metric-label">Invoices</span>
                            <span class="po-workspace-metric-value">{{ workspaceInvoiceList.length }}</span>
                        </div>
                        <div class="po-workspace-metric">
                            <span class="po-workspace-metric-label">Uninvoiced Lines</span>
                            <span class="po-workspace-metric-value">{{ workspaceUninvoicedLines.length }}</span>
                        </div>
                        <div class="po-workspace-metric">
                            <span class="po-workspace-metric-label">Units On Invoices</span>
                            <span class="po-workspace-metric-value">{{ workspaceInvoicedUnits }}</span>
                        </div>
                    </div>

                    <div class="po-workspace-actions">
                        <Button
                            label="Create Invoice"
                            icon="pi pi-plus"
                            class="po-action-btn po-action-btn--inbound"
                            @click="openInboundWorkspace(selectedWorkspacePo)"
                        />
                        <Button
                            label="Edit PO"
                            icon="pi pi-pencil"
                            class="po-action-btn po-action-btn--secondary"
                            @click="openEditWorkspace(selectedWorkspacePo)"
                        />
                    </div>

                    <div class="po-workspace-section">
                        <h4 class="po-workspace-section-title">Invoices</h4>
                        <DataTable :value="workspaceInvoiceList" dataKey="invoice_id" size="small" stripedRows>
                            <template #empty>No invoices yet for this purchase order.</template>
                            <Column field="invoice_name" header="Invoice" />
                            <Column header="Units">
                                <template #body="{ data }">
                                    {{ getInvoiceLinkedLines(data).reduce((total: number, line: any) => total + Number(line?.total_units || 0), 0) }}
                                </template>
                            </Column>
                            <Column field="date_shipped" header="Shipped" />
                        </DataTable>
                    </div>

                    <div class="po-workspace-section">
                        <h4 class="po-workspace-section-title">Uninvoiced Product Lines</h4>
                        <DataTable :value="workspaceUninvoicedLines" dataKey="po_raw_line_id" size="small" stripedRows>
                            <template #empty>No uninvoiced product lines found.</template>
                            <Column field="product_name" header="Product" />
                            <Column field="total_units" header="Units" />
                            <Column field="status" header="Status" />
                        </DataTable>
                    </div>
                </template>

                <template v-else>
                    <div class="po-workspace-empty">
                        <i class="pi pi-arrow-left po-workspace-empty-icon"></i>
                        <h4 class="po-workspace-empty-title">Select a Purchase Order</h4>
                        <p class="po-workspace-empty-copy">Click any row in the table to open its inbound workspace.</p>
                    </div>
                </template>
            </aside>
            </div>
        </div>

        <Dialog
            v-model:visible="detailDialogVisible"
            :style="{ width: '1200px', maxWidth: '96vw' }"
            header="Purchase Order Details"
            :modal="true"
            class="po-detail-dialog"
        >
            <template v-if="selectedDetailPo">
                <div class="po-detail-dialog-content">
                    <div class="po-workspace-header">
                        <div class="po-workspace-kicker">Purchase Order</div>
                        <h3 class="po-workspace-title">{{ selectedDetailPo.purchase_order_name }}</h3>
                        <p class="po-workspace-subtitle">
                            {{ getVendor(selectedDetailPo.vendor_id) }}
                            <span class="po-workspace-dot">•</span>
                            {{ selectedDetailPo.status || 'Draft' }}
                        </p>
                    </div>

                    <div class="po-workspace-section">
                        <h4 class="po-workspace-section-title">Purchase Order Summary</h4>
                        <div class="po-detail-grid" role="group" aria-label="Purchase order table fields">
                            <div class="po-detail-item po-detail-item--progress">
                                <span class="po-detail-item-label">Order Progress</span>
                                <div class="po-progress-pill">
                                    <div class="po-progress-track" :title="getPoProgressSummary(selectedDetailPo)">
                                        <div class="po-progress-segment po-progress-segment--delivered" :style="getPoProgressSegmentStyle(selectedDetailPo, 'delivered')"></div>
                                        <div class="po-progress-segment po-progress-segment--inbound" :style="getPoProgressSegmentStyle(selectedDetailPo, 'inbound')"></div>
                                        <div class="po-progress-segment po-progress-segment--ordered" :style="getPoProgressSegmentStyle(selectedDetailPo, 'ordered')"></div>
                                        <div class="po-progress-segment po-progress-segment--backordered" :style="getPoProgressSegmentStyle(selectedDetailPo, 'back ordered')"></div>
                                        <div class="po-progress-segment po-progress-segment--flagged" :style="getPoProgressSegmentStyle(selectedDetailPo, 'flagged')"></div>
                                        <div class="po-progress-segment po-progress-segment--other" :style="getPoProgressSegmentStyle(selectedDetailPo, 'other')"></div>
                                    </div>
                                    <div class="po-progress-meta">{{ getPoProgressSummary(selectedDetailPo) }}</div>
                                </div>
                            </div>
                            <div class="po-detail-item po-detail-item--wide">
                                <span class="po-detail-item-label">Notes</span>
                                <span class="po-detail-item-value">{{ selectedDetailPo.notes || 'No notes' }}</span>
                            </div>
                            <div class="po-detail-item">
                                <span class="po-detail-item-label">Date Ordered</span>
                                <span class="po-detail-item-value">{{ selectedDetailPo.date_ordered || 'N/A' }}</span>
                            </div>                            
                        </div>
                    </div>

                    <div class="po-workspace-actions">
                        <Button
                            label="Create Invoice"
                            icon="pi pi-plus"
                            class="po-action-btn po-action-btn--inbound"
                            @click="openInboundWorkspace(selectedDetailPo)"
                            :disabled="detailDialogLoading"
                        />
                        <Button
                            label="Receive Invoices"
                            icon="pi pi-download"
                            class="po-action-btn po-action-btn--receive"
                            @click="openReceiveInvoicesWorkspace(selectedDetailPo)"
                            :disabled="detailDialogLoading"
                        />
                        <Button
                            label="Edit PO"
                            icon="pi pi-pencil"
                            class="po-action-btn po-action-btn--secondary"
                            @click="openEditWorkspace(selectedDetailPo)"
                            :disabled="detailDialogLoading"
                            :loading="detailDialogLoading"
                        />
                    </div>

                    <div class="po-workspace-section">
                        <details class="po-detail-collapsible">
                            <summary>Planned Cases ({{ detailPlannedCases.length }})</summary>
                            <DataTable :value="detailPlannedCases" dataKey="line_key" size="small" class="po-detail-table po-detail-table--green" :rowStyle="detailRowStyleProc" >
                                <template #empty>No planned cases found for this purchase order.</template>
                                <Column field="product_name" header="Processed Product" />
                                <Column field="amount" header="Cases" />
                                <Column field="units_per_case" header="Units per Case" />
                                <Column field="qty" header="Total Units" />
                            </DataTable>

                            <h4 class="po-detail-subsection-title">Raw Products With No Plan ({{ getPoolNew(detailSelectedPoId).length }})</h4>
                            <DataTable :value="getPoolNew(detailSelectedPoId)" dataKey="product_id" size="small" class="po-detail-table po-detail-table--blue" :rowStyle="rowStylePool">
                                <template #empty>No unplanned products found for this purchase order.</template>
                                <Column field="product_name" header="Product" />
                                <Column header="Item #">
                                    <template #body="{ data }">
                                        {{ getItemNum(data.product_id) || data.item_num || 'N/A' }}
                                    </template>
                                </Column>
                                <Column field="totalUnits" header="Total Units" />
                                <Column header="Unit Cost">
                                    <template #body="{ data }">
                                        {{ getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id)) : 'N/A' }}
                                    </template>
                                </Column>
                                <Column header="Total Cost">
                                    <template #body="{ data }">
                                        {{ getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id) * Number(data.totalUnits || 0) * (1 - (getPurchaseOrderDiscount(selectedDetailPo.purchase_order_id)))) : 'N/A' }}
                                    </template>
                                </Column>
                            </DataTable>
                        </details>
                    </div>

                    <div class="po-workspace-section">
                        <details class="po-detail-collapsible">
                            <summary>Raw Products ({{ detailRawLines.length }})</summary>
                            <small style="color: red;" v-if="doesPOHaveFlaggedLine(detailSelectedPoId)">*This order contains at least one flagged product. Contact the vendor to confirm this product is still on the order.</small>
                            <DataTable :value="detailRawLines" dataKey="line_key" size="small" class="po-detail-table po-detail-table--blue" showGridlines :rowStyle="detailRowStyleRaw">
                                <template #empty>No raw products found for this purchase order.</template>
                                <Column field="product_name" header="Product" />
                                <Column field="item_num" header="Item #" />
                                <Column header="Unit for FBA">
                                    <template #body="{ data }">
                                        {{ (data.fba_prep || 0) + (data.store || 0) }}
                                    </template>
                                </Column>
                                <Column field="fbm" header="Units for FBM" >
                                    <template #body="{ data }">
                                        {{ (data.fbm || 0) }}
                                    </template>
                                </Column>
                                <Column field="total_units" header="Total Units" />
                                <Column header="Unit Cost">
                                    <template #body="{ data }">
                                        {{getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id)) : 'N/A'}}
                                    </template>
                                </Column>
                                <Column header="Total Cost">
                                    <template #body="{ data }">
                                        {{getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id)*data.total_units*(1-(getPurchaseOrderDiscount(selectedDetailPo.purchase_order_id)))) : 'N/A'}}
                                    </template>
                                </Column>
                            </DataTable>
                        </details>
                    </div>

                    <div class="po-workspace-section">
                        <details class="po-detail-collapsible">
                            <summary>Invoices and Linked Product Lines ({{ detailInvoiceList.length }})</summary>
                            <DataTable
                                :value="detailInvoiceRows"
                                dataKey="line_key"
                                rowGroupMode="subheader"
                                groupRowsBy="invoice_group_key"
                                sortField="invoice_group_key"
                                :sortOrder="1"
                                size="small"
                                class="po-detail-table po-detail-table--invoice"
                                :rowStyle="detailInvoiceRowStyle"
                                :pt="{
                                    rowGroupHeaderCell: { colspan: 7 }
                                }"
                            >
                                <template #empty>No invoices found for this purchase order.</template>
                                <template #groupheader="{ data }">
                                    <div class="po-invoice-group-head">
                                        <div class="po-invoice-group-head__title">
                                            <button
                                                type="button"
                                                class="po-invoice-group-head__name-btn"
                                                @click.stop="openInvoiceEditDialog(data)"
                                            >
                                                {{ data.invoice_name || 'Unnamed Invoice' }}
                                            </button>
                                            <Button
                                                label="Receive"
                                                icon="pi pi-download"
                                                class="po-action-btn po-action-btn--receive p-button-sm"
                                                :disabled="!canReceiveInvoice(data)"
                                                @click.stop="openReceiveInvoiceFromDetail(data)"
                                            />
                                        </div>
                                        <div class="po-invoice-group-head__stats">
                                            <span><strong>Total:</strong> {{ formatCurrency(data.total_cost) || '$0.00' }}</span>
                                            <span><strong>Shipped:</strong> {{ data.date_shipped || 'N/A' }}</span>
                                            <span><strong>Due:</strong> {{ data.date_due || 'N/A' }}</span>
                                            <span><strong>Paid:</strong> {{ data.date_paid || 'N/A' }}</span>
                                            <span><strong>Filed:</strong> {{ data.filed ? 'Yes' : 'No' }}</span>
                                            <span><strong>Notes:</strong> {{ data.invoice_notes || 'No notes' }}</span>
                                        </div>
                                    </div>
                                </template>

                                <Column field="product_name" header="Linked Product">
                                    <template #body="{ data }">
                                        {{ data.has_line ? (data.product_name || getProductInfo(data.product_id, 'name') || ('Product #' + data.product_id)) : 'No linked lines' }}
                                    </template>
                                </Column>
                                <Column field="item_num" header="Item #">
                                    <template #body="{ data }">{{ data.has_line ? (data.item_num || 'N/A') : '—' }}</template>
                                </Column>
                                <Column field="total_units" header="Units">
                                    <template #body="{ data }">{{ data.has_line ? Number(data.total_units || 0) : 0 }}</template>
                                </Column>
                                <Column header="Unit Cost">
                                    <template #body = {data}>
                                        {{getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id)) : 'N/A'}}
                                    </template>
                                </Column>
                                <Column header="Total Cost">
                                    <template #body = {data}>
                                        {{getUnitCost(data.product_id) ? formatCurrency(getUnitCost(data.product_id)*data.total_units*(1-(getPurchaseOrderDiscount(selectedDetailPo.purchase_order_id)))) : 'N/A'}}
                                    </template>
                                </Column>
                                <Column field="status" header="Status">
                                    <template #body="{ data }">{{ data.has_line ? (data.status || 'N/A') : '—' }}</template>
                                </Column>
                                <Column field="line_notes" header="Line Notes">
                                    <template #body="{ data }">{{ data.has_line ? (data.line_notes || 'No notes') : '—' }}</template>
                                </Column>
                            </DataTable>
                        </details>
                    </div>

                    <div class="po-workspace-section">
                        <details class="po-detail-collapsible">
                            <summary>Raw Products That Have Arrived ({{ detailArrivedBoxes.length }})</summary>
                            <DataTable :value="detailArrivedBoxes" dataKey="line_key" size="small" class="po-detail-table po-detail-table--blue" showGridlines :rowStyle="detailRowStyleRaw">
                                <template #empty>No raw products found for this purchase order.</template>
                                <Column field="product_name" header="Product" />
                                <Column field="item_num" header="Item #" />
                                <Column field="units_per_case" header="Units / Box" />
                                <Column field="amount" header="# of Boxes" />
                                <Column field="total_units" header="Total Units" />
                                <Column field="location_name" header="Location" />
                            </DataTable>
                        </details>
                    </div>

                </div>
            </template>
            <template #footer>
                <div class="po-detail-item">
                    <span class="po-detail-item-label">Total Units</span>
                    <span class="po-detail-item-value">{{ getCreatedUnitTotal(selectedDetailPo.purchase_order_id) }}</span>
                </div>
                <div class="po-detail-item">
                    <span class="po-detail-item-label">Discount</span>
                    <span class="po-detail-item-value">{{ selectedDetailPo.discount ? selectedDetailPo.discount + '% Off' : 'No Discount' }}</span>
                </div>
                <div class="po-detail-item">
                    <span class="po-detail-item-label">Total Cost</span>
                    <span class="po-detail-item-value">{{ formatCurrency(getCreatedCostTotal(selectedDetailPo.purchase_order_id, selectedDetailPo.discount)) || '$0.00' }}</span>
                </div>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    class="po-action-btn po-action-btn--secondary"
                    @click="detailDialogVisible = false"
                />
            </template>
        </Dialog>

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
                <Button label="Select" icon="pi pi-check" text @click="vendorSubmitted = true; validateVendor();" />
            </template>
        </Dialog>

        <Dialog v-model:visible="missingDefaultUnitsDialog" :style="{width: '700px'}" header="Missing Product Fields" :modal="true">
            <div v-if="isProcMissingDefaultUnits" class="field">
                <p class="p-error">Warning: This processed case key for {{ procProdMissingDefaults?.product_name || procProdMissingDefaults?.name }} is missing a default units per case value. Please enter a value below.</p>
                <InputNumber v-model="missingProcDefaultUnits" :min="1" showButtons class="mb-2" />
            </div>

            <div class="field" v-if="missingDefaults.length">
                <p>The following raw product(s) are missing important values needed for accurate ordering totals. Please review and complete the required fields below.</p>
            </div>

            <div v-for="(item, idx) in missingDefaults" :key="item.product_id" class="field">
                <div class="grid">
                    <div class="col-6">
                        <div class="font-bold">{{ item.name }}</div>
                        <div class="text-sm">Item#: {{ item.item_num }}</div>
                    </div>
                    <div class="col-6 flex flex-column gap-3">
                        <div>
                            <label class="block">Default Units per Raw Box</label>
                            <InputNumber v-model="item.default_units_per_case" :min="1" showButtons />
                            <small v-if="item.requires_default_units_per_case" class="p-error">Required</small>
                        </div>
                        <div>
                            <label class="block">Raw Unit Price</label>
                            <InputNumber v-model="item.price_2023" mode="currency" currency="USD" locale="en-US" :min="0.01" />
                            <small v-if="item.requires_price_2023" class="p-error">Required</small>
                        </div>
                        <div v-if="item.requires_recipe_input_units">
                            <label class="block">Raw Unit(s) Required for 1 Processed Unit</label>
                            <InputNumber v-model="item.recipe_input_units" :min="1" showButtons />
                            <small class="p-error">Required</small>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" text @click="missingDefaultUnitsDialog = false; activeRecipeEditRow = null; missingDefaultsRecipeIndex = null" />
                <Button label="Save" icon="pi pi-check" @click="saveMissingDefaultUnits" :loading="loading" :disabled="loading" autoFocus />
            </template>
        </Dialog>

        <Dialog v-model:visible="missingVendorNicknameDialog" :style="{width: '500px'}" header="Missing Company Code" :modal="true">
            <div class="field">
                <p>This vendor does not have a company code. Please enter one below — it will be used as the prefix for this purchase order's name.</p>
            </div>
            <div class="field">
                <div class="grid">
                    <div class="col-12">
                        <label class="block font-bold mb-2">Company Code</label>
                        <InputText v-model="pendingVendorNickname" class="w-full" placeholder="e.g. Aurora → AU" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="missingVendorNicknameDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveMissingVendorNickname" :loading="loading" :disabled="!pendingVendorNickname.trim() || loading" autoFocus />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="editPurchaseOrderDialog"
            :style="{width: '1800px', height: '90vh'}"
            header="Edit Purchase Order"
            :modal="true"
            :class="['p-fluid po-edit-dialog', { 'po-edit-dialog--readonly': isPoReadOnly }]"
            @hide="onEditPurchaseOrderDialogHide"
        >
            <Transition name="fade">
                <div v-if="isSavingEditDialog" class="po-edit-saving-overlay">
                    <div class="po-edit-saving-content">
                        <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="3" fill="transparent" animationDuration=".9s" />
                        <span class="po-edit-saving-label">Saving and reloading...</span>
                    </div>
                </div>
            </Transition>

            <div class="flex align-items-left align-self-flex-start">
                <!-- <Button label="Header" text @click=""/> -->
                <!-- <Button label="Product Info" text @click="" /> -->
            </div>

            <Message v-if="isPoReadOnly" severity="warn" :closable="false" class="po-lock-message">
                {{ poReadOnlyMessage }}
            </Message>

            <div class="po-edit-layout">
            <div class="field">
                <label for="purchase_order_name">Name</label>
                <InputText id="name" v-model.trim="purchaseOrder.purchase_order_name" :required="true" autofocus :class="{'p-invalid': submitted == true && (!purchaseOrder.purchase_order_name || purchaseOrder.purchase_order_name == '')}" 
                    :disabled="isPoReadOnly"
                />
            </div>

            <div class="field">
                <label for="vendor">Vendor</label>
                <Select disabled v-model="purchaseOrder.vendor_id"
                placeholder="Select a Vendor" class="w-full md:w-14rem" editable
                :options="vendors"
                filter
                :virtualScrollerOptions="{ itemSize: 38 }"
                optionLabel="vendor_name"
                optionValue="vendor_id" 
                />
            </div>

            <div class="field">
                <label for="status">Status</label>
                <Select v-model="purchaseOrder.status" :options="statuses" :disabled="isPoReadOnly" @change="onStatusChange()"/>
            </div>

            <div class="field">
                <label for="notes">Notes</label>
                <InputText id="notes" v-model="purchaseOrder.notes" rows="3" cols="20" :disabled="isPoReadOnly" />
            </div>

            <div class="field">
                <label for="discount">Discount</label>
                <InputNumber v-model="purchaseOrder.discount" suffix="%" fluid :max="100" :min="0" :disabled="isPoReadOnly" />
            </div>

            <div class="field">
                <label for="date_ordered">Date Ordered</label>
                <DatePicker id="date_ordered" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_ordered" :disabled="isPoReadOnly"/>
            </div>

            <div class="field">
                <label for="date_received">Date received</label>
                <DatePicker id="date_received" dateFormat="yy-mm-dd" v-model="purchaseOrder.date_received" :disabled="isPoReadOnly"/>
            </div>

            <section class="po-edit-section-card">
            <div class="field">
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full po-edit-section-title">Planned Processed Case(s)</h3>
            </div>
            <small class="p-error" v-if="totalErrorMSG">{{totalErrorMSG}}</small>
                <DataTable 
                class="po-edit-data-table" 
                v-model:editingRows="editingRows" 
                :value="singlePoRecipes" 
                :rowStyle="editRowStyleProc" 
                editMode="row" 
                scrollable
                scrollHeight="400px"
                :loading="editRecipeRowsLoading" 
                @row-edit-save="onPORecipeRowEditSave">
                <template #empty>
                    <div class="flex flex-column align-items-center gap-3 py-5">
                        <i class="pi pi-box text-4xl"></i>
                        <div class="text-lg">No planned processed cases.</div>
                    </div>
                </template>
                <Column header="Name" field="product_name">
                    <template #editor="{data}">
                        <AutoComplete
                            v-model="data.recipeObj"
                            :suggestions="filteredRecipesEdit || []"
                            @complete="(event: any) => searchRecipesEdit(event)"
                            @item-select="onRecipeSelectionEditRow($event.value, data)"
                            :dropdown="true"
                            :optionLabel="'label'"
                            placeholder="Select a recipe"
                            class="w-full"
                            :forceSelection="false"
                            :disabled="isPoReadOnly"
                        />
                        <div v-if="data.recipeObj" class="mt-2">
                            <DataTable :value="getRecipeInputsForEditRow(data)">
                                <Column header="Name">
                                    <template #body="{data: inputRow}">
                                        {{ inputRow.key?.name || getProductInfo(inputRow.rec?.product_id, 'name') }}
                                    </template>
                                </Column>
                                <Column header="Units per Box">
                                    <template #body="{data: inputRow}">
                                        {{ inputRow.key?.default_units_per_case || 0 }}
                                    </template>
                                </Column>
                                <Column header="Units per Recipe Unit">
                                    <template #body="{data: inputRow}">
                                        {{ inputRow.rec?.qty || 0 }}
                                    </template>
                                </Column>
                                <Column header="Unit Price">
                                    <template #body="{data: inputRow}">
                                        {{ formatCurrency(inputRow.key?.price_2023) }}
                                    </template>
                                </Column>
                                <Column header="Required Units">
                                    <template #body="{data: inputRow}">
                                        {{ inputRow.required_units }}
                                    </template>
                                </Column>
                                <Column header="Whole Box Units">
                                    <template #body="{data: inputRow}">
                                        {{ (Math.ceil((inputRow.required_units || 0) / (inputRow.key?.default_units_per_case || 1))) * (inputRow.key?.default_units_per_case || 0) }}
                                    </template>
                                </Column>
                                <Column header="# of Boxes">
                                    <template #body="{data: inputRow}">
                                        {{ Math.ceil((inputRow.required_units || 0) / (inputRow.key?.default_units_per_case || 1)) }}
                                    </template>
                                </Column>
                                <Column header="Total Price" class="font-bold">
                                    <template #body="{data: inputRow}">
                                        {{ formatCurrency((inputRow.required_units || 0) * (inputRow.key?.price_2023 || 0)) }}
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
                        <InputNumber v-model="data[field]" @update:model-value="data.qty = Number(data.amount || 0) * Number(data.units_per_case || 0)" showButtons :disabled="isPoReadOnly"/>
                    </template>
                </Column>
                <Column header="Units per Case" field="units_per_case">
                    <template #body="{data, field}">
                        {{ data.units_per_case || 0 }}
                    </template>

                </Column>
                <Column header="Total Units" field="qty">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @update:model-value="data.amount = Number(data.units_per_case || 0) > 0 ? Number(data.qty || 0) / Number(data.units_per_case || 0) : data.amount" disabled/>
                        <!-- Math.ceil(data.total/data.units_per_case) -->
                    </template>
                </Column>
                <Column :rowEditor="!isPoReadOnly" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                <!-- <Column >
                    <template #body>
                        <Button v-tooltip.top="'Cancel Product'" text icon="pi pi-ban" @click="onProcProductCancel"/>
                    </template>
                </Column> -->
            </DataTable>
            <div v-tooltip.top="hasEmptyPORecipeLines() ? 'Only one planned case line can be added at a time. This is to ensure all items are saved.' : null">
                <Button label="Add another Case" class="po-action-btn po-action-btn--recipe po-edit-add-btn" @click="addEditRecipeLine" :disabled="isPoReadOnly || editRecipeRowsLoading || hasEmptyPORecipeLines()" :loading="editRecipeRowsLoading"/>
            </div>
            <br>
            </section>


            <section class="po-edit-section-card">
            <div class="field">
                <h3 for="purchaseOrder" class="flex justify-content-start font-bold w-full po-edit-section-title">Raw Boxes</h3>
            </div>
            <DataTable 
                class="po-edit-data-table" 
                v-model:editingRows="rawEditingRows" 
                :value="poBoxes" 
                :rowStyle="editRowStyleRaw" 
                dataKey="line_key" 
                editMode="row" 
                scrollable
                scrollHeight="400px"
                :loading="editRawRowsLoading" 
                @row-edit-init="onPOBoxRowEditInit" 
                @row-edit-save="onPORawLineEditSave"
            >
                <template #empty>
                    <div class="flex flex-column align-items-center gap-3 py-5">
                        <i class="pi pi-box text-4xl"></i>
                        <div class="text-lg">No raw boxes in order.</div>
                    </div>
                </template>
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
                                :disabled="isPoReadOnly"
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
                        <InputNumber v-model="data[field]" @input="onRawTotalsChange($event, data, field)" :disabled="isPoReadOnly"/>
                    </template>
                </Column>
                <Column header="Units per Box" field="units_per_case">
                    <template #body="{data}">
                        <span>{{ data.units_per_case ?? '—' }}</span>
                    </template>
                </Column>
                <Column header="Unit Price" field="price_2023">
                    <template #body="{data}">
                        {{ formatCurrency(getUnitCost(data.product_id)) }}
                    </template>
                </Column>
                <Column header="Units for FBA" field="store">
                    <template #body="{data}">
                        {{ (data.store || 0) }}
                    </template>
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" disabled/>
                    </template>
                </Column>
                <Column header="Units for FBM" field="fbm">
                    <template #body="{data}">
                        {{ (data.fbm || 0) }}
                    </template>
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @input="onRawTotalsChange($event, data, field)" :disabled="isPoReadOnly"/>
                    </template>
                </Column>
                <Column header="Total Units" field="total">
                    <template #editor="{data, field}">
                        <InputNumber v-model="data[field]" @input="onRawTotalsChange($event, data, field)" :disabled="isPoReadOnly"/>
                        <!-- Math.ceil(data.total/data.units_per_case) -->
                    </template>
                </Column>
                <Column header="Total Price" field="total_price" class="font-bold">
                    <template #body="{data}">
                        {{ formatCurrency(getUnitCost(data.product_id)*data.total) }}
                    </template>
                </Column>
                <Column header="Status" field="status"></Column>
                <Column header="Notes" field="notes">
                    <template #body="{data}">
                        {{ data.notes }}
                    </template>
                    <template #editor="{data, field}">
                        <InputText v-model="data[field]" :disabled="isPoReadOnly" />
                    </template>
                </Column>
                <Column :rowEditor="!isPoReadOnly" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>
                <Column >
                    <template #body="{data, index}">
                        <Button
                            v-if="data.product_id"
                            v-tooltip.top="'Cancel Product'"
                            text
                            icon="pi pi-ban"
                            severity="danger"
                            :disabled="isPoReadOnly || Boolean(data?.d_editing) || isRawRowEditing(data)"
                            @click="onRawProductCancel(data)"
                        />
                        <Button
                            v-else
                            v-tooltip.top="'Remove Unsaved Row'"
                            text
                            icon="pi pi-times"
                            severity="secondary"
                            :disabled="isPoReadOnly"
                            @click="removeUnsavedRawRow(data, index)"
                        />
                    </template>
                </Column>
            </DataTable> 
            <div v-tooltip.top="hasEmptyPORawLines() ? 'Only one raw product line can be added at a time. This is to ensure all items are saved.' : null">
                <Button label="Add another product" class="po-action-btn po-action-btn--secondary po-edit-add-btn" @click="addEditRawLine" :disabled="isPoReadOnly || editRawRowsLoading || hasEmptyPORawLines()" :loading="editRawRowsLoading"/>
            </div>
            <br>
            </section>

            
            </div>

            <template #footer>
                <div class="po-edit-footer-wrap">
                    <div class="flex flex-nowrap gap-2 align-items-center justify-content-between">
                        <div>
                            <div class="flex flex-start font-bold">Total Units: {{ calculatePoUnitTotal() }}</div>
                            <div class="flex flex-start font-bold">Total Price: {{ formatCurrency(calculatePoCostTotal()) || '$0' }}</div>
                        </div>
                        <div class="po-edit-footer-actions">
                            <Button label="Close" class="po-action-btn po-action-btn--secondary" @click="closeEditPurchaseOrderDialog"/>
                            <div class="po-autosave-banner" :class="{ 'is-visible': autoSaveState !== 'idle' }">
                                <div v-if="autoSaveState !== 'idle'" class="po-autosave-indicator">
                                    <template v-if="autoSaveState === 'saving'">
                                        <ProgressSpinner style="width: 18px; height: 18px" strokeWidth="4" animationDuration=".8s" />
                                        <span>Saving changes...</span>
                                    </template>
                                    <template v-else>
                                        <i class="pi pi-check-circle po-autosave-check"></i>
                                        <span>Changes saved</span>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- <Button label="Save" icon="pi pi-check"  text @click="validate" /> -->
            </template>
        </Dialog>

        <Dialog v-model:visible="unsavedChangesDialog" :style="{width: '500px'}" header="Unsaved Changes" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>You have unsaved records in the tables. If you close now, these changes will be lost. Are you sure you want to close without saving?</span>
            </div>
            <template #footer>
                <Button label="Continue Editing" icon="pi pi-pencil" text severity="secondary" @click="unsavedChangesDialog = false"/>
                <Button label="Close Without Saving" icon="pi pi-times" text severity="danger" @click="forceCloseEditDialog" />
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

        <Dialog v-model:visible="deleteOrderDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="purchaseOrder">Are you sure you want to delete purchase order <b>{{purchaseOrder.purchase_order_name}}</b>? This action cannot be undone.</span><br><br>
                <span>NOTE: This will delete all associated raw products, planned cases invoices. To continue, please enter the full phrase, "Delete {{purchaseOrder.purchase_order_name}}"</span>
                <InputText v-model="deleteOrderText" class="w-full mt-3" :disabled="!purchaseOrder" placeholder='Type the confirmation phrase here' />
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteOrderDialog = false"/>
                <Button label="Yes" icon="pi pi-check" text @click="deletePurchaseOrder(purchaseOrder)" severity="danger" :disabled="deleteOrderText !== 'Delete ' + purchaseOrder.purchase_order_name"/>
            </template>
        </Dialog>

        <Dialog v-model:visible="rawProductCancelDialog" :style="{width: '500px'}" header="Cancel Product" :modal="true">
            <div class="field" v-if="rawProductToCancel">
                <p class="m-0 mb-3">
                    Cancel <b>{{ rawProductToCancel.product_name || ('Product #' + rawProductToCancel.product_id) }}</b>
                    ({{ rawProductToCancel.units_per_case }} units per box, {{ rawProductToCancel.amount }} box{{ rawProductToCancel.amount !== 1 ? 'es' : '' }} total)
                </p>
                
                <div class="mb-4">
                    <div class="mb-3">
                        <RadioButton v-model="rawProductCancelOption" value="boxes" inputId="cancel-boxes" />
                        <label for="cancel-boxes" class="ml-2">Cancel by Box Count</label>
                    </div>
                    <div v-if="rawProductCancelOption === 'boxes'" class="field ml-5 mb-3">
                        <label class="block font-bold mb-2">Number of Boxes to Cancel</label>
                        <InputNumber
                            v-model="rawProductCancelAmount"
                            :min="1"
                            :max="rawProductToCancel.amount"
                            :useGrouping="false"
                            :class="['w-full', { 'raw-cancel-input--invalid': isRawCancelOverMax() }]"
                            @input="onRawProductCancelAmountInput"
                        />
                        <small v-if="isRawCancelOverMax()" class="p-d-block mt-2 p-error">{{ getRawCancelValidationMessage() }}</small>
                    </div>
                    
                    <div class="mb-3">
                        <RadioButton v-model="rawProductCancelOption" value="units" inputId="cancel-units" />
                        <label for="cancel-units" class="ml-2">Cancel by Unit Quantity</label>
                    </div>
                    <div v-if="rawProductCancelOption === 'units'" class="field ml-5">
                        <label class="block font-bold mb-2">Number of Units to Cancel</label>
                        <InputNumber
                            v-model="rawProductCancelAmount"
                            :min="1"
                            :max="rawProductToCancel.amount * rawProductToCancel.units_per_case"
                            :useGrouping="false"
                            :class="['w-full', { 'raw-cancel-input--invalid': isRawCancelOverMax() }]"
                            @input="onRawProductCancelAmountInput"
                        />
                        <small v-if="isRawCancelOverMax()" class="p-d-block mt-2 p-error">{{ getRawCancelValidationMessage() }}</small>
                        <small class="p-d-block mt-2 text-color-secondary">Max: {{ rawProductToCancel.amount * rawProductToCancel.units_per_case }} units</small>
                    </div>
                </div>

                <div v-if="getRawCancelPreview() || getRawCancelValidationMessage()" :class="['p-3 border-round border-1', isRawCancelOverMax() ? 'surface-border bg-red-50 text-900' : 'surface-border bg-blue-50 text-900']">
                    <div class="font-bold mb-1">{{ isRawCancelOverMax() ? 'Warning' : 'Preview' }}</div>
                    <small :class="{ 'p-error': isRawCancelOverMax() }">{{ isRawCancelOverMax() ? getRawCancelValidationMessage() : getRawCancelPreview() }}</small>
                </div>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" text severity="danger" @click="closeRawProductCancelDialog"/>
                <Button label="Confirm Cancel" icon="pi pi-check" severity="danger" @click="confirmRawProductCancel" :disabled="!rawProductCancelAmount || rawProductCancelAmount <= 0 || isRawCancelOverMax()" :loading="loading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="statusChangeDialog" :style="{width: '450px'}" header="Status Change" :modal="true">
            <div class="confirmation-content">
                <span v-if="purchaseOrder">Change Purchase Order <b>{{purchaseOrder.purchase_order_name}}</b> status to {{ newStatus }}?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="statusChangeDialog = false; newStatus=''"/>
                <Button label="Yes" icon="pi pi-check" text @click="confirmStatusChange" :disabled="saving" :loading="saving" />
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
                    <AutoComplete
                        :modelValue="getLocationAutoCompleteValue(poBox.location_id)"
                        :suggestions="filteredLocations"
                        @complete="searchLocations"
                        @focus="searchLocations({ query: '' })"
                        @item-select="onLocationAutoCompleteChange(poBox, $event.value)"
                        @update:modelValue="onLocationAutoCompleteChange(poBox, $event)"
                        :dropdown="true"
                        :showOnFocus="true"
                        optionLabel="name"
                        placeholder="Select a Location"
                        class="w-full md:w-14rem"
                        :forceSelection="true"
                    />
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
                                <InputNumber inputId="stacked-buttons" :required="true" 
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
                                    <AutoComplete
                                        :modelValue="getLocationAutoCompleteValue(data.location_id)"
                                        :suggestions="filteredLocations"
                                        @complete="searchLocations"
                                        @focus="searchLocations({ query: '' })"
                                        @item-select="onLocationAutoCompleteChange(data, $event.value)"
                                        @update:modelValue="onLocationAutoCompleteChange(data, $event)"
                                        :dropdown="true"
                                        :showOnFocus="true"
                                        optionLabel="name"
                                        placeholder="Select a Location"
                                        class="w-full md:w-14rem"
                                        :forceSelection="true"
                                    />
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

        <!-- <Dialog v-model:visible="newPurchaseOrderProductDialog" header="New Purchase Order Product" :modal="true">
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
                            <InputNumber inputId="stacked-buttons" :required="true" 
                            :class="{'p-invalid': submitted && !newPORecipe.default_units_per_case}"
                            v-model="poCasesEdit.default_units_per_case" disabled
                            />
                            <small class="p-error" v-if="submitted && !newPORecipe.default_units_per_case">Amount is required.</small>
                        </div>

                        <div class="field">
                            <label for="amount">Cases Desired to Be Made</label>
                            <InputNumber inputId="stacked-buttons" :required="true" 
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
        </Dialog> -->

        <Dialog v-model:visible="inboundPurchaseOrderDialog" :header="'Plan Out Invoice for Purchase Order ' + purchaseOrder.purchase_order_name" :modal="true" :style="{ width: '1200px' }" @hide="onInboundDialogHide">
            <div class="flex flex-column gap-3">

                <div class="inbound-invoice-name-field">
                    <label class="inbound-field-label" for="inboundInvoiceName">Invoice Name <span class="inbound-required">*</span></label>
                    <InputText
                        id="inboundInvoiceName"
                        v-model="inboundInvoiceName"
                        placeholder="e.g. INV-2026-001"
                        class="inbound-invoice-name-input"
                        :class="{ 'p-invalid': inboundSubmitted && !inboundInvoiceName.trim() }"
                    />
                    <small class="p-error" v-if="inboundSubmitted && !inboundInvoiceName.trim()">Invoice name is required.</small>
                </div>

                <p class="inbound-instructions m-0">
                    Account for each product by splitting units into shipped and back ordered.
                    Product amounts already linked to an invoice or cancelled are excluded.
                    Remaining units are unaccounted and must be reviewed before saving.
                </p>

                <DataTable v-if="inboundBoxesLoading" :value="[1,2,3]" stripedRows showGridlines responsiveLayout="scroll" class="inbound-skeleton-table">
                    <Column header="Product"><template #body><div class="skeleton-line skeleton-line--product"></div></template></Column>
                    <Column header="Item #"><template #body><div class="skeleton-line skeleton-line--item"></div></template></Column>
                    <Column header="Ordered Units"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Units Shipped"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Units Back Ordered"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Remaining"><template #body><div class="skeleton-line skeleton-line--number skeleton-line--total"></div></template></Column>
                </DataTable>

                <DataTable v-else 
                    :value="inboundLineAllocations" 
                    stripedRows 
                    showGridlines 
                    responsiveLayout="scroll" 
                    class="inbound-lines-table"
                    scrollable 
                    scrollHeight="800px"
                >
                    <template #empty>
                        No eligible raw products are available to inbound for this purchase order.
                    </template>

                    <Column field="product_name" header="Product" sortable frozen  >
                        <template #body="{ data }">
                            {{ data.product_name || data.name }}
                        </template>
                    </Column>
                    <Column field="item_num" header="Item #" sortable frozen  />
                    <Column field="total_units" header="Ordered Units" sortable frozen  :pt="{
                            bodyCell: { style: { zIndex: 10, position: 'sticky' } },
                            headerCell: { style: { zIndex: 11, position: 'sticky' } }
                        }"
                    />
                    <Column header="Planned Units for FBA Prep" field="fba_prep" :pt="{
                            bodyCell: ({ context }) => ({
                                root: { style: { zIndex: 1, position: 'relative' } },
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#8bc34a' : '#8bc34a' 
                                }
                            })
                        }"
                    >
                        <template #body="{ data }">
                            {{ data.fba_prep || 0 }}
                        </template>
                    </Column>
                     <Column header="Shipped (FBA Prep)" field="fba_prep" class="inbound-fba-prep" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#8bc34a' : '#8bc34a' 
                                }
                            })
                        }"
                     >
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.fba_prep_shipped"
                                :min="0"
                                :useGrouping="false"
                                class="inbound-units-input"
                                :class="{ 'inbound-units-input--over': Number(data.units_shipped || 0) + Number(data.units_backordered || 0) > Number(data.total_units || 0) }"
                                @update:modelValue="onInboundUnitsUpdate(data, 'fba_prep')"
                                @input="onInboundUnitsInput($event, data, 'fba_prep')"
                            />
                        </template>
                    </Column>
                    <Column header="Planned Units to Store" field="store" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#cca677' : '#cca677' 
                                }
                            })
                        }"
                    >
                        <template #body="{ data }">
                            {{ data.store || 0 }}
                        </template>
                    </Column>
                    <Column header="Shipped (Store)" field="store" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#cca677' : '#cca677' 
                                }
                            })
                        }"
                    >
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.store_shipped"
                                :min="0"
                                :useGrouping="false"
                                class="inbound-units-input"
                                :class="{ 'inbound-units-input--over': Number(data.units_shipped || 0) + Number(data.units_backordered || 0) > Number(data.total_units || 0) }"
                                @update:modelValue="onInboundUnitsUpdate(data, 'store')"
                                @input="onInboundUnitsInput($event, data, 'store')"
                            />
                        </template>
                    </Column>
                    <Column header="Planned Units for FBM" field="fbm" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#741b47' : '#741b47' 
                                }
                            })
                        }"
                    >
                        <template #body="{ data }">
                            {{ data.fbm || 0 }}
                        </template>
                    </Column>
                     <Column header="Shipped (FBM)" field="fbm" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#741b47' : '#741b47' 
                                }
                            })
                        }"
                     >
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.fbm_shipped"
                                :min="0"
                                :useGrouping="false"
                                class="inbound-units-input"
                                :class="{ 'inbound-units-input--over': Number(data.units_shipped || 0) + Number(data.units_backordered || 0) > Number(data.total_units || 0) }"
                                @update:modelValue="onInboundUnitsUpdate(data, 'fbm')"
                                @input="onInboundUnitsInput($event, data, 'fbm')"
                            />
                        </template>
                    </Column>
                    <Column header="Units Shipped" field="units_shipped">
                        <template #body="{ data }">
                            {{ data.units_shipped || 0 }}
                        </template>
                    </Column>
                    <Column header="Units Back Ordered" :pt="{
                            bodyCell: ({ context }) => ({
                                style: { 
                                    backgroundColor: context.index % 2 === 0 ? '#e99149' : '#e99149' 
                                }
                            })
                        }"
                    >
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.units_backordered"
                                :min="0"
                                :useGrouping="false"
                                class="inbound-units-input"
                                :class="{ 'inbound-units-input--over': Number(data.units_shipped || 0) + Number(data.units_backordered || 0) > Number(data.total_units || 0) }"
                                @update:modelValue="onInboundUnitsUpdate(data, 'units_backordered')"
                                @input="onInboundUnitsInput($event, data, 'backordered')"
                            />
                        </template>
                    </Column>
                    <Column header="Remaining">
                        <template #body="{ data }">
                            <span :class="getInboundRemainingClass(data)">
                                {{ getInboundRemaining(data) }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Unit Price">
                        <template #body="{ data }">
                            {{ data.unit_price || data.price_2023 ? formatCurrency(data.unit_price || data.price_2023) : '—' }}
                        </template>
                    </Column>
                    <Column header="Disc%">
                        <template #body="{ data }">
                            {{ purchaseOrder.discount ? purchaseOrder.discount + '%' : '—' }}
                        </template>
                    </Column>
                    <Column header="Subtotal">
                        <template #body="{ data }">
                            {{ (data.unit_price || data.price_2023) && data.units_shipped ? formatCurrency((data.unit_price || data.price_2023) * data.units_shipped * (1 - (purchaseOrder.discount || 0)/100)) : '—' }}
                        </template>
                    </Column>
                </DataTable>

                <small class="p-error" v-if="inboundSubmitted && !inboundLineAllocations.some((l: any) => Number(l.units_shipped) > 0)">
                    At least one line must have shipped units greater than 0.
                </small>

            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="inboundPurchaseOrderDialog = false" :disabled="inboundCreatingInvoice" />
                <Button label="Create Invoice" icon="pi pi-check" class="p-button-success" @click="submitCreateInvoice" :loading="inboundCreatingInvoice" />
            </template>
        </Dialog>

        <Dialog v-model:visible="inboundUnaccountedDialog" header="Unaccounted Product Units" :modal="true" :style="{ width: '560px' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--yellow-500)" />
                <div>
                    <p class="m-0">Some products still have unaccounted units. You can go back to adjust, flag the unaccounted units, or ignore them for now.</p>
                    <ul class="inbound-unaccounted-list">
                        <li v-for="line in inboundUnaccountedLines" :key="line.po_raw_line_id">
                            <strong>{{ line.product_name }}</strong>: {{ line.remaining_units }} unaccounted unit<span v-if="line.remaining_units !== 1">s</span>
                        </li>
                    </ul>
                    <p class="m-0">Choose how to handle the unaccounted units before creating this invoice.</p>
                </div>
            </div>
            <template #footer>
                <Button label="Go Back" icon="pi pi-arrow-left" class="p-button-text" @click="inboundUnaccountedDialog = false" />
                <Button label="Flag Unaccounted" icon="pi pi-flag" class="p-button-warning" @click="submitCreateInvoiceWithUnaccounted('flag')" :loading="inboundCreatingInvoice" />
                <Button label="Ignore Unaccounted" icon="pi pi-check" class="p-button-secondary" @click="submitCreateInvoiceWithUnaccounted('ignore')" :loading="inboundCreatingInvoice" />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="receiveInvoiceDialogVisible"
            :header="receiveInvoiceDialogTitle"
            :modal="true"
            :style="{ width: '1500px', maxWidth: '97vw' }"
            @hide="onReceiveInvoiceDialogHide"
        >
            <div class="receive-invoice-layout">
                <p class="receive-invoice-instructions m-0">
                    Enter how many boxes were received for each invoice product line and where they were stored.
                    Received boxes will be created and linked to this purchase order and invoice.
                </p>

                <DataTable v-if="receiveInvoiceLoading" :value="[1,2,3]" stripedRows showGridlines responsiveLayout="scroll" class="inbound-skeleton-table">
                    <Column header="Invoice"><template #body><div class="skeleton-line skeleton-line--item"></div></template></Column>
                    <Column header="Product"><template #body><div class="skeleton-line skeleton-line--product"></div></template></Column>
                    <Column header="Units"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Default Units / Box"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Expected Boxes"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Boxes Received"><template #body><div class="skeleton-line skeleton-line--number"></div></template></Column>
                    <Column header="Location"><template #body><div class="skeleton-line skeleton-line--item"></div></template></Column>
                </DataTable>

                <DataTable
                    v-else
                    :value="receiveInvoiceLineAllocations"
                    dataKey="row_key"
                    rowGroupMode="subheader"
                    groupRowsBy="invoice_id"
                    sortField="invoice_id"
                    :sortOrder="1"
                    stripedRows
                    removableSort
                    showGridlines
                    responsiveLayout="scroll"
                    class="receive-invoice-table"
                    scrollable 
                    scrollHeight="800px"
                >
                    <template #empty>
                        No invoice-linked raw lines are currently available to receive for this purchase order.
                    </template>

                    <template #groupheader="{ data }">
                        <div class="receive-invoice-group-header">
                            <strong>{{ data.invoice_name || `Invoice #${data.invoice_id}` }}</strong>
                            <span class="receive-invoice-group-sub">Invoice ID: {{ data.invoice_id }}</span>
                            <span class="receive-invoice-group-sub">PO: {{ data.purchase_order_name || `#${data.purchase_order_id}` }}</span>
                        </div>
                    </template>

                    <Column field="product_name" header="Product" sortable />
                    <Column field="item_num" header="Item #" sortable />
                    <Column field="total_units" header="Total Units" sortable />
                    <Column field="default_units_per_case" header="Default Units / Box" sortable />
                    <Column header="Actual Units / Box" sortable>
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.actual_units_per_box"
                                :min="0"
                                :maxFractionDigits="2"
                                :useGrouping="false"
                                class="inbound-units-input"
                            />
                        </template>
                    </Column>
                    <Column header="Expected Boxes" sortable>
                        <template #body="{ data }">
                            {{ getReceiveExpectedBoxes(data) }}
                        </template>
                    </Column>
                    <Column header="Boxes Received" sortable>
                        <template #body="{ data }">
                            <span
                                class="receive-boxes-total"
                                :class="{ 'receive-boxes-total--over': Number(getReceiveAllocatedBoxes(data) || 0) > Number(getReceiveExpectedBoxes(data) || 0) }"
                            >
                                {{ getReceiveAllocatedBoxes(data) }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Location Split (Pallets)">
                        <template #body="{ data }">
                            <div class="receive-split-grid">
                                <div
                                    v-for="(split, splitIdx) in (data.receive_splits || [])"
                                    :key="split.split_key || `${data.row_key}-${splitIdx}`"
                                    class="receive-split-row"
                                >
                                    <InputNumber
                                        v-model="split.boxes_received"
                                        :min="0"
                                        showButtons
                                        :maxFractionDigits="2"
                                        :useGrouping="false"
                                        class="inbound-units-input receive-split-row__boxes"
                                        @update:modelValue="onReceiveSplitBoxesInput(data, split)"
                                    />
                                    <AutoComplete
                                        :modelValue="getLocationAutoCompleteValue(split.location_id)"
                                        :suggestions="filteredLocations"
                                        @complete="searchLocations"
                                        @focus="searchLocations({ query: '' })"
                                        @item-select="onLocationAutoCompleteChange(split, $event.value)"
                                        @update:modelValue="onLocationAutoCompleteChange(split, $event)"
                                        :dropdown="true"
                                        :showOnFocus="true"
                                        optionLabel="name"
                                        placeholder="Select a Location"
                                        class="receive-split-row__location"
                                        :forceSelection="true"
                                    />
                                    <Button
                                        icon="pi pi-times"
                                        class="p-button-text p-button-sm"
                                        @click="removeReceiveSplit(data, Number(splitIdx))"
                                        :disabled="(data.receive_splits || []).length <= 1"
                                    />
                                </div>

                                <div class="receive-split-actions">
                                    <Button
                                        icon="pi pi-plus"
                                        label="Add Location"
                                        class="p-button-text p-button-sm"
                                        @click="addReceiveSplit(data)"
                                    />
                                </div>
                            </div>
                            <small class="p-error" v-if="receiveInvoicesSubmitted && hasReceiveSplitLocationErrors(data)">
                                Every split with received boxes must include a location.
                            </small>
                        </template>
                    </Column>
                </DataTable>

                <small class="p-error" v-if="receiveInvoicesSubmitted && !(receiveInvoiceLineAllocations || []).some((row: any) => Number(getReceiveAllocatedBoxes(row) || 0) > 0)">
                    Enter at least one received box amount before saving.
                </small>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="po-action-btn po-action-btn--secondary" @click="receiveInvoiceDialogVisible = false" :disabled="receiveInvoiceSaving" />
                <Button label="Save Received Boxes" icon="pi pi-check" class="po-action-btn po-action-btn--receive" @click="saveReceivedInvoiceBoxes" :loading="receiveInvoiceSaving" />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="invoiceEditDialogVisible"
            header="Edit Invoice"
            :modal="true"
            :style="{ width: '560px', maxWidth: '94vw' }"
            class="p-fluid po-invoice-edit-dialog"
        >
            <div class="po-invoice-edit-layout">
                <div class="po-invoice-edit-section">
                    <div class="field">
                        <label for="invoiceEditName">Invoice Name</label>
                        <InputText
                            id="invoiceEditName"
                            v-model="invoiceEditDraft.invoice_name"
                            :class="{ 'p-invalid': invoiceEditSubmitted && !String(invoiceEditDraft.invoice_name || '').trim() }"
                            placeholder="Invoice name"
                        />
                        <small class="p-error" v-if="invoiceEditSubmitted && !String(invoiceEditDraft.invoice_name || '').trim()">
                            Invoice name is required.
                        </small>
                    </div>

                    <div class="field">
                        <label for="invoiceEditDateShipped">Date Shipped</label>
                        <input id="invoiceEditDateShipped" v-model="invoiceEditDraft.date_shipped" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditDateDue">Date Due</label>
                        <input id="invoiceEditDateDue" v-model="invoiceEditDraft.date_due" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditDatePaid">Date Paid</label>
                        <input id="invoiceEditDatePaid" v-model="invoiceEditDraft.date_paid" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditNotes">Notes</label>
                        <textarea id="invoiceEditNotes" v-model="invoiceEditDraft.notes" rows="3" class="p-inputtext p-component w-full"></textarea>
                    </div>

                    <div class="po-invoice-edit-checkbox">
                        <input id="invoiceEditFiled" v-model="invoiceEditDraft.filed" type="checkbox" />
                        <label for="invoiceEditFiled">Filed</label>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="po-action-btn po-action-btn--secondary" @click="invoiceEditDialogVisible = false" :disabled="invoiceEditSaving" />
                <Button label="Save Invoice" icon="pi pi-check" class="po-action-btn po-action-btn--primary" @click="saveInvoiceEdits" :loading="invoiceEditSaving" />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="filterDialog"
            header="Filter Purchase Orders"
        >
            <div class="p-fluid">
                <div class="field">
                    <label for="filterField">Filter By</label>
                    <Select id="filterField" v-model="filterMenuField" :options="[
                        { label: 'Purchase Order Name', value: 'purchase_order_name' },
                        { label: 'Vendor Name', value: 'vendor_id' },
                    ]" optionLabel="label" optionValue="value" placeholder="Select a field to filter by" @change="filterMenuValue=''; filterMenuVendor=null" />
                </div>
                
                <div v-if="filterMenuField === 'vendor_id'" class="field">
                    <label for="filterMenuValue">Vendor</label>
                    <AutoComplete 
                        id="filterMenuValue"
                        v-model="filterMenuVendor"
                        :suggestions="filteredVendors"
                        @complete="searchVendors"
                        @focus="searchVendors({ query: '' })"
                        @item-select="onFilterVendorSelect($event.value)"
                        :dropdown="true"
                        :showOnFocus="true"
                        :optionLabel="'vendor_name'"
                        placeholder="Select a vendor to filter by"
                    />
                </div>
                <div v-else class="field">
                    <label for="searchText">Search Text</label>
                    <InputText id="searchText" v-model="filterMenuValue" placeholder="Enter search text" />
                </div>

                <div class="field">
                    <Button label="Apply Filter" icon="pi pi-filter" class="p-button-primary" @click="applyFilter" :disabled="!filterMenuField && (!filterMenuValue.trim() || !filterMenuVendor)" />
                    <Button label="Clear Filter" icon="pi pi-filter-slash" class="p-button-secondary" @click="clearFilter" :disabled="!filterMenuField && (!filterMenuValue.trim() || !filterMenuVendor)" />
                </div>
            </div>

        </Dialog>
        
    </div>
</template>

<script lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import action from "../components/utils/axiosUtils";
import helper from "../components/utils/helperUtils";
import importAction from "../components/utils/importUtils";


import { debounce, keys } from 'lodash';
import { ref } from 'vue'; 

import ZoomDropdown from '@/components/ZoomDropdown.vue';
import ProductAutoComplete from '@/components/ProductAutoComplete.vue';
import { supabase } from '@/clients/supabase';
import { useAuthStore } from '@/stores/auth';
import { pinia } from '@/stores';

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
            invoiceExpandedRowsByPo: {} as Record<number, any>,

            //DIALOG VARIABLES
            submitted: false,
            locationSubmitted: false,

            //PURCHASE ORDER VARIABLES
            purchaseOrders: [] as any[],
            /**@TODO need to see how to consolidate purchaseOrder, selectedPurchaseOrder, and selectedDetailPo */
            purchaseOrder: {} as any,
            purchaseOrderDialog: false,
            selectedPurchaseOrder: [] as any[],
            cancelOrderDialog: false,
            deleteOrderDialog: false,
            deleteOrderText: "",
            editPurchaseOrderDialog: false,
            newPurchaseOrderProductDialog: false,
            unsavedChangesDialog: false,
            statusChangeDialog: false,
            receivedDialog: false,
            newStatus: "",
            headerData: { name: '', vendor_id: 0, status: '', notes: '', discount: 0, date_ordered: null, date_received: null},
            inboundPurchaseOrderDialog: false,
            inboundInvoiceName: '' as string,
            inboundLineAllocations: [] as any[],
            inboundSubmitted: false,
            inboundCreatingInvoice: false,
            inboundUnaccountedDialog: false,
            inboundUnaccountedLines: [] as any[],
            receiveInvoiceDialogVisible: false,
            receiveInvoiceDialogTitle: 'Receive Invoices' as string,
            receiveInvoiceLoading: false,
            receiveInvoiceSaving: false,
            receiveInvoicesSubmitted: false,
            receiveInvoiceLineAllocations: [] as any[],
            invoiceEditDialogVisible: false,
            invoiceEditSaving: false,
            invoiceEditSubmitted: false,
            invoiceEditDraft: {
                invoice_id: null as number | null,
                invoice_name: '',
                total_cost: 0,
                purchase_order_id: 0,
                date_shipped: '',
                date_due: '',
                date_paid: '',
                card: 0,
                filed: false,
                notes: '',
            } as any,

            selectedDetailPo: null as any,
            detailDialogVisible: false,
            detailDialogLoading: false,

            // PO RAW LINES
            rawProductCancelDialog: false,
            rawProductToCancel: null as any,
            editingRows: [] as any[],
            rawEditingRows: [] as any[] | Record<string, boolean>,
            editRawRowsLoading: false,
            inboundBoxesLoading: false,
            inboundBoxes: [] as any[],
            rawOrderType: ['By Box', 'By Unit'],
            selectedOrderType: "",
            

            // PO RECIPES
            recipeEditingRows: [] as any[],
            editRecipeRowsLoading: false,
            activeRecipeEditRow: null as any,

            //PRODUCTS VARIABLES
            products: [] as any[],
            unprocProducts: [] as any[],
            procProducts: [] as any[],
            product: {} as any,
            selectedProducts: [] as any[],
            totalErrorMSG: "" as string,
            // filteredProducts: [] as any[],
            filteredRawProducts: [] as any[],

            // IMPORTANT PRODUCT FIELDS DIALOG
            missingDefaultUnitsDialog: false,
            isProcMissingDefaultUnits: false,
            procProdMissingDefaults: null as any,
            missingProcDefaultUnits: 0,
            missingDefaults: [] as Array<{
                product_id: number;
                recipe_id: number | null;
                name: string;
                item_num: string;
                default_units_per_case: number | null;
                price_2023: number | null;
                recipe_input_units: number | null;
                requires_default_units_per_case: boolean;
                requires_price_2023: boolean;
                requires_recipe_input_units: boolean;
            }>,
            missingDefaultsRecipeIndex: null as number | null,

            // MISSING VENDOR NICKNAME DIALOG
            missingVendorNicknameDialog: false,
            pendingVendorNickname: '',

            // RAW PRODUCT CANCEL OPTIONS
            rawProductCancelOption: 'boxes' as 'boxes' | 'units',
            rawProductCancelAmount: 0 as number,

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
            po_raw_products: [] as any[],
            invoices: [] as any[],
            singlePoRawProducts: [] as any[],

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
            filteredLocations: [] as any[],
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
            isSavingEditDialog: false,
            statuses: [
                'Draft',
                'Submitted',
                'Ordered',
                'Inbound',
            ],
            poPhaseSteps: [
                { label: 'Submitted', status: 'Submitted', icon: 'pi pi-envelope' },
                { label: 'Ordered', status: 'Ordered', icon: 'pi pi-box' },
                { label: 'Inbound', status: 'Inbound', icon: 'pi pi-truck' },
                { label: 'Delivered', status: 'Delivered', icon: 'pi pi-check' },
            ],
            filterDialog: false,
            filterMenuField: '',
            filterMenuValue: '',
            filterMenuVendor: {} as any,
            filterField: '',
            filterValue: '',
            searchText: '',
            currentPage: 1,
            rowsPerPage: 25,
            totalRecords: 0,
            sortField: '',
            sortOrder: -1,
            tableLoading: false,
            poViewMode: 'cards' as 'cards' | 'table',
            poPopupRefs: {} as Record<number, any>,

            saving: false,
            autoSaveState: 'idle' as 'idle' | 'saving' | 'saved',

            activePoLock: null as any,
            currentEditingPoId: null as number | null,
            poLockHeartbeatTimer: null as any,
            poLockChannel: null as any,
            poChannel: null as any,
            poRecChannel: null as any,
            poBoxChannel: null as any,
            poBoxLineChannel: null as any,
            lockNoticeShown: false,

        }
    },
    created() {
        this.initFilters();
        this.loadPoViewModePreference();
        this.lazySave = debounce(() => this.save(), 250, { trailing: true }) as (() => Promise<void>);
        this.onSearchDebounced = debounce(async () => {
            this.filterValue = this.searchText;
            this.currentPage = 1;
            this.tableLoading = true;
            await this.loadPage(1);
        }, 300, { trailing: true }) as (() => Promise<void>);
    },
    watch: {
        purchaseOrder: {
        deep: true,
        handler() {
            if (this.isInitializingPurchaseOrder || !this.editPurchaseOrderDialog || this.isPoReadOnly) return;
            this.lazySave();
        }
        },
        searchText: {
            handler() { 
                if(this.filterDialog) return; // don't trigger search when changing search text from filter dialog
                this.onSearchDebounced(); 
            }
        },
        poViewMode: {
            handler() { this.persistPoViewModePreference(); }
        }
    },
    async mounted() {
        console.log('Mounted');
        this.tableLoading = true;
        await this.initVariables();      // loads vendors/products/recipes you already use
        
        await this.loadPage(1);          // load first page for the table

        this.setupPoLockRealtime();
    },
    beforeUnmount() {
        this.stopPoLockHeartbeat();
        void this.releaseActivePoLock();

        if (this.poLockChannel) {
            void supabase.removeChannel(this.poLockChannel);
            this.poLockChannel = null;
        }

        if (this.poChannel) {
            void supabase.removeChannel(this.poChannel);
            this.poChannel = null;
        }

        if (this.poRecChannel) {
            void supabase.removeChannel(this.poRecChannel);
            this.poRecChannel = null;
        }

        if (this.poBoxChannel) {
            void supabase.removeChannel(this.poBoxChannel);
            this.poBoxChannel = null;
        }

        if (this.poBoxLineChannel) {
            void supabase.removeChannel(this.poBoxLineChannel);
            this.poBoxLineChannel = null;
        }
    },
    computed: {
        authStore() {
            return useAuthStore(pinia);
        },
        currentEditorUserId(): string | null {
            return this.authStore?.user?.id ?? null;
        },
        currentEditorName(): string {
            return this.authStore?.profile?.full_name || this.authStore?.user?.email || 'Another user';
        },
        isPoReadOnly(): boolean {
            if (!this.activePoLock || !this.currentEditorUserId) return false;
            return this.activePoLock.editor_user_id !== this.currentEditorUserId;
        },
        poReadOnlyMessage(): string {
            if (!this.isPoReadOnly) return '';
            const editorName = this.activePoLock?.editor_name || 'another user';
            return `Read-only mode: ${editorName} is currently editing this purchase order.`;
        },
        selectedWorkspacePo(): any {
            if (Array.isArray(this.selectedPurchaseOrder)) {
                return this.selectedPurchaseOrder[0] || null;
            }
            return this.selectedPurchaseOrder || null;
        },
        workspaceInvoiceList(): any[] {
            const poId = Number(this.selectedWorkspacePo?.purchase_order_id || 0);
            if (!poId) return [];

            return (this.invoices || [])
                .filter((invoice: any) => Number(invoice?.purchase_order_id || 0) === poId)
                .sort((a: any, b: any) => Number(b?.invoice_id || 0) - Number(a?.invoice_id || 0));
        },
        workspaceUninvoicedLines(): any[] {
            const poId = Number(this.selectedWorkspacePo?.purchase_order_id || 0);
            if (!poId) return [];

            const selectedPoLines = Array.isArray(this.selectedWorkspacePo?.po_raw_lines)
                ? this.selectedWorkspacePo.po_raw_lines
                : [];
            const sourceLines = selectedPoLines.length > 0
                ? selectedPoLines
                : (this.po_raw_products || []).filter((line: any) => Number(line?.purchase_order_id || 0) === poId);

            return (sourceLines || [])
                .filter((line: any) => !line?.invoice_id && (line?.status || '').toLowerCase() !== 'cancelled')
                .sort((a: any, b: any) => (a?.product_name || '').localeCompare(b?.product_name || ''));
        },
        workspaceInvoicedUnits(): number {
            return (this.workspaceInvoiceList || []).reduce((invoiceTotal: number, invoice: any) => {
                const invoiceUnits = this.getInvoiceLinkedLines(invoice)
                    .reduce((lineTotal: number, line: any) => lineTotal + Number(line?.total_units || 0), 0);
                return invoiceTotal + invoiceUnits;
            }, 0);
        },
        detailSelectedPoId(): number {
            return Number(this.selectedDetailPo?.purchase_order_id || this.selectedWorkspacePo?.purchase_order_id || 0);
        },
        detailInvoiceList(): any[] {
            const poId = this.detailSelectedPoId;
            if (!poId) return [];

            return (this.invoices || [])
                .filter((invoice: any) => Number(invoice?.purchase_order_id || 0) === poId)
                .sort((a: any, b: any) => Number(a?.invoice_id || 0) - Number(b?.invoice_id || 0));
        },
        detailPlannedCases(): any[] {
            const poId = this.detailSelectedPoId;
            if (!poId) return [];

            return (this.poRecipes || [])
                .filter((recipe: any) => Number(recipe?.purchase_order_id || 0) === poId)
                .map((recipe: any, idx: number) => {
                    const recipeId = Number(recipe?.recipe_id || 0);
                    /* const recipeOutput = (this.displayRecipeElements || []).find((element: any) =>
                        Number(element?.recipe_id || 0) === recipeId && element?.type === 'output'
                    ); */
                    const recipeKey = (this.purchaseOrder.recipes || []).find((rec: any) => Number(rec?.recipe_id || 0) === recipeId);
                    const product = (this.products || []).find((p: any) => Number(p?.product_id || 0) === Number(recipeKey?.output_product_id || 0))
                        || (this.procProducts || []).find((p: any) => Number(p?.product_id || 0) === Number(recipeKey?.output_product_id || 0));
                    const unitsPerCase = Number(product?.default_units_per_case || recipe?.units_per_case || 0);
                    const qty = Number(recipe?.qty || 0);
                    const cases = unitsPerCase > 0 ? Number((qty / unitsPerCase).toFixed(2)) : 0;

                    return {
                        ...recipe,
                        line_key: `planned-${recipe?.po_recipe_id || recipeId || idx}`,
                        recipe_name: recipe?.label || recipe?.recipe_name || `Recipe #${recipeId || 'N/A'}`,
                        product_name: product?.name || recipe?.product_name || 'Unknown product',
                        units_per_case: unitsPerCase,
                        amount: cases,
                        qty,
                    };
                });
        },
        detailRawLines(): any[] {
            const poId = this.detailSelectedPoId;
            if (!poId) return [];

            const sourceLines = this.getPurchaseOrderLinesForDisplay(poId, this.selectedDetailPo);
            const groupedByProduct = new Map<string, any>();

            (sourceLines || [])
                .filter((line: any) => this.normalizeRawLineStatus(line?.status) !== 'Cancelled')
                .forEach((line: any, idx: number) => {
                    const productId = Number(line?.product_id || 0);
                    const productName = line?.product_name || this.getProductInfo(productId, 'name') || 'Unknown product';
                    const itemNum = line?.item_num || this.getProductInfo(productId, 'item_num') || '';
                    const key = productId > 0
                        ? `product-${productId}`
                        : `product-name-${String(productName).toLowerCase()}`;

                    const existing = groupedByProduct.get(key);
                    
                    let nameForLine = productName;

                    if(line?.status === 'Flagged')
                        nameForLine+='*';

                    if (existing && line?.status !== 'Flagged') {
                        existing.total_units += Number(line?.total_units || 0);
                    } else {
                        groupedByProduct.set(key, {
                            ...line,
                            line_key: key,
                            product_id: productId || null,
                            product_name: nameForLine,
                            item_num: itemNum,
                            total_units: Number(line?.total_units || 0),
                            first_seen_idx: idx,
                        });
                    }
                });

            return Array.from(groupedByProduct.values())
                .sort((a: any, b: any) => String(a?.product_name || '').localeCompare(String(b?.product_name || '')))
                .map((line: any) => {
                    const { first_seen_idx, ...rest } = line;
                    return rest;
                });
                /* .map((line: any) => {
                    const productId = Number(line?.product_id || 0);
                    const productName = line?.product_name || this.getProductInfo(productId, 'name') || 'Unknown product';
                    const itemNum = line?.item_num || this.getProductInfo(productId, 'item_num') || '';
                    const key = productId > 0
                        ? `product-${productId}-${line?.total_units || 0}`
                        : `product-name-${String(productName).toLowerCase()}`;

                    const existing = groupedByProduct.get(key) || {
                        ...line,
                        line_key: key,
                        product_id: productId || null,
                        product_name: productName,
                        item_num: itemNum,
                        total_units: 0,
                    };

                    existing.total_units += Number(line?.total_units || 0);
                    groupedByProduct.set(key, existing);

                    console.log("Existing grouped line for key", key, existing);

                    return existing;
                })
                .sort((a: any, b: any) => String(a?.product_name || '').localeCompare(String(b?.product_name || ''))); */

                /*
                .reduce((array: any[], line: any) => {
                    const productId = Number(line?.product_id || 0);
                    const productName = line?.product_name || this.getProductInfo(productId, 'name') || 'Unknown product';
                    const itemNum = line?.item_num || this.getProductInfo(productId, 'item_num') || '';
                    const key = productId > 0
                        ? `product-${productId}`
                        : `product-name-${String(productName).toLowerCase()}`;

                    if (array[key]){
                            array.total_units += Number(line?.total_units || 0);
                    } else {
                        array[key] = {
                            ...line,
                            line_key: key,
                            product_id: productId || null,
                            product_name: productName,
                            item_num: itemNum,
                            total_units: 0,
                        };
                    }                 
                    
                    console.log("Existing grouped line for key", key, array);

                    return array;
                })
                
                 */
            /* (this.getPurchaseOrderLinesForDisplay(poId, this.selectedDetailPo) || [])
                .filter((line: any) => this.normalizeRawLineStatus(line?.status) !== 'Cancelled')
                .forEach((line: any) => {
                    const productId = Number(line?.product_id || 0);
                    const productName = line?.product_name || this.getProductInfo(productId, 'name') || 'Unknown product';
                    const key = productId > 0
                        ? `product-${productId}`
                        : `product-name-${String(productName).toLowerCase()}`;

                    const existing = groupedByProduct.get(key) || {
                        ...line,
                        line_key: key,
                        product_id: productId || null,
                        product_name: productName,
                        total_units: 0,
                    };

                    existing.total_units += Number(line?.total_units || 0);
                    groupedByProduct.set(key, existing);
                });

            return Array.from(groupedByProduct.values())
                .sort((a: any, b: any) => String(a?.product_name || '').localeCompare(String(b?.product_name || ''))); */
        },
        detailArrivedBoxes(): any[] {
            const poId = this.detailSelectedPoId;
            if (!poId) return [];

            console.log("Detail Arrived Boxes: ", this.selectedDetailPo.grouped_boxes);
            console.log("Arrived Boxes Length: ", this.selectedDetailPo.grouped_boxes.length);

            return (this.selectedDetailPo.grouped_boxes || [])
                .filter((box: any) => Number(box?.purchase_order_id || 0) === poId && this.normalizeRawLineStatus(box?.status) !== 'Cancelled')
                .map((box: any, idx: number) => {
                    return {
                        ...box,
                        line_key: `arrived-${box?.po_case_id || idx}`,
                    };
                })
                .sort((a: any, b: any) => String(a?.product_name || '').localeCompare(String(b?.product_name || '')));
        },
        detailInvoiceRows(): any[] {
            const invoiceRows: any[] = [];
            const discountPct = Number(this.selectedDetailPo?.discount || 0);
            const discountMultiplier = 1 - (Number.isFinite(discountPct) ? discountPct : 0) / 100;

            (this.detailInvoiceList || []).forEach((invoice: any, invoiceIdx: number) => {
                const linkedLines = this.getInvoiceLinkedLines(invoice);
                const receivableLines = this.getInvoiceReceiveableLines(invoice);
                const groupKey = `invoice-${invoice?.invoice_id || invoiceIdx}`;
                const computedInvoiceTotal = linkedLines.reduce((invoiceTotal: number, line: any) => {
                    const units = Number((line?.units_on_invoice ?? line?.total_units) || 0);
                    const fallbackUnitCost = Number(this.getUnitCost(line?.product_id) || 0);
                    const unitCost = Number(line?.unit_price ?? fallbackUnitCost);
                    if (!Number.isFinite(units) || !Number.isFinite(unitCost)) return invoiceTotal;

                    return invoiceTotal + (units * unitCost * discountMultiplier);
                }, 0);

                if (!linkedLines.length) {
                    invoiceRows.push({
                        ...invoice,
                        invoice_group_key: groupKey,
                        line_key: `${groupKey}-none`,
                        has_line: false,
                        invoice_id: invoice?.invoice_id,
                        invoice_name: invoice?.invoice_name,
                        total_cost: 0,
                        date_shipped: invoice?.date_shipped,
                        date_due: invoice?.date_due,
                        date_paid: invoice?.date_paid,
                        filed: invoice?.filed,
                        invoice_notes: invoice?.notes,
                        linked_line_count: 0,
                        can_receive: receivableLines.length > 0,
                    });
                    return;
                }

                linkedLines.forEach((line: any, lineIdx: number) => {
                    invoiceRows.push({
                        ...line,
                        invoice_group_key: groupKey,
                        line_key: `${groupKey}-${line?.po_raw_line_id || lineIdx}`,
                        has_line: true,
                        invoice_id: invoice?.invoice_id,
                        invoice_name: invoice?.invoice_name,
                        total_cost: Number(computedInvoiceTotal.toFixed(2)),
                        date_shipped: invoice?.date_shipped,
                        date_due: invoice?.date_due,
                        date_paid: invoice?.date_paid,
                        filed: invoice?.filed,
                        invoice_notes: invoice?.notes,
                        linked_line_count: linkedLines.length,
                        line_notes: line?.notes,
                        can_receive: receivableLines.length > 0,
                    });
                });
            });

            return invoiceRows;
        },
        activeReceiveInvoices(): any[] {
            return this.getActiveReceiveInvoices(this.invoices || []);
        },
    },
    methods: {
        lazySave: () => Promise.resolve(),
        onSearchDebounced: async () => Promise.resolve(),

        getPoViewModeStorageKey() {
            return 'inventory-app.po-view-mode';
        },

        loadPoViewModePreference() {
            if (typeof window === 'undefined') return;

            const savedPreference = window.localStorage.getItem(this.getPoViewModeStorageKey());
            if (savedPreference === 'cards' || savedPreference === 'table') {
                this.poViewMode = savedPreference;
            }
        },

        persistPoViewModePreference() {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(this.getPoViewModeStorageKey(), this.poViewMode);
        },

        setPoPopupRef(el: any, purchaseOrderId: number) {
            const poId = Number(purchaseOrderId || 0);
            if (!poId) return;

            if (el) {
                this.poPopupRefs[poId] = el;
                return;
            }

            delete this.poPopupRefs[poId];
        },

        togglePoPopup(event: any, purchaseOrderId: number) {
            const poId = Number(purchaseOrderId || 0);
            if (!poId) return;

            const popover = this.poPopupRefs[poId] as any;
            if (popover?.toggle) {
                popover.toggle(event);
            }
        },

        confirmDeletePurchaseOrder(purchaseOrder: any) {
            this.selectedPurchaseOrder = purchaseOrder;
            this.purchaseOrder = purchaseOrder;
            this.deleteOrderDialog = true;
        },

        async deletePurchaseOrder(purchaseOrder: any) {
            if (!purchaseOrder?.purchase_order_id) return;

            try {
                this.loading = true;
                await action.deletePurchaseOrder(purchaseOrder.purchase_order_id);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Purchase Order Deleted',
                    detail: `Purchase order "${purchaseOrder.purchase_order_name}" has been deleted.`,
                    life: 4000,
                });
                await this.loadPage(this.currentPage);
            } catch (error) {
                console.error("Error deleting purchase order:", error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error Deleting Purchase Order',
                    detail: `An error occurred while trying to delete "${purchaseOrder.purchase_order_name}". Please try again.`,
                    life: 5000,
                });
            } finally {
                this.loading = false;
                this.deleteOrderDialog = false;
                this.deleteOrderText = '';
            }
        },

        setPoViewMode(mode: 'cards' | 'table') {
            this.poViewMode = mode;
        },

        openFilterMenu(){
            this.filterDialog = true;
        },

        setFilterIcon(){
            return this.filterField === '' ? String('pi pi-filter') : String('pi pi-filter-fill');
        },

        isSearchBarDisabled() {
            return this.filterMenuField !== '';
        },

        isFilterBoxDisabled(){
            return this.searchText !== '';  
        },

        isOrderDeleteButtonDisabled(purchaseOrder: any){
            return purchaseOrder.status !== 'Draft';
        },

        applyFilter(){
            if(this.filterMenuVendor && this.filterMenuField === 'vendor_id'){
                console.log("Applying vendor filter with value", this.filterMenuVendor);
                this.filterMenuValue = String(this.filterMenuVendor?.vendor_id);
            }

            if (this.filterMenuField) {
                this.filterField = this.filterMenuField;
                this.filterValue = this.filterMenuValue.trim();
            } else {
                this.filterField = '';
                this.filterValue = '';
            }
            
            console.log("Applying filter with field", this.filterMenuField, "and value", this.filterMenuValue);

            this.loadPage(1);
            this.filterDialog = false;
        },

        clearFilter(){
            this.filterField = '';
            this.filterValue = '';
            this.filterMenuVendor = '';
            this.filterMenuField = '';
            this.filterMenuValue = '';
            this.filterDialog = false;
            this.loadPage(1);
        },

        onFilterVendorSelect(event: any){
            console.log(event);
            this.filterMenuVendor = event;
        },

        openInboundWorkspace(purchaseOrder: any) {
            this.selectedPurchaseOrder = purchaseOrder;
            void this.openInboundDialog(purchaseOrder);
        },

        openReceiveInvoicesWorkspace(purchaseOrder: any) {
            this.selectedPurchaseOrder = purchaseOrder;
            const purchaseOrderId = Number(purchaseOrder?.purchase_order_id || 0);
            const purchaseOrderInvoices = (this.invoices || []).filter((invoice: any) =>
                Number(invoice?.purchase_order_id || 0) === purchaseOrderId,
            );

            void this.openReceiveInvoiceDialog({
                purchaseOrder,
                invoices: purchaseOrderInvoices,
                title: `Receive Invoices for ${purchaseOrder?.purchase_order_name || 'Purchase Order'}`,
            });
        },

        openReceiveAllActiveInvoices() {
            const activeInvoices = this.getActiveReceiveInvoices(this.invoices || []);
            if (!activeInvoices.length) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'No Active Invoices',
                    detail: 'There are no active invoice lines available to receive on this page.',
                    life: 4000,
                });
                return;
            }

            void this.openReceiveInvoiceDialog({
                invoices: activeInvoices,
                title: `Receive ${activeInvoices.length} Active Invoice${activeInvoices.length === 1 ? '' : 's'}`,
            });
        },

        openReceiveInvoiceFromDetail(invoiceRow: any) {
            const sourceInvoice = (this.invoices || []).find((invoice: any) =>
                Number(invoice?.invoice_id || 0) === Number(invoiceRow?.invoice_id || 0),
            ) || invoiceRow;

            if (!this.canReceiveInvoice(sourceInvoice)) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Nothing To Receive',
                    detail: 'That invoice does not have any active linked raw lines to receive.',
                    life: 4000,
                });
                return;
            }

            this.detailDialogVisible = false;
            void this.openReceiveInvoiceDialog({
                purchaseOrder: this.selectedDetailPo,
                invoices: [sourceInvoice],
                title: `Receive ${sourceInvoice?.invoice_name || `Invoice #${sourceInvoice?.invoice_id || ''}`}`,
            });
        },

        openEditWorkspace(purchaseOrder: any) {
            this.selectedPurchaseOrder = purchaseOrder;
            void this.onPurchaseOrderDialogOpen(purchaseOrder);
        },

        async openDetailDialog(purchaseOrder: any) {
            this.selectedDetailPo = purchaseOrder;
            this.selectedPurchaseOrder = purchaseOrder;
            this.purchaseOrder = purchaseOrder;

            try{
                this.loading = true;
                this.tableLoading = true;
                const purchaseOrderId = Number(purchaseOrder?.purchase_order_id || 0);
                let rawLines = purchaseOrder.po_raw_lines || await action.getCurrentPurchaseOrderRawLines(purchaseOrderId);

                // Legacy bootstrap: old orders may have only individual boxes and no po_raw_lines yet.
                if (!Array.isArray(rawLines) || rawLines.length === 0) {
                    const legacyBoxes = (purchaseOrder.individual_boxes || []).filter((box: any) =>
                        Number(box?.purchase_order_id) === Number(purchaseOrderId),
                    );

                    // ensureRawLinesExist builds lines from uBoxes; seed it from row payload if needed.
                    if (legacyBoxes.length > 0) {
                        const hasCurrentPoBoxesInCache = (this.uBoxes || []).some((box: any) =>
                            Number(box?.purchase_order_id) === Number(purchaseOrderId),
                        );

                        if (!hasCurrentPoBoxesInCache) {
                            this.uBoxes = [...(this.uBoxes || []), ...legacyBoxes];
                        }

                        console.log("About to ensure raw lines exist");
                        rawLines = await this.ensureRawLinesExist();
                    }
                }

                this.purchaseOrder.po_raw_lines = rawLines || [];
                this.detailDialogVisible = true;
            } catch (error) {
                console.error("Error loading purchase order details:", error);
            } finally {
                this.loading = false;
                this.tableLoading = false;
            }
            
        },

        ensurePoEditable(actionLabel = 'edit this purchase order') {
            if (!this.isPoReadOnly) return true;

            this.$toast.add({
                severity: 'warn',
                summary: 'Read-only Purchase Order',
                detail: `You cannot ${actionLabel} while another user holds the edit lock.`,
                life: 4500,
            });
            return false;
        },

        /**
         * Returns the lock namespace used by this page.
         *
         * @returns The lock table namespace string for purchase orders.
         */
        getPoLockTableName() {
            return 'purchase_orders';
        },

        
        /**
         * Tears down any existing PO page subscription and starts a fresh one
         * scoped to the provided purchase order ids (typically the current page).
         *
         * @param po_ids The purchase order ids to subscribe to.
         */
        setupPoPageRealtime(ids: {
            po_ids: number[];
            box_ids?: number[];
            po_recipe_ids?: number[];
            po_raw_line_ids?: number[];
        }) {
            // Tear down all existing page-scoped channels before rebuilding
            const channelsToRemove = [
                { key: 'poChannel' },
                { key: 'poBoxChannel' },
                { key: 'poRecChannel' },
                { key: 'poBoxLineChannel' },
            ];
            channelsToRemove.forEach(({ key }) => {
                if ((this as any)[key]) {
                    void supabase.removeChannel((this as any)[key]);
                    (this as any)[key] = null;
                }
            });

            const { po_ids, box_ids = [], po_recipe_ids = [], po_raw_line_ids = [] } = ids;
            // Realtime callbacks reload data only — they do NOT rebuild subscriptions,
            // which would cause infinite recursion (loadPage → setupPoPageRealtime → loadPage…).
            const refresh = () => { void this.loadPage(this.currentPage, { rebuildSubscriptions: false }); };

            if (po_ids.length) {
                this.poChannel = action.subscribeToPurchaseOrderChanges(po_ids, refresh);
            }
            if (box_ids.length) {
                this.poBoxChannel = action.subscribeToCaseChanges(box_ids, refresh);
            }
            if (po_recipe_ids.length) {
                this.poRecChannel = action.subscribeToPurchaseOrderRecipeChanges(po_recipe_ids, refresh);
            }
            if (po_raw_line_ids.length) {
                this.poBoxLineChannel = action.subscribeToPurchaseOrderRawLineChanges(po_raw_line_ids, refresh);
            }
        },

        /**
         * Starts realtime subscription for lock changes on purchase orders.
         *
         * @returns void
         */
        setupPoLockRealtime() {
            if (this.poLockChannel) {
                void supabase.removeChannel(this.poLockChannel);
            }

            this.poLockChannel = action.subscribeToRecordLocks(this.getPoLockTableName(), () => {
                if (!this.currentEditingPoId) return;
                void this.syncActivePoLock();
            });
        },

        /**
         * Pulls the latest lock state for the currently edited PO.
         * If lock is released while dialog is open, this attempts reacquire.
         *
         * @returns Promise<void>
         */
        async syncActivePoLock() {
            if (!this.currentEditingPoId) return;

            const latestLock = await action.getRecordEditLock(this.getPoLockTableName(), this.currentEditingPoId);
            this.activePoLock = latestLock || null;

            if (!latestLock && this.editPurchaseOrderDialog) {
                await this.acquirePoLock(this.currentEditingPoId);
                return;
            }

            if (this.isPoReadOnly && !this.lockNoticeShown) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Read-only Purchase Order',
                    detail: this.poReadOnlyMessage,
                    life: 6000,
                });
                this.lockNoticeShown = true;
            }
        },

        /**
         * Attempts to acquire edit lock for a PO and starts heartbeat when acquired.
         *
         * @param purchaseOrderId The purchase order id to lock for editing.
         * @returns True when lock is acquired by current user, otherwise false.
         */
        async acquirePoLock(purchaseOrderId: number) {
            this.lockNoticeShown = false;
            const result = await action.acquireRecordEditLock(this.getPoLockTableName(), purchaseOrderId, this.currentEditorName, 120);
            this.activePoLock = result?.lock || null;
            this.currentEditingPoId = purchaseOrderId;

            if (result?.acquired) {
                this.startPoLockHeartbeat();
                return true;
            }

            this.stopPoLockHeartbeat();

            if (this.isPoReadOnly && !this.lockNoticeShown) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Read-only Purchase Order',
                    detail: this.poReadOnlyMessage,
                    life: 6000,
                });
                this.lockNoticeShown = true;
            }

            return false;
        },

        /**
         * Sends periodic lock heartbeat while the current user owns the lock.
         *
         * @returns void
         */
        startPoLockHeartbeat() {
            this.stopPoLockHeartbeat();

            this.poLockHeartbeatTimer = setInterval(async () => {
                if (!this.currentEditingPoId || this.isPoReadOnly) return;

                try {
                    const refreshed = await action.refreshRecordEditLock(this.getPoLockTableName(), this.currentEditingPoId, 120);
                    if (!refreshed?.refreshed) {
                        await this.syncActivePoLock();
                    }
                } catch (error) {
                    console.error('Error refreshing purchase order lock:', error);
                }
            }, 30000);
        },

        /**
         * Stops lock heartbeat timer if active.
         *
         * @returns void
         */
        stopPoLockHeartbeat() {
            if (this.poLockHeartbeatTimer) {
                clearInterval(this.poLockHeartbeatTimer);
                this.poLockHeartbeatTimer = null;
            }
        },

        /**
         * Releases the active PO lock when current user is the lock owner.
         *
         * @returns Promise<void>
         */
        async releaseActivePoLock() {
            if (!this.currentEditingPoId || this.isPoReadOnly) {
                this.stopPoLockHeartbeat();
                this.activePoLock = null;
                this.currentEditingPoId = null;
                return;
            }

            try {
                await action.releaseRecordEditLock(this.getPoLockTableName(), this.currentEditingPoId);
            } catch (error) {
                console.error('Error releasing purchase order lock:', error);
            } finally {
                this.stopPoLockHeartbeat();
                this.activePoLock = null;
                this.currentEditingPoId = null;
            }
        },

        /**
         * Check if there are unsaved records in the recipe or raw boxes tables.
         * Unsaved records are those without a persisted ID.
         *
         * @returns boolean
         */
        hasUnsavedRecords(): boolean {
            if(this.purchaseOrder.status !== 'Delivered'){
            const unsavedRecipes = (this.singlePoRecipes || []).some(
                (recipe: any) => !recipe.po_recipe_id
            );
            const unsavedRawBoxes = (this.poBoxes || []).some(
                (box: any) => {
                    if (!box) return false;

                    // Persisted rows can come from legacy grouped boxes that do not have po_raw_line_id.
                    if (box.po_raw_line_id) return false;
                    if (typeof box.line_key === 'string' && box.line_key.startsWith('legacy-')) return false;

                    // Only treat rows with actual user input as unsaved/transient records.
                    const hasUserInput = Boolean(
                        box.product_id
                        || box.productObj
                        || Number(box.amount || 0) > 0
                        || Number(box.total || 0) > 0
                    );

                    return hasUserInput;
                }
            );
            return unsavedRecipes || unsavedRawBoxes;
            }
            return false;
        },

        /**
         * Closes dialog and releases lock in one call path.
         * Shows a confirmation dialog if there are unsaved changes.
         *
         * @returns Promise<void>
         */
        async closeEditPurchaseOrderDialog() {
            if (this.hasUnsavedRecords()) {
                this.unsavedChangesDialog = true;
                return;
            }
            await this.releaseActivePoLock();
            this.editPurchaseOrderDialog = false;
            this.autoSaveState = 'idle';
        },

        /**
         * Force close the dialog without saving, after user confirmation.
         *
         * @returns Promise<void>
         */
        async forceCloseEditDialog() {
            this.unsavedChangesDialog = false;
            await this.releaseActivePoLock();
            this.editPurchaseOrderDialog = false;
            this.autoSaveState = 'idle';
        },

        /**
         * Safety release path for non-button close events.
         *
         * @returns void
         */
        onEditPurchaseOrderDialogHide() {
            void this.releaseActivePoLock();
            this.autoSaveState = 'idle';
        },

        /**
         * Creates a draft PO immediately after vendor selection, then opens normal edit flow.
         *
         * @returns Promise<void>
         */
        async startNewPurchaseOrderDraftFlow() {
            this.vendorDialog = false;
            this.vendorSubmitted = false;
            this.poBoxes = [];
            this.poCases = [];
            this.recipeArray = [];
            this.selectedOrderType = '';
            this.amount = 1;

            const nickname = (this.purchaseOrder?.vendor?.vendor_nickname || '').trim();
            if (!nickname) {
                this.pendingVendorNickname = '';
                this.missingVendorNicknameDialog = true;
                return;
            }

            await this.continueOpenNewWithNickname(nickname);

            this.purchaseOrder.notes = this.purchaseOrder.notes ?? '';
            this.purchaseOrder.discount = this.purchaseOrder.discount ?? 0;
            this.purchaseOrder.date_ordered = this.purchaseOrder.date_ordered ?? null;
            this.purchaseOrder.date_received = this.purchaseOrder.date_received ?? null;

            const purchaseOrderId = await action.addPurchaseOrder(this.purchaseOrder);
            this.purchaseOrder.purchase_order_id = purchaseOrderId;

            await this.loadPage(1);
            await this.onPurchaseOrderDialogOpen({ ...this.purchaseOrder });
        },
        
        async save(): Promise<void> { 
            try {
                if (this.isPoReadOnly) {
                    return;
                }

                this.autoSaveState = 'saving';
                if(this.purchaseOrder.purchase_order_id){
                    const editedPO = await action.editPurchaseOrder(this.purchaseOrder);
                    console.log(editedPO);
                    if(editedPO.date_ordered)
                        editedPO.date_ordered = editedPO.date_ordered.split('T')[0];
                    if(editedPO.date_received)
                        editedPO.date_received = editedPO.date_received.split('T')[0];

                    this.purchaseOrderRefresh(editedPO.purchase_order_id, {
                        syncTable: true,
                        syncDialog: Number(this.purchaseOrder?.purchase_order_id || 0) === Number(editedPO.purchase_order_id),
                        patchRowData: editedPO,
                    });
                }
                this.autoSaveState = 'saved';
            } catch (error) {
                this.autoSaveState = 'idle';
                console.error(error);
            }
         }, 

         async onSort(event: any){
            console.log("SORT EVENT: ", event);
            this.sortField = event.sortField;
            this.sortOrder = event.sortOrder;
            this.currentPage = 1;
            this.tableLoading = true;
            await this.loadPage(1);
         },

         async loadPage(page: number, { rebuildSubscriptions = true }: { rebuildSubscriptions?: boolean } = {}) {
            try {
                this.tableLoading = true;
                // this.loading = true;
                // console.log("Search Text: ", this.searchText);

                // Get total count (for paginator) and current page rows
                const data = await action.getPurchaseOrdersPage(
                    page,
                    this.rowsPerPage,
                    this.filterField || '',
                    this.filterValue || '',
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
                this.mergeProductsIntoCache(data.all_products || []);

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
                this.po_raw_products = data.all_po_raw_lines || [];
                this.invoices = data.all_invoices || [];
                // this.pCases = await action.getProcrocCasesForPOPage(poIds); // Taking out for now because po_recipes fills the gap for this
                // await action.getRecipesAndElementsForPOs(poIds);

                // console.log("BOXES: ", this.uBoxes);
                // console.log("CASES: ", this.pCases);
                
                // Subscribe to realtime changes for the POs now visible on this page.
                // Only rebuild subscriptions on intentional navigations, not on realtime-triggered reloads.
                if (rebuildSubscriptions) {
                    this.setupPoPageRealtime({
                        po_ids: data.purchase_order_ids ?? [],
                        box_ids: data.all_boxes_ids ?? [],
                        po_recipe_ids: data.all_po_recipes_ids ?? [],
                        po_raw_line_ids: data.all_po_raw_lines_ids ?? [],
                    });
                }

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
                this.tableLoading = false;
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
                console.error(error);
            }
        },

        async getProducts(){
            try {
                //this.products = await action.getUnprocProducts();
                this.products = await action.getProducts();
                this.procProducts = [];
                this.unprocProducts = [];

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

        async getProcProductsForVendor(){
            try {
                this.procProducts = await action.getProcessedProductsForVendor(this.purchaseOrder.vendor_id);
            } catch (err) {
                console.log(err);
            }
        },

        async getAllProductsForVendor(){
            try {
                const vendorProducts = await action.getAllProductsForVendor(this.purchaseOrder.vendor_id);
                this.mergeProductsIntoCache(vendorProducts || []);
            } catch (err) {
                console.log(err);
            }
        },

        mergeProductsIntoCache(incomingProducts: any[]){
            if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
                return;
            }

            const productById = new Map<number, any>();

            (this.products || []).forEach((product: any) => {
                if (product?.product_id !== undefined && product?.product_id !== null) {
                    productById.set(product.product_id, product);
                }
            });

            incomingProducts.forEach((product: any) => {
                if (product?.product_id !== undefined && product?.product_id !== null) {
                    productById.set(product.product_id, product);
                }
            });

            this.products = Array.from(productById.values());
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
                console.error(error);
            }
        },

        async getVendors(){
            try {
                this.vendors = await action.getVendors();
            } catch (error) {
                console.error(error);                
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
                console.error(error);
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
                this.filteredLocations = Array.isArray(this.locations) ? [...this.locations] : [];
            } catch (error) {
                console.error(error);
            }
        }, 

        searchLocations(event: any){
            const query = String(event?.query || '').toLowerCase().trim();
            const allLocations = Array.isArray(this.locations) ? this.locations : [];

            if (!query.length) {
                this.filteredLocations = [...allLocations];
                return;
            }

            this.filteredLocations = allLocations.filter((location: any) =>
                String(location?.name || '').toLowerCase().includes(query)
            );
        },

        getLocationAutoCompleteValue(locationId: any){
            const normalizedLocationId = Number(locationId || 0);
            if (!normalizedLocationId) return null;

            return (this.locations || []).find((location: any) =>
                Number(location?.location_id || 0) === normalizedLocationId
            ) || null;
        },

        onLocationAutoCompleteChange(targetRow: any, nextValue: any){
            if (!targetRow) return;

            if (nextValue && typeof nextValue === 'object' && 'location_id' in nextValue) {
                targetRow.location_id = Number(nextValue.location_id || 0) || null;
                return;
            }

            if (typeof nextValue === 'string') {
                const normalizedName = nextValue.toLowerCase().trim();
                const matchedLocation = (this.locations || []).find((location: any) =>
                    String(location?.name || '').toLowerCase() === normalizedName
                );
                targetRow.location_id = matchedLocation ? Number(matchedLocation.location_id || 0) : null;
                return;
            }

            targetRow.location_id = null;
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
                console.error(error);
            }
        },
        //Description: 
        //
        //Created by: Gabe de la Torre
        //Date Created: ???
        //Date Last Edited: 7-03-2024
        selectRecipeElements(recipe: any){
            
            // console.log("RECIPE  ", recipe);
            
            let inputProducts = this.recipeElements.filter(re => re.type === 'input' && re.recipe_id === recipe.recipe_id);
            // console.log("INPUT PRODUCTS: ", inputProducts);

            inputProducts.forEach(ir => {
                let inProd = this.unprocProducts.find(p => p.product_id === ir.product_id);
                ir.name = inProd.name;
            })

            //console.log("RECIPES USED ", usedRecipes);
            //console.log("PRODUCTS USED ", usedProducts);
            //this.poCases[counter].recInfo = usedProducts;
            return inputProducts;
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
            // console.log("Product Key for ID ", productId, ": ", prodKey);
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
            let rawBox = this.unprocProducts.find(p => p.product_id === rawRecEl.product_id);
            return rawBox.price_2023*this.getTotalUnitsOrdered(rawRecEl, poCase, recipeAmount); 
        },
        getCreatedUnitTotal(poID: number){
            let total = 0;
            const poLines = this.getPurchaseOrderLinesForDisplay(poID);
            let usedLines = (poLines || []).filter((line: any) => this.normalizeRawLineStatus(line?.status) !== 'Cancelled');
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID && b.status !== 'Cancelled');
            // console.log("Used Lines For Unit Total", usedLines);
            // console.log("Used Boxes For Unit Total", usedBoxes);
            // Prioritize the lines, but if only legacy count exist, use that
            if (usedLines.length !== 0)
                usedLines.forEach((line: any) => total += Number(line.total_units || 0));
            else if (usedBoxes.length !== 0)
                usedBoxes.forEach((b: any) => total+=b.units_per_case);

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
            const poLines = this.getPurchaseOrderLinesForDisplay(poID);
            let usedLines = (poLines || []).filter((line: any) => this.normalizeRawLineStatus(line?.status) !== 'Cancelled');
            let usedBoxes = this.uBoxes.filter(b => b.purchase_order_id === poID && b.status !== 'Cancelled');
            // console.log("Used Boxes For Cost Total", usedBoxes);
            // console.log("Products List", this.products);
            usedLines.forEach((line: any) => {
                const productPrice = Number(this.getProductInfo(line?.product_id, 'price_2023') || 0);
                const unitPrice = Number(line?.unit_price ?? productPrice);
                total += Number(line?.total_units || 0) * unitPrice;
                // console.log("Total in for each: ", total);
            });

            if(usedLines.length === 0){
                usedBoxes.forEach((b: any) => {
                    let prod = this.products.find(p => p.product_id === b.product_id);
                    if (!prod) return;
                    // console.log("Product key for box: ", prod);
                    total+=(b.units_per_case*prod.price_2023);
                    // console.log("Total in for each: ", total);
                });
            }
            

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
            // console.log("Calculating PO Cost Total for PO: ", this.purchaseOrder);
            let total = 0;
            // If editing an existing PO, sum from uBoxes
            if (this.purchaseOrder && this.purchaseOrder.purchase_order_id && this.purchaseOrder.po_raw_lines) {
                this.purchaseOrder.po_raw_lines.forEach((line: any) => {
                    const productKey = this.products.find((p: any) => p.product_id === line.product_id);
                    // console.log("Product key for line: ", productKey);
                    // console.log("Processing line for cost total: ", line);
                    if (this.normalizeRawLineStatus(line.status) !== 'Cancelled') {
                        total += Number(line.total_units || 0) * productKey.price_2023;
                        // console.log("Total in PO Cost, ", total);
                    }
                });
            } else {
                // If creating a new PO, sum from recipeArray and poBoxes
                (this.recipeArray || []).filter(poRec => poRec && poRec.recipe_id).forEach(poRec => {
                    const recipeKey = (this.recipes || []).find(r => poRec.recipe_id === r.recipe_id);
                    if (!recipeKey) return;
                    const recipeElements = (this.recipeElements || []).filter(recEl => recEl.recipe_id === recipeKey.recipe_id);
                    // const processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    const processedRecElKey = (this.products || []).find((p) => p.product_id === recipeKey.output_product_id);
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
            // console.log("Discount to apply: ", discount);
            if (discount) {
                const discountDecimal = 1 - (discount / 100);
                total = total * discountDecimal;
            }
            return total;
        },

        /**
         * Description: Validates that a vendor has been selected before allowing the user to create a new purchase order. 
         * If validation passes, a draft purchase order is created immediately and opened in the edit dialog.
         * 
         * @author Gabe de la Torre-Garcia
         * 
         * Date Created: 3-16-2026
         * 
         * Date Last Edited: 3-16-2026
         */
        async validateVendor(){
            if (!this.purchaseOrder.vendor_id && this.vendorSubmitted == true) {
                this.$toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Vendor is required.' });
            }
            else {
                await this.startNewPurchaseOrderDraftFlow();
            }
        },

        /** @TODO Split the recipes into two different arrays: one for when users are editing/creating po's and one for the recipes in pagination */
        getPoolNew(purchase_order_id: number){
            const linkedPoRecipes = (this.poRecipes || []).filter((rec: any) => rec.purchase_order_id === purchase_order_id);
            const linkedRawLines = (this.po_raw_products || []).filter((line: any) =>
                line.purchase_order_id === purchase_order_id && this.normalizeRawLineStatus(line.status) !== 'Cancelled'
            );

            // New source of truth: if raw lines exist for this PO, calculate "no plan" as
            // ordered units minus recipe-required units for each raw product.
            if (linkedRawLines.length > 0) {
                const neededUnitsByProduct = new Map<number, number>();

                linkedPoRecipes.forEach((poRec: any) => {
                    const recipeQty = Number(poRec?.qty || 0);
                    if (recipeQty <= 0) return;

                    const rawInputs = (this.displayRecipeElements || []).filter((r: any) =>
                        r.recipe_id === poRec.recipe_id && r.type === 'input'
                    );

                    rawInputs.forEach((input: any) => {
                        const productId = Number(input?.product_id || 0);
                        const inputQty = Number(input?.qty || 0);
                        if (!productId || inputQty <= 0) return;

                        const current = neededUnitsByProduct.get(productId) || 0;
                        neededUnitsByProduct.set(productId, current + (inputQty * recipeQty));
                    });
                });

                const lineTotalsByProduct = new Map<number, number>();
                linkedRawLines.forEach((line: any) => {
                    const productId = Number(line?.product_id || 0);
                    const totalUnits = Number(line?.total_units || 0);
                    if (!productId || totalUnits <= 0) return;

                    const current = lineTotalsByProduct.get(productId) || 0;
                    lineTotalsByProduct.set(productId, current + totalUnits);
                });

                const noPlanRows: any[] = [];
                lineTotalsByProduct.forEach((orderedUnits: number, productId: number) => {
                    const neededUnits = neededUnitsByProduct.get(productId) || 0;
                    const leftoverUnits = orderedUnits - neededUnits;
                    if (leftoverUnits <= 0) return;

                    const productKey = (this.products || []).find((p: any) => p.product_id === productId)
                        || (this.unprocProducts || []).find((p: any) => p.product_id === productId);
                    const unitsPerCase = Number(productKey?.default_units_per_case || 1);

                    noPlanRows.push({
                        product_id: productId,
                        purchase_order_id,
                        product_name: productKey?.name || this.getProductInfo(productId, 'name'),
                        item_num: productKey?.item_num || this.getProductInfo(productId, 'item_num'),
                        units_per_case: unitsPerCase,
                        amount: unitsPerCase > 0 ? Number((leftoverUnits / unitsPerCase).toFixed(2)) : leftoverUnits,
                        totalUnits: Number(leftoverUnits.toFixed(2)),
                    });
                });

                return noPlanRows;
            }

            // Legacy fallback: if raw lines do not exist yet, keep previous box-based behavior.
            let poolArray = [] as any[];
            let boxesBeingUsed = [] as any[];

            let boxArray = this.uBoxes.filter((box: any) => box.purchase_order_id === purchase_order_id && box.status !== 'Cancelled');
            // console.log("boxArray", boxArray);

            linkedPoRecipes.forEach((poRec: any) => {
                /* let recipeOutput = this.displayRecipeElements.find((r: any) => r.recipe_id === poRec.recipe_id && r.type === 'output');
                if (!recipeOutput) return; */

                // Why the heck am I grabbing the po recipe when I am looping inside of the po recipes lol
                /* let poRecipe = this.poRecipes.find((recipe: any) => recipe.purchase_order_id === purchase_order_id && recipe.recipe_id === recipeOutput.recipe_id);
                if (!poRecipe) return; */

                let rawRecInputs = this.displayRecipeElements.filter((r: any) => r.recipe_id === poRec.recipe_id && r.type === 'input');

                let totals = [] as any[];

                rawRecInputs.forEach((r: any) => {
                    let map = {} as any;
                    map.product_id = r.product_id;
                    r.totalUnits = poRec.qty;
                    map.currentUnits = 0;
                    totals.push(map);
                });
                // console.log("rawRecInputs", rawRecInputs);

                for(const b of boxArray) {
                    if(b.purchase_order_id !== purchase_order_id)
                    continue;

                    let inputEl = rawRecInputs.find((r: any) => r.product_id  === b.product_id);
                    if(inputEl){
                        let total = totals.find((t: any) => t.product_id === inputEl.product_id);
                        if (!total) continue;

                        let boxInArray = boxesBeingUsed.find((boxLine: any) => boxLine.case_id === b.case_id);
                        if(boxInArray)
                            continue;

                        if(inputEl.totalUnits > total.currentUnits && (inputEl.totalUnits - b.units_per_case) >= total.currentUnits){
                            b.taken = true;
                            boxesBeingUsed.push(b);
                            total.currentUnits += b.units_per_case;
                        } else if (inputEl.totalUnits === total.currentUnits){
                            continue;
                        }
                    }
                }
            })

            // console.log("Cases being used: ",boxesBeingUsed);

            for(const b of boxArray) {
                if(b.purchase_order_id !== purchase_order_id || b.taken === true)
                continue;

                poolArray.push(b);
            }
            // console.log("poolArray", poolArray);
            // console.log("Grouped pool array", helper.groupProductsById(poolArray));
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

        normalizeRawLineStatus(boxStatus: string) {
            if (boxStatus === 'Ready' || boxStatus === 'On RTP') {
                return 'Delivered';
            }
            if (boxStatus === 'Cancelled') {
                return 'Cancelled';
            }
            if (boxStatus === 'BO') {
                return 'BO';
            }
            return boxStatus || this.purchaseOrder.status || 'Draft';
        },

        normalizeRawLineForTotals(line: any){
            if (!line) return line;
            // console.log("Normalizing line for totals: ", line);

            const productId = Number(line.product_id || 0);
            const product = (this.products || []).find((p: any) => p.product_id === productId)
                || (this.unprocProducts || []).find((p: any) => p.product_id === productId);
            const totalUnits = Number(
                line.total_units ??
                line.total ??
                (Number(line.amount || 0) * Number(line.units_per_case || 0))
            );

            return {
                ...line,
                total_units: Number.isFinite(totalUnits) ? totalUnits : 0,
                unit_price: Number(line.unit_price ?? product?.price_2023 ?? 0),
                product_name: line.product_name || product?.name || null,
            };
        },

        getPurchaseOrderLinesForDisplay(poId: number, poRow: any = null){
            if (!poId) return [];

            const row = poRow || (this.purchaseOrders || []).find((po: any) => po.purchase_order_id === poId);
            const rowLines = Array.isArray(row?.po_raw_lines) ? row.po_raw_lines : [];
            const globalLines = (this.po_raw_products || []).filter((line: any) => line.purchase_order_id === poId);
            // Prefer page-level canonical raw lines so dialog/table refreshes reflect recent edits immediately.
            const sourceLines = rowLines.length > 0 ? globalLines : rowLines;

            /**@TODO Figure out why the system is not updating the po_raw_lines inside of the order. I want to grab the row data, not the global data */
            // const sourceLines = rowLines.length > 0 ? rowLines : globalLines;

            // console.log("Source lines for PO ID " + poId, sourceLines);

            return (sourceLines || []).map((line: any) => this.normalizeRawLineForTotals(line));
        },

        doesPOHaveFlaggedLine(poId: number){
            const lines = this.getPurchaseOrderLinesForDisplay(poId);
            return (lines || []).some((line: any) => this.normalizeRawLineStatus(line.status) === 'Flagged');
        },

        /**
         * Refreshes the purchase order data in the table and/or dialog.
         * @param poId - The ID of the purchase order to refresh.
         * @param options - Options to control the refresh behavior.
         * @param options.syncTable - Whether to refresh the table view. Defaults to true.
         * @param options.syncDialog - Whether to refresh the dialog view. Defaults to true.
         * @param options.patchRowData - Optional partial data to merge into the existing table row.
         * @param options.patchDialogData - Optional partial data to merge into the existing dialog data
         */
        purchaseOrderRefresh(
            poId: number,
            options: {
                syncTable?: boolean;
                syncDialog?: boolean;
                patchRowData?: Record<string, any>;
                patchDialogData?: Record<string, any>;
            } = {}
        ){
            if (!poId) return;

            // console.log(`Refreshing purchase order data for PO ID ${poId} with options:`, options);

            const { syncTable = true, syncDialog = true, patchRowData = {}, patchDialogData = {} } = options;
            const poRowIdx = (this.purchaseOrders || []).findIndex((po: any) => po.purchase_order_id === poId);
            const existingRow = poRowIdx > -1 ? this.purchaseOrders[poRowIdx] : null;
            const normalizedLines = this.getPurchaseOrderLinesForDisplay(poId, existingRow);
            let refreshedRow = existingRow;

            if (syncTable && poRowIdx > -1) {
                const nextPoRow = {
                    ...existingRow,
                    ...patchRowData,
                    po_raw_lines: [...normalizedLines],
                };
                this.purchaseOrders.splice(poRowIdx, 1, nextPoRow);
                refreshedRow = nextPoRow;
            }

            const dialogPoId = Number(this.purchaseOrder?.purchase_order_id || 0);
            const detailPoId = Number(this.selectedDetailPo?.purchase_order_id || 0);
            const dialogBase = refreshedRow || this.purchaseOrder || {};
            const detailBase = refreshedRow || this.selectedDetailPo || {};

            if (syncDialog && dialogPoId === poId) {
                this.isInitializingPurchaseOrder = true;
                this.purchaseOrder = {
                    ...dialogBase,
                    ...(this.purchaseOrder || {}),
                    ...patchDialogData,
                    po_raw_lines: [...normalizedLines],
                };
                this.$nextTick(() => { this.isInitializingPurchaseOrder = false; });
            }

            if (syncDialog && detailPoId === poId) {
                this.selectedDetailPo = {
                    ...detailBase,
                    ...(this.selectedDetailPo || {}),
                    ...patchDialogData,
                    po_raw_lines: [...normalizedLines],
                };
            }
            console.log(`Finished refreshing purchase order data for PO ID ${poId}. Updated row:`, this.purchaseOrders[poRowIdx], "Dialog data:", this.purchaseOrder);
            console.log(`Detail data:`, this.selectedDetailPo);
        },

        /**
         * Converts edited poBoxes to po_raw_lines format for database storage.
         * Each row becomes one line with aggregated total_units.
         * @returns Array of po_raw_line objects ready for bulk insert
         */
        convertPoBoxesToRawLines(): any[] {
            // Step 1: Normalize each editable UI row into a consistent intermediate row.
            // This does not aggregate anything yet; it only shapes data and computes per-row total_units.
            const normalizedBoxes = this.poBoxes
                .filter((b: any) => b.product_id)
                .map((rawProduct: any) => {
                    const rawKey = this.products.find((p: any) => p.product_id === rawProduct.product_id);
                    const units_per_case = rawKey?.default_units_per_case || rawProduct.units_per_case || 1;
                    const total_units = (rawProduct.amount || 1) * units_per_case;
                    return {
                        ...rawProduct,
                        product_id: rawProduct.product_id,
                        purchase_order_id: this.purchaseOrder.purchase_order_id,
                        total_units,
                        raw_line_status: this.normalizeRawLineStatus(rawProduct.status || this.purchaseOrder.status),
                        notes: rawProduct.notes ?? null,
                        invoice_id: rawProduct.invoice_id ?? null,
                    };
                });

            // Step 2: Aggregate rows by product + normalized status.
            // helper.groupItemsByKey sums each row's total_units into groupedRawLines[].total.
            const groupedRawLines = helper.groupItemsByKey(normalizedBoxes, ['product_id', 'raw_line_status']);

            // Step 3: Convert grouped rows into po_raw_lines payload shape for persistence.
            return groupedRawLines.map((rawLine: any) => ({
                product_id: rawLine.product_id,
                purchase_order_id: this.purchaseOrder.purchase_order_id,
                total_units: Number(rawLine.total || 0),
                status: rawLine.raw_line_status || this.purchaseOrder.status || 'Draft',
                notes: rawLine.notes ?? null,
                invoice_id: rawLine.invoice_id ?? null,
            }));
        },

        /**
         * Calculates raw lines needed from a selected recipe.
         * Used when user selects a recipe to determine what raw inputs are needed.
         * @param recipeId The recipe id to calculate inputs for
         * @param amount The number of times to make this recipe
         * @returns Object with po_raw_lines to add to the order
         */
        calculateRawLinesFromRecipe(recipeId: number, amount: number): any[] {
            const rawLines: any[] = [];
            
            // Find all input recipe elements for this recipe
            const rawRecElements = this.recipeElements.filter(re => 
                re.recipe_id === recipeId && re.type === 'input'
            );

            rawRecElements.forEach(rawRecEl => {
                const rawProduct = this.products.find(p => p.product_id === rawRecEl.product_id);
                if (!rawProduct) return;

                const units_per_case = rawProduct.default_units_per_case || 1;
                const totalUnitsNeeded = rawRecEl.qty * amount;
                
                rawLines.push({
                    product_id: rawProduct.product_id,
                    purchase_order_id: this.purchaseOrder.purchase_order_id,
                    total_units: totalUnitsNeeded,
                    status: this.purchaseOrder.status || 'Draft',
                    notes: null,
                    invoice_id: null,
                });
            });

            return rawLines;
        },

        /**
         * For legacy POs with raw boxes but no po_raw_lines, creates raw lines from grouped boxes.
         * Ensures backward compatibility when editing old purchase orders.
         * @returns Array of po_raw_lines created from existing raw boxes
         */
        async ensureRawLinesExist(): Promise<any[]> {
            if (!this.purchaseOrder.purchase_order_id) return [];
            // console.log("In ensureRawLinesExist for PO ID", this.purchaseOrder.purchase_order_id);

            // Check if po_raw_lines already exist for this PO
            const existingLines = await action.getCurrentPurchaseOrderRawLines(this.purchaseOrder.purchase_order_id);
            if (existingLines && existingLines.length > 0) {
                // console.log('PO already has raw lines:', existingLines);
                return existingLines;
            }

            // If no lines exist but boxes do, create lines from grouped boxes.
            // Include all statuses (including Cancelled) so old orders are fully represented.
            const boxes = this.purchaseOrder.individual_boxes || (this.uBoxes || []).filter((b: any) => b.purchase_order_id === this.purchaseOrder.purchase_order_id);
            // console.log("Boxes in order: ", boxes);
            if (boxes.length === 0) return [];

            // Normalize status on each source row first (row-level transform).
            const normalizedBoxes = boxes.map((box: any) => ({
                ...box,
                raw_line_status: this.normalizeRawLineStatus(box.status),
            }));

            // Then aggregate rows by product + status to produce one legacy line per grouping key.
            const groupedRawLines = helper.groupItemsByKey(normalizedBoxes, ['product_id', 'raw_line_status']);

            const rawLinesToCreate = groupedRawLines.map((box: any) => ({
                product_id: box.product_id,
                purchase_order_id: this.purchaseOrder.purchase_order_id,
                total_units: Number(box.total || 0),
                item_num: box.item_num,
                status: box.raw_line_status || this.purchaseOrder.status || 'Draft',
                notes: null,
                invoice_id: null,
            }));

            // Create the raw lines
            if (rawLinesToCreate.length > 0) {
                await action.bulkAddPurchaseOrderRawLines(rawLinesToCreate);
                // console.log('Created raw lines from legacy boxes:', rawLinesToCreate);
            }

            // Re-fetch so callers receive the persisted records with real po_raw_line_id values.
            const persistedLines = await action.getCurrentPurchaseOrderRawLines(this.purchaseOrder.purchase_order_id);
            return persistedLines || rawLinesToCreate;
        },

        formatCurrency(value: any) {
            // console.log("Currency value",value);
            // console.log("Locale string", value.toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
            if(value >= 0)
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

        async continueOpenNewWithNickname(nickname: string){
            const today = new Date();
            const year = today.getFullYear().toString();
            let maxSeqForYear = 0;

            const newestPos = await action.getNewestPurchaseOrdersByVendor(this.purchaseOrder.vendor_id);

            newestPos.forEach((po: any) => {
                const name = po.purchase_order_name || '';
                const match = name.match(/^([^_-]+)[-_](\d{4})(\d{2,3})([A-Za-z].*)?$/);

                if (!match) return;

                const poYear = match[2];
                const seq = Number(match[3]);
                if (poYear === year && !isNaN(seq)) {
                    maxSeqForYear = Math.max(maxSeqForYear, seq);
                }
            });

            const nextSeq = maxSeqForYear + 1;
            const seqStr = String(nextSeq).padStart(2, '0');

            this.purchaseOrder.purchase_order_name = `${nickname}-${year}${seqStr}`;
            this.purchaseOrder.status = 'Draft';
        },

        /**
         * @description Opens an existing purchase order in edit mode.
         * Initializes vendor-scoped data, acquires the edit lock, and opens the edit dialog.
         * @param purchaseOrder The purchase order object to edit.
         * @author Gabe de la Torre-Garcia
         * @dateCreated 3-25-2026
         * @dateLastEdited 5-20-2026
         */
        async onPurchaseOrderDialogOpen(purchaseOrder: any){
            let previousTableLoading = this.tableLoading;
            try {
                this.autoSaveState = 'idle';
                this.loading = true;
                this.tableLoading = true;
                this.isInitializingPurchaseOrder = true;

                if (this.detailDialogVisible === true)
                    this.detailDialogLoading = true;
                // console.log("Purchase Order Dialog opened from Edit PO flow");
                // console.log("Purchase Order to edit:", purchaseOrder);

                if (!purchaseOrder?.purchase_order_id) {
                    console.warn("Edit PO flow was called without a valid purchase order.");
                    return;
                }

                if (this.currentEditingPoId && this.currentEditingPoId !== purchaseOrder.purchase_order_id) {
                    await this.releaseActivePoLock();
                }

                // Set the active PO first so vendor-scoped initialization uses the correct vendor.
                this.purchaseOrder = { ...purchaseOrder };

                await this.acquirePoLock(this.purchaseOrder.purchase_order_id);

                /** @TODO Need to go through and change all uses of this.products to either this.procProducts or this.unprocProducts */
                await this.getAllProductsForVendor();

                await this.getRawProductsForVendor();
                await this.getProcProductsForVendor();
                await this.getRecipes();
                await this.editPurchaseOrder(purchaseOrder);
            } catch (error) {
                console.error("Error occurred during Purchase Order Dialog initialization:", error);
            } finally {
                this.isInitializingPurchaseOrder = false;
                this.loading = false;
                this.detailDialogLoading = false;
                this.tableLoading = previousTableLoading;
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
        async withTransientRowAddLoading(flagKey: 'editRawRowsLoading' | 'editRecipeRowsLoading', addRow: () => void){
            if (this[flagKey]) return;

            this[flagKey] = true;

            try {
                await new Promise(resolve => setTimeout(resolve, 120));
                addRow();
                await new Promise(resolve => setTimeout(resolve, 120));
            } finally {
                this[flagKey] = false;
            }
        },
        createNewEditRecipeRow(){
            return {
                line_key: `recipe-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                recipeObj: null,
                recipe_id: null,
                productObj: null,
                product_id: null,
                product_name: '',
                units_per_case: 0,
                amount: 1,
                qty: 0,
            };
        },
        createNewEditRawRow(){
            return {
                line_key: `raw-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                productObj: null,
                product_id: null,
                product_name: '',
                units_per_case: 0,
                amount: 1,
                total: 0,
                fbm: 0,
                store: 0,
                status: this.purchaseOrder?.status || 'Draft',
            };
        },

        onRawTotalsChange(event: any, line: any, field: any){
            console.log("Checking change on line: ", line, " for field: ", field, " with event value: ", event.value);
            if (field === 'total'){
                line.amount = event.value/line.units_per_case;
                if(line.fbm > event.value)
                    line.fbm = event.value;
            } else if (field === 'amount'){
                line.total = (event.value || line.amount || 0)*line.units_per_case;
            } else if (field === 'fbm'){
                if(event.value > line.total){
                    line.fbm = line.total;
                    line.store = 0;
                    this.$toast.add({severity:'warn', summary:'Warning', detail:'FBM cannot exceed total', life: 10000,});
                } else {
                    line.store = line.total - event.value - (line.fba_prep || 0);
                }
            }

        },

        openRecipeRowEditor(rowData: any){
            if (!rowData) return;
            rowData.d_editing = true;
            this.editingRows = [rowData];
        },
        openRawRowEditor(rowData: any){
            if (!rowData) return;
            rowData.d_editing = true;
            this.rawEditingRows = [rowData];
        },
        async addEditRawLine(){
            if (!this.ensurePoEditable('add raw products')) return;
            let newRow: any = null;
            await this.withTransientRowAddLoading('editRawRowsLoading', () => {
                newRow = this.createNewEditRawRow();
                this.poBoxes = [...(this.poBoxes || []), newRow];
            });

            if (newRow) {
                await this.$nextTick();
                this.openRawRowEditor(newRow);
            }
        },

        hasEmptyPORawLines(){
            return this.poBoxes.find((line: any) => line.product_id === null || line.product_id === '') ? true : false;
        },

        async addEditRecipeLine(){
            if (!this.ensurePoEditable('add processed products')) return;
            let newRow: any = null;
            await this.withTransientRowAddLoading('editRecipeRowsLoading', () => {
                newRow = this.createNewEditRecipeRow();
                this.singlePoRecipes = [...(this.singlePoRecipes || []), newRow];
            });

            if (newRow) {
                await this.$nextTick();
                this.openRecipeRowEditor(newRow);
            }
        },

        
        hasEmptyPORecipeLines(){
            return this.singlePoRecipes.find((line: any) => line.product_id === null || line.product_id === '') ? true : false;
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
            // console.log("TODAYS DATE ", date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
        },

        onVendorAutoCompleteSelect(vendorObj: any){
            // console.log("Vendor AutoComplete Selection:", vendorObj);
            if (vendorObj && vendorObj.vendor_id) {
                this.purchaseOrder.vendor = vendorObj;
                this.purchaseOrder.vendor_id = vendorObj.vendor_id;
            }
        },

        async saveMissingVendorNickname() {
            const nickname = this.pendingVendorNickname.trim();
            if (!nickname) return;
            const selectedVendor = this.purchaseOrder?.vendor;

            if (!selectedVendor?.vendor_id) {
                this.$toast.add({ severity: 'error', summary: 'Vendor Missing', detail: 'Please select a vendor first.' });
                return;
            }

            this.loading = true;
            const vendorToUpdate = {
                ...selectedVendor,
                vendor_nickname: nickname,
            };

            try {
                const updatedVendor: any = await action.editVendor(vendorToUpdate);

                this.purchaseOrder.vendor = {
                    ...selectedVendor,
                    ...(updatedVendor || {}),
                    vendor_nickname: nickname,
                };
                this.purchaseOrder.vendor_id = this.purchaseOrder.vendor.vendor_id || selectedVendor.vendor_id;

                const vendorIdx = this.vendors.findIndex((v: any) => v.vendor_id === this.purchaseOrder.vendor_id);
                if (vendorIdx !== -1) {
                    this.vendors[vendorIdx] = {
                        ...this.vendors[vendorIdx],
                        ...this.purchaseOrder.vendor,
                        vendor_nickname: nickname,
                    };
                }

                this.pendingVendorNickname = '';
                this.missingVendorNicknameDialog = false;
                await this.startNewPurchaseOrderDraftFlow();
            } catch (error: any) {
                console.error(error);
                this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to save company code.' });
            } finally {
                this.loading = false;
            }
        },

        onProductSelection(productId: any){
            // console.log("PRODUCT ID", productId);

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
            const productKey = this.getProductForImportantFieldCheck(productObj) || productObj;

            rowData.productObj     = productKey;
            rowData.product_id     = productKey.product_id;
            rowData.product_name   = productKey.name;
            rowData.units_per_case = productKey.default_units_per_case || 1;
            rowData.total          = (rowData.amount || 1) * rowData.units_per_case;
            this.promptForMissingImportantProductFields([productKey]);
            // console.log("applyRawProductToRow – row after assignment:", JSON.stringify(rowData));
        },

        /**
         * Description: When a user selects a product from the autocomplete, this function updates the current editing row with the product id, name, and default units per case.
         * @param productObj The product selected from the AutoComplete
         * @param rowData    The PrimeVue DataTable editing-row data object
         */
        onRawProductAutoCompleteSelectEdit(productObj: any, rowData: any){
            // console.log("Product AutoComplete Selection (edit):", productObj);
            this.applyRawProductToRow(productObj, rowData);
        },

        /**
         * 
         * @param productObj 
         */
        onProcessedProductAutoCompleteSelect(productObj: any){
            // console.log("Processed Product AutoComplete Selection:", productObj);
            
            if (productObj && productObj.product_id) {
                // Update the product_id in the current editing row
                const editingRow = this.editingRows[0]; // Assuming single row editing
                if (editingRow) {
                    editingRow.product_id = productObj.product_id;
                    editingRow.product_name = productObj.name;
                    editingRow.units_per_case = productObj.default_units_per_case || 0;
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
            const recipe = this.recipes.find(re => re.output_product_id === procProductId);
            const rawProductInfo: {rec: any, key: any}[] = [];
            const inputs = this.recipeElements.filter(re => re.recipe_id === recipe.recipe_id && re.type === 'input');
            for (const input of inputs) {
                const rawProduct = this.products.find(p => p.product_id === input.product_id);
                rawProductInfo.push({rec: input, key: rawProduct});
            }
            // console.log("Raw Products: ", rawProductInfo);
            return rawProductInfo;
        },

        /**
         * Opens a dialog for any product that is missing important fields used during ordering calculations.
         */
        getProductForImportantFieldCheck(product: any){
            const productId = Number(product?.product_id || 0);
            if (!productId) return null;

            const cachedProduct = (this.products || []).find((p: any) => p.product_id === productId)
                || (this.unprocProducts || []).find((p: any) => p.product_id === productId);

            return {
                ...(cachedProduct || {}),
                ...(product || {}),
                product_id: productId,
            };
        },

        getMissingImportantProductFields(products: any[], recipeId: number | null = null){
            type MissingImportantFieldItem = {
                product_id: number;
                recipe_id: number | null;
                name: string;
                item_num: string;
                default_units_per_case: number | null;
                price_2023: number | null;
                recipe_input_units: number | null;
                requires_default_units_per_case: boolean;
                requires_price_2023: boolean;
                requires_recipe_input_units: boolean;
            };

            const uniqueProductsById = new Map<number, any>();

            (products || []).forEach((product: any) => {
                if (!product?.product_id) return;
                const hydratedProduct = this.getProductForImportantFieldCheck(product);
                if (!hydratedProduct) return;
                uniqueProductsById.set(hydratedProduct.product_id, hydratedProduct);
            });

            const missingImportantFields: MissingImportantFieldItem[] = [];

            // console.log("Recipe ID for important field check: ", recipeId);

            Array.from(uniqueProductsById.values()).forEach((product: any) => {
                let recipeElement = null;
                let inputUnits = null;
                let requiresRecipeInputUnits = false;
                if(recipeId){
                    recipeElement = this.recipeElements.find((re: any) => re.product_id === product.product_id && re.recipe_id === recipeId);
                    // console.log("Checking recipe element for product ID " + product.product_id + " and recipe ID " + recipeId, recipeElement);
                    inputUnits = Number(recipeElement.qty); 
                    requiresRecipeInputUnits = !Number.isFinite(inputUnits) || inputUnits <= 0;
                }

                const defaultUnits = Number(product.default_units_per_case);
                const unitPrice = Number(product.price_2023);
                const requiresDefaultUnits = !Number.isFinite(defaultUnits) || defaultUnits <= 0;
                const requiresPrice = !Number.isFinite(unitPrice) || unitPrice <= 0;
                if (!requiresDefaultUnits && !requiresPrice && !requiresRecipeInputUnits) return;

                if(recipeId){
                    missingImportantFields.push({
                        product_id: product.product_id,
                        recipe_id: recipeId,
                        name: String(product.name || ''),
                        item_num: String(product.item_num || ''),
                        default_units_per_case: Number.isFinite(defaultUnits) && defaultUnits > 0 ? defaultUnits : null,
                        price_2023: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : null,
                        recipe_input_units: inputUnits,
                        requires_default_units_per_case: requiresDefaultUnits,
                        requires_price_2023: requiresPrice,
                        requires_recipe_input_units: requiresRecipeInputUnits,
                    });
                } else {
                    missingImportantFields.push({
                        product_id: product.product_id,
                        recipe_id: null,
                        name: String(product.name || ''),
                        item_num: String(product.item_num || ''),
                        default_units_per_case: Number.isFinite(defaultUnits) && defaultUnits > 0 ? defaultUnits : null,
                        price_2023: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : null,
                        recipe_input_units: null,
                        requires_default_units_per_case: requiresDefaultUnits,
                        requires_price_2023: requiresPrice,
                        requires_recipe_input_units: false,
                    });
                }

            });

            // console.log("Missing important fields for products: ", missingImportantFields);

            return missingImportantFields;
        },

        promptForMissingImportantProductFields(products: any[], recipeIndex: number | null = null, recipeId: number | null = null){
            const missingImportantFields = this.getMissingImportantProductFields(products, recipeId);

            if (!missingImportantFields.length && this.isProcMissingDefaultUnits === false) return;

            this.missingDefaults = missingImportantFields;
            this.missingDefaultsRecipeIndex = recipeIndex;
            this.missingDefaultUnitsDialog = true;
        },

        /**
         * If the selected processed recipe has raw ingredients missing important fields, open a dialog so the user can enter values.
         */
        checkMissingDefaultUnitsForRecipe(recipeObj: any, counter: number){
            if (!recipeObj) return;

            const recipeId = typeof recipeObj === 'object' && recipeObj.recipe_id ? recipeObj.recipe_id : recipeObj;
            if (!recipeId) return;

            const rawElements = this.recipeElements.filter(re => re.recipe_id === recipeId && re.type === 'input');
            const rawProducts = rawElements
                .map(re => this.products.find(p => p.product_id === re.product_id))
                .filter(p => !!p);

            this.promptForMissingImportantProductFields(rawProducts, counter, recipeId);
        },

        async saveMissingDefaultUnits(){
            const invalid = this.missingDefaults.some(d => {
                const defaultUnits = Number(d.default_units_per_case);
                const unitPrice = Number(d.price_2023);
                const recipeInputUnits = d.recipe_id ? Number(d.recipe_input_units) : null;
                const invalidDefaultUnits = d.requires_default_units_per_case && (!Number.isFinite(defaultUnits) || defaultUnits <= 0);
                const invalidPrice = d.requires_price_2023 && (!Number.isFinite(unitPrice) || unitPrice <= 0);
                const invalidRecipeInputUnits = d.recipe_id ? d.requires_recipe_input_units && (!Number.isFinite(recipeInputUnits) || (recipeInputUnits || 0) <= 0) : false;
                return invalidDefaultUnits || invalidPrice || invalidRecipeInputUnits;
            });
            if (invalid) {
                this.$toast.add({ severity: 'error', summary: 'Missing value', detail: 'Please enter valid values for all required product fields.' });
                return;
            }

            try {
                this.loading = true;
                if(this.isProcMissingDefaultUnits){
                    
                    this.procProdMissingDefaults.default_units_per_case = Number(this.missingProcDefaultUnits);
                    await action.editProduct(this.procProdMissingDefaults, []);
                    const productIdx = this.products.findIndex((p: any) => p.product_id === this.procProdMissingDefaults.product_id);
                    if(productIdx !== -1) {
                        this.products[productIdx] = {
                            ...this.products[productIdx],
                            ...this.procProdMissingDefaults,
                        };
                    } else {
                        console.warn("Processed product missing default units was not found in products list after update.");
                    }
                    const nextUnitsPerCase = Number(this.procProdMissingDefaults.default_units_per_case || 0);
                    const targetRecipeIndex = Number(this.missingDefaultsRecipeIndex);

                    if (this.activeRecipeEditRow) {
                        const draftAmount = Number(this.activeRecipeEditRow.amount || 0);
                        this.activeRecipeEditRow.units_per_case = nextUnitsPerCase;
                        this.activeRecipeEditRow.qty = Number((draftAmount * nextUnitsPerCase).toFixed(2));
                    }

                    if (
                        Number.isInteger(targetRecipeIndex)
                        && targetRecipeIndex >= 0
                        && targetRecipeIndex < (this.singlePoRecipes || []).length
                    ) {
                        const targetRow = this.singlePoRecipes[targetRecipeIndex] || {};
                        const targetAmount = Number(targetRow.amount || 0);

                        this.singlePoRecipes.splice(targetRecipeIndex, 1, {
                            ...targetRow,
                            units_per_case: nextUnitsPerCase,
                            qty: Number((targetAmount * nextUnitsPerCase).toFixed(2)),
                        });
                    } else {
                        // Fallback for edge cases where row index could not be resolved.
                        this.singlePoRecipes = this.singlePoRecipes.map((row: any) => {
                            if (row.product_id !== this.procProdMissingDefaults.product_id) return row;
                            const amount = Number(row.amount || 0);
                            return {
                                ...row,
                                units_per_case: nextUnitsPerCase,
                                qty: Number((amount * nextUnitsPerCase).toFixed(2)),
                            };
                        });
                    }

                    this.editingRows = this.editingRows.map((row: any) => {
                        if (row.product_id !== this.procProdMissingDefaults.product_id) return row;
                        return {
                            ...row,
                            units_per_case: nextUnitsPerCase,
                            qty: Number(row.amount || 0) * nextUnitsPerCase,
                        };
                    });

                    // console.log("Updated singlePoRecipes after saving missing defaults: ", JSON.stringify(this.singlePoRecipes));
                    // console.log("Updated editingRows after saving missing defaults: ", JSON.stringify(this.editingRows));
                    this.isProcMissingDefaultUnits = false;
                    this.procProdMissingDefaults = null;
                    this.missingProcDefaultUnits = 0;
                    this.$toast.add({ severity: 'success', summary: 'Saved', detail: 'Default units per case updated for processed product.' });
                }

                const updatedByProductId = new Map<number, { default_units_per_case: number | null; price_2023: number | null; requires_default_units_per_case: boolean; requires_price_2023: boolean }>();

                for (const item of this.missingDefaults) {
                    const product = this.products.find(p => p.product_id === item.product_id);
                    if (!product) continue;

                    if(item.recipe_id){
                        const recipeElement = this.recipeElements.find((re: any) => re.product_id === item.product_id && re.recipe_id === item.recipe_id);
                        if (recipeElement) {
                            if (item.requires_recipe_input_units) {
                                recipeElement.qty = Number(item.recipe_input_units);
                                await action.editRecipeElement(recipeElement);
                                const recipeElementIdx = this.recipeElements.findIndex((re: any) => re.recipe_element_id === recipeElement.recipe_element_id);
                                if (recipeElementIdx !== -1) {
                                    this.recipeElements[recipeElementIdx] = {
                                        ...this.recipeElements[recipeElementIdx],
                                        ...recipeElement,
                                    };
                                } else {
                                    console.warn(`Edited recipe element not found in local state for recipe_element_id ${recipeElement.recipe_element_id}`);
                                }
                            }
                        } else {
                            console.warn(`Recipe element not found for product_id ${item.product_id} and recipe_id ${item.recipe_id}`);
                        }
                    }

                    if (item.requires_default_units_per_case) {
                        product.default_units_per_case = Number(item.default_units_per_case);
                    }
                    if (item.requires_price_2023) {
                        product.price_2023 = Number(item.price_2023);
                    }
                    // Update the product record on the server
                    await action.editProduct(product, []);

                    updatedByProductId.set(item.product_id, {
                        default_units_per_case: Number.isFinite(Number(product.default_units_per_case)) ? Number(product.default_units_per_case) : null,
                        price_2023: Number.isFinite(Number(product.price_2023)) ? Number(product.price_2023) : null,
                        requires_default_units_per_case: !!item.requires_default_units_per_case,
                        requires_price_2023: !!item.requires_price_2023,
                    });
                }

                // Refresh derived tables that use product defaults/pricing.
                this.products = [...this.products];
                this.unprocProducts = this.unprocProducts.map((raw: any) => this.products.find((p: any) => p.product_id === raw.product_id) || raw);

                // Reflect updated defaults/pricing immediately on any open row the user was editing.
                this.poBoxes = (this.poBoxes || []).map((row: any) => {
                    const updated = updatedByProductId.get(row.product_id);
                    if (!updated) return row;

                    /**@TODO Figure out why units per case is not being updated in the edit po dialog */
                    const nextRow = { ...row };
                    if (updated.requires_default_units_per_case && updated.default_units_per_case && updated.default_units_per_case > 0) {
                        nextRow.units_per_case = updated.default_units_per_case;

                        const amount = Number(nextRow.amount || 0);
                        const total = Number(nextRow.total || 0);
                        if (amount > 0) {
                            nextRow.total = Number((amount * nextRow.units_per_case).toFixed(2));
                        } else if (total > 0) {
                            nextRow.amount = Number((total / nextRow.units_per_case).toFixed(2));
                        }
                    }

                    if (updated.requires_price_2023 && updated.price_2023 && updated.price_2023 > 0) {
                        nextRow.price_2023 = updated.price_2023;
                        nextRow.unit_price = updated.price_2023;
                    }

                    const refreshedProduct = this.products.find((p: any) => p.product_id === nextRow.product_id);
                    if (refreshedProduct) {
                        nextRow.productObj = refreshedProduct;
                    }

                    // console.log("Updated row after saving missing defaults: ", JSON.stringify(nextRow));

                    return nextRow;
                });

                this.missingDefaultUnitsDialog = false;
                this.activeRecipeEditRow = null;
                this.$toast.add({ severity: 'success', summary: 'Saved', detail: 'Important product fields were updated.', life: 3000 });

                // If we were highlighting a recipe row for missing defaults, clear it now
                this.missingDefaultsRecipeIndex = null;

            } catch (error) {
                console.error(error);
                this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to save product field updates.' });
            } finally {
                this.loading = false;
            }
        },

        onRecipeSelectionEdit(recipeId: any){
            // console.log("RECIPE ID BEGIN: ", recipeId);
            let id = recipeId;
            if (typeof recipeId === 'object' && recipeId !== null && 'recipe_id' in recipeId) {
                id = recipeId.recipe_id;
            }
            this.recipeArrayEdit.recipe_id = id;
            this.recipeArrayEdit.default_units_per_case = recipeId.default_units_per_case;
            // console.log("RECIPE ID: ", id);
            let recipe = this.recipes.find(r => r.recipe_id === id);
            // console.log("RECIPE: ", recipe);
            this.poCasesEdit = this.procProducts.find(p => p.product_id === recipe.product_id);
            // console.log("PO CASE", this.poCasesEdit);
        },

        onRecipeSelectionEditRow(recipeObj: any, rowData: any){
            this.activeRecipeEditRow = rowData;
            const rowIndex = (this.singlePoRecipes || []).findIndex((row: any) => row === rowData);
            this.applyRecipeToPoRecipeRow(recipeObj, rowData, rowIndex);
        },

        applyRecipeToPoRecipeRow(recipeObj: any, rowData: any, rowIndex: number = -1){
            if (!recipeObj?.recipe_id || !rowData) return;

            const recipeId = recipeObj.recipe_id;
            // const recipeOutput = (this.recipeElements || []).find((re: any) => re.recipe_id === recipeId && re.type === 'output');
            // if (!recipeOutput) return;

            const processedProduct = (this.products || []).find((p: any) => p.product_id === recipeObj.output_product_id)
                || (this.procProducts || []).find((p: any) => p.product_id === recipeObj.output_product_id);
            if (!processedProduct) {
                this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Processed product not found. Please contact the System Admin.' });
                return;
            }

            if(processedProduct.default_units_per_case == null || processedProduct.default_units_per_case <= 0){
                this.isProcMissingDefaultUnits = true;
                this.missingProcDefaultUnits = 0;
                this.procProdMissingDefaults = processedProduct;
            }

            rowData.recipeObj = recipeObj;
            rowData.recipe_id = recipeId;
            rowData.productObj = processedProduct;
            rowData.product_id = processedProduct.product_id;
            rowData.product_name = processedProduct.name;
            const nextUnitsPerCase = Number(processedProduct.default_units_per_case || rowData.units_per_case || 0);
            rowData.units_per_case = nextUnitsPerCase;
            rowData.amount = Number(rowData.amount || 1);
            rowData.qty = Number((rowData.amount * rowData.units_per_case).toFixed(2));

            // Force table-level reactivity so non-editor cells reflect the newly selected recipe output immediately.
            this.singlePoRecipes = [...(this.singlePoRecipes || [])];

            this.checkMissingDefaultUnitsForRecipe(recipeObj, rowIndex);
        },

        getRecipeInputsForEditRow(rowData: any){
            const recipeId = Number(rowData?.recipeObj?.recipe_id || rowData?.recipe_id || 0);
            if (!recipeId) return [];

            const desiredUnits = Number(rowData?.qty || (Number(rowData?.amount || 0) * Number(rowData?.units_per_case || 0)) || 0);
            const rawInputs = (this.recipeElements || []).filter((re: any) => re.recipe_id === recipeId && re.type === 'input');

            return rawInputs.map((rawInput: any) => {
                const productKey = (this.products || []).find((p: any) => p.product_id === rawInput.product_id)
                    || (this.unprocProducts || []).find((p: any) => p.product_id === rawInput.product_id);
                const requiredUnits = Number((Number(rawInput.qty || 0) * desiredUnits).toFixed(2));

                return {
                    rec: rawInput,
                    key: productKey,
                    required_units: requiredUnits,
                };
            });
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
            if (this.saving) return;
            if (this.editPurchaseOrderDialog && !this.ensurePoEditable('save changes')) return;
            this.saving = true;
            try {
                //this.submitted = true;
                if (this.purchaseOrder.purchase_order_name.trim()) {
                    this.loading = true;
                    await this.confirmEdit();

                    if(this.purchaseOrder.status !== 'Draft' && this.purchaseOrder.status !== 'Submitted'){
                        await this.checkForRequests();
                    }

                    this.loading = false;
                    this.purchaseOrderDialog = false;
                    this.editPurchaseOrderDialog = false;
                    //this.selectedProducts = null;
                    this.purchaseOrder = {};
                }
            } catch (error) {
                console.error(error);
            } finally {
                this.saving = false;
            }
        },


        async confirmEdit(){
            try {
                if (!this.ensurePoEditable('save changes')) return;
                //this.purchaseOrder = this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id);
                // console.log(this.purchaseOrders.find(po => po.purchase_order_id === this.purchaseOrder.purchase_order_id));

                // console.log("PURCHASE ORDER BEFORE AWAIT ",this.purchaseOrder);

                // if (this.purchaseOrder.status != 'Delivered')
                if(this.reqPoBoxes.length > 0){
                    // console.log("IN ALOCATE");
                    await this.alocateBoxes();
                } else {
                    // console.log('Editing PO');
                    // console.log('Boxes to edit: ', this.poBoxes);
                    // console.log('Cases to edit: ', this.poCases);
                }

                this.uBoxes.forEach(box =>{
                    if(box.status !== 'On RTP' && box.status !== 'Ready' && box.purchase_order_id === this.purchaseOrder.purchase_order_id){
                        this.purchaseOrder.status = 'Partially Delivered';
                        // console.log("Box not ready: ",box)
                    }
                })

                // Convert edited poBoxes to po_raw_lines and save
                const rawLinesToCreate = this.convertPoBoxesToRawLines();
                console.log("Raw lines to create/update: ", rawLinesToCreate);
                if (rawLinesToCreate.length > 0) {
                    // TODO: Depending on backend capability, this may need to be upsert or separate logic
                    // For now, creating new lines (existing raw lines remain from ensureRawLinesExist)
                    await action.bulkAddPurchaseOrderRawLines(rawLinesToCreate);
                }

                const editedPurchaseOrder = await action.editPurchaseOrder(this.purchaseOrder);
                
                // console.log("PURCHASE ORDER AFTER AWAIT ",this.purchaseOrder);
                //alert("Testing");
                this.$toast.add({severity:'success', summary: 'Successful', detail: 'Purchase Order Updated', life: 3000});
                await this.loadPage(this.currentPage);
                // await this.getBoxes();

                return editedPurchaseOrder;
            } catch (error) {
                console.error(error);
                this.$toast.add({severity:'error', summary: 'Error', detail: error});
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
                // console.log("REQUESTED BOXES ", this.reqPoBoxes);

                if (!this.purchaseOrder.date_received)
                    this.purchaseOrder.date_received = this.today;

                this.purchaseOrder.status = 'Delivered';
                let boxesToInsert = [] as any[];

                // Grab the boxes already received and the newly inputted boxes
                let receivedBoxArray = this.checkBoxes("Received");
                let newlyArrivedBoxArray = this.checkBoxes("Newly Arrived");

                // console.log("receivedBoxArray", receivedBoxArray);
                // console.log("newlyArrivedBoxArray",newlyArrivedBoxArray);
                
                // Loop through all of the requested boxes
                this.reqPoBoxes.forEach(reqBox => {
                    let receivedBox = receivedBoxArray.find(rb => rb.product_id === reqBox.product_id);
                    let newlyArrivedBoxes = newlyArrivedBoxArray.filter(ab => ab.product_id === reqBox.product_id);
                    let newArrive = {} as any;

                    // console.log("NEW ARRIVAL ARRAY", newlyArrivedBoxes);

                    if (newlyArrivedBoxes.length === 1) {
                        newArrive = newlyArrivedBoxes[0];
                        boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, newArrive, true));
                    } else if (newlyArrivedBoxes.length > 1) {
                        let lineIdx = 0;
                        let lastLine = false;
                        newlyArrivedBoxes.forEach(newRow => {
                            newArrive = newRow;
                            if(lineIdx > newlyArrivedBoxes.length)
                                lastLine = true;

                            boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, newArrive, lastLine));
                            lineIdx++;
                        });
                    } else {
                        let noArrivales = {} as any;
                        noArrivales.total = 0;
                        noArrivales.amount = 0;
                        noArrivales.units_per_case = reqBox.units_per_case;
                        noArrivales.purchase_order_id = reqBox.purchase_order_id;
                        noArrivales.product_id = reqBox.product_id;
                        boxesToInsert.push(this.alocateBoxCalculation(reqBox, receivedBox, noArrivales, true));
                    }
                });

                let insertArray = [] as any[];

                boxesToInsert.flat().forEach(async box => {
                    if (box.case_id){
                        let tempArray = [box.units_per_case, box.date_received, box.notes, box.product_id, box.location_id, box.status, box.purchase_order_id, box.request_id, box.case_id];
                        insertArray.push(tempArray);
                    } else {
                        await action.addCase(box);
                    }
                });

                await action.bulkEditCases(insertArray);
            } catch (error) {
                console.error(error);
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
            // console.log("IN ALOCATE BOX CALCULATION__________________________________________________________");
            // console.log("REQUESTED BOXES ", requested, " RECEIVED BOXES ", received, "AND NEWLY ARRIVED BOXES ", newlyArrived);
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

            // console.log("PRODUCT ", requested.product_name);
            // console.log("REQUESTED UNIT AMOUNT - (RECEIVED + NEWLY ARRIVED UNIT AMOUNT) = BACKORDER UNIT AMOUNT");
            // console.log("REQ", requested.total, " - (REC + NEW)", "(", received.total, "+", newlyArrived.total, ")", " = LEFT", backorderUnits);

            //Get the specific decimal number for partial box purposes. 12 Received boxes might actually be 11.5
            let actualReceivedBoxes = newlyArrived.total/poBoxUnitsPerCase;
            let wholeReceivedBoxAmount = Math.floor(actualReceivedBoxes);

            // console.log("REQUESTED BOX AMOUNT - (RECEIVED + NEWLY ARRIVED UNIT AMOUNT) = BACKORDER BOX AMOUNT");
            // console.log("WHOLE BOX VIEW");
            // console.log("REQ", requested.amount, " - (REC + NEW)", "(", received.amount, "+", newlyArrived.amount, ")", " = BO", wholeBackorderBoxAmount);

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

            // console.log("PARTIAL BACK ORDER BOX AMOUNT", partialBackOrderBoxAmount);

            // Grab all the boxes for this PO of this product type that are not cancelled or arrived. 
            let boxes = this.uBoxes.filter(box => box.purchase_order_id === newlyArrived.purchase_order_id && box.product_id === newlyArrived.product_id && box.status !== 'On RTP' && box.status !== 'Ready' && box.status !== 'Cancelled');

            let backorderCompare = 0;

            boxes.forEach(box => {
                if(wholeReceivedBoxAmount > 0){
                    // console.log(newlyArrived);
                    // console.log("FULL BOX");
                    box.status = 'On RTP';
                    box.date_received = this.today;

                    if(!box.location_id)
                        box.location_id = newlyArrived.location_id;
                    
                    // console.log(box);
                    boxesToInsert.push(box);
                    wholeReceivedBoxAmount--;
                } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount > 0 && partialBackOrderBoxAmount > 0){
                    // console.log("PARTIAL FULL AND BACKORDER BOXES");

                    //If a partial box arrives, update the last box amount to partial amount a create 
                    // an additional box whose status is back ordered
                    box.units_per_case = partialBoxAmount;
                    box.status = 'On RTP';
                    box.date_received = this.today;

                    if(!box.location_id)
                        box.location_id = newlyArrived.location_id;

                    // console.log(box);
                    boxesToInsert.push(box);

                    const boBox: any = {
                        name: box.name,
                        product_id: box.product_id,
                        purchase_order_id: box.purchase_order_id,
                        units_per_case: partialBackOrderBoxAmount,
                        status: 'BO',
                    };

                    // console.log(boBox);
                    //EVENTUALLY, JUST ADD THE BO BOX DIRECTLY HERE
                    boxesToInsert.push(boBox);

                    partialBoxAmount = 0;
                    this.purchaseOrder.status = 'Partially Delivered'
                } else if (wholeReceivedBoxAmount == 0 && partialBoxAmount == 0 && backorderCompare < wholeBackorderBoxAmount && lastLocation === true) {
                    // console.log("BACKORDER BOX");
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

            // console.log("Boxes ",boxes);
            // console.log("Cases ",cases);
            this.reqPoBoxes = this.groupReqProducts(boxes);
            this.poBoxes = this.groupProducts(boxes);
            this.poCases = this.groupProducts(cases);

            // console.log("reqPoBoxes ", this.reqPoBoxes);
            // console.log("delivered ", this.delivered);

            this.purchaseOrderDialog = true;
        },

        /**
         * Description: Opens a dialog that allows the user to edit the chosen PO.
         * @param purchaseOrder {any} 
         * 
         * Created by: Gabe de la Torre
         * Date Created: 2-17-2025
         * Date Last Edited: 6-17-2026
         */
        async editPurchaseOrder(purchaseOrder: any) {
            try {
                // console.log("Purchase order to edit, ", purchaseOrder);
                // this.purchaseOrder = {...purchaseOrder};
                this.poCases = [];
                this.poBoxes = [];
                this.reqPoBoxes = [];
                this.editedLine = {};
                this.boxesToDelete = [];
                this.delivered = [];
                this.singlePoRecipes = [];
                // await this.getRecipes();

                // console.log("Recipes when opening po edit, ", this.recipes);

                // let boxes = this.uBoxes.filter(b => b.purchase_order_id === this.purchaseOrder.purchase_order_id && b.status !== 'Cancelled');
                let boxes = purchaseOrder.individual_boxes || [];
                let poRecs = purchaseOrder.po_recipes || this.poRecipes.filter(r => r.purchase_order_id === this.purchaseOrder.purchase_order_id);

                // console.log("PO Recs when opening edit, ", poRecs);

                poRecs.forEach((recLine: any) => {
                    const recipe = this.recipes.find(r => r.recipe_id === recLine.recipe_id);
                    if (!recipe) return;

                    // console.log("Recipe, ", recipe);

                    let elementKey = this.products.find(p => p.product_id === recipe.output_product_id);
                    if (!elementKey) return;

                    const recipeKey = this.recipes.find(r => r.recipe_id === recLine.recipe_id);

                    recLine.product_name = elementKey.name;
                    recLine.product_id = elementKey.product_id;
                    recLine.productObj = elementKey;
                    recLine.units_per_case = elementKey.default_units_per_case;
                    recLine.amount = recLine.qty/recLine.units_per_case;

                    if (recipeKey) {
                        recLine.recipeObj = recipeKey;
                    } else {
                        recLine.recipeObj = {
                            recipe_id: recLine.recipe_id,
                            label: recLine.product_name,
                        };
                    }
                })
                

                // console.log("PO Recs: ",poRecs);

                // Ensure legacy orders have po_raw_lines created (migration support).
                // Returns persisted records with IDs (re-fetched after insert for legacy orders).
                /* if(purchaseOrder.po_raw_lines.length <= 0){
                    const ensuredRawLines = await this.ensureRawLinesExist();
                } */

                // Raw lines are preloaded by the page RPC; keep a current-PO slice for edit operations.
                // Fall back to the freshly-ensured lines if the page cache doesn't contain them yet.
                const cachedLines = (purchaseOrder.po_raw_lines && purchaseOrder.po_raw_lines.length > 0) 
                ? purchaseOrder.po_raw_lines 
                : (this.po_raw_products || []).filter((line: any) =>
                    line.purchase_order_id === this.purchaseOrder.purchase_order_id
                );
                this.singlePoRawProducts = cachedLines.length > 0 ? cachedLines : (await this.ensureRawLinesExist() || []);

                // Keep the page cache consistent so subsequent saves/checks have the right data.
                if (cachedLines.length === 0 && this.singlePoRawProducts.length > 0) {
                    const otherLines = (this.po_raw_products || []).filter((line: any) =>
                        line.purchase_order_id !== this.purchaseOrder.purchase_order_id
                    );
                    this.po_raw_products = [...otherLines, ...this.singlePoRawProducts];
                }

                this.delivered = this.getDeliveredDataTable(boxes);

                // Prefer po_raw_lines for edit display; fallback to legacy grouped boxes for older orders.
                if (this.singlePoRawProducts.length > 0) {
                    this.poBoxes = this.singlePoRawProducts.map((line: any) => {
                        const rawProduct = this.unprocProducts.find((p: any) => p.product_id === line.product_id)
                            || this.products.find((p: any) => p.product_id === line.product_id);
                        const unitsPerCase = rawProduct?.default_units_per_case || line.units_per_case || 1;
                        const totalUnits = Number(line.total_units || 0);
                        return {
                            ...line,
                            line_key: line.po_raw_line_id ? `raw-${line.po_raw_line_id}` : `raw-${line.product_id}-${line.status}`,
                            productObj: rawProduct,
                            product_name: rawProduct?.name || this.getProductInfo(line.product_id, 'name'),
                            units_per_case: unitsPerCase,
                            total: totalUnits,
                            amount: unitsPerCase > 0 ? Number((totalUnits / unitsPerCase).toFixed(2)) : 0,
                            status: this.normalizeRawLineStatus(line.status),
                        };
                    });
                } else {
                    this.poBoxes = helper.groupItemsByKey(boxes, ['product_id', 'units_per_case', 'status']);
                    this.poBoxes.forEach((box: any) => {
                        const rawProduct = this.unprocProducts.find((p: any) => p.product_id === box.product_id)
                            || this.products.find((p: any) => p.product_id === box.product_id);

                        if (!rawProduct) return;

                        box.line_key = `legacy-${box.product_id}-${box.status}-${box.units_per_case}`;
                        box.productObj = rawProduct;
                        box.product_name = rawProduct.name;
                        if (!box.units_per_case) {
                            box.units_per_case = rawProduct.default_units_per_case;
                        }
                    });
                }
                // this.poBoxes.forEach(box => box.total = box.amount*box.units_per_case);
                this.singlePoRecipes = poRecs;

                // console.log("PO Boxes: ", this.poBoxes);
                // console.log("PO Recipes: ", this.singlePoRecipes);

                // console.log("reqPoBoxes ", this.reqPoBoxes);
                // console.log("delivered ", this.delivered);

                this.checkPoTotals();
                this.editPurchaseOrderDialog = true;
            } catch (error) {
                console.error("Error in editPurchaseOrder: ", error);
            }
            
        },

        onRowExpand(event: any) {
            this.$toast.add({ severity: 'info', summary: 'Purchase Order Expanded', detail: event.data.purchase_order_name, life: 3000 });
            
            // console.log("EVENT DATA ",event.data);

            if (event?.data && event.data.showCancelledProducts === undefined) {
                event.data.showCancelledProducts = false;
            }

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
            // console.log("LOOP CHECK_____________________________________________________________");
            // console.log("Purchase Order to display: ",po);
            //console.log(this.cases);
            let displayArray = [] as any[];
            // let linkedCases = [] as any[]; 
            let linkedBoxes = [] as any[];
            let linkedRawLines = [] as any[];
            let poRecipes = this.poRecipes.filter(rec => po.purchase_order_id === rec.purchase_order_id);
            let poRecElements = [] as any[];

            // console.log("displayRecipeElements: ", this.displayRecipeElements);
            poRecipes.forEach(poRec => {
                // let recElArray = this.displayRecipeElements.filter(recEl => recEl.recipe_id === poRec.recipe_id && recEl.type === 'output');
                // recElArray.flatMap(recEl => recEl.amount = poRec.qty * recEl.qty);
                let output = {amount: poRec.qty};
                poRecElements.push(output);
            });
            poRecElements = poRecElements.flat();
            let total = 0;

            // linkedCases = this.pCases.filter(c => c.purchase_order_id === po.purchase_order_id);
            const includeCancelled = !!po.showCancelledProducts;
            linkedBoxes = this.uBoxes.filter((b: any) =>
                b.purchase_order_id === po.purchase_order_id &&
                (includeCancelled || b.status !== 'Cancelled')
            );
            linkedRawLines = (this.po_raw_products || []).filter((line: any) =>
                line.purchase_order_id === po.purchase_order_id &&
                (includeCancelled || this.normalizeRawLineStatus(line.status) !== 'Cancelled')
            );

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
                if (linkedRawLines.length > 0) {
                    // Group by product type for clean totals; keep cancelled lines in their own bucket.
                    displayArray = this.aggregateUnprocessedByProduct(linkedRawLines);
                } else if (linkedBoxes.length > 0) {
                    // Fallback for legacy POs that still only have individual box records.
                    const legacyLines = linkedBoxes.map((box: any) => ({
                        purchase_order_id: box.purchase_order_id,
                        product_id: box.product_id,
                        total_units: Number(box.amount || 0) * Number(box.units_per_case || 0),
                        status: box.status,
                        notes: box.notes,
                    }));
                    displayArray = this.aggregateUnprocessedByProduct(legacyLines);
                }
            } else if (po.displayStatus === 'Invoices') {
                displayArray = (this.invoices || [])
                    .filter((invoice: any) => invoice.purchase_order_id === po.purchase_order_id)
                    .map((invoice: any) => ({
                        ...invoice,
                        date_shipped: invoice.date_shipped ? String(invoice.date_shipped).split('T')[0] : null,
                        date_due: invoice.date_due ? String(invoice.date_due).split('T')[0] : null,
                        date_paid: invoice.date_paid ? String(invoice.date_paid).split('T')[0] : null,
                    }));
            }

            // console.log("DISPLAY ARRAY", displayArray);
            return displayArray;
        },

        aggregateUnprocessedByProduct(lines: any[]){
            const grouped = new Map<string, any>();

            (lines || []).forEach((line: any) => {
                if (!line || line.product_id == null) return;

                const normalizedStatus = this.normalizeRawLineStatus(line.status);
                const isCancelled = normalizedStatus === 'Cancelled';
                const key = `${line.product_id}-${isCancelled ? 'cancelled' : 'active'}`;
                const totalUnits = Number(line.total_units || 0);

                const existing = grouped.get(key);
                if (!existing) {
                    grouped.set(key, {
                        purchase_order_id: line.purchase_order_id,
                        product_id: line.product_id,
                        total_units: totalUnits,
                        notes: isCancelled ? (line.notes ?? null) : null,
                    });
                    return;
                }

                existing.total_units += totalUnits;
            });

            return Array.from(grouped.values()).map((entry: any) => {
                const rawProduct = (this.unprocProducts || []).find((p: any) => p.product_id === entry.product_id)
                    || (this.products || []).find((p: any) => p.product_id === entry.product_id);
                const unitsPerCase = Number(rawProduct?.default_units_per_case || 1);
                const totalUnits = Number(entry.total_units || 0);

                return {
                    ...entry,
                    product_name: rawProduct?.name || this.getProductInfo(entry.product_id, 'name'),
                    units_per_case: unitsPerCase,
                    amount: unitsPerCase > 0 ? Number((totalUnits / unitsPerCase).toFixed(2)) : 0,
                };
            });
        },

        getInvoiceExpandedRows(poId: number){
            if (!poId) return [];
            return this.invoiceExpandedRowsByPo[poId] || [];
        },

        setInvoiceExpandedRows(poId: number, expandedRows: any){
            if (!poId) return;
            this.invoiceExpandedRowsByPo = {
                ...(this.invoiceExpandedRowsByPo || {}),
                [poId]: expandedRows || [],
            };
        },

        getInvoiceLinkedLines(invoice: any){
            const poId = Number(invoice?.purchase_order_id || this.purchaseOrder?.purchase_order_id || this.detailSelectedPoId || 0);
            const invoiceId = Number(invoice?.invoice_id || 0);
            const rawLines = Array.isArray(invoice?.po_raw_lines) && invoice.po_raw_lines.length > 0
                ? invoice.po_raw_lines
                : (this.po_raw_products || []).filter((line: any) =>
                    Number(line?.purchase_order_id || 0) === poId && Number(line?.invoice_id || 0) === invoiceId,
                );

            return (rawLines || [])
                .filter((line: any) => line && line.product_id != null)
                .sort((a: any, b: any) => Number(a?.po_raw_line_id || 0) - Number(b?.po_raw_line_id || 0));
        },

        getInvoiceLinkedLineLabel(line: any){
            const fallbackName = line?.product_id ? `Product #${line.product_id}` : 'Unknown product';
            const productName = line?.product_name || this.getProductInfo(line?.product_id, 'name') || fallbackName;
            const units = Number(line?.total_units || 0);

            return `${productName} (${units} unit${units === 1 ? '' : 's'})`;
        },

        onReceiveInvoiceDialogHide() {
            this.receiveInvoicesSubmitted = false;
            this.receiveInvoiceLineAllocations = [];
            this.receiveInvoiceLoading = false;
            this.receiveInvoiceSaving = false;
            this.receiveInvoiceDialogTitle = 'Receive Invoices';
        },

        getInvoiceReceiveableLines(invoice: any): any[] {
            return (this.getInvoiceLinkedLines(invoice) || []).filter((line: any) => {
                const totalUnits = Number(line?.total_units || 0);
                const normalizedStatus = String(this.normalizeRawLineStatus(line?.status) || '').toLowerCase();
                return totalUnits > 0 && normalizedStatus !== 'delivered' && normalizedStatus !== 'cancelled';
            });
        },

        canReceiveInvoice(invoice: any): boolean {
            return this.getInvoiceReceiveableLines(invoice).length > 0;
        },

        getActiveReceiveInvoices(invoiceRows: any[]): any[] {
            return (invoiceRows || []).filter((invoice: any) => this.canReceiveInvoice(invoice));
        },

        getReceiveExpectedBoxes(line: any): number {
            const units = Number(line?.total_units || 0);
            const unitsPerBox = Number(line?.actual_units_per_box || line?.default_units_per_case || 0);
            if (!Number.isFinite(units) || !Number.isFinite(unitsPerBox) || unitsPerBox <= 0) return 0;
            return Number((units / unitsPerBox).toFixed(2));
        },

        getReceiveAllocatedBoxes(line: any): number {
            const splits = Array.isArray(line?.receive_splits) ? line.receive_splits : [];
            const total = splits.reduce((sum: number, split: any) => sum + Number(split?.boxes_received || 0), 0);
            return Number(Number.isFinite(total) ? total.toFixed(2) : 0);
        },

        onReceiveSplitBoxesInput(line: any, split: any) {
            if (!line) return;
            const nextValue = Number(split?.boxes_received ?? 0);
            split.boxes_received = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0;
        },

        addReceiveSplit(line: any) {
            if (!line) return;
            if (!Array.isArray(line.receive_splits)) {
                line.receive_splits = [];
            }

            const nextIdx = line.receive_splits.length;
            line.receive_splits.push({
                split_key: `${line.row_key}-split-${nextIdx}`,
                boxes_received: 0,
                location_id: null,
            });
        },

        removeReceiveSplit(line: any, splitIdx: number) {
            if (!line || !Array.isArray(line.receive_splits)) return;
            if (line.receive_splits.length <= 1) {
                line.receive_splits[0].boxes_received = 0;
                line.receive_splits[0].location_id = null;
                return;
            }
            line.receive_splits.splice(splitIdx, 1);
        },

        hasReceiveSplitLocationErrors(line: any): boolean {
            const splits = Array.isArray(line?.receive_splits) ? line.receive_splits : [];
            return splits.some((split: any) => Number(split?.boxes_received || 0) > 0 && !split?.location_id);
        },

        async openReceiveInvoiceDialog(options: { purchaseOrder?: any; invoices?: any[]; title?: string } = {}) {
            const purchaseOrder = options.purchaseOrder || null;
            const purchaseOrderId = Number(purchaseOrder?.purchase_order_id || 0);

            if (purchaseOrderId) {
                this.purchaseOrder = { ...purchaseOrder };
            }

            this.receiveInvoiceDialogVisible = true;
            this.receiveInvoiceDialogTitle = options.title || (purchaseOrder?.purchase_order_name
                ? `Receive Invoices for ${purchaseOrder.purchase_order_name}`
                : 'Receive Invoices');
            this.receiveInvoiceLoading = true;
            this.receiveInvoiceSaving = false;
            this.receiveInvoicesSubmitted = false;
            this.receiveInvoiceLineAllocations = [];

            try {
                let invoiceRows = Array.isArray(options.invoices) ? [...options.invoices] : [];

                if (!invoiceRows.length && purchaseOrderId) {
                    invoiceRows = (this.invoices || []).filter((invoice: any) =>
                        Number(invoice?.purchase_order_id || 0) === purchaseOrderId,
                    );
                }

                if (!invoiceRows.length && purchaseOrderId) {
                    invoiceRows = (await action.getInvoicesForPurchaseOrder(purchaseOrderId)) || [];
                }

                invoiceRows = this.getActiveReceiveInvoices(invoiceRows);

                const receiveRows: any[] = [];

                (invoiceRows || []).forEach((invoice: any) => {
                    const linkedLines = this.getInvoiceReceiveableLines(invoice);
                    const invoicePurchaseOrderId = Number(invoice?.purchase_order_id || purchaseOrderId || 0);
                    const invoicePurchaseOrderName = String(
                        invoice?.purchase_order_name
                        || (this.purchaseOrders || []).find((po: any) => Number(po?.purchase_order_id || 0) === invoicePurchaseOrderId)?.purchase_order_name
                        || purchaseOrder?.purchase_order_name
                        || ''
                    );

                    linkedLines.forEach((line: any) => {
                        const productId = Number(line?.product_id || 0);
                        const product = (this.products || []).find((p: any) => p.product_id === productId)
                            || (this.unprocProducts || []).find((p: any) => p.product_id === productId);
                        const unitsPerCase = Number(line?.default_units_per_case || product?.default_units_per_case || 0);

                        const expectedBoxes = this.getReceiveExpectedBoxes(line);
                        let partialQty = 0;

                        if(!Number.isInteger(expectedBoxes)) {
                            const wholeBoxes = Math.trunc(expectedBoxes);
                            partialQty = Number(line.total_units - (wholeBoxes * unitsPerCase));
                        }

                        receiveRows.push({
                            row_key: `recv-${invoicePurchaseOrderId}-${invoice?.invoice_id}-${line?.po_raw_line_id}`,
                            invoice_id: Number(invoice?.invoice_id || 0),
                            invoice_name: String(invoice?.invoice_name || ''),
                            purchase_order_id: invoicePurchaseOrderId,
                            purchase_order_name: invoicePurchaseOrderName,
                            po_raw_line_id: Number(line?.po_raw_line_id || 0),
                            product_id: productId,
                            product_name: String(line?.product_name || product?.name || `Product #${productId}`),
                            item_num: String(line?.item_num || product?.item_num || ''),
                            total_units: Number(line?.total_units - partialQty || 0),
                            default_units_per_case: unitsPerCase > 0 ? unitsPerCase : 0,
                            actual_units_per_box: unitsPerCase > 0 ? unitsPerCase : 0,
                            receive_splits: [
                                {
                                    split_key: `recv-${invoicePurchaseOrderId}-${invoice?.invoice_id}-${line?.po_raw_line_id}-split-0`,
                                    boxes_received: 0,
                                    location_id: null,
                                },
                            ],
                            line_status: String(line?.status || 'Inbound'),
                            line_notes: line?.notes ?? null,
                        });

                        if(partialQty > 0){
                            receiveRows.push({
                            row_key: `recv-${invoicePurchaseOrderId}-${invoice?.invoice_id}-${line?.po_raw_line_id}`,
                            invoice_id: Number(invoice?.invoice_id || 0),
                            invoice_name: String(invoice?.invoice_name || ''),
                            purchase_order_id: invoicePurchaseOrderId,
                            purchase_order_name: invoicePurchaseOrderName,
                            po_raw_line_id: Number(line?.po_raw_line_id || 0),
                            product_id: productId,
                            product_name: String(line?.product_name || product?.name || `Product #${productId}`),
                            item_num: String(line?.item_num || product?.item_num || ''),
                            total_units: Number(partialQty),
                            default_units_per_case: unitsPerCase > 0 ? unitsPerCase : 0,
                            actual_units_per_box: partialQty > 0 ? partialQty : 0,
                            receive_splits: [
                                {
                                    split_key: `recv-${invoicePurchaseOrderId}-${invoice?.invoice_id}-${line?.po_raw_line_id}-split-0`,
                                    boxes_received: 0,
                                    location_id: null,
                                },
                            ],
                            line_status: String(line?.status || 'Inbound'),
                            line_notes: line?.notes ?? null,
                        });
                        }
                    });
                });

                this.receiveInvoiceLineAllocations = receiveRows.sort((a: any, b: any) => {
                    if (a.purchase_order_id !== b.purchase_order_id) return a.purchase_order_id - b.purchase_order_id;
                    if (a.invoice_id !== b.invoice_id) return a.invoice_id - b.invoice_id;
                    return String(a.product_name || '').localeCompare(String(b.product_name || ''));
                });
            } catch (error) {
                console.error('Error preparing receive invoice dialog:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load invoice lines for receiving. Please try again.',
                    life: 5000,
                });
            } finally {
                this.receiveInvoiceLoading = false;
            }
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
            let linkedPoRec = this.poRecipes.find(rec => rec.purchase_order_id === purchase_order_id && this.displayRecipes.find(r => r.output_product_id === product_id && r.recipe_id === rec.recipe_id) !== undefined);
            
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
        let recipeOutput = this.displayRecipes.find(r => r.output_product_id === product_id);
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
            // console.log("PRODUCT ID: ", product_id);
            let prod = this.products.find(p => product_id === p.product_id);

            //console.log(prod.price_2023);
            //NEED TO MAKE ANOTHER TABLE FOR PRICES
            let price = 0;

            if(prod?.price_2023)
                price = prod.price_2023

            return price;
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
                case 'Ready':
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

                this.$toast.add({severity:'error', summary: 'Error', detail: err});
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

                    // let processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    let processedRecElKey = this.products.find((p: any) => p.product_id === recipeKey.output_product_id);
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
                if(this.purchaseOrder.po_raw_lines){
                    this.purchaseOrder.po_raw_lines.forEach((line: any) => {
                        if (this.normalizeRawLineStatus(line.status) !== 'Cancelled') {
                            total += Number(line.total_units || 0);
                        }
                    });
                }
                
            } //If the PO is being created
            else {
                // Calculate units from recipes, before boxes are actually linked to PO
                this.recipeArray.filter(poRec => poRec.recipe_id).forEach(poRec => {
                    //console.log(poRec);

                    let recipeKey = this.recipes.find(r => poRec.recipe_id === r.recipe_id);
                    //console.log(recipeKey);

                    let recipeElements = this.recipeElements.filter(recEl => recEl.recipe_id === recipeKey.recipe_id);
                    //console.log(recipeElements);

                    // let processedRecEl = recipeElements.find(recEl => recEl.type === 'output');
                    let processedRecElKey = this.products.find((p: any) => p.product_id === recipeKey.output_product_id);
                    let rawRecElArray = recipeElements.filter(recEl => recEl.type === 'input');
                    //console.log("Processed Rec El ", processedRecEl, " and Raw Rec El Array ", rawRecElArray);

                    rawRecElArray.forEach(recEl => {
                            total += this.getTotalUnitsOrdered(recEl, processedRecElKey, poRec.amount);
                        });

                });
                // Grab any boxes directly linked during PO creation, either by box or by unit, and calculate their total units
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

        getPoRawLineProgress(po: any){
            const poId = Number(po?.purchase_order_id || 0);
            if (!poId) {
                return {
                    deliveredUnits: 0,
                    inboundUnits: 0,
                    orderedUnits: 0,
                    backOrderedUnits: 0,
                    flaggedUnits: 0,
                    otherUnits: 0,
                    totalUnits: 0,
                    deliveredPct: 0,
                    inboundPct: 0,
                    orderedPct: 0,
                    backOrderedPct: 0,
                    flaggedPct: 0,
                    otherPct: 0,
                };
            }

            const lines = Array.isArray(po?.po_raw_lines)
                ? po.po_raw_lines
                : (this.po_raw_products || []).filter((line: any) => line.purchase_order_id === poId);

            let deliveredUnits = 0;
            let inboundUnits = 0;
            let orderedUnits = 0;
            let backOrderedUnits = 0;
            let flaggedUnits = 0;
            let otherUnits = 0;

            (lines || []).forEach((line: any) => {
                if (!line) return;
                const normalizedStatus = this.normalizeRawLineStatus(line.status || po?.status || 'Draft');
                if (normalizedStatus === 'Cancelled') return;

                const units = Number(
                    line.total_units ??
                    (Number(line.amount || 0) * Number(line.units_per_case || 0))
                );

                if (!Number.isFinite(units) || units <= 0) return;

                if (normalizedStatus === 'Delivered') {
                    deliveredUnits += units;
                } else if (normalizedStatus === 'Inbound') {
                    inboundUnits += units;
                } else if (normalizedStatus === 'Ordered') {
                    orderedUnits += units;
                } else if (normalizedStatus === 'Back Ordered') {
                    backOrderedUnits += units;
                } else if (normalizedStatus === 'Flagged') {
                    flaggedUnits += units;
                } else {
                    otherUnits += units;
                }
            });

            const totalUnits = deliveredUnits + inboundUnits + orderedUnits + backOrderedUnits + flaggedUnits + otherUnits;
            if (totalUnits <= 0) {
                return {
                    deliveredUnits: 0,
                    inboundUnits: 0,
                    orderedUnits: 0,
                    backOrderedUnits: 0,
                    flaggedUnits: 0,
                    otherUnits: 0,
                    totalUnits: 0,
                    deliveredPct: 0,
                    inboundPct: 0,
                    orderedPct: 0,
                    backOrderedPct: 0,
                    flaggedPct: 0,
                    otherPct: 0,
                };
            }

            const deliveredPct = (deliveredUnits / totalUnits) * 100;
            const inboundPct = (inboundUnits / totalUnits) * 100;
            const orderedPct = (orderedUnits / totalUnits) * 100;
            const backOrderedPct = (backOrderedUnits / totalUnits) * 100;
            const flaggedPct = (flaggedUnits / totalUnits) * 100;
            const otherPct = (otherUnits / totalUnits) * 100;

            return {
                deliveredUnits,
                inboundUnits,
                orderedUnits,
                backOrderedUnits,
                flaggedUnits,
                otherUnits,
                totalUnits,
                deliveredPct,
                inboundPct,
                orderedPct,
                backOrderedPct,
                flaggedPct,
                otherPct,
            };
        },

        getPoProgressSegmentStyle(po: any, segment: 'delivered' | 'inbound' | 'ordered' | 'back ordered' | 'flagged' | 'other'){
            const progress = this.getPoRawLineProgress(po);
            const leftBySegment: Record<'delivered' | 'inbound' | 'ordered' | 'back ordered' | 'flagged' | 'other', number> = {
                delivered: 0,
                inbound: progress.deliveredPct,
                ordered: progress.deliveredPct + progress.inboundPct,
                'back ordered': progress.deliveredPct + progress.inboundPct + progress.orderedPct,
                flagged: progress.deliveredPct + progress.inboundPct + progress.orderedPct + progress.backOrderedPct,
                other: progress.deliveredPct + progress.inboundPct + progress.orderedPct + progress.backOrderedPct + progress.flaggedPct,
            };
            const widthBySegment: Record<'delivered' | 'inbound' | 'ordered' | 'back ordered' | 'flagged' | 'other', number> = {
                delivered: progress.deliveredPct,
                inbound: progress.inboundPct,
                ordered: progress.orderedPct,
                'back ordered': progress.backOrderedPct,
                flagged: progress.flaggedPct,
                other: progress.otherPct,
            };

            return {
                left: `${leftBySegment[segment]}%`,
                width: `${widthBySegment[segment]}%`,
            };
        },

        getPoProgressSummary(po: any): string {
            const progress = this.getPoRawLineProgress(po);
            if (!progress.totalUnits) return 'No active units';

            return `Delivered ${progress.deliveredUnits} | Inbound ${progress.inboundUnits} | Ordered ${progress.orderedUnits} | BO ${progress.backOrderedUnits} | Flagged ${progress.flaggedUnits} | Other ${progress.otherUnits}`;
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

        getPoPhaseRank(status: string): number {
            const rankMap: Record<string, number> = {
                'Draft': 0,
                'Submitted': 1,
                'Ordered': 2,
                'Inbound': 3,
                'Partially Delivered': 3,
                'Delivered': 4,
                'Canceled': 5,
            };

            return rankMap[status] ?? 0;
        },

        canAdvanceToPhase(currentStatus: string, targetStatus: string): boolean {
            if (!targetStatus || currentStatus === 'Canceled' || currentStatus === 'Delivered') {
                return false;
            }

            const currentRank = this.getPoPhaseRank(currentStatus);
            const targetRank = this.getPoPhaseRank(targetStatus);

            return targetRank >= currentRank;
        },

        getPoPhaseStepClass(currentStatus: string, targetStatus: string): Record<string, boolean> {
            const currentRank = this.getPoPhaseRank(currentStatus);
            const targetRank = this.getPoPhaseRank(targetStatus);
            const isDeliveredCurrent = currentStatus === 'Delivered' && targetStatus === 'Delivered';

            return {
                'is-complete': targetRank < currentRank,
                'is-current': targetRank === currentRank && currentStatus !== 'Partially Delivered' && !isDeliveredCurrent,
                'is-partial': currentStatus === 'Partially Delivered' && targetStatus === 'Inbound',
                'is-next': targetRank > currentRank,
                'is-delivered': isDeliveredCurrent,
            };
        },

        onPoPhaseStepClick(purchaseOrder: any, targetStatus: string) {
            if (!this.canAdvanceToPhase(purchaseOrder.status, targetStatus) || purchaseOrder.status === targetStatus) {
                return;
            }

            if (targetStatus === 'Inbound') {
                this.newStatus = targetStatus;
                this.openInboundDialog(purchaseOrder);
                return;
            }

            if (targetStatus === 'Delivered') {
                this.confirmOrderReceived(purchaseOrder);
                return;
            }

            this.newStatus = targetStatus;
            this.openStatusChangeDialog(purchaseOrder);
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
            if (this.saving) return;
            this.saving = true;
            try {
                this.purchaseOrder.status = this.newStatus; 
                if (this.purchaseOrder.status === 'Ordered')
                this.purchaseOrder.date_ordered = this.today;

                console.log("PO in status change: ", this.purchaseOrder);

                await action.editPurchaseOrder(this.purchaseOrder);
                await this.getRecipes();

                if(this.purchaseOrder.status !== 'Draft' && this.purchaseOrder.status !== 'Submitted'){
                    console.log("Check for Requests");
                    await this.checkForRequests();
                }   
                this.statusChangeDialog = false;
            } catch (error) {
                console.error(error);
            } finally {
                this.saving = false;
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
            // let requests = await action.getRequests('');
            let po_requests = await action.getPurchaseOrderRequests(this.purchaseOrder.purchase_order_id || 0);



            console.log("IN REQUEST CHECK");

            console.log(this.purchaseOrder);
            console.log(this.poRecipes);

            const poId = this.purchaseOrder?.purchase_order_id;
            if (!poId) {
                console.warn("Skipping request check: purchase_order_id is missing.");
                return;
            }

            const poRecipes = Array.isArray(this.purchaseOrder?.po_recipes) ? this.purchaseOrder.po_recipes : [];
            const recMissingRequest: any[] = [];
            poRecipes.forEach((poRec: any) => {
                let foundRequest = po_requests.find((req: any) => req.product_id === poRec.product_id);
                if (!foundRequest) {
                    console.warn("No Request found for the following po recipe", poRec);
                    recMissingRequest.push(poRec);
                }
            });

            // If non of the planned recipes are missing a request, end function early to avoid unnecessary processing
            if(recMissingRequest.length === 0) 
                return;
            else{ // Else, grab all recipes and elements and add the necessary requests
                const recPackage: { recipes: any[]; elements: any[] } = await action.getRecipesAndElementsForVendors(this.purchaseOrder.vendor_id);
                console.log("Recipe package", recPackage);
                
                const recipes = Array.isArray(recPackage.recipes) ? recPackage.recipes : [];
                const recipeElements = Array.isArray(recPackage.elements) ? recPackage.elements : [];
                const existingRequests = Array.isArray(po_requests) ? po_requests : [];

                console.log("Needed Po Recipes: ", recMissingRequest);

                const skippedRecipeIds: number[] = [];

                for (const recipe of recMissingRequest) {

                    let neededRecipe = recipeElements.find((rec: any) => rec.recipe_id === recipe.recipe_id);
                    console.log("Needed Recipe Element: ", neededRecipe);

                    if (!neededRecipe || !neededRecipe.output_product_id) {
                        console.warn("Skipping request creation: missing output recipe element for recipe", recipe?.recipe_id);
                        if (recipe?.recipe_id) {
                            skippedRecipeIds.push(recipe.recipe_id);
                        }
                        continue;
                    }

                    let productKey = this.products.find(product => product.product_id === neededRecipe.output_product_id);
                    console.log("Product Key: ", productKey);

                    let recRequest = existingRequests.find(request => request.product_id === neededRecipe.output_product_id && request.purchase_order_id === poId);
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
                            product_id: Number(neededRecipe.output_product_id),
                            purchase_order_id: Number(poId),
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

                        // Keep local dedupe list in sync so duplicate requests are not created in the same run.
                        existingRequests.push(createdRequest);
                    }
                }

                if (skippedRecipeIds.length > 0) {
                    this.$toast.add({
                        severity: 'warn',
                        summary: 'Request Check Skipped',
                        detail: `Skipped ${skippedRecipeIds.length} recipe(s) because their output mapping is missing.`,
                        life: 5000,
                    });
                }
            }
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
            } else if (data.status === 'Cancelled') {
                return { font: 'bold', backgroundColor: '#e3b2b2', color: '#5f2222' };
            } else if  (data.status === 'On RTP' || data.status === 'Ready') {
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
            const rowIndex = this.poBoxes.indexOf(data);
            const isEvenRow = rowIndex % 2 === 0;
            
            if (data.po_raw_line_id || data.case_id) {
                if (data.status == 'Cancelled'){
                    return { font: 'bold', color: '#000000', backgroundColor: '#f19595' };
                } else {
                    // Blue striping for persisted raw rows
                    const bgColor = isEvenRow ? '#C0EEFF' : '#E8F4FF';
                    return { font: 'bold', color: '#000000', backgroundColor: bgColor };
                }
            }  else {
                return { font: 'bold', fontStyle: 'italic', color: '#000000', backgroundColor: 'Gold' };
            }
        },

        editRowStyleProc(data: any) {
            const rowIndex = this.singlePoRecipes.indexOf(data);
            const isEvenRow = rowIndex % 2 === 0;
            
            if (data.product_id) {
                if(data.warning === true){
                    return { font: 'bold', color: '#000000', backgroundColor: '#ffb439' };
                } else {
                    // Green striping for recipes
                    const bgColor = isEvenRow ? '#bbffb5' : '#D4F5DD';
                    return { font: 'bold', color: '#000000', backgroundColor: bgColor };
                }
            } else {
                return { font: 'bold', fontStyle: 'italic', color: '#000000', backgroundColor: 'Gold' };
            }
        },

        detailRowStyleProc(data: any) {
            const rowIndex = this.detailPlannedCases.indexOf(data);
            const isEvenRow = rowIndex % 2 === 0;

            if (data?.product_name) {
                const bgColor = isEvenRow ? '#bbffb5' : '#D4F5DD';
                return { font: 'bold', color: '#000000', backgroundColor: bgColor };
            }

            return { font: 'bold', fontStyle: 'italic', color: '#000000', backgroundColor: 'Gold' };
        },

        detailRowStyleRaw(data: any) {
            const rowIndex = this.detailRawLines.indexOf(data);
            const isEvenRow = rowIndex % 2 === 0;

            if (this.normalizeRawLineStatus(data?.status) === 'Cancelled') {
                return { font: 'bold', color: '#000000', backgroundColor: '#f19595' };
            }

            if (this.normalizeRawLineStatus(data?.status) === 'Flagged') {
                return { font: 'bold', color: '#000000', backgroundColor: '#e65c00' };
            }

            if (data?.product_id) {
                const bgColor = isEvenRow ? '#C0EEFF' : '#E8F4FF';
                return { font: 'bold', color: '#000000', backgroundColor: bgColor };
            }

            return { font: 'bold', fontStyle: 'italic', color: '#000000', backgroundColor: 'Gold' };
        },

        detailInvoiceRowStyle(data: any) {
            if (!data?.has_line) {
                return { font: 'bold', color: '#000000', backgroundColor: '#E8F4FF' };
            }

            const rowIndex = this.detailInvoiceRows.indexOf(data);
            const isEvenRow = rowIndex % 2 === 0;
            const bgColor = isEvenRow ? '#C0EEFF' : '#E8F4FF';
            return { font: 'bold', color: '#000000', backgroundColor: bgColor };
        },

        rowStyleRequested() {
            return { font: 'bold', color: '#000000', backgroundColor: '#C0EEFF' };
        },
        rowStyleReceived() {
            return { font: 'bold', color: '#000000', backgroundColor: '#bbffb5' };
        },
        rowStyleAwaiting() {
            return { font: 'bold', color: '#000000', backgroundColor: '#FFD580'};
        },
        rowStyleUnprocessed() {
            return { font: 'bold', color: '#000000', backgroundColor: '#C0EEFF' };
        },
        rowStylePool() {
            return { font: 'bold', color: '#000000', backgroundColor: '#C0EEFF' };
        },

        rowStyleCompared(data: any){
            if (data.moment === 'Requested') {
                return { font: 'bold', color: '#000000', backgroundColor: '#C0EEFF' };
            } else if (data.moment === 'Received') {
                return { font: 'bold', color: '#000000', backgroundColor: '#bbffb5' };
            } else if (data.moment === 'Awaiting') {
                return { font: 'bold', color: '#000000', backgroundColor: '#FFD580' };
            } else if (data.moment === 'Newly Arrived') {
                return { font: 'bold', color: '#000000', backgroundColor: '#a3e4d7' };
            }else if (data.moment === 'Back Ordered') {
                return { font: 'bold', color: '#000000', backgroundColor: '#f1948a' };
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
                    row === raw_product || row?.line_key === raw_product?.line_key || row?.product_id === raw_product?.product_id
                );
            }

            if (this.rawEditingRows && typeof this.rawEditingRows === 'object') {
                const rowKey = raw_product?.line_key ?? raw_product?.po_raw_line_id ?? raw_product?.product_id;
                if (rowKey === null || rowKey === undefined) return false;
                return Boolean((this.rawEditingRows as Record<string, any>)[String(rowKey)]);
            }

            return false;
        },

        removeUnsavedRawRow(raw_product: any, rawIdx: number){
            console.log("Removing raw product from poBoxes: ", raw_product);
            console.log("Current poBoxes before removal: ", this.poBoxes);
            console.log("Index of raw product to remove: ", rawIdx);
            // if (!raw_product || raw_product.product_id) return;

            // const index = this.poBoxes.findIndex((row: any) => row === raw_product);
            if (rawIdx < 0) return;

            this.poBoxes.splice(rawIdx, 1);
        },

        /**
         * Saves a raw-row edit by persisting a single po_raw_lines record.
         * The row total is treated as source-of-truth total_units, so we no longer split/cancel individual boxes here.
         */
        async onPORawLineEditSave(event: any){
            if (!this.ensurePoEditable('save raw lines')) return;
            const { newData, index } = event;
            console.log("Saving raw line edit with event data:", event);
            const poId = this.purchaseOrder?.purchase_order_id;

            if (!poId || !newData?.product_id) {
                this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Missing purchase order or product id.' });
                return;
            }

            // console.log("Saving raw line edit with data:", newData);

            this.isSavingEditDialog = true;

            const normalizedStatus = this.normalizeRawLineStatus(newData.status || this.purchaseOrder.status);
            const fallbackTotal = Number(newData.amount || 0) * Number(newData.units_per_case || 0);
            const parsedTotal = Number(newData.total ?? fallbackTotal);
            const totalUnits = Number.isFinite(parsedTotal) ? Math.max(0, Math.round(parsedTotal)) : 0;

            const existingLines = (this.singlePoRawProducts?.length
                ? this.singlePoRawProducts
                : (this.po_raw_products || []).filter((line: any) => line.purchase_order_id === poId)
            );
            const matchingLine = (existingLines || []).find((line: any) =>
                line.product_id === newData.product_id &&
                this.normalizeRawLineStatus(line.status) === normalizedStatus
            );

            let nextSinglePoRawProducts = [...(existingLines || [])];

            if (matchingLine) {
                if (totalUnits === 0) {
                    await action.deletePurchaseOrderRawLine(matchingLine.po_raw_line_id);
                    nextSinglePoRawProducts = nextSinglePoRawProducts.filter((line: any) =>
                        line.po_raw_line_id !== matchingLine.po_raw_line_id
                    );
                } else {
                    const editedLine = await action.editPurchaseOrderRawLine({
                        po_raw_line_id: matchingLine.po_raw_line_id,
                        product_id: newData.product_id,
                        purchase_order_id: poId,
                        invoice_id: newData.invoice_id ?? matchingLine.invoice_id ?? null,
                        total_units: totalUnits,
                        store: newData.store ?? 0,
                        fbm: newData.fbm ?? 0,
                        fba_prep: newData.fba_prep ?? 0,
                        notes: newData.notes ?? matchingLine.notes ?? null,
                        status: normalizedStatus,
                    });
                    nextSinglePoRawProducts = nextSinglePoRawProducts.map((line: any) =>
                        line.po_raw_line_id === matchingLine.po_raw_line_id ? editedLine : line
                    );
                }
            } else if (totalUnits > 0) {
                const createdLine = await action.addPurchaseOrderRawLine({
                    product_id: newData.product_id,
                    purchase_order_id: poId,
                    invoice_id: newData.invoice_id ?? null,
                    total_units: totalUnits,
                    store: newData.store ?? 0,
                    fbm: newData.fbm ?? 0,
                    fba_prep: newData.fba_prep ?? 0,
                    notes: newData.notes ?? null,
                    status: normalizedStatus,
                });
                nextSinglePoRawProducts.push(createdLine);
            }

            const nextUnitsPerCase = Number(newData.units_per_case || 0);
            const nextAmount = nextUnitsPerCase > 0 ? Number((totalUnits / nextUnitsPerCase).toFixed(2)) : (newData.amount || 0);
            const persistedLine = nextSinglePoRawProducts.find((line: any) =>
                line.product_id === newData.product_id &&
                this.normalizeRawLineStatus(line.status) === normalizedStatus
            );
            this.poBoxes[index] = {
                ...this.poBoxes[index],
                ...newData,
                line_key: persistedLine?.po_raw_line_id
                    ? `raw-${persistedLine.po_raw_line_id}`
                    : (this.poBoxes[index]?.line_key || `raw-${newData.product_id}-${normalizedStatus}`),
                po_raw_line_id: persistedLine?.po_raw_line_id || matchingLine?.po_raw_line_id || this.poBoxes[index]?.po_raw_line_id,
                status: normalizedStatus,
                total: totalUnits,
                amount: nextAmount,
                product_name: this.getProductInfo(newData.product_id, 'name'),
            };

            this.singlePoRawProducts = nextSinglePoRawProducts;
            const otherPoRawLines = (this.po_raw_products || []).filter((line: any) => line.purchase_order_id !== poId);
            this.po_raw_products = [...otherPoRawLines, ...nextSinglePoRawProducts];
            console.log("Updated singlePoRawProducts: ", this.singlePoRawProducts);
            console.log("Updated Purchase Order: ", this.purchaseOrder);

            // this.loadPage(this.currentPage);

            this.purchaseOrderRefresh(poId, { syncTable: true, syncDialog: true });

            this.checkPoTotals();

            this.$toast.add({
                severity: 'success',
                summary: 'Raw Line Saved',
                detail: totalUnits > 0 ? 'Raw line updated.' : 'Raw line removed.',
                life: 10000,
            });

            this.isSavingEditDialog = false;
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
            this.poBoxes = helper.groupItemsByKey(activePoBoxes, ['product_id', 'units_per_case', 'status']);

            this.purchaseOrderRefresh(currentPoId, {
                syncTable: true,
                syncDialog: true,
                patchRowData: {
                    individual_boxes: [...poAllBoxes],
                    grouped_boxes: [...this.poBoxes],
                },
                patchDialogData: {
                    individual_boxes: poAllBoxes,
                },
            });
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
            if (!this.ensurePoEditable('save recipes')) return;
            this.isSavingEditDialog = true;

            const { newData, index } = event;
            console.log("Old data: ", this.singlePoRecipes[index]);
            console.log("New data: ", newData);

            const poId = this.purchaseOrder?.purchase_order_id;
            const selectedRecipeId = Number(newData?.recipeObj?.recipe_id || newData?.recipe_id || 0);
            if (!poId || !selectedRecipeId) {
                this.$toast.add({severity:'error', summary: 'Missing Recipe', detail: 'Please select a recipe before saving.', life: 4000});
                this.isSavingEditDialog = false;
                return;
            }

            const recipe = (this.recipes || []).find((r: any) => r.recipe_id === selectedRecipeId);
            if (!recipe) {
                this.$toast.add({severity:'error', summary: 'Recipe Error', detail: 'Selected recipe output could not be found.', life: 4000});
                this.isSavingEditDialog = false;
                return;
            }

            const outputProduct = (this.products || []).find((p: any) => p.product_id === recipe.output_product_id)
                || (this.procProducts || []).find((p: any) => p.product_id === recipe.output_product_id);
            if (!outputProduct) {
                this.$toast.add({severity:'error', summary: 'Product Error', detail: 'Recipe output product is missing.', life: 4000});
                this.isSavingEditDialog = false;
                return;
            }

            const unitsPerCase = Number(outputProduct.default_units_per_case || newData.units_per_case || 1);
            newData.units_per_case = unitsPerCase;
            const normalizedAmount = Number(newData.amount || 0);
            let desiredQty = Number(newData.qty || 0);

            if (desiredQty <= 0 && normalizedAmount > 0) {
                desiredQty = normalizedAmount * unitsPerCase;
                newData.qty = desiredQty;
            }

            if (!Number.isFinite(desiredQty) || desiredQty <= 0) {
                this.$toast.add({severity:'error', summary: 'Invalid Amount', detail: 'Please enter a valid case count or total units.', life: 4000});
                this.isSavingEditDialog = false;
                return;
            }

            const existingRecipe = this.poRecipes.find((recipe: any) =>
                recipe.purchase_order_id === poId &&
                (recipe.po_recipe_id === this.singlePoRecipes[index]?.po_recipe_id || recipe.recipe_id === this.singlePoRecipes[index]?.recipe_id)
            );

            if (existingRecipe) {
                const editedRecipe = {
                    ...existingRecipe,
                    recipe_id: selectedRecipeId,
                    qty: desiredQty,
                };
                await action.editPurchaseOrderRecipe(editedRecipe);
            } else {
                await action.addPurchaseOrderRecipe({
                    purchase_order_id: poId,
                    recipe_id: selectedRecipeId,
                    qty: desiredQty,
                });

                /**@TODO Figure out why raw lines are not consolidating in the dialog after new recipes are made */
                // (Math.ceil((inputRow.required_units || 0) / (inputRow.key?.default_units_per_case || 1))) * (inputRow.key?.default_units_per_case || 0)
                /**@TODO Make sure the total units is rounding up based on default units per case */

                const rawInputs = (this.recipeElements || []).filter((re: any) => re.recipe_id === selectedRecipeId && re.type === 'input');
                const rawLinesToInsert: any[] = [];
                
                rawInputs
                    .forEach((rawInput: any) => {
                        const rawKey = this.products.find((product: any) => product.product_id === rawInput.product_id);
                        let totalUnits = Math.ceil((Number(rawInput.qty || 0)*desiredQty)/rawKey.default_units_per_case)*rawKey.default_units_per_case;

                        rawLinesToInsert.push({
                        product_id: rawInput.product_id,
                        purchase_order_id: poId,
                        total_units: totalUnits,
                        store: newData.store ?? 0,
                        fbm: newData.fbm ?? 0,
                        fba_prep: newData.fba_prep ?? 0,
                        status: this.normalizeRawLineStatus(this.purchaseOrder.status || 'Draft'),
                        notes: null,
                        invoice_id: null,
                        });
                    })
                    // .filter((line: any) => line.product_id && line.total_units > 0);

                if (rawLinesToInsert.length > 0) {
                    await action.bulkAddPurchaseOrderRawLines(rawLinesToInsert);
                }
            }

            this.$toast.add({severity:'success', summary: 'Recipe Saved', detail: `${newData.amount || Number((desiredQty / unitsPerCase).toFixed(2))} case(s) saved and raw lines updated.`, life: 5000});

            
            try {
                /**@TODO See if a front end refresh is needed and/or more effecient */
                await this.loadPage(this.currentPage, { rebuildSubscriptions: false });
                // this.purchaseOrderRefresh(poId, { syncTable: true, syncDialog: true });
                this.purchaseOrder = this.purchaseOrders.find((po: any) => po.purchase_order_id === poId) || this.purchaseOrder;
                await this.editPurchaseOrder(this.purchaseOrder);
            } finally {
                this.isSavingEditDialog = false;
                this.activeRecipeEditRow = null;
            }
        },


        onRawProductCancel(raw_product: any){
            if (!this.ensurePoEditable('cancel raw products')) return;
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
            this.rawProductCancelOption = 'boxes';
            this.rawProductCancelAmount = 1;
            this.rawProductCancelDialog = true;
        },

        closeRawProductCancelDialog(){
            this.rawProductCancelDialog = false;
            this.rawProductToCancel = null;
            this.rawProductCancelOption = 'boxes';
            this.rawProductCancelAmount = 0;
        },

        onRawProductCancelAmountInput(event: any){
            const nextValue = Number(event?.value ?? 0);
            this.rawProductCancelAmount = Number.isFinite(nextValue) ? nextValue : 0;
        },

        getRawCancelMax(){
            const target = this.rawProductToCancel;
            if (!target) return 0;

            if (this.rawProductCancelOption === 'boxes') {
                return Number(target.amount || 0);
            }

            return Number(target.amount || 0) * Number(target.units_per_case || 0);
        },

        isRawCancelOverMax(){
            const amount = Number(this.rawProductCancelAmount || 0);
            const max = this.getRawCancelMax();
            return amount > 0 && max > 0 && amount > max;
        },

        getRawCancelValidationMessage(){
            if (!this.isRawCancelOverMax()) return '';

            const amount = Number(this.rawProductCancelAmount || 0);
            const max = this.getRawCancelMax();
            const unitLabel = this.rawProductCancelOption === 'boxes' ? 'box(es)' : 'unit(s)';
            return `Entered amount (${amount}) exceeds max allowed (${max} ${unitLabel}).`;
        },

        getRawCancelPreview(){
            const target = this.rawProductToCancel;
            const amount = Number(this.rawProductCancelAmount || 0);
            if (!target || amount <= 0) return '';

            const poLabel = this.purchaseOrder?.purchase_order_name || `#${target.purchase_order_id ?? 'N/A'}`;

            if (this.rawProductCancelOption === 'boxes') {
                if (amount > (target.amount || 0)) return '';
                return `Will cancel ${amount} box${amount !== 1 ? 'es' : ''} from PO ${poLabel}.`;
            }

            const unitsPerCase = Number(target.units_per_case || 0);
            const totalUnits = Number(target.amount || 0) * unitsPerCase;
            if (!unitsPerCase || amount > totalUnits) return '';

            const fullBoxesCancelled = Math.floor(amount / unitsPerCase);
            const partialCancelledUnits = amount % unitsPerCase;

            if (partialCancelledUnits === 0) {
                return `Will cancel ${amount} units (${fullBoxesCancelled} full box${fullBoxesCancelled !== 1 ? 'es' : ''}) from PO ${poLabel}.`;
            }

            const remainingUnits = unitsPerCase - partialCancelledUnits;
            return `Will cancel ${amount} units from PO ${poLabel}: ${fullBoxesCancelled} full box${fullBoxesCancelled !== 1 ? 'es' : ''} plus 1 split box. Split result: original box becomes ${partialCancelledUnits} units and Cancelled; new partial box is ${remainingUnits} units and stays linked to PO ${poLabel}.`;
        },

        async confirmRawProductCancel(){
            if (!this.rawProductToCancel || !this.rawProductCancelAmount) {
                this.closeRawProductCancelDialog();
                return;
            }

            const target = this.rawProductToCancel;
            const cancelAmount = this.rawProductCancelAmount;
            const cancelOption = this.rawProductCancelOption;
            
            this.loading = true;
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

                let boxesToCancel: any[] = [];
                let partialBoxData: any = null;
                const cancelPayload: any[] = [];

                if (cancelOption === 'boxes') {
                    // Simple box cancellation: cancel the first N boxes
                    if (cancelAmount > matchingBoxes.length) {
                        this.$toast.add({
                            severity: 'warn',
                            summary: 'Invalid Amount',
                            detail: `You can only cancel up to ${matchingBoxes.length} box${matchingBoxes.length !== 1 ? 'es' : ''}.`,
                            life: 3000
                        });
                        this.closeRawProductCancelDialog();
                        return;
                    }

                    boxesToCancel = matchingBoxes.slice(0, cancelAmount);
                    boxesToCancel.forEach((b: any) => {
                        cancelPayload.push({
                            case_id:            b.case_id,
                            product_id:         b.product_id,
                            units_per_case:     b.units_per_case,
                            date_received:      b.date_received ?? null,
                            notes:              b.notes ?? null,
                            location_id:        b.location_id ?? null,
                            status:             'Cancelled',
                            purchase_order_id:  b.purchase_order_id,
                            request_id:         b.request_id ?? null
                        });
                    });
                } else {
                    // Unit-based cancellation with partial-box split logic
                    const totalUnitsAvailable = matchingBoxes.reduce((sum: number, box: any) => sum + (Number(box.units_per_case) || 0), 0);
                    if (cancelAmount > totalUnitsAvailable) {
                        this.$toast.add({
                            severity: 'warn',
                            summary: 'Invalid Amount',
                            detail: `You can only cancel up to ${totalUnitsAvailable} unit${totalUnitsAvailable !== 1 ? 's' : ''}.`,
                            life: 3000
                        });
                        this.closeRawProductCancelDialog();
                        return;
                    }

                    let unitsLeftToCancel = cancelAmount;

                    for (const box of matchingBoxes) {
                        if (unitsLeftToCancel <= 0) break;

                        const boxUnits = Number(box.units_per_case) || 0;
                        if (!boxUnits) continue;

                        // Full-box cancellation
                        if (unitsLeftToCancel >= boxUnits) {
                            boxesToCancel.push(box);
                            cancelPayload.push({
                                case_id:            box.case_id,
                                product_id:         box.product_id,
                                units_per_case:     boxUnits,
                                date_received:      box.date_received ?? null,
                                notes:              box.notes ?? null,
                                location_id:        box.location_id ?? null,
                                status:             'Cancelled',
                                purchase_order_id:  box.purchase_order_id,
                                request_id:         box.request_id ?? null
                            });
                            unitsLeftToCancel -= boxUnits;
                            continue;
                        }

                        // Split-box cancellation: cancel part of this box, keep the remainder as a new partial box
                        const cancelledUnits = unitsLeftToCancel;
                        const remainingUnits = boxUnits - cancelledUnits;

                        boxesToCancel.push(box);
                        cancelPayload.push({
                            case_id:            box.case_id,
                            product_id:         box.product_id,
                            units_per_case:     cancelledUnits,
                            date_received:      box.date_received ?? null,
                            notes:              `Partial cancellation (${cancelledUnits} units cancelled from ${boxUnits})`,
                            location_id:        box.location_id ?? null,
                            status:             'Cancelled',
                            purchase_order_id:  box.purchase_order_id,
                            request_id:         box.request_id ?? null
                        });

                        partialBoxData = {
                            product_id: box.product_id,
                            units_per_case: remainingUnits,
                            purchase_order_id: this.purchaseOrder?.purchase_order_id || box.purchase_order_id || target.purchase_order_id || null,
                            status: box.status,
                            date_received: box.date_received ?? null,
                            notes: `Partial box created during cancellation (${remainingUnits} units remaining)`,
                            location_id: box.location_id ?? null,
                            request_id: box.request_id ?? null
                        };

                        unitsLeftToCancel = 0;
                    }
                }

                if (!cancelPayload.length) {
                    this.$toast.add({
                        severity: 'warn',
                        summary: 'No Changes Applied',
                        detail: 'No boxes were eligible for cancellation.',
                        life: 3000
                    });
                    this.closeRawProductCancelDialog();
                    return;
                }

                await action.bulkEditCasesV2(cancelPayload);

                // If we created a partial box, add it to inventory
                if (partialBoxData) {
                    await action.addCase(partialBoxData);
                }

                // Pull fresh DB state so new partial boxes and unit changes are reflected in all views.
                await this.getBoxes();

                this.syncCurrentPurchaseOrderBoxViews();
                this.purchaseOrderRefresh(this.purchaseOrder?.purchase_order_id, { syncTable: true, syncDialog: true });
                this.checkPoTotals();

                const cancelDescription = cancelOption === 'boxes' 
                    ? `${cancelAmount} box${cancelAmount !== 1 ? 'es' : ''}`
                    : `${cancelAmount} units`;

                this.$toast.add({
                    severity: 'success',
                    summary: 'Product Cancelled',
                    detail: `${target.product_name || 'Selected product'} was marked as cancelled (${cancelDescription})${partialBoxData ? ' - partial box created with remainder.' : ''}`,
                    life: 3000
                });
            } catch (error) {
                console.error("Error cancelling product: ", error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Cancellation Failed',
                    detail: 'An error occurred while cancelling this product. Please try again.',
                    life: 4000
                });
            } finally {
                this.loading = false;
                this.closeRawProductCancelDialog();
            }
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
                const location = box.location_id ?? null;
                const requestedBox = {
                    ...box,
                    moment: 'Requested',
                    location_id: null,
                };
                tableData.push(requestedBox);

                if (box.status === 'On RTP' || box.status === 'Ready'){
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

                if (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Inbound' || box.status === 'Partially Delivered'){
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

            const keyStringArray = ["product_id", "moment", "location_id"];
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
                let bundleArray = this.delivered.filter(box => box.product_id === product_id && (box.moment === "Newly Arrived" || box.moment === "Back Ordered"));
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
                this.$toast.add({severity:'error', summary: "Error", detail: errMSG.join('\n')});
            } else {
                // Grab all PO boxes that are not received already
                let awaitedBoxes = this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && box.product_id === this.editedLine.product_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Inbound' || box.status === 'Partially Delivered'));
                console.log("awaitedBoxes", awaitedBoxes);
                // console.log("Received locations array:", this.receivedLocationsArray);

                // Make a key variable with all of the required box fields
                let receivedLocKey = this.receivedLocationsArray[0];

                if (this.receivedLocationsArray.length === 1){ // All boxes placed on one location

                    console.log("PO Boxes: ", this.poBoxes);
                    // 
                    this.poBoxes.forEach(box => {
                        if (box.product_id === receivedLocKey.product_id && (box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Inbound' || box.status === 'Partially Delivered' || box.status === 'BO')){
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
                            if (box.product_id === receivedLocKey.product_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Inbound' || box.status === 'Partially Delivered') ){
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

                    let awaitedBoxArray = this.uBoxes.filter(box => box.purchase_order_id === this.purchaseOrder.purchase_order_id && (box.status === 'BO'|| box.status === 'Draft' || box.status === 'Submitted' || box.status === 'Ordered' || box.status === 'Inbound' || box.status === 'Partially Delivered'));
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
            if (!purchaseOrder?.purchase_order_id) {
                return;
            }

            // Keep the currently selected PO in sync so header/toasts use the correct name.
            this.purchaseOrder = { ...purchaseOrder };
            this.inboundInvoiceName = '';
            this.inboundSubmitted = false;
            this.inboundUnaccountedLines = [];
            this.inboundUnaccountedDialog = false;
            this.inboundPurchaseOrderDialog = true;
            this.inboundBoxesLoading = true;
            console.log("Opening inbound dialog for PO: ", purchaseOrder);

            try {
                const purchaseOrderId = purchaseOrder.purchase_order_id;

                // Fetch the latest raw lines directly so we always have fresh data.
                let rawLines = purchaseOrder.po_raw_lines || await action.getCurrentPurchaseOrderRawLines(purchaseOrderId);

                // Legacy bootstrap: old orders may have only individual boxes and no po_raw_lines yet.
                if (!Array.isArray(rawLines) || rawLines.length === 0) {
                    const legacyBoxes = (purchaseOrder.individual_boxes || []).filter((box: any) =>
                        Number(box?.purchase_order_id) === Number(purchaseOrderId),
                    );

                    // ensureRawLinesExist builds lines from uBoxes; seed it from row payload if needed.
                    if (legacyBoxes.length > 0) {
                        const hasCurrentPoBoxesInCache = (this.uBoxes || []).some((box: any) =>
                            Number(box?.purchase_order_id) === Number(purchaseOrderId),
                        );

                        if (!hasCurrentPoBoxesInCache) {
                            this.uBoxes = [...(this.uBoxes || []), ...legacyBoxes];
                        }

                        rawLines = await this.ensureRawLinesExist();
                    }
                }

                this.purchaseOrder.po_raw_lines = rawLines || [];

                // Eligible: not cancelled, not already linked to an invoice
                const eligible = (this.purchaseOrder.po_raw_lines || [])
                    .filter((l: any) => !l.invoice_id && l.status?.toLowerCase() !== 'cancelled')
                    .sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''));

                this.inboundLineAllocations = eligible.map((l: any) => ({
                    ...l,
                    fba_prep_shipped: 0,
                    store_shipped: 0,
                    fbm_shipped: 0,
                    units_shipped: 0,
                    units_backordered: 0,
                }));
            } catch (error) {
                console.error('Error opening inbound dialog:', error);
            } finally {
                this.inboundBoxesLoading = false;
            }
        },

        onInboundDialogHide() {
            this.inboundSubmitted = false;
            this.inboundUnaccountedLines = [];
            this.inboundUnaccountedDialog = false;
        },

        getInboundRemaining(line: any): number {
            const ordered = Number(line?.total_units || 0);
            const shipped = Number(line?.units_shipped || 0);
            const backordered = Number(line?.units_backordered || 0);
            return ordered - shipped - backordered;
        },

        getInboundRemainingClass(line: any): Record<string, boolean> {
            return {
                'inbound-remaining--alert': true,
            };
        },

        onInboundUnitsUpdate(line: any, field: 'units_shipped' | 'units_backordered' | 'fba_prep' | 'store' | 'fbm') {
            // Clamp to non-negative
            if (line[field] < 0 || line[field] == null) {
                line[field] = 0;
            }
        },

        onInboundUnitsInput(event: any, data: any, field: string){
            console.log("Inbound input event: ", event);
            if (field === 'fba_prep'){
                data.units_shipped = event.value + data.store_shipped + data.fbm_shipped;
            } else if (field === 'store') {
                data.units_shipped = data.fba_prep_shipped + event.value + data.fbm_shipped;
            } else if (field === 'fbm') {
                data.units_shipped = data.fba_prep_shipped + data.store_shipped + event.value;
            } else if (field === 'backordered'){
                data.units_backordered = event.value;
                this.getInboundRemaining(data);
            }
        },

        getInboundUnaccountedLines(): any[] {
            return (this.inboundLineAllocations || [])
                .map((line: any) => ({
                    ...line,
                    remaining_units: this.getInboundRemaining(line),
                }))
                .filter((line: any) => Number(line.remaining_units || 0) > 0 && line.status !== 'Flagged');
        },

        async applyInboundLineAllocation(line: any, unaccountedMode: 'flag' | 'ignore', invoiceLineIds: number[]) {
            console.log("Applying inbound line allocation for line: ", line, "with unaccounted mode: ", unaccountedMode);

            const ordered = Math.max(0, Number(line?.total_units || 0)); //Total units ordered for PO
            const fbmOrdered = Math.max(0, Number(line?.fbm || 0)); // Total number of units in PO being set for fbm
            console.log("Ordered variables : ", ordered, "fbmOrdered: ", fbmOrdered);

            const shipped = Math.max(0, Number(line?.units_shipped || 0)); // Total units being shipped in this invoice
            const fbaShipped = Math.max(0, Number(line?.fba_prep_shipped || 0)); // Units being shipped in this invoice for fba prep
            const storeShipped = Math.max(0, Number(line?.store_shipped || 0)); // Units being shipped in this invoice to be stored
            const fbmShipped = Math.max(0, Number(line?.fbm_shipped || 0)); // Units being shipped in this invoice for fbm
            console.log("Shipped variables : ", shipped, "fbaShipped: ", fbaShipped, "storeShipped: ", storeShipped, "fbmShipped: ", fbmShipped);

            const backordered = Math.max(0, Number(line?.units_backordered || 0)); // Total units on back order for this invoice, should be the remainder after shipped units are accounted for
            const fbaBackordered = 0; // No units will be set to fba prep on back order, as all back ordered units not going to fbm will be set to be stored, but this is here for clarity and future proofing
            const fbmBackordered = Math.max(0, fbmOrdered - fbmShipped); // Units on back order for fbm is the remainder of the fbm ordered units after subtracting any fbm shipped units, as fbm units are always fulfilled before store units
            const storeBackordered = Math.max(0, backordered - fbaBackordered); // Units on back order for store is the remainder of the backordered units after accounting for fba prep backordered units
            console.log("Backordered variables : ", backordered, "fbaBackordered: ", fbaBackordered, "storeBackordered: ", storeBackordered, "fbmBackordered: ", fbmBackordered);

            const remaining = Math.max(0, ordered - shipped - backordered); // Any units not explicitly marked as shipped or back ordered. Users will be notified if any remainders exist
            const fbaRemaining = 0; // Again, setting fba prep to zero, as all remainders will either be set to store or to go to fbm
            const fbmRemaining = Math.max(0, fbmOrdered - fbmShipped - fbmBackordered); // Any fbm units not set to backordered or shipped, should always be zero, but is here just in case
            const storeRemaining = Math.max(0, remaining - fbmRemaining); // Any store units not set to backordered or shipped, should always be zero, but is here just in case
            console.log("Remaining variables : ", remaining, "fbaRemaining: ", fbaRemaining, "storeRemaining: ", storeRemaining, "fbmRemaining: ", fbmRemaining);
            
            
            /**@TODO Incorporate splitting fba_prep, store, and fbm into the shipped and back ordered splits */
            const segments = [
                { kind: 'shipped', qty: shipped, fba_prep: fbaShipped, store: storeShipped, fbm: fbmShipped },
                { kind: 'backordered', qty: backordered, fba_prep: fbaBackordered, store: storeBackordered, fbm: fbmBackordered },
                { kind: 'remaining', qty: remaining, fba_prep: fbaRemaining, store: storeRemaining, fbm: fbmRemaining },
            ].filter((segment: any) => segment.qty > 0);

            if (!segments.length) return;

            console.log("Segments to apply: ", segments);

            const keepKind = shipped > 0
                ? 'shipped'
                : backordered > 0
                    ? 'backordered'
                    : 'remaining';
            const keepSegment = segments.find((segment: any) => segment.kind === keepKind) || segments[0];

            console.log("Keep segment: ", keepSegment);

            const baseStatus = String(line?.status || this.purchaseOrder?.status || 'Draft');
            const statusByKind: Record<string, string> = {
                shipped: 'Inbound',
                backordered: 'Back Ordered',
                remaining: unaccountedMode === 'flag' ? 'Flagged' : baseStatus,
            };

            console.log("Status by kind: ", statusByKind);

            console.log("Line right before edit: ", line);

            await action.editPurchaseOrderRawLine({
                ...line,
                total_units: keepSegment.qty,
                store: keepSegment.store,
                fbm: keepSegment.fbm,
                fba_prep: keepSegment.fba_prep,
                status: statusByKind[keepSegment.kind],
            });

            if (keepSegment.kind === 'shipped') {
                invoiceLineIds.push(Number(line.po_raw_line_id));
            }

            const createSegmentLine = async (segment: any) => {
                const created = await action.addPurchaseOrderRawLine({
                    product_id: line.product_id,
                    purchase_order_id: line.purchase_order_id,
                    total_units: segment.qty,
                    store: segment.store,
                    fbm: segment.fbm,
                    fba_prep: segment.fba_prep,
                    notes: line.notes ?? null,
                    status: statusByKind[segment.kind],
                });

                if (segment.kind === 'shipped' && created?.po_raw_line_id) {
                    invoiceLineIds.push(Number(created.po_raw_line_id));
                }
            };

            for (const segment of segments) {
                if (segment.kind === keepSegment.kind) continue;
                await createSegmentLine(segment);
            }
        },

        getTodayDateString(): string {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        toInvoiceDateInput(value: any): string {
            if (!value) return '';
            return String(value).slice(0, 10);
        },

        toNullableInvoiceDate(value: any): string | null {
            const normalized = String(value || '').trim();
            return normalized.length ? normalized : null;
        },

        openInvoiceEditDialog(invoiceRow: any) {
            const invoiceId = Number(invoiceRow?.invoice_id || 0);
            if (!invoiceId) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'Invoice unavailable',
                    detail: 'Could not open invoice editor for this row.',
                    life: 3500,
                });
                return;
            }

            const sourceInvoice = (this.invoices || []).find((inv: any) => Number(inv?.invoice_id || 0) === invoiceId) || invoiceRow;

            this.invoiceEditDraft = {
                invoice_id: Number(sourceInvoice?.invoice_id || 0),
                invoice_name: String(sourceInvoice?.invoice_name || ''),
                total_cost: Number(sourceInvoice?.total_cost || 0),
                purchase_order_id: Number(sourceInvoice?.purchase_order_id || this.detailSelectedPoId || 0),
                date_shipped: this.toInvoiceDateInput(sourceInvoice?.date_shipped),
                date_due: this.toInvoiceDateInput(sourceInvoice?.date_due),
                date_paid: this.toInvoiceDateInput(sourceInvoice?.date_paid),
                card: Number(sourceInvoice?.card || 0),
                filed: !!sourceInvoice?.filed,
                notes: String(sourceInvoice?.notes ?? sourceInvoice?.invoice_notes ?? ''),
            };

            this.invoiceEditSubmitted = false;
            this.invoiceEditDialogVisible = true;
        },

        async saveInvoiceEdits() {
            this.invoiceEditSubmitted = true;

            if (!String(this.invoiceEditDraft?.invoice_name || '').trim()) {
                return;
            }

            this.invoiceEditSaving = true;

            try {
                await action.editInvoice({
                    invoice_id: Number(this.invoiceEditDraft.invoice_id || 0),
                    invoice_name: String(this.invoiceEditDraft.invoice_name || '').trim(),
                    total_cost: Number(this.invoiceEditDraft.total_cost || 0),
                    purchase_order_id: Number(this.invoiceEditDraft.purchase_order_id || this.detailSelectedPoId || 0),
                    date_shipped: this.toNullableInvoiceDate(this.invoiceEditDraft.date_shipped),
                    date_due: this.toNullableInvoiceDate(this.invoiceEditDraft.date_due),
                    date_paid: this.toNullableInvoiceDate(this.invoiceEditDraft.date_paid),
                    card: Number(this.invoiceEditDraft.card || 0),
                    filed: !!this.invoiceEditDraft.filed,
                    notes: String(this.invoiceEditDraft.notes || '').trim() || null,
                });

                this.invoiceEditDialogVisible = false;

                this.$toast.add({
                    severity: 'success',
                    summary: 'Invoice updated',
                    detail: 'Invoice details were saved successfully.',
                    life: 3500,
                });

                await this.loadPage(this.currentPage ?? 1);
            } catch (error) {
                console.error('Error updating invoice:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update invoice. Please try again.',
                    life: 6000,
                });
            } finally {
                this.invoiceEditSaving = false;
            }
        },

        /**
         * Called when user clicks "Create Invoice".
         * Validates, checks for extra units, then either creates the invoice
         * immediately or shows an extra-units confirmation dialog first.
         */
        submitCreateInvoice() {
            this.inboundSubmitted = true;

            const hasName = !!this.inboundInvoiceName.trim();
            const linesWithShippedUnits = this.inboundLineAllocations.filter((l: any) => Number(l.units_shipped) > 0);

            if (!hasName || linesWithShippedUnits.length === 0) {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Please enter an invoice name and allocate at least one shipped unit to the invoice.',
                    life: 5000,
                });
                return;
            }

            const overAllocated = (this.inboundLineAllocations || []).filter((line: any) =>
                Number(line.units_shipped || 0) + Number(line.units_backordered || 0) > Number(line.total_units || 0),
            );

            if (overAllocated.length > 0) {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Shipped + Back Ordered cannot exceed Ordered Units on any line.',
                    life: 5000,
                });
                return;
            }

            const unaccountedLines = this.getInboundUnaccountedLines();

            if (unaccountedLines.length > 0) {
                this.inboundUnaccountedLines = unaccountedLines;
                this.inboundUnaccountedDialog = true;
                return;
            }

            void this.confirmCreateInvoice('ignore');
        },

        submitCreateInvoiceWithUnaccounted(mode: 'flag' | 'ignore') {
            this.inboundUnaccountedDialog = false;
            void this.confirmCreateInvoice(mode);
        },

        /**
         * Performs split + invoice creation after all validations pass.
         * Shipped units are linked to the new invoice.
         * Back ordered units remain unlinked with status "Back Ordered".
         * Unaccounted units are handled by the chosen mode:
         *   - flag   → set/create lines as "Flagged"
         *   - ignore → keep status unchanged on unaccounted split lines
         */
        async confirmCreateInvoice(unaccountedMode: 'flag' | 'ignore' = 'ignore') {
            this.inboundUnaccountedDialog = false;
            this.inboundCreatingInvoice = true;

            try {
                const linesWithAnyAllocation = (this.inboundLineAllocations || []).filter((line: any) =>
                    Number(line.units_shipped || 0) > 0
                    || Number(line.units_backordered || 0) > 0
                    || this.getInboundRemaining(line) > 0,
                );
                const invoiceLineIds: number[] = [];

                for (const line of linesWithAnyAllocation) {
                    await this.applyInboundLineAllocation(line, unaccountedMode, invoiceLineIds);
                }

                if (!invoiceLineIds.length) {
                    this.$toast.add({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: 'At least one shipped line is required to create an invoice.',
                        life: 5000,
                    });
                    return;
                }

                await action.addInvoiceWithRawLines(
                    {
                        invoice_name: this.inboundInvoiceName.trim(),
                        purchase_order_id: this.purchaseOrder.purchase_order_id,
                        total_cost: 0,
                        date_shipped: this.getTodayDateString(),
                        date_due: null,
                        date_paid: null,
                        card: 0,
                        filed: false,
                        notes: null,
                        status: "Inbound",
                    },
                    invoiceLineIds,
                );

                (this as any).$toast.add({
                    severity: 'success',
                    summary: 'Invoice Created',
                    detail: `Invoice "${this.inboundInvoiceName.trim()}" created with ${invoiceLineIds.length} line(s).`,
                    life: 5000,
                });

                this.purchaseOrder.status = 'Inbound';
                await action.editPurchaseOrder({
                    ...this.purchaseOrder,
                    status: 'Inbound',
                });

                await this.checkForRequests();
                
                this.inboundPurchaseOrderDialog = false;
                await this.loadPage(this.currentPage ?? 1);
                this.purchaseOrderRefresh(this.purchaseOrder?.purchase_order_id);

            } catch (error) {
                console.error('Error creating invoice:', error);
                (this as any).$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create invoice. Please try again.',
                    life: 6000,
                });
            } finally {
                this.inboundCreatingInvoice = false;
            }
        },

        /**
         * Called when user clicks "Save Received Boxes" in the Receive Invoice dialog. 
         * Validates that at least one box is received, that all splits with received boxes have a location, and that all lines have valid units per case. 
         * Then creates cases for each split with received boxes and updates PO line statuses as needed.
         */
        async saveReceivedInvoiceBoxes() {
            this.receiveInvoicesSubmitted = true;

            const rowsWithBoxes = (this.receiveInvoiceLineAllocations || []).filter((row: any) =>
                Number(this.getReceiveAllocatedBoxes(row) || 0) > 0,
            );

            if (!rowsWithBoxes.length) {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Enter at least one received box amount before saving.',
                    life: 4500,
                });
                return;
            }

            const missingLocationRows = rowsWithBoxes.filter((row: any) => this.hasReceiveSplitLocationErrors(row));
            if (missingLocationRows.length > 0) {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Choose a location for every split that has received boxes.',
                    life: 5000,
                });
                return;
            }

            const invalidUnitsPerCase = rowsWithBoxes.filter((row: any) => Number(row?.actual_units_per_box || 0) <= 0);
            if (invalidUnitsPerCase.length > 0) {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Missing Actual Units Per Box',
                    detail: 'One or more lines have no valid actual units per box.',
                    life: 5000,
                });
                return;
            }

            this.receiveInvoiceSaving = true;

            try {
                const today = this.getTodayDateString();

                const boxArray: {
                    product_id: number;
                    units_per_case: number;
                    amount: number;
                    date_received: string | null;
                    notes: string | null;
                    location_id: number | null;
                    status: string | null;
                    purchase_order_id: number | null;
                    request_id: number | null;
                    invoice_id: number | null;
                }[] = [];

                const fullyReceivedLineIds: number[] = [];
                const partiallyReceivedLineIds: number[] = [];
                const linesToUpdate: any[] = [];
                const lineTotals: {line_id: number, orderedUnits: number, receivedUnits: number, remainingUnits: number}[] = [];

                for (const row of rowsWithBoxes) {
                    const unitsPerCase = Number(row.actual_units_per_box || 0);
                    const activeSplits = (row.receive_splits || []).filter((split: any) => Number(split?.boxes_received || 0) > 0);
                    let totalBoxesReceived = 0;

                    for (const split of activeSplits) {
                        const splitBoxes = Number(split.boxes_received || 0);
                        totalBoxesReceived += splitBoxes;

                        const fullBoxes = Math.floor(splitBoxes);
                        const partialBoxFactor = Number((splitBoxes - fullBoxes).toFixed(4));
                        const partialUnits = Number((partialBoxFactor * unitsPerCase).toFixed(2));

                        if (fullBoxes > 0) {
                            boxArray.push({
                                product_id: Number(row.product_id),
                                units_per_case: unitsPerCase,
                                amount: fullBoxes,
                                date_received: today,
                                notes: row.line_notes || null,
                                location_id: Number(split.location_id),
                                status: 'On RTP',
                                purchase_order_id: Number(row.purchase_order_id),
                                request_id: null,
                                invoice_id: Number(row.invoice_id),
                            });
                        }

                        if (partialUnits > 0) {
                            const partialNote = `Partial box received from invoice ${row.invoice_name || row.invoice_id}`;
                            boxArray.push({
                                product_id: Number(row.product_id),
                                units_per_case: partialUnits,
                                amount: 1,
                                date_received: today,
                                notes: row.line_notes ? `${row.line_notes} | ${partialNote}` : partialNote,
                                location_id: Number(split.location_id),
                                status: 'On RTP',
                                purchase_order_id: Number(row.purchase_order_id),
                                request_id: null,
                                invoice_id: Number(row.invoice_id),
                            });
                        }
                    }

                    const receivedUnits = Number((totalBoxesReceived * unitsPerCase).toFixed(2));
                    const orderedUnits = Number(row.total_units || 0);

                    lineTotals.push({
                        line_id: Number(row.po_raw_line_id),
                        orderedUnits,
                        receivedUnits,
                        remainingUnits: Number((orderedUnits - receivedUnits).toFixed(2)),
                    });

                    if (orderedUnits > 0 && receivedUnits >= orderedUnits && Number(row.po_raw_line_id || 0) > 0) {
                        fullyReceivedLineIds.push(Number(row.po_raw_line_id));
                    } else if (orderedUnits > 0 && receivedUnits < orderedUnits && receivedUnits > 0 && Number(row.po_raw_line_id || 0) > 0) {
                        partiallyReceivedLineIds.push(Number(row.po_raw_line_id));
                    }
                }

                const createdCaseCount = boxArray.reduce((sum, record) => sum + record.amount, 0);

                if (boxArray.length > 0) {
                    await action.createMultipleCasesByType(boxArray);
                }

                // If all boxes of this product type were grabbed for this invoice, set the raw line to Delivered
                for (const lineId of fullyReceivedLineIds) {
                    const sourceLine = (this.po_raw_products || []).find((line: any) => Number(line?.po_raw_line_id || 0) === lineId);
                    if (sourceLine) {
                        // await action.editPurchaseOrderRawLine({ ...sourceLine, status: 'Delivered' });
                        linesToUpdate.push({ ...sourceLine, status: 'Delivered' });
                    }
                }

                // If any lines were partially received, check to see if there is already a split line for remaining product, if there is, update the total count, if not, create one, and set the status to Inbound
                for (const lineId of partiallyReceivedLineIds) {
                    const sourceLine = (this.po_raw_products || []).find((line: any) => Number(line?.po_raw_line_id || 0) === lineId);
                    if (sourceLine) {
                        // await action.editPurchaseOrderRawLine({ ...sourceLine, status: 'Partially Delivered' });

                        const totalCounts = lineTotals.find((line: any) => line.line_id === lineId);
                        // Check to see if there is another line linked to the invoice for this product type (means a remainder line was previously created)
                        const remainderLine = (this.po_raw_products || []).find((line: any) => Number( line?.po_raw_line_id || 0) !== lineId && Number(line?.invoice_id || 0) === sourceLine.invoice_id && line.status === 'Inbound');

                        console.log("RemainderLine: ", remainderLine);
                        // If a remainder line exists, update the original source line total to only the received units, with a status of delivered, and
                        // set the total units of the remainderLine to the ordered unit amount - received unit amount
                        if(remainderLine){
                            linesToUpdate.push({...sourceLine, total_units: totalCounts?.receivedUnits || sourceLine.total_units, status: 'Delivered'});
                            linesToUpdate.push({...remainderLine, total_units: totalCounts?.remainingUnits || remainderLine.total_units, status: 'Inbound'});
                        } else{ // If a remainderLine does not exist, create it, setting the status to inbound and the unit total to order amount - received amount
                                // Update the received line like with the first half of the if statement
                            linesToUpdate.push({...sourceLine, total_units: totalCounts?.receivedUnits || sourceLine.total_units, status: 'Delivered'});
                            await action.addPurchaseOrderRawLine({
                                ...sourceLine,
                                total_units: totalCounts?.remainingUnits || 0,
                                status: 'Inbound',
                            });
                        }
                    }
                }

                if (linesToUpdate.length > 0)
                    await action.bulkEditPurchaseOrderRawLines(linesToUpdate);

                this.$toast.add({
                    severity: 'success',
                    summary: 'Invoice Receipt Saved',
                    detail: `Created ${createdCaseCount} received box record${createdCaseCount === 1 ? '' : 's'}.`,
                    life: 5000,
                });

                this.receiveInvoiceDialogVisible = false;
                await this.loadPage(this.currentPage ?? 1);
            } catch (error) {
                console.error('Error saving received invoice boxes:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save received boxes. Please try again.',
                    life: 6000,
                });
            } finally {
                this.receiveInvoiceSaving = false;
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
.inbound-skeleton-table {
     pointer-events: none;
 }

.inbound-invoice-name-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-width: 380px;
}

.inbound-field-label {
    font-weight: 700;
    color: #2a4761;
    font-size: 0.92rem;
}

.inbound-required {
    color: #e24c4c;
}

.inbound-invoice-name-input {
    width: 100%;
}

.inbound-instructions {
    color: var(--text-color-secondary, #6b7280);
    font-size: 0.9rem;
}

.receive-invoice-layout {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.receive-invoice-instructions {
    color: var(--text-color-secondary, #6b7280);
    font-size: 0.9rem;
}

.receive-invoice-table {
    border: 1px solid #d4e1ee;
    border-radius: 10px;
    overflow: hidden;
}

.receive-invoice-group-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #1f3f5f;
}

.receive-invoice-group-sub {
    color: #55738f;
    font-size: 0.82rem;
}

.receive-boxes-total {
    display: inline-flex;
    min-width: 72px;
    justify-content: flex-end;
    font-weight: 700;
    color: #1d4f73;
}

.receive-boxes-total--over {
    color: #b42318;
}

.receive-split-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 350px;
}

.receive-split-row {
    display: grid;
    grid-template-columns: 110px minmax(180px, 1fr) 32px;
    gap: 0.4rem;
    align-items: center;
}

.receive-split-row__boxes {
    width: 100%;
}

.receive-split-row__location {
    width: 100%;
}

.receive-split-actions {
    display: flex;
    justify-content: flex-start;
}

.inbound-lines-table {
    border: 1px solid #d4e1ee;
    border-radius: 10px;
    overflow: hidden;
}

:deep(.inbound-units-input .p-inputnumber-input) {
    width: 100px;
    text-align: right;
}

:deep(.inbound-units-input--over .p-inputnumber-input) {
    background-color: #fff4de;
    border-color: #d9ad20;
    color: #5e4702;
}

.inbound-remaining--alert {
    color: #b42318;
    font-weight: 700;
}

.inbound-unaccounted-list {
    margin: 0.65rem 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.invoice-products-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.invoice-lines-expand-wrap {
    padding: 0.4rem 0.25rem 0.75rem;
}

.skeleton-line {
     height: 0.95rem;
     border-radius: 999px;
     background: linear-gradient(90deg, #e6edf5 0%, #f6fafe 50%, #e6edf5 100%);
     background-size: 200% 100%;
     animation: inbound-skeleton-shimmer 1.2s ease-in-out infinite;
 }
.skeleton-line--product {
     width: 78%;
 }
.skeleton-line--item {
     width: 52%;
 }
.skeleton-line--number {
     width: 44px;
 }
.skeleton-line--total {
     width: 62px;
 }
.raw-cancel-input--invalid :is(.p-inputtext, input) {
    background-color: #ffe3e3 !important;
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
  background: #000000;
  color: #000000 !important;
}

/* ── Table-scoped loading overlay ────────────────────────────── */
.dt-loading-wrapper {
  position: relative;
}

.po-master-detail {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
    background: #000000;
}

.po-master-detail--table {
    grid-template-columns: minmax(0, 1fr) 380px;
    background: #000000;
}

.po-master-detail__table {
    min-width: 0;
    background: #000000;
}

.po-master-detail__table--cards {
    border: 1px solid #d4e1ee;
    border-radius: 12px;
    padding: 0.8rem;
    background: #000000;
}

.po-workspace-panel {
    border: 1px solid #000000;
    border-radius: 14px;
    background: #000000;
    box-shadow: 0 8px 20px rgba(15, 46, 79, 0.08);
    padding: 0.85rem;
    position: sticky;
    top: 0.75rem;
    max-height: calc(100vh - 2rem);
    overflow: auto;
}

.po-workspace-header {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-bottom: 0.65rem;
}

.po-workspace-kicker {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2f597f;
}

.po-workspace-title {
    margin: 0;
    color: #1d3f5e;
    line-height: 1.2;
}

.po-workspace-subtitle {
    margin: 0;
    color: #5f7487;
    font-size: 0.88rem;
}

.po-workspace-dot {
    margin: 0 0.35rem;
}

.po-workspace-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-bottom: 0.75rem;
}

.po-workspace-metric {
    border: 1px solid #d7e4f1;
    border-radius: 10px;
    background: #f8fbff;
    padding: 0.45rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.po-workspace-metric-label {
    font-size: 0.72rem;
    color: #5f7487;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.po-workspace-metric-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1f3d5a;
}

.po-workspace-actions {
    display: flex;
    gap: 0.45rem;
    margin-bottom: 0.8rem;
}

.po-workspace-actions .po-action-btn {
    flex: 1;
}

.po-workspace-section {
    margin-top: 0.8rem;
}

.po-workspace-section-title {
    margin: 0 0 0.4rem;
    font-size: 0.9rem;
    color: #274d6f;
}

.po-workspace-empty {
    border: 1px dashed #c7d8e8;
    border-radius: 12px;
    padding: 1.1rem;
    text-align: center;
    color: #4d6780;
    background: #f8fbff;
}

.po-workspace-empty-icon {
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
}

.po-workspace-empty-title {
    margin: 0;
    color: #264866;
}

.po-workspace-empty-copy {
    margin: 0.3rem 0 0;
    font-size: 0.9rem;
}

.dt-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  border-radius: 6px;
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

@keyframes inbound-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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

:root{
    --po-blue-border: #7faad6;
    --po-blue-soft: #dcedff;
    --po-blue-strong: #72a9e2;
    --po-blue-text: #103f73;

    --po-gray-border: #98a4b0;
    --po-gray-soft: #e2e7ec;
    --po-gray-strong: #cfd7df;
    --po-gray-text: #3d4a57;

    --po-yellow-border: #d9ad20;
    --po-yellow-soft: #fff4bf;
    --po-yellow-strong: #ffe17a;
    --po-yellow-text: #5e4702;

    --po-green-border: #239b59;
    --po-green-soft: #84e8ae;
    --po-green-strong: #3fc87a;
    --po-green-text: #0a3f23;
}

.card {
    --po-pill-radius: 999px;
    --po-pill-height: 30px;
    --po-pill-font-size: 0.73rem;
    --po-pill-font-weight: 700;
    --po-transition-fast: 160ms ease;
    --po-transition-medium: 220ms ease;

    

    border: 1px solid var(--surface-border, #d4d8dd);
    border-radius: 16px;
    background: #f6f8fa;
    box-shadow: 0 12px 28px rgba(8, 25, 45, 0.08);
    overflow: hidden;
}

:deep(.card .p-toolbar) {
    border: 0;
    border-bottom: 1px solid var(--surface-border, #d4d8dd);
    background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
    padding: 0.9rem 1.1rem;
}

.po-toolbar-filters {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.po-toolbar-filter {
    min-width: 170px;
}

.po-toolbar-filter--search {
    min-width: 260px;
}

.po-view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-left: auto;
}

.po-view-toggle-btn {
    min-height: 2.05rem;
}

.po-card-grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.po-card-grid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    padding: 0.65rem 0.8rem;
    border: 1px solid #c5ced8;
    border-radius: 10px;
    color: #ffffff;
}

.po-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.8rem;
    overflow-y: auto;       /* Enables vertical scrolling */
    max-height: 60vh;    /* Adjusts based on your layout needs */
    background: #000000;
    padding: 0.8rem;
}

.po-card {
    border: 1px solid #d4e1ee;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
    box-shadow: 0 4px 10px rgba(15, 46, 79, 0.08);
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    cursor: pointer;
    transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.po-card:hover {
    transform: translateY(-1px);
    border-color: #8fb0ce;
    box-shadow: 0 8px 16px rgba(15, 46, 79, 0.12);
}

.po-card-header {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    border-bottom: 1px solid #e1eaf2;
    padding-bottom: 0.55rem;
}

.po-card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* Aligns dots to the top of the title text */
}

/* NEW: Optional container to keep title/subtitle stacked vertically */
.po-card-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.po-card-title {
    margin: 0;
    font-size: 1rem;
    color: #1b3f60;
}

.po-card-subtitle {
    margin: 0;
    font-size: 0.84rem;
    color: #5f7487;
}

.po-card-dots :deep(.p-button-icon) {
    display: flex;
}

.po-card-dot-appearance{
    color: #000000 !important;
}

.popover-button-stack {
  display: flex;
  flex-direction: column; /* Stacks items vertically */
  gap: 0.5rem;            /* Adds uniform spacing between buttons */
  min-width: 180px;       /* Keeps the popover wide enough for text */
}

.po-card-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
}

.po-card-metric {
    border: 1px solid #dce8f3;
    border-radius: 8px;
    background: #f8fbff;
    padding: 0.45rem 0.55rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.po-card-metric-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #5f7487;
}

.po-card-metric-value {
    font-size: 0.92rem;
    font-weight: 700;
    color: #1f3d5a;
}

.po-card-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.po-card-empty {
    border: 1px dashed #c7d8e8;
    border-radius: 12px;
    padding: 1.4rem;
    text-align: center;
    color: #4d6780;
    background: #f8fbff;
}

.po-card-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
}

.po-card-pagination :deep(.p-paginator) {
    border: 0;
    border-top: 1px solid var(--surface-border, #d4d8dd);
    background: #fbfdff;
    padding: 0.65rem 0.9rem;
    border-radius: 10px;
}

.po-detail-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.po-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
}

.po-detail-item {
    border: 1px solid #d7e4f1;
    border-radius: 10px;
    background: #f8fbff;
    padding: 0.55rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.po-detail-item-label {
    font-size: 0.72rem;
    color: #5f7487;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.po-detail-item-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1f3d5a;
    line-height: 1.25;
}

.po-detail-item--wide,
.po-detail-item--progress {
    grid-column: 1 / -1;
}

.po-detail-collapsible {
    border: 1px solid #d7e4f1;
    border-radius: 10px;
    background: #f8fbff;
    padding: 0.4rem 0.55rem;
}

.po-detail-collapsible + .po-detail-collapsible {
    margin-top: 0.55rem;
}

.po-detail-collapsible summary {
    cursor: pointer;
    font-weight: 700;
    color: #264b6d;
    list-style: none;
    padding: 0.3rem 0.15rem;
}

.po-detail-collapsible summary::-webkit-details-marker {
    display: none;
}

.po-detail-collapsible summary::before {
    content: '+';
    display: inline-block;
    width: 1rem;
    margin-right: 0.35rem;
    color: #2f597f;
}

.po-detail-collapsible[open] summary::before {
    content: '-';
}

.po-detail-table {
    margin-top: 0.35rem;
    color: #000000 !important;
}

.po-detail-table :deep(.p-datatable-thead > tr > th),
.po-detail-table :deep(.p-datatable-tbody > tr > td),
.po-detail-table :deep(.p-datatable-emptymessage > td),
.po-detail-table :deep(.p-rowgroup-header > td),
.po-detail-table :deep(.p-sortable-column-icon),
.po-detail-table :deep(.p-column-title) {
    color: #000000 !important;
}

.po-detail-subsection-title {
    margin: 0.75rem 0 0.35rem;
    color: #274d6f;
    font-size: 0.92rem;
}

.po-detail-table--green :deep(.p-datatable-tbody > tr:nth-child(odd) > td) {
    /* background: #bbffb5; */
    background: #16ae08;
}

.po-detail-table--green :deep(.p-datatable-tbody > tr:nth-child(even) > td) {
    /* background: #d4f5dd; */
    background: #057f26;
}

.po-detail-table--blue :deep(.p-datatable-tbody > tr:nth-child(odd) > td) {
    /* background: #c0eeff; */
    background: #015674;
}

.po-detail-table--blue :deep(.p-datatable-tbody > tr:nth-child(even) > td) {
    /* background: #e8f4ff; */
    background: #3078b8;
}

.po-detail-table--invoice :deep(.p-rowgroup-header > td) {
    background: #e8f0f8;
    border-color: #c9d9e7;
}

.po-invoice-group-head {
    display: grid;
    gap: 0.35rem;
}

.po-invoice-group-head__title {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    font-weight: 700;
    color: #82b6ff;
}

.po-invoice-group-head__name-btn {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 700;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.po-invoice-group-head__name-btn:hover {
    color: #0f4f88;
}

.po-invoice-group-head__meta {
    font-size: 0.82rem;
    color: #46627b;
    font-weight: 600;
}

.po-invoice-group-head__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    color: #aad4f9;
    font-size: 0.82rem;
    grid-column: span 7 / span 7;
}

:deep(.po-detail-dialog .p-dialog-content) {
    background: linear-gradient(180deg, #f7fbff 0%, #eef5fd 100%);
}

.po-table-header {
    gap: 0.8rem;
}

.po-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
}

.po-action-btn {
    border-radius: 10px;
    font-weight: 700;
    min-height: 2.1rem;
    padding: 0.35rem 0.75rem;
}

.po-action-btn--primary {
    border: 1px solid #1f8c56 !important;
    background: #44c783 !important;
    color: #ffffff !important;
}

.po-action-btn--primary:hover {
    filter: brightness(0.96) !important;
    box-shadow: 0 3px 8px rgba(33, 128, 76, 0.22) !important;
}

.po-action-btn--secondary {
    border: 1px solid #91a8bf !important;
    background: #ebf2f8 !important;
    color: #1b3b59 !important;
}

.po-action-btn--secondary:hover {
    border-color: #7193b5 !important;
    background: #dfeeff !important;
}

.po-action-btn--danger {
    border: 1px solid #b42318 !important;
    background: #ffb3a8 !important;
    color: #7a0e0c !important;
}

.po-action-btn--danger:hover {
    border-color: #7a0e0c !important;
    background: #ff8c7f !important;
    box-shadow: 0 3px 8px rgba(180, 35, 24, 0.2) !important;
}

.po-action-btn--inbound {
    border: 1px solid var(--po-yellow-border) !important;
    background: #ffe79a !important;
    color: var(--po-yellow-text) !important;
}

.po-action-btn--inbound:hover {
    border-color: #c89a10 !important;
    background: #ffd95d !important;
    box-shadow: 0 3px 8px rgba(201, 154, 16, 0.18) !important;
}

.po-action-btn--receive {
    border: 1px solid #3f91c6 !important;
    background:#c2e9ff !important;
    color: #0b4f79 !important;
}

.po-action-btn--receive:hover {
    border-color: #2d7dae !important;
    background: #aee0ff !important;
    box-shadow: 0 3px 8px rgba(37, 126, 178, 0.2) !important;
}

.po-action-btn--recipe {
    border: 1px solid #6dbf8f !important;
    background: #dff2e7 !important;
    color: #155738 !important;
}

.po-action-btn--recipe:hover {
    border-color: #52a878 !important;
    background: #cfead9 !important;
}

:deep(.po-create-dialog .p-dialog-content) {
    background: #eef5fd;
}

.po-create-layout {
    display: grid;
    gap: 0.9rem;
}

.po-create-layout > .field {
    margin-bottom: 0;
}

.po-create-section-title {
    margin: 0;
    color: #1d3f5e;
    letter-spacing: 0.01em;
}

.po-create-dialog .caseCard {
    border: 1px solid #c7d8e8;
    border-radius: 14px;
    padding: 0.85rem 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
    box-shadow: 0 4px 14px rgba(15, 46, 79, 0.08);
    margin-bottom: 0.75rem;
}

.po-create-dialog .block-div {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.7rem 0.9rem;
}

.po-create-dialog .field label {
    font-weight: 700;
    color: #2a4761;
    margin-bottom: 0.3rem;
}

.po-create-dialog .p-datatable {
    border-radius: 10px;
    overflow: hidden;
}

.po-create-dialog .p-dialog-footer {
    border-top: 1px solid #d4e1ee;
    background: #f4f8fc;
}

.po-create-add-btn {
    width: max-content;
    justify-self: end;
}

:deep(.po-edit-dialog .p-dialog-content) {
    background: linear-gradient(180deg, #f7fbff 0%, #eef5fd 100%);
}

.po-invoice-edit-layout {
    display: grid;
    gap: 0.9rem;
}

.po-invoice-edit-section {
    padding: 0.85rem 1rem;
}

.po-invoice-edit-dialog .field {
    margin-bottom: 0.75rem;
}

.po-invoice-edit-dialog .field:last-child {
    margin-bottom: 0;
}

.po-invoice-edit-dialog .field label {
    font-weight: 700;
    color: #6dbafe;
    margin-bottom: 0.3rem;
}

.po-invoice-edit-checkbox {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding-top: 0.25rem;
}

.po-invoice-edit-checkbox label {
    margin: 0;
    font-weight: 700;
    color: #6dbafe;
}

.po-edit-layout {
    display: grid;
    gap: 0.9rem;
}

.po-lock-message {
    margin-bottom: 0.85rem;
}

.po-edit-dialog--readonly .po-edit-layout {
    pointer-events: none;
    opacity: 0.72;
}

.po-edit-layout > .field {
    margin-bottom: 0;
}

.po-edit-section-card {
    border: 1px solid #c7d8e8;
    border-radius: 14px;
    padding: 0.85rem 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
    box-shadow: 0 4px 14px rgba(15, 46, 79, 0.08);
}

.po-edit-section-title {
    margin: 0;
    color: #1d3f5e;
    letter-spacing: 0.01em;
}

.po-edit-data-table {
    border: 1px solid #d4e1ee;
    border-radius: 10px;
    overflow: hidden;
}

.po-edit-dialog .field label {
    font-weight: 700;
    color: #2a4761;
}

.po-edit-add-btn {
    width: max-content;
    justify-self: end;
}

.po-edit-dialog .p-dialog-footer {
    border-top: 1px solid #d4e1ee;
}

.po-edit-footer-wrap {
    width: 100%;
    padding-top: 0.5rem;
}

.po-edit-footer-actions {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 180px;
}

.po-autosave-banner {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    min-height: 22px;
    margin-top: 0.35rem;
    visibility: hidden;
}

.po-autosave-banner.is-visible {
    visibility: visible;
}

.po-autosave-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: #36506a;
}

.po-autosave-check {
    color: #1f8c56;
    font-size: 1rem;
}

/* ── Edit Dialog Save/Loading Overlay ────────────────────────────── */

.po-edit-saving-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 12px;
}

.po-edit-saving-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
}

.po-edit-saving-label {
    font-weight: 600;
    color: #1d3f5e;
    font-size: 1rem;
    letter-spacing: 0.01em;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
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
    color: #000000 !important;
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

.po-progress-pill {
    min-width: 220px;
    display: inline-flex;
    flex-direction: column;
    gap: 0.32rem;
}

.po-progress-track {
    position: relative;
    height: 14px;
    border-radius: 999px;
    overflow: hidden;
    background: #e6edf4;
    border: 1px solid #c7d5e4;
}

.po-progress-segment {
    position: absolute;
    top: 0;
    bottom: 0;
    transition: width var(--po-transition-medium), left var(--po-transition-medium);
}

.po-progress-segment--delivered {
    background: linear-gradient(180deg, #3ac879 0%, #239b59 100%);
}

.po-progress-segment--inbound {
    background:
        repeating-linear-gradient(
            -45deg,
            #ffd86b 0 8px,
            #fff4bf 8px 16px
        );
}

.po-progress-segment--ordered {
    background: #2f6bf9;
}

.po-progress-segment--backordered {
    background: #ffd86b;
}

.po-progress-segment--flagged {
    background: #8a0000;
}

.po-progress-segment--other {
    background: linear-gradient(180deg, #8ea3b8 0%, #6f859b 100%);
}

.po-progress-meta {
    font-size: 0.72rem;
    font-weight: 700;
    color: #2d4d6c;
    letter-spacing: 0.01em;
}

.po-status-pill {
    position: relative;
    width: 190px;
    min-height: var(--po-pill-height);
    border-radius: var(--po-pill-radius);
    border: 1px solid var(--po-blue-border);
    background: linear-gradient(180deg, #edf5ff 0%, #e3effd 100%);
    overflow: hidden;
    isolation: isolate;
    z-index: 0;
}

.po-status-pill-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, #9fc6ef 0%, #7caee2 100%);
    transition: width var(--po-transition-medium);
    z-index: 0;
}

.po-status-pill-text {
    position: relative;
    z-index: 1;
    height: 100%;
    min-height: var(--po-pill-height);
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem 0.75rem;
    font-size: var(--po-pill-font-size);
    font-weight: var(--po-pill-font-weight);
    color: var(--po-blue-text);
    white-space: nowrap;
    z-index: 1;
}

:deep(.card .p-datatable-scrollable-header) {
    position: relative;
    z-index: 6;
}

:deep(.card .p-datatable-scrollable-header-box) {
    background: #f3f7fb;
}

:deep(.card .p-datatable-scrollable-body) {
    position: relative;
    z-index: 1;
}

.po-status-pill.status-draft {
    border-color: var(--po-blue-border);
}

.po-status-pill.status-submitted,
.po-status-pill.status-ordered {
    border-color: #6a9fd6;
}

.po-status-pill.status-inbound,
.po-status-pill.status-partially-delivered {
    border-color: var(--po-yellow-border);
    background: linear-gradient(180deg, #fff9de 0%, #fff5cb 100%);
}

.po-status-pill.status-inbound .po-status-pill-fill,
.po-status-pill.status-partially-delivered .po-status-pill-fill {
    background: linear-gradient(90deg, #ffe8a2 0%, #ffd86b 100%);
}

.po-status-pill.status-inbound .po-status-pill-text,
.po-status-pill.status-partially-delivered .po-status-pill-text {
    color: var(--po-yellow-text);
}

.po-status-pill.status-delivered .po-status-pill-fill {
    background: linear-gradient(90deg, var(--po-green-soft) 0%, var(--po-green-strong) 100%);
}

.po-status-pill.status-delivered {
    border-color: var(--po-green-border);
    background: linear-gradient(180deg, #effcf5 0%, #e0f7eb 100%);
}

.po-status-pill.status-delivered .po-status-pill-text {
    color: var(--po-green-text);
}

.po-status-pill.status-canceled .po-status-pill-fill {
    background: linear-gradient(90deg, #c8d0d8 0%, #acb6c0 100%);
}

.po-status-pill.status-canceled {
    border-color: var(--po-gray-border);
    background: linear-gradient(180deg, #f0f3f6 0%, #e8edf1 100%);
}

.po-status-pill.status-canceled .po-status-pill-text {
    color: var(--po-gray-text);
}

.po-phase-rail {
    min-width: 230px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35rem;
}

.po-phase-step {
    appearance: none;
    border: 1px solid var(--po-blue-border);
    border-radius: var(--po-pill-radius);
    background: linear-gradient(180deg, var(--po-blue-soft) 0%, #d2e7ff 100%);
    color: var(--po-blue-text);
    font-size: var(--po-pill-font-size);
    font-weight: var(--po-pill-font-weight);
    line-height: 1;
    min-height: var(--po-pill-height);
    padding: 0.35rem 0.3rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 0.2rem;
    transition: all var(--po-transition-fast);
}

.po-phase-step:disabled {
    cursor: not-allowed;
    opacity: 0.9;
}

.po-phase-step.is-complete {
    background: linear-gradient(180deg, var(--po-gray-soft) 0%, var(--po-gray-strong) 100%);
    border-color: var(--po-gray-border);
    color: var(--po-gray-text);
}

.po-phase-step.is-current,
.po-phase-step.is-partial {
    background: linear-gradient(180deg, var(--po-yellow-soft) 0%, var(--po-yellow-strong) 100%);
    border-color: var(--po-yellow-border);
    color: var(--po-yellow-text);
    box-shadow: inset 0 0 0 1px rgba(190, 144, 15, 0.4);
}

.po-phase-step.is-next {
    cursor: pointer;
    background: linear-gradient(180deg, var(--po-blue-soft) 0%, var(--po-blue-strong) 100%);
    border-color: var(--po-blue-border);
    color: var(--po-blue-text);
}

.po-phase-step.is-next:hover {
    transform: translateY(-1px);
    background: linear-gradient(180deg, #d2e9ff 0%, #a8d3ff 100%);
    border-color: #5f95cf;
    box-shadow: 0 3px 8px rgba(35, 91, 154, 0.16);
}

.po-phase-step.is-delivered {
    background: linear-gradient(180deg, var(--po-green-soft) 0%, var(--po-green-strong) 100%);
    border-color: var(--po-green-border);
    color: var(--po-green-text);
    box-shadow: inset 0 0 0 1px rgba(10, 63, 35, 0.22);
}

:deep(.po-main-table .p-datatable-wrapper) {
    overflow-x: auto;
}

:deep(.po-main-table .p-datatable-table) {
    min-width: 1600px;
}

@media (max-width: 768px) {
    .po-master-detail {
        grid-template-columns: 1fr;
    }

    .po-workspace-panel {
        position: static;
        max-height: none;
    }

    .card {
        border-radius: 12px;
    }

    .po-toolbar-filters {
        align-items: stretch;
    }

    .po-toolbar-filter,
    .po-toolbar-filter--search {
        min-width: 100%;
    }

    .po-view-toggle {
        margin-left: 0;
        width: 100%;
    }

    .po-view-toggle-btn {
        flex: 1;
    }

    .po-card-grid {
        grid-template-columns: 1fr;
    }

    .po-card-grid-header {
        flex-direction: column;
        align-items: stretch;
    }

    .po-card-metrics,
    .po-card-actions {
        grid-template-columns: 1fr;
    }

    .po-detail-grid {
        grid-template-columns: 1fr;
    }

    .po-header-actions {
        width: 100%;
        justify-content: space-between;
    }

    :deep(.card .p-toolbar) {
        padding: 0.75rem;
    }

    :deep(.card .p-datatable .p-datatable-header) {
        padding: 0.7rem;
    }
}

:deep(.p-datatable-tbody > tr:nth-child(odd) td.inbound-fba-prep) {
    background-color: #e0f2fe; /* Light blue striping tint */
}

:deep(.p-datatable-tbody > tr:nth-child(even) td.inbound-fba-prep) {
    background-color: #f1f5f9; /* Change this hex to match your global table striping */
}

:deep(tr:nth-child(even) td.inbound-fbm) {
  background-color: #f1f5f9; /* Light gray */
}
:deep(tr:nth-child(odd) td.inbound-fbm) {
  background-color: #e0f2fe; /* Light blue */
}

:deep(tr:nth-child(even) td.inbound-store) {
  background-color: #f1f5f9; /* Light gray */
}
:deep(tr:nth-child(odd) td.inbound-store) {
  background-color: #e0f2fe; /* Light blue */
}

</style>
