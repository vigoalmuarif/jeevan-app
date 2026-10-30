import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import PurchaseOrderTableAction from '../pages/purchase-order/PurchaseOrderTableAction.vue'
import type { PurchaseOrderListItem } from '../types/purchase-order.types'

export interface PurchaseOrderActions {
  onShow: (row: PurchaseOrderListItem) => void
  onEdit: (row: PurchaseOrderListItem) => void
  onDelete: (row: PurchaseOrderListItem) => void
  onApprove: (row: PurchaseOrderListItem) => void
  onCancel: (row: PurchaseOrderListItem) => void
  onClose: (row: PurchaseOrderListItem) => void
  onReceive: (row: PurchaseOrderListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const statuses: Record<string, string> = {
  draft: 'Draft',
  approved: 'Disetujui',
  partially_received: 'Diterima Sebagian',
  received: 'Selesai Diterima',
  closed: 'Ditutup',
  cancelled: 'Dibatalkan',
}

const statusVariants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  approved: 'default',
  partially_received: 'outline',
  received: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
}

const { can } = useCan()

export const purchaseOrderColumns = (actions: PurchaseOrderActions): ColumnDef<PurchaseOrderListItem, any>[] => [
  plainColumn<PurchaseOrderListItem>('document_number', 'No. PO', row => row.document_number),
  plainColumn<PurchaseOrderListItem>('order_date', 'Tanggal Order', row => dateFormat.format(new Date(row.order_date))),
  plainColumn<PurchaseOrderListItem>('expected_date', 'Estimasi Datang', row => row.expected_date ? dateFormat.format(new Date(row.expected_date)) : '—'),
  plainColumn<PurchaseOrderListItem>('supplier_name', 'Supplier', row => row.supplier_name ?? '—'),
  plainColumn<PurchaseOrderListItem>('warehouse_name', 'Gudang Tujuan', row => row.warehouse_name ?? '—'),
  plainColumn<PurchaseOrderListItem>('items_count', 'Item', row => String(row.items_count)),
  plainColumn<PurchaseOrderListItem>('grand_total', 'Total', row => currencyFormat.format(Number(row.grand_total))),
  plainColumn<PurchaseOrderListItem>('status', 'Status', row => statuses[row.status] ?? row.status, {
    cell: ({ row }) => h(
      Badge,
      { variant: statusVariants[row.original.status] ?? 'secondary' },
      () => statuses[row.original.status] ?? row.original.status
    ),
  }),
  ...(can('purchase.order.view') || can('purchase.order.update') || can('purchase.order.delete') || can('purchase.order.approve') || can('purchase.order.cancel') || can('purchase.order.close')
    ? [actionColumn<PurchaseOrderListItem>(PurchaseOrderTableAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onApprove: actions.onApprove,
        onCancel: actions.onCancel,
        onClose: actions.onClose,
        onReceive: actions.onReceive,
      })]
    : []),
]
