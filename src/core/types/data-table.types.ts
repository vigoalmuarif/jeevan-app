import type { Ref } from 'vue'
import '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  interface ColumnMeta<TData, TValue> {
    label?: string
  }
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ServerTableResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface DataTableFilterDef<V = any> {
  id: string
  label: string
  value: Ref<V | undefined>
  format?: (value: V) => string
}