<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Add01Icon, PackageCheck, Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { useCan } from '@/core/composables/useCan'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { goodsReceiptColumns } from '../../config/goods-receipt-columns'
import { goodsReceiptService } from '../../services/goods-receipt.service'
import type { GoodsReceipt, GoodsReceiptListItem, GoodsReceiptOptions } from '../../types/goods-receipt.types'
import GoodsReceiptDetailDialog from './GoodsReceiptDetailDialog.vue'
import GoodsReceiptFormDialog from './GoodsReceiptFormDialog.vue'

const route = useRoute()
const { can } = useCan()
const options = ref<GoodsReceiptOptions>({ suppliers: [], warehouses: [] })
const optionsLoading = ref(false)
const optionsFailed = ref(false)
const statusFilter = ref<string>()
const supplierFilter = ref<string>()
const warehouseFilter = ref<string>()
const selectedReceipt = ref<GoodsReceiptListItem>()
const selectedDetail = ref<GoodsReceipt>()
const initialPurchaseOrderId = ref<string>()
const showForm = ref(false)
const showDetail = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'post' | 'void'>('delete')
const confirmLoading = ref(false)
const voidReason = ref('')

const filters: DataTableFilterDef[] = [
  { id: 'status', label: 'Status', value: statusFilter, format: value => ({ draft: 'Draft', posted: 'Diposting', voided: 'Dibatalkan' }[value] ?? value) },
  { id: 'supplier_id', label: 'Supplier', value: supplierFilter, format: value => options.value.suppliers.find(item => String(item.id) === value)?.name ?? value },
  { id: 'warehouse_id', label: 'Gudang', value: warehouseFilter, format: value => options.value.warehouses.find(item => String(item.id) === value)?.name ?? value },
]

const columns = goodsReceiptColumns({
  onShow: row => void openDetail(row),
  onEdit: row => { selectedReceipt.value = row; showForm.value = true },
  onDelete: row => openConfirm('delete', row),
  onPost: row => openConfirm('post', row),
  onVoid: row => openConfirm('void', row),
})
const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/goods-receipts',
  columns,
  filters,
})
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))
const confirmTitle = computed(() => ({
  delete: 'Hapus draft penerimaan?',
  post: 'Posting penerimaan barang?',
  void: 'Batalkan penerimaan?',
}[confirmAction.value]))
const confirmDescription = computed(() => ({
  delete: `Draft ${selectedReceipt.value?.document_number} akan dihapus.`,
  post: `Penerimaan ${selectedReceipt.value?.document_number} akan menambah stok dan mengunci dokumen.`,
  void: `Penerimaan ${selectedReceipt.value?.document_number} akan dibalik melalui mutasi stok. Dokumen tetap tersimpan untuk audit.`,
}[confirmAction.value]))

async function loadOptions() {
  optionsLoading.value = true
  optionsFailed.value = false
  try {
    options.value = await goodsReceiptService.getOptions()
  } catch (error) {
    optionsFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    optionsLoading.value = false
  }
}

function openConfirm(action: 'delete' | 'post' | 'void', row: GoodsReceiptListItem) {
  selectedReceipt.value = row
  confirmAction.value = action
  voidReason.value = ''
  showConfirm.value = true
}

async function openDetail(row: GoodsReceiptListItem) {
  try {
    selectedDetail.value = await goodsReceiptService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

async function handleConfirm() {
  if (!selectedReceipt.value) return
  if (confirmAction.value === 'void' && !voidReason.value.trim()) {
    toast.warning('Isi alasan pembatalan terlebih dahulu.')
    return
  }
  confirmLoading.value = true
  try {
    if (confirmAction.value === 'delete') {
      await goodsReceiptService.delete(selectedReceipt.value.id)
      toast.success('Draft penerimaan berhasil dihapus.')
    } else if (confirmAction.value === 'post') {
      await goodsReceiptService.post(selectedReceipt.value.id)
      toast.success('Penerimaan berhasil diposting.')
    } else {
      await goodsReceiptService.void(selectedReceipt.value.id, voidReason.value.trim())
      toast.success('Penerimaan berhasil dibatalkan.')
    }
    showConfirm.value = false
    showDetail.value = false
    selectedReceipt.value = undefined
    await refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    confirmLoading.value = false
  }
}

function startCreate() {
  selectedReceipt.value = undefined
  showForm.value = true
}

async function onSaved(receipt: GoodsReceipt) {
  toast.success(`Draft ${receipt.document_number} berhasil ${selectedReceipt.value ? 'diperbarui' : 'dibuat'}.`)
  selectedReceipt.value = undefined
  await refetch()
}

onMounted(async () => {
  await loadOptions()
  if (route.query.po_id) {
    initialPurchaseOrderId.value = String(route.query.po_id)
    selectedReceipt.value = undefined
    showForm.value = true
  }
})
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="PackageCheck" aria-hidden="true" />
        </div>
        <div><h1 class="text-2xl font-semibold tracking-tight">Penerimaan Barang</h1><p class="mt-1 text-sm text-muted-foreground">Catat penerimaan supplier. Stok dan HPP berubah saat dokumen diposting.</p></div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">{{ formattedTotal }}</span> dokumen</p>
        <Button v-if="can('purchase.receipt.create')" :disabled="optionsLoading || optionsFailed" @click="startCreate"><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Penerimaan Baru</Button>
      </div>
    </header>

    <DataTableToolbar v-model:search="search" :table="table" :filters="filters" :on-clear-filter="clearFilter" :on-clear-all="clearAllFilters" :refresh="refetch" :loading="loading || optionsLoading">
      <template #filters>
        <Select v-model="statusFilter"><SelectTrigger class="h-8 w-[145px]" aria-label="Filter status"><SelectValue placeholder="Semua status" /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="posted">Diposting</SelectItem><SelectItem value="voided">Dibatalkan</SelectItem></SelectContent></Select>
        <Select v-model="supplierFilter" :disabled="optionsLoading || optionsFailed"><SelectTrigger class="h-8 w-[180px]" aria-label="Filter supplier"><SelectValue placeholder="Semua supplier" /></SelectTrigger><SelectContent><SelectItem v-for="supplier in options.suppliers" :key="supplier.id" :value="String(supplier.id)">{{ supplier.name }}</SelectItem></SelectContent></Select>
        <Select v-model="warehouseFilter" :disabled="optionsLoading || optionsFailed"><SelectTrigger class="h-8 w-[160px]" aria-label="Filter gudang"><SelectValue placeholder="Semua gudang" /></SelectTrigger><SelectContent><SelectItem v-for="warehouse in options.warehouses" :key="warehouse.id" :value="String(warehouse.id)">{{ warehouse.name }}</SelectItem></SelectContent></Select>
      </template>
    </DataTableToolbar>

    <Alert v-if="optionsFailed" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" /><AlertTitle>Data pilihan gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3"><span>Muat ulang supplier, gudang, dan daftar produk.</span><Button variant="outline" size="sm" @click="loadOptions">Coba lagi</Button></AlertDescription>
    </Alert>
    <Alert v-if="failedFetch" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" /><AlertTitle>Daftar penerimaan gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3"><span>Periksa koneksi atau hak akses, lalu coba lagi.</span><Button variant="outline" size="sm" @click="refetch">Coba lagi</Button></AlertDescription>
    </Alert>

    <DataTable :table="table" :loading="loading" empty-text="Belum ada penerimaan barang yang cocok dengan pencarian atau filter ini." />
    <DataTablePagination :table="table" :total="total" />

    <GoodsReceiptFormDialog
      v-model:open="showForm"
      :selected-receipt="selectedReceipt"
      :options="options"
      :initial-purchase-order-id="initialPurchaseOrderId"
      @saved="onSaved"
    />
    <GoodsReceiptDetailDialog
      v-model:open="showDetail"
      :receipt="selectedDetail"
      @post="openConfirm('post', $event)"
      @void="openConfirm('void', $event)"
    />

    <AlertDialog v-model:open="showConfirm">
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle><AlertDialogDescription>{{ confirmDescription }}</AlertDialogDescription></AlertDialogHeader>
        <label v-if="confirmAction === 'void'" class="flex flex-col gap-2 text-sm font-medium">Alasan pembatalan<Input v-model="voidReason" maxlength="255" placeholder="Jelaskan alasan pembatalan" :disabled="confirmLoading" /></label>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Kembali</AlertDialogCancel>
          <Button :variant="confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'" :disabled="confirmLoading" @click="handleConfirm">
            <Spinner v-if="confirmLoading" />{{ confirmLoading ? 'Memproses...' : confirmAction === 'post' ? 'Ya, posting' : confirmAction === 'void' ? 'Ya, batalkan' : 'Hapus draft' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
