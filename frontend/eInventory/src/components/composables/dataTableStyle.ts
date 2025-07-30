import { computed, type Ref } from 'vue';
export function useDataTableStyle(zoomRef: Ref<number>) {
  return computed(() => ({
    fontSize: (15 * zoomRef.value) + 'px',
    zoom: zoomRef.value,
    width: '100%'
  }));
}