import type { RouteRecordRaw } from "vue-router";

export const supplierRoutes: RouteRecordRaw[] = [
   {
    path: "/partner/suppliers",
    name: "partner.suppliers",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Supplier' },
    children: [
      {
        path: "",
        name: "partner.suppliers.index",
        meta: { requiresAuth: true, permission: 'partner.supplier.view' },
        component: () => import('@/modules/partner/pages/supplier/SupplierPage.vue'),
      },
      {
        path: "create",
        name: "partner.suppliers.create",
        meta: { requiresAuth: true, breadcrumb: 'Tambah Supplier', permission: 'partner.supplier.create' },
        component: () => import('@/modules/partner/pages/supplier/FormSupplierPage.vue'),
      },
      {
        path: ":id/show",
        name: "partner.suppliers.show",
        meta: { requiresAuth: true, breadcrumb: 'Tambah Supplier', permission: 'partner.supplier.create' },
        component: () => import('@/modules/partner/pages/supplier/FormSupplierPage.vue'),
      },
      {
        path: ":id/edit",
        name: "partner.suppliers.edit",
        meta: { requiresAuth: true, breadcrumb: 'Ubah Supplier', permission: 'partner.supplier.update' },
        component: () => import('@/modules/partner/pages/supplier/FormSupplierPage.vue'),
      },
    ],
  },
]

