<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ChevronsUpDown, X } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ComboboxOption } from './ComboboxSelect.vue'

const props = withDefaults(defineProps<{
  modelValue: Array<string | number>
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  maxVisibleChips?: number
  disabled?: boolean
  selectedLabel?: string
}>(), {
  placeholder: 'Pilih...',
  searchPlaceholder: 'Cari...',
  emptyText: 'Tidak ada hasil.',
  maxVisibleChips: 2,
  disabled: false,
  selectedLabel: 'dipilih',
})

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number>]
}>()

const open = ref(false)
const selectedOptions = computed(() => props.options.filter((option) => props.modelValue.some((value) => String(value) === String(option.value))))
const visibleOptions = computed(() => selectedOptions.value.slice(0, props.maxVisibleChips))
const hiddenCount = computed(() => Math.max(0, selectedOptions.value.length - visibleOptions.value.length))

function isSelected(value: string | number) {
  return props.modelValue.some((selected) => String(selected) === String(value))
}

function toggle(value: string | number) {
  const next = isSelected(value)
    ? props.modelValue.filter((selected) => String(selected) !== String(value))
    : [...props.modelValue, value]
  emit('update:modelValue', next)
}

function remove(value: string | number) {
  emit('update:modelValue', props.modelValue.filter((selected) => String(selected) !== String(value)))
}
</script>

<template>
  <div class="space-y-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button type="button" variant="outline" role="combobox" :aria-expanded="open" :disabled="disabled" class="w-full justify-between font-normal">
          <span class="truncate" :class="!selectedOptions.length && 'text-muted-foreground'">
            {{ selectedOptions.length ? `${selectedOptions.length} ${selectedLabel}` : placeholder }}
          </span>
          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput :placeholder="searchPlaceholder" />
          <CommandList>
            <CommandEmpty>{{ emptyText }}</CommandEmpty>
            <CommandGroup>
              <CommandItem v-for="option in options" :key="String(option.value)" :value="option.label" @select="toggle(option.value)">
                {{ option.label }}
                <Check class="ml-auto size-4" :class="isSelected(option.value) ? 'opacity-100' : 'opacity-0'" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <div v-if="visibleOptions.length" class="flex flex-wrap items-center gap-1.5">
      <Badge v-for="option in visibleOptions" :key="String(option.value)" variant="secondary" class="gap-1 pr-1">
        <span class="max-w-36 truncate">{{ option.label }}</span>
        <button type="button" class="rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :aria-label="`Hapus kategori ${option.label}`" @click="remove(option.value)">
          <X class="size-3" />
        </button>
      </Badge>
      <Badge v-if="hiddenCount" variant="outline">+{{ hiddenCount }} lainnya</Badge>
    </div>
  </div>
</template>
