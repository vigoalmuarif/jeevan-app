<script lang="ts">
export const description = "Layout for auth"
</script>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useLoadingStore } from '@/core/stores/loading.store';

const loadingStore = useLoadingStore()

onMounted(() => {
  loadingStore.hide()
})
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 w-full relative">
    <RouterView />
  </div>
</template>
