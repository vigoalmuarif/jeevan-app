<script setup lang="ts" generic="TOption extends Record<string, unknown>">
import { computed, ref } from "vue";
import { Check, ChevronsUpDown, Loader2, SearchIcon } from "@lucide/vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useServerCombobox,
  type ComboboxFetcher,
  type UseServerComboboxOptions,
} from "@/core/composables/useComboBox";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "vue"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
// ------------------------------------------------------------------ props
interface Props {
  class?: HTMLAttributes["class"]
  modelValue: string | number | null | undefined;
  fetcher: ComboboxFetcher;
  valueKey?: string;
  labelKey?: string;
  params?: Record<string, unknown>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  debounce?: number;
  perPage?: number;
  /**
   * Jika caller sudah punya object terpilih (edit form),
   * pass di sini supaya label langsung tampil tanpa fetch ulang
   */
  initialOption?: TOption | null;
}
const props = withDefaults(defineProps<Props>(), {
  valueKey: "id",
  labelKey: "name",
  placeholder: "Pilih...",
  searchPlaceholder: "Cari...",
  emptyText: "Tidak ada hasil.",
  disabled: false,
  debounce: 350,
  perPage: 15,
  initialOption: null,
  params: () => ({}),
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null | undefined];
  /** Emit full object saat dipilih, bukan hanya value-nya */
  select: [option: TOption | null];
}>();

// ------------------------------------------------------------------ composable
const comboboxOptions: UseServerComboboxOptions = {
  fetcher: props.fetcher,
  valueKey: props.valueKey,
  labelKey: props.labelKey,
  params: props.params,
  debounce: props.debounce,
  perPage: props.perPage,
};

const {
  query,
  options,
  isLoading,
  open: onOpen,
  valueKey,
  labelKey,
} = useServerCombobox(comboboxOptions);

const open = ref(false)
const selected = ref<TOption>()

// ------------------------------------------------------------------ selected label
/**
 * Resolve label dari:
 * 1. initialOption (edit form — object sudah ada)
 * 2. options yang sudah di-fetch
 */
const selectedLabel = computed<string>(() => {
  if (!props.modelValue) return "";

  // Cek dari initialOption dulu (edit form)
  if (props.initialOption) {
    const initVal = props.initialOption[valueKey];
    if (String(initVal) === String(props.modelValue)) {
      // query.value = props.initialOption[labelKey] as string
      return String(props.initialOption[labelKey] ?? "");
    }
  }

  // ambil dari yang di select terakhir
  if(selected.value){
    return String(selected.value[labelKey])
  }

  // Cek dari options yang sudah di-fetch
  const found = options.value.find(
    (opt) => String(opt[valueKey]) === String(props.modelValue),
  );
  return found ? String(found[labelKey] ?? "") : String(props.modelValue);
});

// ------------------------------------------------------------------ handlers
function handleSelect(option: TOption) {
  selected.value = option
  
  const val = option[valueKey] as string | number;
  emit("update:modelValue", val);
  emit("select", option);
  open.value = false
}

function handleClear() {
  emit("update:modelValue", null);
  emit("select", null);
}

// Sync initialOption ke options list supaya selectedLabel resolve dengan benar
// watch(
//   () => props.initialOption,
//   (opt) => {
//     if (
//       opt &&
//       !options.value.some((o) => String(o[valueKey]) === String(opt[valueKey]))
//     ) {
//       options.value = [
//         opt as unknown as Record<string, unknown>,
//         ...options.value,
//       ];
//     }
//   },
//   { immediate: true },
// );
</script>

<template>
  <Popover :open="open" @update:open="(isOpen) => isOpen && onOpen()" >
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :disabled="disabled"
        @click="open = !open"
        aria-invalid
        :class="
          cn(
            'w-full justify-between font-normal',
            !modelValue && 'text-muted-foreground', props.class
          )
        "
      >
        <span class="truncate">
          {{ selectedLabel || placeholder }}
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0"
      :collision-padding="8"
      @interact-outside="open = !open"
    >
      <Command :filter="() => true" :highlight-on-hover="true">
        <InputGroup>
          <InputGroupInput v-model="query" :placeholder="searchPlaceholder" />
          <InputGroupAddon>
            <SearchIcon class="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
        </InputGroup>
        <CommandList class="max-h-[min(20rem,45dvh)] overflow-y-auto">
          <!-- Loading state -->
          <div
            v-if="isLoading"
            class="flex items-center justify-center py-6 text-sm text-muted-foreground"
          >
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Memuat...
          </div>

          <!-- Empty state (hanya tampil jika TIDAK loading) -->
          <div class="h-20 flex justify-center items-center" v-else-if="!isLoading && options.length === 0">
            {{ emptyText }}
          </div>

          <CommandGroup v-if="!isLoading && options.length > 0">
            <CommandItem
              v-for="option in options"
              :key="String(option[valueKey])"
              :value="String(option[valueKey])"
              @select="handleSelect(option as TOption)"
              class="hover:bg-muted/80"
            >
              <!-- Default slot: label saja -->
              <slot name="option" :option="option as TOption">
                <Check
                  :class="
                    cn(
                      'mr-2 h-4 w-4',
                      String(modelValue) === String(option[valueKey])
                        ? 'opacity-100'
                        : 'opacity-0',
                    )
                  "
                />
                {{ option[labelKey] }}
              </slot>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <!-- Clear button jika ada value terpilih -->
        <div v-if="modelValue" class="border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            class="w-full text-muted-foreground hover:text-destructive"
            @click="handleClear"
          >
            Hapus pilihan
          </Button>
        </div>
      </Command>
    </PopoverContent>
  </Popover>
</template>
