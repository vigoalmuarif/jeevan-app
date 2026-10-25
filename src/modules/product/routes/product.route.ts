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
        component: () => import('@/modules/product/pages/product/ProductPage.vue'),
      },
      {
        path: "new",
        name: "products.create",
        meta: { requiresAuth: true, breadcrumb: 'Tambah Produk', permission: 'product.create' },
        component: () => import('@/modules/product/pages/product/ProductFormPage.vue'),
      },
      {
        path: ":productId/edit",
        name: "products.edit",
        meta: { requiresAuth: true, breadcrumb: 'Ubah Produk', permission: 'product.update' },
        component: () => import('@/modules/product/pages/product/ProductFormPage.vue'),
      },
    ],
  },
]

