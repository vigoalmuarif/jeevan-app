import { computed, ref, watch, type Ref } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/vue-table'
import { watchDebounced } from '@vueuse/core'
import api from '../api/axios'
import type { DataTableFilterDef, ServerTableResponse } from '../types/data-table.types'
import { normalizeError } from '@/lib/errors'

interface UseDataTableOptions<T> {
  endpoint: string
  columns: ColumnDef<T, any>[]
  initialPerPage?: number
  filters?: DataTableFilterDef[]
}

export function useDataTable<T>(options: UseDataTableOptions<T>) {
  const data = ref([]) as Ref<T[]>
  const loading = ref(false)
  const total = ref(0)
  const search = ref('')
  const failedFetch = ref(false)

  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: options.initialPerPage ?? 15,
  })
  const sorting = ref<SortingState>([])
  const columnVisibility = ref<VisibilityState>({})

  const filterParams = computed(() => {
    const result: Record<string, unknown> = {}
    for (const f of options.filters ?? []) {
      const v = f.value.value
      if (v !== undefined && v !== null && v !== '') result[f.id] = v
    }
    return result
  })

  function buildSortParam(): string | undefined {
    if (sorting.value.length === 0) return undefined
    const [s] = sorting.value
    return `${s?.desc ? '-' : ''}${s?.id}`
  }

  async function fetchData() {
    loading.value = true
    try {
      const { data: response } = await api.get<ServerTableResponse<T>>(options.endpoint, {
        params: {
          page: pagination.value.pageIndex + 1,
          per_page: pagination.value.pageSize,
          sort: buildSortParam(),
          filter: {
            ...(search.value ? { search: search.value } : {}),
            ...filterParams.value,
          },
        },
      })
      data.value = response.data
      total.value = response.meta.total
    } catch(e){
      failedFetch.value = true
    } finally {
      loading.value = false
    }
  }

  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pagination.value.pageSize)))

  const table = useVueTable({
    get data() { return data.value },
    columns: options.columns,
    state: {
      get pagination() { return pagination.value },
      get sorting() { return sorting.value },
      get columnVisibility() { return columnVisibility.value },
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    get pageCount() { return pageCount.value },
    onPaginationChange: (updater) => {
      pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
    },
    onSortingChange: (updater) => {
      sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
      pagination.value.pageIndex = 0
    },
    onColumnVisibilityChange: (updater) => {
      columnVisibility.value = typeof updater === 'function' ? updater(columnVisibility.value) : updater
    },
    getCoreRowModel: getCoreRowModel(),
  })

  watch(
    [() => pagination.value.pageIndex, () => pagination.value.pageSize, sorting],
    fetchData,
    { deep: true },
  )
  watch(filterParams, () => {
    pagination.value.pageIndex = 0
    fetchData()
  }, { deep: true })
  watchDebounced(search, () => {
    pagination.value.pageIndex = 0
    fetchData()
  }, { debounce: 400 })

  fetchData()

  function clearFilter(id: string) {
    const f = options.filters?.find((x) => x.id === id)
    if (f) f.value.value = undefined
  }

  function clearAllFilters() {
    options.filters?.forEach((f) => { f.value.value = undefined })
    search.value = ''
  }

  return {
    table, loading, total, search,
    filters: options.filters ?? [],
    refetch: fetchData, data,
    clearFilter,
    clearAllFilters,
    failedFetch
  }
}