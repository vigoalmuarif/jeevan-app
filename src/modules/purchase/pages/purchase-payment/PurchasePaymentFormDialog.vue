<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Alert02Icon, CreditCardIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import ComboboxSelect from '@/components/ui/combobox/ComboboxSelect.vue'
import MoneyInput from '@/components/ui/input-group/MoneyInput.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { normalizeError } from '@/lib/errors'
import { purchasePaymentService } from '../../services/purchase-payment.service'
import type { PayablePurchaseInvoice, PurchasePayment, PurchasePaymentMethod, PurchasePaymentPayload } from '../../types/purchase-payment.types'
import type { PurchaseInvoiceSupplier } from '../../types/purchase-invoice.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  suppliers: PurchaseInvoiceSupplier[]
  initialSupplierId?: number
  initialInvoiceId?: number
}>()
const emit = defineEmits<{ saved: [payment: PurchasePayment] }>()

const paymentMethods: Array<{ value: PurchasePaymentMethod; label: string }> = [
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer Bank' },
  { value: 'giro', label: 'Giro / Cek' },
  { value: 'other', label: 'Lainnya' },
]
const supplierOptions = computed(() => props.suppliers.map(supplier => ({
  value: String(supplier.id),
  label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`,
})))
const methodOptions = paymentMethods.map(method => ({ value: method.value, label: method.label }))
function currentLocalDate() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
const form = ref({
  supplier_id: '',
  payment_date: currentLocalDate(),
  payment_method: 'transfer' as PurchasePaymentMethod,
  amount: '' as number | string,
  reference_number: '',
  notes: '',
})
const payableInvoices = ref<PayablePurchaseInvoice[]>([])
const selectedInvoiceIds = ref<number[]>([])
const loadingInvoices = ref(false)
const loading = ref(false)
const loadFailed = ref(false)
const errors = ref<Record<string, string>>({})
const generalError = ref('')
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const selectedInvoices = computed(() => payableInvoices.value.filter(invoice => selectedInvoiceIds.value.includes(invoice.id)))
const selectedMaximum = computed(() => selectedInvoices.value.reduce((sum, invoice) => sum + Number(invoice.balance_amount), 0))
const allocations = computed(() => {
  let remaining = Number(form.value.amount) || 0
  if (!Number.isFinite(remaining) || remaining <= 0) return []
  const rows: Array<{ purchase_invoice_id: number; amount: number }> = []
  for (const invoice of payableInvoices.value) {
    if (!selectedInvoiceIds.value.includes(invoice.id) || remaining <= 0) continue
    const balance = Number(invoice.balance_amount)
    const amount = Math.round(Math.min(balance, remaining) * 10000) / 10000
    if (amount > 0) rows.push({ purchase_invoice_id: invoice.id, amount })
    remaining = Math.round((remaining - amount) * 10000) / 10000
  }
  return rows
})
const allocatedTotal = computed(() => allocations.value.reduce((sum, allocation) => sum + allocation.amount, 0))
const undistributedAmount = computed(() => Math.max(0, (Number(form.value.amount) || 0) - allocatedTotal.value))

function resetForm() {
  form.value = {
    supplier_id: props.initialSupplierId ? String(props.initialSupplierId) : '',
    payment_date: currentLocalDate(),
    payment_method: 'transfer',
    amount: '',
    reference_number: '',
    notes: '',
  }
  payableInvoices.value = []
  selectedInvoiceIds.value = []
  loadingInvoices.value = false
  loadFailed.value = false
  errors.value = {}
  generalError.value = ''
}

async function loadPayableInvoices() {
  if (!form.value.supplier_id) {
    payableInvoices.value = []
    selectedInvoiceIds.value = []
    return
  }
  loadingInvoices.value = true
  loadFailed.value = false
  generalError.value = ''
  selectedInvoiceIds.value = []
  form.value.amount = ''
  try {
    payableInvoices.value = await purchasePaymentService.getPayableInvoices(Number(form.value.supplier_id))
    const preferredInvoice = props.initialInvoiceId
      ? payableInvoices.value.find(invoice => invoice.id === props.initialInvoiceId)
      : undefined
    selectedInvoiceIds.value = preferredInvoice
      ? [preferredInvoice.id]
      : payableInvoices.value.map(invoice => invoice.id)
    if (preferredInvoice) form.value.amount = Number(preferredInvoice.balance_amount)
  } catch (error) {
    loadFailed.value = true
    generalError.value = normalizeError(error).message
  } finally {
    loadingInvoices.value = false
  }
}

watch(open, async isOpen => {
  if (!isOpen) return
  resetForm()
  if (form.value.supplier_id) await loadPayableInvoices()
})
async function handleSupplierChange(value: string | number | null) {
  form.value.supplier_id = value === null ? '' : String(value)
  if (!form.value.supplier_id) {
    payableInvoices.value = []
    selectedInvoiceIds.value = []
    form.value.amount = ''
    return
  }
  errors.value = {}
  await loadPayableInvoices()
}

function toggleInvoice(invoiceId: number, checked: boolean) {
  selectedInvoiceIds.value = checked
    ? [...new Set([...selectedInvoiceIds.value, invoiceId])]
    : selectedInvoiceIds.value.filter(id => id !== invoiceId)
}

function errorFor(field: string) {
  return errors.value[field] ?? ''
}

async function submit() {
  errors.value = {}
  generalError.value = ''
  if (!form.value.supplier_id) {
    errors.value.supplier_id = 'Pilih supplier terlebih dahulu.'
    return
  }
  if (!form.value.payment_date) {
    errors.value.payment_date = 'Tanggal pembayaran wajib diisi.'
    return
  }
  const amount = Number(form.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.value.amount = 'Masukkan nominal pembayaran lebih dari 0.'
    return
  }
  if (!allocations.value.length) {
    errors.value.amount = 'Nominal pembayaran tidak dapat dialokasikan. Pilih faktur yang akan dibayar.'
    return
  }
  if (undistributedAmount.value > 0) {
    errors.value.amount = 'Nominal pembayaran melebihi sisa hutang faktur yang dipilih.'
    return
  }

  const payload: PurchasePaymentPayload = {
    supplier_id: Number(form.value.supplier_id),
    payment_date: form.value.payment_date,
    payment_method: form.value.payment_method,
    reference_number: form.value.reference_number.trim() || null,
    notes: form.value.notes.trim() || null,
    amount: allocatedTotal.value,
    allocations: allocations.value,
  }

  loading.value = true
  try {
    const payment = await purchasePaymentService.create(payload)
    emit('saved', payment)
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
            <HugeiconsIcon :icon="CreditCardIcon" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <DialogTitle>Pembayaran supplier</DialogTitle>
            <DialogDescription>Pembayaran langsung diposting. Nominal akan dialokasikan ke faktur berdasarkan jatuh tempo terdekat.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="max-h-[calc(94dvh-150px)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        <Alert v-if="generalError" variant="destructive">
          <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
          <AlertTitle>{{ loadFailed ? 'Faktur terutang gagal dimuat' : 'Pembayaran belum tersimpan' }}</AlertTitle>
          <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
            <span>{{ generalError }}</span>
            <Button v-if="loadFailed && form.supplier_id" type="button" variant="outline" size="sm" @click="loadPayableInvoices">Coba lagi</Button>
          </AlertDescription>
        </Alert>

        <div class="grid gap-4 sm:grid-cols-2">
          <Field :data-invalid="!!errorFor('supplier_id')" class="sm:col-span-2">
            <FieldLabel>Supplier</FieldLabel>
            <ComboboxSelect
              v-model="form.supplier_id"
              :options="supplierOptions"
              placeholder="Pilih supplier"
              search-placeholder="Cari supplier..."
              empty-text="Supplier tidak ditemukan."
              :disabled="loading || loadingInvoices"
              @update:model-value="handleSupplierChange"
            />
            <FieldError>{{ errorFor('supplier_id') }}</FieldError>
          </Field>
          <Field :data-invalid="!!errorFor('payment_date')">
            <FieldLabel for="payment-date">Tanggal pembayaran</FieldLabel>
            <Input id="payment-date" v-model="form.payment_date" type="date" :disabled="loading" :aria-invalid="!!errorFor('payment_date')" />
            <FieldError>{{ errorFor('payment_date') }}</FieldError>
          </Field>
          <Field :data-invalid="!!errorFor('payment_method')">
            <FieldLabel>Metode pembayaran</FieldLabel>
            <ComboboxSelect
              v-model="form.payment_method"
              :options="methodOptions"
              placeholder="Pilih metode"
              search-placeholder="Cari metode..."
              empty-text="Metode tidak ditemukan."
              :disabled="loading"
            />
            <FieldError>{{ errorFor('payment_method') }}</FieldError>
          </Field>
          <Field :data-invalid="!!errorFor('amount')" class="sm:col-span-2">
            <FieldLabel for="payment-amount">Nominal pembayaran</FieldLabel>
            <MoneyInput
              v-model="form.amount"
              class="w-full"
              placeholder="Masukkan nominal pembayaran"
              :disabled="loading || loadingInvoices || selectedInvoiceIds.length === 0"
            />
            <FieldError>{{ errorFor('amount') }}</FieldError>
            <p class="text-xs text-muted-foreground">Maksimal untuk faktur terpilih: {{ currencyFormat.format(selectedMaximum) }}. Alokasi dilakukan FIFO berdasarkan jatuh tempo.</p>
          </Field>
          <Field :data-invalid="!!errorFor('reference_number')">
            <FieldLabel for="payment-reference">No. referensi (opsional)</FieldLabel>
            <Input id="payment-reference" v-model="form.reference_number" maxlength="50" placeholder="No. transfer / giro" :disabled="loading" :aria-invalid="!!errorFor('reference_number')" />
            <FieldError>{{ errorFor('reference_number') }}</FieldError>
          </Field>
          <Field :data-invalid="!!errorFor('notes')">
            <FieldLabel for="payment-notes">Catatan (opsional)</FieldLabel>
            <Input id="payment-notes" v-model="form.notes" maxlength="1000" placeholder="Catatan pembayaran" :disabled="loading" :aria-invalid="!!errorFor('notes')" />
            <FieldError>{{ errorFor('notes') }}</FieldError>
          </Field>
        </div>

        <section class="overflow-hidden rounded-lg border">
          <div class="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-3">
            <div>
              <h3 class="text-sm font-semibold">Faktur terutang</h3>
              <p class="text-xs text-muted-foreground">Pilih faktur yang akan menerima alokasi pembayaran.</p>
            </div>
            <Badge variant="secondary">{{ selectedInvoiceIds.length }} dipilih</Badge>
          </div>
          <div v-if="loadingInvoices" class="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Memuat faktur terutang...
          </div>
          <div v-else-if="!form.supplier_id" class="p-7 text-center text-sm text-muted-foreground">
            Pilih supplier untuk melihat faktur yang belum lunas.
          </div>
          <div v-else-if="payableInvoices.length === 0" class="p-7 text-center text-sm text-muted-foreground">
            Supplier ini tidak memiliki faktur posted dengan sisa hutang.
          </div>
          <div v-else class="max-h-64 divide-y overflow-y-auto">
            <label v-for="invoice in payableInvoices" :key="invoice.id" class="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/30">
              <input
                type="checkbox"
                class="mt-1 size-4 accent-primary"
                :checked="selectedInvoiceIds.includes(invoice.id)"
                :disabled="loading"
                @change="toggleInvoice(invoice.id, ($event.target as HTMLInputElement).checked)"
              >
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-medium">{{ invoice.document_number }} <span class="font-normal text-muted-foreground">· {{ invoice.supplier_invoice_number }}</span></span>
                  <span class="font-medium">{{ currencyFormat.format(Number(invoice.balance_amount)) }}</span>
                </span>
                <span class="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>Jatuh tempo: {{ invoice.due_date ? dateFormat.format(new Date(invoice.due_date)) : '—' }}</span>
                  <Badge v-if="invoice.is_overdue" variant="destructive" class="h-5">Terlambat</Badge>
                  <span>Sudah dibayar {{ currencyFormat.format(Number(invoice.paid_amount)) }}</span>
                </span>
              </span>
            </label>
          </div>
        </section>

        <section v-if="allocations.length" class="space-y-2 rounded-lg border p-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">Pratinjau alokasi FIFO</h3>
            <span class="text-sm font-semibold">{{ currencyFormat.format(allocatedTotal) }}</span>
          </div>
          <div v-for="allocation in allocations" :key="allocation.purchase_invoice_id" class="flex justify-between gap-3 text-sm">
            <span class="min-w-0 truncate text-muted-foreground">{{ payableInvoices.find(invoice => invoice.id === allocation.purchase_invoice_id)?.document_number }}</span>
            <span>{{ currencyFormat.format(allocation.amount) }}</span>
          </div>
          <p v-if="undistributedAmount > 0" class="border-t pt-2 text-sm text-destructive">
            Sisa {{ currencyFormat.format(undistributedAmount) }} tidak dapat dialokasikan karena melebihi saldo faktur terpilih.
          </p>
        </section>

        <Alert>
          <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
          <AlertTitle>Pembayaran bersifat final</AlertTitle>
          <AlertDescription>Pembayaran akan langsung dicatat dan tidak dapat diedit atau dihapus. Kesalahan dikoreksi dengan membatalkan pembayaran.</AlertDescription>
        </Alert>
      </div>

      <DialogFooter class="flex-col-reverse gap-2 border-t bg-muted/20 px-4 mb-0 py-3 sm:flex-row sm:justify-between sm:px-6">
        <Button type="button" variant="outline" :disabled="loading" @click="open = false">Batal</Button>
        <Button type="button" :disabled="loading || loadingInvoices || loadFailed || !allocations.length || undistributedAmount > 0" @click="submit">
          <Spinner v-if="loading" />{{ loading ? 'Menyimpan...' : 'Simpan pembayaran' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
