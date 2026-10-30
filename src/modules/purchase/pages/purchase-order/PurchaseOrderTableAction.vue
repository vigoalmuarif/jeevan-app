<script setup lang="ts">
import {
  CancelCircleIcon,
  CheckmarkCircleIcon,
  Delete03Icon,
  Edit01Icon,
  Info,
  MoreHorizontalIcon,
  PackageCheck,
  UnavailableIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/core/composables/useCan'
import type { PurchaseOrderListItem } from '../../types/purchase-order.types'

defineProps<{ row: PurchaseOrderListItem }>()
const emit = defineEmits<{
  show: [row: PurchaseOrderListItem]
  edit: [row: PurchaseOrderListItem]
  delete: [row: PurchaseOrderListItem]
  approve: [row: PurchaseOrderListItem]
  cancel: [row: PurchaseOrderListItem]
  close: [row: PurchaseOrderListItem]
  receive: [row: PurchaseOrderListItem]
}>()
const { can } = useCan()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" :aria-label="`Aksi ${row.document_number}`">
        <HugeiconsIcon :icon="MoreHorizontalIcon" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Aksi Purchase Order</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can('purchase.order.view')" @click="emit('show', row)">
          <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
        </DropdownMenuItem>

        <!-- Draft actions -->
        <template v-if="row.status === 'draft'">
          <DropdownMenuItem v-if="can('purchase.order.update')" @click="emit('edit', row)">
            <HugeiconsIcon :icon="Edit01Icon" aria-hidden="true" /> Ubah draft
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.order.approve')" @click="emit('approve', row)">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" /> Setujui (Approve)
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="can('purchase.order.delete')" />
          <DropdownMenuItem v-if="can('purchase.order.delete')" variant="destructive" @click="emit('delete', row)">
            <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" /> Hapus draft
          </DropdownMenuItem>
        </template>

        <!-- Approved / Partially Received actions -->
        <template v-if="row.status === 'approved' || row.status === 'partially_received'">
          <DropdownMenuItem v-if="can('purchase.receipt.create')" @click="emit('receive', row)">
            <HugeiconsIcon :icon="PackageCheck" aria-hidden="true" /> Terima Barang
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.order.close')" @click="emit('close', row)">
            <HugeiconsIcon :icon="UnavailableIcon" aria-hidden="true" /> Tutup PO
          </DropdownMenuItem>
        </template>

        <!-- Cancel action (allowed for draft or approved without receipt) -->
        <DropdownMenuItem
          v-if="(row.status === 'draft' || row.status === 'approved') && can('purchase.order.cancel')"
          variant="destructive"
          @click="emit('cancel', row)"
        >
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan PO
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
