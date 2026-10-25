import { authRoutes } from "@/modules/auth/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes/dashbaord.route";
import { merchantRoutes } from "@/modules/merchant/routes/merchant.route";
import { operationalGroupRoutes } from "@/modules/operational/routes";
import { partnerGroupRoutes } from "@/modules/partner/routes";
import { productGroupRoutes } from "@/modules/product/routes/index.route";
import { setupWizardRoutes } from "@/modules/setup-wizard/routes/setup-wizard.route";
import { inventoryRoutes } from "@/modules/inventory/routes/inventory.route";
import { purchaseRoutes } from "@/modules/purchase/routes/purchase.route";
import { createWebHistory, createRouter } from "vue-router";

const routes = [
  ...authRoutes,
  ...setupWizardRoutes,
  ...dashboardRoutes,
  ...merchantRoutes,
  ...productGroupRoutes,
  ...operationalGroupRoutes,
  ...partnerGroupRoutes,
  {
    path: "/inventory",
    meta: { requiresAuth: true, module: 'inventory' },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: inventoryRoutes,
  },
  {
    path: "/purchase",
    meta: { requiresAuth: true, module: 'purchase' },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: purchaseRoutes,
  },
  {
    path: "/forbidden",
    name: "forbidden",
    component: () => import("@/components/ForbiddenPage.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/components/NotFoundPage.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
