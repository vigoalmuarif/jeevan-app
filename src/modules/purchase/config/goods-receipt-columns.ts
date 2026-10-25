import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import GoodsReceiptTableAction from '../pages/goods-receipt/GoodsReceiptTableAction.vue'
import type { GoodsReceiptListItem } from '../types/goods-receipt.types'

export interface GoodsReceiptActions {
  onShow: (row: GoodsReceiptListItem) => void
  onEdit: (row: GoodsReceiptListItem) => void
  onDelete: (row: GoodsReceiptListItem) => void
  onPost: (row: GoodsReceiptListItem) => void
  onVoid: (row: GoodsReceiptListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const statuses: Record<string, string> = { draft: 'Draft', posted: 'Diposting', voided: 'Dibatalkan' }
const statusVariants: Record<string, 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  posted: 'default',
  voided: 'destructive',
}
const { can } = useCan()

export const goodsReceiptColumns = (actions: GoodsReceiptActions): ColumnDef<GoodsReceiptListItem, any>[] => [
  plainColumn<GoodsReceiptListItem>('document_number', 'No. Dokumen', row => row.document_number),
  plainColumn<GoodsReceiptListItem>('receipt_date', 'Tanggal', row => dateFormat.format(new Date(row.receipt_date))),
  plainColumn<GoodsReceiptListItem>('supplier_name', 'Supplier', row => row.supplier_name ?? '—'),
  plainColumn<GoodsReceiptListItem>('warehouse_name', 'Gudang', row => row.warehouse_name ?? '—'),
  plainColumn<GoodsReceiptListItem>('items_count', 'Item', row => String(row.items_count)),
  plainColumn<GoodsReceiptListItem>('grand_total', 'Total', row => currencyFormat.format(Number(row.grand_total))),
  plainColumn<GoodsReceiptListItem>('status', 'Status', row => statuses[row.status] ?? row.status, {
    cell: ({ row }) => h(Badge, { variant: statusVariants[row.original.status] ?? 'secondary' }, () => statuses[row.original.status] ?? row.original.status),
  }),
  ...(can('purchase.receipt.view') || can('purchase.receipt.create') || can('purchase.receipt.update') || can('purchase.receipt.delete') || can('purchase.receipt.post') || can('purchase.receipt.void')
    ? [actionColumn<GoodsReceiptListItem>(GoodsReceiptTableAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onPost: actions.onPost,
        onVoid: actions.onVoid,
      })]
    : []),
]
