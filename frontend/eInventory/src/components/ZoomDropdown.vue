<template>
  <Dropdown
    v-model="localZoom"
    :options="options"
    optionLabel="header"
    optionValue="value"
    class="w-14rem"
    @change="emitZoom"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: number,
  options?: Array<{ value: number, header: string }>
}>();

const emit = defineEmits(['update:modelValue']);

const localZoom = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  localZoom.value = val;
});

const defaultOptions = [
  { value: 1, header: '100%' },
  { value: 0.75, header: '75%' },
  { value: 0.5, header: '50%' },
  { value: 0.25, header: '25%' },
];

const options = props.options ?? defaultOptions;

function emitZoom() {
  emit('update:modelValue', localZoom.value);
}
</script>