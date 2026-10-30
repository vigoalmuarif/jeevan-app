<script setup lang="ts">
import { computed } from 'vue'
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  File01Icon,
  HelpCircleIcon,
  RotateCcw,
  WarehouseIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
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
import { useCan } from '@/core/composables/useCan'
import type { PurchaseReturn } from '../../types/purchase-return.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ returnData?: PurchaseReturn }>()
const emit = defineEmits<{
  post: [data: PurchaseReturn]
  void: [data: PurchaseReturn]
}>()
const { can } = useCan()

const currencyFormat = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const quantityFormat = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 4,
})

/**
 * Format tanggal dan waktu menjadi format 'd-m-Y H:i'
 */
function formatDateTime(val?: string | Date | null): string {
  if (!val) return '—'
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

/**
 * Format tanggal murni menjadi 'd-m-Y' (atau 'd-m-Y H:i' jika memiliki jam)
 */
function formatDate(val?: string | Date | null): string {
  if (!val) return '—'

  // Jika string murni tanggal YYYY-MM-DD
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split('-')
    return `${d}-${m}-${y}`
  }

  return formatDateTime(val)
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  voided: 'Dibatalkan',
}
const reasonLabels: Record<string, string> = {
  damaged: 'Barang Rusak / Cacat Fisik',
  expired: 'Kadaluwarsa',
  wrong_item: 'Salah Kirim Barang',
  defective: 'Kualitas Tidak Sesuai Spesifikasi',
  other: 'Lainnya',
}
const settlementLabels: Record<string, string> = {
  invoice_deduction: 'Potong Tagihan Faktur',
  cash_refund: 'Pengembalian Dana Kas / Transfer',
  credit_balance: 'Saldo Deposit Supplier',
}

const statusLabel = computed(() => statusLabels[props.returnData?.status ?? 'draft'])
const statusIcon = computed(() => {
  switch (props.returnData?.status) {
    case 'posted':
      return CheckmarkCircleIcon
    case 'voided':
      return CancelCircleIcon
    default:
      return Alert02Icon
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[92dvh] max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-5xl lg:max-w-6xl"
    >
      <!-- Header -->
      <DialogHeader class="border-b px-5 py-4 sm:px-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
          <div class="flex items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon :icon="RotateCcw" class="h-5 w-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <DialogTitle class="text-lg font-bold sm:text-xl">
                  {{ returnData?.document_number ?? 'Detail Retur Pembelian' }}
                </DialogTitle>
                <Badge :variant="returnData?.status === 'posted' ? 'default' : returnData?.status === 'voided' ? 'destructive' : 'secondary'">
                  <HugeiconsIcon :icon="statusIcon" class="mr-1 h-3.5 w-3.5" />
                  {{ statusLabel }}
                </Badge>
              </div>
              <DialogDescription class="text-xs sm:text-sm">
                Bukti pengembalian fisik barang dan nota kredit hutang (Debit Note).
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>

      <!-- Body / Detail Content -->
      <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
        <!-- Banner Void jika ada -->
        <div
          v-if="returnData?.status === 'voided'"
          class="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2"
        >
          <HugeiconsIcon :icon="CancelCircleIcon" class="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span class="font-bold">Dokumen ini telah dibatalkan (void):</span>
            <span class="ml-1">{{ returnData?.void_reason || 'Tanpa keterangan' }}</span>
            <span v-if="returnData?.voided_at" class="ml-1.5 font-mono text-[11px] opacity-90">
              ({{ formatDateTime(returnData.voided_at) }})
            </span>
          </div>
        </div>

        <!-- Section 1: Ringkasan Dokumen -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/40 p-4 border text-xs sm:text-sm">
          <div>
            <span class="text-muted-foreground block text-xs">Tanggal Retur</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
              <HugeiconsIcon :icon="Calendar02Icon" class="h-3.5 w-3.5 text-primary" />
              {{ formatDate(returnData?.return_date) }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Supplier</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
              <HugeiconsIcon :icon="DeliveryTruck01Icon" class="h-3.5 w-3.5 text-primary" />
              {{ returnData?.supplier?.name ?? '—' }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Gudang Pengembalian</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
              <HugeiconsIcon :icon="WarehouseIcon" class="h-3.5 w-3.5 text-primary" />
              {{ returnData?.warehouse_name ?? '—' }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Rujukan Penerimaan (GR)</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground font-mono">
              <HugeiconsIcon :icon="File01Icon" class="h-3.5 w-3.5 text-primary" />
              {{ returnData?.goods_receipt?.document_number ?? '—' }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Waktu Dibuat</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
              <HugeiconsIcon :icon="Calendar02Icon" class="h-3.5 w-3.5 text-muted-foreground" />
              {{ formatDateTime(returnData?.created_at) }}
            </span>
          </div>
          <div v-if="returnData?.posted_at">
            <span class="text-muted-foreground block text-xs">Waktu Diposting</span>
            <span class="font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
              <HugeiconsIcon :icon="CheckmarkCircleIcon" class="h-3.5 w-3.5 text-primary" />
              {{ formatDateTime(returnData.posted_at) }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Alasan Utama</span>
            <span class="font-semibold mt-0.5 block text-foreground">
              {{ reasonLabels[returnData?.reason_code ?? 'damaged'] }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground block text-xs">Metode Penyelesaian</span>
            <span class="font-semibold mt-0.5 block text-foreground flex items-center gap-1">
              <HugeiconsIcon :icon="CreditCardIcon" class="h-3.5 w-3.5 text-primary" />
              {{ settlementLabels[returnData?.settlement_method ?? 'invoice_deduction'] }}
            </span>
          </div>
          <div v-if="returnData?.purchase_invoice_number" class="col-span-2">
            <span class="text-muted-foreground block text-xs">Faktur Pembelian yang Dipotong</span>
            <span class="font-semibold mt-0.5 block text-primary font-mono">
              {{ returnData.purchase_invoice_number }}
            </span>
          </div>
          <div v-if="returnData?.notes" class="col-span-2 sm:col-span-4 border-t pt-2 text-xs">
            <span class="text-muted-foreground block">Catatan Tambahan:</span>
            <p class="font-medium text-foreground mt-0.5">{{ returnData.notes }}</p>
          </div>
        </div>

        <!-- Section 2: Tabel Barang -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-foreground">Rincian Barang yang Diretur</h3>

          <!-- Mobile Cards (lg:hidden) -->
          <div class="space-y-3 lg:hidden">
            <div
              v-for="(item, idx) in returnData?.items"
              :key="item.id"
              class="rounded-xl border p-4 bg-card space-y-2 text-xs"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-muted-foreground font-mono">#{{ idx + 1 }} · SKU {{ item.sku }}</span>
                  <div class="font-bold text-sm text-foreground">{{ item.product_name }}</div>
                  <div v-if="item.variant_name" class="text-muted-foreground">{{ item.variant_name }}</div>
                </div>
                <Badge variant="outline" class="font-bold text-xs shrink-0">
                  {{ quantityFormat.format(Number(item.unit_quantity)) }} {{ item.unit_name }}
                </Badge>
              </div>

              <div class="grid grid-cols-2 gap-2 border-t pt-2 text-muted-foreground">
                <div>Harga Satuan: <strong class="text-foreground">{{ currencyFormat.format(Number(item.unit_price)) }}</strong></div>
                <div class="text-right">Total: <strong class="text-primary font-bold">{{ currencyFormat.format(Number(item.line_total)) }}</strong></div>
              </div>

              <div v-if="item.reason" class="text-muted-foreground bg-muted/40 p-2 rounded-md">
                Keterangan: <span class="text-foreground font-medium">{{ item.reason }}</span>
              </div>
            </div>
          </div>

          <!-- Desktop Table (hidden lg:block) -->
          <div class="hidden lg:block rounded-xl border bg-card overflow-hidden shadow-xs">
            <table class="w-full text-sm text-left">
              <thead class="bg-muted/70 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th class="py-3 px-4 w-12 text-center">#</th>
                  <th class="py-3 px-4">Nama Produk & Varian</th>
                  <th class="py-3 px-4 w-32 text-right">Qty Retur</th>
                  <th class="py-3 px-4 w-28">Satuan</th>
                  <th class="py-3 px-4 w-36 text-right">Harga Satuan</th>
                  <th class="py-3 px-4 w-40 text-right">Subtotal</th>
                  <th class="py-3 px-4">Catatan / Alasan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/60">
                <tr v-for="(item, idx) in returnData?.items" :key="item.id" class="hover:bg-muted/30">
                  <td class="py-3 px-4 text-center text-xs text-muted-foreground">{{ idx + 1 }}</td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-foreground">{{ item.product_name }}</div>
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span v-if="item.variant_name" class="font-medium text-foreground/80">{{ item.variant_name }} ·</span>
                      <span class="font-mono text-muted-foreground/90">SKU: {{ item.sku }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-foreground">
                    {{ quantityFormat.format(Number(item.unit_quantity)) }}
                  </td>
                  <td class="py-3 px-4 text-xs font-medium text-muted-foreground">{{ item.unit_name }}</td>
                  <td class="py-3 px-4 text-right text-xs text-muted-foreground">
                    {{ currencyFormat.format(Number(item.unit_price)) }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-primary">
                    {{ currencyFormat.format(Number(item.line_total)) }}
                  </td>
                  <td class="py-3 px-4 text-xs text-muted-foreground">
                    {{ item.reason || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3: Ringkasan Nilai Finansial -->
        <div class="flex justify-end">
          <div class="w-full sm:w-80 rounded-xl bg-muted/40 p-4 border space-y-2 text-xs sm:text-sm">
            <div class="flex justify-between text-muted-foreground">
              <span>Subtotal Item:</span>
              <span class="font-medium text-foreground">{{ currencyFormat.format(Number(returnData?.subtotal ?? 0)) }}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Pajak (PPN):</span>
              <span class="font-medium text-foreground">{{ currencyFormat.format(Number(returnData?.tax_amount ?? 0)) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2 font-bold text-sm sm:text-base">
              <span>Nilai Debit Note:</span>
              <span class="text-primary">{{ currencyFormat.format(Number(returnData?.grand_total ?? 0)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Action Buttons -->
      <DialogFooter class="border-t px-5 py-4 sm:px-6 bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="outline" @click="open = false">Tutup</Button>
        <template v-if="returnData?.status === 'draft'">
          <Button
            v-if="can('purchase.return.post')"
            class="font-semibold"
            @click="emit('post', returnData!)"
          >
            <HugeiconsIcon :icon="CheckmarkCircleIcon" class="mr-1.5 h-4 w-4" />
            Posting Retur Sekarang
          </Button>
        </template>
        <template v-else-if="returnData?.status === 'posted'">
          <Button
            v-if="can('purchase.return.void')"
            variant="destructive"
            class="font-semibold"
            @click="emit('void', returnData!)"
          >
            <HugeiconsIcon :icon="CancelCircleIcon" class="mr-1.5 h-4 w-4" />
            Batalkan Retur (Void)
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
