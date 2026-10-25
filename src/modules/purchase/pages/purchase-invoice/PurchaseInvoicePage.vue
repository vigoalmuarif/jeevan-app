<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Add01Icon, Alert02Icon, ReceiptText } from '@hugeicons/core-free-icons'
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
import { purchaseInvoiceColumns } from '../../config/purchase-invoice-columns'
import { purchaseInvoiceService } from '../../services/purchase-invoice.service'
import type { PurchasePayment } from '../../types/purchase-payment.types'
import type { PurchaseInvoice, PurchaseInvoiceListItem, PurchaseInvoiceSupplier } from '../../types/purchase-invoice.types'
import PurchaseInvoiceDetailDialog from './PurchaseInvoiceDetailDialog.vue'
import PurchaseInvoiceFormDialog from './PurchaseInvoiceFormDialog.vue'
import PurchasePaymentFormDialog from '../purchase-payment/PurchasePaymentFormDialog.vue'

const { can } = useCan()
const suppliers = ref<PurchaseInvoiceSupplier[]>([])
const suppliersLoading = ref(false)
const suppliersFailed = ref(false)
const statusFilter = ref<string>()
const paymentStatusFilter = ref<string>()
const supplierFilter = ref<string>()
const overdueFilter = ref<string>()
const selectedInvoice = ref<PurchaseInvoiceListItem>()
const selectedDetail = ref<PurchaseInvoice>()
const paymentSourceInvoice = ref<PurchaseInvoiceListItem>()
const paymentSupplierId = ref<number>()
const paymentInvoiceId = ref<number>()
const showForm = ref(false)
const showDetail = ref(false)
const showPaymentForm = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'post' | 'void'>('delete')
const confirmLoading = ref(false)
const voidReason = ref('')
const documentStatuses: Record<string, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  voided: 'Dibatalkan',
}
const paymentStatuses: Record<string, string> = {
  unpaid: 'Belum dibayar',
  partial: 'Dibayar sebagian',
  paid: 'Lunas',
}

const filters: DataTableFilterDef[] = [
  {
    id: 'status',
    label: 'Status dokumen',
    value: statusFilter,
    format: value => documentStatuses[value] ?? value,
  },
  {
    id: 'payment_status',
    label: 'Status pembayaran',
    value: paymentStatusFilter,
    format: value => paymentStatuses[value] ?? value,
  },
  {
    id: 'supplier_id',
    label: 'Supplier',
    value: supplierFilter,
    format: value => suppliers.value.find(supplier => String(supplier.id) === value)?.name ?? value,
  },
  { id: 'overdue', label: 'Jatuh tempo', value: overdueFilter, format: () => 'Terlambat' },
]
const columns = purchaseInvoiceColumns({
  onShow: row => void openDetail(row),
  onEdit: row => { selectedInvoice.value = row; showForm.value = true },
  onDelete: row => openConfirm('delete', row),
  onPost: row => openConfirm('post', row),
  onVoid: row => openConfirm('void', row),
})
const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/purchase/invoices',
  columns,
  filters,
})
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))
const confirmTitle = computed(() => ({
  delete: 'Hapus draft faktur?',
  post: 'Posting faktur pembelian?',
  void: 'Batalkan faktur pembelian?',
}[confirmAction.value]))
const confirmDescription = computed(() => ({
  delete: `Draft ${selectedInvoice.value?.document_number} akan dihapus dan penerimaannya dilepas dari faktur.`,
  post: `Faktur ${selectedInvoice.value?.document_number} akan diposting dan mulai membentuk hutang supplier.`,
  void: `Faktur ${selectedInvoice.value?.document_number} akan dibatalkan. Aksi ini hanya dapat dilakukan jika belum ada pembayaran.`,
}[confirmAction.value]))

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

function openConfirm(action: 'delete' | 'post' | 'void', row: PurchaseInvoiceListItem) {
  selectedInvoice.value = row
  confirmAction.value = action
  voidReason.value = ''
  showDetail.value = false
  showConfirm.value = true
}

async function openDetail(row: PurchaseInvoiceListItem) {
  try {
    selectedDetail.value = await purchaseInvoiceService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message)
  }
}

async function handleConfirm() {
  if (!selectedInvoice.value) return
  if (confirmAction.value === 'void' && !voidReason.value.trim()) {
    toast.warning('Isi alasan pembatalan terlebih dahulu.')
    return
  }
  confirmLoading.value = true
  try {
    if (confirmAction.value === 'delete') {
      await purchaseInvoiceService.delete(selectedInvoice.value.id)
      toast.success('Draft faktur berhasil dihapus.')
    } else if (confirmAction.value === 'post') {
      await purchaseInvoiceService.post(selectedInvoice.value.id)
      toast.success('Faktur berhasil diposting.')
    } else {
      await purchaseInvoiceService.void(selectedInvoice.value.id, voidReason.value.trim())
      toast.success('Faktur berhasil dibatalkan.')
    }
    showConfirm.value = false
    selectedInvoice.value = undefined
    selectedDetail.value = undefined
    await refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    confirmLoading.value = false
  }
}

function startCreate() {
  selectedInvoice.value = undefined
  showForm.value = true
}

async function onSaved(invoice: PurchaseInvoice) {
  toast.success(`Draft ${invoice.document_number} berhasil ${selectedInvoice.value ? 'diperbarui' : 'dibuat'}.`)
  selectedInvoice.value = undefined
  await refetch()
}

function startPayment(invoice: PurchaseInvoiceListItem) {
  paymentSourceInvoice.value = invoice
  paymentSupplierId.value = invoice.supplier_id
  paymentInvoiceId.value = invoice.id
  showDetail.value = false
  showPaymentForm.value = true
}

async function onPaymentSaved(payment: PurchasePayment) {
  toast.success(`Pembayaran ${payment.document_number} berhasil dicatat.`)
  const sourceInvoice = paymentSourceInvoice.value
  paymentSourceInvoice.value = undefined
  paymentSupplierId.value = undefined
  paymentInvoiceId.value = undefined
  await refetch()
  if (sourceInvoice) await openDetail(sourceInvoice)
}

onMounted(loadSuppliers)
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="ReceiptText" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Faktur Pembelian</h1>
          <p class="mt-1 text-sm text-muted-foreground">Catat hutang supplier dari penerimaan barang yang sudah diposting.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">{{ formattedTotal }}</span> faktur</p>
        <Button v-if="can('purchase.invoice.create')" :disabled="suppliersLoading || suppliersFailed" @click="startCreate">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Faktur Baru
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
          <SelectTrigger class="h-8 w-[150px]" aria-label="Filter status dokumen"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="posted">Diposting</SelectItem>
            <SelectItem value="voided">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="paymentStatusFilter">
          <SelectTrigger class="h-8 w-[170px]" aria-label="Filter status pembayaran"><SelectValue placeholder="Semua pembayaran" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unpaid">Belum dibayar</SelectItem>
            <SelectItem value="partial">Dibayar sebagian</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="supplierFilter" :disabled="suppliersLoading || suppliersFailed">
          <SelectTrigger class="h-8 w-[180px]" aria-label="Filter supplier"><SelectValue placeholder="Semua supplier" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="supplier in suppliers" :key="supplier.id" :value="String(supplier.id)">{{ supplier.name }}</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="overdueFilter">
          <SelectTrigger class="h-8 w-[150px]" aria-label="Filter jatuh tempo"><SelectValue placeholder="Semua jatuh tempo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Terlambat</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </DataTableToolbar>

    <Alert v-if="suppliersFailed" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Daftar supplier gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Supplier diperlukan untuk filter dan membuat faktur baru.</span>
        <Button variant="outline" size="sm" @click="loadSuppliers">Coba lagi</Button>
      </AlertDescription>
    </Alert>
    <Alert v-if="failedFetch" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Daftar faktur gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Periksa koneksi atau hak akses, lalu coba lagi.</span>
        <Button variant="outline" size="sm" @click="refetch">Coba lagi</Button>
      </AlertDescription>
    </Alert>

    <DataTable :table="table" :loading="loading" empty-text="Belum ada faktur pembelian yang cocok dengan pencarian atau filter ini." />
    <DataTablePagination :table="table" :total="total" />

    <PurchaseInvoiceFormDialog
      v-model:open="showForm"
      :selected-invoice="selectedInvoice"
      :suppliers="suppliers"
      @saved="onSaved"
    />
    <PurchaseInvoiceDetailDialog
      v-model:open="showDetail"
      :invoice="selectedDetail"
      @post="openConfirm('post', $event)"
      @void="openConfirm('void', $event)"
      @pay="startPayment"
    />
    <PurchasePaymentFormDialog
      v-model:open="showPaymentForm"
      :suppliers="suppliers"
      :initial-supplier-id="paymentSupplierId"
      :initial-invoice-id="paymentInvoiceId"
      @saved="onPaymentSaved"
    />

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
          <Button
            :variant="confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'"
            :disabled="confirmLoading"
            @click="handleConfirm"
          >
            <Spinner v-if="confirmLoading" />
            {{ confirmLoading ? 'Memproses...' : confirmAction === 'post' ? 'Ya, posting' : confirmAction === 'void' ? 'Ya, batalkan' : 'Hapus draft' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
