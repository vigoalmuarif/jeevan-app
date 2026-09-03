import type { RouteRecordRaw } from "vue-router";

export const merchantRoutes: RouteRecordRaw[] = [
   {
    path: "/merchant",
    name: "merchant",
    meta: { requiresAuth: true, requiresDontHaveMerchant: true },
    component: () => import('@/core/layouts/AuthLayout.vue'),
    children: [
      {
        path: "",
        name: "merchant.index",
        meta: { requiresAuth: true, requiresDontHaveMerchant: true },
        component: () => import('@/modules/merchant/pages/MerchantRegisterPage.vue'),
      },
    ],
  },
]

