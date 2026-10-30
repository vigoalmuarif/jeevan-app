<script setup lang="ts">
import { computed } from 'vue'
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  DeliveryTruck01Icon,
  File01Icon,
  PackageCheck,
  SentIcon,
  ShoppingBag01Icon,
  UnavailableIcon,
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
import type { PurchaseRequest } from '../../types/purchase-request.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ request?: PurchaseRequest }>()
const emit = defineEmits<{
  submit: [request: PurchaseRequest]
  approve: [request: PurchaseRequest]
  reject: [request: PurchaseRequest]
  cancel: [request: PurchaseRequest]
  closeRequest: [request: PurchaseRequest]
  convert: [request: PurchaseRequest]
}>()

const { can } = useCan()
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  partially_ordered: 'Dipesan Sebagian',
  ordered: 'Sudah Dipesan',
  closed: 'Ditutup',
  cancelled: 'Dibatalkan',
}

const statusVariants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'default',
  rejected: 'destructive',
  partially_ordered: 'outline',
  ordered: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
}

const statusLabel = computed(() => (props.request ? statusLabels[props.request.status] ?? props.request.status : ''))
const statusIcon = computed(() => {
  switch (props.request?.status) {
    case 'approved':
    case 'ordered':
      return CheckmarkCircleIcon
    case 'rejected':
    case 'cancelled':
      return CancelCircleIcon
    case 'closed':
      return UnavailableIcon
    case 'submitted':
      return SentIcon
    default:
      return Alert02Icon
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="ShoppingBag01Icon" aria-hidden="true" />
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <DialogTitle class="truncate">Purchase Request {{ request?.document_number }}</DialogTitle>
            <DialogDescription>Rincian permintaan pembelian barang internal.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <template v-if="request">
        <!-- Informasi Header -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border bg-muted/10 p-3 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-4 sm:p-4">
          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="statusIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Status</p>
              <Badge :variant="statusVariants[request.status] ?? 'secondary'" class="mt-1">{{ statusLabel }}</Badge>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Tanggal Permintaan</p>
              <p class="truncate text-sm font-medium">{{ dateFormat.format(new Date(request.request_date)) }}</p>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="Calendar02Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Tanggal Dibutuhkan</p>
              <p class="truncate text-sm font-medium">
                {{ request.required_date ? dateFormat.format(new Date(request.required_date)) : '—' }}
              </p>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="WarehouseIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Gudang Kebutuhan</p>
              <p class="truncate text-sm font-medium" :title="request.warehouse_name ?? ''">{{ request.warehouse_name || '—' }}</p>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="WarehouseIcon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Cabang Peminta</p>
              <p class="truncate text-sm font-medium">{{ request.branch_name || '—' }}</p>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-3">
            <HugeiconsIcon :icon="DeliveryTruck01Icon" class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Sumber Permintaan</p>
              <p class="text-sm font-medium capitalize">{{ request.source === 'low_stock' ? 'Rekomendasi Stok Minimum' : 'Manual' }}</p>
            </div>
          </div>

          <div v-if="request.reject_reason" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3">
            <HugeiconsIcon :icon="CancelCircleIcon" class="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Alasan Penolakan</p>
              <p class="text-sm text-destructive font-medium">{{ request.reject_reason }}</p>
            </div>
          </div>

          <div v-if="request.cancel_reason" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3">
            <HugeiconsIcon :icon="CancelCircleIcon" class="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Alasan Pembatalan</p>
              <p class="text-sm text-destructive font-medium">{{ request.cancel_reason }}</p>
            </div>
          </div>

          <div v-if="request.notes" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3">
            <HugeiconsIcon :icon="File01Icon" class="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">Catatan</p>
              <p class="whitespace-pre-wrap text-sm text-foreground">{{ request.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Tabel Item -->
        <div class="flex flex-col gap-2">
          <h4 class="text-sm font-semibold">Daftar Barang yang Diminta</h4>
          <div class="overflow-x-auto rounded-lg border">
            <table class="w-full text-left text-sm">
              <thead class="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th class="p-3">Produk / Varian</th>
                  <th class="p-3 text-right">Diminta</th>
                  <th class="p-3 text-right">Sudah Dipesan</th>
                  <th class="p-3 text-right">Sisa Dipesan</th>
                  <th class="p-3 text-right">Estimasi Harga</th>
                  <th class="p-3">Supplier Usulan</th>
                  <th class="p-3">PO Terkait</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in request.items" :key="item.id" class="hover:bg-muted/20">
                  <td class="p-3">
                    <p class="font-medium text-foreground">{{ item.product_name }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ item.variant_name ? `${item.variant_name} · ` : '' }}SKU: {{ item.sku }}
                    </p>
                    <p v-if="item.notes" class="mt-0.5 text-xs italic text-muted-foreground">{{ item.notes }}</p>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    {{ quantityFormat.format(Number(item.unit_quantity)) }} {{ item.unit_code }}
                    <span v-if="Number(item.conversion_rate) !== 1" class="block text-[11px] text-muted-foreground">
                      ({{ quantityFormat.format(Number(item.base_quantity)) }} dasar)
                    </span>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    <span :class="Number(item.ordered_base_quantity) > 0 ? 'text-primary font-medium' : 'text-muted-foreground'">
                      {{ quantityFormat.format(Number(item.ordered_base_quantity)) }} (dasar)
                    </span>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    <span :class="Number(item.remaining_base_quantity) > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'">
                      {{ quantityFormat.format(Number(item.remaining_base_quantity)) }} (dasar)
                    </span>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    {{ item.estimated_unit_price ? currencyFormat.format(Number(item.estimated_unit_price)) : '—' }}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    {{ item.suggested_supplier_name || '—' }}
                  </td>
                  <td class="p-3">
                    <div v-if="item.orders && item.orders.length > 0" class="flex flex-col gap-1">
                      <span
                        v-for="ord in item.orders"
                        :key="ord.order_id"
                        class="inline-flex items-center gap-1 text-xs"
                      >
                        <Badge variant="outline" class="font-mono text-[10px]">
                          {{ ord.document_number }}
                        </Badge>
                        <span class="text-muted-foreground">({{ quantityFormat.format(Number(ord.base_quantity)) }})</span>
                      </span>
                    </div>
                    <span v-else class="text-xs text-muted-foreground">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <DialogFooter class="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <Button variant="outline" @click="open = false">Tutup</Button>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Draft: Submit button -->
          <Button
            v-if="request?.status === 'draft' && (can('purchase.request.create') || can('purchase.request.update'))"
            @click="emit('submit', request!)"
          >
            <HugeiconsIcon :icon="SentIcon" data-icon="inline-start" aria-hidden="true" />
            Ajukan (Submit)
          </Button>

          <!-- Submitted: Approve button -->
          <Button
            v-if="request?.status === 'submitted' && can('purchase.request.approve')"
            @click="emit('approve', request!)"
          >
            <HugeiconsIcon :icon="CheckmarkCircleIcon" data-icon="inline-start" aria-hidden="true" />
            Setujui (Approve)
          </Button>

          <!-- Submitted: Reject button -->
          <Button
            v-if="request?.status === 'submitted' && (can('purchase.request.approve') || can('purchase.request.reject'))"
            variant="destructive"
            @click="emit('reject', request!)"
          >
            <HugeiconsIcon :icon="CancelCircleIcon" data-icon="inline-start" aria-hidden="true" />
            Tolak
          </Button>

          <!-- Approved or Partially Ordered: Convert to PO shortcut -->
          <Button
            v-if="(request?.status === 'approved' || request?.status === 'partially_ordered') && (can('purchase.request.convert') || can('purchase.order.create'))"
            @click="emit('convert', request!)"
          >
            <HugeiconsIcon :icon="PackageCheck" data-icon="inline-start" aria-hidden="true" />
            Buat PO dari PR Ini
          </Button>

          <!-- Approved or Partially Ordered: Tutup PR -->
          <Button
            v-if="(request?.status === 'approved' || request?.status === 'partially_ordered') && can('purchase.request.close')"
            variant="outline"
            @click="emit('closeRequest', request!)"
          >
            <HugeiconsIcon :icon="UnavailableIcon" data-icon="inline-start" aria-hidden="true" />
            Tutup PR
          </Button>

          <!-- Draft, Submitted, or Approved without orders: Batalkan -->
          <Button
            v-if="(request?.status === 'draft' || request?.status === 'submitted' || request?.status === 'approved') && can('purchase.request.cancel')"
            variant="destructive"
            @click="emit('cancel', request!)"
          >
            <HugeiconsIcon :icon="CancelCircleIcon" data-icon="inline-start" aria-hidden="true" />
            Batalkan PR
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
