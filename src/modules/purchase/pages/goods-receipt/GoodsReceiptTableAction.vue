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
import type { GoodsReceiptListItem } from '../../types/goods-receipt.types'

defineProps<{ row: GoodsReceiptListItem }>()
const emit = defineEmits<{
  show: [row: GoodsReceiptListItem]
  edit: [row: GoodsReceiptListItem]
  delete: [row: GoodsReceiptListItem]
  post: [row: GoodsReceiptListItem]
  void: [row: GoodsReceiptListItem]
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
      <DropdownMenuLabel>Aksi penerimaan</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can('purchase.receipt.view')" @click="emit('show', row)">
          <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
        </DropdownMenuItem>
        <template v-if="row.status === 'draft'">
          <DropdownMenuItem v-if="can('purchase.receipt.update')" @click="emit('edit', row)">
            <HugeiconsIcon :icon="Edit01Icon" aria-hidden="true" /> Ubah draft
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.receipt.post')" @click="emit('post', row)">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" /> Posting
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="can('purchase.receipt.delete')" />
          <DropdownMenuItem v-if="can('purchase.receipt.delete')" variant="destructive" @click="emit('delete', row)">
            <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" /> Hapus draft
          </DropdownMenuItem>
        </template>
        <DropdownMenuItem v-if="row.status === 'posted' && can('purchase.receipt.void')" variant="destructive" @click="emit('void', row)">
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan (void)
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
