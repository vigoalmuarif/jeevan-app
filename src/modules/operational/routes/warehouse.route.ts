import type { RouteRecordRaw } from "vue-router";

export const warehouseRoutes: RouteRecordRaw[] = [
   {
    path: "/operational/warehouses",
    name: "operational.warehouses",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Gudang' },
    children: [
      {
        path: "",
        name: "operational.warehouses.index",
        meta: { requiresAuth: true, permission: 'core.warehouse.view' },
        component: () => import('@/modules/operational/pages/warehouse/WarehousePage.vue'),
      },
      {
        path: "create",
        name: "operational.warehouses.create",
        meta: { requiresAuth: true, breadcrumb: 'Tambah Gudang', permission: 'core.warehouse.create' },
        component: () => import('@/modules/operational/pages/warehouse/FormWarehousePage.vue'),
      },
      {
        path: ":id/edit",
        name: "operational.warehouses.edit",
        meta: { requiresAuth: true, breadcrumb: 'Ubah Gudang', permission: 'core.warehouse.update' },
        component: () => import('@/modules/operational/pages/warehouse/FormWarehousePage.vue'),
      },
    ],
  },
]

