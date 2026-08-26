<template>
    <Dialog v-model:visible="isVisible" :style="{width: '500px'}" header="Cancel Product" :modal="true">
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
            <Button label="Close" icon="pi pi-times" text severity="danger" @click="handleClose"/>
            <Button label="Confirm Cancel" icon="pi pi-check" severity="danger" @click="handleConfirm" :disabled="!rawProductCancelAmount || rawProductCancelAmount <= 0 || isRawCancelOverMax()" :loading="props.loading" />
        </template>
    </Dialog>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

type RawProductCancelRequest = {
    productToCancel: any;
    amount: number;
    option: 'boxes' | 'units';
};

const props = defineProps<{
    visible: boolean;
    loading: boolean;
    productToCancel: any;
    purchaseOrderName: string;
}>();

const emit = defineEmits<{
    'update:visible': [visible: boolean];
    confirm: [request: RawProductCancelRequest];
    close: []; //Changed the normal term of 'cancel' to 'close' in this component to make this less confusing
}>();

const isVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const rawProductToCancel = ref({ ...props.productToCancel });

const rawProductCancelOption = ref<'boxes' | 'units'>('boxes');

const rawProductCancelAmount = ref(0);

watch (
    () => props.productToCancel,
    (productToCancel) => {
        rawProductToCancel.value = { ...productToCancel };
        rawProductCancelAmount.value = 0;
        rawProductCancelOption.value = 'boxes';
    }
);

function handleConfirm(){
    if(!rawProductCancelAmount.value || rawProductCancelAmount.value <= 0 || isRawCancelOverMax()){
        return;
    }

    emit('confirm', {
        productToCancel: { ...rawProductToCancel.value},
        amount: rawProductCancelAmount.value,
        option: rawProductCancelOption.value
    });
    emit('update:visible', false);
};

function handleClose() {
    rawProductCancelOption.value = 'boxes';
    rawProductCancelAmount.value = 0;

    emit('close');
    emit('update:visible', false);
};

function getRawCancelMax(){
    const target = rawProductToCancel.value;
    if (!target) return 0;

    if (rawProductCancelOption.value === 'boxes') {
        return Number(target.amount || 0);
    }

    return Number(target.amount || 0) * Number(target.units_per_case || 0);
};

function isRawCancelOverMax(){
    const amount = Number(rawProductCancelAmount.value || 0);
    const max = getRawCancelMax();
    return amount > 0 && max > 0 && amount > max;
};

function getRawCancelValidationMessage(){
    if (isRawCancelOverMax()) return '';

    const amount = Number(rawProductCancelAmount.value || 0);
    const max = getRawCancelMax();
    const unitLabel = rawProductCancelOption.value === 'boxes' ? 'box(es)' : 'unit(s)';
    return `Entered amount (${amount}) exceeds max allowed (${max} ${unitLabel}).`;
};

function onRawProductCancelAmountInput(event: any){
    const nextValue = Number(event?.value ?? 0);
    rawProductCancelAmount.value = Number.isFinite(nextValue) ? nextValue : 0;
};

function getRawCancelPreview(){
    const target = rawProductToCancel.value;
    const amount = Number(rawProductCancelAmount.value || 0);
    if (!target || amount <= 0) return '';

    const poLabel = props.purchaseOrderName || `#${target.purchase_order_id ?? 'N/A'}`;

    if (rawProductCancelOption.value === 'boxes') {
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
};

</script>
<style>
    
</style>