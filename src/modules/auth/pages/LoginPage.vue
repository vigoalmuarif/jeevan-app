<script lang="ts">
export const description = "A login page with form and image.";
</script>

<script setup lang="ts">
import LoginForm from "@/components/auth/LoginForm.vue";
</script>

<template>
  <div class="w-full max-w-sm md:max-w-4xl">
    <LoginForm />
  </div>
</template>
