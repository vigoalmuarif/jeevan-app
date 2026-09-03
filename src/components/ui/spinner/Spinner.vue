<script setup lang="ts">

import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from '@hugeicons/vue';
import { LoaderPinwheelIcon } from '@hugeicons/core-free-icons';

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <HugeiconsIcon :icon="LoaderPinwheelIcon" role="status" aria-label="Loading" :class="cn('size-4 animate-spin', props.class)" />
</template>
