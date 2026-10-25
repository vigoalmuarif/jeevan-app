<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronsUpDown } from "@lucide/vue";
import type { Column } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";

const props = defineProps<{ column: Column<any, unknown>; title: string }>();
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="-ml-3 h-4 p-0 m-0 hover:bg-transparent focus:bg-transparent focus:ring-0 text-xs font-medium"
    @click="column.toggleSorting(column.getIsSorted() === 'asc')"
  >
    <span>{{ title }}</span>
    <ArrowDown v-if="column.getIsSorted() === 'desc'" class="ml-2 h-3.5 w-3.5" />
    <ArrowUp v-else-if="column.getIsSorted() === 'asc'" class="ml-2 h-3.5 w-3.5" />
    <ChevronsUpDown v-else class="ml-2 h-3.5 w-3.5 opacity-50" />
  </Button>
</template>
