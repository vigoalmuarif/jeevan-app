import type { RouteRecordRaw } from "vue-router";
import { supplierRoutes } from "./supplier.route";
import { customerRoutes } from "./customer.route";



export const partnerGroupRoutes: RouteRecordRaw[] = [
   {
    path: "/partner",
    meta: { requiresAuth: true, module: 'partner' },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: [
      ...supplierRoutes,
      ...customerRoutes,
    ],
  },
]

