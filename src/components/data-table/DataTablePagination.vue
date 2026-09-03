<script setup lang="ts" generic="T">
import type { Table } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

defineProps<{ table: Table<T>; total: number }>();
</script>

<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between px-2 gap-5"
  >
    <div class="flex items-center gap-6 justify-between w-full">
      <div class="text-sm text-muted-foreground">Total {{ total }} data</div>
      <div class="flex items-center gap-2 self-end">
        <p class="text-sm">Baris per halaman</p>
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="(v) => table.setPageSize(Number(v))"
        >
          <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="size in [10, 15, 25, 50, 100]"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div
      class="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto"
    >
      <div class="text-sm text-nowrap">
        Halaman {{ table.getState().pagination.pageIndex + 1 }} dari
        {{ table.getPageCount() }}
      </div>
      <div class="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                :disabled="!table.getCanPreviousPage()"
                @click="table.setPageIndex(0)"
                >«</Button
              >
            </TooltipTrigger>
            <TooltipContent>
              <p>Halaman Pertama</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                :disabled="!table.getCanPreviousPage()"
                @click="table.previousPage()"
                >‹</Button
              >
            </TooltipTrigger>
            <TooltipContent>
              <p>Halaman Sebelumnya</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                :disabled="!table.getCanNextPage()"
                @click="table.nextPage()"
                >›</Button
              >
            </TooltipTrigger>
            <TooltipContent>
              <p>Halaman Selanjutnya</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                :disabled="!table.getCanNextPage()"
                @click="table.setPageIndex(table.getPageCount() - 1)"
                >»</Button
              >
            </TooltipTrigger>
            <TooltipContent>
              <p>Halaman Terkahir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>
