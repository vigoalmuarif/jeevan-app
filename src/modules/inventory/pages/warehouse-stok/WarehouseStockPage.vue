<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Alert02Icon, WarehouseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import type { WarehouseStockFilterOptions } from '@/core/types/warehouse-stock.types'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { warehouseStockColumns } from '../../config/warehouse-stock-columns' 
import { warehouseStockService } from '../../services/warehouse-stock.service' 

const branchFilter = ref<string>()
const warehouseFilter = ref<string>()
const filterOptions = ref<WarehouseStockFilterOptions>({ branches: [], warehouses: [] })
const optionsLoading = ref(false)
const optionsFailed = ref(false)

const filters: DataTableFilterDef[] = [
  {
    id: 'branch_id',
    label: 'Cabang',
    value: branchFilter,
    format: value => filterOptions.value.branches.find(branch => String(branch.id) === value)?.name ?? value,
  },
  {
    id: 'warehouse_id',
    label: 'Gudang',
    value: warehouseFilter,
    format: value => filterOptions.value.warehouses.find(warehouse => String(warehouse.id) === value)?.name ?? value,
  },
]

const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/warehouse-stocks',
  columns: warehouseStockColumns,
  filters,
})

const visibleWarehouses = computed(() => filterOptions.value.warehouses.filter(
  warehouse => !branchFilter.value || String(warehouse.branch_id) === branchFilter.value,
))
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

watch(branchFilter, (branchId) => {
  if (warehouseFilter.value && !filterOptions.value.warehouses.some(warehouse =>
    String(warehouse.id) === warehouseFilter.value && (!branchId || String(warehouse.branch_id) === branchId),
  )) {
    warehouseFilter.value = undefined
  }
})

const refreshStocks = async () => {
  failedFetch.value = false
  await refetch()
}

const loadFilterOptions = async () => {
  optionsLoading.value = true
  optionsFailed.value = false
  try {
    filterOptions.value = await warehouseStockService.getFilterOptions()
  } catch (error) {
    optionsFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    optionsLoading.value = false
  }
}

onMounted(loadFilterOptions)
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="WarehouseIcon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Stok Produk</h1>
          <p class="text-sm text-muted-foreground">Lihat jumlah stok produk menurut cabang dan gudang.</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground" aria-live="polite">
        <span class="font-medium text-foreground">{{ formattedTotal }}</span> data stok
      </p>
    </header>

    <section aria-label="Daftar stok produk" class="flex flex-col gap-4">
      <DataTableToolbar
        v-model:search="search"
        :table="table"
        :filters="filters"
        :on-clear-filter="clearFilter"
        :on-clear-all="clearAllFilters"
        :refresh="refreshStocks"
        :loading="loading || optionsLoading"
      >
        <template #filters>
          <Select v-model="branchFilter" :disabled="optionsLoading || optionsFailed">
            <SelectTrigger class="h-8 w-[170px]" aria-label="Filter cabang">
              <SelectValue placeholder="Semua cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="branch in filterOptions.branches" :key="branch.id" :value="String(branch.id)">
                {{ branch.name }} ({{ branch.code }})
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="warehouseFilter" :disabled="optionsLoading || optionsFailed">
            <SelectTrigger class="h-8 w-[170px]" aria-label="Filter gudang">
              <SelectValue placeholder="Semua gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="warehouse in visibleWarehouses" :key="warehouse.id" :value="String(warehouse.id)">
                {{ warehouse.name }} ({{ warehouse.code }})
              </SelectItem>
            </SelectContent>
          </Select>
        </template>
      </DataTableToolbar>

      <Alert v-if="optionsFailed" variant="destructive">
        <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
        <AlertTitle>Filter cabang dan gudang gagal dimuat</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
          <span>Coba muat ulang pilihan filter.</span>
          <Button variant="outline" size="sm" @click="loadFilterOptions">Coba lagi</Button>
        </AlertDescription>
      </Alert>

      <Alert v-if="failedFetch" variant="destructive">
        <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
        <AlertTitle>Daftar stok gagal dimuat</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
          <span>Periksa koneksi lalu coba muat ulang data.</span>
          <Button variant="outline" size="sm" @click="refreshStocks">Coba lagi</Button>
        </AlertDescription>
      </Alert>

      <DataTable :table="table" :loading="loading" empty-text="Belum ada stok yang cocok dengan pencarian atau filter ini." />
      <DataTablePagination :table="table" :total="total" />
    </section>
  </main>
</template>
