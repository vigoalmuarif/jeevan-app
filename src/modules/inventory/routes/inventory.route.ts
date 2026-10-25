import type { RouteRecordRaw } from 'vue-router';

// modules/inventory/routes.ts
export const inventoryRoutes: RouteRecordRaw[] = [
  {
    path: '/inventory/warehouse-stocks',
    name: 'inventory.warehouse-stocks',
    meta: { requiresAuth: true, breadcrumb: 'Stok Produk' },
    children: [
      {
        path: '',
        name: 'inventory.warehouse-stocks.index',
        meta: { requiresAuth: true, permission: 'inventory.view' },
        component: () => import('@/modules/inventory/pages/warehouse-stok/WarehouseStockPage.vue'),
      },
    ],
  },
  {
    path: '/inventory/stock-mutations',
    name: 'inventory.stock-mutations',
    meta: { requiresAuth: true, breadcrumb: 'Mutasi Stok' },
    children: [
      {
        path: '',
        name: 'inventory.stock-mutations.index',
        meta: { requiresAuth: true, permission: 'inventory.movement.view' },
        component: () => import('@/modules/inventory/pages/stok-mutation/StockMutationPage.vue'),
      },
    ],
  },
  {
    path: '/inventory/stok-adjusment',
    name: 'inventory.stok-adjusment',
    meta: { requiresAuth: true, breadcrumb: 'Stock Adjustment' },
    children: [
      {
        path: '',
        name: 'inventory.stok-adjusment.index',
        meta: { requiresAuth: true, permission: 'inventory.adjustment.view' },
        component: () => import('@/modules/inventory/pages/stok-adjusment/StockAdjustmentPage.vue'),
      },
    ],
  },
]
