<!-- Modules/Product/resources/js/pages/ProductForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";

const form = ref({
  category_id: null as number | null,
  brand_id: null as number | null,
});

// Untuk edit form — pass object yang sudah ada
const existingCategory = ref({
  id: 3,
  name: "Elektronik",
});
</script>

<template>
  <div class="space-y-4">
    <!-- Basic usage -->
    <ServerComboBox
      v-model="form.category_id"
      url="/api/categories"
      placeholder="Pilih kategori"
    />

    <!-- Edit form dengan initial option -->
    <ServerComboBox
      v-model="form.category_id"
      url="/api/categories"
      :initial-option="existingCategory"
      placeholder="Pilih kategori"
    />

    <!-- Custom params (filter by active only) -->
    <ServerComboBox
      v-model="form.brand_id"
      url="/api/brands"
      :params="{ is_active: true }"
      placeholder="Pilih brand"
    />

    <!-- Custom option slot (tampil kode + nama) -->
    <ServerComboBox
      v-model="form.category_id"
      url="/api/categories"
      value-key="id"
      label-key="name"
    >
      <template #option="{ option }">
        <Check class="mr-2 h-4 w-4" />
        <span class="font-mono text-xs text-muted-foreground mr-2">
          {{ option.code }}
        </span>
        {{ option.name }}
      </template>
    </ServerComboBox>
  </div>
</template>
