<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption { value: string | number; label: string }
const props = withDefaults(defineProps<{
  modelValue: string | number
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  ariaInvalid?: boolean
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Pilih...', searchPlaceholder: 'Cari pilihan...', emptyText: 'Tidak ada hasil.', disabled: false,
  ariaInvalid: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const open = ref(false)
const search = ref('')
const selectedLabel = computed(() => props.options.find((option) => String(option.value) === String(props.modelValue))?.label)
watch(open, (value) => { if (!value) search.value = '' })
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :aria-invalid="ariaInvalid || undefined"
        :disabled="disabled"
        :class="cn('w-full justify-between font-normal', props.class)"
      >
        <span class="truncate" :class="!selectedLabel && 'text-muted-foreground'">{{ selectedLabel || placeholder }}</span>
        <ChevronsUpDown class="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[--radix-popover-trigger-width] p-0" align="start">
      <Command>
        <CommandInput v-model="search" :placeholder="searchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ emptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem v-for="option in options" :key="String(option.value)" :value="option.label" @select="emit('update:modelValue', option.value); open = false">
              {{ option.label }}
              <Check class="ml-auto size-4" :class="String(option.value) === String(modelValue) ? 'opacity-100' : 'opacity-0'" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
