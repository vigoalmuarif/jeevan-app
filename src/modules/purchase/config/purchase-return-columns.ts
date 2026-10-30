import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import PurchaseReturnTableAction from '../pages/purchase-return/PurchaseReturnTableAction.vue'
import type { PurchaseReturnListItem } from '../types/purchase-return.types'

export interface PurchaseReturnActions {
  onShow: (row: PurchaseReturnListItem) => void
  onEdit: (row: PurchaseReturnListItem) => void
  onDelete: (row: PurchaseReturnListItem) => void
  onPost: (row: PurchaseReturnListItem) => void
  onVoid: (row: PurchaseReturnListItem) => void
}

function formatDate(val?: string | null): string {
  if (!val) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split('-')
    return `${d}-${m}-${y}`
  }
  const date = new Date(val)
  if (isNaN(date.getTime())) return String(val)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const statuses: Record<string, string> = { draft: 'Draft', posted: 'Diposting', voided: 'Dibatalkan' }
const statusVariants: Record<string, 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  posted: 'default',
  voided: 'destructive',
}
const reasonLabels: Record<string, string> = {
  damaged: 'Rusak',
  expired: 'Kadaluwarsa',
  wrong_item: 'Salah Barang',
  defective: 'Cacat/Kualitas',
  other: 'Lainnya',
}
const settlementLabels: Record<string, string> = {
  invoice_deduction: 'Potong Faktur',
  cash_refund: 'Refund Kas',
  credit_balance: 'Deposit',
}

const { can } = useCan()

export const purchaseReturnColumns = (actions: PurchaseReturnActions): ColumnDef<PurchaseReturnListItem, any>[] => [
  plainColumn<PurchaseReturnListItem>('document_number', 'No. Retur', row => row.document_number),
  plainColumn<PurchaseReturnListItem>('return_date', 'Tanggal', row => formatDate(row.return_date)),
  plainColumn<PurchaseReturnListItem>('goods_receipt_number', 'No. Penerimaan', row => row.goods_receipt_number ?? '—'),
  plainColumn<PurchaseReturnListItem>('supplier_name', 'Supplier', row => row.supplier_name ?? '—'),
  plainColumn<PurchaseReturnListItem>('warehouse_name', 'Gudang', row => row.warehouse_name ?? '—'),
  plainColumn<PurchaseReturnListItem>('reason_code', 'Alasan', row => reasonLabels[row.reason_code] ?? row.reason_code),
  plainColumn<PurchaseReturnListItem>('settlement_method', 'Penyelesaian', row => settlementLabels[row.settlement_method] ?? row.settlement_method),
  plainColumn<PurchaseReturnListItem>('grand_total', 'Total', row => currencyFormat.format(Number(row.grand_total))),
  plainColumn<PurchaseReturnListItem>('status', 'Status', row => statuses[row.status] ?? row.status, {
    cell: ({ row }) => h(Badge, { variant: statusVariants[row.original.status] ?? 'secondary' }, () => statuses[row.original.status] ?? row.original.status),
  }),
  ...(can('purchase.return.view') || can('purchase.return.create') || can('purchase.return.update') || can('purchase.return.delete') || can('purchase.return.post') || can('purchase.return.void')
    ? [actionColumn<PurchaseReturnListItem>(PurchaseReturnTableAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onPost: actions.onPost,
        onVoid: actions.onVoid,
      })]
    : []),
]
