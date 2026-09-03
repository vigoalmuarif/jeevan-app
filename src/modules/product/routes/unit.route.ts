import type { RouteRecordRaw } from "vue-router";

export const productUnitRoutes: RouteRecordRaw[] = [
   {
    path: "/products/units",
    name: "products.units",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Satuan Produk' },
    children: [
      {
        path: "",
        name: "products.units.index",
        meta: { requiresAuth: true, permission: 'product.unit.view' },
        component: () => import('@/modules/product/pages/unit/UnitPage.vue'),
      },
    ],
  },
]

