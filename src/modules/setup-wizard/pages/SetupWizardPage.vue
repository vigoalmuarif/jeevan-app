<script lang="ts">
export const description = "A Setup Wizard page with form and image.";
</script>

<script setup lang="ts">
import SetupWizardForm from '@/components/auth/SetupWizardForm.vue';

</script>

<template>
  <div class="w-full max-w-sm md:max-w-4xl">
    <SetupWizardForm />
  </div>
</template>
