import type { RouteRecordRaw } from "vue-router";

export const productBrandRoutes: RouteRecordRaw[] = [
   {
    path: "/products/brands",
    name: 'products.brands',
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "products.brands.index",
        meta: { requiresAuth: true, breadcrumb: 'Daftar Merek Produk' },
        component: () => import('@/modules/product/pages/brand/BrandPage.vue'),
      },
    ],
  },
]

