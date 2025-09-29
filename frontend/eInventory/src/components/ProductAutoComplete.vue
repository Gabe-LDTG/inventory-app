<template >
    <div>
        <AutoComplete 
            v-model="productKey" 
            :suggestions="filteredProducts" 
            :dropdown="true"
            @complete="(event: any) => searchProducts(event)"
            @item-select="onProductSelection"
            :virtualScrollerOptions="{ itemSize: 38 }"
            :optionLabel="'name'"
            :forceSelection="false"
            :loading="loading"
            placeholder="Search products..."
        >
            <template #content="slotProps">
                <div>{{ slotProps }} <!-- {{ slotProps.option.name }} - {{ getDisplayValue(slotProps.option) }} --></div>
            </template>
            <template #option="slotProps">
                <div v-if="props.displayValue === 1" class="flex align-items-center">
                    <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku || 'No FNSKU' }}</div>
                </div>
                <div v-if="props.displayValue === 2" class="flex align-items-center">
                    <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num || 'No Item #' }}</div>
                </div>
            </template>
        </AutoComplete>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import action from './utils/axiosUtils';

const props = defineProps<{
  modelValue: number,
  displayValue: number,
  vendor_id: number,
  options?: Array<{ value: number, header: string }>
}>();

const emit = defineEmits(['update:modelValue']);

const displayValue = props.displayValue || 2;
const productKey = ref(props.modelValue);
const vendor_id = ref(props.vendor_id);
const loading = ref(false);
const dbProducts = ref([] as any[]);
const filteredProducts = ref([] as any[]);

// Computed property to determine if we're showing processed or unprocessed products
const isProcessed = computed(() => props.displayValue === 1);

// Helper function to get display value based on product type
function getDisplayValue(product: any) {
    if (props.displayValue === 1) {
        return product.fnsku || 'No FNSKU';
    } else {
        return product.item_num || 'No Item #';
    }
}

// Load products when component mounts or when vendor_id changes
async function loadProducts() {
    if (!props.vendor_id) return;
    
    loading.value = true;
    try {
        const products = await action.getAutoCompleteProductKeys(props.displayValue, props.vendor_id);
        dbProducts.value = products || [];
        filteredProducts.value = products || [];
        console.log(`Loaded ${products?.length || 0} ${isProcessed.value ? 'processed' : 'unprocessed'} products for vendor ${props.vendor_id}`);
    } catch (error) {
        console.error('Error loading products:', error);
        dbProducts.value = [];
        filteredProducts.value = [];
    } finally {
        loading.value = false;
    }
}

watch(() => props.modelValue, (val) => {
    productKey.value = val;
});

watch(() => props.vendor_id, (newVendorId) => {
    if (newVendorId && newVendorId !== vendor_id.value) {
        vendor_id.value = newVendorId;
        loadProducts();
    }
});

watch(() => props.displayValue, (newDisplayValue) => {
    if (newDisplayValue !== displayValue) {
        loadProducts();
    }
});

onMounted(() => {
    if (props.vendor_id) {
        loadProducts();
    }
});

function searchProducts(event: any) {
    const query = event.query ? event.query.toLowerCase() : '';
    const allProducts = dbProducts.value;
    
    if (!allProducts || allProducts.length === 0) return;
    
    filteredProducts.value = allProducts.filter((product: any) =>
        product.name && product.name.toLowerCase().includes(query)
    );
}

function onProductSelection(event: any) {
    console.log("PRODUCT OBJ", event.value);
    // Emit the selected product
    emit('update:modelValue', event.value);
}
</script>