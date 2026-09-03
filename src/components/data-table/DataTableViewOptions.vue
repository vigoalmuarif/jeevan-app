<script setup lang="ts" generic="T">
import { computed } from "vue";
import { Settings2 } from "@lucide/vue";
import type { Table } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = defineProps<{ table: Table<T> }>();

const hideableColumns = computed(() =>
  props.table.getAllColumns().filter((column) => column.getCanHide()),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="ml-auto h-8">
        <Settings2 class="mr-2 h-4 w-4" />
        Kolom
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[180px]">
      <DropdownMenuLabel>Tampilkan Kolom</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in hideableColumns"
        :key="column.id"
        :model-value="column.getIsVisible()"
        @update:model-value="(value) => column.toggleVisibility(!!value)"
      >
        {{ column.columnDef.meta?.label ?? column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
