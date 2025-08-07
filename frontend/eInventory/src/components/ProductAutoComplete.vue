<template >
    <div>
        <AutoComplete 
            v-model="productKey" 
            :suggestions="filteredProducts" 
            :dropdown="true"
            @complete="(event: any) => searchProducts(event)"
            :virtualScrollerOptions="{ itemSize: 38 }"
            :optionLabel="'name'"
            :forceSelection="false"
        >
            <template #content="slotProps">
                <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku }}</div>
            </template>
            <template #option="slotProps">
                <div v-if="props.displayValue === 1" class="flex align-items-center">
                    <div>{{ slotProps.option.name }} - {{ slotProps.option.fnsku }}</div>
                </div>
                <div v-if="displayValue === 2" class="flex align-items-center">
                    <div>{{ slotProps.option.name }} - {{ slotProps.option.item_num }}</div>
                </div>
            </template>
        </AutoComplete>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
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
const dbProducts = await action.getAutoCompleteProductKeys(displayValue, vendor_id.value);
let filteredProducts = dbProducts;


watch(() => props.modelValue, (val) => {
  productKey.value = val;
});

onMounted(() => {
    initVariables();
});

async function initVariables(){

};

function searchProducts(event: any){
    console.log("Event: ", event);
    console.log("Products: ", dbProducts);
    const query = event.query ? event.query.toLowerCase() : '';
    const allProducts = dbProducts;
    filteredProducts = allProducts.filter((product: any) =>
        product.name && product.name.toLowerCase().includes(query)
    ); 
    
};

function onProductSelection(productObj: any){
    console.log("PRODUCT OBJ", productObj);

    let prodId = productObj.product_id;

    /* if(typeof productObj === 'object' && productObj !== null && 'product_id' in productObj){
        if(displayValue === 'processed')
            eCase.productObj = { name: productObj.name + ' - ' + productObj.fnsku, value: productObj.product_id};
        else if(displayValue === 'unprocessed')
            eCase.productObj = { name: productObj.name + ' - ' + productObj.item_num, value: productObj.product_id};

        eCase.product_id = productObj.product_id;
    }

    for (let idx = 0; idx < products.length; idx++) {
        if (products[idx].product_id == prodId) {
            console.log("PRODUCT NAME: ", products[idx].name);
            eCase.units_per_case = products[idx].default_units_per_case;
        }
    } */
};
</script>