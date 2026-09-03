import { authRoutes } from "@/modules/auth/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes/dashbaord.route";
import { merchantRoutes } from "@/modules/merchant/routes/merchant.route";
import { operationalGroupRoutes } from "@/modules/operational/routes";
import { productGroupRoutes } from "@/modules/product/routes/index.route";
import { setupWizardRoutes } from "@/modules/setup-wizard/routes/setup-wizard.route";
import { createWebHistory, createRouter } from "vue-router";

const routes = [
  ...authRoutes,
  ...setupWizardRoutes,
  ...dashboardRoutes,
  ...merchantRoutes,
  ...productGroupRoutes,
  ...operationalGroupRoutes,
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
