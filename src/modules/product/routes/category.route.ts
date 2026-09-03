import type { RouteRecordRaw } from "vue-router";

export const productCategoryRoutes: RouteRecordRaw[] = [
   {
    path: "/products/categories",
    name: "products.categories",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Kategori Produk' },
    children: [
      {
        path: "",
        name: "products.categories.index",
        meta: { requiresAuth: true },
        component: () => import('@/modules/product/pages/category/CategoryPage.vue'),
      },
    ],
  },
]

