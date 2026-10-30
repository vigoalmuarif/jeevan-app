<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Alert02Icon,
  Calendar02Icon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  File01Icon,
  HelpCircleIcon,
  Loading03Icon,
  RotateCcw,
  WarehouseIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import ServerComboBox from '@/components/server-combobox/ServerComboBox.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'
import { purchaseReturnService } from '../../services/purchase-return.service'
import type {
  PurchaseReturn,
  PurchaseReturnPayload,
  ReturnableReceipt,
  ReturnableReceiptItem,
  ReturnReason,
  SettlementMethod,
} from '../../types/purchase-return.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ editReturn?: PurchaseReturn }>()
const emit = defineEmits<{ saved: [data: PurchaseReturn] }>()

const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const selectedReceipt = ref<ReturnableReceipt | null>(null)
const returnableItems = ref<ReturnableReceiptItem[]>([])

const form = ref<{
  goods_receipt_id: number | null
  return_date: string
  settlement_method: SettlementMethod
  reason_code: ReturnReason
  notes: string
  items: {
    goods_receipt_item_id: number
    product_name: string
    variant_name: string
    sku: string
    unit_name: string
    available_qty: number
    unit_price: number
    unit_quantity: number
    reason: string
  }[]
}>({
  goods_receipt_id: null,
  return_date: new Date().toISOString().split('T')[0] ?? '',
  settlement_method: 'invoice_deduction',
  reason_code: 'damaged',
  notes: '',
  items: [],
})

const currencyFormat = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const totalActiveItems = computed(() => {
  return form.value.items.filter(item => (Number(item.unit_quantity) || 0) > 0).length
})

const estimatedGrandTotal = computed(() => {
  return form.value.items.reduce((sum, item) => {
    return sum + (Number(item.unit_quantity) || 0) * (Number(item.unit_price) || 0)
  }, 0)
})

const settlementDescription = computed(() => {
  switch (form.value.settlement_method) {
    case 'invoice_deduction':
      return 'Otomatis mengurangi sisa tagihan/hutang pada faktur pembelian asal.'
    case 'cash_refund':
      return 'Supplier mengembalikan dana via transfer rekening atau pembayaran tunai.'
    case 'credit_balance':
      return 'Dicatat sebagai saldo deposit untuk transaksi pembelian berikutnya.'
    default:
      return ''
  }
})

// Format tanggal dan waktu ke format 'd-m-Y H:i'
function formatDateTime(val?: string | Date | null): string {
  if (!val) return '—'

  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split('-')
    return `${d}-${m}-${y} 00:00`
  }

  const date = new Date(val)
  if (isNaN(date.getTime())) return String(val)

  const pad = (n: number) => String(n).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

// Fetcher untuk ServerComboBox dokumen penerimaan (Goods Receipt)
const receiptFetcher: ComboboxFetcher = async (search: string) => {
  try {
    const receipts = await purchaseReturnService.getReturnableReceipts(search)
    return receipts.map(r => {
      const dateFormatted = formatDateTime(r.created_at || r.receipt_date)
      return {
        id: r.id,
        label: `${r.document_number} — ${r.supplier?.name ?? 'Supplier'} (${dateFormatted})`,
        document_number: r.document_number,
        formatted_date: dateFormatted,
        receipt_date: r.receipt_date,
        supplier_name: r.supplier?.name ?? 'Supplier',
        warehouse_name: r.warehouse?.name ?? 'Gudang',
        grand_total: r.grand_total,
        raw: r,
      }
    })
  } catch (err: any) {
    return []
  }
}

const initialReceiptOption = computed(() => {
  if (props.editReturn?.goods_receipt) {
    const gr = props.editReturn.goods_receipt
    const dateFormatted = formatDateTime(gr.created_at || gr.receipt_date)
    return {
      id: gr.id,
      label: `${gr.document_number} — ${props.editReturn.supplier?.name ?? 'Supplier'} (${dateFormatted})`,
      document_number: gr.document_number,
      formatted_date: dateFormatted,
      receipt_date: gr.receipt_date,
      supplier_name: props.editReturn.supplier?.name ?? 'Supplier',
      warehouse_name: props.editReturn.warehouse?.name ?? 'Gudang',
      grand_total: 0,
      raw: gr,
    }
  }
  if (selectedReceipt.value) {
    const dateFormatted = formatDateTime(selectedReceipt.value.created_at || selectedReceipt.value.receipt_date)
    return {
      id: selectedReceipt.value.id,
      label: `${selectedReceipt.value.document_number} — ${selectedReceipt.value.supplier?.name ?? 'Supplier'} (${dateFormatted})`,
      document_number: selectedReceipt.value.document_number,
      formatted_date: dateFormatted,
      receipt_date: selectedReceipt.value.receipt_date,
      supplier_name: selectedReceipt.value.supplier?.name ?? 'Supplier',
      warehouse_name: selectedReceipt.value.warehouse?.name ?? 'Gudang',
      grand_total: selectedReceipt.value.grand_total,
      raw: selectedReceipt.value,
    }
  }
  return null
})

async function onReceiptSelect(option: any) {
  if (!option) {
    form.value.goods_receipt_id = null
    selectedReceipt.value = null
    form.value.items = []
    return
  }

  const receiptId = Number(option.id)
  form.value.goods_receipt_id = receiptId
  selectedReceipt.value = (option.raw ?? option) as ReturnableReceipt
  await loadReceiptItems(receiptId)
}

async function loadReceiptItems(receiptId: number) {
  form.value.items = []
  try {
    isLoading.value = true
    const items = await purchaseReturnService.getReturnableItems(receiptId)
    returnableItems.value = items
    form.value.items = items
      .filter(item => item.available_unit_quantity > 0)
      .map(item => ({
        goods_receipt_item_id: item.goods_receipt_item_id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        unit_name: item.unit_name,
        available_qty: item.available_unit_quantity,
        unit_price: item.unit_price,
        unit_quantity: 0,
        reason: '',
      }))
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat item penerimaan.'
  } finally {
    isLoading.value = false
  }
}

function setMaxQuantity(item: any) {
  item.unit_quantity = item.available_qty
}

watch(open, async (newVal) => {
  if (newVal) {
    errorMessage.value = null
    if (props.editReturn) {
      form.value = {
        goods_receipt_id: props.editReturn.goods_receipt_id,
        return_date: props.editReturn.return_date,
        settlement_method: props.editReturn.settlement_method,
        reason_code: props.editReturn.reason_code,
        notes: props.editReturn.notes || '',
        items: props.editReturn.items.map(item => ({
          goods_receipt_item_id: item.goods_receipt_item_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          sku: item.sku,
          unit_name: item.unit_name,
          available_qty: Number(item.unit_quantity),
          unit_price: Number(item.unit_price),
          unit_quantity: Number(item.unit_quantity),
          reason: item.reason || '',
        })),
      }
      selectedReceipt.value = {
        id: props.editReturn.goods_receipt_id,
        document_number: props.editReturn.goods_receipt?.document_number ?? '',
        receipt_date: props.editReturn.goods_receipt?.receipt_date ?? '',
        created_at: props.editReturn.goods_receipt?.created_at,
        supplier_id: props.editReturn.supplier_id,
        warehouse_id: props.editReturn.warehouse_id,
        grand_total: props.editReturn.grand_total,
        supplier: props.editReturn.supplier,
        warehouse: props.editReturn.warehouse,
      } as ReturnableReceipt
    } else {
      form.value = {
        goods_receipt_id: null,
        return_date: new Date().toISOString().split('T')[0] ?? '',
        settlement_method: 'invoice_deduction',
        reason_code: 'damaged',
        notes: '',
        items: [],
      }
      selectedReceipt.value = null
    }
  }
})

async function handleSubmit() {
  errorMessage.value = null
  if (!form.value.goods_receipt_id) {
    errorMessage.value = 'Silakan pilih dokumen penerimaan barang terlebih dahulu.'
    return
  }

  const validItems = form.value.items
    .filter(item => Number(item.unit_quantity) > 0)
    .map(item => ({
      goods_receipt_item_id: item.goods_receipt_item_id,
      unit_quantity: Number(item.unit_quantity),
      reason: item.reason,
    }))

  if (validItems.length === 0) {
    errorMessage.value = 'Minimal harus ada 1 item dengan kuantitas retur lebih besar dari 0.'
    return
  }

  const invalid = form.value.items.find(
    item => Number(item.unit_quantity) > item.available_qty
  )
  if (invalid) {
    errorMessage.value = `Jumlah retur untuk ${invalid.product_name} (${invalid.unit_quantity}) melebihi sisa barang yang dapat diretur (${invalid.available_qty}).`
    return
  }

  const payload: PurchaseReturnPayload = {
    goods_receipt_id: form.value.goods_receipt_id,
    return_date: form.value.return_date,
    settlement_method: form.value.settlement_method,
    reason_code: form.value.reason_code,
    notes: form.value.notes,
    items: validItems,
  }

  try {
    isSubmitting.value = true
    let result: PurchaseReturn
    if (props.editReturn) {
      result = await purchaseReturnService.update(props.editReturn.id, payload)
    } else {
      result = await purchaseReturnService.store(payload)
    }
    open.value = false
    emit('saved', result)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal menyimpan retur pembelian.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[94dvh] max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl"
      @pointer-down-outside.prevent
      @interact-outside.prevent
    >
      <!-- Header Dialog -->
      <DialogHeader class="border-b px-5 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="RotateCcw" class="h-5 w-5" />
          </div>
          <div>
            <DialogTitle class="text-lg font-bold sm:text-xl">
              {{ editReturn ? 'Ubah Draft Retur Pembelian' : 'Buat Retur Pembelian & Debit Note' }}
            </DialogTitle>
            <DialogDescription class="text-xs sm:text-sm">
              Kembalikan barang ke supplier berdasarkan dokumen penerimaan fisik yang telah dibukukan.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Body / Scrollable Form Content -->
      <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-6">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive flex items-start gap-2.5"
        >
          <HugeiconsIcon :icon="Alert02Icon" class="h-5 w-5 shrink-0 mt-0.5" />
          <div class="flex-1 font-medium">{{ errorMessage }}</div>
        </div>

        <!-- Section 1: Informasi Dokumen Retur -->
        <section class="overflow-hidden rounded-xl border">
          <header class="flex flex-col gap-3 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-b">
            <div class="min-w-0">
              <h3 class="text-sm font-semibold">Informasi Dokumen Retur</h3>
              <p class="text-xs text-muted-foreground">
                Tentukan rujukan penerimaan barang, tanggal retur, dan metode Debit Note.
              </p>
            </div>
          </header>

          <div class="p-4 sm:p-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Pilihan Goods Receipt via ServerComboBox -->
              <div class="space-y-1.5 sm:col-span-2 min-w-0">
                <Label class="text-xs font-semibold">
                  Rujukan Dokumen Penerimaan (Goods Receipt) *
                </Label>
                <ServerComboBox
                  :model-value="form.goods_receipt_id"
                  :fetcher="receiptFetcher"
                  value-key="id"
                  label-key="label"
                  placeholder="Pilih dokumen penerimaan barang..."
                  search-placeholder="Cari no. dokumen, supplier, atau tanggal..."
                  empty-text="Dokumen penerimaan tidak ditemukan."
                  :disabled="!!editReturn || isLoading"
                  :initial-option="initialReceiptOption"
                  class="h-9"
                  @select="onReceiptSelect"
                >
                  <template #option="{ option }">
                    <div class="flex flex-col py-0.5 text-left min-w-0">
                      <span class="font-medium text-foreground truncate">{{ option.document_number }}</span>
                      <span class="text-xs text-muted-foreground truncate">
                        {{ option.supplier_name }} · {{ option.formatted_date }}
                      </span>
                    </div>
                  </template>
                </ServerComboBox>
              </div>

              <!-- Tanggal Retur -->
              <div class="space-y-1.5 min-w-0">
                <Label for="return_date" class="text-xs font-semibold flex items-center gap-1">
                  <HugeiconsIcon :icon="Calendar02Icon" class="h-3.5 w-3.5 text-muted-foreground" />
                  Tanggal Retur *
                </Label>
                <Input id="return_date" v-model="form.return_date" type="date" class="h-9" />
              </div>

              <!-- Alasan Utama -->
              <div class="space-y-1.5 min-w-0">
                <Label for="reason_code" class="text-xs font-semibold flex items-center gap-1">
                  <HugeiconsIcon :icon="HelpCircleIcon" class="h-3.5 w-3.5 text-muted-foreground" />
                  Alasan Retur *
                </Label>
                <Select v-model="form.reason_code">
                  <SelectTrigger id="reason_code" class="h-9 w-full min-w-0 truncate">
                    <SelectValue class="truncate text-left" />
                  </SelectTrigger>
                  <SelectContent class="w-[--radix-select-trigger-width] max-w-[min(24rem,calc(100vw-2rem))]">
                    <SelectItem value="damaged">Barang Rusak / Cacat</SelectItem>
                    <SelectItem value="expired">Kadaluwarsa</SelectItem>
                    <SelectItem value="wrong_item">Salah Kirim Barang</SelectItem>
                    <SelectItem value="defective">Tidak Sesuai Spek</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Metode Penyelesaian (Debit Note) -->
              <div class="space-y-1.5 sm:col-span-2 min-w-0">
                <Label for="settlement_method" class="text-xs font-semibold flex items-center gap-1">
                  <HugeiconsIcon :icon="CreditCardIcon" class="h-3.5 w-3.5 text-muted-foreground" />
                  Metode Penyelesaian Finansial (Debit Note) *
                </Label>
                <Select v-model="form.settlement_method">
                  <SelectTrigger id="settlement_method" class="h-9 w-full min-w-0 truncate">
                    <SelectValue placeholder="Pilih metode penyelesaian..." class="truncate text-left" />
                  </SelectTrigger>
                  <SelectContent class="w-[--radix-select-trigger-width] max-w-[min(30rem,calc(100vw-2rem))]">
                    <SelectItem value="invoice_deduction">Potong Tagihan Faktur</SelectItem>
                    <SelectItem value="cash_refund">Pengembalian Kas / Tunai</SelectItem>
                    <SelectItem value="credit_balance">Saldo Deposit Supplier</SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-[11px] text-muted-foreground leading-snug">
                  {{ settlementDescription }}
                </p>
              </div>

              <!-- Catatan Tambahan -->
              <div class="space-y-1.5 sm:col-span-2 min-w-0">
                <Label for="notes" class="text-xs font-semibold">Catatan / No. Surat Jalan Pengembalian</Label>
                <Input
                  id="notes"
                  v-model="form.notes"
                  placeholder="Nomor surat jalan balasan atau keterangan khusus..."
                  class="h-9"
                />
              </div>
            </div>

            <!-- Banner Info Supplier & Gudang jika GR dipilih -->
            <div
              v-if="selectedReceipt"
              class="rounded-lg bg-muted/60 p-3 flex flex-wrap items-center justify-between gap-3 text-xs border"
            >
              <div class="flex items-center gap-2">
                <HugeiconsIcon :icon="DeliveryTruck01Icon" class="h-4 w-4 text-primary shrink-0" />
                <span>Supplier: <strong class="text-foreground text-sm font-semibold">{{ selectedReceipt.supplier?.name }}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <HugeiconsIcon :icon="WarehouseIcon" class="h-4 w-4 text-primary shrink-0" />
                <span>Gudang: <strong class="text-foreground text-sm font-semibold">{{ selectedReceipt.warehouse?.name }}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <HugeiconsIcon :icon="Calendar02Icon" class="h-4 w-4 text-primary shrink-0" />
                <span>Waktu Penerimaan: <strong class="text-foreground font-semibold">{{ formatDateTime(selectedReceipt.created_at || selectedReceipt.receipt_date) }}</strong></span>
              </div>
              <div class="text-muted-foreground">
                Total Pembelian Asal: <span class="font-medium text-foreground">{{ currencyFormat.format(Number(selectedReceipt.grand_total)) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Daftar Item Barang yang Diretur -->
        <section class="overflow-hidden rounded-xl border">
          <header class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3 border-b">
            <div>
              <h3 class="text-sm font-semibold">Daftar Barang yang Diretur</h3>
              <p class="text-xs text-muted-foreground">
                Tentukan kuantitas barang yang dikembalikan. Kuantitas tidak boleh melebihi sisa barang yang diterima.
              </p>
            </div>
            <div v-if="form.items.length > 0" class="text-xs font-medium bg-background border px-2.5 py-1 rounded-md">
              <span>{{ totalActiveItems }} dari {{ form.items.length }} item dipilih</span>
            </div>
          </header>

          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
            <HugeiconsIcon :icon="Loading03Icon" class="h-8 w-8 animate-spin text-primary" />
            <span class="text-sm text-muted-foreground mt-2">Memuat rincian item penerimaan...</span>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="form.items.length === 0"
            class="p-8 text-center"
          >
            <HugeiconsIcon :icon="File01Icon" class="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p class="text-sm font-medium text-foreground">
              {{ form.goods_receipt_id ? 'Semua barang pada penerimaan ini sudah pernah diretur sebelumnya.' : 'Belum ada dokumen penerimaan yang dipilih.' }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ form.goods_receipt_id ? 'Silakan pilih dokumen penerimaan barang yang lain.' : 'Gunakan pencarian dokumen di atas untuk memilih penerimaan barang.' }}
            </p>
          </div>

          <!-- Content: Cards on Mobile, Table on Desktop -->
          <div v-else>
            <!-- Mobile Card View (lg:hidden) -->
            <div class="space-y-3 p-3 lg:hidden">
              <div
                v-for="(item, idx) in form.items"
                :key="item.goods_receipt_item_id"
                class="rounded-xl border p-4 space-y-3 transition-colors"
                :class="item.unit_quantity > 0 ? 'bg-primary/5 border-primary/30' : 'bg-card'"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <span class="text-xs text-muted-foreground font-mono">#{{ idx + 1 }} · SKU {{ item.sku }}</span>
                    <h4 class="font-bold text-sm text-foreground truncate">{{ item.product_name }}</h4>
                    <p v-if="item.variant_name" class="text-xs text-muted-foreground">{{ item.variant_name }}</p>
                  </div>
                  <Badge variant="outline" class="shrink-0 text-xs">
                    Sisa: {{ item.available_qty }} {{ item.unit_name }}
                  </Badge>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
                  <div>Harga Satuan: <strong class="text-foreground">{{ currencyFormat.format(item.unit_price) }}</strong></div>
                  <div class="text-right">
                    Subtotal: <strong class="text-primary font-bold">{{ currencyFormat.format((item.unit_quantity || 0) * item.unit_price) }}</strong>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <Label class="text-xs font-semibold">Qty Retur ({{ item.unit_name }}):</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="h-5 px-1.5 text-xs text-primary"
                        @click="setMaxQuantity(item)"
                      >
                        Semua
                      </Button>
                    </div>
                    <Input
                      v-model.number="item.unit_quantity"
                      type="number"
                      step="any"
                      min="0"
                      :max="item.available_qty"
                      class="h-9 font-semibold text-right"
                    />
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs font-semibold">Keterangan Spesifik:</Label>
                    <Input v-model="item.reason" placeholder="Misal: 1 pecah/bocor" class="h-9 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop Table View (hidden lg:block) -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th class="py-3 px-4 w-12 text-center">#</th>
                    <th class="py-3 px-4">Nama Produk & Varian</th>
                    <th class="py-3 px-4 w-28 text-right">Sisa Diterima</th>
                    <th class="py-3 px-4 w-40 text-right">Qty Retur</th>
                    <th class="py-3 px-4 w-24">Satuan</th>
                    <th class="py-3 px-4 w-32 text-right">Harga Beli</th>
                    <th class="py-3 px-4 w-36 text-right">Nilai Retur</th>
                    <th class="py-3 px-4">Keterangan / Catatan Fisik</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  <tr
                    v-for="(item, idx) in form.items"
                    :key="item.goods_receipt_item_id"
                    class="transition-colors hover:bg-muted/30"
                    :class="item.unit_quantity > 0 ? 'bg-primary/[0.02]' : ''"
                  >
                    <td class="py-3 px-4 text-center text-xs text-muted-foreground">{{ idx + 1 }}</td>
                    <td class="py-3 px-4">
                      <div class="font-semibold text-foreground">{{ item.product_name }}</div>
                      <div class="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span v-if="item.variant_name" class="font-medium text-foreground/80">{{ item.variant_name }} ·</span>
                        <span class="font-mono text-muted-foreground/90">SKU: {{ item.sku }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <Badge variant="secondary" class="font-semibold text-xs">
                        {{ item.available_qty }}
                      </Badge>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center gap-1.5 justify-end">
                        <Input
                          v-model.number="item.unit_quantity"
                          type="number"
                          step="any"
                          min="0"
                          :max="item.available_qty"
                          class="h-8 w-24 text-right font-bold"
                          :class="item.unit_quantity > item.available_qty ? 'border-destructive focus-visible:ring-destructive' : ''"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          class="h-8 px-2 text-xs text-primary font-medium hover:bg-primary/10"
                          title="Isi jumlah maksimal"
                          @click="setMaxQuantity(item)"
                        >
                          Max
                        </Button>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-xs font-medium text-muted-foreground">{{ item.unit_name }}</td>
                    <td class="py-3 px-4 text-right text-xs text-muted-foreground">
                      {{ currencyFormat.format(item.unit_price) }}
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-foreground">
                      {{ currencyFormat.format((item.unit_quantity || 0) * item.unit_price) }}
                    </td>
                    <td class="py-3 px-4">
                      <Input
                        v-model="item.reason"
                        placeholder="Misal: kemasan bocor"
                        class="h-8 text-xs placeholder:text-muted-foreground/60"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer Action Buttons & Real-time Debit Note Summary -->
      <DialogFooter class="border-t px-5 py-3.5 sm:px-6 bg-muted/40 shrink-0 m-0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3.5">
          <!-- Ringkasan Finansial di Sisi Kiri / Atas -->
          <div class="flex items-center justify-between sm:justify-start gap-4">
            <div class="flex flex-col text-left">
              <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Total Nilai Retur (Debit Note):</span>
                <Badge variant="outline" class="font-normal text-[11px] px-1.5 py-0">
                  {{ totalActiveItems }} item dipilih
                </Badge>
              </span>
              <span class="text-lg sm:text-xl font-bold text-primary tracking-tight">
                {{ currencyFormat.format(estimatedGrandTotal) }}
              </span>
            </div>
          </div>

          <!-- Tombol Aksi di Sisi Kanan / Bawah -->
          <div class="flex items-center justify-end gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              class="flex-1 sm:flex-initial"
              :disabled="isSubmitting"
              @click="open = false"
            >
              Batal
            </Button>
            <Button
              type="button"
              :disabled="isSubmitting || totalActiveItems === 0"
              class="flex-1 sm:flex-initial font-semibold shadow-xs"
              @click="handleSubmit"
            >
              <HugeiconsIcon v-if="isSubmitting" :icon="Loading03Icon" class="mr-2 h-4 w-4 animate-spin" />
              {{ editReturn ? 'Perbarui Retur' : 'Simpan Draft Retur' }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
