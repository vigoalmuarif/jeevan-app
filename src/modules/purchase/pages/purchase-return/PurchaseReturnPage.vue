<script setup lang="ts">
import { computed, ref } from 'vue'
import { Add01Icon, RotateCcw, Alert02Icon } from '@hugeicons/core-free-icons'
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
import { purchaseReturnColumns } from '../../config/purchase-return-columns'
import { purchaseReturnService } from '../../services/purchase-return.service'
import type { PurchaseReturn, PurchaseReturnListItem } from '../../types/purchase-return.types'
import PurchaseReturnDetailDialog from './PurchaseReturnDetailDialog.vue'
import PurchaseReturnFormDialog from './PurchaseReturnFormDialog.vue'

const { can } = useCan()

const statusFilter = ref<string>()
const settlementFilter = ref<string>()

const selectedReturnItem = ref<PurchaseReturnListItem>()
const selectedDetail = ref<PurchaseReturn>()
const editDetail = ref<PurchaseReturn>()

const showForm = ref(false)
const showDetail = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'delete' | 'post' | 'void'>('delete')
const confirmLoading = ref(false)
const voidReason = ref('')

const statusMap: Record<string, string> = { draft: 'Draft', posted: 'Diposting', voided: 'Dibatalkan' }
const settlementMap: Record<string, string> = { invoice_deduction: 'Potong Faktur', cash_refund: 'Refund Kas', credit_balance: 'Deposit' }

const filters: DataTableFilterDef[] = [
  { id: 'status', label: 'Status', value: statusFilter, format: value => statusMap[String(value)] ?? String(value) },
  { id: 'settlement_method', label: 'Penyelesaian', value: settlementFilter, format: value => settlementMap[String(value)] ?? String(value) },
]

const columns = purchaseReturnColumns({
  onShow: row => void openDetail(row),
  onEdit: row => void openEdit(row),
  onDelete: row => openConfirm('delete', row),
  onPost: row => openConfirm('post', row),
  onVoid: row => openConfirm('void', row),
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/purchase/returns',
  columns,
  filters,
})

const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

const confirmTitle = computed(() => ({
  delete: 'Hapus draft retur pembelian?',
  post: 'Posting retur pembelian?',
  void: 'Batalkan retur pembelian?',
}[confirmAction.value]))

const confirmDescription = computed(() => ({
  delete: `Draft retur ${selectedReturnItem.value?.document_number ?? ''} akan dihapus secara permanen.`,
  post: `Barang akan dikeluarkan dari gudang dan saldo Debit Note akan diproses untuk ${selectedReturnItem.value?.document_number ?? ''}.`,
  void: `Pembalik retur akan mengembalikan stok ke gudang. Tindakan ini tidak dapat dibatalkan.`,
}[confirmAction.value]))

function openConfirm(action: 'delete' | 'post' | 'void', row: PurchaseReturnListItem) {
  confirmAction.value = action
  selectedReturnItem.value = row
  voidReason.value = ''
  showConfirm.value = true
}

async function openDetail(row: PurchaseReturnListItem) {
  try {
    selectedDetail.value = await purchaseReturnService.show(row.id)
    showDetail.value = true
  } catch (error) {
    toast.error(normalizeError(error).message || 'Gagal memuat detail retur')
  }
}

async function openEdit(row: PurchaseReturnListItem) {
  try {
    editDetail.value = await purchaseReturnService.show(row.id)
    showForm.value = true
  } catch (error) {
    toast.error(normalizeError(error).message || 'Gagal memuat data retur untuk diedit')
  }
}

function handleCreateNew() {
  editDetail.value = undefined
  showForm.value = true
}

async function handleConfirm() {
  if (!selectedReturnItem.value) return
  confirmLoading.value = true
  try {
    if (confirmAction.value === 'delete') {
      await purchaseReturnService.delete(selectedReturnItem.value.id)
      toast.success('Draft retur berhasil dihapus.')
    } else if (confirmAction.value === 'post') {
      await purchaseReturnService.post(selectedReturnItem.value.id)
      toast.success('Retur berhasil diposting. Stok telah dikurangkan.')
    } else {
      if (!voidReason.value.trim()) {
        toast.error('Alasan pembatalan wajib diisi.')
        confirmLoading.value = false
        return
      }
      await purchaseReturnService.void(selectedReturnItem.value.id, voidReason.value.trim())
      toast.success('Retur berhasil dibatalkan (void). Stok telah dikembalikan.')
    }
    showConfirm.value = false
    showDetail.value = false
    refetch()
  } catch (error) {
    toast.error(normalizeError(error).message || 'Gagal memproses aksi retur.')
  } finally {
    confirmLoading.value = false
  }
}
</script>

<template>
  <main class="flex flex-col gap-6 p-4 md:p-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="RotateCcw" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Retur Pembelian & Debit Note</h1>
          <p class="mt-1 text-sm text-muted-foreground">Kelola pengembalian barang ke supplier dan pemotongan hutang.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">{{ formattedTotal }}</span> dokumen</p>
        <Button v-if="can('purchase.return.create')" @click="handleCreateNew">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Buat Retur
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
      :loading="loading"
    >
      <template #filters>
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 w-[145px]" aria-label="Filter status">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="posted">Diposting</SelectItem>
            <SelectItem value="voided">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="settlementFilter">
          <SelectTrigger class="h-8 w-[160px]" aria-label="Filter penyelesaian">
            <SelectValue placeholder="Semua penyelesaian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoice_deduction">Potong Faktur</SelectItem>
            <SelectItem value="cash_refund">Refund Kas</SelectItem>
            <SelectItem value="credit_balance">Deposit</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </DataTableToolbar>

    <Alert v-if="failedFetch" variant="destructive">
      <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
      <AlertTitle>Daftar retur gagal dimuat</AlertTitle>
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Periksa koneksi atau hak akses, lalu coba lagi.</span>
        <Button variant="outline" size="sm" @click="refetch">Coba lagi</Button>
      </AlertDescription>
    </Alert>

    <DataTable :table="table" :loading="loading" empty-text="Belum ada retur pembelian yang cocok dengan pencarian atau filter ini." />
    <DataTablePagination :table="table" :total="total" />

    <!-- Dialog Form Create / Edit -->
    <PurchaseReturnFormDialog
      v-model:open="showForm"
      :edit-return="editDetail"
      @saved="() => { refetch(); toast.success('Retur berhasil disimpan.') }"
    />

    <!-- Dialog Detail -->
    <PurchaseReturnDetailDialog
      v-model:open="showDetail"
      :return-data="selectedDetail"
      @post="(row) => openConfirm('post', row as unknown as PurchaseReturnListItem)"
      @void="(row) => openConfirm('void', row as unknown as PurchaseReturnListItem)"
    />

    <!-- Dialog Konfirmasi Post / Delete / Void -->
    <AlertDialog :open="showConfirm" @update:open="val => showConfirm = val">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmDescription }}</AlertDialogDescription>
        </AlertDialogHeader>
        <div v-if="confirmAction === 'void'" class="py-2">
          <Input
            v-model="voidReason"
            placeholder="Alasan pembatalan (misal: penggantian barang langsung)..."
            :disabled="confirmLoading"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="confirmLoading">Batal</AlertDialogCancel>
          <Button
            :variant="confirmAction === 'delete' || confirmAction === 'void' ? 'destructive' : 'default'"
            :disabled="confirmLoading"
            @click="handleConfirm"
          >
            <Spinner v-if="confirmLoading" class="mr-2 h-4 w-4" />
            Lanjutkan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
