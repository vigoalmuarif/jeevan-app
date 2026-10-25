<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Alert02Icon, CheckmarkCircleIcon, File01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ComboboxSelect from '@/components/ui/combobox/ComboboxSelect.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { normalizeError } from '@/lib/errors'
import { purchaseInvoiceService } from '../../services/purchase-invoice.service'
import type {
  PurchaseInvoice,
  PurchaseInvoiceListItem,
  PurchaseInvoicePayload,
  PurchaseInvoiceReceiptOption,
  PurchaseInvoiceSupplier,
} from '../../types/purchase-invoice.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  selectedInvoice?: PurchaseInvoiceListItem
  suppliers: PurchaseInvoiceSupplier[]
}>()
const emit = defineEmits<{ saved: [invoice: PurchaseInvoice] }>()

type InvoiceDraft = {
  supplier_id: string
  supplier_invoice_number: string
  invoice_date: string
  due_date: string
  rounding_amount: number | string
  notes: string
}

function currentLocalDate() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const initialDraft = (): InvoiceDraft => ({
  supplier_id: '',
  supplier_invoice_number: '',
  invoice_date: currentLocalDate(),
  due_date: '',
  rounding_amount: 0,
  notes: '',
})
const form = ref<InvoiceDraft>(initialDraft())
const currentInvoice = ref<PurchaseInvoice>()
const invoiceableReceipts = ref<PurchaseInvoiceReceiptOption[]>([])
const selectedReceiptIds = ref<number[]>([])
const step = ref<1 | 2>(1)
const loading = ref(false)
const loadingDetail = ref(false)
const loadingReceipts = ref(false)
const receiptLoadFailed = ref(false)
const errors = ref<Record<string, string>>({})
const generalError = ref('')
const isEdit = computed(() => !!props.selectedInvoice)
const currencyFormat = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const selectedReceipts = computed(() => invoiceableReceipts.value.filter(receipt => selectedReceiptIds.value.includes(receipt.id)))
const supplierOptions = computed(() => props.suppliers.map(supplier => ({
  value: String(supplier.id),
  label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`,
})))
const totals = computed(() => {
  const subtotal = isEdit.value
    ? Number(currentInvoice.value?.items_subtotal ?? 0)
    : selectedReceipts.value.reduce((sum, receipt) => sum + Number(receipt.items_subtotal), 0)
  const discount = isEdit.value
    ? Number(currentInvoice.value?.discount_amount ?? 0)
    : selectedReceipts.value.reduce((sum, receipt) => sum + Number(receipt.discount_amount), 0)
  const tax = isEdit.value
    ? Number(currentInvoice.value?.tax_amount ?? 0)
    : selectedReceipts.value.reduce((sum, receipt) => sum + Number(receipt.tax_amount), 0)
  const rounding = Number(form.value.rounding_amount) || 0
  return { subtotal, discount, tax, rounding, grand: subtotal - discount + tax + rounding }
})
const formattedSelectedCount = computed(() => isEdit.value
  ? currentInvoice.value?.receipts.length ?? 0
  : selectedReceiptIds.value.length)

function resetForm() {
  form.value = initialDraft()
  currentInvoice.value = undefined
  invoiceableReceipts.value = []
  selectedReceiptIds.value = []
  step.value = 1
  errors.value = {}
  generalError.value = ''
  receiptLoadFailed.value = false
}

function errorFor(key: string) {
  return errors.value[key] ?? ''
}

async function loadInvoiceableReceipts() {
  if (!form.value.supplier_id) {
    invoiceableReceipts.value = []
    selectedReceiptIds.value = []
    return
  }
  loadingReceipts.value = true
  receiptLoadFailed.value = false
  generalError.value = ''
  try {
    invoiceableReceipts.value = await purchaseInvoiceService.getInvoiceableReceipts(Number(form.value.supplier_id))
    selectedReceiptIds.value = selectedReceiptIds.value.filter(id =>
      invoiceableReceipts.value.some(receipt => receipt.id === id),
    )
  } catch (error) {
    receiptLoadFailed.value = true
    generalError.value = normalizeError(error).message
  } finally {
    loadingReceipts.value = false
  }
}

async function loadInvoice() {
  if (!props.selectedInvoice) return
  loadingDetail.value = true
  try {
    const invoice = await purchaseInvoiceService.show(props.selectedInvoice.id)
    currentInvoice.value = invoice
    form.value = {
      supplier_id: String(invoice.supplier_id),
      supplier_invoice_number: invoice.supplier_invoice_number,
      invoice_date: String(invoice.invoice_date).slice(0, 10),
      due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : '',
      rounding_amount: Number(invoice.rounding_amount),
      notes: invoice.notes ?? '',
    }
    step.value = 2
  } catch (error) {
    generalError.value = normalizeError(error).message
  } finally {
    loadingDetail.value = false
  }
}

watch(open, async isOpen => {
  if (!isOpen) return
  resetForm()
  if (props.selectedInvoice) {
    await loadInvoice()
  }
})

watch(() => form.value.supplier_id, async (supplierId, previousSupplierId) => {
  if (isEdit.value || !supplierId || supplierId === previousSupplierId) return
  if (previousSupplierId) selectedReceiptIds.value = []
  await loadInvoiceableReceipts()
})

function toggleReceipt(receiptId: number, checked: boolean) {
  selectedReceiptIds.value = checked
    ? [...new Set([...selectedReceiptIds.value, receiptId])]
    : selectedReceiptIds.value.filter(id => id !== receiptId)
}

function continueToDetails() {
  errors.value = {}
  generalError.value = ''
  if (!form.value.supplier_id) {
    errors.value.supplier_id = 'Pilih supplier terlebih dahulu.'
    return
  }
  if (selectedReceiptIds.value.length === 0) {
    generalError.value = 'Pilih minimal satu penerimaan barang yang siap difakturkan.'
    return
  }
  step.value = 2
}

function backToReceipts() {
  if (isEdit.value) return
  errors.value = {}
  generalError.value = ''
  step.value = 1
}

async function submit() {
  errors.value = {}
  generalError.value = ''
  if (!form.value.supplier_invoice_number.trim()) {
    errors.value.supplier_invoice_number = 'Nomor faktur supplier wajib diisi.'
    return
  }
  if (!form.value.invoice_date) {
    errors.value.invoice_date = 'Tanggal faktur wajib diisi.'
    return
  }
  if (form.value.due_date && form.value.due_date < form.value.invoice_date) {
    errors.value.due_date = 'Jatuh tempo tidak boleh sebelum tanggal faktur.'
    return
  }
  if (totals.value.grand < 0) {
    errors.value.rounding_amount = 'Pembulatan tidak boleh membuat total faktur negatif.'
    return
  }

  const payload: PurchaseInvoicePayload = {
    supplier_invoice_number: form.value.supplier_invoice_number.trim(),
    invoice_date: form.value.invoice_date,
    due_date: form.value.due_date || null,
    rounding_amount: Number(form.value.rounding_amount) || 0,
    notes: form.value.notes.trim() || null,
    ...(!isEdit.value
      ? { supplier_id: Number(form.value.supplier_id), goods_receipt_ids: selectedReceiptIds.value }
      : {}),
  }

  loading.value = true
  try {
    const invoice = isEdit.value && props.selectedInvoice
      ? await purchaseInvoiceService.update(props.selectedInvoice.id, payload)
      : await purchaseInvoiceService.create(payload)
    emit('saved', invoice)
    open.value = false
  } catch (error) {
    const normalized = normalizeError(error)
    if (normalized.status === 422) {
      errors.value = normalized.errors
      generalError.value = normalized.message
    } else {
      generalError.value = normalized.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-3xl" @interact-outside.prevent>
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="File01Icon" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <DialogTitle>{{ isEdit ? 'Ubah draft faktur' : 'Faktur pembelian baru' }}</DialogTitle>
            <DialogDescription>
              {{ isEdit ? 'Perbarui informasi faktur. Penerimaan yang ditagih tidak dapat diubah.' : 'Pilih penerimaan supplier, lalu lengkapi informasi faktur.' }}
            </DialogDescription>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-2 text-xs">
          <Badge :variant="step === 1 ? 'default' : 'secondary'">1. Penerimaan</Badge>
          <span class="h-px w-6 bg-border" />
          <Badge :variant="step === 2 ? 'default' : 'secondary'">2. Data faktur</Badge>
        </div>
      </DialogHeader>

      <div class="max-h-[calc(94dvh-190px)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        <Alert v-if="generalError" variant="destructive">
          <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
          <AlertTitle>{{ receiptLoadFailed ? 'Penerimaan gagal dimuat' : 'Faktur belum tersimpan' }}</AlertTitle>
          <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
            <span>{{ generalError }}</span>
            <Button v-if="receiptLoadFailed && form.supplier_id" type="button" variant="outline" size="sm" @click="loadInvoiceableReceipts">Coba lagi</Button>
          </AlertDescription>
        </Alert>

        <div v-if="loadingDetail" class="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Memuat faktur...
        </div>

        <template v-else-if="step === 1 && !isEdit">
          <Field :data-invalid="!!errorFor('supplier_id')">
            <FieldLabel for="invoice-supplier">Supplier</FieldLabel>
            <ComboboxSelect
              v-model="form.supplier_id"
              :options="supplierOptions"
              placeholder="Pilih supplier"
              search-placeholder="Cari supplier..."
              empty-text="Supplier tidak ditemukan."
              :disabled="loading || loadingReceipts"
            />
            <FieldError>{{ errorFor('supplier_id') }}</FieldError>
          </Field>

          <section class="overflow-hidden rounded-lg border">
            <div class="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-3">
              <div>
                <h3 class="text-sm font-semibold">Penerimaan siap difakturkan</h3>
                <p class="text-xs text-muted-foreground">Hanya penerimaan posted yang belum ditautkan ke faktur.</p>
              </div>
              <Badge variant="secondary">{{ selectedReceiptIds.length }} dipilih</Badge>
            </div>
            <div v-if="loadingReceipts" class="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Memuat penerimaan...
            </div>
            <div v-else-if="!form.supplier_id" class="p-8 text-center text-sm text-muted-foreground">
              Pilih supplier untuk melihat penerimaan yang siap difakturkan.
            </div>
            <div v-else-if="invoiceableReceipts.length === 0" class="p-8 text-center text-sm text-muted-foreground">
              Tidak ada penerimaan posted yang belum difakturkan untuk supplier ini.
            </div>
            <div v-else class="max-h-72 divide-y overflow-y-auto">
              <label
                v-for="receipt in invoiceableReceipts"
                :key="receipt.id"
                class="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  class="mt-1 size-4 accent-primary"
                  :checked="selectedReceiptIds.includes(receipt.id)"
                  :disabled="loading"
                  @change="toggleReceipt(receipt.id, ($event.target as HTMLInputElement).checked)"
                >
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-medium">{{ receipt.document_number }}</span>
                    <span class="font-medium">{{ currencyFormat.format(Number(receipt.grand_total)) }}</span>
                  </span>
                  <span class="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{{ dateFormat.format(new Date(receipt.receipt_date)) }}</span>
                    <span v-if="receipt.warehouse_name">Gudang: {{ receipt.warehouse_name }}</span>
                    <span v-if="receipt.delivery_note_number">Surat jalan: {{ receipt.delivery_note_number }}</span>
                  </span>
                </span>
              </label>
            </div>
          </section>
        </template>

        <template v-else-if="step === 2 && !loadingDetail">
          <Alert v-if="isEdit && currentInvoice" variant="default">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" />
            <AlertTitle>{{ currentInvoice.supplier_name }}</AlertTitle>
            <AlertDescription>
              {{ formattedSelectedCount }} penerimaan ditagihkan:
              {{ currentInvoice.receipts.map(receipt => receipt.document_number).join(', ') }}
            </AlertDescription>
          </Alert>
          <div v-else class="rounded-lg border bg-muted/20 p-3 text-sm">
            <p class="font-medium">Supplier: {{ suppliers.find(supplier => String(supplier.id) === form.supplier_id)?.name }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ formattedSelectedCount }} penerimaan dipilih</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="!!errorFor('supplier_invoice_number')">
              <FieldLabel for="supplier-invoice-number">Nomor faktur supplier</FieldLabel>
              <Input id="supplier-invoice-number" v-model="form.supplier_invoice_number" maxlength="50" placeholder="Nomor pada faktur supplier" :disabled="loading" :aria-invalid="!!errorFor('supplier_invoice_number')" />
              <FieldError>{{ errorFor('supplier_invoice_number') }}</FieldError>
            </Field>
            <Field :data-invalid="!!errorFor('invoice_date')">
              <FieldLabel for="supplier-invoice-date">Tanggal faktur</FieldLabel>
              <Input id="supplier-invoice-date" v-model="form.invoice_date" type="date" :disabled="loading" :aria-invalid="!!errorFor('invoice_date')" />
              <FieldError>{{ errorFor('invoice_date') }}</FieldError>
            </Field>
            <Field :data-invalid="!!errorFor('due_date')">
              <FieldLabel for="supplier-invoice-due-date">Jatuh tempo (opsional)</FieldLabel>
              <Input id="supplier-invoice-due-date" v-model="form.due_date" type="date" :min="form.invoice_date" :disabled="loading" :aria-invalid="!!errorFor('due_date')" />
              <FieldError>{{ errorFor('due_date') }}</FieldError>
              <p class="text-xs text-muted-foreground">Kosongkan untuk mengikuti tempo pembayaran supplier.</p>
            </Field>
            <Field :data-invalid="!!errorFor('rounding_amount')">
              <FieldLabel for="supplier-invoice-rounding">Pembulatan / selisih</FieldLabel>
              <Input id="supplier-invoice-rounding" v-model.number="form.rounding_amount" type="number" step="1" placeholder="0" :disabled="loading" :aria-invalid="!!errorFor('rounding_amount')" />
              <FieldError>{{ errorFor('rounding_amount') }}</FieldError>
              <p class="text-xs text-muted-foreground">Boleh positif atau negatif, maksimal 4 desimal.</p>
            </Field>
            <Field class="sm:col-span-2" :data-invalid="!!errorFor('notes')">
              <FieldLabel for="supplier-invoice-notes">Catatan (opsional)</FieldLabel>
              <Textarea id="supplier-invoice-notes" v-model="form.notes" rows="2" maxlength="1000" placeholder="Catatan internal faktur" :disabled="loading" />
              <FieldError>{{ errorFor('notes') }}</FieldError>
            </Field>
          </div>

          <section class="ml-auto grid w-full max-w-md gap-2 rounded-lg border bg-muted/10 p-4 text-sm">
            <div class="flex justify-between"><span class="text-muted-foreground">Subtotal penerimaan</span><span>{{ currencyFormat.format(totals.subtotal) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Diskon penerimaan</span><span>-{{ currencyFormat.format(totals.discount) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Pajak</span><span>{{ currencyFormat.format(totals.tax) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Pembulatan</span><span>{{ currencyFormat.format(totals.rounding) }}</span></div>
            <div class="flex justify-between border-t pt-2 text-base font-semibold"><span>Total faktur</span><span>{{ currencyFormat.format(totals.grand) }}</span></div>
            <p class="text-xs text-muted-foreground">Total final dihitung ulang oleh server dari penerimaan yang dipilih.</p>
          </section>
        </template>
      </div>

      <DialogFooter class="flex-col-reverse gap-2 border-t bg-muted/20 px-4 mb-0  sm:flex-row sm:justify-between sm:px-6">
        <Button type="button" variant="outline" :disabled="loading" @click="open = false">Batal</Button>
        <div class="flex flex-col-reverse gap-2 sm:flex-row">
          <Button v-if="step === 2 && !isEdit" type="button" variant="outline" :disabled="loading" @click="backToReceipts">Kembali ke penerimaan</Button>
          <Button v-if="step === 1 && !isEdit" type="button" :disabled="loading || loadingReceipts || receiptLoadFailed" @click="continueToDetails">Lanjutkan</Button>
          <Button v-else-if="step === 2" type="button" :disabled="loading || loadingDetail || !currentInvoice && isEdit" @click="submit">
            <Spinner v-if="loading" />{{ loading ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Simpan draft faktur' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
