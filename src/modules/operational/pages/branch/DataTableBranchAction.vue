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
import type { BranchInfo } from "@/core/types/branch.types";

defineProps<{
  row: BranchInfo;
}>();

const emit = defineEmits<{
  delete: [data: BranchInfo]; // signal ke parent untuk refetch
  edit: [data: BranchInfo]; // signal ke parent untuk refetch
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
      <DropdownMenuItem v-if="can('core.branch.update')" as-child>
        <RouterLink :to="{ name: 'operational.branches.edit', params: { slug: row.slug } }">
          <HugeiconsIcon :icon="Edit01Icon" />
          Ubah
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @click="$emit('delete', row)" v-if="can('core.branch.delete')">
        <HugeiconsIcon :icon="Delete03Icon" />
        Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
