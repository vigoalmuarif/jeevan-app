<script setup lang="ts">
import { computed } from 'vue'
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  CreditCardIcon,
  File01Icon,
  PackageCheck,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCan } from '@/core/composables/useCan'
import type { PurchaseInvoice, PurchaseInvoiceListItem } from '../../types/purchase-invoice.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ invoice?: PurchaseInvoice }>()
const emit = defineEmits<{
  post: [invoice: PurchaseInvoiceListItem]
  void: [invoice: PurchaseInvoiceListItem]
  pay: [invoice: PurchaseInvoiceListItem]
}>()
const { can } = useCan()
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const statusLabels: Record<string, string> = { draft: 'Draft', posted: 'Diposting', voided: 'Dibatalkan' }
const paymentLabels: Record<string, string> = { unpaid: 'Belum dibayar', partial: 'Dibayar sebagian', paid: 'Lunas' }
const statusIcon = computed(() => {
  switch (props.invoice?.status) {
    case 'posted': return CheckmarkCircleIcon
    case 'voided': return CancelCircleIcon
    default: return Alert02Icon
  }
})
const invoiceRow = computed<PurchaseInvoiceListItem | undefined>(() => {
  if (!props.invoice) return undefined
  const {
    id, document_number, supplier_invoice_number, supplier_id, supplier_name, invoice_date, due_date,
    status, payment_status, grand_total, paid_amount, balance_amount, is_overdue, created_at,
  } = props.invoice
  return {
    id, document_number, supplier_invoice_number, supplier_id, supplier_name: supplier_name ?? '',
    invoice_date, due_date, status, payment_status, grand_total, paid_amount, balance_amount,
    is_overdue, created_at,
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="grid-cols-[minmax(0,1fr)] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:p-4">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="File01Icon" aria-hidden="true" />
          </div>
          <div class="min-w-0 space-y-1">
            <DialogTitle class="truncate">Faktur {{ invoice?.document_number }}</DialogTitle>
            <DialogDescription>Rincian hutang supplier, penerimaan yang ditagihkan, dan riwayat pembayaran.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <template v-if="invoice">
        <div class="grid min-w-0 grid-cols-1 gap-x-4 gap-y-4 rounded-lg border bg-muted/10 p-3 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:p-4 lg:grid-cols-4">
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="statusIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Status dokumen</p>
              <Badge class="mt-1" :variant="invoice.status === 'voided' ? 'destructive' : invoice.status === 'posted' ? 'default' : 'secondary'">{{ statusLabels[invoice.status] }}</Badge>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="CreditCardIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Status pembayaran</p>
              <Badge class="mt-1" :variant="invoice.payment_status === 'paid' ? 'default' : invoice.payment_status === 'partial' ? 'secondary' : 'outline'">{{ paymentLabels[invoice.payment_status] }}</Badge>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Tanggal faktur</p>
              <p class="truncate text-sm font-medium">{{ dateFormat.format(new Date(invoice.invoice_date)) }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Jatuh tempo</p>
              <p class="truncate text-sm font-medium">{{ invoice.due_date ? dateFormat.format(new Date(invoice.due_date)) : '—' }}</p>
              <Badge v-if="invoice.is_overdue" class="mt-1" variant="destructive">Terlambat</Badge>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="PackageCheck" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Supplier</p>
              <p class="truncate text-sm font-medium" :title="invoice.supplier_name ?? ''">{{ invoice.supplier_name || '—' }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="File01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">No. faktur supplier</p>
              <p class="truncate text-sm font-medium" :title="invoice.supplier_invoice_number">{{ invoice.supplier_invoice_number }}</p>
            </div>
          </div>
          <div v-if="invoice.posted_at" class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Diposting pada</p>
              <p class="truncate text-sm font-medium">{{ dateFormat.format(new Date(invoice.posted_at)) }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="File01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Penerimaan ditagihkan</p>
              <p class="truncate text-sm font-medium">{{ invoice.receipts.length }} dokumen</p>
            </div>
          </div>
          <div v-if="invoice.notes" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3 lg:col-span-4">
            <HugeiconsIcon :icon="File01Icon" class="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Catatan</p>
              <p class="whitespace-pre-wrap break-words text-sm">{{ invoice.notes }}</p>
            </div>
          </div>
          <div v-if="invoice.void_reason" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3 lg:col-span-4">
            <HugeiconsIcon :icon="CancelCircleIcon" class="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Alasan pembatalan</p>
              <p class="whitespace-pre-wrap break-words text-sm">{{ invoice.void_reason }}</p>
            </div>
          </div>
        </div>

        <section class="min-w-0 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold">Penerimaan yang ditagihkan</h3>
            <Badge variant="secondary">{{ invoice.receipts.length }} penerimaan</Badge>
          </div>
          <div class="block w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain rounded-lg border">
            <table class="w-full min-w-[550px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr><th class="p-3">No. penerimaan</th><th class="p-3">Tanggal</th><th class="p-3">Jumlah item</th><th class="p-3 text-right">Subtotal baris</th></tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="receipt in invoice.receipts" :key="receipt.id">
                  <td class="p-3 font-medium">{{ receipt.document_number }}</td>
                  <td class="p-3">{{ dateFormat.format(new Date(receipt.receipt_date)) }}</td>
                  <td class="p-3">{{ invoice.items.filter(item => item.goods_receipt_id === receipt.id).length }}</td>
                  <td class="p-3 text-right">{{ currencyFormat.format(invoice.items.filter(item => item.goods_receipt_id === receipt.id).reduce((sum, item) => sum + Number(item.line_total), 0)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="min-w-0 space-y-3">
          <h3 class="font-semibold">Rincian item faktur</h3>
          <div class="block w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain rounded-lg border">
            <table class="w-full min-w-[1050px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr><th class="p-3">Produk</th><th class="p-3">Penerimaan</th><th class="p-3">Satuan</th><th class="p-3 text-right">Jumlah</th><th class="p-3 text-right">Harga</th><th class="p-3 text-right">Diskon</th><th class="p-3 text-right">Pajak</th><th class="p-3 text-right">Total baris</th></tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in invoice.items" :key="item.id">
                  <td class="p-3"><div class="font-medium">{{ item.product_name }}</div><div class="text-xs text-muted-foreground">{{ item.variant_name || 'Varian' }} · {{ item.sku }}</div></td>
                  <td class="p-3">{{ item.goods_receipt_number }}</td>
                  <td class="p-3">{{ item.unit_name }}</td>
                  <td class="p-3 text-right">{{ quantityFormat.format(Number(item.unit_quantity)) }}</td>
                  <td class="p-3 text-right">{{ currencyFormat.format(Number(item.unit_price)) }}</td>
                  <td class="p-3 text-right">{{ currencyFormat.format(Number(item.discount_amount) + Number(item.allocated_discount_amount)) }}</td>
                  <td class="p-3 text-right">{{ Number(item.tax_rate) }}% · {{ currencyFormat.format(Number(item.tax_amount)) }}</td>
                  <td class="p-3 text-right font-medium">{{ currencyFormat.format(Number(item.line_total)) }}</td>
                </tr>
                <tr v-if="invoice.items.length === 0">
                  <td colspan="8" class="p-6 text-center text-muted-foreground">Tidak ada rincian item.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="min-w-0 space-y-3">
          <div class="flex items-center gap-2">
            <HugeiconsIcon :icon="Wallet01Icon" class="size-5 text-primary" aria-hidden="true" />
            <h3 class="font-semibold">Riwayat pembayaran</h3>
          </div>
          <div v-if="invoice.payments.length === 0" class="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
            Belum ada pembayaran untuk faktur ini.
          </div>
          <div v-else class="block w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain rounded-lg border">
            <table class="w-full min-w-[650px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr><th class="p-3">No. pembayaran</th><th class="p-3">Tanggal</th><th class="p-3">Metode</th><th class="p-3">Referensi</th><th class="p-3">Status</th><th class="p-3 text-right">Dialokasikan</th></tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="payment in invoice.payments" :key="payment.id">
                  <td class="p-3 font-medium">{{ payment.document_number }}</td>
                  <td class="p-3">{{ dateFormat.format(new Date(payment.payment_date)) }}</td>
                  <td class="p-3">{{ payment.payment_method }}</td>
                  <td class="p-3">{{ payment.reference_number || '—' }}</td>
                  <td class="p-3"><Badge :variant="payment.status === 'posted' ? 'default' : 'secondary'">{{ payment.status === 'posted' ? 'Diposting' : payment.status }}</Badge></td>
                  <td class="p-3 text-right">{{ currencyFormat.format(Number(payment.amount)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="ml-auto grid w-full min-w-0 max-w-md gap-2 rounded-lg border p-4 text-sm">
          <div class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>{{ currencyFormat.format(Number(invoice.items_subtotal)) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Diskon</span><span>-{{ currencyFormat.format(Number(invoice.discount_amount)) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Pajak</span><span>{{ currencyFormat.format(Number(invoice.tax_amount)) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Pembulatan</span><span>{{ currencyFormat.format(Number(invoice.rounding_amount)) }}</span></div>
          <div class="flex justify-between border-t pt-2 font-semibold"><span>Total faktur</span><span>{{ currencyFormat.format(Number(invoice.grand_total)) }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Dibayar</span><span>{{ currencyFormat.format(Number(invoice.paid_amount)) }}</span></div>
          <div class="flex justify-between font-semibold"><span>Sisa hutang</span><span>{{ currencyFormat.format(Number(invoice.balance_amount)) }}</span></div>
        </section>
      </template>

      <Alert v-if="invoice?.status === 'voided'" variant="destructive">
        <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" />
        <AlertTitle>Faktur dibatalkan</AlertTitle>
        <AlertDescription>Faktur yang dibatalkan tidak lagi membentuk hutang dan penerimaannya dapat difakturkan kembali.</AlertDescription>
      </Alert>

      <DialogFooter>
        <Button v-if="invoice?.status === 'posted' && Number(invoice.balance_amount) > 0 && can('purchase.payment.create') && invoiceRow" variant="secondary" @click="emit('pay', invoiceRow)">Bayar faktur</Button>
        <Button v-if="invoice?.status === 'draft' && can('purchase.invoice.post') && invoiceRow" @click="emit('post', invoiceRow)">Posting faktur</Button>
        <Button v-if="invoice?.status === 'posted' && can('purchase.invoice.void') && invoiceRow" variant="destructive" @click="emit('void', invoiceRow)">Batalkan (void)</Button>
        <Button variant="outline" @click="open = false">Tutup</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
