<script setup lang="ts">
import {
  CancelCircleIcon,
  CheckmarkCircleIcon,
  Delete03Icon,
  Edit01Icon,
  Info,
  MoreHorizontalIcon,
  SentIcon,
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
import type { PurchaseRequestListItem } from '../../types/purchase-request.types'

defineProps<{ row: PurchaseRequestListItem }>()
const emit = defineEmits<{
  show: [row: PurchaseRequestListItem]
  edit: [row: PurchaseRequestListItem]
  delete: [row: PurchaseRequestListItem]
  submit: [row: PurchaseRequestListItem]
  approve: [row: PurchaseRequestListItem]
  reject: [row: PurchaseRequestListItem]
  cancel: [row: PurchaseRequestListItem]
  close: [row: PurchaseRequestListItem]
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
      <DropdownMenuLabel>Aksi Purchase Request</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can('purchase.request.view')" @click="emit('show', row)">
          <HugeiconsIcon :icon="Info" aria-hidden="true" /> Detail
        </DropdownMenuItem>

        <!-- Draft actions -->
        <template v-if="row.status === 'draft'">
          <DropdownMenuItem v-if="can('purchase.request.update')" @click="emit('edit', row)">
            <HugeiconsIcon :icon="Edit01Icon" aria-hidden="true" /> Ubah draft
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.request.create') || can('purchase.request.update')" @click="emit('submit', row)">
            <HugeiconsIcon :icon="SentIcon" aria-hidden="true" /> Ajukan PR
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="can('purchase.request.delete')" />
          <DropdownMenuItem v-if="can('purchase.request.delete')" variant="destructive" @click="emit('delete', row)">
            <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" /> Hapus draft
          </DropdownMenuItem>
        </template>

        <!-- Submitted actions -->
        <template v-if="row.status === 'submitted'">
          <DropdownMenuItem v-if="can('purchase.request.approve')" @click="emit('approve', row)">
            <HugeiconsIcon :icon="CheckmarkCircleIcon" aria-hidden="true" /> Setujui (Approve)
          </DropdownMenuItem>
          <DropdownMenuItem v-if="can('purchase.request.approve') || can('purchase.request.reject')" variant="destructive" @click="emit('reject', row)">
            <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Tolak Permintaan
          </DropdownMenuItem>
        </template>

        <!-- Approved or Partially Ordered actions -->
        <template v-if="row.status === 'approved' || row.status === 'partially_ordered'">
          <DropdownMenuItem v-if="can('purchase.request.close')" @click="emit('close', row)">
            <HugeiconsIcon :icon="UnavailableIcon" aria-hidden="true" /> Tutup PR
          </DropdownMenuItem>
        </template>

        <!-- Cancel action (allowed for draft, submitted, approved) -->
        <DropdownMenuItem
          v-if="(row.status === 'draft' || row.status === 'submitted' || row.status === 'approved') && can('purchase.request.cancel')"
          variant="destructive"
          @click="emit('cancel', row)"
        >
          <HugeiconsIcon :icon="CancelCircleIcon" aria-hidden="true" /> Batalkan PR
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
