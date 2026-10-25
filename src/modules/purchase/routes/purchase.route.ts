import type { RouteRecordRaw } from 'vue-router'

export const purchaseRoutes: RouteRecordRaw[] = [
  {
    path: 'purchase-invoices',
    name: 'purchase.invoices.index',
    meta: { requiresAuth: true, permission: 'purchase.invoice.view', breadcrumb: 'Faktur Pembelian' },
    component: () => import('@/modules/purchase/pages/purchase-invoice/PurchaseInvoicePage.vue'),
  },
  {
    path: 'purchase-payments',
    name: 'purchase.payments.index',
    meta: { requiresAuth: true, permission: 'purchase.payment.view', breadcrumb: 'Pembayaran Supplier' },
    component: () => import('@/modules/purchase/pages/purchase-payment/PurchasePaymentPage.vue'),
  },
  {
    path: 'goods-receipts',
    name: 'purchase.goods-receipts.index',
    meta: { requiresAuth: true, permission: 'purchase.receipt.view', breadcrumb: 'Penerimaan Barang' },
    component: () => import('@/modules/purchase/pages/goods-receipt/GoodsReceiptPage.vue'),
  },
]
