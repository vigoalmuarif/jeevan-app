import type { RouteRecordRaw } from "vue-router";
import { branchRoutes } from "./branch.route";
import { warehouseRoutes } from "./warehouse.route";
import { regionalRoutes } from "./regional.route";


export const operationalGroupRoutes: RouteRecordRaw[] = [
   {
    path: "/operational",
    meta: { requiresAuth: true, module: 'operational' },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: [
      ...regionalRoutes,
      ...branchRoutes,
      ...warehouseRoutes,
    ],
  },
]

