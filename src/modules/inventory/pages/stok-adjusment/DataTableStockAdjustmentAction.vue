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
import type { StockAdjustmentListItem } from '../../types/stock-adjustment.types'

defineProps<{ row: StockAdjustmentListItem }>()
const emit = defineEmits<{
  show: [row: StockAdjustmentListItem]
  edit: [row: StockAdjustmentListItem]
  delete: [row: StockAdjustmentListItem]
  post: [row: StockAdjustmentListItem]
  void: [row: StockAdjustmentListItem]
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
      <DropdownMenuLabel>Aksi adjustment</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can('inventory.adjustment.view')" @click="emit('show', row)">
          <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
        </DropdownMenuItem>
        <template v-if="row.status === 'draft'">
          <DropdownMenuItem v-if="can('inventory.adjustment.create')" @click="emit('edit', row)">
            <HugeiconsIcon :icon="Edit01Icon" aria-hidden="true" /> Ubah draft
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('inventory.adjustment.approve')" @click="emit('post', row)">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" /> Posting
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="can('inventory.adjustment.create')" />
          <DropdownMenuItem v-if="can('inventory.adjustment.create')" variant="destructive" @click="emit('delete', row)">
            <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" /> Hapus draft
          </DropdownMenuItem>
        </template>
        <DropdownMenuItem v-if="row.status === 'posted' && can('inventory.adjustment.approve')" variant="destructive" @click="emit('void', row)">
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan (void)
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
