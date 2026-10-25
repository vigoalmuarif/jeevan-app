<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Delete03Icon, Edit01Icon } from '@hugeicons/core-free-icons'
import type { Product } from '@/core/types/product.types'
import { useCan } from '@/core/composables/useCan'

defineProps<{ row: Product }>()
defineEmits<{ edit: [product: Product]; delete: [product: Product] }>()
const { can } = useCan()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0" aria-label="Aksi produk">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Aksi Produk</DropdownMenuLabel>
      <DropdownMenuItem v-if="can('product.update')" @click="$emit('edit', row)">
        <HugeiconsIcon :icon="Edit01Icon" /> Ubah
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="can('product.delete')" />
      <DropdownMenuItem v-if="can('product.delete')" variant="destructive" @click="$emit('delete', row)">
        <HugeiconsIcon :icon="Delete03Icon" /> Arsipkan
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
