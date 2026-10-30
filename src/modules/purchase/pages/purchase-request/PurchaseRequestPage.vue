<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Add01Icon,
  Alert02Icon,
  PackageCheck,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons'
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
import { purchaseRequestColumns } from '../../config/purchase-request-columns'
import { purchaseRequestService } from '../../services/purchase-request.service'
import type {
  PurchaseRequest,
  PurchaseRequestListItem,
  PurchaseRequestOptions,
} from '../../types/purchase-request.types'
import PurchaseRequestConvertDialog from './PurchaseRequestConvertDialog.vue'
import PurchaseRequestDetailDialog from './PurchaseRequestDetailDialog.vue'
import PurchaseRequestFormDialog from './PurchaseRequestFormDialog.vue'

const { can } = useCan()

const options = ref<PurchaseRequestOptions>({
  warehouses: [],
  branches: [],
  suppliers: [],
  settings: {
    request_enabled: false,
    separate_approver: true,
  },
})

const optionsLoading = ref(false)
const optionsFailed = ref(false)
const statusFilter = ref<string>()
const warehouseFilter = ref<string>()

const selectedRequest = ref<PurchaseRequestListItem | PurchaseRequest>()
const selectedDetail = ref<PurchaseRequest>()
const showForm = ref(false)
const showDetail = ref(false)
const showConvert = ref(false)
const convertInitialPrId = ref<number>()

const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'submit' | 'approve' | 'reject' | 'cancel' | 'close'>('delete')
const confirmLoading = ref(false)
const confirmReason = ref('')
const confirmError = ref('')

const filters: DataTableFilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    value: statusFilter,
    format: (val: unknown) => {
      const map: Record<string, string> = {
        draft: 'Draft',
        submitted: 'Diajukan',
        approved: 'Disetujui',
        rejected: 'Ditolak',
        partially_ordered: 'Dipesan Sebagian',
        ordered: 'Sudah Dipesan',
        closed: 'Ditutup',
        cancelled: 'Dibatalkan',
      }
      return typeof val === 'string' && map[val] ? map[val] : String(val ?? '')
    },
  },
  {
    id: 'warehouse_id',
    label: 'Gudang',
    value: warehouseFilter,
    format: val => options.value.warehouses.find(item => String(item.id) === val)?.name ?? val,
  },
]

const columns = purchaseRequestColumns({
  onShow: row => void openDetail(row),
  onEdit: row => {
    selectedRequest.value = row
    showForm.value = true
  },
  onDelete: row => openConfirm('delete', row),
  onSubmit: row => openConfirm('submit', row),
  onApprove: row => openConfirm('approve', row),
  onReject: row => openConfirm('reject', row),
  onCancel: row => openConfirm('cancel', row),
  onClose: row => openConfirm('close', row),
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters } = useDataTable({
  endpoint: '/purchase-requests',
  columns,
  filters,
})

const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

const confirmTitle = computed(() => ({
  delete: 'Hapus draft Purchase Request?',
  submit: 'Ajukan Purchase Request?',
  approve: 'Setujui Purchase Request?',
  reject: 'Tolak Purchase Request?',
  cancel: 'Batalkan Purchase Request?',
  close: 'Tutup Purchase Request?',
}[confirmAction.value]))

const confirmDescription = computed(() => ({
  delete: `Draft ${selectedRequest.value?.document_number} akan dihapus secara permanen.`,
  submit: `Purchase Request ${selectedRequest.value?.document_number} akan diajukan ke approver untuk disetujui.`,
  approve: `Purchase Request ${selectedRequest.value?.document_number} akan disetujui dan siap dikonversi menjadi Purchase Order.`,
  reject: `Purchase Request ${selectedRequest.value?.document_number} akan ditolak. Masukkan alasan penolakan di bawah.`,
  cancel: `Purchase Request ${selectedRequest.value?.document_number} akan dibatalkan. Masukkan alasan pembatalan di bawah.`,
  close: `Purchase Request ${selectedRequest.value?.document_number} akan ditutup. Sisa item yang belum dipesan tidak dapat dijadikan PO lagi.`,
}[confirmAction.value]))

async function loadOptions() {
  optionsLoading.value = true
  optionsFailed.value = false
  try {
    options.value = await purchaseRequestService.getOptions()
  } catch (error) {
    optionsFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    optionsLoading.value = false
  }
}

function openConfirm(action: 'delete' | 'submit' | 'approve' | 'reject' | 'cancel' | 'close', row: PurchaseRequestListItem | PurchaseRequest) {
  selectedRequest.value = row
  confirmAction.value = action
  confirmReason.value = ''
  confirmError.value = ''
  showConfirm.value = true
}

async function openDetail(row: PurchaseRequestListItem) {
  try {
    selectedDetail.value = await purchaseRequestService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

function openConvert(prId?: number) {
  convertInitialPrId.value = prId
  showConvert.value = true
}

async function executeConfirm() {
  if (!selectedRequest.value) return
  if ((confirmAction.value === 'reject' || confirmAction.value === 'cancel') && !confirmReason.value.trim()) {
    confirmError.value = 'Alasan wajib diisi.'
    return
  }

  confirmLoading.value = true
  confirmError.value = ''

  try {
    const id = selectedRequest.value.id
    if (confirmAction.value === 'delete') {
      await purchaseRequestService.delete(id)
      toast.success(`Draft PR ${selectedRequest.value.document_number} berhasil dihapus`)
    } else if (confirmAction.value === 'submit') {
      await purchaseRequestService.submit(id)
      toast.success(`PR ${selectedRequest.value.document_number} berhasil diajukan`)
    } else if (confirmAction.value === 'approve') {
      await purchaseRequestService.approve(id)
      toast.success(`PR ${selectedRequest.value.document_number} berhasil disetujui`)
    } else if (confirmAction.value === 'reject') {
      await purchaseRequestService.reject(id, confirmReason.value)
      toast.success(`PR ${selectedRequest.value.document_number} telah ditolak`)
    } else if (confirmAction.value === 'cancel') {
      await purchaseRequestService.cancel(id, confirmReason.value)
      toast.success(`PR ${selectedRequest.value.document_number} berhasil dibatalkan`)
    } else if (confirmAction.value === 'close') {
      await purchaseRequestService.close(id)
      toast.success(`PR ${selectedRequest.value.document_number} berhasil ditutup`)
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

function onSaved(pr: PurchaseRequest) {
  toast.success(`Purchase Request ${pr.document_number} berhasil disimpan`)
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
          <h1 class="text-2xl font-semibold tracking-tight">Purchase Request</h1>
          <p class="text-sm text-muted-foreground">
            Kelola permintaan pembelian internal sebelum pengadaan ke supplier.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite">
          <span class="font-medium text-foreground">{{ formattedTotal }}</span> permintaan
        </p>

        <Button
          v-if="can('purchase.request.convert') || can('purchase.order.create')"
          variant="outline"
          @click="openConvert()"
        >
          <HugeiconsIcon :icon="PackageCheck" data-icon="inline-start" /> Konversi PR ke PO
        </Button>

        <Button
          v-if="can('purchase.request.create')"
          @click="selectedRequest = undefined; showForm = true"
        >
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Buat Purchase Request
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
              <SelectItem value="submitted">Diajukan</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="partially_ordered">Dipesan Sebagian</SelectItem>
              <SelectItem value="ordered">Sudah Dipesan</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
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
        <span>Tidak dapat memuat daftar gudang atau cabang.</span>
        <Button variant="outline" size="sm" @click="loadOptions">Coba lagi</Button>
      </AlertDescription>
    </Alert>

    <!-- Data Table -->
    <DataTable :table="table" :loading="loading" empty-text="Belum ada Purchase Request yang cocok." />

    <!-- Pagination -->
    <DataTablePagination :table="table" :total="total" />

    <!-- Form Dialog (Buat/Ubah PR) -->
    <PurchaseRequestFormDialog
      v-model:open="showForm"
      :selected-request="selectedRequest"
      :options="options"
      @saved="onSaved"
    />

    <!-- Detail Dialog -->
    <PurchaseRequestDetailDialog
      v-model:open="showDetail"
      :request="selectedDetail"
      @submit="row => { showDetail = false; openConfirm('submit', row as any) }"
      @approve="row => { showDetail = false; openConfirm('approve', row as any) }"
      @reject="row => { showDetail = false; openConfirm('reject', row as any) }"
      @cancel="row => { showDetail = false; openConfirm('cancel', row as any) }"
      @close-request="row => { showDetail = false; openConfirm('close', row as any) }"
      @convert="row => { showDetail = false; openConvert(row.id) }"
    />

    <!-- Convert Dialog -->
    <PurchaseRequestConvertDialog
      v-model:open="showConvert"
      :options="options"
      :initial-pr-id="convertInitialPrId"
      @converted="refetch"
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

        <!-- Input Alasan untuk Penolakan / Pembatalan -->
        <Field
          v-if="confirmAction === 'reject' || confirmAction === 'cancel'"
          :data-invalid="!confirmReason.trim() && !!confirmError"
        >
          <FieldLabel for="confirm-reason">
            Alasan <span class="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="confirm-reason"
            v-model="confirmReason"
            placeholder="Tuliskan alasan secara jelas..."
            rows="3"
            :aria-invalid="!confirmReason.trim() && !!confirmError"
          />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Batal</AlertDialogCancel>
          <Button
            :variant="confirmAction === 'delete' || confirmAction === 'reject' || confirmAction === 'cancel' ? 'destructive' : 'default'"
            :disabled="confirmLoading || ((confirmAction === 'reject' || confirmAction === 'cancel') && !confirmReason.trim())"
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
