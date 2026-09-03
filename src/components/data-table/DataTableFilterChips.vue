<script setup lang="ts">
import { computed } from "vue";
import { X } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataTableFilterDef } from "@/core/types/data-table.types";

const props = defineProps<{
  filters: DataTableFilterDef[];
  search?: string;
}>();

const emit = defineEmits<{
  clear: [id: string];
  clearSearch: [];
  clearAll: [];
}>();

const activeChips = computed(() =>
  props.filters
    .filter(
      (f) =>
        f.value.value !== undefined &&
        f.value.value !== null &&
        f.value.value !== "",
    )
    .map((f) => ({
      id: f.id,
      text: `${f.label}: ${f.format ? f.format(f.value.value) : f.value.value}`,
    })),
);

const hasAnyActive = computed(
  () => activeChips.value.length > 0 || !!props.search,
);
</script>

<template>
  <div v-if="hasAnyActive" class="flex flex-wrap items-center gap-2">
    <Badge v-if="search" variant="secondary" class="gap-1 pr-1 font-normal">
      Pencarian: "{{ search }}"
      <button
        class="ml-1 rounded-full hover:bg-muted-foreground/20"
        @click="emit('clearSearch')"
      >
        <X class="h-3 w-3" />
      </button>
    </Badge>

    <Badge
      v-for="chip in activeChips"
      :key="chip.id"
      variant="secondary"
      class="gap-1 pr-1 font-normal"
    >
      {{ chip.text }}
      <button
        class="ml-1 rounded-full hover:bg-muted-foreground/20"
        @click="emit('clear', chip.id)"
      >
        <X class="h-3 w-3" />
      </button>
    </Badge>

    <Button
      variant="ghost"
      size="sm"
      class="h-6 px-2 text-xs text-muted-foreground"
      @click="emit('clearAll')"
    >
      Reset semua
    </Button>
  </div>
</template>
