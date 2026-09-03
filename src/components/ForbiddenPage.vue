<script setup lang="ts">
import { useLoadingStore } from '@/core/stores/loading.store';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router'
import { Button } from './ui/button';

const route = useRoute()
const reason = route.query.reason // 'module' | 'permission'
const loadingStore = useLoadingStore();
onMounted(() => {
  loadingStore.hide();
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4">
    <h1 class="text-2xl font-semibold">Akses Ditolak</h1>

    <p v-if="reason === 'module'" class="text-muted-foreground">
      Fitur ini tidak tersedia pada paket langganan kamu.
    </p>
    <p v-else class="text-muted-foreground">
      Kamu tidak memiliki izin untuk mengakses halaman ini.
    </p>

    <Button as-child>
      <RouterLink :to="{ name: 'dashboard' }">Kembali ke Dashboard</RouterLink>
    </Button>
  </div>
</template>