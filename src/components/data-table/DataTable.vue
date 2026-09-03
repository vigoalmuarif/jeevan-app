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

defineProps<{
  table: TanStackTable<T>;
  loading?: boolean;
  emptyText?: string;
}>();
</script>

<template>
  <div class="rounded-md border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="bg-muted hover:bg-muted"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="i in table.getState().pagination.pageSize" :key="i">
            <TableCell v-for="n in table.getAllColumns().length">
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
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
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
