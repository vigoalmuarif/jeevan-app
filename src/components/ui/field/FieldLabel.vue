<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { Label } from '@/components/ui/label'

const props = defineProps<{
  optional?: boolean
  required?: boolean
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Label
    data-slot="field-label"
    :class="cn(
      'has-data-checked:bg-primary/5 has-data-checked:border-primary/30 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5 group/field-label peer/field-label flex items-center space-x-2 w-fit leading-snug',
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
      props.class,
    )"
  >
    <slot /> <span class="inline-flex text-xs text-muted-foreground" v-if="optional">(Opsional)</span>  <span class="inline-flex text-xs text-destructive" v-if="required">*</span>
  </Label>
</template>
