import type { RouteRecordRaw } from "vue-router";
import { productUnitRoutes } from "./unit.route";
import { productCategoryRoutes } from "./category.route";
import { productRoutes } from "./product.route";
import { productBrandRoutes } from "./brand.route";

export const productGroupRoutes: RouteRecordRaw[] = [
   {
    path: "/products",
    meta: { requiresAuth: true, module: 'product' },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: [
      ...productRoutes,
      ...productUnitRoutes,
      ...productCategoryRoutes,
      ...productBrandRoutes,
    ],
  },
]

