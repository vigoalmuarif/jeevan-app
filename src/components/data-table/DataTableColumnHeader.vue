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
    class="-ml-3 h-8"
    @click="column.toggleSorting(column.getIsSorted() === 'asc')"
  >
    <span>{{ title }}</span>
    <ArrowDown v-if="column.getIsSorted() === 'desc'" class="ml-2 h-4 w-4" />
    <ArrowUp v-else-if="column.getIsSorted() === 'asc'" class="ml-2 h-4 w-4" />
    <ChevronsUpDown v-else class="ml-2 h-4 w-4 opacity-50" />
  </Button>
</template>
