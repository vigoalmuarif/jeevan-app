<script setup lang="ts">
import { computed } from 'vue'
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  File01Icon,
  PackageCheck,
  WarehouseIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { StockAdjustment } from '../../types/stock-adjustment.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ adjustment?: StockAdjustment }>()
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const reasonLabels: Record<string, string> = {
  damaged: 'Rusak',
  expired: 'Kedaluwarsa',
  lost: 'Hilang',
  found: 'Ditemukan',
  correction: 'Koreksi',
  opening_stock: 'Saldo awal',
  other: 'Lainnya',
}
const statusLabels: Record<string, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  voided: 'Dibatalkan',
}
const statusIcon = computed(() => {
  switch (props.adjustment?.status) {
    case 'posted': return CheckmarkCircleIcon
    case 'voided': return CancelCircleIcon
    default: return Alert02Icon
  }
})

function itemDirection(item: { base_quantity?: number | string; unit_quantity: number | string }) {
  const quantity = Number(item.base_quantity ?? item.unit_quantity)
  return quantity < 0 ? 'decrease' : 'increase'
}

function signedQuantity(value: number | string) {
  const quantity = Number(value)
  return `${quantity < 0 ? '−' : '+'}${quantityFormat.format(Math.abs(quantity))}`
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="grid-cols-[minmax(0,1fr)] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:p-4">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="WarehouseIcon" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <DialogTitle class="truncate">Adjustment {{ adjustment?.document_number }}</DialogTitle>
            <DialogDescription>Rincian koreksi stok dan dampaknya pada persediaan.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <template v-if="adjustment">
        <div class="grid min-w-0 grid-cols-1 gap-4 rounded-lg border bg-muted/10 p-3 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:p-4">
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="statusIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p class="text-xs text-muted-foreground">Status dokumen</p>
              <Badge class="mt-1" :variant="adjustment.status === 'voided' ? 'destructive' : adjustment.status === 'draft' ? 'secondary' : 'default'">
                {{ statusLabels[adjustment.status] ?? adjustment.status }}
              </Badge>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Tanggal adjustment</p>
              <p class="truncate text-sm font-medium">{{ dateFormat.format(new Date(adjustment.adjustment_date)) }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Alert02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Alasan</p>
              <p class="truncate text-sm font-medium">{{ reasonLabels[adjustment.reason] ?? adjustment.reason }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="PackageCheck" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Cabang</p>
              <p class="truncate text-sm font-medium">{{ adjustment.branch_name || '—' }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="WarehouseIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Gudang</p>
              <p class="truncate text-sm font-medium">{{ adjustment.warehouse_name }}</p>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Diposting pada</p>
              <p class="truncate text-sm font-medium">
                {{ adjustment.posted_at ? dateTimeFormat.format(new Date(adjustment.posted_at)) : '—' }}
              </p>
            </div>
          </div>
          <div v-if="adjustment.notes" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3">
            <HugeiconsIcon :icon="File01Icon" class="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Catatan</p>
              <p class="whitespace-pre-wrap break-words text-sm">{{ adjustment.notes }}</p>
            </div>
          </div>
        </div>

        <section class="min-w-0 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold">Rincian item</h3>
              <p class="text-xs text-muted-foreground">Tanda plus menambah stok, tanda minus mengurangi stok.</p>
            </div>
            <Badge variant="secondary">{{ adjustment.items.length }} item</Badge>
          </div>
          <div class="block w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain rounded-lg border">
            <table class="w-full min-w-[820px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th class="p-3 font-medium">Produk</th>
                  <th class="p-3 font-medium">Tipe</th>
                  <th class="p-3 font-medium text-right">Jumlah input</th>
                  <th class="p-3 font-medium text-right">Konversi</th>
                  <th class="p-3 font-medium text-right">Dampak stok dasar</th>
                  <th class="p-3 font-medium text-right">HPP input / satuan</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in adjustment.items" :key="item.id">
                  <td class="p-3">
                    <div class="font-medium">{{ item.product_name }}</div>
                    <div class="text-xs text-muted-foreground">{{ item.variant_name || 'Default' }} · {{ item.sku }}</div>
                  </td>
                  <td class="p-3">
                    <Badge :variant="itemDirection(item) === 'increase' ? 'default' : 'destructive'">
                      {{ itemDirection(item) === 'increase' ? 'Penambahan (+)' : 'Pengurangan (−)' }}
                    </Badge>
                  </td>
                  <td class="p-3 text-right font-medium tabular-nums">
                    {{ signedQuantity(item.unit_quantity) }} {{ item.unit_code }}
                  </td>
                  <td class="p-3 text-right tabular-nums">
                    × {{ quantityFormat.format(Number(item.conversion_rate)) }}
                  </td>
                  <td class="p-3 text-right font-semibold tabular-nums" :class="itemDirection(item) === 'increase' ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'">
                    {{ signedQuantity(item.base_quantity ?? item.unit_quantity) }}
                  </td>
                  <td class="p-3 text-right tabular-nums">
                    {{ item.unit_cost === null ? '—' : quantityFormat.format(Number(item.unit_cost)) }}
                  </td>
                </tr>
                <tr v-if="adjustment.items.length === 0">
                  <td colspan="6" class="p-6 text-center text-muted-foreground">Tidak ada rincian item.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Alert v-if="adjustment.status === 'voided'" variant="destructive">
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" />
          <AlertTitle>Adjustment dibatalkan</AlertTitle>
          <AlertDescription>{{ adjustment.void_reason || 'Mutasi stok adjustment telah dibalik.' }}</AlertDescription>
        </Alert>
      </template>

      <DialogFooter>
        <Button variant="outline" @click="open = false">Tutup</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
