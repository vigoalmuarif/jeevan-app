<script setup lang="ts">
import { CancelCircleIcon, CheckmarkCircleIcon, Delete03Icon, Edit01Icon, Info, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
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
import type { PurchaseInvoiceListItem } from '../../types/purchase-invoice.types'

defineProps<{ row: PurchaseInvoiceListItem }>()
const emit = defineEmits<{
  show: [row: PurchaseInvoiceListItem]
  edit: [row: PurchaseInvoiceListItem]
  delete: [row: PurchaseInvoiceListItem]
  post: [row: PurchaseInvoiceListItem]
  void: [row: PurchaseInvoiceListItem]
}>()
const { can } = useCan()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" :aria-label="`Aksi faktur ${row.document_number}`">
        <HugeiconsIcon :icon="MoreHorizontalIcon" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Aksi faktur</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can('purchase.invoice.view')" @click="emit('show', row)">
          <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
        </DropdownMenuItem>
        <template v-if="row.status === 'draft'">
          <DropdownMenuItem v-if="can('purchase.invoice.update')" @click="emit('edit', row)">
            <HugeiconsIcon :icon="Edit01Icon" aria-hidden="true" /> Ubah draft
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.invoice.post')" @click="emit('post', row)">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" /> Posting
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="can('purchase.invoice.delete')" />
          <DropdownMenuItem v-if="can('purchase.invoice.delete')" variant="destructive" @click="emit('delete', row)">
            <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" /> Hapus draft
          </DropdownMenuItem>
        </template>
        <DropdownMenuItem v-if="row.status === 'posted' && can('purchase.invoice.void')" variant="destructive" @click="emit('void', row)">
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan (void)
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
