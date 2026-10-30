<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Add01Icon, Alert02Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { useCan } from '@/core/composables/useCan'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { purchaseOrderColumns } from '../../config/purchase-order-columns'
import { purchaseOrderService } from '../../services/purchase-order.service'
import type {
  PurchaseOrder,
  PurchaseOrderListItem,
  PurchaseOrderOptions,
} from '../../types/purchase-order.types'
import PurchaseOrderDetailDialog from './PurchaseOrderDetailDialog.vue'
import PurchaseOrderFormDialog from './PurchaseOrderFormDialog.vue'

const router = useRouter()
const { can } = useCan()

const options = ref<PurchaseOrderOptions>({
  suppliers: [],
  warehouses: [],
  branches: [],
  settings: {
    default_tax_rate: '11',
    tax_in_cost: false,
    prices_include_tax: false,
    require_po: false,
    separate_approver: true,
  },
})

const optionsLoading = ref(false)
const optionsFailed = ref(false)
const statusFilter = ref<string>()
const supplierFilter = ref<string>()
const warehouseFilter = ref<string>()

const selectedOrder = ref<PurchaseOrderListItem | PurchaseOrder>()
const selectedDetail = ref<PurchaseOrder>()
const showForm = ref(false)
const showDetail = ref(false)

const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'approve' | 'cancel' | 'close'>('delete')
const confirmLoading = ref(false)
const cancelReason = ref('')
const confirmError = ref('')

const filters: DataTableFilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    value: statusFilter,
    format: (val: unknown) => {
      const map: Record<string, string> = {
        draft: 'Draft',
        approved: 'Disetujui',
        partially_received: 'Diterima Sebagian',
        received: 'Selesai Diterima',
        closed: 'Ditutup',
        cancelled: 'Dibatalkan',
      }
      return typeof val === 'string' && map[val] ? map[val] : String(val ?? '')
    },
  },
  {
    id: 'supplier_id',
    label: 'Supplier',
    value: supplierFilter,
    format: val => options.value.suppliers.find(item => String(item.id) === val)?.name ?? val,
  },
  {
    id: 'warehouse_id',
    label: 'Gudang',
    value: warehouseFilter,
    format: val => options.value.warehouses.find(item => String(item.id) === val)?.name ?? val,
  },
]

const columns = purchaseOrderColumns({
  onShow: row => void openDetail(row),
  onEdit: row => {
    selectedOrder.value = row
    showForm.value = true
  },
  onDelete: row => openConfirm('delete', row),
  onApprove: row => openConfirm('approve', row),
  onCancel: row => openConfirm('cancel', row),
  onClose: row => openConfirm('close', row),
  onReceive: row => handleReceive(row),
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters } = useDataTable({
  endpoint: '/purchase/orders',
  columns,
  filters,
})

const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

const confirmTitle = computed(() => ({
  delete: 'Hapus draft Purchase Order?',
  approve: 'Setujui Purchase Order?',
  cancel: 'Batalkan Purchase Order?',
  close: 'Tutup Purchase Order?',
}[confirmAction.value]))

const confirmDescription = computed(() => ({
  delete: `Draft ${selectedOrder.value?.document_number} akan dihapus secara permanen.`,
  approve: `Purchase Order ${selectedOrder.value?.document_number} akan disetujui dan siap diterima oleh bagian gudang. Tidak dapat diubah kembali setelah disetujui.`,
  cancel: `Purchase Order ${selectedOrder.value?.document_number} akan dibatalkan. Masukkan alasan pembatalan di bawah ini.`,
  close: `Purchase Order ${selectedOrder.value?.document_number} akan ditutup. Sisa barang yang belum diterima tidak akan ditagihkan lagi.`,
}[confirmAction.value]))

async function loadOptions() {
  optionsLoading.value = true
  optionsFailed.value = false
  try {
    options.value = await purchaseOrderService.getOptions()
  } catch (error) {
    optionsFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    optionsLoading.value = false
  }
}

function openConfirm(action: 'delete' | 'approve' | 'cancel' | 'close', row: PurchaseOrderListItem | PurchaseOrder) {
  selectedOrder.value = row
  confirmAction.value = action
  cancelReason.value = ''
  confirmError.value = ''
  showConfirm.value = true
}

async function openDetail(row: PurchaseOrderListItem) {
  try {
    selectedDetail.value = await purchaseOrderService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

function handleReceive(row: PurchaseOrderListItem | PurchaseOrder) {
  router.push({
    name: 'purchase.goods-receipts.index',
    query: { po_id: String(row.id) },
  })
}

async function executeConfirm() {
  if (!selectedOrder.value) return
  if (confirmAction.value === 'cancel' && !cancelReason.value.trim()) {
    confirmError.value = 'Alasan pembatalan wajib diisi.'
    return
  }

  confirmLoading.value = true
  confirmError.value = ''

  try {
    const id = selectedOrder.value.id
    if (confirmAction.value === 'delete') {
      await purchaseOrderService.delete(id)
      toast.success(`Draft PO ${selectedOrder.value.document_number} berhasil dihapus`)
    } else if (confirmAction.value === 'approve') {
      await purchaseOrderService.approve(id)
      toast.success(`Purchase Order ${selectedOrder.value.document_number} berhasil disetujui`)
    } else if (confirmAction.value === 'cancel') {
      await purchaseOrderService.cancel(id, cancelReason.value)
      toast.success(`Purchase Order ${selectedOrder.value.document_number} berhasil dibatalkan`)
    } else if (confirmAction.value === 'close') {
      await purchaseOrderService.close(id)
      toast.success(`Purchase Order ${selectedOrder.value.document_number} berhasil ditutup`)
    }

    showConfirm.value = false
    showDetail.value = false
    void refetch()
  } catch (error) {
    confirmError.value = normalizeError(error).message
  } finally {
    confirmLoading.value = false
  }
}

function onSaved(order: PurchaseOrder) {
  toast.success(`Purchase Order ${order.document_number} berhasil disimpan`)
  void refetch()
}

onMounted(() => {
  void loadOptions()
})
</script>

<template>
  <main class="flex flex-col gap-6">
    <!-- Header Halaman -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="ShoppingBag01Icon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Purchase Order</h1>
          <p class="text-sm text-muted-foreground">
            Kelola pesanan pembelian barang ke supplier sebelum penerimaan di gudang.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite">
          <span class="font-medium text-foreground">{{ formattedTotal }}</span> pesanan
        </p>
        <Button
          v-if="can('purchase.order.create')"
          @click="selectedOrder = undefined; showForm = true"
        >
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Buat Purchase Order
        </Button>
      </div>
    </header>

    <!-- Toolbar & Filter -->
    <DataTableToolbar
      v-model:search="search"
      :table="table"
      :filters="filters"
      :on-clear-filter="clearFilter"
      :on-clear-all="clearAllFilters"
      :refresh="refetch"
      :loading="loading"
    >
      <template #filters>
        <!-- Filter Status -->
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="partially_received">Diterima Sebagian</SelectItem>
              <SelectItem value="received">Selesai Diterima</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <!-- Filter Supplier -->
        <Select v-model="supplierFilter">
          <SelectTrigger class="h-8 w-[180px]">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="s in options.suppliers"
                :key="s.id"
                :value="String(s.id)"
              >
                {{ s.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <!-- Filter Gudang -->
        <Select v-model="warehouseFilter">
          <SelectTrigger class="h-8 w-[160px]">
            <SelectValue placeholder="Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="w in options.warehouses"
                :key="w.id"
                :value="String(w.id)"
              >
                {{ w.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
    </DataTableToolbar>

    <!-- Error state jika fetch options gagal -->
    <Alert v-if="optionsFailed" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Gagal memuat opsi data</AlertTitle>
      <AlertDescription class="flex items-center gap-2">
        <span>Tidak dapat memuat daftar supplier atau gudang.</span>
        <Button variant="outline" size="sm" @click="loadOptions">Coba lagi</Button>
      </AlertDescription>
    </Alert>

    <!-- Data Table -->
    <DataTable :table="table" :loading="loading" empty-text="Belum ada Purchase Order yang cocok." />

    <!-- Pagination -->
    <DataTablePagination :table="table" :total="total" />

    <!-- Form Dialog (Buat/Ubah PO) -->
    <PurchaseOrderFormDialog
      v-model:open="showForm"
      :selected-order="selectedOrder"
      :options="options"
      @saved="onSaved"
    />

    <!-- Detail Dialog -->
    <PurchaseOrderDetailDialog
      v-model:open="showDetail"
      :order="selectedDetail"
      @approve="row => { showDetail = false; openConfirm('approve', row) }"
      @cancel="row => { showDetail = false; openConfirm('cancel', row) }"
      @close-order="row => { showDetail = false; openConfirm('close', row) }"
      @receive="row => { showDetail = false; handleReceive(row) }"
    />

    <!-- Dialog Konfirmasi Aksi -->
    <AlertDialog v-model:open="showConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmDescription }}</AlertDialogDescription>
        </AlertDialogHeader>

        <Alert v-if="confirmError" variant="destructive">
          <AlertTitle>Gagal memproses</AlertTitle>
          <AlertDescription>{{ confirmError }}</AlertDescription>
        </Alert>

        <!-- Input Alasan untuk Pembatalan -->
        <Field v-if="confirmAction === 'cancel'" :data-invalid="!cancelReason.trim() && !!confirmError">
          <FieldLabel for="cancel-reason">
            Alasan Pembatalan <span class="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="cancel-reason"
            v-model="cancelReason"
            placeholder="Contoh: Supplier kehabisan stok / Salah kuantitas pesanan..."
            rows="3"
            :aria-invalid="!cancelReason.trim() && !!confirmError"
          />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Batal</AlertDialogCancel>
          <Button
            :variant="confirmAction === 'delete' || confirmAction === 'cancel' ? 'destructive' : 'default'"
            :disabled="confirmLoading || (confirmAction === 'cancel' && !cancelReason.trim())"
            @click="executeConfirm"
          >
            <Spinner v-if="confirmLoading" data-icon="inline-start" />
            {{ confirmLoading ? 'Memproses...' : 'Ya, Lanjutkan' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
