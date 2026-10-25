<script setup lang="ts">
import { CancelCircleIcon, Info, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/core/composables/useCan'
import type { PurchasePaymentListItem } from '../../types/purchase-payment.types'

defineProps<{ row: PurchasePaymentListItem }>()
const emit = defineEmits<{
  show: [row: PurchasePaymentListItem]
  void: [row: PurchasePaymentListItem]
}>()
const { can } = useCan()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" :aria-label="`Aksi pembayaran ${row.document_number}`">
        <HugeiconsIcon :icon="MoreHorizontalIcon" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Aksi pembayaran</DropdownMenuLabel>
      <DropdownMenuItem v-if="can('purchase.payment.view')" @click="emit('show', row)">
        <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
      </DropdownMenuItem>
      <template v-if="row.status === 'posted' && can('purchase.payment.void')">
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @click="emit('void', row)">
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan pembayaran
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
