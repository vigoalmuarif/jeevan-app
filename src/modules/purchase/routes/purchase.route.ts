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
    path: 'purchase-orders',
    name: 'purchase.orders.index',
    meta: { requiresAuth: true, permission: 'purchase.order.view', breadcrumb: 'Purchase Order' },
    component: () => import('@/modules/purchase/pages/purchase-order/PurchaseOrderPage.vue'),
  },
  {
    path: 'purchase-requests',
    name: 'purchase.requests.index',
    meta: { requiresAuth: true, permission: 'purchase.request.view', breadcrumb: 'Purchase Request' },
    component: () => import('@/modules/purchase/pages/purchase-request/PurchaseRequestPage.vue'),
  },
  {
    path: 'goods-receipts',
    name: 'purchase.goods-receipts.index',
    meta: { requiresAuth: true, permission: 'purchase.receipt.view', breadcrumb: 'Penerimaan Barang' },
    component: () => import('@/modules/purchase/pages/goods-receipt/GoodsReceiptPage.vue'),
  },
  {
    path: 'purchase-returns',
    name: 'purchase.returns.index',
    meta: { requiresAuth: true, permission: 'purchase.return.view', breadcrumb: 'Retur Pembelian' },
    component: () => import('@/modules/purchase/pages/purchase-return/PurchaseReturnPage.vue'),
  },
]
