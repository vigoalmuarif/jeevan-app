import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

export interface ComboboxOption {
  [key: string]: unknown;
}

export type ComboboxFetcher = (
  search: string,
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
) => Promise<ComboboxOption[]>;

export interface UseServerComboboxOptions {
  /** Endpoint URL, e.g. '/api/categories' */
  fetcher: ComboboxFetcher;
  /** Key digunakan sebagai value (default: 'id') */
  valueKey?: string;
  /** Key digunakan sebagai label (default: 'name') */
  labelKey?: string;
  /** Tambahan query params yang dikirim setiap request */
  params?: Record<string, unknown>;
  /** Debounce delay in ms (default: 350) */
  debounce?: number;
  /** Jumlah item per request (default: 15) */
  perPage?: number;
}

export function useServerCombobox(options: UseServerComboboxOptions) {
  const {
    fetcher,
    valueKey = "id",
    labelKey = "name",
    params = {},
    debounce = 700,
    perPage = 15,
  } = options;

  const query = ref("");
  const options_ = ref<ComboboxOption[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let abortController: AbortController | null = null;

  async function fetchOptions(search: string) {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetcher(search, params, { signal: controller.signal });
      if (controller.signal.aborted) return;

      options_.value = Array.isArray(response) ? response : (response ?? []);
    } catch {
      if (!controller.signal.aborted) {
        error.value = "Gagal memuat data.";
        options_.value = [];
      }
    } finally {
      if (abortController === controller) isLoading.value = false;
    }
  }

  const debouncedFetch = useDebounceFn((search: string) => {
    fetchOptions(search);
  }, debounce);

  // Trigger fetch saat query berubah
  watch(query, (val) => {
    debouncedFetch(val);
  });

  // Initial load (load options saat pertama dibuka)
  function open() {
    if (options_.value.length === 0) {
      fetchOptions(query.value);
    }
  }

  function reset() {
    query.value = "";
    options_.value = [];
  }

  return {
    query,
    options: options_,
    isLoading,
    error,
    open,
    reset,
    valueKey,
    labelKey,
  };
}
