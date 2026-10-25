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
import { useCan } from "@/core/composables/useCan";
import type { Region } from "@/core/types/region.types";

defineProps<{
  row: Region;
}>();

const emit = defineEmits<{
  delete: [data: Region]; // signal ke parent untuk refetch
  edit: [data: Region]; // signal ke parent untuk refetch
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
      <DropdownMenuItem v-if="can('core.regional.update')" @click="$emit('edit', row)">
          <HugeiconsIcon :icon="Edit01Icon" />
          Ubah
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @click="$emit('delete', row)" v-if="can('core.regional.delete')">
        <HugeiconsIcon :icon="Delete03Icon" />
        Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
