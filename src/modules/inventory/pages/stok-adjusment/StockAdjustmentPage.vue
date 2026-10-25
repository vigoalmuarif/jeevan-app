<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Add01Icon, Alert02Icon, WarehouseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCan } from '@/core/composables/useCan'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { stockAdjustmentColumns } from '../../config/stock-adjustment-columns'
import DataTableStockAdjustmentAction from './DataTableStockAdjustmentAction.vue' 
import StockAdjustmentDetailDialog from './StockAdjustmentDetailDialog.vue' 
import StockAdjustmentFormDialog from './StockAdjustmentFormDialog.vue' 
import { stockAdjustmentService } from '../../services/stock-adjustment.service'
import type { StockAdjustment, StockAdjustmentFilterOptions, StockAdjustmentListItem, StockAdjustmentOptions } from '../../types/stock-adjustment.types'

const { can } = useCan()
const branchFilter = ref<string>()
const warehouseFilter = ref<string>()
const statusFilter = ref<string>()
const options = ref<StockAdjustmentOptions>({ branches: [], warehouses: [], reasons: [] })
const optionsLoading = ref(false)
const optionsFailed = ref(false)
const selectedAdjustment = ref<StockAdjustmentListItem>()
const selectedDetail = ref<StockAdjustment>()
const showForm = ref(false)
const showDetail = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'post' | 'void'>('delete')
const confirmLoading = ref(false)
const voidReason = ref('')

const filters: DataTableFilterDef[] = [
  { id: 'branch_id', label: 'Cabang', value: branchFilter, format: value => options.value.branches.find(item => String(item.id) === value)?.name ?? value },
  { id: 'warehouse_id', label: 'Gudang', value: warehouseFilter, format: value => options.value.warehouses.find(item => String(item.id) === value)?.name ?? value },
  { id: 'status', label: 'Status', value: statusFilter, format: value => ({ draft: 'Draft', posted: 'Posted', voided: 'Voided' }[value] ?? value) },
]

const columns = stockAdjustmentColumns({
  onShow: row => void openDetail(row),
  onEdit: row => void startEdit(row),
  onDelete: row => openConfirm('delete', row),
  onPost: row => openConfirm('post', row),
  onVoid: row => openConfirm('void', row),
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/stock-adjustments', columns, filters,
})
const visibleWarehouses = computed(() => {
  const matching = options.value.warehouses.filter(warehouse => !branchFilter.value || String(warehouse.branch_id) === branchFilter.value)
  return [...new Map(matching.map(warehouse => [warehouse.id, warehouse])).values()]
})
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))
const confirmTitle = computed(() => ({ delete: 'Hapus draft adjustment?', post: 'Posting adjustment stok?', void: 'Batalkan adjustment?' }[confirmAction.value]))
const confirmDescription = computed(() => ({
  delete: `Draft ${selectedAdjustment.value?.document_number} akan dihapus.`,
  post: `Adjustment ${selectedAdjustment.value?.document_number} akan mengubah saldo stok dan terkunci.`,
  void: `Adjustment ${selectedAdjustment.value?.document_number} akan dibuatkan mutasi pembalik. Dokumen tetap tersimpan untuk audit.`,
}[confirmAction.value]))

watch(branchFilter, (branchId) => {
  if (warehouseFilter.value && !options.value.warehouses.some(warehouse =>
    String(warehouse.id) === warehouseFilter.value && (!branchId || String(warehouse.branch_id) === branchId),
  )) {
    warehouseFilter.value = undefined
  }
})

async function loadOptions() {
  optionsLoading.value = true
  optionsFailed.value = false
  try {
    const filterOptions: StockAdjustmentFilterOptions = await stockAdjustmentService.getFilterOptions()
    options.value = { ...options.value, ...filterOptions }
  } catch (error) {
    optionsFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    optionsLoading.value = false
  }
}

function openConfirm(action: 'delete' | 'post' | 'void', row: StockAdjustmentListItem) {
  selectedAdjustment.value = row
  confirmAction.value = action
  voidReason.value = ''
  showConfirm.value = true
}

async function openDetail(row: StockAdjustmentListItem) {
  try {
    selectedDetail.value = await stockAdjustmentService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

async function handleConfirm() {
  if (!selectedAdjustment.value) return
  if (confirmAction.value === 'void' && !voidReason.value.trim()) {
    toast.warning('Isi alasan pembatalan terlebih dahulu.')
    return
  }

  confirmLoading.value = true
  try {
    if (confirmAction.value === 'delete') {
      await stockAdjustmentService.delete(selectedAdjustment.value.id)
      toast.success('Draft adjustment berhasil dihapus.')
    } else if (confirmAction.value === 'post') {
      await stockAdjustmentService.post(selectedAdjustment.value.id)
      toast.success('Adjustment berhasil diposting.')
    } else {
      await stockAdjustmentService.void(selectedAdjustment.value.id, voidReason.value.trim())
      toast.success('Adjustment berhasil dibatalkan.')
    }
    showConfirm.value = false
    selectedAdjustment.value = undefined
    await refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    confirmLoading.value = false
  }
}

function startCreate() {
  selectedAdjustment.value = undefined
  showForm.value = true
}

function startEdit(row: StockAdjustmentListItem) {
  selectedAdjustment.value = row
  showForm.value = true
}

async function onSaved(adjustment: StockAdjustment) {
  toast.success(`Draft ${adjustment.document_number} berhasil ${selectedAdjustment.value ? 'diperbarui' : 'dibuat'}.`)
  selectedAdjustment.value = undefined
  await refetch()
}

onMounted(loadOptions)
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="WarehouseIcon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Stock Adjustment</h1>
          <p class="text-sm text-muted-foreground">Koreksi stok fisik melalui dokumen yang tercatat dan dapat ditelusuri.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite"><span class="font-medium text-foreground">{{ formattedTotal }}</span> dokumen</p>
        <Button v-if="can('inventory.adjustment.create')" :disabled="optionsLoading || optionsFailed" @click="startCreate">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Buat adjustment
        </Button>
      </div>
    </header>

    <section aria-label="Daftar stock adjustment" class="flex flex-col gap-4">
      <DataTableToolbar
        v-model:search="search" :table="table" :filters="filters"
        :on-clear-filter="clearFilter" :on-clear-all="clearAllFilters"
        :refresh="refetch" :loading="loading || optionsLoading"
      >
        <template #filters>
          <Select v-model="branchFilter" :disabled="optionsLoading || optionsFailed">
            <SelectTrigger class="h-8 w-[170px]" aria-label="Filter cabang">
              <SelectValue placeholder="Semua cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="branch in options.branches" :key="branch.id" :value="String(branch.id)">
                {{ branch.name }} ({{ branch.code }})
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="warehouseFilter" :disabled="optionsLoading || optionsFailed">
            <SelectTrigger class="h-8 w-[170px]" aria-label="Filter gudang">
              <SelectValue placeholder="Semua gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="warehouse in visibleWarehouses" :key="`${warehouse.branch_id}-${warehouse.id}`" :value="String(warehouse.id)">
                {{ warehouse.name }} ({{ warehouse.code }})
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="statusFilter">
            <SelectTrigger class="h-8 w-[150px]" aria-label="Filter status">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </template>
      </DataTableToolbar>

      <Alert v-if="optionsFailed" variant="destructive">
        <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" /><AlertTitle>Data pilihan gagal dimuat</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center justify-between gap-3"><span>Muat ulang daftar cabang dan gudang.</span><Button variant="outline" size="sm" @click="loadOptions">Coba lagi</Button></AlertDescription>
      </Alert>
      <Alert v-if="failedFetch" variant="destructive">
        <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" /><AlertTitle>Daftar adjustment gagal dimuat</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center justify-between gap-3"><span>Periksa koneksi lalu coba muat ulang data.</span><Button variant="outline" size="sm" @click="refetch">Coba lagi</Button></AlertDescription>
      </Alert>

      <DataTable :table="table" :loading="loading" empty-text="Belum ada dokumen adjustment yang cocok dengan pencarian atau filter ini." />
      <DataTablePagination :table="table" :total="total" />
    </section>

    <StockAdjustmentFormDialog v-model:open="showForm" :selected-adjustment="selectedAdjustment" :options="options" @saved="onSaved" />
    <StockAdjustmentDetailDialog v-model:open="showDetail" :adjustment="selectedDetail" />

    <AlertDialog v-model:open="showConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmDescription }}</AlertDialogDescription>
        </AlertDialogHeader>
        <label v-if="confirmAction === 'void'" class="flex flex-col gap-2 text-sm font-medium">
          Alasan pembatalan
          <Input v-model="voidReason" maxlength="255" placeholder="Jelaskan alasan pembatalan" :disabled="confirmLoading" />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Kembali</AlertDialogCancel>
          <Button :variant="confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'" :disabled="confirmLoading" @click="handleConfirm">
            <Spinner v-if="confirmLoading" />
            {{ confirmLoading ? 'Memproses...' : (confirmAction === 'post' ? 'Ya, posting' : confirmAction === 'void' ? 'Ya, batalkan' : 'Hapus draft') }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
