<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Add01Icon, Alert02Icon, CreditCardIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
import { purchasePaymentColumns } from '../../config/purchase-payment-columns'
import { purchaseInvoiceService } from '../../services/purchase-invoice.service'
import { purchasePaymentService } from '../../services/purchase-payment.service'
import type { PurchaseInvoiceSupplier } from '../../types/purchase-invoice.types'
import type { PurchasePayment, PurchasePaymentListItem } from '../../types/purchase-payment.types'
import PurchasePaymentDetailDialog from './PurchasePaymentDetailDialog.vue'
import PurchasePaymentFormDialog from './PurchasePaymentFormDialog.vue'

const { can } = useCan()
const suppliers = ref<PurchaseInvoiceSupplier[]>([])
const suppliersLoading = ref(false)
const suppliersFailed = ref(false)
const supplierFilter = ref<string>()
const statusFilter = ref<string>()
const selectedPayment = ref<PurchasePaymentListItem>()
const selectedDetail = ref<PurchasePayment>()
const initialSupplierId = ref<number>()
const initialInvoiceId = ref<number>()
const showForm = ref(false)
const showDetail = ref(false)
const showConfirm = ref(false)
const confirmLoading = ref(false)
const voidReason = ref('')

const statusLabels: Record<string, string> = { posted: 'Diposting', voided: 'Dibatalkan' }
const filters: DataTableFilterDef[] = [
  { id: 'status', label: 'Status', value: statusFilter, format: value => statusLabels[value] ?? value },
  {
    id: 'supplier_id',
    label: 'Supplier',
    value: supplierFilter,
    format: value => suppliers.value.find(supplier => String(supplier.id) === value)?.name ?? value,
  },
]
const columns = purchasePaymentColumns({
  onShow: row => void openDetail(row),
  onVoid: row => openVoidConfirmation(row),
})
const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/purchase/payments',
  columns,
  filters,
})
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

async function loadSuppliers() {
  suppliersLoading.value = true
  suppliersFailed.value = false
  try {
    suppliers.value = await purchaseInvoiceService.getSuppliers()
  } catch (error) {
    suppliersFailed.value = true
    toast.error(normalizeError(error).message)
  } finally {
    suppliersLoading.value = false
  }
}

async function openDetail(row: PurchasePaymentListItem) {
  try {
    selectedDetail.value = await purchasePaymentService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

function openVoidConfirmation(row: PurchasePaymentListItem) {
  selectedPayment.value = row
  voidReason.value = ''
  showDetail.value = false
  showConfirm.value = true
}

async function handleVoid() {
  if (!selectedPayment.value) return
  if (!voidReason.value.trim()) {
    toast.warning('Isi alasan pembatalan terlebih dahulu.')
    return
  }
  confirmLoading.value = true
  try {
    await purchasePaymentService.void(selectedPayment.value.id, voidReason.value.trim())
    toast.success('Pembayaran berhasil dibatalkan dan saldo hutang faktur diperbarui.')
    showConfirm.value = false
    selectedPayment.value = undefined
    selectedDetail.value = undefined
    await refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    confirmLoading.value = false
  }
}

function startCreate(supplierId?: number, invoiceId?: number) {
  selectedPayment.value = undefined
  initialSupplierId.value = supplierId
  initialInvoiceId.value = invoiceId
  showForm.value = true
}

async function onSaved(payment: PurchasePayment) {
  toast.success(`Pembayaran ${payment.document_number} berhasil dicatat.`)
  initialSupplierId.value = undefined
  initialInvoiceId.value = undefined
  await refetch()
}

onMounted(loadSuppliers)
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="CreditCardIcon" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Pembayaran Supplier</h1>
          <p class="mt-1 text-sm text-muted-foreground">Catat pembayaran dan alokasikan ke faktur supplier berdasarkan jatuh tempo.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">{{ formattedTotal }}</span> pembayaran</p>
        <Button v-if="can('purchase.payment.create')" :disabled="suppliersLoading || suppliersFailed" @click="startCreate()">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Pembayaran Baru
        </Button>
      </div>
    </header>

    <DataTableToolbar
      v-model:search="search"
      :table="table"
      :filters="filters"
      :on-clear-filter="clearFilter"
      :on-clear-all="clearAllFilters"
      :refresh="refetch"
      :loading="loading || suppliersLoading"
    >
      <template #filters>
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 w-[145px]" aria-label="Filter status"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="posted">Diposting</SelectItem>
            <SelectItem value="voided">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="supplierFilter" :disabled="suppliersLoading || suppliersFailed">
          <SelectTrigger class="h-8 w-[180px]" aria-label="Filter supplier"><SelectValue placeholder="Semua supplier" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="supplier in suppliers" :key="supplier.id" :value="String(supplier.id)">{{ supplier.name }}</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </DataTableToolbar>

    <Alert v-if="suppliersFailed" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Daftar supplier gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Supplier diperlukan untuk filter dan membuat pembayaran baru.</span>
        <Button variant="outline" size="sm" @click="loadSuppliers">Coba lagi</Button>
      </AlertDescription>
    </Alert>
    <Alert v-if="failedFetch" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Daftar pembayaran gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Periksa koneksi atau hak akses, lalu coba lagi.</span>
        <Button variant="outline" size="sm" @click="refetch">Coba lagi</Button>
      </AlertDescription>
    </Alert>

    <DataTable :table="table" :loading="loading" empty-text="Belum ada pembayaran supplier yang cocok dengan pencarian atau filter ini." />
    <DataTablePagination :table="table" :total="total" />

    <PurchasePaymentFormDialog
      v-model:open="showForm"
      :suppliers="suppliers"
      :initial-supplier-id="initialSupplierId"
      :initial-invoice-id="initialInvoiceId"
      @saved="onSaved"
    />
    <PurchasePaymentDetailDialog
      v-model:open="showDetail"
      :payment="selectedDetail"
      @void="openVoidConfirmation"
    />

    <AlertDialog v-model:open="showConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan pembayaran?</AlertDialogTitle>
          <AlertDialogDescription>
            Pembayaran {{ selectedPayment?.document_number }} akan dibatalkan. Nominalnya dikembalikan ke saldo hutang faktur yang terkait.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label class="flex flex-col gap-2 text-sm font-medium">
          Alasan pembatalan
          <Input v-model="voidReason" maxlength="255" placeholder="Jelaskan alasan pembatalan" :disabled="confirmLoading" />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Kembali</AlertDialogCancel>
          <Button variant="destructive" :disabled="confirmLoading" @click="handleVoid">
            <Spinner v-if="confirmLoading" />{{ confirmLoading ? 'Memproses...' : 'Ya, batalkan pembayaran' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
