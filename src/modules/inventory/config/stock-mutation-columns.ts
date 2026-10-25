import type { ColumnDef } from '@tanstack/vue-table'
import { plainColumn } from '@/lib/data-table-column'
import type { StockMutationListItem } from '@/core/types/stock-mutation.types'

const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' })

const formatQuantity = (value: number | string) => {
  const quantity = Number(value) || 0
  return `${quantity > 0 ? '+' : ''}${quantityFormat.format(quantity)}`
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}

const formatMutationType = (value: string) => value
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, character => character.toUpperCase())

export const stockMutationColumns: ColumnDef<StockMutationListItem, any>[] = [
  plainColumn<StockMutationListItem>('mutated_at', 'Waktu', row => formatDate(row.mutated_at)),
  plainColumn<StockMutationListItem>('product_name', 'Produk', row => row.product_name),
  plainColumn<StockMutationListItem>('variant_name', 'Varian', row => row.variant_name || 'Default'),
  plainColumn<StockMutationListItem>('sku', 'SKU', row => row.sku),
  plainColumn<StockMutationListItem>('branch_name', 'Cabang', row => row.branch_name),
  plainColumn<StockMutationListItem>('warehouse_name', 'Gudang', row => row.warehouse_name),
  plainColumn<StockMutationListItem>('mutation_type', 'Tipe Mutasi', row => formatMutationType(row.mutation_type)),
  plainColumn<StockMutationListItem>('reference_number', 'No. Referensi', row => row.reference_number || '—'),
  plainColumn<StockMutationListItem>('quantity', 'Perubahan', row => formatQuantity(row.quantity)),
  plainColumn<StockMutationListItem>('quantity_before', 'Stok Sebelum', row => quantityFormat.format(Number(row.quantity_before) || 0)),
  plainColumn<StockMutationListItem>('quantity_after', 'Stok Sesudah', row => quantityFormat.format(Number(row.quantity_after) || 0)),
]
