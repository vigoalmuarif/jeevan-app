import type { RouteRecordRaw } from "vue-router";

export const customerRoutes: RouteRecordRaw[] = [
  {
    path: "/partner/customers",
    name: "partner.customers",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Customer' },
    children: [
      {
        path: "",
        name: "partner.customers.index",
        meta: { requiresAuth: true, permission: 'partner.customer.view' },
        component: () => import('@/modules/partner/pages/customer/CustomerPage.vue'),
      },
    ],
  },
]

