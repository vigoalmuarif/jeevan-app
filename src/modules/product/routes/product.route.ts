import type { RouteRecordRaw } from "vue-router";

export const productRoutes: RouteRecordRaw[] = [
   {
    path: "",
    name: 'products',
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "products.index",
        meta: { requiresAuth: true, breadcrumb: 'Daftar Product', permission: 'product.view' },
        component: () => import('@/modules/product/pages/unit/UnitPage.vue'),
      },
    ],
  },
]

