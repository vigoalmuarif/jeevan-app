<script setup lang="ts">
import { Delete03Icon, Edit01Icon, Info, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCan } from '@/core/composables/useCan'
import type { StockTransferListItem } from '../../types/stock-transfer.types'
defineProps<{ row: StockTransferListItem }>()
const emit = defineEmits<{ show: [row: StockTransferListItem]; edit: [row: StockTransferListItem]; delete: [row: StockTransferListItem] }>()
const { can } = useCan()
</script>
<template>
  <DropdownMenu><DropdownMenuTrigger as-child><Button variant="ghost" size="icon" :aria-label="`Aksi ${row.document_number}`"><HugeiconsIcon :icon="MoreHorizontalIcon" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Aksi transfer</DropdownMenuLabel><DropdownMenuGroup><DropdownMenuItem v-if="can('inventory.transfer.view')" @click="emit('show', row)"><HugeiconsIcon :icon="Info" /> Detail</DropdownMenuItem><DropdownMenuItem v-if="row.status === 'draft' && can('inventory.transfer.create')" @click="emit('edit', row)"><HugeiconsIcon :icon="Edit01Icon" /> Ubah draft</DropdownMenuItem><DropdownMenuSeparator v-if="row.status === 'draft' && can('inventory.transfer.create')" /><DropdownMenuItem v-if="row.status === 'draft' && can('inventory.transfer.create')" variant="destructive" @click="emit('delete', row)"><HugeiconsIcon :icon="Delete03Icon" /> Hapus draft</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
</template>
