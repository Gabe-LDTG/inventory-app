<template>
    <Dialog
        v-model:visible="isVisible"
        :style="{ width: '450px' }"
        header="Vendor Select"
        :modal="true"
        class="vendor-select-dialog"
        @hide="handleDialogHide"
    >
        <div class="field vendor-select-content">
            <p class="vendor-select-subtitle">
                Choose the vendor for this purchase order.
            </p>

            <AutoComplete
                v-model="selectedVendor"
                :suggestions="filteredVendors"
                @complete="searchVendors"
                @item-select="onVendorAutoCompleteSelect($event.value)"
                @focus="searchVendors({ query: '' })"
                :dropdown="true"
                :showOnFocus="true"
                optionLabel="vendor_name"
                placeholder="Select or enter a vendor"
                class="vendor-select-autocomplete"
                :class="{ 'p-invalid': submitted && !selectedVendor }"
                :forceSelection="false"
            />

            <small
                v-if="submitted && !selectedVendor"
                class="p-error"
            >
                Vendor is required.
            </small>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="handleCancel"
            />

            <Button
                label="Select"
                icon="pi pi-check"
                text
                @click="handleSelect"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
// `script setup` exposes these variables and functions directly to the template.
// It is the Composition API form that replaces `data`, `computed`, `watch`, and
// `methods` sections from an Options API component.
import { computed, ref, watch } from 'vue';

// Keep the component's contract small: the dialog only needs enough vendor data
// to display a label, identify the selected vendor, and preserve the nickname
// needed by the parent purchase-order workflow.
type Vendor = {
    vendor_id: number;
    vendor_name: string;
    vendor_nickname?: string | null;
};

// Props are read-only values supplied by the parent component.
// `visible` controls whether the dialog is open, while `vendors` is the source
// list used by the autocomplete search.
const props = withDefaults(
    defineProps<{
        visible: boolean;
        vendors: Vendor[];
    }>(),
    {
        visible: false,
        vendors: () => [],
    },
);

// Events are the component's way to communicate changes or user decisions back
// to the parent. The child does not create the purchase order itself.
const emit = defineEmits<{
    'update:visible': [visible: boolean];
    select: [vendor: Vendor];
    cancel: [];
}>();

// These refs hold state that belongs only to this dialog instance.
// They replace fields that would normally live inside an Options API `data()`
// object, and `.value` is used in the script when reading or changing them.
const submitted = ref(false);
const selectedVendor = ref<Vendor | null>(null);
const filteredVendors = ref<Vendor[]>([]);

// PrimeVue can emit `hide` after the Select button closes the dialog. This flag
// distinguishes that normal selection close from a real Cancel or outside close,
// preventing the parent from receiving both `select` and `cancel`.
const isSelecting = ref(false);

// A computed with a getter and setter adapts the parent's `v-model:visible`
// contract to a local template value. Reading it gets the prop; assigning it
// emits `update:visible` so the parent remains the source of truth.
const isVisible = computed({
    get: () => props.visible,
    set: (visible: boolean) => {
        emit('update:visible', visible);
    },
});

// Reset transient dialog state whenever the parent opens the dialog. This keeps
// an earlier vendor choice or validation message from appearing on the next use.
watch(
    () => props.visible,
    (visible) => {
        if (!visible) return;

        submitted.value = false;
        selectedVendor.value = null;
        filteredVendors.value = [...props.vendors];
        isSelecting.value = false;
    },
);

// Keep the local suggestions synchronized if the parent loads or refreshes its
// vendor list while the dialog is open. Do not overwrite an active search after
// validation has started.
watch(
    () => props.vendors,
    (vendors) => {
        if (!submitted.value) {
            filteredVendors.value = [...vendors];
        }
    },
    { deep: true },
);

// PrimeVue calls this when the user types or opens the autocomplete dropdown.
// Filtering stays local to the dialog; the parent only supplies the full list.
function searchVendors(event: { query?: string }) {
    const query = String(event?.query || '').toLowerCase().trim();

    filteredVendors.value = props.vendors.filter((vendor) =>
        String(vendor.vendor_name || '')
            .toLowerCase()
            .includes(query),
    );
}

// Store the complete selected vendor object so the parent receives the nickname
// and any other vendor fields along with the ID.
function onVendorAutoCompleteSelect(vendor: Vendor) {
    if (!vendor?.vendor_id) return;

    selectedVendor.value = vendor;
}

// Validate the local selection, then send the valid vendor to the parent.
// The parent handles the next application-level step: creating the PO draft.
function handleSelect() {
    submitted.value = true;

    if (!selectedVendor.value?.vendor_id) {
        return;
    }

    isSelecting.value = true;
    emit('select', selectedVendor.value);
    emit('update:visible', false);
}

// Cancel clears only this dialog's transient state and tells the parent to
// perform any parent-owned cleanup, such as clearing its draft object.
function handleCancel() {
    submitted.value = false;
    selectedVendor.value = null;
    isSelecting.value = false;

    emit('cancel');
    emit('update:visible', false);
}

// Treat a PrimeVue hide event as cancellation unless the dialog was already
// closed by a successful Select action. This also covers closing via the X,
// Escape key, or another built-in Dialog close path.
function handleDialogHide() {
    if (isSelecting.value) {
        isSelecting.value = false;
        return;
    }

    handleCancel();
}
</script>

<style>
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

.vendor-select-autocomplete .p-inputtext {
    text-align: center;
}

.vendor-select-dialog .p-dialog-content {
    padding-top: 0.75rem;
}
</style>