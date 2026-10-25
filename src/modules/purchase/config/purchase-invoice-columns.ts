import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import PurchaseInvoiceTableAction from '../pages/purchase-invoice/PurchaseInvoiceTableAction.vue'
import type { PurchaseInvoiceListItem } from '../types/purchase-invoice.types'

export interface PurchaseInvoiceActions {
  onShow: (row: PurchaseInvoiceListItem) => void
  onEdit: (row: PurchaseInvoiceListItem) => void
  onDelete: (row: PurchaseInvoiceListItem) => void
  onPost: (row: PurchaseInvoiceListItem) => void
  onVoid: (row: PurchaseInvoiceListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const currencyFormat = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const documentStatuses: Record<string, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  voided: 'Dibatalkan',
}
const paymentStatuses: Record<string, string> = {
  unpaid: 'Belum dibayar',
  partial: 'Dibayar sebagian',
  paid: 'Lunas',
}
const { can } = useCan()

export const purchaseInvoiceColumns = (actions: PurchaseInvoiceActions): ColumnDef<PurchaseInvoiceListItem, any>[] => [
  plainColumn<PurchaseInvoiceListItem>('document_number', 'No. Dokumen', row => row.document_number),
  plainColumn<PurchaseInvoiceListItem>('supplier_invoice_number', 'No. Faktur Supplier', row => row.supplier_invoice_number),
  plainColumn<PurchaseInvoiceListItem>('supplier_name', 'Supplier', row => row.supplier_name),
  plainColumn<PurchaseInvoiceListItem>('invoice_date', 'Tanggal', row => dateFormat.format(new Date(row.invoice_date))),
  plainColumn<PurchaseInvoiceListItem>('due_date', 'Jatuh Tempo', row => row.due_date ? dateFormat.format(new Date(row.due_date)) : '—', {
    cell: ({ row }) => h('div', { class: 'flex flex-wrap items-center gap-2' }, [
      h('span', row.original.due_date ? dateFormat.format(new Date(row.original.due_date)) : '—'),
      row.original.is_overdue
        ? h(Badge, { variant: 'destructive' }, () => 'Terlambat')
        : null,
    ]),
  }),
  plainColumn<PurchaseInvoiceListItem>('grand_total', 'Total', row => currencyFormat.format(Number(row.grand_total))),
  plainColumn<PurchaseInvoiceListItem>('paid_amount', 'Dibayar', row => currencyFormat.format(Number(row.paid_amount))),
  plainColumn<PurchaseInvoiceListItem>('balance_amount', 'Sisa', row => currencyFormat.format(Number(row.balance_amount))),
  plainColumn<PurchaseInvoiceListItem>('payment_status', 'Status Bayar', row => paymentStatuses[row.payment_status] ?? row.payment_status, {
    cell: ({ row }) => h(Badge, {
      variant: row.original.payment_status === 'paid'
        ? 'default'
        : row.original.payment_status === 'partial'
          ? 'secondary'
          : 'outline',
    }, () => paymentStatuses[row.original.payment_status] ?? row.original.payment_status),
  }),
  plainColumn<PurchaseInvoiceListItem>('status', 'Status Dokumen', row => documentStatuses[row.status] ?? row.status, {
    cell: ({ row }) => h(Badge, {
      variant: row.original.status === 'voided'
        ? 'destructive'
        : row.original.status === 'posted'
          ? 'default'
          : 'secondary',
    }, () => documentStatuses[row.original.status] ?? row.original.status),
  }),
  ...(can('purchase.invoice.view') || can('purchase.invoice.update') || can('purchase.invoice.delete') || can('purchase.invoice.post') || can('purchase.invoice.void')
    ? [actionColumn<PurchaseInvoiceListItem>(PurchaseInvoiceTableAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onPost: actions.onPost,
        onVoid: actions.onVoid,
      })]
    : []),
]
