<script setup lang="ts" generic="T">
import { FlexRender, type Table as TanStackTable } from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { computed } from "vue";

const props = defineProps<{
  table: TanStackTable<T>;
  loading?: boolean;
  emptyText?: string;
}>();

const visibleColumnCount = computed(
  () => props.table.getVisibleLeafColumns().length
)

</script>

<template>
  <div class="w-full min-w-0 overflow-hidden rounded-md border">
    <Table class="min-w-max">
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="bg-muted/80 dark:bg-muted/60"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-xs font-light">
            <Badge v-if="!header.isPlaceholder" class="font-medium bg-gray-200/60 text-secondary-700 dark:bg-gray-50/10 dark:text-secondary-800 rounded-sm">
              <FlexRender
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </Badge>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="i in table.getState().pagination.pageSize" :key="i">
            <TableCell v-for="n in visibleColumnCount" :key="n">
              <div class="h-4.5 w-full animate-pulse rounded-xl bg-muted" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else-if="table.getRowModel().rows.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
            class="hover:bg-muted/70"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="text-xs font-light">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-else>
          <TableCell
            :colspan="table.getAllColumns().length"
            class="h-24 text-center"
          >
            {{ emptyText ?? "Tidak ada data." }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
