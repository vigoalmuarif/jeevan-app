import type { MenuNode } from '@/core/types/menu.types'

export const purchaseMenu: MenuNode = {
  key: 'purchase',
  label: 'Pembelian',
  icon: 'ShoppingCart',
  module: 'purchase',
  children: [
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
    {
      key: 'purchase.goods-receipts',
      label: 'Penerimaan Barang',
      icon: 'PackageCheck',
      routeName: 'purchase.goods-receipts.index',
      permission: 'purchase.receipt.view',
    },
  ],
}
