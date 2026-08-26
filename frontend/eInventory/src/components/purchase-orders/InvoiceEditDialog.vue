<template>
    <Dialog
            v-model:visible="isVisible"
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
                            v-model="editableDraft.invoice_name"
                            :class="{ 'p-invalid': submitted && !String(editableDraft.invoice_name || '').trim() }"
                            placeholder="Invoice name"
                        />
                        <small class="p-error" v-if="submitted && !String(editableDraft.invoice_name || '').trim()">
                            Invoice name is required.
                        </small>
                    </div>

                    <div class="field">
                        <label for="invoiceEditDateShipped">Date Shipped</label>
                        <input id="invoiceEditDateShipped" v-model="editableDraft.date_shipped" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditDateDue">Date Due</label>
                        <input id="invoiceEditDateDue" v-model="editableDraft.date_due" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditDatePaid">Date Paid</label>
                        <input id="invoiceEditDatePaid" v-model="editableDraft.date_paid" type="date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field">
                        <label for="invoiceEditNotes">Notes</label>
                        <textarea id="invoiceEditNotes" v-model="editableDraft.notes" rows="3" class="p-inputtext p-component w-full"></textarea>
                    </div>

                    <div class="po-invoice-edit-checkbox">
                        <input id="invoiceEditFiled" v-model="editableDraft.filed" type="checkbox" />
                        <label for="invoiceEditFiled">Filed</label>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    text
                    @click="handleCancel"
                    :disabled="isSaving"
                />
                <Button 
                    label="Save Invoice" 
                    icon="pi pi-check" 
                    class="po-action-btn po-action-btn--primary" 
                    @click="handleSave" 
                    :loading="isSaving" 
                />
            </template>
        </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type InvoiceEditDraft = {
    invoice_id: number | null;
    invoice_name: string;
    total_cost: number;
    purchase_order_id: number;
    date_shipped: string;
    date_due: string;
    date_paid: string;
    card: number;
    filed: boolean;
    notes: string;
};

const props = defineProps<{
    visible: boolean;
    draft: InvoiceEditDraft;
    saving: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [visible: boolean];
    save: [invoiceEdit: InvoiceEditDraft];
    cancel: [];
}>();

const submitted = ref(false);

const isSaving = ref(props.saving);

const editableDraft = ref<InvoiceEditDraft>({ ...props.draft });

// Makes sure that as soon as the parent prop updates, the local object is updated as well
watch(
    () => props.draft,
    (draft) => {
        editableDraft.value = { ...draft };
        submitted.value = false;
    },
    { immediate: true, deep: true },
);

// Checks for any changes in the saving prop from the parent
watch(
    () => props.saving,
    (saving) => {
        isSaving.value = saving;
    },
    { immediate: true },
);

const isVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

function handleCancel() {
    submitted.value = false;

    emit('cancel');
    emit('update:visible', false);
};

function handleSave(){
    submitted.value = true;
    isSaving.value = true;

    if (!String(editableDraft.value.invoice_name || '').trim()) {
        return;
    }

    console.log("Saving invoice edit draft:", editableDraft.value);

    emit('save', editableDraft.value);
};

</script>
<style>
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
</style>