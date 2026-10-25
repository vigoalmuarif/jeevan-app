<script setup lang="ts">
import { computed } from 'vue'
import { Calendar02Icon, CancelCircleIcon, CheckmarkCircleIcon, CreditCardIcon, File01Icon, Wallet01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCan } from '@/core/composables/useCan'
import type { PurchasePayment, PurchasePaymentListItem } from '../../types/purchase-payment.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ payment?: PurchasePayment }>()
const emit = defineEmits<{ void: [payment: PurchasePaymentListItem] }>()
const { can } = useCan()
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const methods: Record<string, string> = { cash: 'Tunai', transfer: 'Transfer Bank', giro: 'Giro / Cek', other: 'Lainnya' }
const paymentRow = computed<PurchasePaymentListItem | undefined>(() => {
  if (!props.payment) return undefined
  const {
    id, document_number, supplier_id, supplier_name, payment_date, payment_method,
    amount, reference_number, status, invoices_count, created_at,
  } = props.payment
  return {
    id, document_number, supplier_id, supplier_name, payment_date, payment_method,
    amount, reference_number, status, invoices_count, created_at,
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="grid-cols-[minmax(0,1fr)] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:p-4">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="CreditCardIcon" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <DialogTitle class="truncate">Pembayaran {{ payment?.document_number }}</DialogTitle>
            <DialogDescription>Rincian pembayaran supplier dan faktur yang menerima alokasi.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <template v-if="payment">
        <div class="grid min-w-0 grid-cols-1 gap-4 rounded-lg border bg-muted/10 p-3 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:p-4">
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="payment.status === 'posted' ? CheckmarkCircleIcon : CancelCircleIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div><p class="text-xs text-muted-foreground">Status</p><Badge class="mt-1" :variant="payment.status === 'voided' ? 'destructive' : 'default'">{{ payment.status === 'voided' ? 'Dibatalkan' : 'Diposting' }}</Badge></div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0"><p class="text-xs text-muted-foreground">Tanggal</p><p class="truncate text-sm font-medium">{{ dateFormat.format(new Date(payment.payment_date)) }}</p></div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="CreditCardIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0"><p class="text-xs text-muted-foreground">Metode</p><p class="truncate text-sm font-medium">{{ methods[payment.payment_method] ?? payment.payment_method }}</p></div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="File01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0"><p class="text-xs text-muted-foreground">Supplier</p><p class="truncate text-sm font-medium">{{ payment.supplier_name }}</p></div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="File01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0"><p class="text-xs text-muted-foreground">Referensi</p><p class="truncate text-sm font-medium">{{ payment.reference_number || '—' }}</p></div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Wallet01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0"><p class="text-xs text-muted-foreground">Total pembayaran</p><p class="truncate text-sm font-semibold">{{ currencyFormat.format(Number(payment.amount)) }}</p></div>
          </div>
          <div v-if="payment.notes" class="flex items-start gap-3 border-t pt-3 sm:col-span-3">
            <HugeiconsIcon :icon="File01Icon" class="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div><p class="text-xs text-muted-foreground">Catatan</p><p class="whitespace-pre-wrap break-words text-sm">{{ payment.notes }}</p></div>
          </div>
        </div>

        <section class="min-w-0 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold">Alokasi faktur</h3>
            <Badge variant="secondary">{{ payment.allocations.length }} faktur</Badge>
          </div>
          <div class="block w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain rounded-lg border">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr><th class="p-3">No. faktur</th><th class="p-3">No. supplier</th><th class="p-3">Jatuh tempo</th><th class="p-3 text-right">Total faktur</th><th class="p-3 text-right">Dialokasikan</th><th class="p-3">Status kini</th></tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="allocation in payment.allocations" :key="allocation.id">
                  <td class="p-3 font-medium">{{ allocation.invoice_number }}</td>
                  <td class="p-3">{{ allocation.supplier_invoice_number }}</td>
                  <td class="p-3">{{ allocation.due_date ? dateFormat.format(new Date(allocation.due_date)) : '—' }}</td>
                  <td class="p-3 text-right">{{ currencyFormat.format(Number(allocation.grand_total)) }}</td>
                  <td class="p-3 text-right font-medium">{{ currencyFormat.format(Number(allocation.amount)) }}</td>
                  <td class="p-3"><Badge :variant="allocation.payment_status === 'paid' ? 'default' : 'secondary'">{{ allocation.payment_status === 'paid' ? 'Lunas' : allocation.payment_status === 'partial' ? 'Sebagian' : 'Belum dibayar' }}</Badge></td>
                </tr>
                <tr v-if="payment.allocations.length === 0"><td colspan="6" class="p-6 text-center text-muted-foreground">Tidak ada alokasi pembayaran.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <Alert v-if="payment?.status === 'voided'" variant="destructive">
        <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" />
        <AlertTitle>Pembayaran dibatalkan</AlertTitle>
        <AlertDescription>{{ payment.void_reason || 'Nominal pembayaran telah dikembalikan ke saldo hutang faktur.' }}</AlertDescription>
      </Alert>

      <DialogFooter>
        <Button v-if="payment?.status === 'posted' && can('purchase.payment.void') && paymentRow" variant="destructive" @click="emit('void', paymentRow)">Batalkan pembayaran</Button>
        <Button variant="outline" @click="open = false">Tutup</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
