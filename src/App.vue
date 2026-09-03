<template>
  <RouterView />
  <AppLoading />
  <Toaster theme="dark" position="top-right" richColors />
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import AppLoading from "./components/AppLoading.vue";
</script>
