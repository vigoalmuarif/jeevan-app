<script setup lang="ts">
import { MoreHorizontal } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Delete03Icon, Edit01Icon, Info } from "@hugeicons/core-free-icons";
import { useCan } from "@/core/composables/useCan";
import type { SupplierListItem } from "@/core/types/supplier.types";

defineProps<{
  row: SupplierListItem;
}>();

const emit = defineEmits<{
  delete: [data: SupplierListItem]; // signal ke parent untuk refetch
  edit: [data: SupplierListItem]; // signal ke parent untuk refetch
  show: [data: SupplierListItem]; // signal ke parent untuk refetch
}>();

const { can } = useCan()

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-5 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem @click="$emit('show', row)">
        <HugeiconsIcon :icon="Info" />
        Detail
      </DropdownMenuItem>
      <DropdownMenuItem v-if="can('partner.supplier.update')" as-child>
        <RouterLink :to="{ name: 'partner.suppliers.edit', params: { id: row.id } }">
          <HugeiconsIcon :icon="Edit01Icon" />
          Ubah
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @click="$emit('delete', row)" v-if="can('partner.supplier.delete')">
        <HugeiconsIcon :icon="Delete03Icon" />
        Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
