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
import { Delete03Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import type { Unit } from "@/core/types/product.types";
import { useCan } from "@/core/composables/useCan";

defineProps<{
  row: Unit;
}>();

const emit = defineEmits<{
  delete: [data: Unit]; // signal ke parent untuk refetch
  edit: [data: Unit]; // signal ke parent untuk refetch
}>();

const { can } = useCan()

</script>

<template>
  <DropdownMenu v-if="!row.is_system">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-5 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem v-if="can('core.warehouse.update') && !row.is_system" as-child>
        <RouterLink :to="{ name: 'operational.warehouses.edit', params: { id: row.id } }">
          <HugeiconsIcon :icon="Edit01Icon" />
          Ubah
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @click="$emit('delete', row)" v-if="can('core.warehouse.delete') && !row.is_system">
        <HugeiconsIcon :icon="Delete03Icon" />
        Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
