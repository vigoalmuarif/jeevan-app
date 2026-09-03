<!-- pages/NotFoundPage.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from './ui/button';

const router = useRouter()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4">
    <p class="text-8xl font-bold text-muted-foreground/20">404</p>
    <h1 class="text-2xl font-semibold">Halaman Tidak Ditemukan</h1>
    <p class="text-muted-foreground">
      Halaman yang kamu cari tidak ada atau sudah dipindahkan.
    </p>
    <Button @click="router.push({ name: 'dashboard' })">
      Kembali ke Dashboard
    </Button>
  </div>
</template>