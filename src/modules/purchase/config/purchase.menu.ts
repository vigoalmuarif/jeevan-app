import type { MenuNode } from '@/core/types/menu.types'

export const purchaseMenu: MenuNode = {
  key: 'purchase',
  label: 'Pembelian',
  icon: 'ShoppingCart',
  module: 'purchase',
  children: [
    {
      key: 'purchase.requests',
      label: 'Purchase Request',
      icon: 'FileText',
      routeName: 'purchase.requests.index',
      permission: 'purchase.request.view',
    },
    {
      key: 'purchase.orders',
      label: 'Purchase Order',
      icon: 'ShoppingBag01Icon',
      routeName: 'purchase.orders.index',
      permission: 'purchase.order.view',
    },
    {
      key: 'purchase.goods-receipts',
      label: 'Penerimaan Barang',
      icon: 'PackageCheck',
      routeName: 'purchase.goods-receipts.index',
      permission: 'purchase.receipt.view',
    },
    {
      key: 'purchase.returns',
      label: 'Retur Pembelian',
      icon: 'RotateCcw',
      routeName: 'purchase.returns.index',
      permission: 'purchase.return.view',
    },
    {
      key: 'purchase.invoices',
      label: 'Faktur Pembelian',
      icon: 'ReceiptText',
      routeName: 'purchase.invoices.index',
      permission: 'purchase.invoice.view',
    },
    {
      key: 'purchase.payments',
      label: 'Pembayaran Supplier',
      icon: 'CreditCard',
      routeName: 'purchase.payments.index',
      permission: 'purchase.payment.view',
    },
  ],
}
