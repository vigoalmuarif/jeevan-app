<template>
  <div>
    <template v-if="status">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <HugeiconsIcon
              :icon="CheckmarkCircleIcon"
              size="20"
              color="green"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Aktif</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </template>

    <template v-else>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <HugeiconsIcon :icon="CancelCircleIcon" size="20" color="red" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Nonaktif</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  CancelCircleIcon,
  CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const props = defineProps<{
  status: boolean
}>();
</script>

<style scoped></style>
