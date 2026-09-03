<script setup lang="ts" generic="T">
import { computed } from "vue";
import { RefreshCw, Search, SlidersHorizontal } from "@lucide/vue";
import type { Table } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DataTableViewOptions from "./DataTableViewOptions.vue";
import DataTableFilterChips from "./DataTableFilterChips.vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types.ts";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const search = defineModel<string>("search", { default: "" });

const props = defineProps<{
  table: Table<T>;
  filters?: DataTableFilterDef[];
  onClearFilter: (id: string) => void;
  onClearAll: () => void;
  refresh: () => void;
  loading: boolean
}>();

const activeFilterCount = computed(
  () =>
    props.filters?.filter(
      (f) =>
        f.value.value !== undefined &&
        f.value.value !== null &&
        f.value.value !== "",
    ).length ?? 0,
);
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex flex-1 flex-wrap items-center gap-2">
        <InputGroup class="h-8 w-[200px] lg:w-[280px]">
          <InputGroupInput v-model="search" placeholder="Search..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon
            align="inline-end"
            v-if="search.length"
            @click="search = ''"
          >
            <Button size="sm" variant="secondary">x</Button>
          </InputGroupAddon>
        </InputGroup>

        <!-- Filter inline: layar md ke atas -->
        <div class="hidden flex-wrap items-center gap-2 md:flex">
          <slot name="filters" />
        </div>

        <!-- Filter dalam Sheet: layar kecil -->
        <Sheet>
          <SheetTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 md:hidden">
              <SlidersHorizontal class="mr-2 h-4 w-4" />
              Filter
              <Badge
                v-if="activeFilterCount > 0"
                variant="secondary"
                class="ml-2 px-1.5"
              >
                {{ activeFilterCount }}
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" class="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
            </SheetHeader>
            <div class="flex flex-col gap-3 w-full p-4">
              <slot name="filters" />
            </div>
            <SheetFooter>
              <Button
                variant="ghost"
                size="sm"
                class="w-full"
                @click="onClearAll"
              >
                Reset Semua Filter
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" @click="refresh" :disabled="loading"><RefreshCw :class="loading ? 'animate-spin' : ''" /> </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh Table</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DataTableViewOptions :table="table" />
    </div>

    <DataTableFilterChips
      :filters="filters ?? []"
      :search="search"
      @clear="onClearFilter"
      @clear-search="search = ''"
      @clear-all="onClearAll"
    />
  </div>
</template>
